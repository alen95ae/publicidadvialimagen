import { NextRequest, NextResponse } from 'next/server'
import { getAllRecursos } from '@/lib/supabaseRecursos'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const categoria = searchParams.get('categoria') || ''

    console.log('📤 Exportando recursos:', { query, categoria })

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

    // Crear CSV
    const headers = [
      'ID',
      'Código',
      'Nombre',
      'Descripción',
      'Categoría',
      'Responsable',
      'Unidad de Medida',
      'Cantidad',
      'Coste',
      'Precio Venta',
      'Fecha Creación',
      'Fecha Actualización'
    ]

    const csvRows = [headers.join(',')]
    
    recursos.forEach(recurso => {
      const row = [
        recurso.id,
        `"${recurso.codigo}"`,
        `"${recurso.nombre}"`,
        `"${recurso.descripcion || ''}"`,
        `"${recurso.categoria}"`,
        `"${recurso.responsable}"`,
        `"${recurso.unidad_medida}"`,
        recurso.cantidad,
        recurso.coste,
        recurso.precio_venta || 0,
        `"${recurso.fecha_creacion}"`,
        `"${recurso.fecha_actualizacion}"`
      ]
      csvRows.push(row.join(','))
    })

    const csvContent = csvRows.join('\n')

    console.log('📄 CSV generado con', recursos.length, 'recursos')

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="recursos_${new Date().toISOString().split('T')[0]}.csv"`
      }
    })

  } catch (error) {
    console.error('❌ Error exportando recursos:', error)
    return NextResponse.json(
      { success: false, error: 'Error al exportar recursos' },
      { status: 500 }
    )
  }
}