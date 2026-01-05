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

    const { data: stages, error } = await supabase
      .from('sales_pipeline_stages')
      .select('*')
      .eq('pipeline_id', pipelineId)
      .eq('is_archived', false)
      .order('posicion', { ascending: true })

    if (error) {
      console.error('Error obteniendo stages:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: stages || []
    })
  } catch (error) {
    console.error('Error en GET /api/ventas/pipelines/[pipelineId]/stages:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(
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
    const body = await request.json()
    const { nombre } = body

    if (!nombre || nombre.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    // Obtener la máxima posición actual
    const { data: maxStage, error: maxError } = await supabase
      .from('sales_pipeline_stages')
      .select('posicion')
      .eq('pipeline_id', pipelineId)
      .order('posicion', { ascending: false })
      .limit(1)
      .single()

    const nuevaPosicion = maxStage?.posicion ? maxStage.posicion + 1 : 1

    const { data: stage, error } = await supabase
      .from('sales_pipeline_stages')
      .insert({
        pipeline_id: pipelineId,
        nombre: nombre.trim(),
        posicion: nuevaPosicion,
        is_archived: false
      })
      .select()
      .single()

    if (error) {
      console.error('Error creando stage:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: stage
    }, { status: 201 })
  } catch (error) {
    console.error('Error en POST /api/ventas/pipelines/[pipelineId]/stages:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

