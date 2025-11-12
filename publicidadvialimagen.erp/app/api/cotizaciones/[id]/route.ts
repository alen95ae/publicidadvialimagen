import { NextRequest, NextResponse } from 'next/server'
import { 
  getCotizacionById, 
  updateCotizacion, 
  deleteCotizacion,
  getLineasByCotizacionId,
  createMultipleLineasCotizacion,
  deleteLineaCotizacion
} from '@/lib/airtableCotizaciones'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    console.log('🔍 Obteniendo cotización con ID:', id)

    // Obtener la cotización
    console.log('📋 Buscando cotización en Airtable...')
    const cotizacion = await getCotizacionById(id)
    console.log('✅ Cotización encontrada:', cotizacion)

    // Obtener las líneas de la cotización
    console.log('📝 Buscando líneas de cotización...')
    const lineas = await getLineasByCotizacionId(id)
    console.log('✅ Líneas obtenidas:', lineas.length)

    return NextResponse.json({
      success: true,
      data: {
        cotizacion,
        lineas
      }
    })

  } catch (error) {
    console.error('❌ Error completo obteniendo cotización:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al obtener cotización'
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack')
    
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

    // NO actualizar fecha_actualizacion - es un campo computado en Airtable
    // Se actualiza automáticamente

    // Si vienen líneas, eliminar las antiguas y crear las nuevas
    if (lineas && lineas.length > 0) {
      let subtotal = 0
      let totalIVA = 0
      let totalIT = 0

      lineas.forEach((linea: any) => {
        const lineaSubtotal = linea.subtotal_linea || 0
        subtotal += lineaSubtotal

        if (linea.con_iva) {
          totalIVA += lineaSubtotal * 0.13
        }
        if (linea.con_it) {
          totalIT += lineaSubtotal * 0.03
        }
      })

      body.subtotal = subtotal
      body.total_iva = totalIVA
      body.total_it = totalIT
      body.total_final = subtotal + totalIVA + totalIT

      // Eliminar líneas antiguas
      console.log('🗑️ Eliminando líneas antiguas...')
      const lineasAntiguas = await getLineasByCotizacionId(id)
      for (const linea of lineasAntiguas) {
        await deleteLineaCotizacion(linea.id)
      }

      // Crear nuevas líneas
      console.log(`📝 Creando ${lineas.length} nuevas líneas...`)
      await createMultipleLineasCotizacion(lineas, id)
    }

    // Actualizar la cotización
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

    // Obtener las líneas antes de eliminar para eliminarlas también
    const lineas = await getLineasByCotizacionId(id)

    // Eliminar todas las líneas primero
    console.log(`🗑️ Eliminando ${lineas.length} líneas...`)
    for (const linea of lineas) {
      await deleteLineaCotizacion(linea.id)
    }

    // Eliminar la cotización
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

