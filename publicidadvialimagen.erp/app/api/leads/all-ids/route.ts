export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server"
import { getAllLeadsIds } from "@/lib/supabaseLeads"
import { getSupabaseUser } from "@/lib/supabaseServer"
import { NextRequest } from "next/server"

export async function GET(request: Request) {
  try {
    // Verificar autenticación
    const supabase = await getSupabaseUser(request as NextRequest)
    if (!supabase) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const sectorFilter = searchParams.get('sector') || ''
    const interesFilter = searchParams.get('interes') || ''
    const origenFilter = searchParams.get('origen') || ''

    // Obtener todos los IDs de leads con los mismos filtros
    const ids = await getAllLeadsIds({
      query,
      sector: sectorFilter,
      interes: interesFilter,
      origen: origenFilter
    })

    return NextResponse.json({ ids })
  } catch (e: any) {
    console.error("❌ Error obteniendo IDs de leads:", e)
    return NextResponse.json({ error: "No se pudieron obtener los IDs" }, { status: 500 })
  }
}


