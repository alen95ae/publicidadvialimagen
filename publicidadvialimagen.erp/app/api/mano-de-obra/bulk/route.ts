import { NextRequest, NextResponse } from 'next/server'

let manoDeObraItems = [
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids, action, data } = body

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

      const updatedIds: number[] = []
      manoDeObraItems = manoDeObraItems.map(item => {
        if (ids.includes(item.id.toString())) {
          updatedIds.push(item.id)
          return { ...item, ...data }
        }
        return item
      })

      return NextResponse.json({ success: true, message: `${updatedIds.length} items actualizados`, updatedIds })

    } else if (action === 'delete') {
      const originalLength = manoDeObraItems.length
      manoDeObraItems = manoDeObraItems.filter(item => !ids.includes(item.id.toString()))
      const deletedCount = originalLength - manoDeObraItems.length
      return NextResponse.json({ success: true, message: `${deletedCount} items eliminados`, deletedCount })
    }

    return NextResponse.json({ success: false, error: 'Acción no válida' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}



