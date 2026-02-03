export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"
import { getDataLibroAuxiliares } from "./getData"

/**
 * GET - Libro de Auxiliares
 * Comprobantes contables + comprobante_detalle (solo con auxiliar) + plan_cuentas + auxiliares.
 * tipo_reporte: Resumen (una fila por auxiliar+cuenta) o Detalle (todos los movimientos).
 */
export async function GET(request: NextRequest) {
  try {
    const permiso = await requirePermiso("contabilidad", "ver")
    if (permiso instanceof Response) return permiso

    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const { data, tipo_reporte, debug } = await getDataLibroAuxiliares(supabase, searchParams)

    const total = Array.isArray(data) ? data.length : (data?.auxiliares?.length ?? 0)
    const body: { success: boolean; data: any; total: number; tipo_reporte: string; debug?: typeof debug } = {
      success: true,
      data,
      total,
      tipo_reporte,
    }
    if (process.env.NODE_ENV === "development") body.debug = debug
    return NextResponse.json(body)
  } catch (error: any) {
    console.error("Error in GET /api/contabilidad/informes/libro-auxiliares:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error?.message },
      { status: 500 }
    )
  }
}
