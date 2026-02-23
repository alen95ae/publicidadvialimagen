import { NextResponse } from "next/server";
import { getUrgeAlquilarList } from "@/lib/urgeAlquilar";
import { requirePermiso } from "@/lib/permisos";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/soportes/urge-alquilar
 * Devuelve los 10 soportes más caros (por coste actual) que:
 * - Tienen método de pago FIJO
 * - Estado del alquiler finalizado (disponibles para alquilar)
 * Ordenados de más caro a más barato.
 */
export async function GET() {
  try {
    const permisoCheck = await requirePermiso("soportes", "ver");
    if (permisoCheck instanceof Response) return permisoCheck;
    const list = await getUrgeAlquilarList(10);
    return NextResponse.json(list);
  } catch (e) {
    console.error("urge-alquilar:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error interno" },
      { status: 500 }
    );
  }
}
