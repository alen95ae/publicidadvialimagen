export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server"
import { getCotizaciones } from "@/lib/supabaseCotizaciones"

export async function GET(request: NextRequest) {
  try {
    const { requirePermiso } = await import("@/lib/permisos")
    const authResult = await requirePermiso("ventas", "ver")
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
      const result = await getCotizaciones({
        search,
        vendedor: vendedor || undefined,
        estado: estado || undefined,
        page,
        limit,
      })
      const data = result.data || []
      if (data.length) {
        data.forEach((c: any) => ids.push(c.id))
        hasMore = data.length === limit
        page++
      } else {
        hasMore = false
      }
    }

    return NextResponse.json({ ids, total: ids.length })
  } catch (e: any) {
    console.error("❌ Error cotizaciones all-ids:", e)
    return NextResponse.json({ error: "No se pudieron obtener los IDs" }, { status: 500 })
  }
}
