export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"

interface AplicarPlantillaBody {
  plantilla_codigo: string
  moneda: "BS" | "USD"
  tipo_cambio?: number
  monto_total?: number
  monto_base?: number
  cuenta_gasto?: string
  cuenta_ingreso?: string
  cuenta_contraparte: string
  auxiliar_codigo?: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar permisos
    const permiso = await requirePermiso("contabilidad", "editar")
    if (permiso instanceof Response) {
      return permiso
    }

    const supabase = getSupabaseAdmin()
    const body: AplicarPlantillaBody = await request.json()

    // Validaciones básicas
    if (!body.plantilla_codigo || !body.cuenta_contraparte) {
      return NextResponse.json(
        { error: "plantilla_codigo y cuenta_contraparte son requeridos" },
        { status: 400 }
      )
    }

    if (!body.monto_total && !body.monto_base) {
      return NextResponse.json(
        { error: "Debe proporcionar monto_total o monto_base" },
        { status: 400 }
      )
    }

    // Verificar que el comprobante existe y está en BORRADOR
    const { data: comprobante, error: errorComprobante } = await supabase
      .from("comprobantes")
      .select("*")
      .eq("id", params.id)
      .single()

    if (errorComprobante || !comprobante) {
      return NextResponse.json(
        { error: "Comprobante no encontrado" },
        { status: 404 }
      )
    }

    if (comprobante.estado !== "BORRADOR") {
      return NextResponse.json(
        { error: "Solo se pueden aplicar plantillas a comprobantes en estado BORRADOR" },
        { status: 400 }
      )
    }

    // Cargar plantilla
    const { data: plantilla, error: errorPlantilla } = await supabase
      .from("plantillas_contables")
      .select("*")
      .eq("codigo", body.plantilla_codigo)
      .eq("activa", true)
      .single()

    if (errorPlantilla || !plantilla) {
      return NextResponse.json(
        { error: "Plantilla no encontrada o inactiva" },
        { status: 404 }
      )
    }

    // Cargar detalles de la plantilla ordenados
    const { data: detallesPlantilla, error: errorDetallesPlantilla } = await supabase
      .from("plantillas_contables_detalle")
      .select("*")
      .eq("plantilla_id", plantilla.id)
      .order("orden", { ascending: true })

    if (errorDetallesPlantilla || !detallesPlantilla || detallesPlantilla.length === 0) {
      return NextResponse.json(
        { error: "La plantilla no tiene detalles configurados" },
        { status: 400 }
      )
    }

    // Cargar configuración de cuentas IVA
    const { data: configIVA } = await supabase
      .from("contabilidad_config")
      .select("key, value")
      .in("key", ["IVA_CREDITO_CUENTA", "IVA_DEBITO_CUENTA"])

    const configMap: Record<string, string> = {}
    configIVA?.forEach((item) => {
      configMap[item.key] = item.value
    })

    // Calcular montos (base e IVA)
    let montoBase: number
    let montoIVA: number
    let montoTotal: number

    const tieneIVA = detallesPlantilla.some((d) => d.porcentaje !== null && d.porcentaje > 0)
    const porcentajeIVA = tieneIVA ? (detallesPlantilla.find((d) => d.porcentaje !== null)?.porcentaje || 13) : 0

    if (body.monto_total !== undefined && body.monto_total !== null) {
      // Calcular desde monto total
      montoTotal = body.monto_total
      if (porcentajeIVA > 0) {
        montoBase = Math.round((montoTotal / (1 + porcentajeIVA / 100)) * 100) / 100
        montoIVA = Math.round((montoTotal - montoBase) * 100) / 100
        // Ajustar para que cuadre exactamente
        montoTotal = montoBase + montoIVA
      } else {
        montoBase = montoTotal
        montoIVA = 0
      }
    } else if (body.monto_base !== undefined && body.monto_base !== null) {
      // Calcular desde monto base
      montoBase = body.monto_base
      if (porcentajeIVA > 0) {
        montoIVA = Math.round((montoBase * (porcentajeIVA / 100)) * 100) / 100
        montoTotal = Math.round((montoBase + montoIVA) * 100) / 100
      } else {
        montoIVA = 0
        montoTotal = montoBase
      }
    } else {
      return NextResponse.json(
        { error: "Debe proporcionar monto_total o monto_base" },
        { status: 400 }
      )
    }

    // Validar que las cuentas existan en plan_cuentas
    const cuentasAValidar: string[] = []
    
    detallesPlantilla.forEach((det) => {
      if (det.rol === "GASTO" && body.cuenta_gasto) {
        cuentasAValidar.push(body.cuenta_gasto)
      } else if (det.rol === "INGRESO" && body.cuenta_ingreso) {
        cuentasAValidar.push(body.cuenta_ingreso)
      } else if (det.rol === "IVA_CREDITO" && configMap["IVA_CREDITO_CUENTA"]) {
        cuentasAValidar.push(configMap["IVA_CREDITO_CUENTA"])
      } else if (det.rol === "IVA_DEBITO" && configMap["IVA_DEBITO_CUENTA"]) {
        cuentasAValidar.push(configMap["IVA_DEBITO_CUENTA"])
      } else if (
        (det.rol === "PROVEEDOR" || det.rol === "CLIENTE" || det.rol === "CAJA_BANCO") &&
        body.cuenta_contraparte
      ) {
        cuentasAValidar.push(body.cuenta_contraparte)
      } else if (det.cuenta_fija) {
        cuentasAValidar.push(det.cuenta_fija)
      }
    })

    // Validar cuentas
    if (cuentasAValidar.length > 0) {
      const { data: cuentasValidadas, error: errorCuentas } = await supabase
        .from("plan_cuentas")
        .select("cuenta")
        .in("cuenta", cuentasAValidar)
        .eq("empresa_id", comprobante.empresa_id)

      if (errorCuentas) {
        return NextResponse.json(
          { error: "Error al validar cuentas", details: errorCuentas.message },
          { status: 500 }
        )
      }

      const cuentasEncontradas = cuentasValidadas?.map((c) => c.cuenta) || []
      const cuentasFaltantes = cuentasAValidar.filter((c) => !cuentasEncontradas.includes(c))

      if (cuentasFaltantes.length > 0) {
        return NextResponse.json(
          { error: `Las siguientes cuentas no existen: ${cuentasFaltantes.join(", ")}` },
          { status: 400 }
        )
      }
    }

    // Eliminar detalles existentes del comprobante (solo si está en BORRADOR)
    const { error: errorEliminar } = await supabase
      .from("comprobante_detalle")
      .delete()
      .eq("comprobante_id", params.id)

    if (errorEliminar) {
      return NextResponse.json(
        { error: "Error al eliminar detalles existentes", details: errorEliminar.message },
        { status: 500 }
      )
    }

    // Construir líneas de comprobante_detalle
    const detallesData: any[] = []
    const monedaComprobante = body.moneda || comprobante.moneda || "BS"

    detallesPlantilla.forEach((detPlantilla, index) => {
      let cuenta: string | null = null
      let auxiliar: string | null = null
      let debe_bs = 0
      let haber_bs = 0
      let debe_usd = 0
      let haber_usd = 0
      let monto: number

      // Determinar cuenta según rol
      if (detPlantilla.rol === "GASTO" && body.cuenta_gasto) {
        cuenta = body.cuenta_gasto
      } else if (detPlantilla.rol === "INGRESO" && body.cuenta_ingreso) {
        cuenta = body.cuenta_ingreso
      } else if (detPlantilla.rol === "IVA_CREDITO" && configMap["IVA_CREDITO_CUENTA"]) {
        cuenta = configMap["IVA_CREDITO_CUENTA"]
        monto = montoIVA
      } else if (detPlantilla.rol === "IVA_DEBITO" && configMap["IVA_DEBITO_CUENTA"]) {
        cuenta = configMap["IVA_DEBITO_CUENTA"]
        monto = montoIVA
      } else if (
        (detPlantilla.rol === "PROVEEDOR" || detPlantilla.rol === "CLIENTE" || detPlantilla.rol === "CAJA_BANCO") &&
        body.cuenta_contraparte
      ) {
        cuenta = body.cuenta_contraparte
        monto = montoTotal
        if (body.auxiliar_codigo && detPlantilla.permite_auxiliar) {
          auxiliar = body.auxiliar_codigo
        }
      } else if (detPlantilla.cuenta_fija) {
        cuenta = detPlantilla.cuenta_fija
      } else {
        // Para GASTO/INGRESO sin cuenta proporcionada, usar cuenta_contraparte como fallback
        cuenta = body.cuenta_contraparte
      }

      // Determinar monto según rol
      if (monto === undefined) {
        if (detPlantilla.rol === "GASTO" || detPlantilla.rol === "INGRESO") {
          monto = montoBase
        } else if (detPlantilla.rol === "PROVEEDOR" || detPlantilla.rol === "CLIENTE" || detPlantilla.rol === "CAJA_BANCO") {
          monto = montoTotal
        } else {
          monto = 0
        }
      }

      // Asignar a DEBE o HABER según lado
      if (detPlantilla.lado === "DEBE") {
        if (monedaComprobante === "BS") {
          debe_bs = monto
        } else {
          debe_usd = monto
        }
      } else {
        if (monedaComprobante === "BS") {
          haber_bs = monto
        } else {
          haber_usd = monto
        }
      }

      detallesData.push({
        comprobante_id: params.id,
        cuenta: cuenta,
        auxiliar: auxiliar,
        glosa: null,
        debe_bs: debe_bs,
        haber_bs: haber_bs,
        debe_usd: debe_usd,
        haber_usd: haber_usd,
        orden: index + 1,
      })
    })

    // Validar que cuadre (Debe == Haber)
    const totalDebeBS = detallesData.reduce((sum, d) => sum + (d.debe_bs || 0), 0)
    const totalHaberBS = detallesData.reduce((sum, d) => sum + (d.haber_bs || 0), 0)
    const totalDebeUSD = detallesData.reduce((sum, d) => sum + (d.debe_usd || 0), 0)
    const totalHaberUSD = detallesData.reduce((sum, d) => sum + (d.haber_usd || 0), 0)

    const diferenciaBS = Math.abs(totalDebeBS - totalHaberBS)
    const diferenciaUSD = Math.abs(totalDebeUSD - totalHaberUSD)

    if (diferenciaBS > 0.01 || diferenciaUSD > 0.01) {
      return NextResponse.json(
        {
          error: "El comprobante no cuadra",
          detalles: {
            debe_bs: totalDebeBS,
            haber_bs: totalHaberBS,
            diferencia_bs: diferenciaBS,
            debe_usd: totalDebeUSD,
            haber_usd: totalHaberUSD,
            diferencia_usd: diferenciaUSD,
          },
        },
        { status: 400 }
      )
    }

    // Insertar detalles
    const { data: detallesInsertados, error: errorInsertar } = await supabase
      .from("comprobante_detalle")
      .insert(detallesData)
      .select()

    if (errorInsertar) {
      return NextResponse.json(
        { error: "Error al insertar detalles", details: errorInsertar.message },
        { status: 500 }
      )
    }

    // Calcular totales
    const totales = {
      debe_bs: totalDebeBS,
      haber_bs: totalHaberBS,
      debe_usd: totalDebeUSD,
      haber_usd: totalHaberUSD,
      monto_base: montoBase,
      monto_iva: montoIVA,
      monto_total: montoTotal,
    }

    return NextResponse.json({
      success: true,
      data: {
        detalles: detallesInsertados,
        totales: totales,
        plantilla: {
          codigo: plantilla.codigo,
          nombre: plantilla.nombre,
        },
      },
    })
  } catch (error: any) {
    console.error("Error aplicando plantilla:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error.message },
      { status: 500 }
    )
  }
}

