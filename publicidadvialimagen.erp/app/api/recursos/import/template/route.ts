import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Crear plantilla CSV con headers y datos de ejemplo
    // NOTA: cantidad y descripcion NO se incluyen porque no existen en la tabla recursos de Supabase
    const headers = [
      'codigo',
      'nombre',
      'categoria',
      'unidad_medida',
      'coste',
      'responsable',
      'disponibilidad'
    ]

    const exampleData = [
      [
        'INS-001',
        'Tornillos Anclaje M8',
        'Insumos',
        'kg',
        12.50,
        'Ana Martínez',
        'Disponible'
      ],
      [
        'INS-002',
        'Pintura Acrílica Blanca',
        'Insumos',
        'litro',
        25.00,
        'Carlos López',
        'Disponible'
      ]
    ]

    const csvRows = [headers.join(',')]
    exampleData.forEach(row => {
      const quotedRow = row.map(cell => `"${cell}"`)
      csvRows.push(quotedRow.join(','))
    })

    const csvContent = csvRows.join('\n')

    console.log('📄 Template CSV recursos generated')

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="plantilla_recursos.csv"'
      }
    })

  } catch (error) {
    console.error('❌ Error generando plantilla recursos:', error)
    return NextResponse.json(
      { success: false, error: 'Error al generar plantilla' },
      { status: 500 }
    )
  }
}
