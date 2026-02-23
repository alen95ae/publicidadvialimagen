export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getAllConsumibles } from "@/lib/supabaseConsumibles";
import { normalizeText } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get("categoria") || "";
    const q = (searchParams.get("q") || "").trim();

    let consumibles = await getAllConsumibles();

    if (categoria) {
      consumibles = consumibles.filter((c) => (c.categoria || "").trim() === categoria);
    }
    if (q) {
      const nq = normalizeText(q);
      consumibles = consumibles.filter(
        (c) =>
          normalizeText(c.codigo || "").includes(nq) ||
          normalizeText(c.nombre || "").includes(nq) ||
          normalizeText(c.categoria || "").includes(nq)
      );
    }

    const ids = consumibles.map((c) => c.id);
    return NextResponse.json({ ids, total: ids.length });
  } catch (e: any) {
    console.error("❌ Error consumibles all-ids:", e);
    return NextResponse.json({ error: "No se pudieron obtener los IDs" }, { status: 500 });
  }
}
