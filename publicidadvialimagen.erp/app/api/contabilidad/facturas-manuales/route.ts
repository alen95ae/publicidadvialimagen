export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { requirePermiso } from "@/lib/permisos";
import * as XLSX from "xlsx";

const EMPRESA_ID = 1;
const COTIZACION_FIJA = 6.96;

/** Obtiene el siguiente código de factura libre (FAC-0001, FAC-0002, ...). */
async function obtenerSiguienteNumero(supabase: ReturnType<typeof getSupabaseAdmin>): Promise<string> {
  const { data: facturas } = await supabase
    .from("facturas_manuales")
    .select("codigo")
    .not("codigo", "is", null)
    .like("codigo", "FAC-%")
    .order("created_at", { ascending: false })
    .limit(100);
  const numeros = (facturas || [])
    .map((row: any) => {
      const match = String(row.codigo || "").match(/^FAC-(\d+)$/i);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n: number) => !isNaN(n) && n > 0);
  const siguiente = numeros.length > 0 ? Math.max(...numeros) + 1 : 1;
  return `FAC-${siguiente.toString().padStart(4, "0")}`;
}

/** GET - Listar facturas manuales (o exportar XLSX si format=csv|xlsx) */
export async function GET(request: NextRequest) {
  try {
    const permiso = await requirePermiso("contabilidad", "ver");
    if (permiso instanceof Response) return permiso;

    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const format = (searchParams.get("format") || "").toLowerCase();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const offset = (page - 1) * limit;
    const search = (searchParams.get("search") || "").trim();
    const estado = searchParams.get("estado") || "";
    const vendedor = searchParams.get("vendedor") || "";
    const idsParam = searchParams.get("ids") || "";

    let query = supabase
      .from("facturas_manuales")
      .select("id, codigo, fecha, vendedor_id, cliente_nombre, cliente_nit, glosa, moneda, cotizacion_id, tipo_cambio, subtotal, total, estado, created_at, updated_at", (format === "csv" || format === "xlsx") ? {} : { count: "exact" })
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
      query = query.or(`codigo.ilike.%${search}%,cliente_nombre.ilike.%${search}%,cliente_nit.ilike.%${search}%`);
    }
    if ((format === "csv" || format === "xlsx") && idsParam.trim()) {
      const idList = idsParam.split(",").map((id) => id.trim()).filter(Boolean);
      if (idList.length > 0) query = query.in("id", idList);
    }

    if (format === "csv" || format === "xlsx") {
      const { data: rows, error } = await query.limit(10000);
      if (error) {
        console.error("Error fetching facturas_manuales for export:", error);
        return NextResponse.json({ error: "Error al exportar" }, { status: 500 });
      }
      const excelData = (rows || []).map((r: any) => ({
        codigo: r.codigo ?? "",
        fecha: r.fecha ?? "",
        cliente_nombre: r.cliente_nombre ?? "",
        cliente_nit: r.cliente_nit ?? "",
        moneda: r.moneda ?? "",
        total: r.total ?? "",
        estado: r.estado ?? "",
      }));
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);
      XLSX.utils.book_append_sheet(wb, ws, "Facturas");
      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      const fecha = new Date().toISOString().split("T")[0];
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="facturas_manuales_${fecha}.xlsx"`,
        },
      });
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching facturas_manuales:", error);
      return NextResponse.json(
        { error: "Error al obtener facturas manuales", details: error.message },
        { status: 500 }
      );
    }

    const list = (data || []).map((f: any) => ({ ...f, cotizacion: f.cotizacion_id ?? f.cotizacion }));
    return NextResponse.json({
      success: true,
      data: list,
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / limit),
        hasNext: (count ?? 0) > offset + (data?.length ?? 0),
        hasPrev: page > 1,
      },
    });
  } catch (err: any) {
    console.error("GET /api/contabilidad/facturas-manuales:", err);
    return NextResponse.json(
      { error: "Error interno del servidor", details: err?.message },
      { status: 500 }
    );
  }
}

/** POST - Crear factura manual con ítems */
export async function POST(request: NextRequest) {
  try {
    const permiso = await requirePermiso("contabilidad", "editar");
    if (permiso instanceof Response) return permiso;

    const supabase = getSupabaseAdmin();
    const body = await request.json().catch(() => ({}));

    const {
      codigo: codigoBody,
      fecha,
      vendedor_id,
      cliente_nombre,
      cliente_nit,
      glosa,
      moneda,
      cotizacion: cotizacionId,
      tipo_cambio,
      items,
    } = body;

    const total = Array.isArray(items)
      ? items.reduce((sum: number, it: any) => sum + (Number(it.importe) || 0), 0)
      : 0;
    const subtotal = total;

    // creado_por y vendedor_id tienen FK a auth.users(id); la app usa public.usuarios(id).
    // cotizacion en la tabla es numeric(12,4); el UUID de la cotización (documento) va en cotizacion_id.
    const cotizacionUuidVal = (cotizacionId != null && String(cotizacionId).trim() !== "") ? String(cotizacionId).trim() : null;
    const codigoVal = (codigoBody != null && String(codigoBody).trim() !== "") ? String(codigoBody).trim() : null;
    const codigoFinal = codigoVal ?? await obtenerSiguienteNumero(supabase);
    const row = {
      empresa_id: EMPRESA_ID,
      codigo: codigoFinal,
      fecha: fecha || new Date().toISOString().split("T")[0],
      vendedor_id: null,
      creado_por: null,
      cliente_nombre: (cliente_nombre ?? "").trim() || "",
      cliente_nit: (cliente_nit ?? "").trim() || "",
      glosa: glosa ?? null,
      moneda: moneda ?? "BOB",
      cotizacion_id: cotizacionUuidVal,
      tipo_cambio: tipo_cambio != null ? Number(tipo_cambio) : COTIZACION_FIJA,
      subtotal: Number(subtotal) || 0,
      total: Number(total) || 0,
      estado: "BORRADOR",
    };

    const { data: factura, error: errInsert } = await supabase
      .from("facturas_manuales")
      .insert(row)
      .select("id, codigo, fecha, total, estado")
      .single();

    if (errInsert) {
      console.error("Error insert facturas_manuales:", errInsert);
      return NextResponse.json(
        {
          error: "Error al crear factura manual",
          details: errInsert.message,
          code: (errInsert as any).code,
        },
        { status: 500 }
      );
    }

    if (Array.isArray(items) && items.length > 0 && factura?.id) {
      const rowsItems = items.map((it: any, index: number) => ({
        factura_id: factura.id,
        orden: index + 1,
        codigo_producto: (it.codigo_producto ?? "").trim() || null,
        descripcion: (it.descripcion ?? "").trim() || "",
        cantidad: Number(it.cantidad) || 0,
        unidad_medida: (it.unidad_medida ?? "").trim() || null,
        precio_unitario: Number(it.precio_unitario) || 0,
        descuento: Number(it.descuento) || 0,
        importe: Number(it.importe) || 0,
      }));

      const { error: errItems } = await supabase
        .from("items_factura_manual")
        .insert(rowsItems);

      if (errItems) {
        console.error("Error insert items_factura_manual:", errItems);
        await supabase.from("facturas_manuales").delete().eq("id", factura.id);
        return NextResponse.json(
          { error: "Error al guardar ítems de la factura", details: errItems.message },
          { status: 500 }
        );
      }
    }

    // Si la factura tiene cotización vinculada, marcar la cotización en estado "Borrador" (no fallar la respuesta si falla el update)
    if (cotizacionUuidVal) {
      try {
        const { error: errCot } = await supabase
          .from("cotizaciones")
          .update({
            estado: "Borrador",
            fecha_actualizacion: new Date().toISOString(),
          })
          .eq("id", cotizacionUuidVal);
        if (errCot) {
          console.error("Error actualizando estado cotización a Borrador:", errCot);
        }
      } catch (e) {
        console.error("Excepción al actualizar cotización a Borrador:", e);
      }
    }

    return NextResponse.json({ success: true, data: factura });
  } catch (err: any) {
    console.error("POST /api/contabilidad/facturas-manuales:", err);
    return NextResponse.json(
      { error: "Error interno del servidor", details: err?.message },
      { status: 500 }
    );
  }
}
