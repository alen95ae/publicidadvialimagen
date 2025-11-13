import { NextRequest, NextResponse } from 'next/server'
import { 
  getCotizacionById, 
  updateCotizacion, 
  deleteCotizacion
} from '@/lib/airtableCotizaciones'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    console.log('🔍 Obteniendo cotización con ID:', id)

    // Obtener la cotización (ya incluye líneas en JSON)
    const cotizacion = await getCotizacionById(id)
    console.log('✅ Cotización encontrada:', cotizacion.codigo)

    // Las líneas ya vienen en cotizacion.lineas_json
    const lineas = cotizacion.lineas_json || []

    return NextResponse.json({
      success: true,
      data: {
        cotizacion,
        lineas
      }
    })

  } catch (error) {
    console.error('❌ Error obteniendo cotización:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error al obtener cotización'
    
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
    console.log('📝 Actualizando cotización:', id)

    // Extraer líneas del body si vienen
    const lineas = body.lineas
    delete body.lineas

    // Calcular totales si vienen líneas
    if (lineas && lineas.length > 0) {
      let subtotal = 0
      let totalIVA = 0
      let totalIT = 0

      lineas.forEach((linea: any) => {
        // Solo productos tienen subtotal
        if (linea.tipo === 'Producto' || linea.tipo === 'producto') {
          const lineaSubtotal = linea.subtotal_linea || 0
          subtotal += lineaSubtotal

          if (linea.con_iva) {
            totalIVA += lineaSubtotal * 0.13
          }
          if (linea.con_it) {
            totalIT += lineaSubtotal * 0.03
          }
        }
      })

      body.subtotal = subtotal
      body.total_iva = totalIVA
      body.total_it = totalIT
      body.total_final = subtotal + totalIVA + totalIT
      body.lineas_json = lineas // Guardar líneas como JSON
    }

    // Actualizar la cotización (todo en una sola operación)
    const cotizacionActualizada = await updateCotizacion(id, body)

    console.log('✅ Cotización actualizada:', cotizacionActualizada.codigo)

    return NextResponse.json({
      success: true,
      data: cotizacionActualizada
    })

  } catch (error) {
    console.error('❌ Error actualizando cotización:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error al actualizar cotización'
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
    console.log('🗑️ Eliminando cotización:', id)

    // Eliminar la cotización (las líneas están en JSON, se eliminan automáticamente)
    await deleteCotizacion(id)

    console.log('✅ Cotización eliminada correctamente')

    return NextResponse.json({
      success: true,
      message: 'Cotización eliminada correctamente'
    })

  } catch (error) {
    console.error('❌ Error eliminando cotización:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar cotización' },
      { status: 500 }
    )
  }
}

