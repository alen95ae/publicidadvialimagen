export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseUser, getSupabaseAdmin } from '@/lib/supabaseServer'

export async function DELETE(request: NextRequest) {
  console.log('DELETE method called for solicitudes')
  
  try {
    // Validar sesión de usuario (autenticación)
    const userSession = await getSupabaseUser(request);
    
    if (!userSession) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Usar cliente admin para operaciones de BD (consistente con /api/solicitudes/bulk)
    const supabase = getSupabaseAdmin();

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
    
    // Verificar si el id parece un UUID
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUUID = uuidPattern.test(id);
    
    // Primero verificar que la solicitud existe antes de intentar eliminarla
    let solicitudExiste = false;
    if (isUUID) {
      const { data: checkData } = await supabase
        .from('solicitudes')
        .select('id, codigo')
        .eq('id', id)
        .single()
      solicitudExiste = !!checkData
      if (checkData) {
        console.log('✅ Solicitud encontrada por UUID:', checkData.codigo)
      }
    } else {
      const { data: checkData } = await supabase
        .from('solicitudes')
        .select('id, codigo')
        .eq('codigo', id)
        .single()
      solicitudExiste = !!checkData
      if (checkData) {
        console.log('✅ Solicitud encontrada por código:', checkData.codigo, 'ID:', checkData.id)
      } else {
        // Intentar buscar sin case sensitive
        const { data: checkDataCase } = await supabase
          .from('solicitudes')
          .select('id, codigo')
          .ilike('codigo', id)
          .limit(5)
        console.log('🔍 Búsqueda case-insensitive encontró:', checkDataCase?.length || 0, 'resultados')
        if (checkDataCase && checkDataCase.length > 0) {
          console.log('📋 Códigos encontrados:', checkDataCase.map(s => s.codigo))
        }
      }
    }
    
    if (!solicitudExiste) {
      console.log('⚠️ Solicitud no encontrada antes de eliminar:', id)
      return NextResponse.json(
        { error: 'Solicitud no encontrada' },
        { status: 404 }
      )
    }
    
    let error = null;
    let count = 0;
    
    if (isUUID) {
      // Si es UUID, buscar por campo id
      console.log('Eliminando por UUID:', id)
      const result = await supabase
        .from('solicitudes')
        .delete({ count: 'exact' })
        .eq('id', id)
      
      error = result.error
      count = result.count || 0
    } else {
      // Si no es UUID, buscar por código
      console.log('Eliminando por código:', id)
      const result = await supabase
        .from('solicitudes')
        .delete({ count: 'exact' })
        .eq('codigo', id)
      
      error = result.error
      count = result.count || 0
    }
    
    if (error) {
      console.error('Error al eliminar solicitud:', error);
      return NextResponse.json(
        { error: 'Error al eliminar la solicitud', details: error.message },
        { status: 500 }
      )
    }

    if (count === 0) {
      console.log('⚠️ No se eliminó ninguna solicitud (count = 0) para:', id)
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
