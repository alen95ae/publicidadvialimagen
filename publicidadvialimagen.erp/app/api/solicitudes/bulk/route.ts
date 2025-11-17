import { NextResponse } from 'next/server'
import {
  updateSolicitud,
  deleteSolicitud
} from '@/lib/supabaseSolicitudes'

interface BulkRequest {
  ids: string[]
  action: 'delete' | 'update'
  data?: any
}

export async function POST(req: Request) {
  try {
    const { ids, action, data }: BulkRequest = await req.json()

    if (!Array.isArray(ids) || !ids.length) {
      return NextResponse.json({ error: 'Sin IDs' }, { status: 400 })
    }

    if (action === 'delete') {
      let deletedCount = 0
      for (const id of ids) {
        try {
          const success = await deleteSolicitud(id)
          if (success) {
            deletedCount += 1
          }
        } catch (error) {
          console.error(`Error deleting solicitud ${id}:`, error)
        }
      }
      return NextResponse.json({ ok: true, count: deletedCount })
    }

    if (action === 'update') {
      if (!data?.estado) {
        return NextResponse.json({ error: 'Solo se puede actualizar el campo estado' }, { status: 400 })
      }

      // Validar estado
      const estadosValidos = ['Nueva', 'Pendiente', 'Cotizada']
      if (!estadosValidos.includes(data.estado)) {
        return NextResponse.json({ 
          error: 'Estado inválido. Debe ser: Nueva, Pendiente o Cotizada' 
        }, { status: 400 })
      }
      
      let updatedCount = 0
      for (const id of ids) {
        try {
          const result = await updateSolicitud(id, { estado: data.estado })
          if (result) {
            updatedCount += 1
          }
        } catch (error) {
          console.error(`Error updating solicitud ${id}:`, error)
        }
      }

      return NextResponse.json({ ok: true, count: updatedCount })
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  } catch (error) {
    console.error("Error in bulk action:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
