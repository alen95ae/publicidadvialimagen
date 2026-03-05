export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"
import { getDataLibroCompras } from "./getData"

/**
 * GET - Libro de Compras I.V.A.
 * Parámetros: empresa_id, sucursal_id, periodo_mes, periodo_anio, tipo_reporte (Impuestos | Control)
 */
export async function GET(request: NextRequest) {
  try {
    const permiso = await requirePermiso("contabilidad", "ver")
    if (permiso instanceof Response) return permiso

    const { searchParams } = new URL(request.url)
    const periodo_mes = searchParams.get("periodo_mes") || ""
    const periodo_anio = searchParams.get("periodo_anio") || ""
    if (!periodo_mes || !periodo_anio) {
      return NextResponse.json(
        { error: "Los parámetros periodo_mes y periodo_anio son obligatorios" },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()
    const result = await getDataLibroCompras(supabase, {
      empresa_id: searchParams.get("empresa_id") || "",
      sucursal_id: searchParams.get("sucursal_id") || "",
      periodo_mes,
      periodo_anio,
      tipo_reporte: searchParams.get("tipo_reporte") || "Impuestos",
    })

    return NextResponse.json({
      success: true,
      ...result,
      ...(result.data.length === 0
        ? { message: "No hay registros de libro de compras en el periodo seleccionado" }
        : {}),
    })
  } catch (error: any) {
    console.error("Error in GET /api/contabilidad/informes/libro-compras:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error?.message },
      { status: 500 }
    )
  }
}
