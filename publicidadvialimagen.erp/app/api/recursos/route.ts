import { NextRequest, NextResponse } from 'next/server'
import { getRecursosPage, createRecurso } from '@/lib/supabaseRecursos'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    let limit = parseInt(searchParams.get('limit') || '50')
    const query = searchParams.get('q') || ''
    const categoria = searchParams.get('categoria') || ''

    // FIX: Permitir hasta 1000 recursos por página (suficiente para fetchAllRecursos)
    // pero evitar requests excesivamente grandes
    const MAX_LIMIT = 1000
    if (limit > MAX_LIMIT) {
      limit = MAX_LIMIT
    }

    console.log('🔍 Recursos search params:', { page, limit, query, categoria })

    // Obtener datos de Airtable
    const result = await getRecursosPage(page, limit, query, categoria)

    console.log('📊 Recursos pagination:', result.pagination)
    console.log('📊 Recursos data length:', result.data.length)

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    })

  } catch (error) {
    console.error('❌ Error en API recursos:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    const errorDetails = error instanceof Error ? error.stack : String(error)
    console.error('❌ Error details:', errorDetails)
    return NextResponse.json(
      { success: false, error: errorMessage, details: errorDetails },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const nuevoRecurso = await createRecurso(body)
    

    return NextResponse.json({
      success: true,
      data: nuevoRecurso
    })

  } catch (error) {
    console.error('❌ Error creando recurso:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error al crear recurso'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
