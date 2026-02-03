export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"

// GET - Listar sucursales (opcional: empresa_id para filtrar)
export async function GET(request: NextRequest) {
  try {
    const permiso = await requirePermiso("contabilidad", "ver")
    if (permiso instanceof Response) return permiso

    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "100")
    const empresa_id = searchParams.get("empresa_id") || ""
    const offset = (page - 1) * limit

    let query = supabase
      .from("sucursales")
      .select("*, empresas(codigo, nombre)", { count: "exact" })
      .order("codigo", { ascending: true })
      .range(offset, offset + limit - 1)

    if (empresa_id) {
      query = query.eq("empresa_id", empresa_id)
    }

    const { data, error, count } = await query

    if (error) {
      console.error("Error fetching sucursales:", error)
      return NextResponse.json(
        { error: "Error al obtener las sucursales", details: error.message },
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
    console.error("Error in GET /api/contabilidad/sucursales:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error?.message },
      { status: 500 }
    )
  }
}

// POST - Crear nueva sucursal
export async function POST(request: NextRequest) {
  try {
    const permiso = await requirePermiso("contabilidad", "editar")
    if (permiso instanceof Response) return permiso

    const supabase = getSupabaseAdmin()
    const body = await request.json()
    const {
      empresa_id,
      codigo,
      nombre,
      representante,
      direccion,
      sucursal,
      telefonos,
      email,
      pais,
      ciudad,
      localidad,
      nit,
    } = body

    if (!empresa_id || !codigo || !nombre) {
      return NextResponse.json(
        { error: "Empresa, código y nombre son requeridos" },
        { status: 400 }
      )
    }

    const { data: existente } = await supabase
      .from("sucursales")
      .select("id, codigo")
      .eq("empresa_id", empresa_id)
      .eq("codigo", codigo.trim())
      .maybeSingle()

    if (existente) {
      return NextResponse.json(
        { error: `Ya existe una sucursal con el código "${codigo}" en esta empresa` },
        { status: 400 }
      )
    }

    const sucursalData: Record<string, unknown> = {
      empresa_id,
      codigo: codigo.trim(),
      nombre: nombre.trim(),
      representante: representante?.trim() || null,
      direccion: direccion?.trim() || null,
      sucursal: sucursal?.trim() || null,
      telefonos: telefonos?.trim() || null,
      email: email?.trim() || null,
      pais: pais?.trim() || null,
      ciudad: ciudad?.trim() || null,
      localidad: localidad?.trim() || null,
      nit: nit?.trim() || null,
    }

    const { data: creada, error: errorInsert } = await supabase
      .from("sucursales")
      .insert(sucursalData)
      .select()
      .single()

    if (errorInsert) {
      console.error("Error creating sucursal:", errorInsert)
      return NextResponse.json(
        { error: "Error al crear la sucursal", details: errorInsert.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: creada,
      message: "Sucursal creada correctamente",
    })
  } catch (error: any) {
    console.error("Error in POST /api/contabilidad/sucursales:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error?.message },
      { status: 500 }
    )
  }
}
