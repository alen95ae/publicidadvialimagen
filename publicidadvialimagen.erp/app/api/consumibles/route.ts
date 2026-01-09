import { NextRequest, NextResponse } from 'next/server'
import { getConsumiblesPage, createConsumible } from '@/lib/supabaseConsumibles'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    let limit = parseInt(searchParams.get('limit') || '50')
    const query = searchParams.get('q') || ''
    const categoria = searchParams.get('categoria') || ''

    // FIX: Permitir hasta 1000 consumibles por página
    const MAX_LIMIT = 1000
    if (limit > MAX_LIMIT) {
      limit = MAX_LIMIT
    }

    console.log('🔍 Consumibles search params:', { page, limit, query, categoria })

    // Obtener datos
    const result = await getConsumiblesPage(page, limit, query, categoria)

    console.log('📊 Consumibles pagination:', result.pagination)
    console.log('📊 Consumibles data length:', result.data.length)

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    })

  } catch (error) {
    console.error('❌ Error en API consumibles:', error)
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
    console.log('📥 Body recibido:', JSON.stringify(body, null, 2))
    console.log('[CONSUMIBLES] Categoria recibida:', body.categoria)

    const nuevoConsumible = await createConsumible(body)
    console.log('✅ Consumible creado:', nuevoConsumible)

    return NextResponse.json({
      success: true,
      data: nuevoConsumible
    })

  } catch (error) {
    console.error('❌ Error creando consumible:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error al crear consumible'
    const errorDetails = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : String(error)
    console.error('❌ Error details:', JSON.stringify(errorDetails, null, 2))
    return NextResponse.json(
      { success: false, error: errorMessage, details: errorDetails },
      { status: 500 }
    )
  }
}
