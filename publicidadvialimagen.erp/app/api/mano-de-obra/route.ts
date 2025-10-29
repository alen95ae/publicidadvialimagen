import { NextRequest, NextResponse } from 'next/server'

// Datos de ejemplo para mano de obra (en producción vendría de una base de datos)
const manoDeObraItems = [
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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const query = searchParams.get('q') || ''
    const categoria = searchParams.get('categoria') || ''

    let filteredItems = manoDeObraItems

    if (query) {
      filteredItems = filteredItems.filter(item => 
        item.codigo.toLowerCase().includes(query.toLowerCase()) ||
        item.nombre.toLowerCase().includes(query.toLowerCase()) ||
        item.categoria.toLowerCase().includes(query.toLowerCase())
      )
    }

    if (categoria) {
      filteredItems = filteredItems.filter(item => item.categoria === categoria)
    }

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

    return NextResponse.json({ success: true, data, pagination })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}



