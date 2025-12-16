import { NextRequest, NextResponse } from "next/server"
import { getSupabaseUser } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"
import { verifySession } from "@/lib/auth"
import { cookies } from "next/headers"
import type { Cuenta } from "@/lib/types/contabilidad"

// GET - Obtener una cuenta por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    let query = supabase
      .from("plan_cuentas")
      .select("*")
      .eq("id", params.id)

    // Filtrar por empresa_id si existe
    if (empresaId) {
      query = query.eq("empresa_id", empresaId)
    }

    const { data, error } = await query.single()

    if (error) {
      console.error("Error fetching cuenta:", error)
      return NextResponse.json(
        { error: "Error al obtener la cuenta" },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: "Cuenta no encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error("Error in GET /api/contabilidad/cuentas/[id]:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// PUT - Actualizar una cuenta
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Obtener la cuenta actual para validaciones
    const { data: cuentaActual } = await supabase
      .from("plan_cuentas")
      .select("*")
      .eq("id", params.id)
      .single()

    if (!cuentaActual) {
      return NextResponse.json(
        { error: "Cuenta no encontrada" },
        { status: 404 }
      )
    }

    // Validación: No permitir marcar transaccional = true si existen cuentas hijas
    if (body.transaccional === true) {
      const { data: cuentasHijas } = await supabase
        .from("plan_cuentas")
        .select("id")
        .eq("cuenta_padre", cuentaActual.cuenta)
        .limit(1)

      if (cuentasHijas && cuentasHijas.length > 0) {
        return NextResponse.json(
          { error: "No se puede marcar como transaccional una cuenta que tiene cuentas hijas" },
          { status: 400 }
        )
      }
    }

    // Preparar datos para actualización (mapeo UI → DB)
    const updateData: any = {}
    if (body.clasificador !== undefined) updateData.clasificador = body.clasificador
    if (body.descripcion !== undefined) updateData.descripcion = body.descripcion
    if (body.cuenta_padre !== undefined) updateData.cuenta_padre = body.cuenta_padre
    if (body.tipo_cuenta !== undefined) updateData.tipo_cuenta = body.tipo_cuenta
    if (body.moneda !== undefined) updateData.moneda = body.moneda
    if (body.nivel !== undefined) updateData.nivel = body.nivel
    if (body.permite_auxiliar !== undefined) updateData.permite_auxiliar = body.permite_auxiliar
    if (body.cuenta_presupuestaria !== undefined) updateData.cuenta_presupuestaria = body.cuenta_presupuestaria
    if (body.cuenta_patrimonial !== undefined) updateData.cuenta_patrimonial = body.cuenta_patrimonial
    if (body.efectivo !== undefined) updateData.efectivo = body.efectivo
    if (body.cuenta_flujo !== undefined) updateData.cuenta_flujo = body.cuenta_flujo
    if (body.aitb !== undefined) updateData.aitb = body.aitb
    if (body.transaccional !== undefined) updateData.transaccional = body.transaccional
    if (body.vigente !== undefined) updateData.vigente = body.vigente

    // NO actualizar cuenta (solo lectura en edición)
    // NO actualizar empresa_id

    let query = supabase
      .from("plan_cuentas")
      .update(updateData)
      .eq("id", params.id)

    // Filtrar por empresa_id si existe
    if (empresaId) {
      query = query.eq("empresa_id", empresaId)
    }

    const { data, error } = await query.select().single()

    if (error) {
      console.error("Error updating cuenta:", error)
      return NextResponse.json(
        { error: "Error al actualizar la cuenta", details: error.message },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: "Cuenta no encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: "Cuenta actualizada correctamente",
    })
  } catch (error) {
    console.error("Error in PUT /api/contabilidad/cuentas/[id]:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar una cuenta
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar permisos
    const permiso = await requirePermiso("contabilidad", "eliminar")
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

    // Obtener la cuenta para validar
    let query = supabase
      .from("plan_cuentas")
      .select("cuenta")
      .eq("id", params.id)

    if (empresaId) {
      query = query.eq("empresa_id", empresaId)
    }

    const { data: cuentaActual } = await query.single()

    if (!cuentaActual) {
      return NextResponse.json(
        { error: "Cuenta no encontrada" },
        { status: 404 }
      )
    }

    // Validación: No permitir borrar cuentas que tengan hijas
    const { data: cuentasHijas } = await supabase
      .from("plan_cuentas")
      .select("id")
      .eq("cuenta_padre", cuentaActual.cuenta)
      .limit(1)

    if (cuentasHijas && cuentasHijas.length > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar una cuenta que tiene cuentas hijas" },
        { status: 400 }
      )
    }

    // Eliminar la cuenta
    let deleteQuery = supabase
      .from("plan_cuentas")
      .delete()
      .eq("id", params.id)

    if (empresaId) {
      deleteQuery = deleteQuery.eq("empresa_id", empresaId)
    }

    const { error } = await deleteQuery

    if (error) {
      console.error("Error deleting cuenta:", error)
      return NextResponse.json(
        { error: "Error al eliminar la cuenta", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Cuenta eliminada correctamente",
    })
  } catch (error) {
    console.error("Error in DELETE /api/contabilidad/cuentas/[id]:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
