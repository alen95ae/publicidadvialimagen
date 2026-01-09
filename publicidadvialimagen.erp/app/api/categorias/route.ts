import { NextRequest, NextResponse } from 'next/server'
import { getCategoriaConfig, updateCategorias } from '@/lib/supabaseCategorias'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const modulo = searchParams.get('modulo')
    const seccion = searchParams.get('seccion')

    if (!modulo || !seccion) {
      return NextResponse.json(
        { success: false, error: 'modulo y seccion son requeridos' },
        { status: 400 }
      )
    }

    const config = await getCategoriaConfig(modulo, seccion)

    return NextResponse.json({
      success: true,
      data: config
    })
  } catch (error) {
    console.error('❌ Error en API categorías GET:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { modulo, seccion, categorias } = body

    if (!modulo || !seccion) {
      return NextResponse.json(
        { success: false, error: 'modulo y seccion son requeridos' },
        { status: 400 }
      )
    }

    if (!Array.isArray(categorias)) {
      return NextResponse.json(
        { success: false, error: 'categorias debe ser un array' },
        { status: 400 }
      )
    }

    const updated = await updateCategorias(modulo, seccion, categorias)

    return NextResponse.json({
      success: true,
      data: updated
    })
  } catch (error) {
    console.error('❌ Error en API categorías PUT:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
