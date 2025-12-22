import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"
import { verifySession } from "@/lib/auth"
import { cookies } from "next/headers"
import type { AsientoAperturaInput } from "@/lib/types/contabilidad"

// POST - Generar Asiento de Apertura
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
    const { gestion, cotizacion, fecha, concepto } = body

    // Validaciones básicas
    if (!gestion || !cotizacion || !fecha) {
      return NextResponse.json(
        { error: "Gestión, cotización y fecha son requeridos" },
        { status: 400 }
      )
    }

    if (cotizacion <= 0) {
      return NextResponse.json(
        { error: "La cotización debe ser mayor a 0" },
        { status: 400 }
      )
    }

    // Validar que NO exista otro comprobante de apertura para esta empresa + gestión
    const { data: existente, error: errorExistente } = await supabase
      .from("comprobantes")
      .select("id, numero")
      .eq("empresa_id", empresaId)
      .eq("gestion", parseInt(gestion))
      .eq("tipo_asiento", "Apertura")
      .single()

    if (existente) {
      return NextResponse.json(
        {
          error: `Ya existe un asiento de apertura para la gestión ${gestion}. Solo se permite un asiento de apertura por gestión.`,
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
      periodo: 1, // Apertura siempre en periodo 1 (enero)
      origen: "Contabilidad",
      tipo_comprobante: "Diario", // Usar "Diario" como base (el tipo "Apertura" no existe en TipoComprobante)
      tipo_asiento: "Apertura",
      fecha: fecha,
      moneda: "BOB",
      tipo_cambio: cotizacion,
      concepto: concepto || `Asiento de apertura gestión ${gestion}`,
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
      console.error("Error creating comprobante for asiento apertura:", errorInsert)
      return NextResponse.json(
        { error: "Error al crear el comprobante", details: errorInsert.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: comprobanteCreado,
      message: "Asiento de apertura creado en estado BORRADOR",
    })
  } catch (error: any) {
    console.error("Error in POST /api/contabilidad/asiento-apertura:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error?.message },
      { status: 500 }
    )
  }
}



