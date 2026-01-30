export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { requirePermiso } from "@/lib/permisos";

/**
 * Libro de Compras (LC) - API para la tabla public.libro_compras.
 * Un registro LC por línea de detalle (comprobante_id + linea_orden). linea_orden es opcional (legacy).
 */
const EMPRESA_ID = 1;

// GET - Listar registros LC por comprobante_id
export async function GET(request: NextRequest) {
  try {
    const permiso = await requirePermiso("contabilidad", "ver");
    if (permiso instanceof Response) return permiso;

    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const comprobanteId = searchParams.get("comprobante_id");

    if (!comprobanteId) {
      return NextResponse.json(
        { error: "comprobante_id es requerido" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("libro_compras")
      .select("*")
      .eq("empresa_id", EMPRESA_ID)
      .eq("comprobante_id", comprobanteId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching libro_compras:", error);
      return NextResponse.json(
        { error: "Error al obtener libro de compras", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (err) {
    console.error("GET /api/contabilidad/libro-compras:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST - Crear o actualizar registro LC
export async function POST(request: NextRequest) {
  try {
    const permiso = await requirePermiso("contabilidad", "editar");
    if (permiso instanceof Response) return permiso;

    const supabase = getSupabaseAdmin();
    const body = await request.json();

    const {
      id: lcId,
      comprobante_id: comprobanteId,
      linea_orden: lineaOrden,
      empresa_id: empresaId,
      nro_dui,
      nro_documento,
      fecha,
      cotizacion,
      proveedor_id: proveedorId,
      proveedor_nombre: proveedorNombre,
      nit,
      nro_autorizacion: autorizacion,
      codigo_control,
      importe_no_sujeto_cf,
      descuentos_rebajas,
      glosa,
      monto,
      credito_fiscal,
      estado,
    } = body;

    if (!comprobanteId) {
      return NextResponse.json(
        { error: "comprobante_id es requerido" },
        { status: 400 }
      );
    }
    if (!fecha) {
      return NextResponse.json(
        { error: "fecha es requerida" },
        { status: 400 }
      );
    }

    // proveedor_id en BD es bigint; si viene uuid o no numérico, guardar null
    const proveedorIdNum =
      proveedorId != null && proveedorId !== ""
        ? parseInt(String(proveedorId), 10)
        : null;
    const proveedorIdFinal =
      proveedorIdNum != null && !Number.isNaN(proveedorIdNum)
        ? proveedorIdNum
        : null;

    const lineaOrdenFinal =
      lineaOrden != null && lineaOrden !== "" ? parseInt(String(lineaOrden), 10) : null;
    const row: Record<string, unknown> = {
      empresa_id: empresaId ?? EMPRESA_ID,
      comprobante_id: comprobanteId,
      linea_orden: Number.isInteger(lineaOrdenFinal) ? lineaOrdenFinal : null,
      nro_dui: nro_dui ?? null,
      nro_documento: nro_documento ?? null,
      fecha,
      cotizacion: cotizacion ?? 1,
      proveedor_id: proveedorIdFinal,
      proveedor_nombre: proveedorNombre ?? null,
      nit: nit ?? null,
      nro_autorizacion: autorizacion ?? null,
      codigo_control: codigo_control ?? null,
      importe_no_sujeto_cf: importe_no_sujeto_cf ?? 0,
      descuentos_rebajas: descuentos_rebajas ?? 0,
      glosa: glosa ?? null,
      monto: monto ?? 0,
      credito_fiscal: credito_fiscal ?? 0,
      estado: estado ?? "BORRADOR",
      updated_at: new Date().toISOString(),
    };

    if (lcId) {
      // Update
      console.log("[libro_compras] UPDATE payload:", { lcId, row: JSON.stringify(row) });
      const { data, error } = await supabase
        .from("libro_compras")
        .update(row)
        .eq("id", lcId)
        .eq("empresa_id", row.empresa_id)
        .select()
        .single();

    if (error) {
      console.error("[libro_compras] UPDATE error (full):", JSON.stringify(error, null, 2));
      const isColumnMissing = error.code === "42703" || (String(error.message || "").includes("linea_orden") && String(error.message || "").toLowerCase().includes("does not exist"));
      const userMessage = isColumnMissing
        ? "Falta la columna linea_orden en la tabla libro_compras. Ejecute en Supabase: ALTER TABLE public.libro_compras ADD COLUMN IF NOT EXISTS linea_orden integer NULL;"
        : error.message;
      return NextResponse.json(
        { error: "Error al actualizar registro LC", details: userMessage, code: error.code },
        { status: 500 }
      );
    }
      if (!data) {
        console.error("[libro_compras] UPDATE returned success but no data (row may not exist)");
        return NextResponse.json(
          { error: "Actualización no devolvió fila; compruebe que el registro existe" },
          { status: 500 }
        );
      }
      console.log("[libro_compras] UPDATE ok, id:", data.id);
      return NextResponse.json({ success: true, data });
    }

    // Insert
    console.log("[libro_compras] INSERT payload:", JSON.stringify(row, null, 2));
    const { data, error } = await supabase
      .from("libro_compras")
      .insert(row)
      .select()
      .single();

    if (error) {
      console.error("[libro_compras] INSERT error (full):", JSON.stringify(error, null, 2));
      const isColumnMissing = error.code === "42703" || (String(error.message || "").includes("linea_orden") && String(error.message || "").toLowerCase().includes("does not exist"));
      const userMessage = isColumnMissing
        ? "Falta la columna linea_orden en la tabla libro_compras. Ejecute en Supabase: ALTER TABLE public.libro_compras ADD COLUMN IF NOT EXISTS linea_orden integer NULL;"
        : error.message;
      return NextResponse.json(
        { error: "Error al guardar registro LC", details: userMessage, code: error.code },
        { status: 500 }
      );
    }

    if (!data) {
      console.error("[libro_compras] INSERT returned success but no data (falso positivo)");
      return NextResponse.json(
        { error: "Inserción no devolvió fila; revise triggers o esquema de la tabla" },
        { status: 500 }
      );
    }

    console.log("[libro_compras] INSERT ok, id:", data.id, "comprobante_id:", data.comprobante_id);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("[libro_compras] POST exception:", err);
    const message = err instanceof Error ? err.message : "Error interno del servidor";
    return NextResponse.json(
      { error: "Error interno del servidor", details: message },
      { status: 500 }
    );
  }
}
