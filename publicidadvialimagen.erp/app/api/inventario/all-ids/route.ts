export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getAllProductos } from "@/lib/supabaseProductos";
import { normalizeText } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get("categoria") || "";
    const q = (searchParams.get("q") || "").trim();

    let productos = await getAllProductos();

    if (categoria) {
      productos = productos.filter((p) => (p.categoria || "").trim() === categoria);
    }
    if (q) {
      const nq = normalizeText(q);
      productos = productos.filter(
        (p) =>
          normalizeText(p.codigo || "").includes(nq) ||
          normalizeText(p.nombre || "").includes(nq) ||
          normalizeText(p.categoria || "").includes(nq)
      );
    }

    const ids = productos.map((p) => p.id);
    return NextResponse.json({ ids, total: ids.length });
  } catch (e: any) {
    console.error("❌ Error inventario all-ids:", e);
    return NextResponse.json({ error: "No se pudieron obtener los IDs" }, { status: 500 });
  }
}
