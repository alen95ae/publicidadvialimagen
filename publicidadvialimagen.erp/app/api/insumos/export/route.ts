import { NextRequest, NextResponse } from 'next/server'

// Datos de ejemplo (en producción vendría de una base de datos)
const insumosItems = [
  {
    id: 1,
    codigo: "INS-001",
    nombre: "Tornillos Anclaje M8",
    responsable: "Ana Martínez",
    unidad_medida: "kg",
    coste: 12.50,
    precio_venta: 18.00,
    categoria: "Insumos",
    cantidad: 150,
    disponibilidad: "Disponible",
  },
  {
    id: 2,
    codigo: "INS-002", 
    nombre: "Pintura Acrílica Blanca",
    responsable: "Carlos López",
    unidad_medida: "litro",
    coste: 25.00,
    precio_venta: 40.00,
    categoria: "Insumos",
    cantidad: 45,
    disponibilidad: "Disponible"
  },
  {
    id: 3,
    codigo: "INS-003",
    nombre: "Vinilo Adhesivo Transparente",
    responsable: "María García",
    unidad_medida: "m²",
    coste: 8.50,
    precio_venta: 15.00,
    categoria: "Insumos",
    cantidad: 0,
    disponibilidad: "Agotado"
  },
  {
    id: 4,
    codigo: "INS-004",
    nombre: "Cables Eléctricos 2.5mm",
    responsable: "Pedro Ruiz",
    unidad_medida: "metro",
    coste: 3.20,
    precio_venta: 5.50,
    categoria: "Insumos",
    cantidad: 200,
    disponibilidad: "Disponible"
  },
  {
    id: 5,
    codigo: "INS-005",
    nombre: "Tornillos Phillips 3x20",
    responsable: "Laura Sánchez",
    unidad_medida: "pieza",
    coste: 0.15,
    precio_venta: 0.25,
    categoria: "Insumos",
    cantidad: 500,
    disponibilidad: "Disponible"
  },
  {
    id: 6,
    codigo: "INS-006",
    nombre: "Pegamento Industrial",
    responsable: "Juan Pérez",
    unidad_medida: "litro",
    coste: 18.00,
    precio_venta: 30.00,
    categoria: "Insumos",
    cantidad: 12,
    disponibilidad: "Bajo Stock"
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const categoria = searchParams.get('categoria') || ''

    console.log('📤 Export insumos params:', { query, categoria })

    // Filtrar items
    let filteredItems = insumosItems

    if (query) {
      filteredItems = filteredItems.filter(item => 
        item.codigo.toLowerCase().includes(query.toLowerCase()) ||
        item.nombre.toLowerCase().includes(query.toLowerCase()) ||
        item.categoria.toLowerCase().includes(query.toLowerCase())
      )
    }

    if (categoria) {
      filteredItems = filteredItems.filter(item => 
        item.categoria === categoria
      )
    }

    // Crear CSV
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

    filteredItems.forEach(item => {
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

    console.log('📊 CSV insumos generated:', { rows: csvRows.length - 1 })

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="insumos_${new Date().toISOString().split('T')[0]}.csv"`
      }
    })

  } catch (error) {
    console.error('❌ Error en export insumos:', error)
    return NextResponse.json(
      { success: false, error: 'Error al exportar datos' },
      { status: 500 }
    )
  }
}
