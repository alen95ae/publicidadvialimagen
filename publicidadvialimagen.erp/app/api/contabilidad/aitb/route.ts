export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"
import { verifySession } from "@/lib/auth"
import { cookies } from "next/headers"

// POST - Generar Ajuste AITB
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
    const { cuenta_banco, periodo, gestion, fecha_desde, fecha_hasta, tipo_cambio } = body

    // Validaciones básicas
    if (!cuenta_banco || !periodo || !gestion || !fecha_desde || !fecha_hasta || !tipo_cambio) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      )
    }

    if (tipo_cambio <= 0) {
      return NextResponse.json(
        { error: "El tipo de cambio debe ser mayor a 0" },
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

    // Validar que NO exista otro AITB para empresa_id + gestion + periodo
    const { data: existente, error: errorExistente } = await supabase
      .from("comprobantes")
      .select("id, numero")
      .eq("empresa_id", empresaId)
      .eq("gestion", parseInt(gestion))
      .eq("periodo", parseInt(periodo))
      .eq("tipo_asiento", "Ajuste") // Usar "Ajuste" como tipo_asiento para AITB
      .ilike("glosa", "%AITB%") // Buscar por glosa que contenga AITB
      .single()

    if (existente) {
      return NextResponse.json(
        {
          error: `Ya existe un ajuste AITB para la gestión ${gestion} y periodo ${periodo}. Solo se permite un ajuste AITB por gestión y periodo.`,
          details: `Comprobante existente: ${existente.numero}`,
        },
        { status: 400 }
      )
    }

    // Si hay error pero no es porque no existe, verificar
    if (errorExistente && errorExistente.code !== "PGRST116") {
      console.error("Error verificando comprobante existente:", errorExistente)
      // Continuar si el error es "no encontrado" (PGRST116)
    }

    // Preparar datos del comprobante
    // El número se asignará únicamente al aprobar el comprobante
    const comprobanteData: any = {
      empresa_id: empresaId,
      numero: null, // Borradores siempre tienen numero = null
      gestion: parseInt(gestion),
      periodo: parseInt(periodo),
      origen: "Tesorería", // Mapeado desde 'TESORERIA'
      tipo_comprobante: "Diario", // Usar "Diario" como base (el tipo "AJUSTE" no existe en el enum)
      tipo_asiento: "Ajuste", // Usar "Ajuste" como tipo_asiento
      fecha: fecha_hasta,
      moneda: "BOB",
      tipo_cambio: tipo_cambio,
      concepto: "Ajuste de saldos AITB",
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
      console.error("Error creating comprobante for AITB:", errorInsert)
      return NextResponse.json(
        { error: "Error al crear el comprobante", details: errorInsert.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: comprobanteCreado,
      message: "Proceso AITB creado en estado BORRADOR",
    })
  } catch (error: any) {
    console.error("Error in POST /api/contabilidad/aitb:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error?.message },
      { status: 500 }
    )
    }
}



