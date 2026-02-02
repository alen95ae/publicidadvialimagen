/**
 * API para generar el siguiente número de factura manual (FAC-0001)
 * Igual que referencia en registro de movimiento: se puede usar o editar.
 */

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const permiso = await requirePermiso("contabilidad", "ver")
    if (permiso instanceof Response) return permiso

    const supabase = getSupabaseAdmin()

    const { data: facturas, error } = await supabase
      .from("facturas_manuales")
      .select("numero")
      .not("numero", "is", null)
      .like("numero", "FAC-%")
      .order("created_at", { ascending: false })
      .limit(100)

    if (error) {
      console.error("Error obteniendo números de factura:", error)
      return NextResponse.json({
        success: true,
        codigo: "FAC-0001",
      })
    }

    const numeros = (facturas || [])
      .map((row: any) => {
        const match = String(row.numero || "").match(/^FAC-(\d+)$/i)
        return match ? parseInt(match[1], 10) : 0
      })
      .filter((n: number) => !isNaN(n) && n > 0)

    const siguiente = numeros.length > 0 ? Math.max(...numeros) + 1 : 1
    const codigo = `FAC-${siguiente.toString().padStart(4, "0")}`

    return NextResponse.json({
      success: true,
      codigo,
    })
  } catch (err: any) {
    console.error("Error generando número de factura:", err)
    return NextResponse.json(
      { success: false, error: "Error al generar número" },
      { status: 500 }
    )
  }
}
