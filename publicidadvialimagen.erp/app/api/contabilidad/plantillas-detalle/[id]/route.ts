export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"

// PUT - Actualizar línea de plantilla
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

    const { lado, porcentaje, cuenta_es_fija, cuenta_id, permite_auxiliar, bloqueado } = body

    // Validaciones
    if (lado && !["DEBE", "HABER"].includes(lado)) {
      return NextResponse.json(
        { error: "lado debe ser 'DEBE' o 'HABER'" },
        { status: 400 }
      )
    }

    if (porcentaje !== null && porcentaje !== undefined && porcentaje < 0) {
      return NextResponse.json(
        { error: "porcentaje debe ser >= 0" },
        { status: 400 }
      )
    }

    if (cuenta_es_fija && !cuenta_id) {
      return NextResponse.json(
        { error: "cuenta_id es requerido cuando cuenta_es_fija es true" },
        { status: 400 }
      )
    }

    // Validar que cuenta_id existe en plan_cuentas si se proporciona
    if (cuenta_id !== undefined && cuenta_id !== null) {
      const { data: cuentaExistente, error: errorCuenta } = await supabase
        .from("plan_cuentas")
        .select("id")
        .eq("id", cuenta_id)
        .single()

      if (errorCuenta || !cuentaExistente) {
        return NextResponse.json(
          { error: `La cuenta con ID ${cuenta_id} no existe en el plan de cuentas` },
          { status: 400 }
        )
      }
    }

    // Preparar datos para actualizar
    const updateData: any = {}
    if (lado !== undefined) updateData.lado = lado
    if (porcentaje !== undefined) updateData.porcentaje = porcentaje !== null ? porcentaje : null
    if (cuenta_es_fija !== undefined) {
      updateData.cuenta_es_fija = cuenta_es_fija
    }
    if (cuenta_id !== undefined) {
      updateData.cuenta_id = cuenta_id || null
    }
    if (permite_auxiliar !== undefined) updateData.permite_auxiliar = permite_auxiliar
    if (bloqueado !== undefined) updateData.bloqueado = bloqueado

    // Actualizar
    const { data, error } = await supabase
      .from("plantillas_contables_detalle")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error actualizando detalle de plantilla:", error)
      return NextResponse.json(
        { error: "Error al actualizar detalle", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error: any) {
    console.error("Error en PUT /api/contabilidad/plantillas-detalle/[id]:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar línea de plantilla
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

    // Obtener el detalle para saber el plantilla_id y orden
    const { data: detalle, error: errorDetalle } = await supabase
      .from("plantillas_contables_detalle")
      .select("plantilla_id, orden")
      .eq("id", id)
      .single()

    if (errorDetalle || !detalle) {
      return NextResponse.json(
        { error: "Detalle no encontrado" },
        { status: 404 }
      )
    }

    // Eliminar el detalle
    const { error } = await supabase
      .from("plantillas_contables_detalle")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Error eliminando detalle de plantilla:", error)
      return NextResponse.json(
        { error: "Error al eliminar detalle", details: error.message },
        { status: 500 }
      )
    }

    // Reordenar los detalles restantes
    const { data: detallesRestantes, error: errorRestantes } = await supabase
      .from("plantillas_contables_detalle")
      .select("id, orden")
      .eq("plantilla_id", detalle.plantilla_id)
      .gt("orden", detalle.orden)
      .order("orden", { ascending: true })

    if (errorRestantes) {
      console.error("Error obteniendo detalles restantes:", errorRestantes)
      // No es crítico, solo continuar
    } else if (detallesRestantes && detallesRestantes.length > 0) {
      // Actualizar orden de los detalles siguientes
      const updates = detallesRestantes.map((d, index) => ({
        id: d.id,
        orden: detalle.orden + index,
      }))

      for (const update of updates) {
        await supabase
          .from("plantillas_contables_detalle")
          .update({ orden: update.orden })
          .eq("id", update.id)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Detalle eliminado correctamente",
    })
  } catch (error: any) {
    console.error("Error en DELETE /api/contabilidad/plantillas-detalle/[id]:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error.message },
      { status: 500 }
    )
  }
}

