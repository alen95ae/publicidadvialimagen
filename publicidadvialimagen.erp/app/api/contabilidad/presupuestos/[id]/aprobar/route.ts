import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"

// POST - Aprobar un presupuesto
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar permisos
    const permiso = await requirePermiso("contabilidad", "editar")
    if (permiso instanceof Response) {
      return permiso
    }

    // Usar admin directamente para evitar problemas con RLS
    const supabase = getSupabaseAdmin()

    // Obtener presupuesto
    const { data: presupuesto, error: fetchError } = await supabase
      .from("presupuestos")
      .select("*")
      .eq("id", params.id)
      .eq("empresa_id", 1)
      .single()

    if (fetchError || !presupuesto) {
      return NextResponse.json(
        { error: "Presupuesto no encontrado" },
        { status: 404 }
      )
    }

    if (presupuesto.aprobado) {
      return NextResponse.json(
        { error: "El presupuesto ya está aprobado" },
        { status: 400 }
      )
    }

    // Actualizar estado a aprobado
    const { data: presupuestoAprobado, error: errorAprobar } = await supabase
      .from("presupuestos")
      .update({ aprobado: true })
      .eq("id", params.id)
      .eq("empresa_id", 1)
      .select()
      .single()

    if (errorAprobar) {
      console.error("Error aprobando presupuesto:", errorAprobar)
      return NextResponse.json(
        { error: "Error al aprobar el presupuesto", details: errorAprobar.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: presupuestoAprobado,
      message: "Presupuesto aprobado correctamente",
    })
  } catch (error: any) {
    console.error("Error in POST /api/contabilidad/presupuestos/[id]/aprobar:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error?.message },
      { status: 500 }
    )
  }
}


