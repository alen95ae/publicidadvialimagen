import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseUser } from '@/lib/supabaseServer'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseUser(request)
    
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { stage_id, opportunities } = body

    if (!stage_id) {
      return NextResponse.json(
        { success: false, error: 'stage_id es requerido' },
        { status: 400 }
      )
    }

    if (!Array.isArray(opportunities)) {
      return NextResponse.json(
        { success: false, error: 'opportunities debe ser un array' },
        { status: 400 }
      )
    }

    // Actualizar posiciones
    const updatePromises = opportunities.map((opp: { id: string; posicion_en_etapa: number }, index: number) =>
      supabase
        .from('sales_opportunities')
        .update({ 
          posicion_en_etapa: opp.posicion_en_etapa !== undefined ? opp.posicion_en_etapa : index + 1,
          stage_id: stage_id
        })
        .eq('id', opp.id)
    )

    const results = await Promise.all(updatePromises)
    
    const hasError = results.some(result => result.error)
    if (hasError) {
      console.error('Error reordenando opportunities:', results.find(r => r.error)?.error)
      return NextResponse.json(
        { success: false, error: 'Error al reordenar opportunities' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Opportunities reordenadas correctamente'
    })
  } catch (error) {
    console.error('Error en POST /api/ventas/opportunities/reorder:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

