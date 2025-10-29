import { NextRequest, NextResponse } from 'next/server'

// Datos de ejemplo (en producción vendría de una base de datos)
let insumosItems = [
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
  }
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids, action, data } = body

    console.log('🔧 Bulk operation insumos:', { action, ids, data })

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'IDs requeridos' },
        { status: 400 }
      )
    }

    if (action === 'update') {
      if (!data) {
        return NextResponse.json(
          { success: false, error: 'Datos de actualización requeridos' },
          { status: 400 }
        )
      }

      // Actualizar items seleccionados
      const updatedIds = []
      insumosItems = insumosItems.map(item => {
        if (ids.includes(item.id.toString())) {
          updatedIds.push(item.id)
          return { ...item, ...data }
        }
        return item
      })

      console.log('✅ Updated insumos:', updatedIds)

      return NextResponse.json({
        success: true,
        message: `${updatedIds.length} items actualizados`,
        updatedIds
      })

    } else if (action === 'delete') {
      // Eliminar items seleccionados
      const originalLength = insumosItems.length
      insumosItems = insumosItems.filter(item => !ids.includes(item.id.toString()))
      const deletedCount = originalLength - insumosItems.length

      console.log('🗑️ Deleted insumos:', deletedCount)

      return NextResponse.json({
        success: true,
        message: `${deletedCount} items eliminados`,
        deletedCount
      })

    } else {
      return NextResponse.json(
        { success: false, error: 'Acción no válida' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('❌ Error en bulk operation insumos:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
