import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseUser } from '@/lib/supabaseServer'

export const runtime = 'nodejs'

export async function PATCH(
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
    const updates: { nombre?: string; descripcion?: string | null; is_default?: boolean; is_archived?: boolean } = {}

    if (body.nombre !== undefined) {
      if (body.nombre.trim() === '') {
        return NextResponse.json(
          { success: false, error: 'El nombre no puede estar vacío' },
          { status: 400 }
        )
      }
      updates.nombre = body.nombre.trim()
    }

    if (body.descripcion !== undefined) {
      updates.descripcion = body.descripcion?.trim() || null
    }

    if (body.is_default !== undefined) {
      updates.is_default = body.is_default
      // Si se marca como default, desmarcar los demás
      if (body.is_default) {
        await supabase
          .from('sales_pipelines')
          .update({ is_default: false })
          .neq('id', pipelineId)
      }
    }

    if (body.is_archived !== undefined) {
      updates.is_archived = body.is_archived
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No hay campos para actualizar' },
        { status: 400 }
      )
    }

    const { data: pipeline, error } = await supabase
      .from('sales_pipelines')
      .update(updates)
      .eq('id', pipelineId)
      .select()
      .single()

    if (error) {
      console.error('Error actualizando pipeline:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: pipeline
    })
  } catch (error) {
    console.error('Error en PATCH /api/ventas/pipelines/[pipelineId]:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // En lugar de eliminar, marcar como archivado
    const { data: pipeline, error } = await supabase
      .from('sales_pipelines')
      .update({ is_archived: true })
      .eq('id', pipelineId)
      .select()
      .single()

    if (error) {
      console.error('Error archivando pipeline:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: pipeline
    })
  } catch (error) {
    console.error('Error en DELETE /api/ventas/pipelines/[pipelineId]:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

