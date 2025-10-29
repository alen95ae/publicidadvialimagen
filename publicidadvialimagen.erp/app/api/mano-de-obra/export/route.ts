import { NextRequest, NextResponse } from 'next/server'

// Datos de ejemplo (debe coincidir con los de GET)
const items = [
  {
    id: 1,
    codigo: "MO-001",
    nombre: "Instalación básica",
    responsable: "Equipo Instalación",
    unidad_medida: "hora",
    coste: 50.00,
    categoria: "Mano de obra",
    cantidad: 1,
    disponibilidad: "Disponible",
  },
  {
    id: 2,
    codigo: "MO-002", 
    nombre: "Diseño gráfico",
    responsable: "Equipo Diseño",
    unidad_medida: "hora",
    coste: 60.00,
    categoria: "Mano de obra",
    cantidad: 1,
    disponibilidad: "Disponible"
  },
  {
    id: 3,
    codigo: "MO-003",
    nombre: "Corte y preparación",
    responsable: "Producción",
    unidad_medida: "hora",
    coste: 45.00,
    categoria: "Mano de obra",
    cantidad: 1,
    disponibilidad: "Disponible"
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const categoria = searchParams.get('categoria') || ''

    let filtered = items
    if (query) {
      filtered = filtered.filter(item => 
        item.codigo.toLowerCase().includes(query.toLowerCase()) ||
        item.nombre.toLowerCase().includes(query.toLowerCase()) ||
        item.categoria.toLowerCase().includes(query.toLowerCase())
      )
    }
    if (categoria) {
      filtered = filtered.filter(item => item.categoria === categoria)
    }

    const headers = [
      'Código',
      'Nombre',
      'Responsable',
      'Unidad de Medida',
      'Coste (Bs)',
      'Categoría',
      'Cantidad',
      'Disponibilidad'
    ]

    const csvRows = [headers.join(',')]
    filtered.forEach(item => {
      const row = [
        `"${item.codigo}"`,
        `"${item.nombre}"`,
        `"${item.responsable}"`,
        `"${item.unidad_medida}"`,
        item.coste.toFixed(2),
        `"${item.categoria}"`,
        item.cantidad,
        `"${item.disponibilidad}"`
      ]
      csvRows.push(row.join(','))
    })

    const csvContent = csvRows.join('\n')
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="mano_de_obra_${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error al exportar datos' }, { status: 500 })
  }
}



