export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { verifySession } from "@/lib/auth/verifySession"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("session")?.value
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    const payload = await verifySession(token)
    if (!payload?.sub) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const estado = searchParams.get("estado") || ""

    const supabase = getSupabaseAdmin()
    let query = supabase
      .from("formularios")
      .select("id")
      .order("fecha", { ascending: false })

    if (estado && estado !== "all") {
      const estados = estado.split(",").map((e) => e.trim()).filter(Boolean)
      const normalized = estados.map((e) => (e === "LEÍDO" ? "LEIDO" : e))
      if (normalized.length) query = query.in("estado", normalized)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error al obtener IDs de formularios:", error)
      return NextResponse.json({ error: "Error al obtener los IDs" }, { status: 500 })
    }

    const ids = (data || []).map((r: any) => r.id)

    return NextResponse.json({ ids, total: ids.length })
  } catch (e: any) {
    console.error("❌ Error messages all-ids:", e)
    return NextResponse.json({ error: "No se pudieron obtener los IDs" }, { status: 500 })
  }
}
