import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabaseServer'
import { requirePermiso } from '@/lib/permisos'

export const runtime = 'nodejs'

/**
 * GET /api/ventas/pipelines/[id]
 * Obtiene un pipeline específico
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

    const { id } = await params
    const supabase = getSupabaseServer()

    const { data, error } = await supabase
      .from('sales_pipelines')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Pipeline no encontrado' },
          { status: 404 }
        )
      }
      if (error.code === '42P01') {
        return NextResponse.json({
          success: true,
          data: null
        })
      }
      return NextResponse.json(
        { success: false, error: 'Error al obtener pipeline' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('❌ Error en GET /api/ventas/pipelines/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener pipeline' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/ventas/pipelines/[id]
 * Actualiza un pipeline
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

    const { id } = await params
    const body = await request.json()
    const { nombre, descripcion, is_default } = body

    const supabase = getSupabaseServer()

    // Si se marca como default, quitar el default de los demás
    if (is_default) {
      await supabase
        .from('sales_pipelines')
        .update({ is_default: false })
        .neq('id', id)
    }

    const { data, error } = await supabase
      .from('sales_pipelines')
      .update({
        nombre,
        descripcion: descripcion || null,
        is_default: is_default || false
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json(
          { success: false, error: 'La tabla de pipelines no existe en la base de datos' },
          { status: 500 }
        )
      }
      return NextResponse.json(
        { success: false, error: 'Error al actualizar pipeline' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('❌ Error en PUT /api/ventas/pipelines/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar pipeline' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/ventas/pipelines/[id]
 * Elimina un pipeline (marca como archivado)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permiso = await requirePermiso("ventas", "eliminar")
    if (permiso instanceof Response) {
      return permiso
    }

    const { id } = await params
    const supabase = getSupabaseServer()

    const { error } = await supabase
      .from('sales_pipelines')
      .update({ is_archived: true })
      .eq('id', id)

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json(
          { success: false, error: 'La tabla de pipelines no existe en la base de datos' },
          { status: 500 }
        )
      }
      return NextResponse.json(
        { success: false, error: 'Error al eliminar pipeline' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error('❌ Error en DELETE /api/ventas/pipelines/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar pipeline' },
      { status: 500 }
    )
  }
}
