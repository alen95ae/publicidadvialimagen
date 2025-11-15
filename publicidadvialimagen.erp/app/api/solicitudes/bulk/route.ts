import { NextRequest, NextResponse } from 'next/server'
import { updateMultipleSolicitudes } from '@/lib/supabaseSolicitudes'

export async function POST(request: NextRequest) {
  try {
    const { ids, action, data } = await request.json()
    console.log(`📋 Bulk action: ${action} for solicitud IDs:`, ids, 'with data:', data)

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, error: 'No se proporcionaron IDs' }, { status: 400 })
    }

    if (action === 'update') {
      if (!data || !data.estado) {
        return NextResponse.json({ success: false, error: 'Estado requerido para actualizar' }, { status: 400 })
      }

      // Actualizar múltiples solicitudes en Supabase
      const count = await updateMultipleSolicitudes(ids, {
        estado: data.estado
      })
      
      return NextResponse.json({
        success: true,
        message: `${count} solicitud(es) actualizada(s) correctamente`,
        count
      })
    }

    if (action === 'delete') {
      // La eliminación ya está implementada en /api/solicitudes/delete
      return NextResponse.json(
        { success: false, error: 'Use /api/solicitudes/delete para eliminar solicitudes' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Acción no válida' },
      { status: 400 }
    )

  } catch (error) {
    console.error('❌ Error en operación bulk de solicitudes:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}





