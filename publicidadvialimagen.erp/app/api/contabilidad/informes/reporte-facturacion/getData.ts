/**
 * Reporte de Facturación - facturas_manuales (fm) LEFT JOIN comprobantes (c).
 * Filtros: desde_fecha, hasta_fecha, empresa_uuid, sucursal_id (OR NULL para datos heredados).
 * tipo_documento NOTAS_REMISION → vacío; TODAS | FACTURAS_MANUALES → consulta fm.
 */
export interface ReporteFacturacionFila {
  nro_documento: string
  fecha: string
  cliente: string
  nit: string
  tipo_documento: string
  subtotal: number
  iva: number
  total: number
  estado: string
}

export interface ReporteFacturacionTotales {
  subtotal: number
  iva: number
  total: number
}

export interface ReporteFacturacionData {
  data: ReporteFacturacionFila[]
  totales: ReporteFacturacionTotales
}

function mapEstado(estado: string | null | undefined): string {
  const e = String(estado || "").toUpperCase()
  if (e === "ANULADA") return "Anulada"
  if (e === "BORRADOR") return "Pendiente"
  return "Aprobada"
}

export async function getDataReporteFacturacion(
  supabase: any,
  params: {
    empresa_id?: string
    sucursal_id?: string
    desde_fecha: string
    hasta_fecha: string
    tipo_documento: string
  }
): Promise<ReporteFacturacionData> {
  const {
    empresa_id = "",
    sucursal_id = "",
    desde_fecha,
    hasta_fecha,
    tipo_documento,
  } = params

  const vacio: ReporteFacturacionData = {
    data: [],
    totales: { subtotal: 0, iva: 0, total: 0 },
  }

  const tipoNorm = String(tipo_documento || "").toUpperCase()
  if (tipoNorm === "NOTAS_REMISION") return vacio

  const fmSelect = "id, comprobante_id, fecha, codigo, estado, cliente_nit, cliente_nombre, subtotal, total"
  let fmQuery = supabase
    .from("facturas_manuales")
    .select(fmSelect)
    .gte("fecha", desde_fecha)
    .lte("fecha", hasta_fecha)
    .order("fecha", { ascending: true })
    .order("id", { ascending: true })

  const { data: fmRows, error: errFm } = await fmQuery

  if (errFm) {
    console.error("[reporte-facturacion] Error facturas_manuales:", errFm)
    return vacio
  }
  if (!fmRows?.length) return vacio

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

  const resultados: ReporteFacturacionFila[] = []
  const totales: ReporteFacturacionTotales = { subtotal: 0, iva: 0, total: 0 }

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

    const total = Number(fm.total ?? 0)
    const subtotal = Number(fm.subtotal ?? total)
    const iva = Math.round((total - subtotal) * 100) / 100
    const esAnulada = String(fm.estado || "").toUpperCase() === "ANULADA"

    resultados.push({
      nro_documento: (fm.codigo ?? "").trim() || "",
      fecha: fm.fecha ?? "",
      cliente: (fm.cliente_nombre ?? "").trim() || "",
      nit: (fm.cliente_nit ?? "").trim() || "",
      tipo_documento: "Factura Manual",
      subtotal: Math.round(subtotal * 100) / 100,
      iva,
      total: Math.round(total * 100) / 100,
      estado: mapEstado(fm.estado),
    })

    if (!esAnulada) {
      totales.subtotal += Math.round(subtotal * 100) / 100
      totales.iva += iva
      totales.total += Math.round(total * 100) / 100
    }
  }

  totales.subtotal = Math.round(totales.subtotal * 100) / 100
  totales.iva = Math.round(totales.iva * 100) / 100
  totales.total = Math.round(totales.total * 100) / 100

  return { data: resultados, totales }
}
