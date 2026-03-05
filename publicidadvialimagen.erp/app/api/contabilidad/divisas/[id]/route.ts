export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"

// GET - Obtener una divisa por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permiso = await requirePermiso("contabilidad", "ver")
    if (permiso instanceof Response) return permiso

    const supabase = getSupabaseAdmin()
    const { id } = await params

    const { data, error } = await supabase
      .from("divisas")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching divisa:", error)
      return NextResponse.json(
        { error: "Error al obtener la divisa" },
        { status: 500 }
      )
    }
    if (!data) {
      return NextResponse.json(
        { error: "Divisa no encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in GET /api/contabilidad/divisas/[id]:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// PUT - Actualizar divisa
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permiso = await requirePermiso("contabilidad", "editar")
    if (permiso instanceof Response) return permiso

    const supabase = getSupabaseAdmin()
    const { id } = await params

    const { data: actual } = await supabase
      .from("divisas")
      .select("codigo")
      .eq("id", id)
      .single()

    if (!actual) {
      return NextResponse.json(
        { error: "Divisa no encontrada" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { codigo, nombre, simbolo, tipo_cambio, es_base, estado } = body

    if (codigo && String(codigo).trim().toUpperCase() !== actual.codigo) {
      return NextResponse.json(
        { error: "No se puede modificar el código de una divisa existente" },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}

    if (nombre !== undefined) updateData.nombre = String(nombre).trim()
    if (simbolo !== undefined) updateData.simbolo = String(simbolo).trim()
    if (tipo_cambio !== undefined) {
      const n = Number(tipo_cambio)
      if (Number.isNaN(n) || n < 0) {
        return NextResponse.json(
          { error: "Tipo de cambio debe ser un número mayor o igual a 0" },
          { status: 400 }
        )
      }
      updateData.tipo_cambio = n
    }
    if (es_base !== undefined) updateData.es_base = Boolean(es_base)
    if (estado !== undefined) updateData.estado = String(estado).trim().toUpperCase()

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No hay campos para actualizar" },
        { status: 400 }
      )
    }

    const { data: actualizada, error: errorUpdate } = await supabase
      .from("divisas")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (errorUpdate) {
      console.error("Error updating divisa:", errorUpdate)
      return NextResponse.json(
        { error: "Error al actualizar la divisa", details: errorUpdate.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: actualizada,
      message: "Divisa actualizada correctamente",
    })
  } catch (error: any) {
    console.error("Error in PUT /api/contabilidad/divisas/[id]:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error?.message },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar divisa (físico)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permiso = await requirePermiso("contabilidad", "eliminar")
    if (permiso instanceof Response) return permiso

    const supabase = getSupabaseAdmin()
    const { id } = await params

    const { data: actual } = await supabase
      .from("divisas")
      .select("id, codigo, nombre")
      .eq("id", id)
      .single()

    if (!actual) {
      return NextResponse.json(
        { error: "Divisa no encontrada" },
        { status: 404 }
      )
    }

    const { error: errorDelete } = await supabase
      .from("divisas")
      .delete()
      .eq("id", id)

    if (errorDelete) {
      console.error("Error deleting divisa:", errorDelete)
      return NextResponse.json(
        { error: "Error al eliminar la divisa", details: errorDelete.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Divisa eliminada correctamente",
    })
  } catch (error: any) {
    console.error("Error in DELETE /api/contabilidad/divisas/[id]:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error?.message },
      { status: 500 }
    )
  }
}
