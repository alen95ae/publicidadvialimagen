import { NextRequest, NextResponse } from 'next/server'
import { getConsumibleById, updateConsumible, deleteConsumible } from '@/lib/supabaseConsumibles'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('🔍 Obteniendo consumible por ID:', id)

    const consumible = await getConsumibleById(id)

    return NextResponse.json({
      success: true,
      data: consumible
    })

  } catch (error) {
    console.error('❌ Error obteniendo consumible:', error)
    return NextResponse.json(
      { success: false, error: 'Consumible no encontrado' },
      { status: 404 }
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
    console.log('📝 Actualizando consumible:', id, body)

    const consumibleActualizado = await updateConsumible(id, body)

    return NextResponse.json({
      success: true,
      data: consumibleActualizado
    })

  } catch (error: any) {
    console.error('❌ Error actualizando consumible:', error)
    
    let errorMessage = 'Error al actualizar consumible'
    let errorDetails: any = {}
    
    if (error) {
      if (error.code) {
        errorDetails.code = error.code
        errorMessage = `Error de Supabase: ${error.message || error.code}`
        
        if (error.details) {
          errorDetails.details = error.details
          errorMessage += ` - ${error.details}`
        }
        
        if (error.hint) {
          errorDetails.hint = error.hint
        }
      } else if (error.message) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      }
    }
    
    console.error('   - Error completo:', JSON.stringify(errorDetails, null, 2))
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: errorDetails,
        fullError: process.env.NODE_ENV === 'development' ? error : undefined
      },
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
    console.log('🗑️ Eliminando consumible:', id)

    await deleteConsumible(id)

    return NextResponse.json({
      success: true,
      message: 'Consumible eliminado correctamente'
    })

  } catch (error) {
    console.error('❌ Error eliminando consumible:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar consumible' },
      { status: 500 }
    )
  }
}
