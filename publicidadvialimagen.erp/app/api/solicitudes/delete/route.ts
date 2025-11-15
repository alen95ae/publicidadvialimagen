import { NextRequest, NextResponse } from 'next/server'
import { deleteSolicitud } from '@/lib/supabaseSolicitudes'

export async function DELETE(request: NextRequest) {
  console.log('DELETE method called for solicitudes')
  
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    
    if (!id || id.trim() === '') {
      console.log('⚠️ No ID provided or empty ID')
      return NextResponse.json(
        { error: 'ID de solicitud requerido' },
        { status: 400 }
      )
    }

    console.log('Eliminando solicitud:', id)
    
    const eliminada = await deleteSolicitud(id)
    
    if (!eliminada) {
      console.log('⚠️ No se encontró solicitud con código:', id)
      return NextResponse.json(
        { error: 'Solicitud no encontrada o error al eliminar' },
        { status: 404 }
      )
    }
    
    console.log('✅ Solicitud eliminada exitosamente de Supabase:', id)
    
    return NextResponse.json({
      success: true,
      message: 'Solicitud eliminada exitosamente'
    })

  } catch (error: any) {
    console.error('Error al eliminar solicitud:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    )
  }
}
