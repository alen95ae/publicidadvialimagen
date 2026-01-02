export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server"
import { getSupabaseUser } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"
import type { AuxiliarSaldos } from "@/lib/types/contabilidad"

// GET - Obtener saldos de un auxiliar
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

    // Por ahora retornamos datos vacíos o mock
    // En producción, esto debería consultar la tabla de saldos o calcular desde transacciones
    const saldos: AuxiliarSaldos[] = []

    // TODO: Implementar consulta real de saldos desde la base de datos
    // Ejemplo de estructura esperada:
    // const { data, error } = await supabase
    //   .from("auxiliar_saldos")
    //   .select("*")
    //   .eq("auxiliar_id", params.id)
    //   .order("gestion", { ascending: false })

    return NextResponse.json({
      success: true,
      data: saldos,
    })
  } catch (error) {
    console.error("Error in GET /api/contabilidad/auxiliares/[id]/saldos:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}







