import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabaseServer'
import { requirePermiso } from '@/lib/permisos'

export const runtime = 'nodejs'

/**
 * GET /api/ventas/pipelines/[id]/stages
 * Obtiene todas las etapas de un pipeline
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permiso = await requirePermiso("ventas", "ver")
    if (permiso instanceof Response) {
      return permiso
    }

    const { id: pipelineId } = await params
    const supabase = getSupabaseServer()

    const { data, error } = await supabase
      .from('sales_pipeline_stages')
      .select('*')
      .eq('pipeline_id', pipelineId)
      .eq('is_archived', false)
      .order('posicion', { ascending: true })

    if (error) {
      console.error('❌ Error obteniendo stages:', error)
      if (error.code === '42P01') {
        return NextResponse.json({
          success: true,
          data: []
        })
      }
      return NextResponse.json(
        { success: false, error: 'Error al obtener etapas' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('❌ Error en GET /api/ventas/pipelines/[id]/stages:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener etapas' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/ventas/pipelines/[id]/stages
 * Crea una nueva etapa
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permiso = await requirePermiso("ventas", "crear")
    if (permiso instanceof Response) {
      return permiso
    }

    const { id: pipelineId } = await params
    const body = await request.json()
    const { nombre, posicion } = body

    if (!nombre) {
      return NextResponse.json(
        { success: false, error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseServer()

    // Obtener la última posición si no se especifica
    let finalPosicion = posicion
    if (!finalPosicion) {
      const { data: lastStage } = await supabase
        .from('sales_pipeline_stages')
        .select('posicion')
        .eq('pipeline_id', pipelineId)
        .order('posicion', { ascending: false })
        .limit(1)
        .single()

      finalPosicion = lastStage ? (lastStage.posicion + 1) : 0
    }

    const { data, error } = await supabase
      .from('sales_pipeline_stages')
      .insert({
        pipeline_id: pipelineId,
        nombre,
        posicion: finalPosicion,
        is_archived: false
      })
      .select()
      .single()

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json(
          { success: false, error: 'La tabla de stages no existe en la base de datos' },
          { status: 500 }
        )
      }
      return NextResponse.json(
        { success: false, error: 'Error al crear etapa' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('❌ Error en POST /api/ventas/pipelines/[id]/stages:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear etapa' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/ventas/pipelines/[id]/stages
 * Actualiza múltiples etapas (para reordenar)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permiso = await requirePermiso("ventas", "editar")
    if (permiso instanceof Response) {
      return permiso
    }

    const { id: pipelineId } = await params
    const body = await request.json()
    const { stages } = body // Array de { id, nombre, posicion }

    if (!Array.isArray(stages)) {
      return NextResponse.json(
        { success: false, error: 'Se requiere un array de stages' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseServer()

    // Actualizar cada stage
    const updates = stages.map((stage: any) =>
      supabase
        .from('sales_pipeline_stages')
        .update({
          nombre: stage.nombre,
          posicion: stage.posicion
        })
        .eq('id', stage.id)
        .eq('pipeline_id', pipelineId)
    )

    await Promise.all(updates)

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error('❌ Error en PUT /api/ventas/pipelines/[id]/stages:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar etapas' },
      { status: 500 }
    )
  }
}
