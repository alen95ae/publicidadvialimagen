export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"

export async function GET(request: NextRequest) {
  try {
    // Verificar permisos
    const permiso = await requirePermiso("contabilidad", "ver")
    if (permiso instanceof Response) {
      return permiso
    }

    const supabase = getSupabaseAdmin()

    // Obtener plantillas activas
    const { data: plantillas, error } = await supabase
      .from("plantillas_contables")
      .select("*")
      .eq("activa", true)
      .order("nombre", { ascending: true })

    if (error) {
      console.error("Error obteniendo plantillas:", error)
      return NextResponse.json(
        { error: "Error al obtener plantillas", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: plantillas || [],
    })
  } catch (error: any) {
    console.error("Error en GET /api/contabilidad/plantillas:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error.message },
      { status: 500 }
    )
  }
}

