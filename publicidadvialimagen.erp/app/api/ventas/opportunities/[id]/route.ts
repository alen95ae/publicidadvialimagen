import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseUser } from '@/lib/supabaseServer'

export const runtime = 'nodejs'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getSupabaseUser(request)
    
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()

    const updates: any = {}

    if (body.titulo !== undefined) {
      if (body.titulo.trim() === '') {
        return NextResponse.json(
          { success: false, error: 'El título no puede estar vacío' },
          { status: 400 }
        )
      }
      updates.titulo = body.titulo.trim()
    }

    if (body.descripcion !== undefined) {
      updates.descripcion = body.descripcion?.trim() || null
    }

    if (body.valor_estimado !== undefined) {
      updates.valor_estimado = body.valor_estimado || null
    }

    if (body.moneda !== undefined) {
      updates.moneda = body.moneda || 'BOB'
    }

    if (body.probabilidad !== undefined) {
      updates.probabilidad = body.probabilidad || 0
    }

    if (body.ciudad !== undefined) {
      updates.ciudad = body.ciudad?.trim() || null
    }

    if (body.origen !== undefined) {
      updates.origen = body.origen?.trim() || null
    }

    if (body.interes !== undefined) {
      updates.interes = body.interes?.trim() || null
    }

    if (body.estado !== undefined) {
      updates.estado = body.estado
      
      // Si el estado es 'perdida', validar motivo_perdida
      if (body.estado === 'perdida' && (!body.motivo_perdida || body.motivo_perdida.trim() === '')) {
        return NextResponse.json(
          { success: false, error: 'El motivo de pérdida es requerido cuando el estado es "perdida"' },
          { status: 400 }
        )
      }
    }

    if (body.motivo_perdida !== undefined) {
      updates.motivo_perdida = body.motivo_perdida?.trim() || null
    }

    if (body.stage_id !== undefined) {
      updates.stage_id = body.stage_id
    }

    if (body.posicion_en_etapa !== undefined) {
      updates.posicion_en_etapa = body.posicion_en_etapa
    }

    if (body.lead_id !== undefined) {
      updates.lead_id = body.lead_id || null
    }

    if (body.contacto_id !== undefined) {
      updates.contacto_id = body.contacto_id || null
    }

    if (body.cotizacion_id !== undefined) {
      updates.cotizacion_id = body.cotizacion_id || null
    }

    if (body.fecha_cierre_estimada !== undefined) {
      updates.fecha_cierre_estimada = body.fecha_cierre_estimada || null
    }

    if (body.vendedor_id !== undefined) {
      // Validar que el vendedor existe y es vendedor
      if (body.vendedor_id) {
        const { data: usuarioVendedor, error: errorVendedor } = await supabase
          .from('usuarios')
          .select('id, vendedor')
          .eq('id', body.vendedor_id)
          .single()

        if (errorVendedor || !usuarioVendedor) {
          return NextResponse.json(
            { success: false, error: 'El vendedor especificado no existe' },
            { status: 400 }
          )
        }

        if (!usuarioVendedor.vendedor) {
          return NextResponse.json(
            { success: false, error: 'El usuario especificado no es un vendedor' },
            { status: 400 }
          )
        }
      }
      updates.vendedor_id = body.vendedor_id || null
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No hay campos para actualizar' },
        { status: 400 }
      )
    }

    const { data: opportunity, error } = await supabase
      .from('sales_opportunities')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        lead:leads(id, nombre, empresa),
        contacto:contactos(id, nombre, empresa),
        vendedor:usuarios!sales_opportunities_vendedor_id_fkey(id, nombre, imagen_usuario, email)
      `)
      .single()

    if (error) {
      console.error('Error actualizando opportunity:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: opportunity
    })
  } catch (error) {
    console.error('Error en PATCH /api/ventas/opportunities/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getSupabaseUser(request)
    
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { id } = await params

    const { error } = await supabase
      .from('sales_opportunities')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error eliminando opportunity:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Oportunidad eliminada correctamente'
    })
  } catch (error) {
    console.error('Error en DELETE /api/ventas/opportunities/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

