export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

const supabase = getSupabaseServer();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const itemTipo = searchParams.get("item_tipo");
    const origen = searchParams.get("origen");
    const sucursal = searchParams.get("sucursal");
    const fechaDesde = searchParams.get("fecha_desde");
    const fechaHasta = searchParams.get("fecha_hasta");
    const search = searchParams.get("search");

    let query = supabase
      .from("historial_stock")
      .select("id")
      .order("fecha", { ascending: false });

    if (itemTipo && itemTipo !== "all") {
      query = query.eq("item_tipo", itemTipo);
    }
    if (origen && origen !== "all") {
      query = query.eq("origen", origen);
    }
    if (sucursal && sucursal !== "all") {
      query = query.eq("sucursal", sucursal);
    }
    if (fechaDesde) {
      query = query.gte("fecha", fechaDesde);
    }
    if (fechaHasta) {
      query = query.lte("fecha", fechaHasta);
    }
    if (search && search.trim()) {
      query = query.or(`item_codigo.ilike.%${search}%,item_nombre.ilike.%${search}%,referencia_codigo.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error historial all-ids:", error);
      return NextResponse.json({ error: "No se pudieron obtener los IDs" }, { status: 500 });
    }

    const ids = (data || []).map((r: any) => r.id);
    return NextResponse.json({ ids, total: ids.length });
  } catch (e: any) {
    console.error("❌ Error historial all-ids:", e);
    return NextResponse.json({ error: "No se pudieron obtener los IDs" }, { status: 500 });
  }
}
