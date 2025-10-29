import { NextRequest, NextResponse } from 'next/server'

// Datos de ejemplo (en producción vendría de una base de datos)
let inventarioItems = [
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids, action, data } = body

    console.log('🔧 Bulk operation:', { action, ids, data })

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
      inventarioItems = inventarioItems.map(item => {
        if (ids.includes(item.id.toString())) {
          updatedIds.push(item.id)
          return { ...item, ...data }
        }
        return item
      })

      console.log('✅ Updated items:', updatedIds)

      return NextResponse.json({
        success: true,
        message: `${updatedIds.length} items actualizados`,
        updatedIds
      })

    } else if (action === 'delete') {
      // Eliminar items seleccionados
      const originalLength = inventarioItems.length
      inventarioItems = inventarioItems.filter(item => !ids.includes(item.id.toString()))
      const deletedCount = originalLength - inventarioItems.length

      console.log('🗑️ Deleted items:', deletedCount)

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
    console.error('❌ Error en bulk operation:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
