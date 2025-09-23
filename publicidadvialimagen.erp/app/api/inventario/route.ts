import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const categoria = searchParams.get('categoria') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const offset = (page - 1) * limit

    console.log('Fetching inventario with params:', { q, categoria, page, limit, offset })

    // Primero obtener el total de registros para la paginación
    let countQuery = supabaseServer
      .from('inventario')
      .select('*', { count: 'exact', head: true })

    // Aplicar filtros de búsqueda al count
    if (q) {
      countQuery = countQuery.or(`codigo.ilike.%${q}%,nombre.ilike.%${q}%,categoria.ilike.%${q}%`)
    }

    if (categoria) {
      countQuery = countQuery.eq('categoria', categoria)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Supabase error counting inventario:', countError)
      return NextResponse.json({ 
        error: 'Error al contar inventario', 
        details: countError.message 
      }, { status: 500 })
    }

    // Ahora obtener los datos paginados
    let dataQuery = supabaseServer
      .from('inventario')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Aplicar filtros de búsqueda a los datos
    if (q) {
      dataQuery = dataQuery.or(`codigo.ilike.%${q}%,nombre.ilike.%${q}%,categoria.ilike.%${q}%`)
    }

    if (categoria) {
      dataQuery = dataQuery.eq('categoria', categoria)
    }

    const { data, error } = await dataQuery

    if (error) {
      console.error('Supabase error fetching inventario:', error)
      return NextResponse.json({ 
        error: 'Error al obtener inventario', 
        details: error.message 
      }, { status: 500 })
    }

    const totalPages = Math.ceil((count || 0) / limit)

    console.log('Successfully fetched inventario items:', data?.length || 0, 'of', count, 'total')

    return NextResponse.json({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })
  } catch (error) {
    console.error('Error in inventario GET:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { data, error } = await supabaseServer
      .from('inventario')
      .insert([body])
      .select()
      .single()

    if (error) {
      console.error('Error creating inventario item:', error)
      return NextResponse.json({ error: 'Error al crear item de inventario' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error in inventario POST:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
