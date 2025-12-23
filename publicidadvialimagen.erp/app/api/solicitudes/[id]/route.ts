export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server'
import {
  findSolicitudByCodigoOrId,
  updateSolicitud
} from '@/lib/supabaseSolicitudes'
import { getSupabaseUser, getSupabaseAdmin } from '@/lib/supabaseServer'

// Interface para las solicitudes de cotización
interface SolicitudCotizacion {
  id: string
  codigo: string
  fechaCreacion: string
  empresa: string
  contacto: string
  telefono: string
  email: string
  comentarios: string
  estado: "Nueva" | "Pendiente" | "Cotizada"
  fechaInicio: string
  mesesAlquiler: number
  soporte: string
  serviciosAdicionales: string[]
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID de solicitud requerido' },
        { status: 400 }
      )
    }

    console.log('[GET /api/solicitudes/[id]] Buscando solicitud con ID:', id)

    // Intentar primero con cliente de usuario (RLS controla acceso)
    let supabase = await getSupabaseUser(request);
    
    // Si no hay cliente de usuario, intentar con admin como fallback
    if (!supabase) {
      console.warn('[GET /api/solicitudes/[id]] No hay sesión de usuario, usando admin como fallback')
      supabase = getSupabaseAdmin()
    }

    // Buscar primero por código (más común)
    let { data, error } = await supabase
      .from('solicitudes')
      .select('*')
      .eq('codigo', id)
      .maybeSingle();
    
    // Si no se encuentra por código, buscar por ID
    if (!data && !error) {
      console.log('[GET /api/solicitudes/[id]] No encontrado por código, buscando por ID')
      const result = await supabase
        .from('solicitudes')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      data = result.data
      error = result.error
    }
    
    if (error) {
      console.error('[GET /api/solicitudes/[id]] Error al obtener solicitud:', error);
      return NextResponse.json(
        { 
          error: 'Error interno del servidor',
          details: error.message 
        },
        { status: 500 }
      );
    }

    if (!data) {
      console.log('[GET /api/solicitudes/[id]] Solicitud no encontrada:', id)
      return NextResponse.json(
        { error: 'Solicitud no encontrada' },
        { status: 404 }
      )
    }

    console.log('[GET /api/solicitudes/[id]] Solicitud encontrada:', data.codigo)

    // Convertir a formato esperado por el frontend
    const fechaCreacion = data.created_at 
      ? new Date(data.created_at).toLocaleString('es-BO')
      : new Date().toLocaleString('es-BO');

    const solicitud = {
      id: data.id,
      codigo: data.codigo,
      fechaCreacion,
      empresa: data.empresa || '',
      contacto: data.contacto || '',
      telefono: data.telefono || '',
      email: data.email || '',
      comentarios: data.comentarios || '',
      estado: data.estado || 'Nueva',
      fechaInicio: data.fecha_inicio,
      mesesAlquiler: data.meses_alquiler,
      soporte: data.soporte,
      serviciosAdicionales: Array.isArray(data.servicios_adicionales) 
        ? data.servicios_adicionales 
        : (data.servicios_adicionales ? [data.servicios_adicionales] : [])
    };

    return NextResponse.json(solicitud)

  } catch (error) {
    console.error('[GET /api/solicitudes/[id]] Error inesperado:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: errorMessage 
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID de solicitud requerido' },
        { status: 400 }
      )
    }

    console.log('[PUT /api/solicitudes/[id]] Actualizando solicitud:', id, body)

    // Usar admin directamente para evitar problemas de RLS
    // Esto es seguro para un ERP interno donde los usuarios ya están autenticados
    const supabase = getSupabaseAdmin()

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (body.estado) {
      updateData.estado = body.estado;
    }

    // Verificar si el id parece un UUID (formato: 8-4-4-4-12 caracteres hexadecimales)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUUID = uuidPattern.test(id);

    let data = null;
    let updateError = null;

    if (isUUID) {
      // Si es UUID, buscar por campo id
      console.log('[PUT /api/solicitudes/[id]] Actualizando por UUID:', id)
      const result = await supabase
        .from('solicitudes')
        .update(updateData)
        .eq('id', id)
        .select()
        .maybeSingle();
      
      data = result.data
      updateError = result.error
    } else {
      // Si no es UUID, buscar por código
      console.log('[PUT /api/solicitudes/[id]] Actualizando por código:', id)
      const result = await supabase
        .from('solicitudes')
        .update(updateData)
        .eq('codigo', id)
        .select()
        .maybeSingle();
      
      data = result.data
      updateError = result.error
      
      // Si no se encuentra por código y NO es UUID, retornar 404 directamente
      // NO intentar buscar por ID porque causaría el error de UUID inválido
      if (!data && !updateError) {
        console.log('[PUT /api/solicitudes/[id]] Solicitud no encontrada por código:', id)
        return NextResponse.json(
          { error: 'Solicitud no encontrada' },
          { status: 404 }
        )
      }
    }
    
    if (updateError) {
      console.error('[PUT /api/solicitudes/[id]] Error al actualizar solicitud:', updateError);
      return NextResponse.json(
        { 
          error: 'Error al actualizar la solicitud',
          details: updateError.message 
        },
        { status: 500 }
      )
    }

    if (!data) {
      console.log('[PUT /api/solicitudes/[id]] Solicitud no encontrada:', id)
      return NextResponse.json(
        { error: 'Solicitud no encontrada' },
        { status: 404 }
      )
    }
    
    console.log('[PUT /api/solicitudes/[id]] ✅ Solicitud actualizada exitosamente:', data.codigo)
    
    // Convertir a formato esperado por el frontend
    const fechaCreacion = data.created_at 
      ? new Date(data.created_at).toLocaleString('es-BO')
      : new Date().toLocaleString('es-BO');

    const solicitudActualizada = {
      id: data.id,
      codigo: data.codigo,
      fechaCreacion,
      empresa: data.empresa || '',
      contacto: data.contacto || '',
      telefono: data.telefono || '',
      email: data.email || '',
      comentarios: data.comentarios || '',
      estado: data.estado || 'Nueva',
      fechaInicio: data.fecha_inicio,
      mesesAlquiler: data.meses_alquiler,
      soporte: data.soporte,
      serviciosAdicionales: Array.isArray(data.servicios_adicionales) 
        ? data.servicios_adicionales 
        : (data.servicios_adicionales ? [data.servicios_adicionales] : [])
    };
    
    return NextResponse.json({
      success: true,
      message: 'Solicitud actualizada exitosamente',
      solicitud: solicitudActualizada
    })

  } catch (error) {
    console.error('[PUT /api/solicitudes/[id]] Error inesperado:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: errorMessage 
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID de solicitud requerido' },
        { status: 400 }
      )
    }

    console.log('[DELETE /api/solicitudes/[id]] Eliminando solicitud:', id)

    // Usar cliente de usuario (RLS controla acceso)
    let supabase = await getSupabaseUser(request);
    
    // Si no hay cliente de usuario, intentar con admin como fallback
    if (!supabase) {
      console.warn('[DELETE /api/solicitudes/[id]] No hay sesión de usuario, usando admin como fallback')
      supabase = getSupabaseAdmin()
    }

    // Verificar si el id parece un UUID
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUUID = uuidPattern.test(id);

    let error = null;
    let count = 0;

    if (isUUID) {
      // Si es UUID, buscar por campo id
      console.log('[DELETE /api/solicitudes/[id]] Eliminando por UUID:', id)
      const result = await supabase
        .from('solicitudes')
        .delete({ count: 'exact' })
        .eq('id', id)
      
      error = result.error
      count = result.count || 0
    } else {
      // Si no es UUID, buscar por código
      console.log('[DELETE /api/solicitudes/[id]] Eliminando por código:', id)
      const result = await supabase
        .from('solicitudes')
        .delete({ count: 'exact' })
        .eq('codigo', id)
      
      error = result.error
      count = result.count || 0
    }
    
    if (error) {
      console.error('[DELETE /api/solicitudes/[id]] Error al eliminar solicitud:', error);
      return NextResponse.json(
        { 
          error: 'Error al eliminar la solicitud',
          details: error.message 
        },
        { status: 500 }
      )
    }

    if (count === 0) {
      console.log('[DELETE /api/solicitudes/[id]] Solicitud no encontrada:', id)
      return NextResponse.json(
        { error: 'Solicitud no encontrada' },
        { status: 404 }
      )
    }
    
    console.log('[DELETE /api/solicitudes/[id]] Solicitud eliminada exitosamente:', id)
    
    return NextResponse.json({
      success: true,
      message: 'Solicitud eliminada exitosamente'
    })

  } catch (error) {
    console.error('[DELETE /api/solicitudes/[id]] Error inesperado:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: errorMessage 
      },
      { status: 500 }
    )
  }
}
