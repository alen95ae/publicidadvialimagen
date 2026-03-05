/**
 * Libro de Ventas I.V.A. - Lógica del reporte tributario.
 * facturas_manuales (fm) LEFT JOIN comprobantes (c) vía comprobante_id.
 * Filtros: fecha (mes/año), empresa_uuid y sucursal_id (con OR NULL para datos heredados).
 * Lógica Bolivia: ANULADA → importes 0, estado 'A'; válida → estado 'V', débito fiscal 13%.
 */
export interface LibroVentasFila {
  fecha: string
  nro_factura: string
  nro_autorizacion: string
  estado_factura: string
  nit: string
  cliente: string
  importe_total: number
  importe_ice: number
  iehd: number
  ipj: number
  tasas: number
  exportaciones_exentos: number
  tasa_cero: number
  subtotal: number
  descuentos: number
  base_debito_fiscal: number
  debito_fiscal: number
}

export interface LibroVentasTotales {
  importe_total: number
  importe_ice: number
  iehd: number
  ipj: number
  tasas: number
  exportaciones_exentos: number
  tasa_cero: number
  subtotal: number
  descuentos: number
  base_debito_fiscal: number
  debito_fiscal: number
}

export interface LibroVentasData {
  data: LibroVentasFila[]
  totales: LibroVentasTotales
}

function firstDayOfMonth(anio: number, mes: number): string {
  const y = Math.max(1, anio)
  const m = Math.max(1, Math.min(12, mes))
  const monthStr = String(m).padStart(2, "0")
  return `${y}-${monthStr}-01`
}

function lastDayOfMonth(anio: number, mes: number): string {
  const y = Math.max(1, anio)
  const m = Math.max(1, Math.min(12, mes))
  const last = new Date(y, m, 0).getDate()
  const monthStr = String(m).padStart(2, "0")
  const d = String(last).padStart(2, "0")
  return `${y}-${monthStr}-${d}`
}

/** Extrae solo dígitos de fm.codigo (ej. "FAC-0001" → "0001") o devuelve el codigo tal cual si no hay dígitos. */
function extraerNroFactura(codigo: string | null | undefined): string {
  if (codigo == null) return ""
  const s = String(codigo).trim()
  const digitos = s.replace(/\D/g, "")
  return digitos !== "" ? digitos : s
}

const TASA_IVA = 0.13

export async function getDataLibroVentas(
  supabase: any,
  params: {
    empresa_id?: string
    sucursal_id?: string
    periodo_mes: string
    periodo_anio: string
  }
): Promise<LibroVentasData> {
  const {
    empresa_id = "",
    sucursal_id = "",
    periodo_mes,
    periodo_anio,
  } = params

  const anio = parseInt(periodo_anio, 10) || new Date().getFullYear()
  const mes = parseInt(periodo_mes, 10) || new Date().getMonth() + 1
  const desde_fecha = firstDayOfMonth(anio, mes)
  const a_fecha = lastDayOfMonth(anio, mes)

  const vacio: LibroVentasData = {
    data: [],
    totales: {
      importe_total: 0,
      importe_ice: 0,
      iehd: 0,
      ipj: 0,
      tasas: 0,
      exportaciones_exentos: 0,
      tasa_cero: 0,
      subtotal: 0,
      descuentos: 0,
      base_debito_fiscal: 0,
      debito_fiscal: 0,
    },
  }

  // 1) Obtener facturas_manuales en el rango de fechas
  const fmSelect = "id, comprobante_id, fecha, codigo, codigo_autorizacion, estado, cliente_nit, cliente_nombre, total, subtotal, descuento, importe_base_cf"
  let fmQuery = supabase
    .from("facturas_manuales")
    .select(fmSelect)
    .gte("fecha", desde_fecha)
    .lte("fecha", a_fecha)
    .order("fecha", { ascending: true })
    .order("id", { ascending: true })

  const { data: fmRows, error: errFm } = await fmQuery

  if (errFm) {
    console.error("[libro-ventas] Error facturas_manuales:", errFm)
    return vacio
  }
  if (!fmRows?.length) return vacio

  // 2) LEFT JOIN con comprobantes: obtener comprobantes solo para los que tienen comprobante_id
  const comprobanteIds = [...new Set((fmRows as any[]).map((r: any) => r.comprobante_id).filter(Boolean))]
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

  const empresaUuid = empresa_id && empresa_id !== "todos" ? String(empresa_id).trim() : null
  const sucursalId = sucursal_id && sucursal_id !== "todos" ? String(sucursal_id).trim() : null

  const resultados: LibroVentasFila[] = []
  const totales: LibroVentasTotales = {
    importe_total: 0,
    importe_ice: 0,
    iehd: 0,
    ipj: 0,
    tasas: 0,
    exportaciones_exentos: 0,
    tasa_cero: 0,
    subtotal: 0,
    descuentos: 0,
    base_debito_fiscal: 0,
    debito_fiscal: 0,
  }

  for (const fm of fmRows as any[]) {
    const comp = fm.comprobante_id != null ? compMap[fm.comprobante_id] : undefined
    if (empresaUuid) {
      const matchEmpresa = comp == null || comp.empresa_uuid == null || comp.empresa_uuid === empresaUuid
      if (!matchEmpresa) continue
    }
    if (sucursalId) {
      const matchSucursal = comp == null || comp.sucursal_id == null || comp.sucursal_id === sucursalId
      if (!matchSucursal) continue
    }

    const esAnulada = String(fm.estado || "").toUpperCase() === "ANULADA"

    if (esAnulada) {
      resultados.push({
        fecha: fm.fecha ?? "",
        nro_factura: extraerNroFactura(fm.codigo),
        nro_autorizacion: fm.codigo_autorizacion ?? "",
        estado_factura: "A",
        nit: "0",
        cliente: "ANULADA",
        importe_total: 0,
        importe_ice: 0,
        iehd: 0,
        ipj: 0,
        tasas: 0,
        exportaciones_exentos: 0,
        tasa_cero: 0,
        subtotal: 0,
        descuentos: 0,
        base_debito_fiscal: 0,
        debito_fiscal: 0,
      })
      continue
    }

    const importeTotal = Number(fm.total ?? 0)
    const descuentos = Number(fm.descuento ?? 0)
    const subtotal = Number(fm.subtotal ?? importeTotal)
    const importeBaseCf = Number(fm.importe_base_cf ?? 0)
    const baseDebitoFiscal =
      importeBaseCf > 0
        ? Math.round(importeBaseCf * 100) / 100
        : Math.round((subtotal - descuentos) * 100) / 100
    const debitoFiscal = Math.round(baseDebitoFiscal * TASA_IVA * 100) / 100

    resultados.push({
      fecha: fm.fecha ?? "",
      nro_factura: extraerNroFactura(fm.codigo),
      nro_autorizacion: fm.codigo_autorizacion ?? "",
      estado_factura: "V",
      nit: (fm.cliente_nit ?? "").trim() || "",
      cliente: (fm.cliente_nombre ?? "").trim() || "",
      importe_total: Math.round(importeTotal * 100) / 100,
      importe_ice: 0,
      iehd: 0,
      ipj: 0,
      tasas: 0,
      exportaciones_exentos: 0,
      tasa_cero: 0,
      subtotal: Math.round(subtotal * 100) / 100,
      descuentos: Math.round(descuentos * 100) / 100,
      base_debito_fiscal: baseDebitoFiscal,
      debito_fiscal: debitoFiscal,
    })

    totales.importe_total += Math.round(importeTotal * 100) / 100
    totales.importe_ice += 0
    totales.iehd += 0
    totales.ipj += 0
    totales.tasas += 0
    totales.exportaciones_exentos += 0
    totales.tasa_cero += 0
    totales.subtotal += Math.round(subtotal * 100) / 100
    totales.descuentos += Math.round(descuentos * 100) / 100
    totales.base_debito_fiscal += baseDebitoFiscal
    totales.debito_fiscal += debitoFiscal
  }

  totales.importe_total = Math.round(totales.importe_total * 100) / 100
  totales.subtotal = Math.round(totales.subtotal * 100) / 100
  totales.descuentos = Math.round(totales.descuentos * 100) / 100
  totales.base_debito_fiscal = Math.round(totales.base_debito_fiscal * 100) / 100
  totales.debito_fiscal = Math.round(totales.debito_fiscal * 100) / 100

  return { data: resultados, totales }
}
