import { NextRequest, NextResponse } from "next/server"
import { getSupabaseUser } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"
import type { Auxiliar } from "@/lib/types/contabilidad"

// GET - Obtener un auxiliar por ID
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

    const supabase = await getSupabaseUser(request)
    if (!supabase) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("auxiliares")
      .select("*")
      .eq("id", params.id)
      .single()

    if (error) {
      console.error("Error fetching auxiliar:", error)
      return NextResponse.json(
        { error: "Error al obtener el auxiliar" },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: "Auxiliar no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error("Error in GET /api/contabilidad/auxiliares/[id]:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// PUT - Actualizar un auxiliar
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

    const supabase = await getSupabaseUser(request)
    if (!supabase) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body: Partial<Auxiliar> = await request.json()

    // Preparar datos para actualización
    const updateData: Partial<Auxiliar> = {}
    if (body.tipo_auxiliar !== undefined) updateData.tipo_auxiliar = body.tipo_auxiliar
    if (body.codigo !== undefined) updateData.codigo = body.codigo
    if (body.nombre !== undefined) updateData.nombre = body.nombre
    if (body.cuenta_asociada !== undefined) updateData.cuenta_asociada = body.cuenta_asociada
    if (body.moneda !== undefined) updateData.moneda = body.moneda
    if (body.cuenta_bancaria_o_caja !== undefined)
      updateData.cuenta_bancaria_o_caja = body.cuenta_bancaria_o_caja
    if (body.departamento !== undefined) updateData.departamento = body.departamento
    if (body.direccion !== undefined) updateData.direccion = body.direccion
    if (body.telefono !== undefined) updateData.telefono = body.telefono
    if (body.email !== undefined) updateData.email = body.email
    if (body.nit !== undefined) updateData.nit = body.nit
    if (body.autorizacion !== undefined) updateData.autorizacion = body.autorizacion
    if (body.vigencia !== undefined) updateData.vigencia = body.vigencia

    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from("auxiliares")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating auxiliar:", error)
      return NextResponse.json(
        { error: "Error al actualizar el auxiliar", details: error.message },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: "Auxiliar no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: "Auxiliar actualizado correctamente",
    })
  } catch (error) {
    console.error("Error in PUT /api/contabilidad/auxiliares/[id]:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar un auxiliar
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

    const supabase = await getSupabaseUser(request)
    if (!supabase) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { error } = await supabase
      .from("auxiliares")
      .delete()
      .eq("id", params.id)

    if (error) {
      console.error("Error deleting auxiliar:", error)
      return NextResponse.json(
        { error: "Error al eliminar el auxiliar", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Auxiliar eliminado correctamente",
    })
  } catch (error) {
    console.error("Error in DELETE /api/contabilidad/auxiliares/[id]:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}



