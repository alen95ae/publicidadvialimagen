export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"
import * as XLSX from "xlsx"
import { formatDateBolivia } from "@/lib/utils"
import { getDataEstadoAuxiliares } from "../getData"

function formatearNumero(n: number): string {
  const s = Number(n).toFixed(2)
  const [entera, decimal] = s.split(".")
  return `${entera.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${decimal}`
}

export async function GET(request: NextRequest) {
  try {
    const permiso = await requirePermiso("contabilidad", "ver")
    if (permiso instanceof Response) return permiso

    const { searchParams } = new URL(request.url)
    const fecha_inicial = searchParams.get("fecha_inicial") || ""
    const fecha_final = searchParams.get("fecha_final") || ""
    if (!fecha_inicial || !fecha_final) {
      return NextResponse.json(
        { error: "Los parámetros fecha_inicial y fecha_final son obligatorios" },
        { status: 400 }
      )
    }

    const moneda = searchParams.get("moneda") || "BOB"
    const monedaSufijo = moneda === "USD" ? "$" : "Bs"

    const supabase = getSupabaseAdmin()
    const data = await getDataEstadoAuxiliares(supabase, {
      empresa_id: searchParams.get("empresa_id") || "",
      sucursal_id: searchParams.get("sucursal_id") || "",
      clasificador: searchParams.get("clasificador") || "",
      desde_cuenta: searchParams.get("desde_cuenta") || "",
      hasta_cuenta: searchParams.get("hasta_cuenta") || "",
      desde_auxiliar: searchParams.get("desde_auxiliar") || "",
      hasta_auxiliar: searchParams.get("hasta_auxiliar") || "",
      fecha_inicial,
      fecha_final,
      estado: searchParams.get("estado") || "Aprobado",
      moneda,
    })

    if (!data.resultados?.length) {
      return NextResponse.json(
        { error: "No hay datos para exportar con los filtros seleccionados" },
        { status: 400 }
      )
    }

    const wb = XLSX.utils.book_new()
    const headers = [
      "Auxiliar",
      "Cuenta",
      "Descripción",
      `Saldo Anterior (${monedaSufijo})`,
      `Debe (${monedaSufijo})`,
      `Haber (${monedaSufijo})`,
      `Saldo Actual (${monedaSufijo})`,
    ]

    const sheetData: (string | number)[][] = []
    sheetData.push(["ESTADO DE AUXILIARES"])
    sheetData.push([
      `Período: ${formatDateBolivia(fecha_inicial)} al ${formatDateBolivia(fecha_final)}`,
      "",
      "",
      "",
      "",
      "",
      "",
    ])
    sheetData.push(["Moneda:", moneda === "USD" ? "USD" : "Bs", "", "", "", "", ""])
    sheetData.push([])
    sheetData.push(headers)

    for (const r of data.resultados) {
      const auxLabel = r.auxiliar_codigo ?? r.auxiliar_nombre
      sheetData.push([
        auxLabel,
        r.cuenta_codigo,
        r.cuenta_descripcion,
        formatearNumero(r.saldo_anterior),
        formatearNumero(r.total_debe),
        formatearNumero(r.total_haber),
        formatearNumero(r.saldo_actual),
      ])
    }

    const totalSaldoAnt = data.resultados.reduce((s, r) => s + r.saldo_anterior, 0)
    const totalDebe = data.resultados.reduce((s, r) => s + r.total_debe, 0)
    const totalHaber = data.resultados.reduce((s, r) => s + r.total_haber, 0)
    const totalSaldoAct = data.resultados.reduce((s, r) => s + r.saldo_actual, 0)
    sheetData.push([
      "",
      "",
      "TOTALES",
      formatearNumero(totalSaldoAnt),
      formatearNumero(totalDebe),
      formatearNumero(totalHaber),
      formatearNumero(totalSaldoAct),
    ])

    const ws = XLSX.utils.aoa_to_sheet(sheetData)
    XLSX.utils.book_append_sheet(wb, ws, "Estado Auxiliares")

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
    const hoy = new Date()
    const d = String(hoy.getDate()).padStart(2, "0")
    const m = String(hoy.getMonth() + 1).padStart(2, "0")
    const y = hoy.getFullYear()
    const nombreArchivo = `estado_auxiliares_${d}-${m}-${y}.xlsx`

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
      "Error in GET /api/contabilidad/informes/estado-auxiliares/excel:",
      error
    )
    return NextResponse.json(
      { error: "Error al generar el Excel", details: error?.message },
      { status: 500 }
    )
  }
}
