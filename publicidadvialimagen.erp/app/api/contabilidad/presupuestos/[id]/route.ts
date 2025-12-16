import { NextRequest, NextResponse } from "next/server"
import { getSupabaseUser, getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"
import type { Presupuesto } from "@/lib/types/contabilidad"

// GET - Obtener un presupuesto por ID
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

    let supabase = await getSupabaseUser(request)
    if (!supabase) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener presupuesto
    let { data, error } = await supabase
      .from("presupuestos")
      .select("*")
      .eq("id", params.id)
      .eq("empresa_id", 1)
      .single()

    // Si hay error, intentar con admin
    if (error) {
      const supabaseAdmin = getSupabaseAdmin()
      const { data: adminData, error: adminError } = await supabaseAdmin
        .from("presupuestos")
        .select("*")
        .eq("id", params.id)
        .eq("empresa_id", 1)
        .single()

      if (!adminError && adminData) {
        data = adminData
        error = null
      }
    }

    if (error) {
      console.error("Error fetching presupuesto:", error)
      return NextResponse.json(
        { error: "Error al obtener el presupuesto" },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: "Presupuesto no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error("Error in GET /api/contabilidad/presupuestos/[id]:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// PUT - Actualizar un presupuesto
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

    // Usar admin directamente para evitar problemas con RLS
    const supabase = getSupabaseAdmin()

    // Verificar que el presupuesto no esté aprobado
    const { data: presupuestoActual } = await supabase
      .from("presupuestos")
      .select("aprobado, gestion, cuenta")
      .eq("id", params.id)
      .eq("empresa_id", 1)
      .single()

    if (!presupuestoActual) {
      return NextResponse.json(
        { error: "Presupuesto no encontrado" },
        { status: 404 }
      )
    }

    if (presupuestoActual.aprobado) {
      return NextResponse.json(
        { error: "No se puede editar un presupuesto aprobado" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { tipo_cambio, enero, febrero, marzo, abril, mayo, junio, julio, agosto, septiembre, octubre, noviembre, diciembre } = body

    // Validar que no se intente cambiar gestión o cuenta (solo se pueden editar los importes)
    if (body.gestion && body.gestion !== presupuestoActual.gestion) {
      return NextResponse.json(
        { error: "No se puede cambiar la gestión de un presupuesto existente" },
        { status: 400 }
      )
    }

    if (body.cuenta && body.cuenta !== presupuestoActual.cuenta) {
      return NextResponse.json(
        { error: "No se puede cambiar la cuenta de un presupuesto existente" },
        { status: 400 }
      )
    }

    // Actualizar presupuesto (solo campos editables)
    const updateData: any = {
      tipo_cambio: tipo_cambio ?? presupuestoActual.tipo_cambio,
      enero: enero ?? 0,
      febrero: febrero ?? 0,
      marzo: marzo ?? 0,
      abril: abril ?? 0,
      mayo: mayo ?? 0,
      junio: junio ?? 0,
      julio: julio ?? 0,
      agosto: agosto ?? 0,
      septiembre: septiembre ?? 0,
      octubre: octubre ?? 0,
      noviembre: noviembre ?? 0,
      diciembre: diciembre ?? 0,
    }

    const { data: presupuestoActualizado, error: errorUpdate } = await supabase
      .from("presupuestos")
      .update(updateData)
      .eq("id", params.id)
      .eq("empresa_id", 1)
      .select()
      .single()

    if (errorUpdate) {
      console.error("Error updating presupuesto:", errorUpdate)
      return NextResponse.json(
        { error: "Error al actualizar el presupuesto", details: errorUpdate.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: presupuestoActualizado,
      message: "Presupuesto actualizado correctamente",
    })
  } catch (error: any) {
    console.error("Error in PUT /api/contabilidad/presupuestos/[id]:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error?.message },
      { status: 500 }
    )
  }
}


