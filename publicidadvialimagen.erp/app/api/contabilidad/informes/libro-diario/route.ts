import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"

// GET - Informe Libro Diario
export async function GET(request: NextRequest) {
  try {
    // Verificar permisos
    const permiso = await requirePermiso("contabilidad", "ver")
    if (permiso instanceof Response) {
      return permiso
    }

    const supabase = getSupabaseAdmin()

    const { searchParams } = new URL(request.url)
    const empresa = searchParams.get("empresa")
    const regional = searchParams.get("regional")
    const sucursal = searchParams.get("sucursal")
    const clasificador = searchParams.get("clasificador")
    const fecha_inicial = searchParams.get("fecha_inicial")
    const fecha_final = searchParams.get("fecha_final")
    const tipo_comprobante = searchParams.get("tipo_comprobante")
    const estado = searchParams.get("estado")

    // Construir query base para comprobantes
    let query = supabase
      .from("comprobantes")
      .select(
        `
        id,
        numero,
        fecha,
        tipo_comprobante,
        tipo_asiento,
        glosa,
        moneda,
        tipo_cambio,
        estado,
        empresa_id,
        clasificador
      `
      )
      .eq("empresa_id", 1) // Por ahora usar empresa_id=1
      .order("fecha", { ascending: true })
      .order("numero", { ascending: true })

    // Aplicar filtros opcionales
    if (clasificador) {
      query = query.eq("clasificador", clasificador)
    }

    if (fecha_inicial) {
      query = query.gte("fecha", fecha_inicial)
    }

    if (fecha_final) {
      query = query.lte("fecha", fecha_final)
    }

    if (tipo_comprobante) {
      query = query.eq("tipo_comprobante", tipo_comprobante)
    }

    if (estado) {
      query = query.eq("estado", estado.toUpperCase())
    }

    const { data: comprobantes, error: comprobantesError } = await query

    if (comprobantesError) {
      console.error("Error fetching comprobantes:", comprobantesError)
      // Si la tabla no existe, devolver array vacío
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

    // Obtener IDs de comprobantes
    const comprobanteIds = comprobantes.map((c: any) => c.id)

    // Obtener detalles de comprobantes
    const { data: detalles, error: detallesError } = await supabase
      .from("comprobante_detalle")
      .select("comprobante_id, cuenta, auxiliar, glosa, debe_bs, haber_bs, debe_usd, haber_usd")
      .in("comprobante_id", comprobanteIds)
      .order("comprobante_id", { ascending: true })

    if (detallesError) {
      console.error("Error fetching detalles:", detallesError)
      // Si la tabla no existe, continuar sin detalles
      if (
        detallesError.code === "PGRST116" ||
        detallesError.code === "42P01" ||
        detallesError.message?.includes("does not exist") ||
        detallesError.message?.includes("relation")
      ) {
        // Continuar sin detalles
      } else {
        return NextResponse.json(
          {
            error: "Error al obtener los detalles",
            details: detallesError.message,
          },
          { status: 500 }
        )
      }
    }

    // Obtener descripciones de cuentas para los detalles
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

    // Agrupar detalles por comprobante
    const detallesPorComprobante = (detalles || []).reduce(
      (acc: Record<number, any[]>, detalle: any) => {
        if (!acc[detalle.comprobante_id]) {
          acc[detalle.comprobante_id] = []
        }
        acc[detalle.comprobante_id].push(detalle)
        return acc
      },
      {}
    )

    // Construir respuesta con comprobantes y sus detalles
    const comprobantesInforme = comprobantes.map((comp: any) => {
      const detallesComp = detallesPorComprobante[comp.id] || []
      
      // Calcular totales del comprobante
      const totales = detallesComp.reduce(
        (acc: any, det: any) => ({
          debe_bs: acc.debe_bs + (det.debe_bs || 0),
          haber_bs: acc.haber_bs + (det.haber_bs || 0),
          debe_usd: acc.debe_usd + (det.debe_usd || 0),
          haber_usd: acc.haber_usd + (det.haber_usd || 0),
        }),
        { debe_bs: 0, haber_bs: 0, debe_usd: 0, haber_usd: 0 }
      )

      return {
        id: comp.id,
        numero: comp.numero,
        fecha: comp.fecha,
        tipo_comprobante: comp.tipo_comprobante,
        tipo_asiento: comp.tipo_asiento,
        glosa: comp.glosa || "",
        moneda: comp.moneda || "BOB",
        tipo_cambio: comp.tipo_cambio || 1,
        estado: comp.estado,
        detalles: detallesComp.map((det: any) => ({
          cuenta: det.cuenta,
          descripcion: cuentasMap[det.cuenta] || "",
          debe_bs: det.debe_bs || 0,
          haber_bs: det.haber_bs || 0,
          debe_usd: det.debe_usd || 0,
          haber_usd: det.haber_usd || 0,
          glosa: det.glosa || "",
        })),
        total_debe_bs: totales.debe_bs,
        total_haber_bs: totales.haber_bs,
        total_debe_usd: totales.debe_usd,
        total_haber_usd: totales.haber_usd,
      }
    })

    return NextResponse.json({
      success: true,
      data: comprobantesInforme,
      total: comprobantesInforme.length,
    })
  } catch (error: any) {
    console.error("Error in GET /api/contabilidad/informes/libro-diario:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error?.message },
      { status: 500 }
    )
  }
}


