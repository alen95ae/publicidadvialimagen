export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { requirePermiso } from "@/lib/permisos";

const EMPRESA_ID = 1;

export async function GET(request: NextRequest) {
  try {
    const permiso = await requirePermiso("contabilidad", "ver");
    if (permiso instanceof Response) return permiso;

    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").trim();
    const estado = searchParams.get("estado") || "";
    const vendedor = searchParams.get("vendedor") || "";

    let query = supabase
      .from("facturas_manuales")
      .select("id")
      .eq("empresa_id", EMPRESA_ID)
      .order("fecha", { ascending: false })
      .order("created_at", { ascending: false });

    if (estado && estado !== "all") {
      query = query.eq("estado", estado.toUpperCase());
    }
    if (vendedor && vendedor !== "all") {
      query = query.eq("vendedor_id", vendedor);
    }
    if (search) {
      query = query.or(`numero.ilike.%${search}%,cliente_nombre.ilike.%${search}%,cliente_nit.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error facturas-manuales all-ids:", error);
      return NextResponse.json({ error: "No se pudieron obtener los IDs" }, { status: 500 });
    }

    const ids = (data || []).map((r: any) => r.id);
    return NextResponse.json({ ids, total: ids.length });
  } catch (e: any) {
    console.error("❌ Error facturas-manuales all-ids:", e);
    return NextResponse.json({ error: "No se pudieron obtener los IDs" }, { status: 500 });
  }
}
