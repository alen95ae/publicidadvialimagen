import { NextRequest, NextResponse } from 'next/server'
import { getAlquileres, createAlquiler } from '@/lib/supabaseAlquileres'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const pageSize = parseInt(searchParams.get('pageSize') || '100')
    const page = parseInt(searchParams.get('page') || '1')
    const estado = searchParams.get('estado') || undefined
    const cliente = searchParams.get('cliente') || undefined
    const vendedor = searchParams.get('vendedor') || undefined
    const search = searchParams.get('search') || undefined
    const soporte_id = searchParams.get('soporte_id') || undefined
    const fecha_inicio = searchParams.get('fecha_inicio') || undefined
    const fecha_fin = searchParams.get('fecha_fin') || undefined

    console.log('🔍 Alquileres search params:', { pageSize, page, estado, cliente, vendedor, search, soporte_id, fecha_inicio, fecha_fin })

    const result = await getAlquileres({
      estado,
      cliente,
      vendedor,
      search,
      soporte_id,
      fecha_inicio,
      fecha_fin,
      page,
      limit: pageSize
    })

    console.log('📊 Alquileres data length:', result.data.length)
    console.log('📊 Alquileres count:', result.count)

    const total = result.count || 0
    const totalPages = Math.ceil(total / pageSize)

    const pagination = {
      page,
      limit: pageSize,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination
    })

  } catch (error) {
    console.error('❌ Error obteniendo alquileres:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error al obtener alquileres'
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📝 Creando alquiler:', body)

    const alquiler = await createAlquiler(body)

    console.log('✅ Alquiler creado exitosamente:', alquiler.codigo)

    return NextResponse.json({
      success: true,
      data: alquiler
    })

  } catch (error) {
    console.error('❌ Error creando alquiler:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error al crear alquiler'
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

