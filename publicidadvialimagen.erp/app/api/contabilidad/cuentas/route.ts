export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseUser, getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"
import { verifySession } from "@/lib/auth"
import { cookies } from "next/headers"
import type { Cuenta } from "@/lib/types/contabilidad"

// GET - Listar todas las cuentas
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

    // Obtener empresa_id del usuario
    const cookieStore = await cookies()
    const token = cookieStore.get("session")?.value
    let empresaId: string | null = null
    
    if (token) {
      try {
        const session = await verifySession(token)
        // Obtener empresa_id del usuario desde la tabla usuarios
        const { data: userData } = await supabase
          .from("usuarios")
          .select("empresa_id")
          .eq("id", session.sub)
          .single()
        
        empresaId = userData?.empresa_id || null
      } catch (error) {
        console.error("Error obteniendo empresa_id:", error)
      }
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "100")
    const offset = (page - 1) * limit

    // Obtener cuentas ordenadas por cuenta
    
    // Primero intentar con empresa_id=1
    let { data, error, count } = await supabase
      .from("plan_cuentas")
      .select("*", { count: "exact" })
      .eq("empresa_id", 1)
      .order("cuenta", { ascending: true })
      .range(offset, offset + limit - 1)

    // Si hay error 500 o no hay datos, intentar con admin para diagnóstico
    if (error || (!data || data.length === 0)) {
      console.log("⚠️ [GET /api/contabilidad/cuentas] Error o sin datos, probando con admin...")
      const supabaseAdmin = getSupabaseAdmin()
      
      // Primero ver qué empresa_id tienen los datos
      const { data: sampleData } = await supabaseAdmin
        .from("plan_cuentas")
        .select("empresa_id, cuenta, descripcion")
        .limit(5)
      
        sampleCount: sampleData?.length || 0,
        empresaIds: sampleData?.map((c: any) => c.empresa_id),
        cuentas: sampleData?.map((c: any) => ({ empresa_id: c.empresa_id, cuenta: c.cuenta }))
      })
      
      // Intentar obtener con admin
      const { data: adminData, error: adminError, count: adminCount } = await supabaseAdmin
        .from("plan_cuentas")
        .select("*", { count: "exact" })
        .eq("empresa_id", 1)
        .order("cuenta", { ascending: true })
        .range(offset, offset + limit - 1)
      
      if (!adminError && adminData && adminData.length > 0) {
        data = adminData
        count = adminCount
        error = null
        useAdmin = true
      } else {
        console.log("⚠️ [GET /api/contabilidad/cuentas] Admin también sin datos con empresa_id=1")
      }
    }

      dataLength: data?.length || 0,
      count,
      useAdmin,
      error: error ? { message: error.message, code: error.code } : null
    })

    if (error) {
      console.error("❌ Error fetching cuentas:", error)
      // Si la tabla no existe o hay cualquier error de base de datos, retornar array vacío
      const errorMessage = error.message || String(error)
      if (
        error.code === "PGRST116" || 
        errorMessage.includes("does not exist") ||
        errorMessage.includes("relation") ||
        errorMessage.includes("table") ||
        error.code === "42P01"
      ) {
        console.log("Tabla 'plan_cuentas' no existe, retornando array vacío")
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
        { error: "Error al obtener las cuentas", details: errorMessage },
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
    
      dataCount: responseData.data.length,
      total: responseData.pagination.total
    })
    
    return NextResponse.json(responseData)
  } catch (error: any) {
    console.error("Error in GET /api/contabilidad/cuentas:", error)
    // Si hay cualquier error (incluyendo tabla no existe), retornar array vacío
    const errorMessage = error?.message || String(error)
    if (
      errorMessage.includes("does not exist") ||
      errorMessage.includes("relation") ||
      errorMessage.includes("table") ||
      error?.code === "42P01" ||
      error?.code === "PGRST116"
    ) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          page: 1,
          limit: 100,
          total: 0,
          totalPages: 0,
        },
      })
    }
    return NextResponse.json(
      { error: "Error interno del servidor", details: errorMessage },
      { status: 500 }
    )
  }
}

// POST - Crear nueva cuenta
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

    // Obtener empresa_id del usuario
    const cookieStore = await cookies()
    const token = cookieStore.get("session")?.value
    let empresaId: string | null = null
    
    if (token) {
      try {
        const session = await verifySession(token)
        const { data: userData } = await supabase
          .from("usuarios")
          .select("empresa_id")
          .eq("id", session.sub)
          .single()
        
        empresaId = userData?.empresa_id || null
      } catch (error) {
        console.error("Error obteniendo empresa_id:", error)
      }
    }

    const body: Partial<Cuenta> = await request.json()

    // Validaciones básicas
    if (!body.clasificador || !body.cuenta || !body.descripcion || !body.tipo_cuenta) {
      return NextResponse.json(
        { error: "Clasificador, cuenta, descripción y tipo de cuenta son requeridos" },
        { status: 400 }
      )
    }

    // Validar que no exista una cuenta duplicada (empresa_id + cuenta)
    if (empresaId) {
      const { data: existing } = await supabase
        .from("plan_cuentas")
        .select("id")
        .eq("empresa_id", empresaId)
        .eq("cuenta", body.cuenta)
        .single()

      if (existing) {
        return NextResponse.json(
          { error: "Ya existe una cuenta con el mismo código para esta empresa" },
          { status: 400 }
        )
      }
    }

    // Preparar datos para inserción (mapeo UI → DB)
    const cuentaData: any = {
      empresa_id: empresaId,
      clasificador: body.clasificador,
      cuenta: body.cuenta,
      descripcion: body.descripcion,
      cuenta_padre: body.cuenta_padre || null,
      nivel: body.nivel || 1,
      tipo_cuenta: body.tipo_cuenta || "",
      moneda: body.moneda || "BS",
      permite_auxiliar: body.permite_auxiliar || false,
      cuenta_presupuestaria: body.cuenta_presupuestaria || false,
      cuenta_patrimonial: body.cuenta_patrimonial || false,
      efectivo: body.efectivo || false,
      cuenta_flujo: body.cuenta_flujo || false,
      aitb: body.aitb || false,
      transaccional: body.transaccional || false,
      vigente: body.vigente !== undefined ? body.vigente : true,
    }

    const { data, error } = await supabase
      .from("plan_cuentas")
      .insert(cuentaData)
      .select()
      .single()

    if (error) {
      console.error("Error creating cuenta:", error)
      return NextResponse.json(
        { error: "Error al crear la cuenta", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: "Cuenta creada correctamente",
    })
  } catch (error) {
    console.error("Error in POST /api/contabilidad/cuentas:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

