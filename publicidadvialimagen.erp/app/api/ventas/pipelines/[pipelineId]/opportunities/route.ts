import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseUser } from '@/lib/supabaseServer'

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pipelineId: string }> }
) {
  try {
    const supabase = await getSupabaseUser(request)
    
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { pipelineId } = await params
    const { searchParams } = new URL(request.url)
    
    const q = searchParams.get('q') || ''
    const origen = searchParams.get('origen') || ''
    const interes = searchParams.get('interes') || ''
    const ciudad = searchParams.get('ciudad') || ''
    const estado = searchParams.get('estado') || ''

    let query = supabase
      .from('sales_opportunities')
      .select(`
        *,
        lead:leads(id, nombre, empresa, email),
        contacto:contactos(id, nombre, empresa, email),
        vendedor:usuarios!sales_opportunities_vendedor_id_fkey(id, nombre, imagen_usuario, email)
      `)
      .eq('pipeline_id', pipelineId)
      .order('posicion_en_etapa', { ascending: true })

    // Aplicar filtros
    if (q) {
      query = query.or(`titulo.ilike.%${q}%,descripcion.ilike.%${q}%`)
    }

    if (origen) {
      query = query.eq('origen', origen)
    }

    if (interes) {
      query = query.eq('interes', interes)
    }

    if (ciudad) {
      query = query.eq('ciudad', ciudad)
    }

    if (estado) {
      query = query.eq('estado', estado)
    }

    const { data: opportunities, error } = await query

    if (error) {
      console.error('Error obteniendo opportunities:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: opportunities || []
    })
  } catch (error) {
    console.error('Error en GET /api/ventas/pipelines/[pipelineId]/opportunities:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

