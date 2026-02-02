export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { requirePermiso } from "@/lib/permisos";

const EMPRESA_ID = 1;
const COTIZACION_FIJA = 6.96;

/** GET - Obtener una factura manual con sus ítems */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const permiso = await requirePermiso("contabilidad", "ver");
    if (permiso instanceof Response) return permiso;

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "id es requerido" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: factura, error: errFactura } = await supabase
      .from("facturas_manuales")
      .select("*")
      .eq("id", id)
      .eq("empresa_id", EMPRESA_ID)
      .single();

    if (errFactura || !factura) {
      return NextResponse.json(
        { error: "Factura no encontrada" },
        { status: 404 }
      );
    }

    const { data: items, error: errItems } = await supabase
      .from("items_factura_manual")
      .select("id, factura_id, orden, codigo_producto, descripcion, cantidad, unidad_medida, precio_unitario, descuento, importe, created_at")
      .eq("factura_id", id)
      .order("orden", { ascending: true });

    if (errItems) {
      console.error("Error fetching items_factura_manual:", errItems);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...factura,
        cotizacion: factura.cotizacion_id ?? factura.cotizacion,
        items: items || [],
      },
    });
  } catch (err: any) {
    console.error("GET /api/contabilidad/facturas-manuales/[id]:", err);
    return NextResponse.json(
      { error: "Error interno del servidor", details: err?.message },
      { status: 500 }
    );
  }
}

/** PUT - Actualizar factura manual y sus ítems */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const permiso = await requirePermiso("contabilidad", "editar");
    if (permiso instanceof Response) return permiso;

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "id es requerido" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const body = await request.json();

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
      estado,
      items,
    } = body;

    const total = Array.isArray(items)
      ? items.reduce((sum: number, it: any) => sum + (Number(it.importe) || 0), 0)
      : 0;
    const subtotal = total;

    // vendedor_id tiene FK a auth.users(id); la app usa public.usuarios(id). Se fuerza null hasta alinear FKs.
    const updateRow: Record<string, unknown> = {
      numero: numero ?? null,
      fecha: fecha || undefined,
      vendedor_id: null,
      cliente_nombre: (cliente_nombre ?? "").trim() || "",
      cliente_nit: (cliente_nit ?? "").trim() || "",
      glosa: glosa ?? null,
      moneda: moneda ?? "BOB",
      subtotal: Number(subtotal) || 0,
      total: Number(total) || 0,
      updated_at: new Date().toISOString(),
      ...(estado != null && estado !== undefined ? { estado } : {}),
    };
    if (Object.prototype.hasOwnProperty.call(body, "cotizacion")) {
      const uuidVal = (cotizacionId ?? "") === "" ? null : cotizacionId;
      updateRow.cotizacion_id = uuidVal;
    }
    if (tipo_cambio != null) updateRow.tipo_cambio = Number(tipo_cambio)

    const { data: factura, error: errUpdate } = await supabase
      .from("facturas_manuales")
      .update(updateRow)
      .eq("id", id)
      .eq("empresa_id", EMPRESA_ID)
      .select("id, numero, fecha, total, estado, cotizacion_id")
      .single();

    if (errUpdate) {
      console.error("Error update facturas_manuales:", errUpdate);
      return NextResponse.json(
        { error: "Error al actualizar factura manual", details: errUpdate.message },
        { status: 500 }
      );
    }

    if (!factura) {
      return NextResponse.json(
        { error: "Factura no encontrada" },
        { status: 404 }
      );
    }

    const { error: errDelete } = await supabase
      .from("items_factura_manual")
      .delete()
      .eq("factura_id", id);

    if (errDelete) {
      console.error("Error delete items:", errDelete);
      return NextResponse.json(
        { error: "Error al actualizar ítems" },
        { status: 500 }
      );
    }

    if (Array.isArray(items) && items.length > 0) {
      const rowsItems = items.map((it: any, index: number) => ({
        factura_id: id,
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
        return NextResponse.json(
          { error: "Error al guardar ítems de la factura", details: errItems.message },
          { status: 500 }
        );
      }
    }

    // Si la factura está vinculada a una cotización, actualizar el estado de la cotización según el estado de la factura
    const cotizacionUuid = ((cotizacionId ?? (factura as any)?.cotizacion_id) ?? "").trim();
    if (cotizacionUuid) {
      if (estado === "FACTURADA") {
        const { error: errCot } = await supabase
          .from("cotizaciones")
          .update({
            estado: "Facturada",
            fecha_actualizacion: new Date().toISOString(),
          })
          .eq("id", cotizacionUuid);
        if (errCot) console.error("Error actualizando estado cotización a Facturada:", errCot);
      } else if (estado === "ANULADA") {
        const { error: errCotAnul } = await supabase
          .from("cotizaciones")
          .update({
            estado: "Aprobada",
            fecha_actualizacion: new Date().toISOString(),
          })
          .eq("id", cotizacionUuid);
        if (errCotAnul) console.error("Error actualizando estado cotización a Aprobada:", errCotAnul);
      } else {
        // Guardar con estado BORRADOR (o cualquier otro): cotización en "Borrador"
        const { error: errCotBorrador } = await supabase
          .from("cotizaciones")
          .update({
            estado: "Borrador",
            fecha_actualizacion: new Date().toISOString(),
          })
          .eq("id", cotizacionUuid);
        if (errCotBorrador) console.error("Error actualizando estado cotización a Borrador:", errCotBorrador);
      }
    }

    return NextResponse.json({ success: true, data: factura });
  } catch (err: any) {
    console.error("PUT /api/contabilidad/facturas-manuales/[id]:", err);
    return NextResponse.json(
      { error: "Error interno del servidor", details: err?.message },
      { status: 500 }
    );
  }
}

/** DELETE - Eliminar factura manual (y sus ítems por CASCADE) */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const permiso = await requirePermiso("contabilidad", "editar");
    if (permiso instanceof Response) return permiso;

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "id es requerido" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error: errDelete } = await supabase
      .from("facturas_manuales")
      .delete()
      .eq("id", id)
      .eq("empresa_id", EMPRESA_ID);

    if (errDelete) {
      console.error("Error delete facturas_manuales:", errDelete);
      return NextResponse.json(
        { error: "Error al eliminar la factura", details: errDelete.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/contabilidad/facturas-manuales/[id]:", err);
    return NextResponse.json(
      { error: "Error interno del servidor", details: err?.message },
      { status: 500 }
    );
  }
}
