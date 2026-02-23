export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server"
import { getAlquileres } from "@/lib/supabaseAlquileres"

export async function GET(request: NextRequest) {
  try {
    const { requirePermiso } = await import("@/lib/permisos")
    const authResult = await requirePermiso("soportes", "ver")
    if (authResult instanceof Response) return authResult

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || undefined
    const vendedor = searchParams.get("vendedor") || undefined
    const estado = searchParams.get("estado") || undefined

    const ids: string[] = []
    let page = 1
    const limit = 1000
    let hasMore = true

    while (hasMore) {
      const result = await getAlquileres({ search, vendedor, estado, page, limit })
      if (result.data?.length) {
        result.data.forEach((a: any) => ids.push(a.id))
        hasMore = result.data.length === limit
        page++
      } else {
        hasMore = false
      }
    }

    return NextResponse.json({ ids, total: ids.length })
  } catch (e: any) {
    console.error("❌ Error alquileres all-ids:", e)
    return NextResponse.json({ error: "No se pudieron obtener los IDs" }, { status: 500 })
  }
}
