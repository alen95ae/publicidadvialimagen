export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"

// GET - Obtener una sucursal por ID
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
      .from("sucursales")
      .select("*, empresas(codigo, nombre)")
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching sucursal:", error)
      return NextResponse.json(
        { error: "Error al obtener la sucursal" },
        { status: 500 }
      )
    }
    if (!data) {
      return NextResponse.json(
        { error: "Sucursal no encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in GET /api/contabilidad/sucursales/[id]:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// PUT - Actualizar sucursal
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
      .from("sucursales")
      .select("codigo, empresa_id")
      .eq("id", id)
      .single()

    if (!actual) {
      return NextResponse.json(
        { error: "Sucursal no encontrada" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const {
      codigo,
      nombre,
      representante,
      direccion,
      sucursal,
      telefonos,
      email,
      pais,
      ciudad,
      localidad,
      nit,
    } = body

    if (!nombre) {
      return NextResponse.json(
        { error: "El nombre es requerido" },
        { status: 400 }
      )
    }

    if (codigo && codigo !== actual.codigo) {
      return NextResponse.json(
        { error: "No se puede modificar el código de una sucursal existente" },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {
      nombre: nombre.trim(),
      representante: representante?.trim() || null,
      direccion: direccion?.trim() || null,
      sucursal: sucursal?.trim() || null,
      telefonos: telefonos?.trim() || null,
      email: email?.trim() || null,
      pais: pais?.trim() || null,
      ciudad: ciudad?.trim() || null,
      localidad: localidad?.trim() || null,
      nit: nit?.trim() || null,
    }

    const { data: actualizada, error: errorUpdate } = await supabase
      .from("sucursales")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (errorUpdate) {
      console.error("Error updating sucursal:", errorUpdate)
      return NextResponse.json(
        { error: "Error al actualizar la sucursal", details: errorUpdate.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: actualizada,
      message: "Sucursal actualizada correctamente",
    })
  } catch (error: any) {
    console.error("Error in PUT /api/contabilidad/sucursales/[id]:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error?.message },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar sucursal
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
      .from("sucursales")
      .select("id, codigo, nombre")
      .eq("id", id)
      .single()

    if (!actual) {
      return NextResponse.json(
        { error: "Sucursal no encontrada" },
        { status: 404 }
      )
    }

    const { error: errorDelete } = await supabase
      .from("sucursales")
      .delete()
      .eq("id", id)

    if (errorDelete) {
      console.error("Error deleting sucursal:", errorDelete)
      return NextResponse.json(
        { error: "Error al eliminar la sucursal", details: errorDelete.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Sucursal eliminada correctamente",
    })
  } catch (error: any) {
    console.error("Error in DELETE /api/contabilidad/sucursales/[id]:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error?.message },
      { status: 500 }
    )
  }
}
