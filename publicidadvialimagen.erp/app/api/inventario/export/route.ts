import { NextRequest, NextResponse } from 'next/server'
import { getAllProductos } from '@/lib/supabaseProductos'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const categoria = searchParams.get('categoria') || ''

    console.log('📤 Export productos params:', { query, categoria })

    // Obtener todos los productos de Supabase
    let productos = await getAllProductos()

    // Aplicar filtros
    if (query) {
      productos = productos.filter(item => 
        item.codigo.toLowerCase().includes(query.toLowerCase()) ||
        item.nombre.toLowerCase().includes(query.toLowerCase()) ||
        item.categoria?.toLowerCase().includes(query.toLowerCase())
      )
    }

    if (categoria) {
      productos = productos.filter(item => 
        item.categoria?.toLowerCase().trim() === categoria.toLowerCase().trim()
      )
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

    // Crear CSV con todas las columnas de la lista
    const headers = [
      'Código',
      'Nombre',
      'Categoría',
      'Unidad',
      'Coste',
      'Precio Venta',
      '% Utilidad',
      'Stock',
      'Mostrar en Web',
      'Responsable',
      'Descripción',
      'Disponibilidad'
    ]

    const csvRows = [headers.join(',')]

    productos.forEach(item => {
      const utilidad = item.coste === 0 ? 0 : ((item.precio_venta - item.coste) / item.coste) * 100
      
      const row = [
        escapeCSV(item.codigo),
        escapeCSV(item.nombre),
        escapeCSV(item.categoria),
        escapeCSV(item.unidad_medida),
        item.coste.toFixed(2),
        item.precio_venta.toFixed(2),
        utilidad.toFixed(1),
        item.cantidad,
        item.mostrar_en_web ? 'Sí' : 'No',
        escapeCSV(item.responsable),
        escapeCSV(item.descripcion),
        escapeCSV(item.disponibilidad)
      ]
      csvRows.push(row.join(','))
    })

    const csv = csvRows.join('\n')
    // Agregar BOM (Byte Order Mark) para que Excel reconozca UTF-8 correctamente
    // Esto es crucial para que las tildes y ñ se muestren correctamente
    const csvWithBOM = '\uFEFF' + csv

    console.log('📊 CSV productos generado:', { rows: productos.length })

    const fecha = new Date().toISOString().split('T')[0] // Formato YYYY-MM-DD
    
    return new NextResponse(csvWithBOM, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="productos_${fecha}.csv"`
      }
    })

  } catch (error) {
    console.error('❌ Error en export productos:', error)
    return NextResponse.json(
      { success: false, error: 'Error al exportar datos' },
      { status: 500 }
    )
  }
}
