export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"
import * as XLSX from "xlsx"
import { getDataEjecucionPresupuestaria } from "../getData"
import type { EjecucionPresupuestariaFila, EjecucionPresupuestariaTotales } from "../getData"

const MESES_LABEL: Record<string, string> = {
  "01": "Enero", "02": "Febrero", "03": "Marzo", "04": "Abril",
  "05": "Mayo", "06": "Junio", "07": "Julio", "08": "Agosto",
  "09": "Septiembre", "10": "Octubre", "11": "Noviembre", "12": "Diciembre",
}

function formatearNumero(n: number): string {
  const s = Number(n).toFixed(2)
  const [entera, decimal] = s.split(".")
  return `${entera.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${decimal}`
}

function formatearPorcentaje(v: number | null): string {
  if (v == null || !Number.isFinite(v)) return "—"
  return `${formatearNumero(v)}%`
}

export async function GET(request: NextRequest) {
  try {
    const permiso = await requirePermiso("contabilidad", "ver")
    if (permiso instanceof Response) return permiso

    const { searchParams } = new URL(request.url)
    const mes = searchParams.get("mes") || ""
    const gestion = searchParams.get("gestion") || ""
    if (!mes || !gestion) {
      return NextResponse.json(
        { error: "Los parámetros mes y gestion son obligatorios" },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()
    const result = await getDataEjecucionPresupuestaria(supabase, {
      empresa_id: searchParams.get("empresa_id") || "",
      sucursal_id: searchParams.get("sucursal_id") || "",
      clasificador: searchParams.get("clasificador") || "",
      mes,
      gestion,
      moneda: searchParams.get("moneda") || "BOB",
      estado: searchParams.get("estado") || "Aprobado",
    })

    const headers = ["Código", "Cuenta", "Presupuestado", "Ejecutado", "Diferencia", "% Ejecución"]
    const sheetData: (string | number)[][] = []
    sheetData.push(["EJECUCIÓN PRESUPUESTARIA"])
    const mesLabel = MESES_LABEL[mes] || mes
    sheetData.push([`${mesLabel} ${gestion}`, "", "", "", "", ""])
    sheetData.push([])
    sheetData.push(headers)

    result.data.forEach((r: EjecucionPresupuestariaFila) => {
      sheetData.push([
        r.cuenta,
        r.descripcion || "",
        formatearNumero(r.presupuestado),
        formatearNumero(r.ejecutado),
        formatearNumero(r.diferencia),
        formatearPorcentaje(r.porcentaje_ejecucion),
      ])
    })

    const t: EjecucionPresupuestariaTotales = result.totales
    sheetData.push([
      "",
      "TOTALES",
      formatearNumero(t.presupuestado),
      formatearNumero(t.ejecutado),
      formatearNumero(t.diferencia),
      "—",
    ])

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(sheetData)
    XLSX.utils.book_append_sheet(wb, ws, "Ejecución Presup.")

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
    const hoy = new Date()
    const d = String(hoy.getDate()).padStart(2, "0")
    const m = String(hoy.getMonth() + 1).padStart(2, "0")
    const y = hoy.getFullYear()
    const nombreArchivo = `ejecucion_presupuestaria_${d}-${m}-${y}.xlsx`

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
      "Error in GET /api/contabilidad/informes/ejecucion-presupuestaria/excel:",
      error
    )
    return NextResponse.json(
      { error: "Error al generar el Excel", details: error?.message },
      { status: 500 }
    )
  }
}
