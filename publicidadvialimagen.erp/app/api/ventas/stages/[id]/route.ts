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
    const updates: { nombre?: string; is_archived?: boolean } = {}

    if (body.nombre !== undefined) {
      if (body.nombre.trim() === '') {
        return NextResponse.json(
          { success: false, error: 'El nombre no puede estar vacío' },
          { status: 400 }
        )
      }
      updates.nombre = body.nombre.trim()
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

    const { data: stage, error } = await supabase
      .from('sales_pipeline_stages')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error actualizando stage:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: stage
    })
  } catch (error) {
    console.error('Error en PATCH /api/ventas/stages/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

