import { NextRequest, NextResponse } from 'next/server'
import { airtable } from '@/lib/airtable'

export async function POST(request: NextRequest) {
  try {
    const { ids, action, data } = await request.json()
    console.log(`📨 Bulk action: ${action} for message IDs:`, ids, 'with data:', data)

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, error: 'No se proporcionaron IDs' }, { status: 400 })
    }

    if (action === 'update') {
      if (!data || !data.estado) {
        return NextResponse.json({ success: false, error: 'Estado requerido para actualizar' }, { status: 400 })
      }

      // Actualizar múltiples mensajes
      const promises = ids.map((id: string) => 
        airtable("Mensajes").update(id, {
          "Estado": data.estado
        })
      )
      
      await Promise.all(promises)
      
      return NextResponse.json({
        success: true,
        message: `${ids.length} mensaje(s) actualizado(s) correctamente`,
        count: ids.length
      })
    }

    if (action === 'delete') {
      // Eliminar múltiples mensajes
      const promises = ids.map((id: string) => 
        airtable("Mensajes").destroy(id)
      )
      
      await Promise.all(promises)
      
      return NextResponse.json({
        success: true,
        message: `${ids.length} mensaje(s) eliminado(s) correctamente`,
        count: ids.length
      })
    }

    return NextResponse.json(
      { success: false, error: 'Acción no válida' },
      { status: 400 }
    )

  } catch (error) {
    console.error('❌ Error en operación bulk de mensajes:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}



