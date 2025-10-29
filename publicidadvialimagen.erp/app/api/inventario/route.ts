import { NextRequest, NextResponse } from 'next/server'

// Datos de ejemplo para el inventario (en producción vendría de una base de datos)
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
  },
  {
    id: 7,
    codigo: "INV-007",
    nombre: "Vinilo Adhesivo Premium",
    responsable: "Roberto Silva",
    unidad_medida: "m²",
    coste: 8.50,
    precio_venta: 15.00,
    categoria: "Insumos",
    cantidad: 200,
    disponibilidad: "Disponible"
  },
  {
    id: 8,
    codigo: "INV-008",
    nombre: "Estructura LED 3x2",
    responsable: "Carmen Vega",
    unidad_medida: "unidad",
    coste: 800.00,
    precio_venta: 1200.00,
    categoria: "Displays",
    cantidad: 5,
    disponibilidad: "Bajo Stock"
  },
  {
    id: 9,
    codigo: "INV-009",
    nombre: "Servicio de Diseño Gráfico",
    responsable: "Diego Morales",
    unidad_medida: "hora",
    coste: 20.00,
    precio_venta: 35.00,
    categoria: "Mano de obra",
    cantidad: 0,
    disponibilidad: "Disponible"
  },
  {
    id: 10,
    codigo: "INV-010",
    nombre: "Papel Fotográfico 300g",
    responsable: "Elena Torres",
    unidad_medida: "pliego",
    coste: 2.50,
    precio_venta: 4.50,
    categoria: "Insumos",
    cantidad: 500,
    disponibilidad: "Disponible"
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const query = searchParams.get('q') || ''
    const categoria = searchParams.get('categoria') || ''

    console.log('🔍 Inventario search params:', { page, limit, query, categoria })

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

    // Calcular paginación
    const total = filteredItems.length
    const totalPages = Math.ceil(total / limit)
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const data = filteredItems.slice(startIndex, endIndex)

    const pagination = {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }

    console.log('📊 Inventario pagination:', pagination)
    console.log('📊 Inventario data length:', data.length)

    return NextResponse.json({
      success: true,
      data,
      pagination
    })

  } catch (error) {
    console.error('❌ Error en API inventario:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
