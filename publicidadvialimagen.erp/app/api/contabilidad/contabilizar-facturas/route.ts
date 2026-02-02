export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { requirePermiso } from "@/lib/permisos";

const EMPRESA_ID = 1;
const TOLERANCIA_BALANCE = 0.02;

/** POST - Contabilizar facturas manuales (ventas) en el rango de fechas.
 * Genera un comprobante por factura usando plantilla VENTA_DF, lo aprueba y actualiza la factura.
 */
export async function POST(request: NextRequest) {
  try {
    const permiso = await requirePermiso("contabilidad", "editar");
    if (permiso instanceof Response) return permiso;

    const supabase = getSupabaseAdmin();
    const body = await request.json().catch(() => ({}));
    const { desde_fecha, hasta_fecha, ventas } = body;

    // 1. Validar filtros
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
        { error: "Debe seleccionar al menos un tipo de documento (ventas)" },
        { status: 400 }
      );
    }

    // 2. Cargar facturas: rango de fechas, no ANULADA, pendientes de contabilizar
    let queryFacturas = supabase
      .from("facturas_manuales")
      .select("id, numero, fecha, cliente_nombre, cliente_nit, moneda, tipo_cambio, total, glosa, estado, estado_contable, comprobante_id")
      .eq("empresa_id", EMPRESA_ID)
      .gte("fecha", desde_fecha)
      .lte("fecha", hasta_fecha)
      .neq("estado", "ANULADA");

    const { data: facturas, error: errFacturas } = await queryFacturas;

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

    // 3. Cargar plantilla VENTA_DF y configuración de cuentas
    const { data: plantilla, error: errPlantilla } = await supabase
      .from("plantillas_contables")
      .select("id, codigo, tipo_comprobante")
      .eq("codigo", "VENTA_DF")
      .eq("activa", true)
      .single();

    if (errPlantilla || !plantilla) {
      return NextResponse.json(
        {
          error: "Plantilla VENTA_DF no encontrada o inactiva.",
          details: "Cree o active la plantilla con código VENTA_DF en Parámetros de contabilidad (plantillas contables).",
        },
        { status: 400 }
      );
    }

    const { data: detallesPlantilla, error: errDetalles } = await supabase
      .from("plantillas_contables_detalle")
      .select("id, orden, rol, lado, porcentaje, cuenta_fija")
      .eq("plantilla_id", plantilla.id)
      .order("orden", { ascending: true });

    if (errDetalles || !detallesPlantilla?.length) {
      return NextResponse.json(
        {
          error: "La plantilla VENTA_DF no tiene detalles configurados.",
          details: "Añada líneas (Cliente, Ingreso, IVA Débito) a la plantilla VENTA_DF en Parámetros.",
        },
        { status: 400 }
      );
    }

    const { data: configRows } = await supabase
      .from("contabilidad_config")
      .select("key, value")
      .in("key", ["IVA_DEBITO_CUENTA", "VENTA_DF_CLIENTE_CUENTA", "VENTA_DF_INGRESO_CUENTA"]);

    const config: Record<string, string> = {};
    configRows?.forEach((r: { key: string; value: string }) => {
      config[r.key] = r.value;
    });

    const cuentaCliente = config["VENTA_DF_CLIENTE_CUENTA"];
    const cuentaIngreso = config["VENTA_DF_INGRESO_CUENTA"];
    const cuentaIvaDebito = config["IVA_DEBITO_CUENTA"];

    if (!cuentaCliente || !cuentaIngreso || !cuentaIvaDebito) {
      const keysFaltantes: string[] = [];
      if (!cuentaCliente) keysFaltantes.push("VENTA_DF_CLIENTE_CUENTA");
      if (!cuentaIngreso) keysFaltantes.push("VENTA_DF_INGRESO_CUENTA");
      if (!cuentaIvaDebito) keysFaltantes.push("IVA_DEBITO_CUENTA");
      return NextResponse.json(
        {
          error: "Faltan cuentas en configuración contable.",
          details: `Claves faltantes en contabilidad_config: ${keysFaltantes.join(", ")}. Ejecute la migración 037 o añada estas claves en Parámetros de contabilidad (tabla contabilidad_config).`,
        },
        { status: 400 }
      );
    }

    // Validar que las cuentas existan en plan_cuentas
    const { data: cuentasExistentes } = await supabase
      .from("plan_cuentas")
      .select("cuenta")
      .in("cuenta", [cuentaCliente, cuentaIngreso, cuentaIvaDebito])
      .eq("empresa_id", EMPRESA_ID);

    const cuentasOk = (cuentasExistentes || []).map((c: { cuenta: string }) => c.cuenta);
    const faltantes = [cuentaCliente, cuentaIngreso, cuentaIvaDebito].filter((c) => !cuentasOk.includes(c));
    if (faltantes.length > 0) {
      return NextResponse.json(
        {
          error: "Las siguientes cuentas no existen en el plan de cuentas (empresa_id=1).",
          details: `Cuentas: ${faltantes.join(", ")}. Configure VENTA_DF_CLIENTE_CUENTA, VENTA_DF_INGRESO_CUENTA e IVA_DEBITO_CUENTA en Parámetros de contabilidad con códigos que existan en el plan de cuentas.`,
        },
        { status: 400 }
      );
    }

    const porcentajeIVA = 13;
    const comprobantes: { factura_id: string; factura_numero: string | null; comprobante_id: number; numero: string }[] = [];
    const errores_detalle: { factura_id: string; factura_numero: string | null; error: string }[] = [];

    for (const factura of candidatas) {
      try {
        // Validar factura
        const total = Number(factura.total) || 0;
        if (total <= 0) {
          await marcarError(supabase, factura.id, "Total debe ser mayor a 0");
          errores_detalle.push({ factura_id: factura.id, factura_numero: factura.numero, error: "Total debe ser mayor a 0" });
          continue;
        }

        const monedaFactura = (factura.moneda || "BOB").toUpperCase();
        const monedaComprobante = monedaFactura === "USD" ? "USD" : "BS";
        const tipoCambio = Number(factura.tipo_cambio) || 1;
        if (tipoCambio <= 0) {
          await marcarError(supabase, factura.id, "Tipo de cambio inválido");
          errores_detalle.push({ factura_id: factura.id, factura_numero: factura.numero, error: "Tipo de cambio inválido" });
          continue;
        }

        const fecha = String(factura.fecha).slice(0, 10);
        const periodo = parseInt(fecha.slice(5, 7), 10) || 1;
        const gestion = parseInt(fecha.slice(0, 4), 10) || new Date().getFullYear();

        const montoTotal = total;
        const montoBase = Math.round((montoTotal / (1 + porcentajeIVA / 100)) * 100) / 100;
        const montoIVA = Math.round((montoTotal - montoBase) * 100) / 100;
        const montoTotalAjustado = montoBase + montoIVA;

        const concepto = `Contab. Factura ${factura.numero || factura.id}`;

        const comprobanteData = {
          origen: "Ventas",
          tipo_comprobante: plantilla.tipo_comprobante,
          tipo_asiento: "Normal",
          fecha,
          periodo,
          gestion,
          moneda: monedaComprobante,
          tipo_cambio: tipoCambio,
          concepto,
          beneficiario: factura.cliente_nombre || null,
          estado: "BORRADOR",
          empresa_id: EMPRESA_ID,
        };

        const { data: comprobanteCreado, error: errInsertComp } = await supabase
          .from("comprobantes")
          .insert(comprobanteData)
          .select("id")
          .single();

        if (errInsertComp || !comprobanteCreado) {
          await marcarError(supabase, factura.id, errInsertComp?.message || "Error al crear comprobante");
          errores_detalle.push({
            factura_id: factura.id,
            factura_numero: factura.numero,
            error: errInsertComp?.message || "Error al crear comprobante",
          });
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

        detallesPlantilla.forEach((det: any, index: number) => {
          let cuenta = "";
          let monto = 0;
          if (det.rol === "CLIENTE") {
            cuenta = cuentaCliente;
            monto = montoTotalAjustado;
          } else if (det.rol === "INGRESO") {
            cuenta = cuentaIngreso;
            monto = montoBase;
          } else if (det.rol === "IVA_DEBITO") {
            cuenta = cuentaIvaDebito;
            monto = montoIVA;
          } else if (det.cuenta_fija) {
            cuenta = det.cuenta_fija;
            monto = 0;
          }
          if (!cuenta) return;

          const debe_bs = det.lado === "DEBE" && monedaComprobante === "BS" ? monto : 0;
          const haber_bs = det.lado === "HABER" && monedaComprobante === "BS" ? monto : 0;
          const debe_usd = det.lado === "DEBE" && monedaComprobante === "USD" ? monto : 0;
          const haber_usd = det.lado === "HABER" && monedaComprobante === "USD" ? monto : 0;

          detallesData.push({
            comprobante_id: comprobanteId,
            cuenta,
            auxiliar: null,
            glosa: null,
            debe_bs,
            haber_bs,
            debe_usd,
            haber_usd,
            orden: index + 1,
          });
        });

        if (detallesData.length === 0) {
          await supabase.from("comprobantes").delete().eq("id", comprobanteId);
          await marcarError(supabase, factura.id, "La plantilla no generó líneas contables");
          errores_detalle.push({
            factura_id: factura.id,
            factura_numero: factura.numero,
            error: "La plantilla no generó líneas contables",
          });
          continue;
        }

        const totalDebeBS = detallesData.reduce((s, d) => s + d.debe_bs, 0);
        const totalHaberBS = detallesData.reduce((s, d) => s + d.haber_bs, 0);
        const totalDebeUSD = detallesData.reduce((s, d) => s + d.debe_usd, 0);
        const totalHaberUSD = detallesData.reduce((s, d) => s + d.haber_usd, 0);
        const diffBS = Math.abs(totalDebeBS - totalHaberBS);
        const diffUSD = Math.abs(totalDebeUSD - totalHaberUSD);

        if (diffBS > TOLERANCIA_BALANCE || diffUSD > TOLERANCIA_BALANCE) {
          await supabase.from("comprobantes").delete().eq("id", comprobanteId);
          await marcarError(
            supabase,
            factura.id,
            `Comprobante no balanceado (Debe ≠ Haber). BS: ${diffBS.toFixed(2)}, USD: ${diffUSD.toFixed(2)}`
          );
          errores_detalle.push({
            factura_id: factura.id,
            factura_numero: factura.numero,
            error: "Comprobante no balanceado",
          });
          continue;
        }

        const { error: errDetalles } = await supabase.from("comprobante_detalle").insert(detallesData);

        if (errDetalles) {
          await supabase.from("comprobantes").delete().eq("id", comprobanteId);
          await marcarError(supabase, factura.id, errDetalles.message);
          errores_detalle.push({ factura_id: factura.id, factura_numero: factura.numero, error: errDetalles.message });
          continue;
        }

        const { data: ultimoComp } = await supabase
          .from("comprobantes")
          .select("numero")
          .eq("empresa_id", EMPRESA_ID)
          .eq("tipo_comprobante", plantilla.tipo_comprobante)
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
          .eq("id", comprobanteId)
          .eq("empresa_id", EMPRESA_ID);

        if (errAprobar) {
          await marcarError(supabase, factura.id, errAprobar.message);
          errores_detalle.push({ factura_id: factura.id, factura_numero: factura.numero, error: errAprobar.message });
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
          .eq("id", factura.id)
          .eq("empresa_id", EMPRESA_ID);

        if (errUpdateFactura) {
          errores_detalle.push({
            factura_id: factura.id,
            factura_numero: factura.numero,
            error: "Comprobante creado pero no se pudo actualizar la factura: " + errUpdateFactura.message,
          });
          continue;
        }

        comprobantes.push({
          factura_id: factura.id,
          factura_numero: factura.numero,
          comprobante_id: comprobanteId,
          numero: siguienteNumero,
        });
      } catch (e: any) {
        const msg = e?.message || String(e);
        await marcarError(supabase, factura.id, msg);
        errores_detalle.push({ factura_id: factura.id, factura_numero: factura.numero, error: msg });
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
    console.error("POST /api/contabilidad/contabilizar-facturas:", error);
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
    .eq("id", facturaId)
    .eq("empresa_id", EMPRESA_ID);
}
