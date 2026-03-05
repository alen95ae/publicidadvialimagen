export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"
import { getDataLibroVentas } from "./getData"

/**
 * GET - Libro de Ventas I.V.A.
 * Parámetros: empresa_id, sucursal_id, periodo_mes, periodo_anio
 */
export async function GET(request: NextRequest) {
  try {
    const permiso = await requirePermiso("contabilidad", "ver")
    if (permiso instanceof Response) return permiso

    const { searchParams } = new URL(request.url)
    const periodo_mes = searchParams.get("periodo_mes") || searchParams.get("periodo") || ""
    const periodo_anio = searchParams.get("periodo_anio") || searchParams.get("año") || ""
    if (!periodo_mes || !periodo_anio) {
      return NextResponse.json(
        { error: "Los parámetros periodo_mes y periodo_anio (o periodo y año) son obligatorios" },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()
    const result = await getDataLibroVentas(supabase, {
      empresa_id: searchParams.get("empresa_id") || "",
      sucursal_id: searchParams.get("sucursal_id") || "",
      periodo_mes,
      periodo_anio,
    })

    return NextResponse.json({
      success: true,
      ...result,
      ...(result.data.length === 0
        ? { message: "No hay registros de ventas en el periodo seleccionado" }
        : {}),
    })
  } catch (error: any) {
    console.error("Error in GET /api/contabilidad/informes/libro-ventas:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error?.message },
      { status: 500 }
    )
  }
}
