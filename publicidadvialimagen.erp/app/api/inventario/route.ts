import { NextRequest, NextResponse } from 'next/server'
import { getProductosPage, createProducto } from '@/lib/supabaseProductos'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const query = searchParams.get('q') || ''
    const categoria = searchParams.get('categoria') || ''

    console.log('🔍 Productos search params:', { page, limit, query, categoria })

    // Obtener datos de Supabase
    const result = await getProductosPage(page, limit, query, categoria)

    console.log('📊 Productos pagination:', result.pagination)
    console.log('📊 Productos data length:', result.data.length)

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    })

  } catch (error) {
    console.error('❌ Error en API inventario:', error)
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
    console.log('📝 Creando nuevo producto:', JSON.stringify(body, null, 2))

    const nuevoProducto = await createProducto(body)
    
    console.log('✅ Producto creado correctamente:', nuevoProducto.id)

    return NextResponse.json({
      success: true,
      data: nuevoProducto
    })

  } catch (error) {
    console.error('❌ Error creando producto:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error al crear producto'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
