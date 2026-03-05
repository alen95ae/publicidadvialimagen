export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseUser, getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"
import type { Comprobante, ComprobanteDetalle } from "@/lib/types/contabilidad"

// GET - Listar todos los comprobantes
export async function GET(request: NextRequest) {
  try {
    // Verificar permisos
    const permiso = await requirePermiso("contabilidad", "ver")
    if (permiso instanceof Response) {
      return permiso
    }

    const supabase = getSupabaseAdmin()

    // Obtener empresa del usuario autenticado
    const { data: userData } = await supabase
      .from("usuarios")
      .select("empresa_id")
      .eq("id", permiso.userId)
      .single()

    if (!userData?.empresa_id) {
      return NextResponse.json(
        { error: "Usuario sin empresa asignada" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "100")
    const offset = (page - 1) * limit

    // Obtener comprobantes ordenados por fecha descendente, filtrados por empresa del usuario
    const { data, error, count } = await supabase
      .from("comprobantes")
      .select("id, numero, origen, tipo_comprobante, tipo_asiento, fecha, periodo, gestion, moneda, tipo_cambio, concepto, beneficiario, nro_cheque, estado, empresa_uuid, sucursal_id, created_at, updated_at", { count: "exact" })
      .eq("empresa_id", userData.empresa_id)
      .order("fecha", { ascending: false })
      .order("numero", { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Error en comprobantes:", error)
      return NextResponse.json(
        { error: "Error al obtener los comprobantes", details: error.message },
        { status: 500 }
      )
    }


    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error: any) {
    console.error("Error en comprobantes:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error?.message },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo comprobante
export async function POST(request: NextRequest) {
  try {
    // Verificar permisos
    const permiso = await requirePermiso("contabilidad", "editar")
    if (permiso instanceof Response) {
      return permiso
    }

    // Usar admin directamente para evitar problemas con RLS
    const supabase = getSupabaseAdmin()

    const body = await request.json()
    const { detalles, ...cabecera } = body

    // Validaciones básicas
    if (!cabecera.fecha || !cabecera.periodo || !cabecera.gestion) {
      return NextResponse.json(
        { error: "Fecha, periodo y gestión son requeridos" },
        { status: 400 }
      )
    }

    if (!detalles || !Array.isArray(detalles)) {
      return NextResponse.json(
        { error: "Detalles debe ser un array" },
        { status: 400 }
      )
    }

    if (detalles.length === 0) {
      return NextResponse.json(
        { error: "El comprobante debe tener al menos una línea contable" },
        { status: 400 }
      )
    }

    const totalDebeBs = detalles.reduce((s: number, d: ComprobanteDetalle) => s + (Number(d.debe_bs) || 0), 0)
    const totalHaberBs = detalles.reduce((s: number, d: ComprobanteDetalle) => s + (Number(d.haber_bs) || 0), 0)
    const totalDebeUsd = detalles.reduce((s: number, d: ComprobanteDetalle) => s + (Number(d.debe_usd) || 0), 0)
    const totalHaberUsd = detalles.reduce((s: number, d: ComprobanteDetalle) => s + (Number(d.haber_usd) || 0), 0)
    const diffBs = Math.abs(totalDebeBs - totalHaberBs)
    const diffUsd = Math.abs(totalDebeUsd - totalHaberUsd)
    if (diffBs > 0.02 || diffUsd > 0.02) {
      return NextResponse.json(
        {
          error: "El comprobante no está balanceado (Debe ≠ Haber). Total Debe debe ser igual a Total Haber.",
          detalles: { diferencia_bs: diffBs, diferencia_usd: diffUsd },
        },
        { status: 400 }
      )
    }

    for (let i = 0; i < detalles.length; i++) {
      const d = detalles[i] as ComprobanteDetalle
      if (!d.cuenta || String(d.cuenta).trim() === "") {
        return NextResponse.json(
          { error: "Todos los detalles deben tener una cuenta asignada" },
          { status: 400 }
        )
      }
      const debeBs = Number(d.debe_bs) || 0
      const haberBs = Number(d.haber_bs) || 0
      const debeUsd = Number(d.debe_usd) || 0
      const haberUsd = Number(d.haber_usd) || 0
      if (debeBs === 0 && haberBs === 0 && debeUsd === 0 && haberUsd === 0) {
        return NextResponse.json(
          { error: `La línea ${i + 1} debe tener Debe o Haber (no puede tener ambos en cero)` },
          { status: 400 }
        )
      }
    }

    // Preparar datos de cabecera
    // El número se asignará únicamente al aprobar el comprobante
    // No incluimos el campo numero en borradores (será NULL por defecto en BD)
    const comprobanteData: any = {
      origen: cabecera.origen || "Contabilidad",
      tipo_comprobante: cabecera.tipo_comprobante || "Diario",
      tipo_asiento: cabecera.tipo_asiento || "Normal",
      fecha: cabecera.fecha,
      periodo: cabecera.periodo,
      gestion: cabecera.gestion,
      moneda: cabecera.moneda || "BS",
      tipo_cambio: cabecera.tipo_cambio || 1,
      concepto: cabecera.concepto || null,
      beneficiario: cabecera.beneficiario || null,
      nro_cheque: cabecera.nro_cheque || null,
      estado: cabecera.estado || "BORRADOR",
      empresa_uuid: cabecera.empresa_id || null,
      sucursal_id: cabecera.sucursal_id || null,
    }

    // Insertar cabecera
    const { data: comprobanteCreado, error: errorCabecera } = await supabase
      .from("comprobantes")
      .insert(comprobanteData)
      .select()
      .single()

    if (errorCabecera) {
      console.error("Error en comprobantes:", errorCabecera)
      return NextResponse.json(
        { error: "Error al crear el comprobante", details: errorCabecera.message, code: errorCabecera.code },
        { status: 500 }
      )
    }

    // Insertar detalles solo si hay alguno
    if (detalles.length > 0) {
      const detallesData = detalles.map((det: ComprobanteDetalle, index: number) => ({
        comprobante_id: comprobanteCreado.id,
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
        console.error("Error en comprobantes:", errorDetalles)
        // Intentar eliminar el comprobante creado
        await supabase.from("comprobantes").delete().eq("id", comprobanteCreado.id)
        return NextResponse.json(
          { error: "Error al crear los detalles", details: errorDetalles.message },
          { status: 500 }
        )
      }
    }

    // Obtener el comprobante completo con detalles
    const { data: comprobanteCompleto } = await supabase
      .from("comprobantes")
      .select(`
        *,
        detalles:comprobante_detalle(*)
      `)
      .eq("id", comprobanteCreado.id)
      .single()

    return NextResponse.json({
      success: true,
      data: comprobanteCompleto,
      message: "Comprobante creado correctamente",
    })
  } catch (error: any) {
    console.error("Error en comprobantes:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error?.message },
      { status: 500 }
    )
  }
}

