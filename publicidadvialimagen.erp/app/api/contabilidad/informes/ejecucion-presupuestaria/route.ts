export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"
import { getDataEjecucionPresupuestaria } from "./getData"

/**
 * GET - Ejecución Presupuestaria
 * Cruza presupuestos (mes/gestión) con ejecutado (comprobantes + detalle).
 * Parámetros: empresa_id, sucursal_id, clasificador, mes, gestion, moneda, estado
 */
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

    return NextResponse.json({
      success: true,
      data: result.data,
      totales: result.totales,
      ...(result.data.length === 0
        ? { message: "No hay datos de ejecución presupuestaria con los filtros seleccionados" }
        : {}),
    })
  } catch (error: any) {
    console.error("Error in GET /api/contabilidad/informes/ejecucion-presupuestaria:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error?.message },
      { status: 500 }
    )
  }
}
