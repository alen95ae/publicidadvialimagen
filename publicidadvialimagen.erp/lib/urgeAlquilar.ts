import { getSupabaseServer } from "@/lib/supabaseServer";
import { getAlquileres } from "@/lib/supabaseAlquileres";

export type UrgeAlquilarItem = {
  id: number;
  codigo: string;
  ciudad: string;
  precio: number;
  estado: string;
};

type SoporteRow = {
  id: number;
  codigo: string | null;
  ciudad: string | null;
  estado: string | null;
  metodo_pago: string | null;
  precio_mensual: number | null;
  coste_alquiler: number | null;
  patentes: number | null;
  uso_suelos: number | null;
  luz: string | null;
  gastos_administrativos: number | null;
  mantenimiento: number | null;
};

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const num = (val: unknown): number => {
  if (val === undefined || val === null || val === "") return 0;
  const s = String(val).trim().replace(/[€$Bs\s]/gi, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Devuelve los 10 soportes más caros (por coste actual / morada) que:
 * - Método de pago FIJO
 * - Estado del alquiler finalizado (disponibles)
 * Ordenados de más caro a más barato.
 */
export async function getUrgeAlquilarList(limit = 10): Promise<UrgeAlquilarItem[]> {
  const supabase = getSupabaseServer();

  const { data: soportesRows, error: errSoportes } = await supabase
    .from("soportes")
    .select("id, codigo, ciudad, estado, metodo_pago, precio_mensual, coste_alquiler, patentes, uso_suelos, luz, gastos_administrativos, mantenimiento");

  if (errSoportes) throw errSoportes;
  const soportes = (soportesRows || []) as SoporteRow[];

  const { data: alquileres } = await getAlquileres({ limit: 10000 });
  const alquileresPorSoporte: Record<string, string> = {};
  (alquileres || [])
    .filter((a: { soporte_id?: string | number }) => a.soporte_id != null)
    .sort((a: { inicio: string }, b: { inicio: string }) => (b.inicio || "").localeCompare(a.inicio || ""))
    .forEach((a: { soporte_id: string | number; estado: string }) => {
      const sid = String(a.soporte_id);
      if (alquileresPorSoporte[sid] === undefined) alquileresPorSoporte[sid] = a.estado || "finalizado";
    });

  const list: (UrgeAlquilarItem & { _coste: number })[] = [];

  for (const s of soportes) {
    const estadoSoporte = (s.estado || "").trim();
    if (estadoSoporte.toLowerCase() === "no disponible") continue;

    const metodoPago = (s.metodo_pago || "").toUpperCase().trim();
    if (metodoPago !== "FIJO") continue;

    const estadoAlquiler = alquileresPorSoporte[String(s.id)];
    if (estadoAlquiler !== undefined && estadoAlquiler !== "finalizado") continue;

    const costeAlquiler = num(s.coste_alquiler);
    const patentes = num(s.patentes);
    const usoSuelos = num(s.uso_suelos);
    const luzVal = num(s.luz);
    const gastosAdmin = num(s.gastos_administrativos);
    const mantenimiento = num(s.mantenimiento);
    const costeActual = round2(costeAlquiler + patentes + usoSuelos + luzVal + gastosAdmin + mantenimiento);
    const precioVenta = num(s.precio_mensual);

    list.push({
      id: s.id,
      codigo: s.codigo || "-",
      ciudad: s.ciudad || "-",
      precio: precioVenta,
      estado: estadoSoporte || "Disponible",
      _coste: costeActual,
    });
  }

  list.sort((a, b) => b._coste - a._coste);
  return list.slice(0, limit).map(({ _coste, ...rest }) => rest);
}
