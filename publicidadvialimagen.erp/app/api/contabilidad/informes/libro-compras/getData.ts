/**
 * Libro de Compras I.V.A. - Lógica del reporte tributario.
 * JOIN libro_compras (lc) + comprobantes (c). Filtros por empresa_uuid, sucursal_id, mes/año, tipo_reporte.
 * Campos calculados: subtotal, base_credito_fiscal; campos SIAT en cero por defecto.
 */
export interface LibroComprasFila {
  fecha: string
  nit: string
  proveedor: string
  nro_factura: string
  nro_autorizacion: string
  codigo_control: string
  importe_total: number
  importe_no_sujeto_cf: number
  subtotal: number
  descuentos: number
  base_credito_fiscal: number
  credito_fiscal: number
  importe_ice: number
  iehd: number
  ipj: number
  tasas: number
  importes_exentos: number
  tasa_cero: number
}

export interface LibroComprasTotales {
  importe_total: number
  importe_no_sujeto_cf: number
  subtotal: number
  descuentos: number
  base_credito_fiscal: number
  credito_fiscal: number
  importe_ice: number
  iehd: number
  ipj: number
  tasas: number
  importes_exentos: number
  tasa_cero: number
}

export interface LibroComprasData {
  data: LibroComprasFila[]
  totales: LibroComprasTotales
}

function firstDayOfMonth(anio: number, mes: number): string {
  const y = Math.max(1, anio)
  const m = Math.max(1, Math.min(12, mes))
  const d = String(1).padStart(2, "0")
  const monthStr = String(m).padStart(2, "0")
  return `${y}-${monthStr}-${d}`
}

function lastDayOfMonth(anio: number, mes: number): string {
  const y = Math.max(1, anio)
  const m = Math.max(1, Math.min(12, mes))
  const last = new Date(y, m, 0).getDate()
  const monthStr = String(m).padStart(2, "0")
  const d = String(last).padStart(2, "0")
  return `${y}-${monthStr}-${d}`
}

export async function getDataLibroCompras(
  supabase: any,
  params: {
    empresa_id?: string
    sucursal_id?: string
    periodo_mes: string
    periodo_anio: string
    tipo_reporte?: string
  }
): Promise<LibroComprasData> {
  const {
    empresa_id = "",
    sucursal_id = "",
    periodo_mes,
    periodo_anio,
    tipo_reporte = "impuestos",
  } = params

  const anio = parseInt(periodo_anio, 10) || new Date().getFullYear()
  const mes = parseInt(periodo_mes, 10) || new Date().getMonth() + 1
  const desde_fecha = firstDayOfMonth(anio, mes)
  const a_fecha = lastDayOfMonth(anio, mes)

  const vacio: LibroComprasData = {
    data: [],
    totales: {
      importe_total: 0,
      importe_no_sujeto_cf: 0,
      subtotal: 0,
      descuentos: 0,
      base_credito_fiscal: 0,
      credito_fiscal: 0,
      importe_ice: 0,
      iehd: 0,
      ipj: 0,
      tasas: 0,
      importes_exentos: 0,
      tasa_cero: 0,
    },
  }

  // 1) Obtener libro_compras en el rango de fechas, con estado según tipo_reporte
  let lcQuery = supabase
    .from("libro_compras")
    .select("id, comprobante_id, fecha, nit, proveedor_nombre, nro_documento, nro_autorizacion, codigo_control, monto, importe_no_sujeto_cf, descuentos_rebajas, credito_fiscal")
    .gte("fecha", desde_fecha)
    .lte("fecha", a_fecha)

  const tipoNorm = String(tipo_reporte).toLowerCase()
  if (tipoNorm === "impuestos") {
    lcQuery = lcQuery.eq("estado", "APROBADO")
  }

  const { data: lcRows, error: errLc } = await lcQuery.order("fecha", { ascending: true }).order("id", { ascending: true })

  if (errLc || !lcRows?.length) return vacio

  const comprobanteIds = [...new Set((lcRows as any[]).map((r: any) => r.comprobante_id).filter(Boolean))]
  const compMap: Record<number, { empresa_uuid: string | null; sucursal_id: string | null }> = {}
  if (comprobanteIds.length > 0) {
    const { data: comprobantes, error: errComp } = await supabase
      .from("comprobantes")
      .select("id, empresa_uuid, sucursal_id")
      .in("id", comprobanteIds)
    if (!errComp && comprobantes?.length) {
      comprobantes.forEach((c: any) => {
        compMap[c.id] = {
          empresa_uuid: c.empresa_uuid ?? null,
          sucursal_id: c.sucursal_id ?? null,
        }
      })
    }
  }

  const empresaUuid = empresa_id && empresa_id !== "todos" ? empresa_id.trim() : null
  const sucursalId = sucursal_id && sucursal_id !== "todos" ? sucursal_id.trim() : null

  const resultados: LibroComprasFila[] = []
  const totales: LibroComprasTotales = {
    importe_total: 0,
    importe_no_sujeto_cf: 0,
    subtotal: 0,
    descuentos: 0,
    base_credito_fiscal: 0,
    credito_fiscal: 0,
    importe_ice: 0,
    iehd: 0,
    ipj: 0,
    tasas: 0,
    importes_exentos: 0,
    tasa_cero: 0,
  }

  for (const lc of lcRows as any[]) {
    const comp = lc.comprobante_id != null ? compMap[lc.comprobante_id] : undefined
    if (empresaUuid) {
      const matchEmpresa = comp == null || comp.empresa_uuid == null || comp.empresa_uuid === empresaUuid
      if (!matchEmpresa) continue
    }
    if (sucursalId) {
      const matchSucursal = comp == null || comp.sucursal_id == null || comp.sucursal_id === sucursalId
      if (!matchSucursal) continue
    }

    const monto = Number(lc.monto ?? 0)
    const importeNoSujetoCf = Number(lc.importe_no_sujeto_cf ?? 0)
    const descuentosRebajas = Number(lc.descuentos_rebajas ?? 0)
    const subtotal = Math.round((monto - importeNoSujetoCf) * 100) / 100
    const baseCreditoFiscal = Math.round((subtotal - descuentosRebajas) * 100) / 100
    const creditoFiscal = Number(lc.credito_fiscal ?? 0)

    const fila: LibroComprasFila = {
      fecha: lc.fecha ?? "",
      nit: lc.nit ?? "",
      proveedor: lc.proveedor_nombre ?? "",
      nro_factura: lc.nro_documento ?? "",
      nro_autorizacion: lc.nro_autorizacion ?? "",
      codigo_control: lc.codigo_control ?? "",
      importe_total: monto,
      importe_no_sujeto_cf: importeNoSujetoCf,
      subtotal,
      descuentos: descuentosRebajas,
      base_credito_fiscal: baseCreditoFiscal,
      credito_fiscal: creditoFiscal,
      importe_ice: 0,
      iehd: 0,
      ipj: 0,
      tasas: 0,
      importes_exentos: 0,
      tasa_cero: 0,
    }
    resultados.push(fila)

    totales.importe_total += monto
    totales.importe_no_sujeto_cf += importeNoSujetoCf
    totales.subtotal += subtotal
    totales.descuentos += descuentosRebajas
    totales.base_credito_fiscal += baseCreditoFiscal
    totales.credito_fiscal += creditoFiscal
  }

  totales.importe_total = Math.round(totales.importe_total * 100) / 100
  totales.importe_no_sujeto_cf = Math.round(totales.importe_no_sujeto_cf * 100) / 100
  totales.subtotal = Math.round(totales.subtotal * 100) / 100
  totales.descuentos = Math.round(totales.descuentos * 100) / 100
  totales.base_credito_fiscal = Math.round(totales.base_credito_fiscal * 100) / 100
  totales.credito_fiscal = Math.round(totales.credito_fiscal * 100) / 100

  return { data: resultados, totales }
}
