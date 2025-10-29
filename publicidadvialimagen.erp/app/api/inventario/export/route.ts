import { NextRequest, NextResponse } from 'next/server'

// Datos de ejemplo (en producción vendría de una base de datos)
const inventarioItems = [
  {
    id: 1,
    codigo: "INV-001",
    nombre: "Soporte Publicitario 6x3",
    responsable: "Juan Pérez",
    unidad_medida: "unidad",
    coste: 150.00,
    precio_venta: 250.00,
    categoria: "Displays",
    cantidad: 25,
    disponibilidad: "Disponible",
  },
  {
    id: 2,
    codigo: "INV-002", 
    nombre: "Banner Vinilo 2x1",
    responsable: "María García",
    unidad_medida: "m²",
    coste: 45.00,
    precio_venta: 75.00,
    categoria: "Impresion digital",
    cantidad: 0,
    disponibilidad: "Agotado"
  },
  {
    id: 3,
    codigo: "INV-003",
    nombre: "Estructura Metálica Base",
    responsable: "Carlos López",
    unidad_medida: "unidad",
    coste: 320.00,
    precio_venta: 450.00,
    categoria: "Categoria general",
    cantidad: 8,
    disponibilidad: "Bajo Stock"
  },
  {
    id: 4,
    codigo: "INV-004",
    nombre: "Tornillos Anclaje M8",
    responsable: "Ana Martínez",
    unidad_medida: "kg",
    coste: 12.50,
    precio_venta: 18.00,
    categoria: "Insumos",
    cantidad: 150,
    disponibilidad: "Disponible"
  },
  {
    id: 5,
    codigo: "INV-005",
    nombre: "Servicio de Corte Láser",
    responsable: "Pedro Ruiz",
    unidad_medida: "hora",
    coste: 25.00,
    precio_venta: 40.00,
    categoria: "Corte y grabado",
    cantidad: 0,
    disponibilidad: "Disponible"
  },
  {
    id: 6,
    codigo: "INV-006",
    nombre: "Instalación Publicitaria",
    responsable: "Laura Sánchez",
    unidad_medida: "hora",
    coste: 30.00,
    precio_venta: 50.00,
    categoria: "Mano de obra",
    cantidad: 0,
    disponibilidad: "Disponible"
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const categoria = searchParams.get('categoria') || ''

    console.log('📤 Export inventario params:', { query, categoria })

    // Filtrar items
    let filteredItems = inventarioItems

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
      'Precio Venta (Bs)',
      '% Utilidad',
      'Categoría',
      'Cantidad',
      'Disponibilidad'
    ]

    const csvRows = [headers.join(',')]

    filteredItems.forEach(item => {
      const utilidad = item.coste === 0 ? 0 : ((item.precio_venta - item.coste) / item.coste) * 100
      
      const row = [
        `"${item.codigo}"`,
        `"${item.nombre}"`,
        `"${item.responsable}"`,
        `"${item.unidad_medida}"`,
        item.coste.toFixed(2),
        item.precio_venta.toFixed(2),
        utilidad.toFixed(1),
        `"${item.categoria}"`,
        item.cantidad,
        `"${item.disponibilidad}"`
      ]
      csvRows.push(row.join(','))
    })

    const csvContent = csvRows.join('\n')

    console.log('📊 CSV generated:', { rows: csvRows.length - 1 })

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="inventario_${new Date().toISOString().split('T')[0]}.csv"`
      }
    })

  } catch (error) {
    console.error('❌ Error en export inventario:', error)
    return NextResponse.json(
      { success: false, error: 'Error al exportar datos' },
      { status: 500 }
    )
  }
}
