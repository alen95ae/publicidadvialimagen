export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar permisos
    const permiso = await requirePermiso("contabilidad", "ver")
    if (permiso instanceof Response) {
      return permiso
    }

    const supabase = getSupabaseAdmin()

    // Obtener detalles de la plantilla
    const { data: detalles, error } = await supabase
      .from("plantillas_contables_detalle")
      .select("*")
      .eq("plantilla_id", params.id)
      .order("orden", { ascending: true })

    if (error) {
      console.error("Error obteniendo detalles de plantilla:", error)
      return NextResponse.json(
        { error: "Error al obtener detalles", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: detalles || [],
    })
  } catch (error: any) {
    console.error("Error en GET /api/contabilidad/plantillas/[id]/detalles:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error.message },
      { status: 500 }
    )
  }
}

