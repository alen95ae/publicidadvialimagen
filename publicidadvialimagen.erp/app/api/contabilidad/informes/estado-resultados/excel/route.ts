export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"
import * as XLSX from "xlsx"
import { formatDateBolivia } from "@/lib/utils"
import { getDataEstadoResultados } from "../getData"

const TIPO_CAMBIO_USD = 6.96

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
    const monedaSufijo = moneda === "USD" ? "$" : "Bs"

    const supabase = getSupabaseAdmin()
    const data = await getDataEstadoResultados(supabase, {
      desde_fecha,
      a_fecha,
      empresa_id: searchParams.get("empresa_id") || "",
      sucursal_id: searchParams.get("sucursal_id") || "",
      moneda,
      estado: searchParams.get("estado") || "Aprobado",
      nivel: searchParams.get("nivel") || "5",
    })

    const wb = XLSX.utils.book_new()
    const headers = ["Cuenta", "Descripción", `Saldo (${monedaSufijo})`]

    const sheetData: (string | number)[][] = []
    sheetData.push(["ESTADO DE RESULTADOS"])
    sheetData.push([
      `Desde: ${formatDateBolivia(desde_fecha)} - A fecha: ${formatDateBolivia(a_fecha)}`,
      "",
      "",
    ])
    sheetData.push(["Moneda:", moneda === "USD" ? "USD" : "Bs", ""])
    if (moneda === "USD") {
      sheetData.push(["Tipo de cambio:", `${TIPO_CAMBIO_USD} Bs/USD`, ""])
    }
    sheetData.push([])

    sheetData.push(["INGRESOS"])
    sheetData.push(headers)
    data.ingresos.forEach((r) =>
      sheetData.push([r.cuenta, r.descripcion, formatearNumero(r.saldo)])
    )
    sheetData.push(["", "Total Ingresos", formatearNumero(data.totales.total_ingresos)])
    sheetData.push([])

    sheetData.push(["COSTOS"])
    sheetData.push(headers)
    data.costos.forEach((r) =>
      sheetData.push([r.cuenta, r.descripcion, formatearNumero(r.saldo)])
    )
    sheetData.push(["", "Total Costos", formatearNumero(data.totales.total_costos)])
    sheetData.push([])

    sheetData.push(["GASTOS"])
    sheetData.push(headers)
    data.gastos.forEach((r) =>
      sheetData.push([r.cuenta, r.descripcion, formatearNumero(r.saldo)])
    )
    sheetData.push(["", "Total Gastos", formatearNumero(data.totales.total_gastos)])
    sheetData.push([])

    sheetData.push([
      "UTILIDAD (PÉRDIDA) NETA",
      "",
      formatearNumero(data.totales.utilidad_neta),
    ])

    const ws = XLSX.utils.aoa_to_sheet(sheetData)
    XLSX.utils.book_append_sheet(wb, ws, "Estado de Resultados")

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
    const hoy = new Date()
    const d = String(hoy.getDate()).padStart(2, "0")
    const m = String(hoy.getMonth() + 1).padStart(2, "0")
    const y = hoy.getFullYear()
    const nombreArchivo = `estado_resultados_${d}-${m}-${y}.xlsx`

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
      "Error in GET /api/contabilidad/informes/estado-resultados/excel:",
      error
    )
    return NextResponse.json(
      { error: "Error al generar el Excel", details: error?.message },
      { status: 500 }
    )
  }
}
