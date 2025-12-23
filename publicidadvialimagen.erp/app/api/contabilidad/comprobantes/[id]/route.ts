export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseUser, getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"
import type { Comprobante, ComprobanteDetalle } from "@/lib/types/contabilidad"

// GET - Obtener un comprobante por ID
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

    let supabase = await getSupabaseUser(request)
    if (!supabase) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener comprobante con detalles
    let { data, error } = await supabase
      .from("comprobantes")
      .select(`
        *,
        detalles:comprobante_detalle(*)
      `)
      .eq("id", params.id)
      .eq("empresa_id", 1)
      .single()

    // Si hay error, intentar con admin
    if (error) {
      const supabaseAdmin = getSupabaseAdmin()
      const { data: adminData, error: adminError } = await supabaseAdmin
        .from("comprobantes")
        .select(`
          *,
          detalles:comprobante_detalle(*)
        `)
        .eq("id", params.id)
        .eq("empresa_id", 1)
        .single()

      if (!adminError && adminData) {
        data = adminData
        error = null
      }
    }

    if (error) {
      console.error("Error fetching comprobante:", error)
      return NextResponse.json(
        { error: "Error al obtener el comprobante" },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: "Comprobante no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error("Error in GET /api/contabilidad/comprobantes/[id]:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// PUT - Actualizar un comprobante
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

    // Usar admin directamente para evitar problemas con RLS
    const supabase = getSupabaseAdmin()

    // Verificar que el comprobante no esté aprobado
    const { data: comprobanteActual } = await supabase
      .from("comprobantes")
      .select("estado")
      .eq("id", params.id)
      .eq("empresa_id", 1)
      .single()

    if (!comprobanteActual) {
      return NextResponse.json(
        { error: "Comprobante no encontrado" },
        { status: 404 }
      )
    }

    if (comprobanteActual.estado === "APROBADO") {
      return NextResponse.json(
        { error: "No se puede editar un comprobante aprobado" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { detalles, ...cabecera } = body

    // Validaciones
    if (!detalles || !Array.isArray(detalles) || detalles.length === 0) {
      return NextResponse.json(
        { error: "Debe agregar al menos un detalle al comprobante" },
        { status: 400 }
      )
    }

    const detallesInvalidos = detalles.some((d: ComprobanteDetalle) => !d.cuenta)
    if (detallesInvalidos) {
      return NextResponse.json(
        { error: "Todos los detalles deben tener una cuenta asignada" },
        { status: 400 }
      )
    }

    // Actualizar cabecera
    const updateData: any = {
      origen: cabecera.origen,
      tipo_comprobante: cabecera.tipo_comprobante,
      tipo_asiento: cabecera.tipo_asiento,
      fecha: cabecera.fecha,
      periodo: cabecera.periodo,
      gestion: cabecera.gestion,
      moneda: cabecera.moneda,
      tipo_cambio: cabecera.tipo_cambio,
      concepto: cabecera.concepto || null,
      beneficiario: cabecera.beneficiario || null,
      nro_cheque: cabecera.nro_cheque || null,
      estado: cabecera.estado || "BORRADOR",
    }

    const { data: comprobanteActualizado, error: errorUpdate } = await supabase
      .from("comprobantes")
      .update(updateData)
      .eq("id", params.id)
      .eq("empresa_id", 1)
      .select()
      .single()

    if (errorUpdate) {
      console.error("Error updating comprobante:", errorUpdate)
      return NextResponse.json(
        { error: "Error al actualizar el comprobante", details: errorUpdate.message },
        { status: 500 }
      )
    }

    // Eliminar detalles existentes
    const { error: errorDelete } = await supabase
      .from("comprobante_detalle")
      .delete()
      .eq("comprobante_id", params.id)

    if (errorDelete) {
      console.error("Error deleting detalles:", errorDelete)
    }

    // Insertar nuevos detalles
    const detallesData = detalles.map((det: ComprobanteDetalle, index: number) => ({
      comprobante_id: params.id, // UUID string, no necesita parseInt
      cuenta: det.cuenta, // string "111001003"
      auxiliar: det.auxiliar ?? null, // string o null
      glosa: det.glosa ?? null,
      debe_bs: det.debe_bs ?? 0,
      haber_bs: det.haber_bs ?? 0,
      debe_usd: det.debe_usd ?? 0,
      haber_usd: det.haber_usd ?? 0,
      orden: index + 1,
    }))

    const { error: errorDetalles } = await supabase
      .from("comprobante_detalle")
      .insert(detallesData)

    if (errorDetalles) {
      console.error("❌ Error creating detalles:", errorDetalles)
      console.error("❌ Detalles que causaron el error:", JSON.stringify(detallesData, null, 2))
      return NextResponse.json(
        { error: "Error al actualizar los detalles", details: errorDetalles.message },
        { status: 500 }
      )
    }

    // Obtener el comprobante completo con detalles
    const { data: comprobanteCompleto } = await supabase
      .from("comprobantes")
      .select(`
        *,
        detalles:comprobante_detalle(*)
      `)
      .eq("id", params.id)
      .single()

    return NextResponse.json({
      success: true,
      data: comprobanteCompleto,
      message: "Comprobante actualizado correctamente",
    })
  } catch (error: any) {
    console.error("Error in PUT /api/contabilidad/comprobantes/[id]:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error?.message },
      { status: 500 }
    )
  }
}

