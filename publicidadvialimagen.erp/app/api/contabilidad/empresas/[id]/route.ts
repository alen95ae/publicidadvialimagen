import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"
import type { Empresa } from "@/lib/types/contabilidad"

// GET - Obtener una empresa por ID
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

    const { data, error } = await supabase
      .from("empresas")
      .select("*")
      .eq("id", params.id)
      .single()

    if (error) {
      console.error("Error fetching empresa:", error)
      return NextResponse.json(
        { error: "Error al obtener la empresa" },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: "Empresa no encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error("Error in GET /api/contabilidad/empresas/[id]:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// PUT - Actualizar una empresa
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar permisos
    const permiso = await requirePermiso("contabilidad", "editar")
    if (permiso instanceof Response) {
      return permiso
    }

    const supabase = getSupabaseAdmin()

    // Verificar que la empresa existe
    const { data: empresaActual } = await supabase
      .from("empresas")
      .select("codigo")
      .eq("id", params.id)
      .single()

    if (!empresaActual) {
      return NextResponse.json(
        { error: "Empresa no encontrada" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { codigo, nombre, representante, direccion, casilla, telefonos, email, pais, ciudad, localidad, nit } = body

    // Validaciones básicas
    if (!nombre) {
      return NextResponse.json(
        { error: "El nombre es requerido" },
        { status: 400 }
      )
    }

    // Validar que el código no se haya cambiado (no editable en edición)
    if (codigo && codigo !== empresaActual.codigo) {
      return NextResponse.json(
        { error: "No se puede modificar el código de una empresa existente" },
        { status: 400 }
      )
    }

    // Si se intenta cambiar el código, validar que no exista otro con ese código
    if (codigo && codigo !== empresaActual.codigo) {
      const { data: existente } = await supabase
        .from("empresas")
        .select("id")
        .eq("codigo", codigo.trim())
        .neq("id", params.id)
        .single()

      if (existente) {
        return NextResponse.json(
          { error: `Ya existe otra empresa con el código "${codigo}"` },
          { status: 400 }
        )
      }
    }

    // Preparar datos de actualización (sin codigo si no se cambió)
    const updateData: any = {
      nombre: nombre.trim(),
      representante: representante?.trim() || null,
      direccion: direccion?.trim() || null,
      casilla: casilla?.trim() || null,
      telefonos: telefonos?.trim() || null,
      email: email?.trim() || null,
      pais: pais?.trim() || null,
      ciudad: ciudad?.trim() || null,
      localidad: localidad?.trim() || null,
      nit: nit?.trim() || null,
    }

    // Actualizar empresa
    const { data: empresaActualizada, error: errorUpdate } = await supabase
      .from("empresas")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .single()

    if (errorUpdate) {
      console.error("Error updating empresa:", errorUpdate)
      return NextResponse.json(
        { error: "Error al actualizar la empresa", details: errorUpdate.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: empresaActualizada,
      message: "Empresa actualizada correctamente",
    })
  } catch (error: any) {
    console.error("Error in PUT /api/contabilidad/empresas/[id]:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error?.message },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar una empresa
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar permisos
    const permiso = await requirePermiso("contabilidad", "eliminar")
    if (permiso instanceof Response) {
      return permiso
    }

    const supabase = getSupabaseAdmin()

    // Verificar que la empresa existe
    const { data: empresaActual } = await supabase
      .from("empresas")
      .select("id, codigo, nombre")
      .eq("id", params.id)
      .single()

    if (!empresaActual) {
      return NextResponse.json(
        { error: "Empresa no encontrada" },
        { status: 404 }
      )
    }

    // TODO: Validar dependencias (por ahora permitir borrar)
    // En el futuro se validará si hay comprobantes, cuentas, etc. asociados

    // Eliminar empresa
    const { error: errorDelete } = await supabase
      .from("empresas")
      .delete()
      .eq("id", params.id)

    if (errorDelete) {
      console.error("Error deleting empresa:", errorDelete)
      return NextResponse.json(
        { error: "Error al eliminar la empresa", details: errorDelete.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Empresa eliminada correctamente",
    })
  } catch (error: any) {
    console.error("Error in DELETE /api/contabilidad/empresas/[id]:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error?.message },
      { status: 500 }
    )
  }
}


