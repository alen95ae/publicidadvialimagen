import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Crear plantilla CSV con headers y datos de ejemplo
    const headers = [
      'codigo',
      'nombre',
      'descripcion',
      'categoria',
      'cantidad',
      'unidad_medida',
      'coste',
      'precio_venta',
      'responsable',
      'disponibilidad'
    ]

    const exampleData = [
      [
        'INV-001',
        'Soporte Publicitario 6x3',
        'Soporte publicitario de 6x3 metros',
        'Displays',
        25,
        'unidad',
        150.00,
        250.00,
        'Juan Pérez',
        'Disponible'
      ],
      [
        'INV-002',
        'Banner Vinilo 2x1',
        'Banner de vinilo adhesivo 2x1 metros',
        'Impresion digital',
        0,
        'm²',
        45.00,
        75.00,
        'María García',
        'Agotado'
      ]
    ]

    const csvRows = [headers.join(',')]
    exampleData.forEach(row => {
      const quotedRow = row.map(cell => `"${cell}"`)
      csvRows.push(quotedRow.join(','))
    })

    const csvContent = csvRows.join('\n')

    console.log('📄 Template CSV generated')

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="plantilla_inventario.csv"'
      }
    })

  } catch (error) {
    console.error('❌ Error generando plantilla:', error)
    return NextResponse.json(
      { success: false, error: 'Error al generar plantilla' },
      { status: 500 }
    )
  }
}
