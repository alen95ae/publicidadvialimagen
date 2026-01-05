export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server"
import { getUniqueFieldValues } from "@/lib/supabaseLeads"
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
    const field = searchParams.get('field') as 'sector' | 'interes' | 'origen' | null

    if (!field || !['sector', 'interes', 'origen'].includes(field)) {
      return NextResponse.json(
        { error: "Campo inválido. Debe ser 'sector', 'interes' o 'origen'" },
        { status: 400 }
      )
    }

    const values = await getUniqueFieldValues(field)

    return NextResponse.json({ values })
  } catch (e: any) {
    console.error("❌ Error obteniendo valores únicos:", e)
    return NextResponse.json({ error: "No se pudieron obtener los valores únicos" }, { status: 500 })
  }
}

