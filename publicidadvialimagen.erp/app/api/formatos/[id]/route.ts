import { NextRequest, NextResponse } from 'next/server'
import { getFormatoById, updateFormato, deleteFormato } from '@/lib/supabaseFormatos'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const formato = await getFormatoById(id)

    if (!formato) {
      return NextResponse.json(
        { success: false, error: 'Formato no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: formato
    })

  } catch (error) {
    console.error('❌ Error obteniendo formato:', error)
    return NextResponse.json(
      { success: false, error: 'Error obteniendo formato' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const formatoActualizado = await updateFormato(id, body)

    return NextResponse.json({
      success: true,
      data: formatoActualizado
    })

  } catch (error) {
    console.error('❌ Error actualizando formato:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error al actualizar formato'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await deleteFormato(id)

    return NextResponse.json({
      success: true,
      message: 'Formato eliminado correctamente'
    })

  } catch (error) {
    console.error('❌ Error eliminando formato:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error al eliminar formato'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
