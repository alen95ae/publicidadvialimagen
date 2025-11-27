import { NextRequest, NextResponse } from 'next/server'
import { 
  getCotizacionById, 
  updateCotizacion, 
  deleteCotizacion
} from '@/lib/supabaseCotizaciones'
import { getLineasByCotizacionId } from '@/lib/supabaseCotizacionLineas'
import { cancelarAlquileresCotizacion } from '@/lib/helpersAlquileres'
import { getAlquileresPorCotizacion } from '@/lib/supabaseAlquileres'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    console.log('🔍 Obteniendo cotización con ID:', id)

    // Obtener la cotización
    const cotizacion = await getCotizacionById(id)
    console.log('✅ Cotización encontrada:', cotizacion.codigo)

    // Obtener las líneas asociadas
    const lineas = await getLineasByCotizacionId(id)
    console.log('✅ Líneas encontradas:', lineas.length)

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

    // Obtener el estado actual de la cotización antes de actualizarla
    const cotizacionActual = await getCotizacionById(id)
    const estadoAnterior = cotizacionActual.estado
    
    // Extraer líneas del body si vienen
    const lineas = body.lineas
    delete body.lineas

    // Limpiar campos que no existen en Supabase
    const { vigencia_dias, notas_generales, terminos_condiciones, ...camposLimpios } = body

    // Calcular totales si vienen líneas
    if (lineas && Array.isArray(lineas)) {
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

      camposLimpios.subtotal = subtotal
      camposLimpios.total_iva = totalIVA
      camposLimpios.total_it = totalIT
      camposLimpios.total_final = subtotal + totalIVA + totalIT
      camposLimpios.cantidad_items = lineas.length
      camposLimpios.lineas_cotizacion = lineas.length
    }

    // Mapear vigencia_dias a vigencia si viene
    if (vigencia_dias !== undefined) {
      camposLimpios.vigencia = vigencia_dias
    }

    // Detectar si se está rechazando una cotización aprobada
    const nuevoEstado = camposLimpios.estado || estadoAnterior
    const seEstaCambiandoARechazada = estadoAnterior === 'Aprobada' && nuevoEstado === 'Rechazada'
    
    // Si se está rechazando una cotización aprobada, cancelar alquileres
    if (seEstaCambiandoARechazada) {
      console.log(`⚠️ Rechazando cotización aprobada ${id}, cancelando alquileres...`)
      try {
        await cancelarAlquileresCotizacion(id)
        console.log(`✅ Alquileres cancelados para cotización ${id}`)
      } catch (errorAlquileres) {
        console.error(`❌ Error cancelando alquileres:`, errorAlquileres)
        // No fallar la actualización si falla la cancelación de alquileres
      }
    }

    // Actualizar la cotización (encabezado) - Solo campos que existen en Supabase
    const cotizacionActualizada = await updateCotizacion(id, camposLimpios)

    console.log('✅ Cotización actualizada:', cotizacionActualizada.codigo)

    // Si vienen líneas, actualizarlas también
    if (lineas && Array.isArray(lineas)) {
      const { deleteLineasByCotizacionId, createMultipleLineas } = await import('@/lib/supabaseCotizacionLineas')
      
      // Eliminar líneas existentes
      await deleteLineasByCotizacionId(id)
      
      // Crear nuevas líneas
      const lineasData = lineas.map((linea: any, index: number) => {
        // Manejar variantes: convertir string a objeto si es necesario
        let variantesParsed = null
        if (linea.variantes) {
          try {
            if (typeof linea.variantes === 'string') {
              variantesParsed = JSON.parse(linea.variantes)
            } else if (typeof linea.variantes === 'object') {
              variantesParsed = linea.variantes
            }
          } catch (parseError) {
            console.warn('⚠️ [PATCH /api/cotizaciones/[id]] Error parseando variantes:', parseError)
            variantesParsed = null
          }
        }

        return {
          cotizacion_id: id,
          tipo: linea.tipo || 'Producto',
          codigo_producto: linea.codigo_producto || null,
          nombre_producto: linea.nombre_producto || null,
          descripcion: linea.descripcion || null,
          cantidad: linea.cantidad || 0,
          ancho: linea.ancho || null,
          alto: linea.alto || null,
          total_m2: linea.total_m2 || null,
          unidad_medida: linea.unidad_medida || 'm²',
          precio_unitario: linea.precio_unitario || 0,
          comision: linea.comision_porcentaje || linea.comision || 0, // Frontend envía comision_porcentaje, mapeamos a comision
          con_iva: linea.con_iva !== undefined ? linea.con_iva : true,
          con_it: linea.con_it !== undefined ? linea.con_it : true,
          es_soporte: linea.es_soporte || false,
          orden: linea.orden || index + 1,
          // Validar que no se guarden URLs blob
          imagen: linea.imagen && !linea.imagen.startsWith('blob:') ? linea.imagen : null,
          variantes: variantesParsed, // JSONB en Supabase
          subtotal_linea: linea.subtotal_linea || 0
        }
      })

      await createMultipleLineas(lineasData)
      console.log('✅ Líneas actualizadas correctamente')
      
      // Actualizar lineas_cotizacion en el encabezado con el número real de líneas
      await updateCotizacion(id, {
        lineas_cotizacion: lineasData.length,
        cantidad_items: lineasData.length
      })
    }

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

    // Eliminar las líneas primero (por la FK)
    const { deleteLineasByCotizacionId } = await import('@/lib/supabaseCotizacionLineas')
    await deleteLineasByCotizacionId(id)

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
