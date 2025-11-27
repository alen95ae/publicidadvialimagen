import { NextRequest, NextResponse } from 'next/server'
import {
  findSolicitudByCodigoOrId,
  updateSolicitud
} from '@/lib/supabaseSolicitudes'

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

    // Buscar la solicitud en Supabase
    const solicitud = await findSolicitudByCodigoOrId(id)
    
    if (!solicitud) {
      return NextResponse.json(
        { error: 'Solicitud no encontrada' },
        { status: 404 }
      )
    }

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
    const { id } = await params
    const body = await request.json()
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID de solicitud requerido' },
        { status: 400 }
      )
    }

    // Actualizar la solicitud en Supabase
    console.log('Actualizando solicitud:', id, body)
    
    const solicitudActualizada = await updateSolicitud(id, {
      estado: body.estado
    })
    
    if (!solicitudActualizada) {
      return NextResponse.json(
        { error: 'Solicitud no encontrada o error al actualizar' },
        { status: 404 }
      )
    }
    
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
    
    const { deleteSolicitud } = await import('@/lib/supabaseSolicitudes')
    const eliminada = await deleteSolicitud(id)
    
    if (!eliminada) {
      return NextResponse.json(
        { error: 'Error al eliminar la solicitud' },
        { status: 500 }
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
