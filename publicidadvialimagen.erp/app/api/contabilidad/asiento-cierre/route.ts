export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"
import { verifySession } from "@/lib/auth"
import { cookies } from "next/headers"

// POST - Generar Asiento de Cierre
export async function POST(request: NextRequest) {
  try {
    // Verificar permisos - usar permiso genérico de contabilidad editar
    const permiso = await requirePermiso("contabilidad", "editar")
    if (permiso instanceof Response) {
      return permiso
    }

    // Obtener usuario autenticado para empresa_id
    const cookieStore = await cookies()
    const token = cookieStore.get("session")?.value

    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const session = await verifySession(token)
    if (!session) {
      return NextResponse.json({ error: "Sesión inválida" }, { status: 401 })
    }

    // Usar admin directamente para evitar problemas con RLS
    const supabase = getSupabaseAdmin()

    // Obtener empresa_id del usuario
    const { data: userData, error: userError } = await supabase
      .from("usuarios")
      .select("empresa_id")
      .eq("id", session.sub)
      .single()

    if (userError || !userData) {
      console.error("Error fetching user empresa_id:", userError)
      return NextResponse.json(
        { error: "Error al obtener datos del usuario" },
        { status: 500 }
      )
    }

    const empresaId = userData.empresa_id || 1

    const body = await request.json()
    const { fecha_desde, fecha_hasta, cotizacion_usd, concepto } = body

    // Validaciones básicas
    if (!fecha_desde || !fecha_hasta || !concepto) {
      return NextResponse.json(
        { error: "Fechas y concepto son requeridos" },
        { status: 400 }
      )
    }

    if (!cotizacion_usd || cotizacion_usd <= 0) {
      return NextResponse.json(
        { error: "La cotización USD debe ser mayor a 0" },
        { status: 400 }
      )
    }

    // Validar que fecha_hasta sea mayor o igual a fecha_desde
    const fechaDesde = new Date(fecha_desde)
    const fechaHasta = new Date(fecha_hasta)
    if (fechaHasta < fechaDesde) {
      return NextResponse.json(
        { error: "La fecha hasta debe ser mayor o igual a la fecha desde" },
        { status: 400 }
      )
    }

    // Obtener gestión y periodo de la fecha_hasta
    const fechaHastaObj = new Date(fecha_hasta)
    const gestion = fechaHastaObj.getFullYear()
    const periodo = fechaHastaObj.getMonth() + 1 // 1-12

    // Preparar datos del comprobante
    // El número se asignará únicamente al aprobar el comprobante
    const comprobanteData: any = {
      empresa_id: empresaId,
      numero: null, // Borradores siempre tienen numero = null
      gestion: gestion,
      periodo: periodo,
      origen: "Contabilidad",
      tipo_comprobante: "Diario", // Usar "Diario" como base para cierres
      tipo_asiento: "Cierre",
      fecha: fecha_hasta,
      moneda: "BOB",
      tipo_cambio: cotizacion_usd,
      concepto: concepto.trim(),
      beneficiario: null,
      nro_cheque: null,
      estado: "BORRADOR",
    }

    // Insertar comprobante
    const { data: comprobanteCreado, error: errorInsert } = await supabase
      .from("comprobantes")
      .insert(comprobanteData)
      .select()
      .single()

    if (errorInsert) {
      console.error("Error creating comprobante for asiento cierre:", errorInsert)
      return NextResponse.json(
        { error: "Error al crear el comprobante", details: errorInsert.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: comprobanteCreado,
      message: "Asiento de cierre generado en estado BORRADOR. Pendiente de revisión.",
    })
  } catch (error: any) {
    console.error("Error in POST /api/contabilidad/asiento-cierre:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error?.message },
      { status: 500 }
    )
  }
}



