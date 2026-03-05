export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"
import { getDataReporteFacturacion } from "./getData"

/**
 * GET - Reporte de Facturación
 * Parámetros: empresa_id, sucursal_id, tipo_documento, desde_fecha, hasta_fecha
 */
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

    return NextResponse.json({
      success: true,
      ...result,
      ...(result.data.length === 0
        ? { message: "No hay registros con los filtros seleccionados" }
        : {}),
    })
  } catch (error: any) {
    console.error("Error in GET /api/contabilidad/informes/reporte-facturacion:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error?.message },
      { status: 500 }
    )
  }
}
