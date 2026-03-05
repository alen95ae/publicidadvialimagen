export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"
import * as XLSX from "xlsx"
import { getDataReporteFacturacion } from "../getData"
import type { ReporteFacturacionFila, ReporteFacturacionTotales } from "../getData"

function formatearNumero(n: number): string {
  const s = Number(n).toFixed(2)
  const [entera, decimal] = s.split(".")
  return `${entera.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${decimal}`
}

function formatFecha(fecha: string): string {
  if (!fecha) return ""
  const d = new Date(fecha + "T00:00:00")
  if (Number.isNaN(d.getTime())) return fecha
  const day = String(d.getDate()).padStart(2, "0")
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

export async function GET(request: NextRequest) {
  try {
    const permiso = await requirePermiso("contabilidad", "ver")
    if (permiso instanceof Response) return permiso

    const { searchParams } = new URL(request.url)
    const desde_fecha = searchParams.get("desde_fecha") || ""
    const hasta_fecha = searchParams.get("hasta_fecha") || ""
    if (!desde_fecha || !hasta_fecha) {
      return NextResponse.json(
        { error: "Los parámetros desde_fecha y hasta_fecha son obligatorios" },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()
    const result = await getDataReporteFacturacion(supabase, {
      empresa_id: searchParams.get("empresa_id") || "",
      sucursal_id: searchParams.get("sucursal_id") || "",
      desde_fecha,
      hasta_fecha,
      tipo_documento: searchParams.get("tipo_documento") || "TODAS",
    })

    if (!result.data?.length) {
      return NextResponse.json(
        { error: "No hay datos para exportar con los filtros seleccionados" },
        { status: 400 }
      )
    }

    const headers = [
      "Nº Documento",
      "Fecha",
      "Cliente",
      "Tipo Documento",
      "Subtotal",
      "IVA",
      "Total",
      "Estado",
    ]

    const sheetData: (string | number)[][] = []
    sheetData.push(["REPORTE DE FACTURACIÓN"])
    sheetData.push([`Desde: ${formatFecha(desde_fecha)} - Hasta: ${formatFecha(hasta_fecha)}`, "", "", "", "", "", "", ""])
    sheetData.push([])
    sheetData.push(headers)

    result.data.forEach((r: ReporteFacturacionFila) => {
      sheetData.push([
        r.nro_documento,
        formatFecha(r.fecha),
        r.cliente,
        r.tipo_documento,
        formatearNumero(r.subtotal),
        formatearNumero(r.iva),
        formatearNumero(r.total),
        r.estado,
      ])
    })

    const t: ReporteFacturacionTotales = result.totales
    sheetData.push([
      "",
      "",
      "",
      "TOTALES",
      formatearNumero(t.subtotal),
      formatearNumero(t.iva),
      formatearNumero(t.total),
      "",
    ])

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(sheetData)
    XLSX.utils.book_append_sheet(wb, ws, "Facturación")

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
    const hoy = new Date()
    const d = String(hoy.getDate()).padStart(2, "0")
    const m = String(hoy.getMonth() + 1).padStart(2, "0")
    const y = hoy.getFullYear()
    const nombreArchivo = `reporte_facturacion_${d}-${m}-${y}.xlsx`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
      },
    })
  } catch (error: any) {
    console.error(
      "Error in GET /api/contabilidad/informes/reporte-facturacion/excel:",
      error
    )
    return NextResponse.json(
      { error: "Error al generar el Excel", details: error?.message },
      { status: 500 }
    )
  }
}
