export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"

// GET - Informe Libro Mayor
export async function GET(request: NextRequest) {
  try {
    // Verificar permisos
    const permiso = await requirePermiso("contabilidad", "ver")
    if (permiso instanceof Response) {
      return permiso
    }

    const supabase = getSupabaseAdmin()

    const { searchParams } = new URL(request.url)
    const empresa_id = searchParams.get("empresa_id") || "1"
    const desde_cuenta = searchParams.get("desde_cuenta")
    const hasta_cuenta = searchParams.get("hasta_cuenta")
    const fecha_inicial = searchParams.get("fecha_inicial")
    const fecha_final = searchParams.get("fecha_final")
    const estadoParam = searchParams.get("estado")
    const moneda = searchParams.get("moneda") || "BOB"

    // Paso 1: Obtener comprobantes filtrados
    let comprobantesQuery = supabase
      .from("comprobantes")
      .select("id, numero, fecha, tipo_asiento, concepto, estado")
      .eq("empresa_id", parseInt(empresa_id))

    // Filtrar por estado (por defecto APROBADO)
    if (estadoParam && estadoParam !== "Todos") {
      const estadoUpper = estadoParam.toUpperCase()
      if (estadoUpper === "APROBADO") {
        comprobantesQuery = comprobantesQuery.eq("estado", "APROBADO")
      } else if (estadoUpper === "BORRADOR") {
        comprobantesQuery = comprobantesQuery.eq("estado", "BORRADOR")
      }
    } else {
      // Por defecto solo APROBADO
      comprobantesQuery = comprobantesQuery.eq("estado", "APROBADO")
    }

    // Filtrar por rango de fechas
    if (fecha_inicial) {
      comprobantesQuery = comprobantesQuery.gte("fecha", fecha_inicial)
    }

    if (fecha_final) {
      comprobantesQuery = comprobantesQuery.lte("fecha", fecha_final)
    }

    const { data: comprobantes, error: comprobantesError } = await comprobantesQuery

    if (comprobantesError) {
      console.error("Error fetching comprobantes:", comprobantesError)
      if (
        comprobantesError.code === "PGRST116" ||
        comprobantesError.code === "42P01" ||
        comprobantesError.message?.includes("does not exist") ||
        comprobantesError.message?.includes("relation")
      ) {
        return NextResponse.json({
          success: true,
          data: [],
          message: "Tabla comprobantes no encontrada",
        })
      }
      return NextResponse.json(
        {
          error: "Error al obtener los comprobantes",
          details: comprobantesError.message,
        },
        { status: 500 }
      )
    }

    // Si no hay comprobantes, devolver array vacío
    if (!comprobantes || comprobantes.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
      })
    }

    // Paso 2: Obtener detalles de comprobantes
    const comprobanteIds = comprobantes.map((c: any) => c.id)

    let detallesQuery = supabase
      .from("comprobante_detalle")
      .select("comprobante_id, cuenta, auxiliar, glosa, debe_bs, haber_bs, debe_usd, haber_usd, orden")
      .in("comprobante_id", comprobanteIds)

    // Filtrar por rango de cuentas
    if (desde_cuenta) {
      detallesQuery = detallesQuery.gte("cuenta", desde_cuenta)
    }

    if (hasta_cuenta) {
      detallesQuery = detallesQuery.lte("cuenta", hasta_cuenta)
    }

    const { data: detalles, error: detallesError } = await detallesQuery

    if (detallesError) {
      console.error("Error fetching detalles:", detallesError)
      if (
        detallesError.code === "PGRST116" ||
        detallesError.code === "42P01" ||
        detallesError.message?.includes("does not exist") ||
        detallesError.message?.includes("relation")
      ) {
        return NextResponse.json({
          success: true,
          data: [],
          message: "Tabla comprobante_detalle no encontrada",
        })
      }
      return NextResponse.json(
        {
          error: "Error al obtener los detalles",
          details: detallesError.message,
        },
        { status: 500 }
      )
    }

    // Si no hay detalles, devolver array vacío
    if (!detalles || detalles.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
      })
    }

    // Paso 3: Obtener descripciones de cuentas
    const cuentaCodes = [...new Set((detalles || []).map((d: any) => d.cuenta))]
    let cuentasMap: Record<string, string> = {}

    if (cuentaCodes.length > 0) {
      const { data: cuentas } = await supabase
        .from("plan_cuentas")
        .select("cuenta, descripcion")
        .in("cuenta", cuentaCodes)

      if (cuentas) {
        cuentasMap = cuentas.reduce((acc: Record<string, string>, c: any) => {
          acc[c.cuenta] = c.descripcion
          return acc
        }, {})
      }
    }

    // Paso 4: Crear mapa de comprobantes para acceso rápido
    const comprobantesMap = comprobantes.reduce((acc: Record<number, any>, comp: any) => {
      acc[comp.id] = comp
      return acc
    }, {})

    // Paso 5: Construir movimientos combinando datos
    const movimientos = detalles
      .map((det: any) => {
        const comprobante = comprobantesMap[det.comprobante_id]

        if (!comprobante) {
          return null
        }

        // Seleccionar montos según moneda
        const debe = moneda === "USD" ? (det.debe_usd || 0) : (det.debe_bs || 0)
        const haber = moneda === "USD" ? (det.haber_usd || 0) : (det.haber_bs || 0)

        return {
          cuenta: det.cuenta,
          descripcion_cuenta: cuentasMap[det.cuenta] || "",
          fecha: comprobante.fecha || "",
          numero_comprobante: comprobante.numero || "",
          tipo_asiento: comprobante.tipo_asiento || "",
          glosa_comprobante: comprobante.concepto || "",
          glosa_detalle: det.glosa || "",
          debe: debe,
          haber: haber,
          orden: det.orden || 0,
        }
      })
      .filter((m: any) => m !== null) // Eliminar nulls
      .sort((a: any, b: any) => {
        // Ordenar: cuenta, fecha, numero, orden
        if (a.cuenta !== b.cuenta) {
          return a.cuenta.localeCompare(b.cuenta)
        }
        if (a.fecha !== b.fecha) {
          return a.fecha.localeCompare(b.fecha)
        }
        if (a.numero_comprobante !== b.numero_comprobante) {
          return a.numero_comprobante.localeCompare(b.numero_comprobante)
        }
        return (a.orden || 0) - (b.orden || 0)
      })

    return NextResponse.json({
      success: true,
      data: movimientos,
      total: movimientos.length,
    })
  } catch (error: any) {
    console.error("Error in GET /api/contabilidad/informes/libro-mayor:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error?.message },
      { status: 500 }
    )
  }
}

