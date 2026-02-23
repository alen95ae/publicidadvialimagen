import { NextRequest, NextResponse } from 'next/server'
import { getAllRecursos } from '@/lib/supabaseRecursos'
import * as XLSX from 'xlsx'

function getCantidad(recurso: any): number {
  if (recurso.control_stock && typeof recurso.control_stock === 'object') {
    if (recurso.control_stock.cantidad !== undefined) return Number(recurso.control_stock.cantidad) || 0
    if (recurso.control_stock.stock !== undefined) return Number(recurso.control_stock.stock) || 0
  }
  return 0
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const categoria = searchParams.get('categoria') || ''
    const idsParam = searchParams.get('ids') || ''

    console.log('📤 Export recursos params:', { query, categoria, ids: idsParam ? 'selection' : 'all' })

    let recursos = await getAllRecursos()

    if (idsParam.trim()) {
      const idSet = new Set(idsParam.split(',').map((id) => id.trim()).filter(Boolean))
      recursos = recursos.filter((r) => idSet.has(r.id))
    } else {
      if (query) {
        recursos = recursos.filter(recurso =>
          recurso.codigo.toLowerCase().includes(query.toLowerCase()) ||
          recurso.nombre.toLowerCase().includes(query.toLowerCase()) ||
          (recurso.categoria && recurso.categoria.toLowerCase().includes(query.toLowerCase()))
        )
      }
      if (categoria) {
        recursos = recursos.filter(recurso => recurso.categoria === categoria)
      }
    }

    const excelData = recursos.map(recurso => {
      const cantidad = getCantidad(recurso)
      return {
        'Código': recurso.codigo ?? '',
        'Nombre': recurso.nombre ?? '',
        'Responsable': recurso.responsable ?? '',
        'Categoría': recurso.categoria ?? '',
        'Unidad': recurso.unidad_medida ?? '',
        'Coste': recurso.coste,
        'Stock': cantidad
      }
    })

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)
    XLSX.utils.book_append_sheet(wb, ws, 'Recursos')
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    console.log('📊 XLSX recursos generado:', { rows: recursos.length })

    const fecha = new Date().toISOString().split('T')[0]

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="recursos_${fecha}.xlsx"`
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