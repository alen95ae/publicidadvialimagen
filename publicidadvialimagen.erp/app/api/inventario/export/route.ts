import { NextRequest, NextResponse } from 'next/server'
import { getAllProductos } from '@/lib/supabaseProductos'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const categoria = searchParams.get('categoria') || ''
    const idsParam = searchParams.get('ids') || ''

    console.log('📤 Export productos params:', { query, categoria, ids: idsParam ? 'selection' : 'all' })

    let productos = await getAllProductos()

    if (idsParam.trim()) {
      const idSet = new Set(idsParam.split(',').map((id) => id.trim()).filter(Boolean))
      productos = productos.filter((item) => idSet.has(item.id))
    } else {
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
    }

    const excelData = productos.map(item => {
      const utilidad = item.coste === 0 ? 0 : ((item.precio_venta - item.coste) / item.coste) * 100
      return {
        'Código': item.codigo ?? '',
        'Nombre': item.nombre ?? '',
        'Categoría': item.categoria ?? '',
        'Unidad': item.unidad_medida ?? '',
        'Coste': item.coste,
        'Precio Venta': item.precio_venta,
        '% Utilidad': utilidad,
        'Stock': item.cantidad,
        'Mostrar en Web': item.mostrar_en_web ? 'Sí' : 'No',
        'Responsable': item.responsable ?? '',
        'Descripción': item.descripcion ?? '',
        'Disponibilidad': item.disponibilidad ?? ''
      }
    })

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)
    XLSX.utils.book_append_sheet(wb, ws, 'Productos')
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    console.log('📊 XLSX productos generado:', { rows: productos.length })

    const fecha = new Date().toISOString().split('T')[0]

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="productos_${fecha}.xlsx"`
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
