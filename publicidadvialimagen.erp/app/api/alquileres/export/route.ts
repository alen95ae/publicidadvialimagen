export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server"
import { getAlquileres } from "@/lib/supabaseAlquileres"

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
    // Obtener todos los alquileres en lotes
    let allAlquileres: any[] = []
    let page = 1
    const limit = 1000
    let hasMore = true

    while (hasMore) {
      const result = await getAlquileres({ 
        page,
        limit
      })
      
      if (result.data && result.data.length > 0) {
        allAlquileres = [...allAlquileres, ...result.data]
        hasMore = result.data.length === limit
        page++
      } else {
        hasMore = false
      }
    }

    console.log(`📊 Total de alquileres a exportar: ${allAlquileres.length}`)

    // Headers del CSV
    const headers = [
      'ID',
      'Código',
      'Cotización ID',
      'Fecha Inicio',
      'Fecha Fin',
      'Meses',
      'Soporte Código',
      'Cliente',
      'Vendedor',
      'Total',
      'Estado',
      'Fecha Creación'
    ]

    const csvRows: string[] = []
    
    // Agregar headers
    csvRows.push(headers.map(h => escapeCSV(h)).join(','))

    // Agregar filas de datos
    for (const alquiler of allAlquileres) {
      const row = [
        escapeCSV(alquiler.id),
        escapeCSV(alquiler.codigo || ''),
        escapeCSV(alquiler.cotizacion_id || ''),
        escapeCSV(alquiler.inicio ? new Date(alquiler.inicio).toLocaleDateString('es-ES') : ''),
        escapeCSV(alquiler.fin ? new Date(alquiler.fin).toLocaleDateString('es-ES') : ''),
        escapeCSV(alquiler.meses || 0),
        escapeCSV(alquiler.soporte_codigo || ''),
        escapeCSV(alquiler.cliente || ''),
        escapeCSV(alquiler.vendedor || ''),
        escapeCSV(alquiler.total || 0),
        escapeCSV(alquiler.estado || ''),
        escapeCSV(alquiler.fecha_creacion ? new Date(alquiler.fecha_creacion).toLocaleDateString('es-ES') : '')
      ]
      csvRows.push(row.join(','))
    }

    const csv = csvRows.join('\n')
    // BOM UTF-8 para Excel y otros programas
    const csvWithBOM = '\uFEFF' + csv


    // Convertir a Buffer con encoding UTF-8 explícito
    const csvBuffer = Buffer.from(csvWithBOM, 'utf-8')

    return new NextResponse(csvBuffer, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="alquileres_${new Date().toISOString().split('T')[0]}.csv"`,
        'Content-Encoding': 'utf-8',
      },
    })
  } catch (e: any) {
    console.error("❌ Error exportando alquileres:", e)
    return NextResponse.json({ error: "No se pudieron exportar los alquileres" }, { status: 500 })
  }
}

