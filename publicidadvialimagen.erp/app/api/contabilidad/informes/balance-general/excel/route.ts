export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"
import * as XLSX from "xlsx"
import { getDataBalanceGeneral } from "../getData"

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
    const a_fecha = searchParams.get("a_fecha") || ""
    if (!a_fecha) {
      return NextResponse.json(
        { error: "El parámetro a_fecha es obligatorio" },
        { status: 400 }
      )
    }

    const moneda = searchParams.get("moneda") || "BOB"
    const monedaSufijo = moneda === "USD" ? "$" : "Bs"

    const supabase = getSupabaseAdmin()
    const data = await getDataBalanceGeneral(supabase, {
      a_fecha,
      empresa_id: searchParams.get("empresa_id") || "",
      sucursal_id: searchParams.get("sucursal_id") || "",
      moneda,
      estado: searchParams.get("estado") || "Aprobado",
    })

    const wb = XLSX.utils.book_new()
    const headers = ["Cuenta", "Descripción", `Saldo (${monedaSufijo})`]

    const sheetData: (string | number)[][] = []
    sheetData.push(["BALANCE GENERAL"])
    sheetData.push([`A fecha: ${new Date(a_fecha).toLocaleDateString("es-ES")}`, "", ""])
    sheetData.push(["Moneda:", moneda === "USD" ? "USD" : "Bs", ""])
    sheetData.push([])

    sheetData.push(["ACTIVO"])
    sheetData.push(headers)
    data.activo.forEach((r) => sheetData.push([r.cuenta, r.descripcion, formatearNumero(r.saldo)]))
    sheetData.push(["", "Total Activo", formatearNumero(data.totales.total_activo)])
    sheetData.push([])

    sheetData.push(["PASIVO"])
    sheetData.push(headers)
    data.pasivo.forEach((r) => sheetData.push([r.cuenta, r.descripcion, formatearNumero(r.saldo)]))
    sheetData.push(["", "Total Pasivo", formatearNumero(data.totales.total_pasivo)])
    sheetData.push([])

    sheetData.push(["PATRIMONIO"])
    sheetData.push(headers)
    data.patrimonio.forEach((r) =>
      sheetData.push([r.cuenta, r.descripcion, formatearNumero(r.saldo)])
    )
    sheetData.push(["", "Total Patrimonio", formatearNumero(data.totales.total_patrimonio)])
    sheetData.push([])
    sheetData.push([
      "TOTAL GENERAL",
      "",
      formatearNumero(data.totales.total_activo),
    ])

    const ws = XLSX.utils.aoa_to_sheet(sheetData)
    XLSX.utils.book_append_sheet(wb, ws, "Balance General")

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
    const hoy = new Date()
    const d = String(hoy.getDate()).padStart(2, "0")
    const m = String(hoy.getMonth() + 1).padStart(2, "0")
    const y = hoy.getFullYear()
    const nombreArchivo = `balance_general_${d}-${m}-${y}.xlsx`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
      },
    })
  } catch (error: any) {
    console.error("Error in GET /api/contabilidad/informes/balance-general/excel:", error)
    return NextResponse.json(
      { error: "Error al generar el Excel", details: error?.message },
      { status: 500 }
    )
  }
}
