export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseUser } from "@/lib/supabaseServer"

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseUser(request)
    if (!supabase) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const estadoFilterParam = searchParams.get("estado")

    let query = supabase
      .from("solicitudes")
      .select("codigo", { count: "exact" })
      .order("created_at", { ascending: false })

    if (estadoFilterParam && estadoFilterParam !== "all") {
      const estados = estadoFilterParam.split(",").map((e) => e.trim()).filter(Boolean)
      if (estados.length) query = query.in("estado", estados)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error al obtener códigos de solicitudes:", error)
      return NextResponse.json({ error: "Error al obtener los códigos" }, { status: 500 })
    }

    const ids = (data || []).map((r: any) => r.codigo).filter(Boolean)

    return NextResponse.json({ ids, total: ids.length })
  } catch (e: any) {
    console.error("❌ Error solicitudes all-ids:", e)
    return NextResponse.json({ error: "No se pudieron obtener los IDs" }, { status: 500 })
  }
}
