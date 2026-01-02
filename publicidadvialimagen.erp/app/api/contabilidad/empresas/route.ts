export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"
import type { Empresa } from "@/lib/types/contabilidad"

// GET - Listar todas las empresas
export async function GET(request: NextRequest) {
  try {
    // Verificar permisos
    const permiso = await requirePermiso("contabilidad", "ver")
    if (permiso instanceof Response) {
      return permiso
    }

    const supabase = getSupabaseAdmin()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "100")
    const offset = (page - 1) * limit

    // Obtener empresas ordenadas por código
    const { data, error, count } = await supabase
      .from("empresas")
      .select("*", { count: "exact" })
      .order("codigo", { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Error fetching empresas:", error)
      return NextResponse.json(
        { error: "Error al obtener las empresas", details: error.message },
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
    console.error("Error in GET /api/contabilidad/empresas:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error?.message },
      { status: 500 }
    )
  }
}

// POST - Crear nueva empresa
export async function POST(request: NextRequest) {
  try {
    // Verificar permisos
    const permiso = await requirePermiso("contabilidad", "editar")
    if (permiso instanceof Response) {
      return permiso
    }

    const supabase = getSupabaseAdmin()

    const body = await request.json()
    const { codigo, nombre, representante, direccion, casilla, telefonos, email, pais, ciudad, localidad, nit } = body

    // Validaciones básicas
    if (!codigo || !nombre) {
      return NextResponse.json(
        { error: "Código y nombre son requeridos" },
        { status: 400 }
      )
    }

    // Validar que el código sea único
    const { data: existente, error: errorExistente } = await supabase
      .from("empresas")
      .select("id, codigo")
      .eq("codigo", codigo.trim())
      .single()

    if (existente) {
      return NextResponse.json(
        { error: `Ya existe una empresa con el código "${codigo}"` },
        { status: 400 }
      )
    }

    // Preparar datos
    const empresaData: any = {
      codigo: codigo.trim(),
      nombre: nombre.trim(),
      representante: representante?.trim() || null,
      direccion: direccion?.trim() || null,
      casilla: casilla?.trim() || null,
      telefonos: telefonos?.trim() || null,
      email: email?.trim() || null,
      pais: pais?.trim() || null,
      ciudad: ciudad?.trim() || null,
      localidad: localidad?.trim() || null,
      nit: nit?.trim() || null,
    }

    // Insertar empresa
    const { data: empresaCreada, error: errorInsert } = await supabase
      .from("empresas")
      .insert(empresaData)
      .select()
      .single()

    if (errorInsert) {
      console.error("Error creating empresa:", errorInsert)
      return NextResponse.json(
        { error: "Error al crear la empresa", details: errorInsert.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: empresaCreada,
      message: "Empresa creada correctamente",
    })
  } catch (error: any) {
    console.error("Error in POST /api/contabilidad/empresas:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error?.message },
      { status: 500 }
    )
  }
}







