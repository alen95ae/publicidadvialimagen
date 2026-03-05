export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"
import { getDataEstadoAuxiliares } from "./getData"

/**
 * GET - Estado de Auxiliares (Resumen)
 * Parámetros: empresa_id, sucursal_id, clasificador, desde_cuenta, hasta_cuenta,
 * desde_auxiliar, hasta_auxiliar, fecha_inicial, fecha_final, moneda, estado
 */
export async function GET(request: NextRequest) {
  try {
    const permiso = await requirePermiso("contabilidad", "ver")
    if (permiso instanceof Response) return permiso

    const { searchParams } = new URL(request.url)
    const fecha_inicial = searchParams.get("fecha_inicial") || ""
    const fecha_final = searchParams.get("fecha_final") || ""
    if (!fecha_inicial || !fecha_final) {
      return NextResponse.json(
        { error: "Los parámetros fecha_inicial y fecha_final son obligatorios" },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()
    const data = await getDataEstadoAuxiliares(supabase, {
      empresa_id: searchParams.get("empresa_id") || "",
      sucursal_id: searchParams.get("sucursal_id") || "",
      clasificador: searchParams.get("clasificador") || "",
      desde_cuenta: searchParams.get("desde_cuenta") || "",
      hasta_cuenta: searchParams.get("hasta_cuenta") || "",
      desde_auxiliar: searchParams.get("desde_auxiliar") || "",
      hasta_auxiliar: searchParams.get("hasta_auxiliar") || "",
      fecha_inicial,
      fecha_final,
      estado: searchParams.get("estado") || "Aprobado",
      moneda: searchParams.get("moneda") || "BOB",
    })

    return NextResponse.json({
      success: true,
      data,
      ...(data.resultados.length === 0
        ? { message: "No hay movimientos con auxiliar en el rango seleccionado" }
        : {}),
    })
  } catch (error: any) {
    console.error("Error in GET /api/contabilidad/informes/estado-auxiliares:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error?.message },
      { status: 500 }
    )
  }
}
