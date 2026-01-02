export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"

// POST - Crear nueva línea de plantilla
export async function POST(request: NextRequest) {
  try {
    // Verificar permisos
    const permiso = await requirePermiso("contabilidad", "editar")
    if (permiso instanceof Response) {
      return permiso
    }

    const supabase = getSupabaseAdmin()
    const body = await request.json()

    const { plantilla_id, lado, porcentaje, cuenta_es_fija, cuenta_id, permite_auxiliar, bloqueado } = body

    // Validaciones
    if (!plantilla_id) {
      return NextResponse.json(
        { error: "plantilla_id es requerido" },
        { status: 400 }
      )
    }

    if (!lado || !["DEBE", "HABER"].includes(lado)) {
      return NextResponse.json(
        { error: "lado debe ser 'DEBE' o 'HABER'" },
        { status: 400 }
      )
    }

    if (porcentaje !== null && porcentaje !== undefined && porcentaje < 0) {
      return NextResponse.json(
        { error: "porcentaje debe ser >= 0" },
        { status: 400 }
      )
    }

    if (cuenta_es_fija && !cuenta_id) {
      return NextResponse.json(
        { error: "cuenta_id es requerido cuando cuenta_es_fija es true" },
        { status: 400 }
      )
    }

    // Validar que cuenta_id existe en plan_cuentas si se proporciona
    if (cuenta_id !== undefined && cuenta_id !== null) {
      const { data: cuentaExistente, error: errorCuenta } = await supabase
        .from("plan_cuentas")
        .select("id")
        .eq("id", cuenta_id)
        .single()

      if (errorCuenta || !cuentaExistente) {
        return NextResponse.json(
          { error: `La cuenta con ID ${cuenta_id} no existe en el plan de cuentas` },
          { status: 400 }
        )
      }
    }

    // Obtener el último orden para esta plantilla
    const { data: ultimoDetalle, error: errorUltimo } = await supabase
      .from("plantillas_contables_detalle")
      .select("orden")
      .eq("plantilla_id", plantilla_id)
      .order("orden", { ascending: false })
      .limit(1)
      .single()

    const nuevoOrden = ultimoDetalle ? ultimoDetalle.orden + 1 : 1

    // Insertar nueva línea
    const { data, error } = await supabase
      .from("plantillas_contables_detalle")
      .insert({
        plantilla_id,
        orden: nuevoOrden,
        lado,
        porcentaje: porcentaje !== null && porcentaje !== undefined ? porcentaje : null,
        cuenta_es_fija: cuenta_es_fija || false,
        cuenta_id: cuenta_id || null,
        permite_auxiliar: permite_auxiliar || false,
        bloqueado: bloqueado !== undefined ? bloqueado : (porcentaje !== null && porcentaje !== undefined && porcentaje > 0),
      })
      .select()
      .single()

    if (error) {
      console.error("Error creando detalle de plantilla:", error)
      return NextResponse.json(
        { error: "Error al crear detalle", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error: any) {
    console.error("Error en POST /api/contabilidad/plantillas-detalle:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error.message },
      { status: 500 }
    )
  }
}

