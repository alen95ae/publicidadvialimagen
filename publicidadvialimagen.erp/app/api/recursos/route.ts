import { NextRequest, NextResponse } from 'next/server'
import { getRecursosPage, createRecurso } from '@/lib/airtableRecursos'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const query = searchParams.get('q') || ''
    const categoria = searchParams.get('categoria') || ''

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
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📝 Creando nuevo recurso:', JSON.stringify(body, null, 2))

    const nuevoRecurso = await createRecurso(body)
    
    console.log('✅ Recurso creado correctamente:', nuevoRecurso.id)

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
