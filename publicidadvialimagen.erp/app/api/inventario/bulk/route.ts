import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseServer
    const body = await request.json()
    const { ids, action, data } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'IDs requeridos' }, { status: 400 })
    }

    if (action === 'update') {
      if (!data) {
        return NextResponse.json({ error: 'Datos requeridos para actualización' }, { status: 400 })
      }

      const { data: updatedData, error } = await supabase
        .from('inventario')
        .update(data)
        .in('id', ids)
        .select()

      if (error) {
        console.error('Error updating inventario items:', error)
        return NextResponse.json({ error: 'Error al actualizar items' }, { status: 500 })
      }

      return NextResponse.json({ 
        message: `${updatedData.length} items actualizados correctamente`,
        updated: updatedData.length 
      })

    } else if (action === 'delete') {
      const { data: deletedData, error } = await supabase
        .from('inventario')
        .delete()
        .in('id', ids)
        .select()

      if (error) {
        console.error('Error deleting inventario items:', error)
        return NextResponse.json({ error: 'Error al eliminar items' }, { status: 500 })
      }

      return NextResponse.json({ 
        message: `${deletedData.length} items eliminados correctamente`,
        deleted: deletedData.length 
      })

    } else {
      return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error in inventario bulk operation:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
