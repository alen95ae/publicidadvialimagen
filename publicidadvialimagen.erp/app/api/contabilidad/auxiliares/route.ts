export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseUser } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"
import type { Auxiliar } from "@/lib/types/contabilidad"

// GET - Listar todos los auxiliares
export async function GET(request: NextRequest) {
  try {
    // Verificar permisos
    const permiso = await requirePermiso("contabilidad", "ver")
    if (permiso instanceof Response) {
      return permiso
    }

    const supabase = await getSupabaseUser(request)
    if (!supabase) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "100")
    const offset = (page - 1) * limit

    // Obtener auxiliares
    const { data, error, count } = await supabase
      .from("auxiliares")
      .select("*", { count: "exact" })
      .order("tipo_auxiliar", { ascending: true })
      .order("codigo", { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Error fetching auxiliares:", error)
      // Si la tabla no existe, retornar array vacío en lugar de error
      if (error.code === "PGRST116" || error.message?.includes("does not exist")) {
        return NextResponse.json({
          success: true,
          data: [],
          pagination: {
            page: 1,
            limit,
            total: 0,
            totalPages: 0,
          },
        })
      }
      return NextResponse.json(
        { error: "Error al obtener los auxiliares", details: error.message },
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
  } catch (error) {
    console.error("Error in GET /api/contabilidad/auxiliares:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo auxiliar
export async function POST(request: NextRequest) {
  try {
    // Verificar permisos
    const permiso = await requirePermiso("contabilidad", "editar")
    if (permiso instanceof Response) {
      return permiso
    }

    const supabase = await getSupabaseUser(request)
    if (!supabase) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body: Partial<Auxiliar> = await request.json()

    // Validaciones básicas
    if (!body.tipo_auxiliar || !body.codigo || !body.nombre) {
      return NextResponse.json(
        { error: "Tipo auxiliar, código y nombre son requeridos" },
        { status: 400 }
      )
    }

    // Preparar datos para inserción
    const auxiliarData: Partial<Auxiliar> = {
      tipo_auxiliar: body.tipo_auxiliar,
      codigo: body.codigo,
      nombre: body.nombre,
      cuenta_asociada: body.cuenta_asociada || null,
      moneda: body.moneda || "BOB",
      cuenta_bancaria_o_caja: body.cuenta_bancaria_o_caja || false,
      departamento: body.departamento || null,
      direccion: body.direccion || null,
      telefono: body.telefono || null,
      email: body.email || null,
      nit: body.nit || null,
      autorizacion: body.autorizacion || null,
      vigencia: body.vigencia !== undefined ? body.vigencia : true,
    }

    const { data, error } = await supabase
      .from("auxiliares")
      .insert(auxiliarData)
      .select()
      .single()

    if (error) {
      console.error("Error creating auxiliar:", error)
      return NextResponse.json(
        { error: "Error al crear el auxiliar", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: "Auxiliar creado correctamente",
    })
  } catch (error) {
    console.error("Error in POST /api/contabilidad/auxiliares:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

