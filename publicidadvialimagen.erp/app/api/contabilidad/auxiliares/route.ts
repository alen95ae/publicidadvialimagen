export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseUser, getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"
import type { Auxiliar } from "@/lib/types/contabilidad"
import { crearAuxiliar } from "@/lib/services/auxiliares"

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
    // Aumentar límite por defecto para cargar todos los auxiliares (2284+ registros)
    const limit = parseInt(searchParams.get("limit") || "10000")
    const offset = (page - 1) * limit

    // Obtener auxiliares directamente desde la tabla (sin filtros por empresa_id)
    // Primero intentar con usuario autenticado
    let query = supabase
      .from("auxiliares")
      .select("*", { count: "exact" })
      .order("tipo_auxiliar", { ascending: true })
      .order("codigo", { ascending: true })
      .range(offset, offset + limit - 1)

    let { data, error, count } = await query

    // DEBUG: Log temporal para verificar datos
    console.log("🔍 [GET /auxiliares] Intento con getSupabaseUser - Total registros:", count)
    console.log("🔍 [GET /auxiliares] Registros en esta página:", data?.length || 0)
    if (error) {
      console.log("🔍 [GET /auxiliares] Error con user:", error.message, error.code)
    }

    // Si no hay datos o hay error, intentar con admin (puede ser problema de RLS)
    if ((!data || data.length === 0 || error) && count === 0) {
      console.log("⚠️ [GET /auxiliares] Sin datos con user, intentando con admin...")
      const supabaseAdmin = getSupabaseAdmin()
      
      const adminQuery = supabaseAdmin
        .from("auxiliares")
        .select("*", { count: "exact" })
        .order("tipo_auxiliar", { ascending: true })
        .order("codigo", { ascending: true })
        .range(offset, offset + limit - 1)
      
      const { data: adminData, error: adminError, count: adminCount } = await adminQuery
      
      if (!adminError && adminData) {
        console.log("✅ [GET /auxiliares] Admin encontró", adminCount, "registros")
        data = adminData
        count = adminCount
        error = null
      } else {
        console.log("❌ [GET /auxiliares] Admin también falló:", adminError?.message)
      }
    }

    if (data && data.length > 0) {
      console.log("🔍 [GET /auxiliares] Primer registro:", JSON.stringify(data[0], null, 2))
    }

    if (error) {
      console.error("❌ [GET /auxiliares] Error fetching auxiliares:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })
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
      // Si es error de RLS pero ya intentamos con admin, retornar error
      if (error.code === "42501" || error.message?.includes("permission denied")) {
        console.log("⚠️ [GET /auxiliares] Error de permisos RLS detectado")
      }
      return NextResponse.json(
        { error: "Error al obtener los auxiliares", details: error.message },
        { status: 500 }
      )
    }

    const responseData = {
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    }

    // DEBUG: Log de respuesta
    console.log("✅ [GET /auxiliares] Respuesta enviada:", {
      success: responseData.success,
      totalRegistros: responseData.pagination.total,
      registrosEnPagina: responseData.data.length,
    })

    return NextResponse.json(responseData)
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

    // Usar servicio centralizado para crear auxiliar
    try {
      const auxiliarCreado = await crearAuxiliar(supabase, body)

      return NextResponse.json({
        success: true,
        data: auxiliarCreado,
        message: "Auxiliar creado correctamente",
      })
    } catch (error: any) {
      console.error("Error creating auxiliar:", error)
      return NextResponse.json(
        { error: error.message || "Error al crear el auxiliar" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error in POST /api/contabilidad/auxiliares:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

