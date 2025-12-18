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

    // Usar admin directamente para evitar problemas con RLS
    const supabase = getSupabaseAdmin()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "100")
    const offset = (page - 1) * limit

    // Obtener comprobantes ordenados por fecha descendente
    const { data, error, count } = await supabase
      .from("comprobantes")
      .select("id, numero, origen, tipo_comprobante, tipo_asiento, fecha, periodo, gestion, moneda, tipo_cambio, concepto, beneficiario, nro_cheque, estado, empresa_id, created_at, updated_at", { count: "exact" })
      .eq("empresa_id", 1)
      .order("fecha", { ascending: false })
      .order("numero", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Error fetching comprobantes:", error)
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
    console.error("Error in GET /api/contabilidad/comprobantes:", error)
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

    if (!detalles || !Array.isArray(detalles) || detalles.length === 0) {
      return NextResponse.json(
        { error: "Debe agregar al menos un detalle al comprobante" },
        { status: 400 }
      )
    }

    // Validar que todos los detalles tengan cuenta
    const detallesInvalidos = detalles.some((d: ComprobanteDetalle) => !d.cuenta)
    if (detallesInvalidos) {
      return NextResponse.json(
        { error: "Todos los detalles deben tener una cuenta asignada" },
        { status: 400 }
      )
    }

    // Generar número de comprobante
    const { data: ultimoComprobante } = await supabase
      .from("comprobantes")
      .select("numero")
      .eq("empresa_id", 1)
      .order("id", { ascending: false })
      .limit(1)
      .single()

    let siguienteNumero = "001"
    if (ultimoComprobante?.numero) {
      const ultimoNum = parseInt(ultimoComprobante.numero) || 0
      siguienteNumero = String(ultimoNum + 1).padStart(3, "0")
    }

    // Preparar datos de cabecera
    const comprobanteData: any = {
      numero: siguienteNumero,
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
      empresa_id: 1,
    }

    // Insertar cabecera
    const { data: comprobanteCreado, error: errorCabecera } = await supabase
      .from("comprobantes")
      .insert(comprobanteData)
      .select()
      .single()

    if (errorCabecera) {
      console.error("Error creating comprobante:", errorCabecera)
      return NextResponse.json(
        { error: "Error al crear el comprobante", details: errorCabecera.message },
        { status: 500 }
      )
    }

    // Insertar detalles
    const detallesData = detalles.map((det: ComprobanteDetalle, index: number) => ({
      comprobante_id: comprobanteCreado.id,
      cuenta: det.cuenta, // string "111001003"
      auxiliar: det.auxiliar ?? null, // string o null
      glosa: det.glosa ?? null,
      nro_ot: det.nro_ot ?? null,
      debe_bs: det.debe_bs ?? 0,
      haber_bs: det.haber_bs ?? 0,
      debe_usd: det.debe_usd ?? 0,
      haber_usd: det.haber_usd ?? 0,
      lc: det.lc ?? false,
      orden: index + 1,
    }))

    const { error: errorDetalles } = await supabase
      .from("comprobante_detalle")
      .insert(detallesData)

    if (errorDetalles) {
      console.error("Error creating detalles:", errorDetalles)
      // Intentar eliminar el comprobante creado
      await supabase.from("comprobantes").delete().eq("id", comprobanteCreado.id)
      return NextResponse.json(
        { error: "Error al crear los detalles", details: errorDetalles.message },
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
      .eq("id", comprobanteCreado.id)
      .single()

    return NextResponse.json({
      success: true,
      data: comprobanteCompleto,
      message: "Comprobante creado correctamente",
    })
  } catch (error: any) {
    console.error("Error in POST /api/contabilidad/comprobantes:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error?.message },
      { status: 500 }
    )
  }
}

