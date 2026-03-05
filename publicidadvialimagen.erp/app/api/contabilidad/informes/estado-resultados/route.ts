export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"
import { getDataEstadoResultados } from "./getData"

/**
 * GET - Estado de Resultados
 * Cuentas de resultados (Ingreso, Costo, Gasto) con saldos por naturaleza.
 */
export async function GET(request: NextRequest) {
  try {
    const permiso = await requirePermiso("contabilidad", "ver")
    if (permiso instanceof Response) return permiso

    const { searchParams } = new URL(request.url)
    const desde_fecha = searchParams.get("desde_fecha") || ""
    const a_fecha = searchParams.get("a_fecha") || ""
    if (!desde_fecha || !a_fecha) {
      return NextResponse.json(
        { error: "Los parámetros desde_fecha y a_fecha son obligatorios" },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()
    const data = await getDataEstadoResultados(supabase, {
      desde_fecha,
      a_fecha,
      empresa_id: searchParams.get("empresa_id") || "",
      sucursal_id: searchParams.get("sucursal_id") || "",
      moneda: searchParams.get("moneda") || "BOB",
      estado: searchParams.get("estado") || "Aprobado",
      nivel: searchParams.get("nivel") || "5",
    })

    const tieneDatos =
      data.ingresos.length > 0 || data.costos.length > 0 || data.gastos.length > 0

    return NextResponse.json({
      success: true,
      data,
      ...(tieneDatos ? {} : { message: "No hay movimientos de resultados en el rango seleccionado" }),
    })
  } catch (error: any) {
    console.error("Error in GET /api/contabilidad/informes/estado-resultados:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error?.message },
      { status: 500 }
    )
  }
}
