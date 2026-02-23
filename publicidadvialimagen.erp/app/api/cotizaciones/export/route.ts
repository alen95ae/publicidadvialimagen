export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server"
import { getCotizaciones, getCotizacionById } from "@/lib/supabaseCotizaciones"
import { getLineasByCotizacionId } from "@/lib/supabaseCotizacionLineas"
import { getUserByIdSupabase } from "@/lib/supabaseUsers"
import { findContactoById } from "@/lib/supabaseContactos"
import * as XLSX from "xlsx"

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Solo tabla cotizaciones (exportación general, ligera)
const HEADERS_SOLO_COTIZACIONES = [
  "Código",
  "Fecha Creación",
  "Fecha Actualización",
  "Cliente",
  "Vendedor",
  "Sucursal",
  "Estado",
  "Subtotal",
  "Total IVA",
  "Total IT",
  "Total Final",
  "Vigencia (días)",
  "Cantidad Items"
] as const

// Combinado cotización + líneas (solo para exportar selección)
const HEADERS_COMBINADO = [
  "Código",
  "Fecha Creación",
  "Fecha Actualización",
  "Cliente",
  "Vendedor",
  "Sucursal",
  "Estado",
  "Subtotal",
  "Total IVA",
  "Total IT",
  "Total Final",
  "Vigencia (días)",
  "Cantidad Items",
  "Tipo Línea",
  "Código Producto",
  "Nombre Producto",
  "Descripción",
  "Cantidad",
  "Ancho",
  "Alto",
  "Total m²",
  "Unidad Medida",
  "Precio Unit.",
  "Comisión",
  "Con IVA",
  "Con IT",
  "Es Soporte",
  "Orden",
  "Subtotal Línea"
] as const

function rowSoloCotizacion(cot: any, clienteNombre: string, vendedorNombre: string): (string | number)[] {
  return [
    cot.codigo ?? '',
    cot.fecha_creacion ? new Date(cot.fecha_creacion).toLocaleDateString('es-ES') : '',
    cot.fecha_actualizacion ? new Date(cot.fecha_actualizacion).toLocaleDateString('es-ES') : '',
    clienteNombre,
    vendedorNombre,
    cot.sucursal ?? '',
    cot.estado ?? '',
    cot.subtotal ?? '',
    cot.total_iva ?? '',
    cot.total_it ?? '',
    cot.total_final ?? '',
    cot.vigencia ?? '',
    cot.cantidad_items ?? ''
  ]
}

function rowCombinado(
  cot: any,
  linea: any,
  clienteNombre: string,
  vendedorNombre: string
): (string | number | boolean)[] {
  const cotFechaCreacion = cot.fecha_creacion ? new Date(cot.fecha_creacion).toLocaleDateString('es-ES') : ''
  const cotFechaActualizacion = cot.fecha_actualizacion ? new Date(cot.fecha_actualizacion).toLocaleDateString('es-ES') : ''
  return [
    cot.codigo ?? '',
    cotFechaCreacion,
    cotFechaActualizacion,
    clienteNombre,
    vendedorNombre,
    cot.sucursal ?? '',
    cot.estado ?? '',
    cot.subtotal ?? '',
    cot.total_iva ?? '',
    cot.total_it ?? '',
    cot.total_final ?? '',
    cot.vigencia ?? '',
    cot.cantidad_items ?? '',
    linea ? (linea.tipo ?? '') : '',
    linea?.codigo_producto ?? '',
    linea?.nombre_producto ?? '',
    linea?.descripcion ?? '',
    linea?.cantidad ?? '',
    linea?.ancho ?? '',
    linea?.alto ?? '',
    linea?.total_m2 ?? '',
    linea?.unidad_medida ?? '',
    linea?.precio_unitario ?? '',
    linea?.comision ?? '',
    linea?.con_iva ?? '',
    linea?.con_it ?? '',
    linea?.es_soporte ?? '',
    linea?.orden ?? '',
    linea?.subtotal_linea ?? ''
  ]
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const idsParam = searchParams.get('ids')

    let cotizaciones: any[] = []

    if (idsParam) {
      const ids = idsParam.split(',').map(id => id.trim()).filter(Boolean)
      if (ids.length === 0) {
        return NextResponse.json({ error: "No se especificaron IDs" }, { status: 400 })
      }
      const results = await Promise.all(ids.map(id => getCotizacionById(id)))
      cotizaciones = results.filter(c => c != null)
      console.log(`📤 Exportando ${cotizaciones.length} cotizaciones seleccionadas (combinado con líneas)`)
    } else {
      let page = 1
      const limit = 1000
      let hasMore = true
      while (hasMore) {
        const result = await getCotizaciones({ page, limit })
        if (result.data && result.data.length > 0) {
          cotizaciones = [...cotizaciones, ...result.data]
          hasMore = result.data.length === limit
          page++
        } else {
          hasMore = false
        }
      }
      console.log(`📊 Total cotizaciones a exportar (solo tabla): ${cotizaciones.length}`)
    }

    const vendedorIds = new Set<string>()
    const clienteIds = new Set<string>()
    cotizaciones.forEach(c => {
      if (c.vendedor && uuidRegex.test(c.vendedor)) vendedorIds.add(c.vendedor)
      if (c.cliente && uuidRegex.test(c.cliente)) clienteIds.add(c.cliente)
    })

    const vendedoresMap: Record<string, string> = {}
    if (vendedorIds.size > 0) {
      await Promise.all(Array.from(vendedorIds).map(async (id) => {
        try {
          const user = await getUserByIdSupabase(id)
          if (user) vendedoresMap[id] = user.nombre || user.email || ''
        } catch {
          vendedoresMap[id] = id
        }
      }))
    }

    const clientesMap: Record<string, string> = {}
    if (clienteIds.size > 0) {
      await Promise.all(Array.from(clienteIds).map(async (id) => {
        try {
          const contacto = await findContactoById(id)
          if (contacto) clientesMap[id] = contacto.displayName || ''
        } catch {
          clientesMap[id] = id
        }
      }))
    }

    const fecha = new Date().toISOString().split('T')[0]
    let buffer: Buffer
    let nombreArchivo: string

    if (!idsParam) {
      // Exportación general: solo tabla cotizaciones (una fila por cotización)
      const rows: (string | number)[][] = [
        [...HEADERS_SOLO_COTIZACIONES],
        ...cotizaciones.map(cot => {
          const clienteNombre = cot.cliente
            ? (uuidRegex.test(cot.cliente) ? (clientesMap[cot.cliente] || cot.cliente) : cot.cliente)
            : ''
          const vendedorNombre = cot.vendedor
            ? (uuidRegex.test(cot.vendedor) ? (vendedoresMap[cot.vendedor] || cot.vendedor) : cot.vendedor)
            : ''
          return rowSoloCotizacion(cot, clienteNombre, vendedorNombre)
        })
      ]
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.aoa_to_sheet(rows)
      XLSX.utils.book_append_sheet(wb, ws, 'Cotizaciones')
      buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
      nombreArchivo = `cotizaciones_${fecha}.xlsx`
    } else {
      // Exportar selección: combinado cotización + líneas
      const rows: (string | number | boolean)[][] = [HEADERS_COMBINADO as unknown as (string | number | boolean)[]]
      for (const cot of cotizaciones) {
        const clienteNombre = cot.cliente
          ? (uuidRegex.test(cot.cliente) ? (clientesMap[cot.cliente] || cot.cliente) : cot.cliente)
          : ''
        const vendedorNombre = cot.vendedor
          ? (uuidRegex.test(cot.vendedor) ? (vendedoresMap[cot.vendedor] || cot.vendedor) : cot.vendedor)
          : ''
        let lineas: any[] = []
        try {
          lineas = await getLineasByCotizacionId(cot.id)
        } catch (e) {
          console.warn(`⚠️ No se pudieron cargar líneas para cotización ${cot.codigo}:`, e)
        }
        if (lineas.length === 0) {
          rows.push(rowCombinado(cot, null, clienteNombre, vendedorNombre))
        } else {
          for (const linea of lineas) {
            rows.push(rowCombinado(cot, linea, clienteNombre, vendedorNombre))
          }
        }
      }
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.aoa_to_sheet(rows)
      XLSX.utils.book_append_sheet(wb, ws, 'Cotizaciones y líneas')
      buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
      nombreArchivo = `cotizaciones_seleccionadas_${fecha}.xlsx`
    }

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
      },
    })
  } catch (e: any) {
    console.error("❌ Error exportando cotizaciones:", e)
    return NextResponse.json({ error: "No se pudieron exportar las cotizaciones" }, { status: 500 })
  }
}
