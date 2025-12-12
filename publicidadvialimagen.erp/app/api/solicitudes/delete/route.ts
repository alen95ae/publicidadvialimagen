import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseUser } from '@/lib/supabaseServer'

export async function DELETE(request: NextRequest) {
  console.log('DELETE method called for solicitudes')
  
  try {
    // Usar cliente de usuario (RLS controla acceso)
    const supabase = await getSupabaseUser(request);
    
    if (!supabase) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

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
    
    // Eliminar usando cliente de usuario (RLS controlará permisos)
    const { error, count } = await supabase
      .from('solicitudes')
      .delete({ count: 'exact' })
      .or(`id.eq.${id},codigo.eq.${id}`)
    
    if (error) {
      console.error('Error al eliminar solicitud:', error);
      return NextResponse.json(
        { error: 'Error al eliminar la solicitud' },
        { status: 500 }
      )
    }

    if (count === 0) {
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
