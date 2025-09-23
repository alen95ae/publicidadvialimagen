import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = supabaseServer
    const { data, error } = await supabase
      .from('inventario')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching inventario item:', error)
      return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in inventario GET by ID:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = supabaseServer
    const body = await request.json()

    const { data, error } = await supabase
      .from('inventario')
      .update(body)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating inventario item:', error)
      return NextResponse.json({ error: 'Error al actualizar item' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in inventario PUT:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = supabaseServer

    const { data, error } = await supabase
      .from('inventario')
      .delete()
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error deleting inventario item:', error)
      return NextResponse.json({ error: 'Error al eliminar item' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Item eliminado correctamente',
      deleted: data 
    })
  } catch (error) {
    console.error('Error in inventario DELETE:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
