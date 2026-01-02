export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"

// GET - Listar plantillas (con paginación opcional)
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
    const soloActivas = searchParams.get("solo_activas") === "true"

    // Construir query
    let query = supabase
      .from("plantillas_contables")
      .select("*", { count: "exact" })
      .order("nombre", { ascending: true })

    // Filtrar solo activas si se solicita
    if (soloActivas) {
      query = query.eq("activa", true)
    }

    // Aplicar paginación
    const { data: plantillas, error, count } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Error obteniendo plantillas:", error)
      return NextResponse.json(
        { error: "Error al obtener plantillas", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: plantillas || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error: any) {
    console.error("Error en GET /api/contabilidad/plantillas:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error.message },
      { status: 500 }
    )
  }
}

// POST - Crear nueva plantilla
export async function POST(request: NextRequest) {
  try {
    // Verificar permisos
    const permiso = await requirePermiso("contabilidad", "editar")
    if (permiso instanceof Response) {
      return permiso
    }

    const supabase = getSupabaseAdmin()
    const body = await request.json()

    const { codigo, nombre, descripcion, tipo_comprobante, activa } = body

    // Validaciones
    if (!codigo || !codigo.trim()) {
      return NextResponse.json(
        { error: "codigo es requerido" },
        { status: 400 }
      )
    }

    if (!nombre || !nombre.trim()) {
      return NextResponse.json(
        { error: "nombre es requerido" },
        { status: 400 }
      )
    }

    if (!tipo_comprobante || !["Diario", "Ingreso", "Egreso", "Traspaso", "Ctas por Pagar"].includes(tipo_comprobante)) {
      return NextResponse.json(
        { error: "tipo_comprobante debe ser uno de: Diario, Ingreso, Egreso, Traspaso, Ctas por Pagar" },
        { status: 400 }
      )
    }

    // Verificar que el código no exista
    const { data: existente, error: errorExistente } = await supabase
      .from("plantillas_contables")
      .select("id")
      .eq("codigo", codigo.trim())
      .single()

    if (existente) {
      return NextResponse.json(
        { error: "Ya existe una plantilla con este código" },
        { status: 400 }
      )
    }

    // Crear plantilla
    const { data, error } = await supabase
      .from("plantillas_contables")
      .insert({
        codigo: codigo.trim(),
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        tipo_comprobante,
        activa: activa !== undefined ? activa : true,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creando plantilla:", error)
      // Si es error de duplicado
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Ya existe una plantilla con este código" },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: "Error al crear plantilla", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error: any) {
    console.error("Error en POST /api/contabilidad/plantillas:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error.message },
      { status: 500 }
    )
  }
}

