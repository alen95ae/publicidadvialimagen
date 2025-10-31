import { NextRequest, NextResponse } from 'next/server'
import { getRecursoById, updateRecurso, deleteRecurso } from '@/lib/airtableRecursos'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    console.log('🔍 Obteniendo recurso por ID:', id)

    const recurso = await getRecursoById(id)

    return NextResponse.json({
      success: true,
      data: recurso
    })

  } catch (error) {
    console.error('❌ Error obteniendo recurso:', error)
    return NextResponse.json(
      { success: false, error: 'Recurso no encontrado' },
      { status: 404 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    console.log('📝 Actualizando recurso:', id, body)

    const recursoActualizado = await updateRecurso(id, body)

    return NextResponse.json({
      success: true,
      data: recursoActualizado
    })

  } catch (error) {
    console.error('❌ Error actualizando recurso:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error al actualizar recurso'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    console.log('🗑️ Eliminando recurso:', id)

    await deleteRecurso(id)

    return NextResponse.json({
      success: true,
      message: 'Recurso eliminado correctamente'
    })

  } catch (error) {
    console.error('❌ Error eliminando recurso:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar recurso' },
      { status: 500 }
    )
  }
}
