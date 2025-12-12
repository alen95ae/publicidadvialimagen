import { NextRequest, NextResponse } from 'next/server'
import {
  findSolicitudByCodigoOrId,
  updateSolicitud
} from '@/lib/supabaseSolicitudes'
import { getSupabaseUser } from '@/lib/supabaseServer'

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
    // Usar cliente de usuario (RLS controla acceso)
    const supabase = await getSupabaseUser(request);
    
    if (!supabase) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID de solicitud requerido' },
        { status: 400 }
      )
    }

    // Buscar la solicitud en Supabase usando cliente de usuario
    const { data, error } = await supabase
      .from('solicitudes')
      .select('*')
      .or(`id.eq.${id},codigo.eq.${id}`)
      .limit(1)
      .maybeSingle();
    
    if (error) {
      console.error('Error al obtener solicitud:', error);
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Solicitud no encontrada' },
        { status: 404 }
      )
    }

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
    console.error('Error al obtener solicitud:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Usar cliente de usuario (RLS controla acceso)
    const supabase = await getSupabaseUser(request);
    
    if (!supabase) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params
    const body = await request.json()
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID de solicitud requerido' },
        { status: 400 }
      )
    }

    // Actualizar la solicitud en Supabase usando cliente de usuario
    // RLS controlará que solo pueda actualizar sus propias solicitudes
    console.log('Actualizando solicitud:', id, body)
    
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (body.estado) {
      updateData.estado = body.estado;
    }

    const { data, error: updateError } = await supabase
      .from('solicitudes')
      .update(updateData)
      .or(`id.eq.${id},codigo.eq.${id}`)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error al actualizar solicitud:', updateError);
      return NextResponse.json(
        { error: 'Solicitud no encontrada o error al actualizar' },
        { status: 404 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Solicitud no encontrada' },
        { status: 404 }
      )
    }
    
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
    
    console.log('✅ Solicitud actualizada exitosamente en Supabase:', solicitudActualizada.codigo)
    
    return NextResponse.json({
      success: true,
      message: 'Solicitud actualizada exitosamente',
      solicitud: solicitudActualizada
    })

  } catch (error) {
    console.error('Error al actualizar solicitud:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Usar cliente de usuario (RLS controla acceso)
    const supabase = await getSupabaseUser(request);
    
    if (!supabase) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params
    console.log('DELETE method called for solicitud:', id)
    
    if (!id) {
      console.log('No ID provided')
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
      return NextResponse.json(
        { error: 'Solicitud no encontrada' },
        { status: 404 }
      )
    }
    
    console.log('✅ Solicitud eliminada exitosamente:', id)
    
    return NextResponse.json({
      success: true,
      message: 'Solicitud eliminada exitosamente'
    })

  } catch (error) {
    console.error('Error al eliminar solicitud:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
