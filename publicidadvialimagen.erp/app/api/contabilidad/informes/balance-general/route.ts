export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"
import { getDataBalanceGeneral } from "./getData"

/**
 * GET - Balance General
 * Construido a partir de los saldos finales del Libro Mayor a una fecha.
 */
export async function GET(request: NextRequest) {
  try {
    const permiso = await requirePermiso("contabilidad", "ver")
    if (permiso instanceof Response) return permiso

    const { searchParams } = new URL(request.url)
    const a_fecha = searchParams.get("a_fecha") || ""
    if (!a_fecha) {
      return NextResponse.json(
        { error: "El parámetro a_fecha es obligatorio" },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()
    const data = await getDataBalanceGeneral(supabase, {
      a_fecha,
      empresa_id: searchParams.get("empresa_id") || "",
      sucursal_id: searchParams.get("sucursal_id") || "",
      moneda: searchParams.get("moneda") || "BOB",
      estado: searchParams.get("estado") || "Aprobado",
    })

    const tieneDatos =
      data.activo.length > 0 || data.pasivo.length > 0 || data.patrimonio.length > 0

    return NextResponse.json({
      success: true,
      data,
      ...(tieneDatos ? {} : { message: "No hay movimientos hasta la fecha seleccionada" }),
    })
  } catch (error: any) {
    console.error("Error in GET /api/contabilidad/informes/balance-general:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error?.message },
      { status: 500 }
    )
  }
}
