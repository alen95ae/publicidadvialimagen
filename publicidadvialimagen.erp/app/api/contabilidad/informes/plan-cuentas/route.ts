import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"

// GET - Informe Plan de Cuentas
export async function GET(request: NextRequest) {
  try {
    // Verificar permisos
    const permiso = await requirePermiso("contabilidad", "ver")
    if (permiso instanceof Response) {
      return permiso
    }

    const supabase = getSupabaseAdmin()

    const { searchParams } = new URL(request.url)
    const empresa = searchParams.get("empresa")
    const regional = searchParams.get("regional")
    const sucursal = searchParams.get("sucursal")
    const clasificador = searchParams.get("clasificador")
    const desde_cuenta = searchParams.get("desde_cuenta")
    const hasta_cuenta = searchParams.get("hasta_cuenta")

    // Construir query base
    let query = supabase
      .from("plan_cuentas")
      .select("cuenta, descripcion, nivel, tipo_cuenta, cuenta_padre, empresa_id, clasificador")
      .eq("empresa_id", 1) // Por ahora usar empresa_id=1
      .order("cuenta", { ascending: true })

    // Aplicar filtros opcionales
    if (clasificador) {
      query = query.eq("clasificador", clasificador)
    }

    if (desde_cuenta) {
      query = query.gte("cuenta", desde_cuenta)
    }

    if (hasta_cuenta) {
      query = query.lte("cuenta", hasta_cuenta)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching plan de cuentas:", error)
      // Si la tabla no existe, devolver array vacío
      if (
        error.code === "PGRST116" ||
        error.code === "42P01" ||
        error.message?.includes("does not exist") ||
        error.message?.includes("relation")
      ) {
        return NextResponse.json({
          success: true,
          data: [],
          message: "Tabla plan_cuentas no encontrada",
        })
      }
      return NextResponse.json(
        { error: "Error al obtener el plan de cuentas", details: error.message },
        { status: 500 }
      )
    }

    // Transformar datos para el informe
    const cuentasInforme = (data || []).map((cuenta: any) => ({
      cuenta: cuenta.cuenta,
      descripcion: cuenta.descripcion,
      nivel: cuenta.nivel,
      tipo: cuenta.tipo_cuenta || "-",
      cuenta_padre: cuenta.cuenta_padre || null,
    }))

    return NextResponse.json({
      success: true,
      data: cuentasInforme,
      total: cuentasInforme.length,
    })
  } catch (error: any) {
    console.error("Error in GET /api/contabilidad/informes/plan-cuentas:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error?.message },
      { status: 500 }
    )
  }
}


