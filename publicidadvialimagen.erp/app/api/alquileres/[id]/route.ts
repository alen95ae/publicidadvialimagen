import { NextRequest, NextResponse } from 'next/server'
import { 
  getAlquilerById, 
  updateAlquiler, 
  deleteAlquiler
} from '@/lib/supabaseAlquileres'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    console.log('🔍 Obteniendo alquiler con ID:', id)

    const alquiler = await getAlquilerById(id)

    if (!alquiler) {
      return NextResponse.json(
        { success: false, error: 'Alquiler no encontrado' },
        { status: 404 }
      )
    }

    console.log('✅ Alquiler encontrado:', alquiler.codigo)

    return NextResponse.json({
      success: true,
      data: alquiler
    })

  } catch (error) {
    console.error('❌ Error obteniendo alquiler:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error al obtener alquiler'
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const body = await request.json()
    console.log('📝 Actualizando alquiler:', id)

    const alquilerActualizado = await updateAlquiler(id, body)

    console.log('✅ Alquiler actualizado:', alquilerActualizado.codigo)

    return NextResponse.json({
      success: true,
      data: alquilerActualizado
    })

  } catch (error) {
    console.error('❌ Error actualizando alquiler:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error al actualizar alquiler'
    
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
    const id = params.id
    console.log('🗑️ Eliminando alquiler:', id)

    await deleteAlquiler(id)

    console.log('✅ Alquiler eliminado correctamente')

    return NextResponse.json({
      success: true,
      message: 'Alquiler eliminado correctamente'
    })

  } catch (error) {
    console.error('❌ Error eliminando alquiler:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar alquiler' },
      { status: 500 }
    )
  }
}

