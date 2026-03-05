export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"

// GET - Listar todas las divisas
export async function GET(request: NextRequest) {
  try {
    const permiso = await requirePermiso("contabilidad", "ver")
    if (permiso instanceof Response) return permiso

    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "100")
    const offset = (page - 1) * limit
    const estado = searchParams.get("estado") || ""

    let query = supabase
      .from("divisas")
      .select("*", { count: "exact" })
      .order("codigo", { ascending: true })
      .range(offset, offset + limit - 1)

    if (estado) {
      query = query.eq("estado", estado)
    }

    const { data, error, count } = await query

    if (error) {
      console.error("Error fetching divisas:", error)
      return NextResponse.json(
        { error: "Error al obtener las divisas", details: error.message },
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
    console.error("Error in GET /api/contabilidad/divisas:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error?.message },
      { status: 500 }
    )
  }
}

// POST - Crear nueva divisa
export async function POST(request: NextRequest) {
  try {
    const permiso = await requirePermiso("contabilidad", "editar")
    if (permiso instanceof Response) return permiso

    const supabase = getSupabaseAdmin()
    const body = await request.json()
    const { codigo, nombre, simbolo, tipo_cambio, es_base, estado } = body

    if (!codigo || !nombre || simbolo === undefined || simbolo === null) {
      return NextResponse.json(
        { error: "Código, nombre y símbolo son requeridos" },
        { status: 400 }
      )
    }

    const tipoCambioNum = Number(tipo_cambio)
    if (Number.isNaN(tipoCambioNum) || tipoCambioNum < 0) {
      return NextResponse.json(
        { error: "Tipo de cambio debe ser un número mayor o igual a 0" },
        { status: 400 }
      )
    }

    const { data: existente } = await supabase
      .from("divisas")
      .select("id, codigo")
      .eq("codigo", String(codigo).trim().toUpperCase())
      .single()

    if (existente) {
      return NextResponse.json(
        { error: `Ya existe una divisa con el código "${codigo}"` },
        { status: 400 }
      )
    }

    const divisaData: Record<string, unknown> = {
      codigo: String(codigo).trim().toUpperCase(),
      nombre: String(nombre).trim(),
      simbolo: String(simbolo).trim(),
      tipo_cambio: tipoCambioNum,
      es_base: Boolean(es_base),
      estado: estado && String(estado).trim() ? String(estado).trim().toUpperCase() : "ACTIVO",
    }

    const { data: divisaCreada, error: errorInsert } = await supabase
      .from("divisas")
      .insert(divisaData)
      .select()
      .single()

    if (errorInsert) {
      console.error("Error creating divisa:", errorInsert)
      return NextResponse.json(
        { error: "Error al crear la divisa", details: errorInsert.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: divisaCreada,
      message: "Divisa creada correctamente",
    })
  } catch (error: any) {
    console.error("Error in POST /api/contabilidad/divisas:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error?.message },
      { status: 500 }
    )
  }
}
