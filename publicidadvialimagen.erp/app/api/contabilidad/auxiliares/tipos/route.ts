export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"

/**
 * GET - Listar tipos de auxiliar distintos (para desplegables)
 * No hardcodea tipos; usa solo los configurados en la tabla auxiliares.
 */
export async function GET() {
  try {
    const permiso = await requirePermiso("contabilidad", "ver")
    if (permiso instanceof Response) return permiso

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from("auxiliares")
      .select("tipo_auxiliar")
      .order("tipo_auxiliar", { ascending: true })

    if (error) {
      if (error.code === "PGRST116" || error.message?.includes("does not exist")) {
        return NextResponse.json({ success: true, data: [] })
      }
      return NextResponse.json(
        { error: "Error al obtener tipos de auxiliar", details: error.message },
        { status: 500 }
      )
    }

    const tipos = [...new Set((data || []).map((r: any) => r.tipo_auxiliar).filter(Boolean))]
    return NextResponse.json({ success: true, data: tipos })
  } catch (e) {
    console.error("Error in GET /api/contabilidad/auxiliares/tipos:", e)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
