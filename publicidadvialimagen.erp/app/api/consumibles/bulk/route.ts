import { NextRequest, NextResponse } from 'next/server'
import { getAllConsumibles, updateConsumible, deleteConsumible } from '@/lib/supabaseConsumibles'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids, action, data } = body

    console.log('🔄 Operación bulk en consumibles:', { action, ids: ids?.length, data })

    if (action === 'update' && data) {
      // Actualizar múltiples consumibles
      const promises = ids.map((id: string) => updateConsumible(id, data))
      await Promise.all(promises)
      
      return NextResponse.json({
        success: true,
        message: `${ids.length} consumibles actualizados correctamente`
      })
    }

    if (action === 'delete') {
      // Eliminar múltiples consumibles
      const promises = ids.map((id: string) => deleteConsumible(id))
      await Promise.all(promises)
      
      return NextResponse.json({
        success: true,
        message: `${ids.length} consumibles eliminados correctamente`
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

    console.log('🔄 Actualización masiva de consumibles:', updates.length)

    // Actualizar múltiples consumibles con datos específicos
    const promises = updates.map((update: { id: string; [key: string]: any }) => {
      const { id, ...data } = update
      return updateConsumible(id, data)
    })

    await Promise.all(promises)

    return NextResponse.json({
      success: true,
      message: `${updates.length} consumibles actualizados correctamente`
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

    console.log('🗑️ Eliminación masiva de consumibles:', ids.length)

    // Eliminar múltiples consumibles
    const promises = ids.map((id: string) => deleteConsumible(id))
    await Promise.all(promises)

    return NextResponse.json({
      success: true,
      message: `${ids.length} consumibles eliminados correctamente`
    })

  } catch (error) {
    console.error('❌ Error en eliminación masiva:', error)
    return NextResponse.json(
      { success: false, error: 'Error en eliminación masiva' },
      { status: 500 }
    )
  }
}
