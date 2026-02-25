export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { requirePermiso } from "@/lib/permisos";
import { normalizeText } from "@/lib/utils";

const CAMPOS_PRECIOS =
  "id, codigo, titulo, ciudad, estado, coste_alquiler, patentes, uso_suelos, gastos_administrativos, comision_ejecutiva, mantenimiento, precio_mensual, precio_3_meses, precio_6_meses, precio_12_meses";

export type SoportePreciosRow = {
  id: number;
  codigo: string | null;
  titulo: string | null;
  ciudad: string | null;
  estado: string | null;
  coste_alquiler: number | null;
  patentes: number | null;
  uso_suelos: number | null;
  gastos_administrativos: number | null;
  comision_ejecutiva: number | null;
  mantenimiento: number | null;
  precio_mensual: number | null;
  precio_3_meses: number | null;
  precio_6_meses: number | null;
  precio_12_meses: number | null;
};

export async function GET(request: Request) {
  try {
    const permisoCheck = await requirePermiso("soportes", "ver");
    if (permisoCheck instanceof Response) return permisoCheck;

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status") || "";
    const cityParam = searchParams.get("city") || "";

    const supabase = getSupabaseServer();
    let query = supabase
      .from("soportes")
      .select(CAMPOS_PRECIOS)
      .neq("estado", "No disponible");

    if (statusParam) {
      const statuses = statusParam.split(",").map((s) => s.trim()).filter(Boolean);
      if (statuses.length > 0) query = query.in("estado", statuses);
    }
    if (cityParam) {
      const normalizedCity = normalizeText(cityParam);
      query = query.ilike("ciudad", `%${normalizedCity}%`);
    }

    const { data, error } = await query.order("codigo", { ascending: true });

    if (error) {
      console.error("Error fetching soportes precios:", error);
      return NextResponse.json(
        { error: "No se pudieron obtener los datos de precios" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: (data || []) as SoportePreciosRow[] });
  } catch (e) {
    console.error("Error en GET /api/soportes/precios:", e);
    return NextResponse.json(
      { error: "Error al cargar precios de soportes" },
      { status: 500 }
    );
  }
}
