export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"
import * as XLSX from "xlsx"
import { getDataLibroAuxiliares } from "../getData"

function formatearNumero(n: number): string {
  const s = Number(n).toFixed(2)
  const [entera, decimal] = s.split(".")
  return `${entera.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${decimal}`
}

export async function GET(request: NextRequest) {
  try {
    const permiso = await requirePermiso("contabilidad", "ver")
    if (permiso instanceof Response) return permiso

    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const moneda = searchParams.get("moneda") || "BOB"
    const monedaSufijo = moneda === "USD" ? "$" : "Bs"

    const { data, tipo_reporte } = await getDataLibroAuxiliares(supabase, searchParams)

    const isEmpty =
      tipo_reporte === "Resumen"
        ? !Array.isArray(data) || data.length === 0
        : !data?.auxiliares?.length
    if (isEmpty) {
      return NextResponse.json(
        { error: "No hay datos para exportar con los filtros seleccionados" },
        { status: 400 }
      )
    }

    const wb = XLSX.utils.book_new()

    if (tipo_reporte === "Resumen") {
      const formatAux = (r: any) =>
        r.auxiliar_codigo != null ? `${r.auxiliar_codigo} - ${r.auxiliar_nombre ?? ""}` : (r.auxiliar_nombre ?? "-")
      const headers = [
        "Auxiliar",
        "Cuenta",
        "Descripción",
        "Saldo Inicial",
        `Total Debe (${monedaSufijo})`,
        `Total Haber (${monedaSufijo})`,
        `Saldo Final (${monedaSufijo})`,
      ]
      const rows = (data as any[]).map((r: any) => [
        formatAux(r),
        r.cuenta,
        r.descripcion_cuenta,
        r.saldo_inicial != null ? formatearNumero(r.saldo_inicial) : "",
        formatearNumero(r.total_debe ?? 0),
        formatearNumero(r.total_haber ?? 0),
        formatearNumero(r.saldo_final ?? 0),
      ])
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
      XLSX.utils.book_append_sheet(wb, ws, "Libro Auxiliares Resumen")
    } else {
      const headers = [
        "Auxiliar",
        "Cuenta",
        "Fecha",
        "Nº Comprobante",
        "Tipo comprobante",
        "Glosa / Concepto",
        `Debe (${monedaSufijo})`,
        `Haber (${monedaSufijo})`,
        `Saldo (${monedaSufijo})`,
      ]
      const detalleData = data as { auxiliares: any[]; total_general?: { total_debe: number; total_haber: number; total_saldo: number } }
      const rows: any[][] = []
      for (const aux of detalleData.auxiliares) {
        const auxLabel = aux.auxiliar_codigo != null ? `${aux.auxiliar_codigo} - ${aux.auxiliar_nombre ?? ""}` : (aux.auxiliar_nombre ?? "-")
        for (const cta of aux.cuentas) {
          for (const mov of cta.movimientos) {
            const esSaldoInicial = !!(mov as any).es_saldo_inicial
            rows.push([
              auxLabel,
              cta.cuenta,
              mov.fecha ? new Date(mov.fecha).toLocaleDateString("es-ES") : "",
              esSaldoInicial ? "" : (mov.numero_comprobante ?? ""),
              esSaldoInicial ? "" : (mov.tipo_comprobante ?? ""),
              mov.glosa ?? "",
              esSaldoInicial ? "0,00" : (mov.debe !== 0 ? formatearNumero(mov.debe) : ""),
              esSaldoInicial ? "0,00" : (mov.haber !== 0 ? formatearNumero(mov.haber) : ""),
              formatearNumero(mov.saldo ?? 0),
            ])
          }
          rows.push([
            auxLabel,
            cta.cuenta,
            "",
            "",
            "",
            "TOTALES CUENTA",
            formatearNumero(cta.total_debe ?? 0),
            formatearNumero(cta.total_haber ?? 0),
            formatearNumero(cta.saldo_final ?? 0),
          ])
        }
      }
      if (detalleData.total_general) {
        rows.push([
          "",
          "",
          "",
          "",
          "",
          "TOTAL GENERAL",
          formatearNumero(detalleData.total_general.total_debe ?? 0),
          formatearNumero(detalleData.total_general.total_haber ?? 0),
          formatearNumero(detalleData.total_general.total_saldo ?? 0),
        ])
      }
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
      XLSX.utils.book_append_sheet(wb, ws, "Libro Auxiliares Detalle")
    }

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
    const hoy = new Date()
    const d = String(hoy.getDate()).padStart(2, "0")
    const m = String(hoy.getMonth() + 1).padStart(2, "0")
    const y = hoy.getFullYear()
    const nombreArchivo = `libro_auxiliares_${d}-${m}-${y}.xlsx`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
      },
    })
  } catch (error: any) {
    console.error("Error in GET /api/contabilidad/informes/libro-auxiliares/excel:", error)
    return NextResponse.json(
      { error: "Error al generar el Excel", details: error?.message },
      { status: 500 }
    )
  }
}
