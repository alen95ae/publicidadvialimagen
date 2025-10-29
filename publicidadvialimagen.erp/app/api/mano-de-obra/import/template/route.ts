import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const headers = [
      'codigo',
      'nombre',
      'descripcion',
      'categoria',
      'cantidad',
      'unidad_medida',
      'coste',
      'responsable',
      'disponibilidad'
    ]

    const exampleData = [
      [
        'MO-001',
        'Instalación básica',
        'Servicio de instalación base',
        'Mano de obra',
        1,
        'hora',
        50.00,
        'Equipo Instalación',
        'Disponible'
      ],
      [
        'MO-002',
        'Diseño gráfico',
        'Diseño de piezas',
        'Mano de obra',
        1,
        'hora',
        60.00,
        'Equipo Diseño',
        'Disponible'
      ]
    ]

    const csvRows = [headers.join(',')]
    exampleData.forEach(row => {
      const quotedRow = row.map(cell => `"${cell}"`)
      csvRows.push(quotedRow.join(','))
    })

    const csvContent = csvRows.join('\n')
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="plantilla_mano_de_obra.csv"'
      }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error al generar plantilla' },
      { status: 500 }
    )
  }
}



