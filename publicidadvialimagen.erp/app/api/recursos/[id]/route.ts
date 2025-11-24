import { NextRequest, NextResponse } from 'next/server'
import { getRecursoById, updateRecurso, deleteRecurso } from '@/lib/supabaseRecursos'

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

  } catch (error: any) {
    console.error('❌ Error actualizando recurso:', error)
    
    // Manejar errores de Supabase específicamente
    let errorMessage = 'Error al actualizar recurso'
    let errorDetails: any = {}
    
    if (error) {
      // Error de Supabase tiene propiedades: code, message, details, hint
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
