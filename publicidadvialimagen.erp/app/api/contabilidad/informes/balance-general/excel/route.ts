export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"
import * as XLSX from "xlsx"
import { formatDateBolivia } from "@/lib/utils"
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
    const desde_fecha = searchParams.get("desde_fecha") || ""
    const a_fecha = searchParams.get("a_fecha") || ""
    if (!desde_fecha || !a_fecha) {
      return NextResponse.json(
        { error: "Los parámetros desde_fecha y a_fecha son obligatorios" },
        { status: 400 }
      )
    }

    const moneda = searchParams.get("moneda") || "BOB"
    const monedaSufijo = searchParams.get("moneda_simbolo") || moneda
    const monedaNombre = searchParams.get("moneda_nombre") || moneda

    const supabase = getSupabaseAdmin()
    const data = await getDataBalanceGeneral(supabase, {
      desde_fecha,
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
    sheetData.push([`Desde: ${formatDateBolivia(desde_fecha)} - A fecha: ${formatDateBolivia(a_fecha)}`, "", ""])
    sheetData.push(["Moneda:", monedaNombre, ""])
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
