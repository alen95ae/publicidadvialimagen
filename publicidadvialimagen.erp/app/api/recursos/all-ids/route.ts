export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getAllRecursos } from "@/lib/supabaseRecursos";
import { normalizeText } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get("categoria") || "";
    const q = (searchParams.get("q") || "").trim();

    let recursos = await getAllRecursos();

    if (categoria) {
      recursos = recursos.filter((r) => (r.categoria || "") === categoria);
    }
    if (q) {
      const nq = normalizeText(q);
      recursos = recursos.filter(
        (r) =>
          normalizeText(r.codigo || "").includes(nq) ||
          normalizeText(r.nombre || "").includes(nq) ||
          normalizeText(r.categoria || "").includes(nq)
      );
    }

    const ids = recursos.map((r) => r.id);
    return NextResponse.json({ ids, total: ids.length });
  } catch (e: any) {
    console.error("❌ Error recursos all-ids:", e);
    return NextResponse.json({ error: "No se pudieron obtener los IDs" }, { status: 500 });
  }
}
