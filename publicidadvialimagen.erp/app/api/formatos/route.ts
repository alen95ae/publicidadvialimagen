import { NextRequest, NextResponse } from 'next/server'
import { getAllFormatos, createFormato } from '@/lib/supabaseFormatos'

export async function GET(request: NextRequest) {
  try {
    const formatos = await getAllFormatos()

    return NextResponse.json({
      success: true,
      data: formatos
    })

  } catch (error) {
    console.error('❌ Error en API formatos:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📥 Body recibido para crear formato:', body)

    const nuevoFormato = await createFormato(body)

    return NextResponse.json({
      success: true,
      data: nuevoFormato
    })

  } catch (error) {
    console.error('❌ Error creando formato:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error al crear formato'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
