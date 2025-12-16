import { NextRequest, NextResponse } from "next/server"
import { getSupabaseUser, getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"
import type { Presupuesto } from "@/lib/types/contabilidad"

// GET - Listar todos los presupuestos
export async function GET(request: NextRequest) {
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

    let useAdmin = false

    const { searchParams } = new URL(request.url)
    const gestion = searchParams.get("gestion")
    const cuenta = searchParams.get("cuenta")
    const aprobado = searchParams.get("aprobado")

    // Construir query
    let query = supabase
      .from("presupuestos")
      .select("*", { count: "exact" })
      .eq("empresa_id", 1)
      .order("gestion", { ascending: false })
      .order("cuenta", { ascending: true })

    if (gestion) {
      query = query.eq("gestion", parseInt(gestion))
    }
    if (cuenta) {
      query = query.ilike("cuenta", `%${cuenta}%`)
    }
    if (aprobado !== null && aprobado !== undefined) {
      query = query.eq("aprobado", aprobado === "true")
    }

    let { data, error, count } = await query

    // Si hay error, intentar con admin
    if (error || (!data || data.length === 0)) {
      const supabaseAdmin = getSupabaseAdmin()
      let adminQuery = supabaseAdmin
        .from("presupuestos")
        .select("*", { count: "exact" })
        .eq("empresa_id", 1)
        .order("gestion", { ascending: false })
        .order("cuenta", { ascending: true })

      if (gestion) {
        adminQuery = adminQuery.eq("gestion", parseInt(gestion))
      }
      if (cuenta) {
        adminQuery = adminQuery.ilike("cuenta", `%${cuenta}%`)
      }
      if (aprobado !== null && aprobado !== undefined) {
        adminQuery = adminQuery.eq("aprobado", aprobado === "true")
      }

      const { data: adminData, error: adminError, count: adminCount } = await adminQuery

      if (!adminError && adminData && adminData.length > 0) {
        data = adminData
        count = adminCount
        error = null
        useAdmin = true
      }
    }

    if (error) {
      console.error("Error fetching presupuestos:", error)
      return NextResponse.json(
        { error: "Error al obtener los presupuestos", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        total: count || 0,
      },
    })
  } catch (error: any) {
    console.error("Error in GET /api/contabilidad/presupuestos:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error?.message },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo presupuesto
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
    const { gestion, cuenta, tipo_cambio, aprobado, enero, febrero, marzo, abril, mayo, junio, julio, agosto, septiembre, octubre, noviembre, diciembre } = body

    // Validaciones básicas
    if (!gestion || !cuenta) {
      return NextResponse.json(
        { error: "Gestión y cuenta son requeridos" },
        { status: 400 }
      )
    }

    // Validar que no exista un presupuesto duplicado (empresa_id + gestion + cuenta)
    const { data: existente, error: errorExistente } = await supabase
      .from("presupuestos")
      .select("id")
      .eq("empresa_id", 1)
      .eq("gestion", gestion)
      .eq("cuenta", cuenta)
      .single()

    if (existente) {
      return NextResponse.json(
        { error: "Ya existe un presupuesto para esta gestión y cuenta" },
        { status: 400 }
      )
    }

    // Preparar datos
    const presupuestoData: any = {
      empresa_id: 1,
      gestion: parseInt(gestion),
      cuenta: cuenta, // string código contable
      tipo_cambio: tipo_cambio || 1,
      aprobado: aprobado || false,
      enero: enero || 0,
      febrero: febrero || 0,
      marzo: marzo || 0,
      abril: abril || 0,
      mayo: mayo || 0,
      junio: junio || 0,
      julio: julio || 0,
      agosto: agosto || 0,
      septiembre: septiembre || 0,
      octubre: octubre || 0,
      noviembre: noviembre || 0,
      diciembre: diciembre || 0,
    }

    // Insertar presupuesto
    const { data: presupuestoCreado, error: errorInsert } = await supabase
      .from("presupuestos")
      .insert(presupuestoData)
      .select()
      .single()

    if (errorInsert) {
      console.error("Error creating presupuesto:", errorInsert)
      return NextResponse.json(
        { error: "Error al crear el presupuesto", details: errorInsert.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: presupuestoCreado,
      message: "Presupuesto creado correctamente",
    })
  } catch (error: any) {
    console.error("Error in POST /api/contabilidad/presupuestos:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error?.message },
      { status: 500 }
    )
  }
}



