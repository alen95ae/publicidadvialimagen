export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server"
import { getCotizaciones } from "@/lib/supabaseCotizaciones"
import { getUserByIdSupabase } from "@/lib/supabaseUsers"
import { findContactoById } from "@/lib/supabaseContactos"

// Función para escapar CSV correctamente (maneja tildes, ñ y caracteres especiales)
function escapeCSV(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  // Escapar comillas dobles duplicándolas
  const escaped = str.replace(/"/g, '""')
  // Envolver en comillas para manejar comas, saltos de línea, etc.
  return `"${escaped}"`
}

export async function GET(request: Request) {
  try {
    // Obtener todas las cotizaciones en lotes
    let allCotizaciones: any[] = []
    let page = 1
    const limit = 1000
    let hasMore = true

    while (hasMore) {
      const result = await getCotizaciones({ 
        page,
        limit
      })
      
      if (result.data && result.data.length > 0) {
        allCotizaciones = [...allCotizaciones, ...result.data]
        hasMore = result.data.length === limit
        page++
      } else {
        hasMore = false
      }
    }

    const cotizaciones = allCotizaciones

    // Los datos de cliente y vendedor pueden venir como nombres (texto) o como IDs (UUID)
    // Intentamos mapear solo si parecen ser UUIDs (tienen formato UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    
    const vendedorIds = new Set<string>()
    const clienteIds = new Set<string>()
    
    cotizaciones.forEach(c => {
      if (c.vendedor && uuidRegex.test(c.vendedor)) {
        vendedorIds.add(c.vendedor)
      }
      if (c.cliente && uuidRegex.test(c.cliente)) {
        clienteIds.add(c.cliente)
      }
    })

    // Mapear vendedores (solo si son IDs)
    const vendedoresMap: Record<string, string> = {}
    if (vendedorIds.size > 0) {
      const promises = Array.from(vendedorIds).map(async (id) => {
        try {
          const user = await getUserByIdSupabase(id)
          if (user) {
            vendedoresMap[id] = user.nombre || user.email || ''
          }
        } catch (error) {
          // Si falla, usar el ID como fallback
          vendedoresMap[id] = id
        }
      })
      await Promise.all(promises)
    }

    // Mapear clientes (solo si son IDs)
    const clientesMap: Record<string, string> = {}
    if (clienteIds.size > 0) {
      const promises = Array.from(clienteIds).map(async (id) => {
        try {
          const contacto = await findContactoById(id)
          if (contacto) {
            clientesMap[id] = contacto.displayName || ''
          }
        } catch (error) {
          // Si no se encuentra, usar el ID como fallback
          clientesMap[id] = id
        }
      })
      await Promise.all(promises)
    }

    // Construir CSV con todos los campos del listado
    const headers = [
      "ID",
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
      "Líneas Cotización"
    ]

    const csvRows: string[] = []
    
    // Agregar headers
    csvRows.push(headers.map(h => escapeCSV(h)).join(','))

    // Agregar filas de datos
    for (const cotizacion of cotizaciones) {
      // Si es un UUID, intentar mapear, si no, usar el valor directamente (ya es un nombre)
      const clienteNombre = cotizacion.cliente 
        ? (uuidRegex.test(cotizacion.cliente) 
            ? (clientesMap[cotizacion.cliente] || cotizacion.cliente)
            : cotizacion.cliente)
        : ''
      const vendedorNombre = cotizacion.vendedor 
        ? (uuidRegex.test(cotizacion.vendedor)
            ? (vendedoresMap[cotizacion.vendedor] || cotizacion.vendedor)
            : cotizacion.vendedor)
        : ''

      const row = [
        escapeCSV(cotizacion.id),
        escapeCSV(cotizacion.codigo || ''),
        escapeCSV(cotizacion.fecha_creacion ? new Date(cotizacion.fecha_creacion).toLocaleDateString('es-ES') : ''),
        escapeCSV(cotizacion.fecha_actualizacion ? new Date(cotizacion.fecha_actualizacion).toLocaleDateString('es-ES') : ''),
        escapeCSV(clienteNombre),
        escapeCSV(vendedorNombre),
        escapeCSV(cotizacion.sucursal || ''),
        escapeCSV(cotizacion.estado || ''),
        escapeCSV(cotizacion.subtotal || 0),
        escapeCSV(cotizacion.total_iva || 0),
        escapeCSV(cotizacion.total_it || 0),
        escapeCSV(cotizacion.total_final || 0),
        escapeCSV(cotizacion.vigencia || 0),
        escapeCSV(cotizacion.cantidad_items || 0),
        escapeCSV(cotizacion.lineas_cotizacion || 0)
      ]
      csvRows.push(row.join(','))
    }

    const csv = csvRows.join('\n')
    // BOM UTF-8 para Excel y otros programas
    const csvWithBOM = '\uFEFF' + csv

    console.log(`✅ Exportadas ${cotizaciones.length} cotizaciones a CSV`)

    // Convertir a Buffer con encoding UTF-8 explícito
    const csvBuffer = Buffer.from(csvWithBOM, 'utf-8')

    return new NextResponse(csvBuffer, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="cotizaciones_${new Date().toISOString().split('T')[0]}.csv"`,
        'Content-Encoding': 'utf-8',
      },
    })
  } catch (e: any) {
    console.error("❌ Error exportando cotizaciones:", e)
    return NextResponse.json({ error: "No se pudieron exportar las cotizaciones" }, { status: 500 })
  }
}

