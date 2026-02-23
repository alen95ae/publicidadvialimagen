export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server"
import { getSoportes } from "@/lib/supabaseSoportes"
import { requirePermiso } from "@/lib/permisos"

export async function GET(request: NextRequest) {
  try {
    const authResult = await requirePermiso("soportes", "ver")
    if (authResult instanceof Response) return authResult

    const { searchParams } = new URL(request.url)
    const q = searchParams.get("q") || ""
    const status = searchParams.get("status") || ""
    const city = searchParams.get("city") || ""

    const ids: string[] = []
    let page = 1
    const limit = 1000
    let hasMore = true

    while (hasMore) {
      const result = await getSoportes({ q, status, city, page, limit })
      const data = result.data || []
      if (data.length) {
        data.forEach((s: any) => ids.push(String(s.id)))
        hasMore = data.length === limit
        page++
      } else {
        hasMore = false
      }
    }

    return NextResponse.json({ ids, total: ids.length })
  } catch (e: any) {
    console.error("❌ Error soportes all-ids:", e)
    return NextResponse.json({ error: "No se pudieron obtener los IDs" }, { status: 500 })
  }
}
