import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseUser } from '@/lib/supabaseServer'

export const runtime = 'nodejs'

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
    const { stages } = body

    if (!Array.isArray(stages)) {
      return NextResponse.json(
        { success: false, error: 'stages debe ser un array' },
        { status: 400 }
      )
    }

    // Actualizar posiciones en una transacción
    const updates = stages.map((stage: { id: string; posicion: number }) => ({
      id: stage.id,
      posicion: stage.posicion
    }))

    // Ejecutar todas las actualizaciones
    const updatePromises = updates.map((update: { id: string; posicion: number }) =>
      supabase
        .from('sales_pipeline_stages')
        .update({ posicion: update.posicion })
        .eq('id', update.id)
        .eq('pipeline_id', pipelineId)
    )

    const results = await Promise.all(updatePromises)
    
    const hasError = results.some(result => result.error)
    if (hasError) {
      console.error('Error reordenando stages:', results.find(r => r.error)?.error)
      return NextResponse.json(
        { success: false, error: 'Error al reordenar stages' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Stages reordenados correctamente'
    })
  } catch (error) {
    console.error('Error en POST /api/ventas/pipelines/[pipelineId]/stages/reorder:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

