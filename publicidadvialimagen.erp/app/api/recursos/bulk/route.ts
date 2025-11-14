import { NextRequest, NextResponse } from 'next/server'
import { getAllRecursos, updateRecurso, deleteRecurso } from '@/lib/supabaseRecursos'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids, action, data } = body

    console.log('🔄 Operación bulk en recursos:', { action, ids: ids?.length, data })

    if (action === 'update' && data) {
      // Actualizar múltiples recursos
      const promises = ids.map((id: string) => updateRecurso(id, data))
      await Promise.all(promises)
      
      return NextResponse.json({
        success: true,
        message: `${ids.length} recursos actualizados correctamente`
      })
    }

    if (action === 'delete') {
      // Eliminar múltiples recursos
      const promises = ids.map((id: string) => deleteRecurso(id))
      await Promise.all(promises)
      
      return NextResponse.json({
        success: true,
        message: `${ids.length} recursos eliminados correctamente`
      })
    }

    return NextResponse.json(
      { success: false, error: 'Acción no válida' },
      { status: 400 }
    )

  } catch (error) {
    console.error('❌ Error en operación bulk:', error)
    return NextResponse.json(
      { success: false, error: 'Error en operación bulk' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { updates } = body

    console.log('🔄 Actualización masiva de recursos:', updates.length)

    // Actualizar múltiples recursos con datos específicos
    const promises = updates.map((update: { id: string; [key: string]: any }) => {
      const { id, ...data } = update
      return updateRecurso(id, data)
    })

    await Promise.all(promises)

    return NextResponse.json({
      success: true,
      message: `${updates.length} recursos actualizados correctamente`
    })

  } catch (error) {
    console.error('❌ Error en actualización masiva:', error)
    return NextResponse.json(
      { success: false, error: 'Error en actualización masiva' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids } = body

    console.log('🗑️ Eliminación masiva de recursos:', ids.length)

    // Eliminar múltiples recursos
    const promises = ids.map((id: string) => deleteRecurso(id))
    await Promise.all(promises)

    return NextResponse.json({
      success: true,
      message: `${ids.length} recursos eliminados correctamente`
    })

  } catch (error) {
    console.error('❌ Error en eliminación masiva:', error)
    return NextResponse.json(
      { success: false, error: 'Error en eliminación masiva' },
      { status: 500 }
    )
  }
}