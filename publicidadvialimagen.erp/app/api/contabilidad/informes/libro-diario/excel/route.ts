export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"
import * as XLSX from "xlsx"

// Función para formatear números
function formatearNumero(numero: number): string {
  const numeroFormateado = numero.toFixed(2)
  const [parteEntera, parteDecimal] = numeroFormateado.split('.')
  const parteEnteraConSeparador = parteEntera.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${parteEnteraConSeparador},${parteDecimal}`
}

// GET - Generar Excel del Libro Diario
export async function GET(request: NextRequest) {
  try {
    console.log("📊 Iniciando generación de Excel del Libro Diario")
    
    // Verificar permisos
    const permiso = await requirePermiso("contabilidad", "ver")
    if (permiso instanceof Response) {
      console.error("❌ Sin permisos para exportar Excel")
      return permiso
    }

    const supabase = getSupabaseAdmin()

    const { searchParams } = new URL(request.url)
    const gestion = searchParams.get("gestion")
    const periodo = searchParams.get("periodo")
    const tipo_asiento = searchParams.get("tipo_asiento")
    const fecha_inicial = searchParams.get("fecha_inicial")
    const fecha_final = searchParams.get("fecha_final")
    const tipo_comprobante = searchParams.get("tipo_comprobante")
    const estado = searchParams.get("estado")

    // Construir query base para comprobantes (mismo que el endpoint GET)
    let query = supabase
      .from("comprobantes")
      .select(
        `
        id,
        numero,
        fecha,
        tipo_comprobante,
        tipo_asiento,
        concepto,
        moneda,
        tipo_cambio,
        estado,
        empresa_id,
        gestion,
        periodo
      `
      )
      .eq("empresa_id", 1)
      .order("fecha", { ascending: true })
      .order("numero", { ascending: true })

    // Aplicar filtros opcionales
    if (gestion) {
      query = query.eq("gestion", parseInt(gestion))
    }

    if (periodo) {
      query = query.eq("periodo", parseInt(periodo))
    }

    if (tipo_asiento) {
      query = query.eq("tipo_asiento", tipo_asiento)
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

    // Filtro de estado: por defecto solo APROBADOS
    const estadoFiltro = estado && estado !== "Todos"
      ? estado.toUpperCase()
      : "APROBADO"
    query = query.eq("estado", estadoFiltro)

    const { data: comprobantes, error: comprobantesError } = await query

    if (comprobantesError) {
      console.error("Error fetching comprobantes:", comprobantesError)
      return NextResponse.json(
        {
          error: "Error al obtener los comprobantes",
          details: comprobantesError.message,
        },
        { status: 500 }
      )
    }

    if (!comprobantes || comprobantes.length === 0) {
      console.warn("⚠️ No hay comprobantes para exportar con los filtros aplicados")
      return NextResponse.json(
        { error: "No hay comprobantes para exportar con los filtros seleccionados" },
        { status: 400 }
      )
    }

    console.log(`✅ Encontrados ${comprobantes.length} comprobantes para exportar`)

    // Obtener IDs de comprobantes
    const comprobanteIds = comprobantes.map((c: any) => c.id)

    // Obtener detalles de comprobantes
    const { data: detalles, error: detallesError } = await supabase
      .from("comprobante_detalle")
      .select("comprobante_id, cuenta, auxiliar, glosa, debe_bs, haber_bs, debe_usd, haber_usd, orden")
      .in("comprobante_id", comprobanteIds)
      .order("comprobante_id", { ascending: true })
      .order("orden", { ascending: true })

    if (detallesError) {
      console.error("Error fetching detalles:", detallesError)
      return NextResponse.json(
        {
          error: "Error al obtener los detalles",
          details: detallesError.message,
        },
        { status: 500 }
      )
    }

    // Obtener descripciones de cuentas
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

    // Construir datos para Excel
    const datos: any[] = []
    
    // Encabezados
    const headers = [
      'Número',
      'Fecha',
      'Tipo Comprobante',
      'Concepto',
      'Cuenta',
      'Descripción',
      'Debe Bs',
      'Haber Bs',
      'Debe USD',
      'Haber USD'
    ]
    datos.push(headers)

    // Iterar sobre comprobantes
    for (let i = 0; i < comprobantes.length; i++) {
      const comprobante = comprobantes[i]
      const detallesComp = detallesPorComprobante[comprobante.id] || []
      
      if (detallesComp.length === 0) continue

      const fechaComp = new Date(comprobante.fecha).toLocaleDateString('es-ES')
      const numeroComp = comprobante.numero || 'N/A'
      const tipoComp = comprobante.tipo_comprobante || 'N/A'
      const conceptoComp = comprobante.concepto || ''

      // Totales del comprobante
      let totalComprobanteDebeBs = 0
      let totalComprobanteHaberBs = 0
      let totalComprobanteDebeUsd = 0
      let totalComprobanteHaberUsd = 0

      // Agregar filas de detalles
      for (const detalle of detallesComp) {
        const descripcionCuenta = cuentasMap[detalle.cuenta] || ""
        const glosaDetalle = detalle.glosa && String(detalle.glosa).trim() !== "" ? String(detalle.glosa).trim() : null
        const descripcion = descripcionCuenta || glosaDetalle || "-"

        // Acumular totales del comprobante
        totalComprobanteDebeBs += detalle.debe_bs || 0
        totalComprobanteHaberBs += detalle.haber_bs || 0
        totalComprobanteDebeUsd += detalle.debe_usd || 0
        totalComprobanteHaberUsd += detalle.haber_usd || 0

        const row = [
          numeroComp,
          fechaComp,
          tipoComp,
          conceptoComp,
          detalle.cuenta || "",
          descripcion,
          formatearNumero(detalle.debe_bs || 0),
          formatearNumero(detalle.haber_bs || 0),
          formatearNumero(detalle.debe_usd || 0),
          formatearNumero(detalle.haber_usd || 0)
        ]
        datos.push(row)
      }

      // Agregar fila de totales del comprobante
      datos.push([
        '',
        '',
        '',
        '',
        '',
        'TOTALES:',
        formatearNumero(totalComprobanteDebeBs),
        formatearNumero(totalComprobanteHaberBs),
        formatearNumero(totalComprobanteDebeUsd),
        formatearNumero(totalComprobanteHaberUsd)
      ])

      // Agregar fila en blanco entre comprobantes (excepto después del último)
      if (i < comprobantes.length - 1) {
        datos.push([])
      }
    }

    // Calcular totales generales
    let totalDebeBs = 0
    let totalHaberBs = 0
    let totalDebeUsd = 0
    let totalHaberUsd = 0

    for (const detalle of detalles || []) {
      totalDebeBs += detalle.debe_bs || 0
      totalHaberBs += detalle.haber_bs || 0
      totalDebeUsd += detalle.debe_usd || 0
      totalHaberUsd += detalle.haber_usd || 0
    }

    // Agregar fila vacía y fila de totales
    datos.push([])
    datos.push([
      'TOTALES GENERALES',
      '',
      '',
      '',
      '',
      '',
      formatearNumero(totalDebeBs),
      formatearNumero(totalHaberBs),
      formatearNumero(totalDebeUsd),
      formatearNumero(totalHaberUsd)
    ])

    // Crear workbook y worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(datos)
    
    // Ajustar ancho de columnas
    const colWidths = [
      { wch: 12 }, // Número
      { wch: 12 }, // Fecha
      { wch: 18 }, // Tipo Comprobante
      { wch: 30 }, // Concepto
      { wch: 15 }, // Cuenta
      { wch: 40 }, // Descripción
      { wch: 15 }, // Debe Bs
      { wch: 15 }, // Haber Bs
      { wch: 15 }, // Debe USD
      { wch: 15 }  // Haber USD
    ]
    ws['!cols'] = colWidths

    // Agregar worksheet al workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Libro Diario')

    // Generar buffer del archivo Excel
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    console.log(`✅ Excel generado correctamente, ${comprobantes.length} comprobantes`)

    // Generar nombre del archivo con formato DD-MM-YYYY
    const hoy = new Date()
    const dia = String(hoy.getDate()).padStart(2, '0')
    const mes = String(hoy.getMonth() + 1).padStart(2, '0')
    const año = hoy.getFullYear()
    const nombreArchivo = `libro_diario_${dia}-${mes}-${año}.xlsx`

    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
      },
    })
  } catch (error: any) {
    console.error("❌ Error generating Excel:", error)
    console.error("❌ Stack:", error?.stack)
    return NextResponse.json(
      { 
        error: "Error al generar el Excel",
        details: error?.message || "Error desconocido"
      },
      { status: 500 }
    )
  }
}

