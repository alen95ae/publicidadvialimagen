export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { requirePermiso } from "@/lib/permisos";

const EMPRESA_ID = 1;
const COTIZACION_FIJA = 6.96;

/** GET - Listar facturas manuales (o exportar CSV si format=csv) */
export async function GET(request: NextRequest) {
  try {
    const permiso = await requirePermiso("contabilidad", "ver");
    if (permiso instanceof Response) return permiso;

    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const offset = (page - 1) * limit;
    const search = (searchParams.get("search") || "").trim();
    const estado = searchParams.get("estado") || "";
    const vendedor = searchParams.get("vendedor") || "";

    let query = supabase
      .from("facturas_manuales")
      .select("id, numero, fecha, vendedor_id, cliente_nombre, cliente_nit, glosa, moneda, cotizacion, tipo_cambio, subtotal, total, estado, created_at, updated_at", format === "csv" ? {} : { count: "exact" })
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

    if (format === "csv") {
      const { data: rows, error } = await query.limit(10000);
      if (error) {
        console.error("Error fetching facturas_manuales for CSV:", error);
        return NextResponse.json({ error: "Error al exportar" }, { status: 500 });
      }
      const headers = ["id", "numero", "fecha", "cliente_nombre", "cliente_nit", "moneda", "total", "estado"];
      const csvLines = [headers.join(";"), ...(rows || []).map((r: any) => headers.map((h) => (r[h] != null ? String(r[h]) : "")).join(";"))];
      const csv = "\uFEFF" + csvLines.join("\r\n");
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="facturas_manuales_${new Date().toISOString().split("T")[0]}.csv"`,
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

    return NextResponse.json({
      success: true,
      data: data || [],
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
      numero,
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
    // Se envían como null para evitar 500 por violación de FK. Ver comentario en código para SQL alternativo.
    const row = {
      empresa_id: EMPRESA_ID,
      numero: numero ?? null,
      fecha: fecha || new Date().toISOString().split("T")[0],
      vendedor_id: null,
      creado_por: null,
      cliente_nombre: (cliente_nombre ?? "").trim() || "",
      cliente_nit: (cliente_nit ?? "").trim() || "",
      glosa: glosa ?? null,
      moneda: moneda ?? "BOB",
      cotizacion: cotizacionId ?? null,
      tipo_cambio: tipo_cambio != null ? Number(tipo_cambio) : COTIZACION_FIJA,
      subtotal: Number(subtotal) || 0,
      total: Number(total) || 0,
      estado: "BORRADOR",
    };

    const { data: factura, error: errInsert } = await supabase
      .from("facturas_manuales")
      .insert(row)
      .select("id, numero, fecha, total, estado")
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

    return NextResponse.json({ success: true, data: factura });
  } catch (err: any) {
    console.error("POST /api/contabilidad/facturas-manuales:", err);
    return NextResponse.json(
      { error: "Error interno del servidor", details: err?.message },
      { status: 500 }
    );
  }
}
