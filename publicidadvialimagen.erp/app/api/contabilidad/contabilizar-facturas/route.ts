export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { requirePermiso } from "@/lib/permisos";

/** Cuentas fijas según sistema antiguo (Contabilización de Facturas → Comprobantes). */
const CUENTA_VENTA_DEFAULT = "112001001";
const CUENTA_IT_3 = "525002001";
const CUENTA_IVA_DEBITO_13 = "214001001";
const CUENTA_IT_POR_PAGAR_3 = "214004001";
const CUENTA_INGRESO_VENTAS = "411002001";

const TOLERANCIA_BALANCE = 0.02;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** POST - Contabilizar facturas manuales (solo Ventas) en el rango de fechas.
 * Un comprobante por factura. Detalle: N líneas (una por ítem, cuenta por cobrar) + 4 líneas consolidadas.
 *
 * total_factura = suma de importes de todos los ítems.
 *
 * PASO 1 — Por cada ítem: 1 línea cuenta_venta (112001001 o la del producto/soporte)
 *   DEBE = importe ítem, HABER = 0, glosa = descripción ítem.
 *
 * PASO 2 — 4 líneas consolidadas con total_factura:
 *   IT 3% (525002001)         DEBE = total*0.03   HABER = 0   glosa = código factura
 *   IVA 13% (214001001)       DEBE = 0            HABER = total*0.13  glosa = código factura
 *   IT por pagar (214004001)  DEBE = 0            HABER = total*0.03   glosa = código factura
 *   Ingreso ventas (411002001) DEBE = 0           HABER = total*0.87   glosa = código factura
 *
 * Balance: DEBE = total_factura + total*0.03 = total*1.03, HABER = total*1.03  ✓
 */
export async function POST(request: NextRequest) {
  try {
    const permiso = await requirePermiso("contabilidad", "editar");
    if (permiso instanceof Response) return permiso;

    const supabase = getSupabaseAdmin();
    const body = await request.json().catch(() => ({}));
    const { desde_fecha, hasta_fecha, ventas, empresa_id, sucursal_id } = body;

    if (!desde_fecha || !hasta_fecha) {
      return NextResponse.json(
        { error: "desde_fecha y hasta_fecha son requeridos" },
        { status: 400 }
      );
    }
    if (new Date(desde_fecha) > new Date(hasta_fecha)) {
      return NextResponse.json(
        { error: "desde_fecha debe ser menor o igual que hasta_fecha" },
        { status: 400 }
      );
    }
    if (!ventas) {
      return NextResponse.json(
        { error: "Debe seleccionar Ventas para contabilizar." },
        { status: 400 }
      );
    }

    // Tipo de cambio USD desde tabla divisas (evita hardcodeo)
    const { data: divisasRows, error: errDivisas } = await supabase
      .from("divisas")
      .select("id, codigo, tipo_cambio")
      .eq("codigo", "USD")
      .eq("estado", "Activo")
      .limit(1)
      .maybeSingle();

    if (errDivisas) {
      console.error("Error cargando divisas:", errDivisas);
      return NextResponse.json(
        { error: "Error al obtener tipo de cambio. Verifique la configuración de Divisas en Parámetros." },
        { status: 500 }
      );
    }

    const divisaUsd = divisasRows;
    if (!divisaUsd || typeof divisaUsd.tipo_cambio !== "number" || divisaUsd.tipo_cambio <= 0) {
      return NextResponse.json(
        {
          error:
            "No hay divisa USD activa configurada o el tipo de cambio no es válido. Configure las divisas en Contabilidad → Parámetros → Divisas.",
        },
        { status: 400 }
      );
    }

    const tipoCambioUsd = divisaUsd.tipo_cambio;

    let facturasResult = await supabase
      .from("facturas_manuales")
      .select("id, codigo, fecha, glosa, estado_contable, comprobante_id, cliente_nit, cliente_nombre, cliente_auxiliar_codigo")
      .gte("fecha", desde_fecha)
      .lte("fecha", hasta_fecha)
      .neq("estado", "ANULADA");

    if (facturasResult.error && (facturasResult.error.message?.includes("cliente_auxiliar_codigo") || (facturasResult.error as any).code === "42703")) {
      facturasResult = await supabase
        .from("facturas_manuales")
        .select("id, codigo, fecha, glosa, estado_contable, comprobante_id, cliente_nit, cliente_nombre")
        .gte("fecha", desde_fecha)
        .lte("fecha", hasta_fecha)
        .neq("estado", "ANULADA");
    }

    const { data: facturas, error: errFacturas } = facturasResult;
    if (errFacturas) {
      console.error("Error cargando facturas:", errFacturas);
      return NextResponse.json(
        { error: "Error al cargar facturas", details: errFacturas.message },
        { status: 500 }
      );
    }

    const candidatas = (facturas || []).filter(
      (f: any) =>
        f.estado_contable === "PENDIENTE" ||
        f.estado_contable == null ||
        (f.estado_contable !== "CONTABILIZADO" && f.estado_contable !== "ERROR")
    );

    if (candidatas.length === 0) {
      return NextResponse.json({
        success: true,
        total: 0,
        contabilizadas: 0,
        errores: 0,
        comprobantes: [],
        errores_detalle: [],
        message: "No hay facturas pendientes de contabilizar en el periodo seleccionado.",
      });
    }

    const hoy = new Date();
    const gestion = hoy.getFullYear();
    const periodo = hoy.getMonth() + 1;
    const fechaHoy = hoy.toISOString().slice(0, 10);

    const comprobantes: { factura_id: string; factura_numero: string | null; comprobante_id: number; numero: string }[] = [];
    const errores_detalle: { factura_id: string; factura_numero: string | null; error: string }[] = [];

    for (const factura of candidatas) {
      try {
        const codigoFactura = factura.codigo || String(factura.id);

        // Cargar ítems de la factura
        const { data: items, error: errItems } = await supabase
          .from("items_factura_manual")
          .select("id, orden, codigo_producto, descripcion, cantidad, precio_unitario, descuento, importe")
          .eq("factura_id", factura.id)
          .order("orden", { ascending: true });

        if (errItems) {
          await marcarError(supabase, factura.id, "Error al cargar ítems: " + errItems.message);
          errores_detalle.push({ factura_id: factura.id, factura_numero: factura.codigo, error: errItems.message });
          continue;
        }

        const itemsFactura = items || [];
        if (itemsFactura.length === 0) {
          await marcarError(supabase, factura.id, "Factura sin ítems");
          errores_detalle.push({ factura_id: factura.id, factura_numero: factura.codigo, error: "Factura sin ítems" });
          continue;
        }

        // Resolver cuenta_venta por código de producto (productos y recursos/soportes)
        const codigosProducto = [...new Set(itemsFactura.map((i: any) => (i.codigo_producto || "").trim()).filter(Boolean))];
        const mapaCuentaVenta: Record<string, string> = {};
        if (codigosProducto.length > 0) {
          const { data: productos } = await supabase
            .from("productos")
            .select("codigo, cuenta_venta")
            .in("codigo", codigosProducto);
          (productos || []).forEach((p: any) => {
            if (p.codigo && p.cuenta_venta) mapaCuentaVenta[p.codigo] = p.cuenta_venta;
          });
          const { data: recursos } = await supabase
            .from("recursos")
            .select("codigo, cuenta_venta")
            .in("codigo", codigosProducto);
          (recursos || []).forEach((r: any) => {
            if (r.codigo && r.cuenta_venta && !mapaCuentaVenta[r.codigo])
              mapaCuentaVenta[r.codigo] = r.cuenta_venta;
          });
        }

        // Resolver auxiliar del cliente: primero el guardado en factura (cliente_auxiliar_codigo), sino por NIT/nombre
        let auxiliarClienteCodigo: string | null = String((factura as any).cliente_auxiliar_codigo ?? "").trim() || null;
        if (!auxiliarClienteCodigo) {
          const clienteNit = String((factura as any).cliente_nit ?? "").trim();
          const clienteNombre = String((factura as any).cliente_nombre ?? "").trim();
          if (clienteNit || clienteNombre) {
            let queryAux = supabase
              .from("auxiliares")
              .select("id, codigo")
              .eq("tipo_auxiliar", "Cliente")
              .limit(1);
            if (clienteNit) {
              queryAux = queryAux.eq("codigo", clienteNit);
            } else {
              queryAux = queryAux.ilike("nombre", `%${clienteNombre.replace(/%/g, "\\%")}%`);
            }
            const { data: auxCliente } = await queryAux.maybeSingle();
            if (auxCliente?.codigo) {
              auxiliarClienteCodigo = auxCliente.codigo;
            }
          }
        }

        // En contabilización de facturas: asignar auxiliar del cliente a todas las líneas cuya cuenta empiece por 1 (ítems) y a la de ingreso (4.x)
        const asignarAuxiliarEnLinea = (cuenta: string): boolean =>
          Boolean(auxiliarClienteCodigo && (cuenta.startsWith("1") || cuenta === CUENTA_INGRESO_VENTAS));

        // Cabecera del comprobante: empresa y sucursal = valores seleccionados en Contabilización de facturas; beneficiario = cliente de la factura
        const comprobanteData: Record<string, unknown> = {
          origen: "Ventas",
          tipo_comprobante: "Traspaso",
          tipo_asiento: "Normal",
          fecha: fechaHoy,
          periodo,
          gestion,
          moneda: "BS",
          tipo_cambio: tipoCambioUsd,
          concepto: factura.glosa || null,
          beneficiario: (factura.cliente_nombre ?? "").trim() || null,
          nro_cheque: null,
          estado: "BORRADOR",
          empresa_uuid: empresa_id ?? null,
          sucursal_id: sucursal_id ?? null,
        };

        const { data: comprobanteCreado, error: errInsertComp } = await supabase
          .from("comprobantes")
          .insert(comprobanteData)
          .select("id")
          .single();

        if (errInsertComp || !comprobanteCreado) {
          const msg = errInsertComp?.message || "Error al crear comprobante";
          console.error("Error insertando comprobante:", msg, comprobanteData);
          await marcarError(supabase, factura.id, msg);
          errores_detalle.push({ factura_id: factura.id, factura_numero: factura.codigo, error: msg });
          continue;
        }

        const comprobanteId = comprobanteCreado.id;
        const detallesData: Array<{
          comprobante_id: number;
          cuenta: string;
          auxiliar: string | null;
          glosa: string | null;
          debe_bs: number;
          haber_bs: number;
          debe_usd: number;
          haber_usd: number;
          orden: number;
        }> = [];

        // Total factura = suma de importes de todos los ítems (para líneas consolidadas)
        const totalFactura = round2(
          itemsFactura.reduce((sum, it) => sum + round2(Number(it.importe) || 0), 0)
        );

        let orden = 0;

        // PASO 1: Una línea por ítem — cuenta por cobrar (cuenta_venta), DEBE = importe ítem, glosa = descripción ítem
        for (const item of itemsFactura) {
          const importe = round2(Number(item.importe) || 0);
          if (importe <= 0) continue;

          const cuentaVenta = (item.codigo_producto && mapaCuentaVenta[String(item.codigo_producto).trim()]) || CUENTA_VENTA_DEFAULT;
          const descripcionItem = (item.descripcion || "").trim() || codigoFactura;
          const asignarAux = asignarAuxiliarEnLinea(cuentaVenta);

          const debeUsd = round2(importe / tipoCambioUsd);
          orden++;
          detallesData.push({
            comprobante_id: comprobanteId,
            cuenta: cuentaVenta,
            auxiliar: asignarAux ? auxiliarClienteCodigo : null,
            glosa: descripcionItem,
            debe_bs: importe,
            haber_bs: 0,
            debe_usd: debeUsd,
            haber_usd: 0,
            orden,
          });
        }

        // PASO 2: 4 líneas consolidadas con total_factura (solo si hay total > 0). IVA/IT sin auxiliar; ingreso según permite_auxiliar.
        if (totalFactura > 0) {
          const it3 = round2(totalFactura * 0.03);
          const iva13 = round2(totalFactura * 0.13);
          const ingreso87 = round2(totalFactura * 0.87);

          const it3Usd = round2(it3 / tipoCambioUsd);
          const iva13Usd = round2(iva13 / tipoCambioUsd);
          const ingreso87Usd = round2(ingreso87 / tipoCambioUsd);
          orden++;
          detallesData.push({
            comprobante_id: comprobanteId,
            cuenta: CUENTA_IT_3,
            auxiliar: null,
            glosa: codigoFactura,
            debe_bs: it3,
            haber_bs: 0,
            debe_usd: it3Usd,
            haber_usd: 0,
            orden,
          });
          orden++;
          detallesData.push({
            comprobante_id: comprobanteId,
            cuenta: CUENTA_IVA_DEBITO_13,
            auxiliar: null,
            glosa: codigoFactura,
            debe_bs: 0,
            haber_bs: iva13,
            debe_usd: 0,
            haber_usd: iva13Usd,
            orden,
          });
          orden++;
          detallesData.push({
            comprobante_id: comprobanteId,
            cuenta: CUENTA_IT_POR_PAGAR_3,
            auxiliar: null,
            glosa: codigoFactura,
            debe_bs: 0,
            haber_bs: it3,
            debe_usd: 0,
            haber_usd: it3Usd,
            orden,
          });
          const asignarAuxIngreso = asignarAuxiliarEnLinea(CUENTA_INGRESO_VENTAS);
          orden++;
          detallesData.push({
            comprobante_id: comprobanteId,
            cuenta: CUENTA_INGRESO_VENTAS,
            auxiliar: asignarAuxIngreso ? auxiliarClienteCodigo : null,
            glosa: codigoFactura,
            debe_bs: 0,
            haber_bs: ingreso87,
            debe_usd: 0,
            haber_usd: ingreso87Usd,
            orden,
          });
        }

        if (detallesData.length === 0) {
          await supabase.from("comprobantes").delete().eq("id", comprobanteId);
          await marcarError(supabase, factura.id, "No se generaron líneas contables");
          errores_detalle.push({ factura_id: factura.id, factura_numero: factura.codigo, error: "No se generaron líneas contables" });
          continue;
        }

        // Validar balance DEBE = HABER
        const totalDebeBS = round2(detallesData.reduce((s, d) => s + d.debe_bs, 0));
        const totalHaberBS = round2(detallesData.reduce((s, d) => s + d.haber_bs, 0));
        const diffBS = Math.abs(totalDebeBS - totalHaberBS);

        if (diffBS > TOLERANCIA_BALANCE) {
          await supabase.from("comprobantes").delete().eq("id", comprobanteId);
          const errMsg = `Comprobante no balanceado: Debe=${totalDebeBS}, Haber=${totalHaberBS}, Diff=${diffBS.toFixed(2)}`;
          await marcarError(supabase, factura.id, errMsg);
          errores_detalle.push({ factura_id: factura.id, factura_numero: factura.codigo, error: errMsg });
          continue;
        }

        const { error: errDetalles } = await supabase.from("comprobante_detalle").insert(detallesData);

        if (errDetalles) {
          console.error("Error insertando detalle:", errDetalles.message, JSON.stringify(detallesData[0]));
          await supabase.from("comprobantes").delete().eq("id", comprobanteId);
          await marcarError(supabase, factura.id, errDetalles.message);
          errores_detalle.push({ factura_id: factura.id, factura_numero: factura.codigo, error: errDetalles.message });
          continue;
        }

        // Asignar número y aprobar
        const { data: ultimoComp } = await supabase
          .from("comprobantes")
          .select("numero")
          .eq("tipo_comprobante", "Traspaso")
          .eq("estado", "APROBADO")
          .order("numero", { ascending: false })
          .limit(1)
          .maybeSingle();

        let siguienteNumero = "001";
        if (ultimoComp?.numero) {
          const n = parseInt(ultimoComp.numero, 10) || 0;
          siguienteNumero = String(n + 1).padStart(3, "0");
        }

        const { error: errAprobar } = await supabase
          .from("comprobantes")
          .update({ estado: "APROBADO", numero: siguienteNumero })
          .eq("id", comprobanteId);

        if (errAprobar) {
          await marcarError(supabase, factura.id, errAprobar.message);
          errores_detalle.push({ factura_id: factura.id, factura_numero: factura.codigo, error: errAprobar.message });
          continue;
        }

        const { error: errUpdateFactura } = await supabase
          .from("facturas_manuales")
          .update({
            estado_contable: "CONTABILIZADO",
            fecha_contabilizacion: new Date().toISOString(),
            comprobante_id: comprobanteId,
            error_contabilizacion: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", factura.id);

        if (errUpdateFactura) {
          errores_detalle.push({
            factura_id: factura.id,
            factura_numero: factura.codigo,
            error: "Comprobante creado pero no se pudo actualizar la factura: " + errUpdateFactura.message,
          });
          continue;
        }

        comprobantes.push({
          factura_id: factura.id,
          factura_numero: factura.codigo,
          comprobante_id: comprobanteId,
          numero: siguienteNumero,
          tipo_comprobante: "Traspaso",
        });
      } catch (e: any) {
        const msg = e?.message || String(e);
        await marcarError(supabase, factura.id, msg);
        errores_detalle.push({ factura_id: factura.id, factura_numero: factura.codigo, error: msg });
      }
    }

    return NextResponse.json({
      success: true,
      total: candidatas.length,
      contabilizadas: comprobantes.length,
      errores: errores_detalle.length,
      comprobantes,
      errores_detalle,
      message:
        comprobantes.length === candidatas.length
          ? `${comprobantes.length} factura(s) contabilizada(s) correctamente.`
          : `Procesadas ${candidatas.length}: ${comprobantes.length} contabilizadas, ${errores_detalle.length} con error.`,
    });
  } catch (error: any) {
    console.error("Error en contabilizar-facturas:", error);
    return NextResponse.json(
      { error: "Error interno del servidor", details: error?.message },
      { status: 500 }
    );
  }
}

async function marcarError(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  facturaId: string,
  mensaje: string
): Promise<void> {
  await supabase
    .from("facturas_manuales")
    .update({
      estado_contable: "ERROR",
      error_contabilizacion: mensaje.slice(0, 500),
      updated_at: new Date().toISOString(),
    })
    .eq("id", facturaId);
}
