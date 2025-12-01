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
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  console.log("\n========== PATCH COTIZACION ==========")
  console.log("ID:", id)

  try {
    // Leer body como texto primero para debug
    const bodyText = await request.text()
    console.log("BODY RAW:", bodyText)

    // Parsear JSON
    const body = JSON.parse(bodyText || "{}")
    
    console.log("BODY PARSEADO:", JSON.stringify(body, null, 2))
    console.log("regenerar_alquileres:", body.regenerar_alquileres)
    console.log("==========================================")

    // Obtener el estado actual de la cotización antes de actualizarla
    const cotizacionActual = await getCotizacionById(id)
    const estadoAnterior = cotizacionActual.estado
    
    // Extraer líneas del body si vienen
    const lineas = body.lineas
    delete body.lineas
    
    // Extraer flag de regeneración de alquileres (viene del frontend cuando el usuario acepta el modal)
    const regenerarAlquileres = body.regenerar_alquileres === true
    delete body.regenerar_alquileres

    // REGLA 10: Si viene total_final del frontend (usuario editó manualmente el Total General),
    // ese valor ya incluye IVA/IT y debe usarse DIRECTAMENTE sin recalcular
    const totalFinalManual = body.total_final

    // Limpiar campos que no existen en Supabase
    const { vigencia_dias, notas_generales, terminos_condiciones, total_final, ...camposLimpios } = body

    // ============================================================================
    // NUEVA LÓGICA: subtotal_linea YA es el total final (incluye impuestos si están activos)
    // El backend NO suma impuestos adicionales
    // ============================================================================
    if (lineas && Array.isArray(lineas)) {
      let subtotal = 0
      let totalIVA = 0
      let totalIT = 0
      let totalFinal = 0

      lineas.forEach((linea: any) => {
        // Solo productos tienen subtotal_linea (que YA es el total final)
        if (linea.tipo === 'Producto' || linea.tipo === 'producto') {
          const lineaTotal = linea.subtotal_linea || 0
          subtotal += lineaTotal
          
          // Calcular IVA e IT para el desglose (solo informativo)
          // Si con_iva y con_it están activos, el subtotal_linea ya los incluye
          // Calculamos la base sin impuestos para el desglose
          if (linea.con_iva && linea.con_it) {
            const base = lineaTotal / 1.16
            totalIVA += base * 0.13
            totalIT += base * 0.03
          } else if (linea.con_iva) {
            const base = lineaTotal / 1.13
            totalIVA += base * 0.13
          } else if (linea.con_it) {
            const base = lineaTotal / 1.03
            totalIT += base * 0.03
          }
        }
      })

      camposLimpios.subtotal = subtotal
      camposLimpios.total_iva = totalIVA
      camposLimpios.total_it = totalIT
      
      // REGLA 10: Si hay total_final manual, usarlo DIRECTAMENTE
      // Si no, usar la suma de subtotal_linea (que ya son totales finales)
      if (totalFinalManual !== undefined && totalFinalManual !== null) {
        camposLimpios.total_final = totalFinalManual
        console.log('💰 Backend PATCH: Usando total_final manual (NO recalcula):', totalFinalManual)
      } else {
        camposLimpios.total_final = subtotal // subtotal_linea ya incluye impuestos si están activos
        console.log('💰 Backend PATCH: Usando suma de subtotal_linea (ya son totales finales):', camposLimpios.total_final)
      }
      
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
    
    // Detectar si se está editando una cotización aprobada con cambios en soportes
    const esAprobada = estadoAnterior === 'Aprobada'
    const tieneAlquileres = esAprobada && lineas && Array.isArray(lineas)
    let hayCambiosEnSoportes = false
    
    console.log("🔍 Detectando cambios...")
    console.log("  - esAprobada:", esAprobada)
    console.log("  - tieneAlquileres:", tieneAlquileres)
    console.log("  - regenerarAlquileres recibido:", regenerarAlquileres)
    
    if (tieneAlquileres) {
      // Obtener líneas actuales de la BD
      const lineasActuales = await getLineasByCotizacionId(id)
      const soportesActuales = lineasActuales.filter(l => l.es_soporte === true)
      const soportesNuevos = lineas.filter((l: any) => l.es_soporte === true)
      
      console.log("  - soportesActuales.length:", soportesActuales.length)
      console.log("  - soportesNuevos.length:", soportesNuevos.length)
      
      // Comparar cantidad de soportes
      if (soportesActuales.length !== soportesNuevos.length) {
        hayCambiosEnSoportes = true
        console.log("  ✅ HAY CAMBIOS: Diferente cantidad de soportes")
      } else {
        // Comparar códigos y fechas de soportes
        const actualesMap = new Map(soportesActuales.map(l => [
          l.codigo_producto,
          { codigo: l.codigo_producto, descripcion: l.descripcion || '' }
        ]))
        
        for (const nuevo of soportesNuevos) {
          const actual = actualesMap.get(nuevo.codigo_producto)
          if (!actual || actual.descripcion !== (nuevo.descripcion || '')) {
            hayCambiosEnSoportes = true
            console.log("  ✅ HAY CAMBIOS: Diferente código o descripción en soporte:", nuevo.codigo_producto)
            break
          }
        }
      }
      
      console.log("  - hayCambiosEnSoportes:", hayCambiosEnSoportes)
    }
    
    // Si se está rechazando una cotización aprobada, cancelar alquileres
    if (seEstaCambiandoARechazada) {
      try {
        await cancelarAlquileresCotizacion(id, true) // Registrar historial
      } catch (errorAlquileres) {
        console.error(`❌ Error cancelando alquileres:`, errorAlquileres)
        // No fallar la actualización si falla la cancelación de alquileres
      }
    }
    
    // 🔥 LÓGICA DE REGENERACIÓN DE ALQUILERES
    if (esAprobada && hayCambiosEnSoportes) {
      console.log("🔍 Evaluando regeneración de alquileres...")
      console.log("  - regenerarAlquileres:", regenerarAlquileres)
      
      if (!regenerarAlquileres) {
        // Si hay cambios pero el usuario NO aceptó, rechazar la actualización
        console.log("❌ REQUIERE_CONFIRMACION: Hay cambios pero no se recibió regenerar_alquileres")
        return NextResponse.json({
          success: false,
          error: 'REQUIERE_CONFIRMACION',
          message: 'Esta cotización tiene alquileres generados. Debes confirmar la regeneración de alquileres antes de guardar.'
        }, { status: 400 })
      }
      
      // Si SÍ recibe regenerar_alquileres: true
      console.log("✅ Regeneración confirmada, procediendo...")
      try {
        // Verificar que realmente hay alquileres
        const alquileresExistentes = await getAlquileresPorCotizacion(id)
        console.log(`  - alquileresExistentes encontrados: ${alquileresExistentes.length}`)
        
        if (alquileresExistentes.length > 0) {
          console.log(`🔄 Cancelando alquileres antiguos para cotización ${id}...`)
          // Cancelar alquileres antiguos (con historial)
          await cancelarAlquileresCotizacion(id, true)
          console.log(`✅ Alquileres antiguos cancelados exitosamente`)
        }
        
        // Cambiar estado a Pendiente y marcar requiere_nueva_aprobacion
        camposLimpios.estado = 'Pendiente'
        camposLimpios.requiere_nueva_aprobacion = true
        console.log(`✅ Cotización marcada como Pendiente y requiere_nueva_aprobacion=true`)
      } catch (errorAlquileres) {
        console.error(`❌ Error en proceso de regeneración de alquileres:`, errorAlquileres)
        console.error(`   Error stack:`, errorAlquileres instanceof Error ? errorAlquileres.stack : 'No stack available')
        // No fallar la actualización si falla la cancelación de alquileres, pero loguear
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
      
      // Si se regeneraron alquileres, crear los nuevos alquileres ahora
      if (esAprobada && hayCambiosEnSoportes && regenerarAlquileres) {
        console.log(`🔄 Creando nuevos alquileres para cotización ${id}...`)
        try {
          const { crearAlquileresDesdeCotizacion } = await import('@/lib/helpersAlquileres')
          const resultado = await crearAlquileresDesdeCotizacion(id)
          console.log(`✅ ${resultado.alquileresCreados.length} nuevo(s) alquiler(es) creado(s)`)
          
          // Actualizar el estado de la cotización a Aprobada después de crear los alquileres
          console.log(`🔄 Actualizando estado de cotización a Aprobada...`)
          await updateCotizacion(id, {
            estado: 'Aprobada',
            requiere_nueva_aprobacion: false
          })
          console.log(`✅ Estado actualizado a Aprobada`)
          
          // Actualizar cotizacionActualizada para devolver el estado correcto
          cotizacionActualizada.estado = 'Aprobada'
          cotizacionActualizada.requiere_nueva_aprobacion = false
        } catch (errorCrear) {
          console.error(`❌ Error creando nuevos alquileres:`, errorCrear)
          console.error(`   Error message:`, errorCrear instanceof Error ? errorCrear.message : String(errorCrear))
          console.error(`   Error stack:`, errorCrear instanceof Error ? errorCrear.stack : 'No stack available')
          // No fallar la actualización, pero mantener requiere_nueva_aprobacion
        }
      }
    }

    console.log("✅ PATCH completado exitosamente")
    console.log("==========================================")
    
    return NextResponse.json({
      success: true,
      data: cotizacionActualizada
    })

  } catch (error) {
    console.error("\n❌ ERROR FATAL EN PATCH COTIZACION")
    console.error("==========================================")
    console.error('❌ ERROR ACTUALIZANDO COTIZACIÓN:', error)
    console.error('   Error type:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('   Error message:', error instanceof Error ? error.message : String(error))
    console.error('   Error stack:', error instanceof Error ? error.stack : 'No stack available')
    console.error("==========================================")
    
    // 🔥 GARANTIZAR JSON VÁLIDO SIEMPRE - NUNCA DEVOLVER {}
    const errorMessage = error instanceof Error ? error.message : 'Error al actualizar cotización'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    return NextResponse.json({
      success: false,
      error: "ERROR_ACTUALIZANDO",
      message: errorMessage,
      stack: errorStack,
    }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
