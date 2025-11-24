import { NextRequest, NextResponse } from 'next/server'
import { getAllRecursos } from '@/lib/supabaseRecursos'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const categoria = searchParams.get('categoria') || ''

    console.log('📤 Export recursos params:', { query, categoria })

    // Obtener todos los recursos de Supabase
    let recursos = await getAllRecursos()

    // Aplicar filtros
    if (query) {
      recursos = recursos.filter(recurso => 
        recurso.codigo.toLowerCase().includes(query.toLowerCase()) ||
        recurso.nombre.toLowerCase().includes(query.toLowerCase()) ||
        recurso.categoria.toLowerCase().includes(query.toLowerCase())
      )
    }

    if (categoria) {
      recursos = recursos.filter(recurso => recurso.categoria === categoria)
    }

    // Función para escapar CSV correctamente
    const escapeCSV = (value: string | number | boolean | null | undefined): string => {
      if (value === null || value === undefined) return '""'
      const str = String(value)
      // Reemplazar comillas dobles por dos comillas dobles (estándar CSV)
      const escaped = str.replace(/"/g, '""')
      // Envolver en comillas para manejar comas, saltos de línea, etc.
      return `"${escaped}"`
    }

    // Extraer cantidad del control_stock si existe
    const getCantidad = (recurso: any): number => {
      if (recurso.control_stock && typeof recurso.control_stock === 'object') {
        // Intentar obtener cantidad del control_stock
        if (recurso.control_stock.cantidad !== undefined) {
          return Number(recurso.control_stock.cantidad) || 0
        }
        if (recurso.control_stock.stock !== undefined) {
          return Number(recurso.control_stock.stock) || 0
        }
      }
      return 0
    }

    // Crear CSV con todas las columnas de la lista de recursos
    const headers = [
      'Código',
      'Nombre',
      'Responsable',
      'Categoría',
      'Unidad',
      'Coste',
      'Stock'
    ]

    const csvRows = [headers.join(',')]

    recursos.forEach(recurso => {
      const cantidad = getCantidad(recurso)
      
      const row = [
        escapeCSV(recurso.codigo),
        escapeCSV(recurso.nombre),
        escapeCSV(recurso.responsable),
        escapeCSV(recurso.categoria),
        escapeCSV(recurso.unidad_medida),
        recurso.coste.toFixed(2),
        cantidad
      ]
      csvRows.push(row.join(','))
    })

    const csv = csvRows.join('\n')
    // Agregar BOM (Byte Order Mark) para que Excel reconozca UTF-8 correctamente
    // Esto es crucial para que las tildes y ñ se muestren correctamente
    const csvWithBOM = '\uFEFF' + csv

    console.log('📊 CSV recursos generado:', { rows: recursos.length })

    const fecha = new Date().toISOString().split('T')[0] // Formato YYYY-MM-DD
    
    return new NextResponse(csvWithBOM, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="recursos_${fecha}.csv"`
      }
    })

  } catch (error) {
    console.error('❌ Error en export recursos:', error)
    return NextResponse.json(
      { success: false, error: 'Error al exportar datos' },
      { status: 500 }
    )
  }
}