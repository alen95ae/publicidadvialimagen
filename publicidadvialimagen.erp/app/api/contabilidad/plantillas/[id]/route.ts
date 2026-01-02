export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"

// GET - Obtener plantilla con sus detalles ordenados
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Verificar permisos
    const permiso = await requirePermiso("contabilidad", "ver")
    if (permiso instanceof Response) {
      return permiso
    }

    const supabase = getSupabaseAdmin()

    // Obtener plantilla
    const { data: plantilla, error: plantillaError } = await supabase
      .from("plantillas_contables")
      .select("*")
      .eq("id", id)
      .single()

    if (plantillaError) {
      console.error("Error obteniendo plantilla:", plantillaError)
      return NextResponse.json(
        { error: "Error al obtener plantilla", details: plantillaError.message },
        { status: 500 }
      )
    }

    if (!plantilla) {
      return NextResponse.json(
        { error: "Plantilla no encontrada" },
        { status: 404 }
      )
    }

    // Obtener detalles ordenados por orden
    const { data: detalles, error: detallesError } = await supabase
      .from("plantillas_contables_detalle")
      .select("*")
      .eq("plantilla_id", id)
      .order("orden", { ascending: true })

    if (detallesError) {
      console.error("Error obteniendo detalles:", detallesError)
      return NextResponse.json(
        { error: "Error al obtener detalles", details: detallesError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        ...plantilla,
        detalles: detalles || [],
      },
    })
  } catch (error: any) {
    console.error("Error en GET /api/contabilidad/plantillas/[id]:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error.message },
      { status: 500 }
    )
  }
}

// PUT - Actualizar plantilla
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Verificar permisos
    const permiso = await requirePermiso("contabilidad", "editar")
    if (permiso instanceof Response) {
      return permiso
    }

    const supabase = getSupabaseAdmin()
    const body = await request.json()

    const { codigo, nombre, descripcion, tipo_comprobante, activa } = body

    // Validaciones
    if (codigo !== undefined && (!codigo || !codigo.trim())) {
      return NextResponse.json(
        { error: "codigo no puede estar vacío" },
        { status: 400 }
      )
    }

    if (nombre !== undefined && (!nombre || !nombre.trim())) {
      return NextResponse.json(
        { error: "nombre no puede estar vacío" },
        { status: 400 }
      )
    }

    if (tipo_comprobante && !["Diario", "Ingreso", "Egreso", "Traspaso", "Ctas por Pagar"].includes(tipo_comprobante)) {
      return NextResponse.json(
        { error: "tipo_comprobante debe ser uno de: Diario, Ingreso, Egreso, Traspaso, Ctas por Pagar" },
        { status: 400 }
      )
    }

    // Si se está cambiando el código, verificar que no exista otra plantilla con ese código
    if (codigo) {
      const { data: existente, error: errorExistente } = await supabase
        .from("plantillas_contables")
        .select("id")
        .eq("codigo", codigo.trim())
        .neq("id", params.id)
        .single()

      if (existente) {
        return NextResponse.json(
          { error: "Ya existe otra plantilla con este código" },
          { status: 400 }
        )
      }
    }

    // Preparar datos para actualizar
    const updateData: any = {}
    if (codigo !== undefined) updateData.codigo = codigo.trim()
    if (nombre !== undefined) updateData.nombre = nombre.trim()
    if (descripcion !== undefined) updateData.descripcion = descripcion?.trim() || null
    if (tipo_comprobante !== undefined) updateData.tipo_comprobante = tipo_comprobante
    if (activa !== undefined) updateData.activa = activa

    // Actualizar
    const { data, error } = await supabase
      .from("plantillas_contables")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error actualizando plantilla:", error)
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Ya existe otra plantilla con este código" },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: "Error al actualizar plantilla", details: error.message },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: "Plantilla no encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error: any) {
    console.error("Error en PUT /api/contabilidad/plantillas/[id]:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar plantilla (solo si no tiene detalles)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Verificar permisos
    const permiso = await requirePermiso("contabilidad", "editar")
    if (permiso instanceof Response) {
      return permiso
    }

    const supabase = getSupabaseAdmin()

    // Verificar si tiene detalles asociados
    const { data: detalles, error: errorDetalles } = await supabase
      .from("plantillas_contables_detalle")
      .select("id")
      .eq("plantilla_id", id)
      .limit(1)

    if (errorDetalles) {
      console.error("Error verificando detalles:", errorDetalles)
      return NextResponse.json(
        { error: "Error al verificar detalles", details: errorDetalles.message },
        { status: 500 }
      )
    }

    if (detalles && detalles.length > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar la plantilla porque tiene líneas asociadas. Elimine primero las líneas." },
        { status: 400 }
      )
    }

    // Eliminar plantilla
    const { error } = await supabase
      .from("plantillas_contables")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Error eliminando plantilla:", error)
      return NextResponse.json(
        { error: "Error al eliminar plantilla", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Plantilla eliminada correctamente",
    })
  } catch (error: any) {
    console.error("Error en DELETE /api/contabilidad/plantillas/[id]:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error.message },
      { status: 500 }
    )
  }
}
