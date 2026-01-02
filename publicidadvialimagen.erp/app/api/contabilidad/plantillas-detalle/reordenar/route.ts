export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"

// POST - Reordenar líneas de plantilla
export async function POST(request: NextRequest) {
  try {
    // Verificar permisos
    const permiso = await requirePermiso("contabilidad", "editar")
    if (permiso instanceof Response) {
      return permiso
    }

    const supabase = getSupabaseAdmin()
    const body = await request.json()

    const { items } = body // Array de { id, orden }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "items debe ser un array no vacío con { id, orden }" },
        { status: 400 }
      )
    }

    // Validar que todos los items tengan id y orden
    for (const item of items) {
      if (!item.id || item.orden === undefined) {
        return NextResponse.json(
          { error: "Cada item debe tener 'id' y 'orden'" },
          { status: 400 }
        )
      }
    }

    // Actualizar orden de cada detalle
    const updates = items.map((item: { id: string; orden: number }) => ({
      id: item.id,
      orden: item.orden,
    }))

    // Ejecutar actualizaciones en paralelo
    const updatePromises = updates.map((update) =>
      supabase
        .from("plantillas_contables_detalle")
        .update({ orden: update.orden })
        .eq("id", update.id)
    )

    const results = await Promise.all(updatePromises)

    // Verificar errores
    const errors = results.filter((r) => r.error)
    if (errors.length > 0) {
      console.error("Errores al reordenar:", errors)
      return NextResponse.json(
        { error: "Error al reordenar algunos detalles", details: errors },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Detalles reordenados correctamente",
    })
  } catch (error: any) {
    console.error("Error en POST /api/contabilidad/plantillas-detalle/reordenar:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error.message },
      { status: 500 }
    )
  }
}

