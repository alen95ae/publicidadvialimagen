import { NextRequest, NextResponse } from 'next/server'
import { getAlquileres, createAlquiler } from '@/lib/supabaseAlquileres'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const estado = searchParams.get('estado') || undefined
    const cliente = searchParams.get('cliente') || undefined
    const soporte_id = searchParams.get('soporte_id') || undefined
    const fecha_inicio = searchParams.get('fecha_inicio') || undefined
    const fecha_fin = searchParams.get('fecha_fin') || undefined
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined

    console.log('🔍 Obteniendo alquileres con filtros:', {
      estado,
      cliente,
      soporte_id,
      fecha_inicio,
      fecha_fin,
      page,
      limit
    })

    const result = await getAlquileres({
      estado,
      cliente,
      soporte_id,
      fecha_inicio,
      fecha_fin,
      page,
      limit
    })

    return NextResponse.json({
      success: true,
      data: result.data,
      count: result.count
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

