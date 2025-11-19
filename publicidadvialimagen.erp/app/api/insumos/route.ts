import { NextRequest, NextResponse } from 'next/server'
import { includesIgnoreAccents } from '@/lib/utils'

// Datos de ejemplo para los insumos (en producción vendría de una base de datos)
const insumosItems = [
  {
    id: 1,
    codigo: "INS-001",
    nombre: "Tornillos Anclaje M8",
    responsable: "Ana Martínez",
    unidad_medida: "kg",
    coste: 12.50,
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
    categoria: "Insumos",
    cantidad: 12,
    disponibilidad: "Bajo Stock"
  },
  {
    id: 7,
    codigo: "INS-007",
    nombre: "Papel Fotográfico 300g",
    responsable: "Elena Torres",
    unidad_medida: "pliego",
    coste: 2.50,
    categoria: "Insumos",
    cantidad: 500,
    disponibilidad: "Disponible"
  },
  {
    id: 8,
    codigo: "INS-008",
    nombre: "Tinta para Impresora HP",
    responsable: "Roberto Silva",
    unidad_medida: "unidad",
    coste: 45.00,
    categoria: "Insumos",
    cantidad: 8,
    disponibilidad: "Bajo Stock"
  },
  {
    id: 9,
    codigo: "INS-009",
    nombre: "Cinta Adhesiva Transparente",
    responsable: "Carmen Vega",
    unidad_medida: "rollo",
    coste: 3.50,
    categoria: "Insumos",
    cantidad: 25,
    disponibilidad: "Disponible"
  },
  {
    id: 10,
    codigo: "INS-010",
    nombre: "Pintura en Aerosol Negra",
    responsable: "Diego Morales",
    unidad_medida: "unidad",
    coste: 8.00,
    categoria: "Insumos",
    cantidad: 30,
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

    console.log('🔍 Insumos search params:', { page, limit, query, categoria })

    // Filtrar items
    let filteredItems = insumosItems

    if (query) {
      filteredItems = filteredItems.filter(item => 
        includesIgnoreAccents(item.codigo, query) ||
        includesIgnoreAccents(item.nombre, query) ||
        includesIgnoreAccents(item.categoria, query)
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

    console.log('📊 Insumos pagination:', pagination)
    console.log('📊 Insumos data length:', data.length)

    return NextResponse.json({
      success: true,
      data,
      pagination
    })

  } catch (error) {
    console.error('❌ Error en API insumos:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
