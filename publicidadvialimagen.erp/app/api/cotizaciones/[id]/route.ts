import { NextRequest, NextResponse } from 'next/server'
import { 
  getCotizacionById, 
  updateCotizacion, 
  deleteCotizacion
} from '@/lib/supabaseCotizaciones'
import { getSupabaseServer } from '@/lib/supabaseServer'
import type { UsuarioResponsable } from '@/lib/services/inventoryService'
import { findContactoById, findContactoByNombre } from '@/lib/supabaseContactos'

export const runtime = 'nodejs' // Asegurar runtime Node.js para notificaciones
import { getLineasByCotizacionId, deleteLineasByCotizacionId, createMultipleLineas } from '@/lib/supabaseCotizacionLineas'

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
import { cancelarAlquileresCotizacion } from '@/lib/helpersAlquileres'
import { getAlquileresPorCotizacion } from '@/lib/supabaseAlquileres'
import {
  getUsuarioAutenticado,
  verificarAccesoCotizacion,
  validarYNormalizarLineas,
  validarTotalFinal,
  calcularTotalFinalDesdeLineas,
  calcularDesgloseImpuestos,
  type CotizacionPayload
} from '@/lib/cotizacionesBackend'
import { descontarStockProducto, registrarMovimiento, descontarInsumosDesdeCotizacion, revertirStockCotizacion } from '@/lib/services/inventoryService'

/** Resuelve vendedor de la cotización (id o nombre) a UsuarioResponsable. Si no existe, usa fallback (ej. usuario que ejecuta la acción). */
async function resolverUsuarioResponsableDesdeCotizacion(
  vendedor: string | null,
  fallback: UsuarioResponsable
): Promise<UsuarioResponsable> {
  if (!vendedor || !String(vendedor).trim()) return fallback
  const supabase = getSupabaseServer()
  const v = String(vendedor).trim()
  const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(v)
  if (isUuid) {
    const { data } = await supabase.from('usuarios').select('id, nombre').eq('id', v).single()
    if (data) return { id: data.id, nombre: data.nombre ?? undefined }
  }
  const { data } = await supabase.from('usuarios').select('id, nombre').ilike('nombre', v).maybeSingle()
  if (data) return { id: data.id, nombre: data.nombre ?? undefined }
  return fallback
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Obtener la cotización
    const cotizacion = await getCotizacionById(id)

    // Obtener las líneas asociadas
    const lineas = await getLineasByCotizacionId(id)

    // NIT del contacto (para PDF): por UUID o por nombre (las cotizaciones guardan el nombre del cliente)
    let cliente_nit: string | null = null
    if (cotizacion?.cliente && String(cotizacion.cliente).trim()) {
      let contacto: Awaited<ReturnType<typeof findContactoById>> = null
      if (uuidRegex.test(cotizacion.cliente)) {
        contacto = await findContactoById(cotizacion.cliente)
      } else {
        contacto = await findContactoByNombre(cotizacion.cliente)
      }
      if (contacto?.taxId && String(contacto.taxId).trim()) {
        cliente_nit = String(contacto.taxId).trim()
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        cotizacion,
        lineas,
        cliente_nit
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


  // ============================================================================
  // C1, C3: VALIDACIÓN DE SESIÓN Y AUTENTICACIÓN
  // ============================================================================
  const usuario = await getUsuarioAutenticado(request as NextRequest)
  if (!usuario) {
    return NextResponse.json(
      { success: false, error: 'No autorizado. Debes iniciar sesión.' },
      { status: 401 }
    )
  }

  try {
    // Leer body como texto primero para debug
    const bodyText = await request.text()

    // Parsear JSON de forma segura
    let body: CotizacionPayload & { regenerar_alquileres?: boolean }
    try {
      body = JSON.parse(bodyText || "{}") as CotizacionPayload & { regenerar_alquileres?: boolean }
    } catch {
      body = {} as CotizacionPayload & { regenerar_alquileres?: boolean }
    }
    
    // lineas siempre seguro
    const lineasPayload = body.lineas ?? []

    // ============================================================================
    // C3: VERIFICAR ACCESO A LA COTIZACIÓN
    // ============================================================================
    const tieneAcceso = await verificarAccesoCotizacion(id, usuario)
    if (!tieneAcceso) {
      return NextResponse.json(
        { success: false, error: 'No tienes permiso para editar esta cotización.' },
        { status: 403 }
      )
    }

    // Obtener el estado actual de la cotización antes de actualizarla
    const cotizacionActual = await getCotizacionById(id)
    const estadoAnterior = cotizacionActual.estado
    
    // Extraer líneas del body si vienen
    const lineasRaw = body.lineas
    delete body.lineas
    
    // Extraer flag de regeneración de alquileres (viene del frontend cuando el usuario acepta el modal)
    const regenerarAlquileres = body.regenerar_alquileres === true
    delete body.regenerar_alquileres

    // REGLA 10: Si viene total_final del frontend (usuario editó manualmente el Total General),
    // ese valor ya incluye IVA/IT y debe usarse DIRECTAMENTE sin recalcular
    const totalFinalManual = body.total_final

    // Limpiar campos que no existen en Supabase
    const { vigencia_dias, notas_generales, terminos_condiciones, total_final, ...camposLimpios } = body

    // Validar comprobante si viene en el body (debe ser factura o nota de remision)
    if (camposLimpios.comprobante !== undefined) {
      if (camposLimpios.comprobante !== 'factura' && camposLimpios.comprobante !== 'nota de remision') {
        return NextResponse.json(
          { success: false, error: 'Comprobante debe ser "factura" o "nota de remision".' },
          { status: 400 }
        )
      }
    }

    // ============================================================================
    // C6: VALIDACIÓN Y NORMALIZACIÓN DE LÍNEAS
    // ============================================================================
    let lineasNormalizadas: any[] = []
    if (lineasRaw && Array.isArray(lineasRaw)) {
      lineasNormalizadas = validarYNormalizarLineas(lineasRaw)

      if (lineasNormalizadas.length === 0 && lineasRaw.length > 0) {
        return NextResponse.json(
          { success: false, error: 'Todas las líneas son inválidas. Verifica los datos enviados.' },
          { status: 400 }
        )
      }

      // ============================================================================
      // C1: VALIDACIÓN DE TOTAL_FINAL
      // ============================================================================
      if (totalFinalManual !== null && totalFinalManual !== undefined) {
        if (!validarTotalFinal(totalFinalManual, lineasNormalizadas)) {
          return NextResponse.json(
            { success: false, error: 'El total_final no coincide con la suma de las líneas. Verifica los cálculos.' },
            { status: 400 }
          )
        }
      }

      // ============================================================================
      // CÁLCULO DE TOTALES (misma lógica que antes)
      // ============================================================================
      const { subtotal, totalIVA, totalIT } = calcularDesgloseImpuestos(lineasNormalizadas)
      
      camposLimpios.subtotal = subtotal
      camposLimpios.total_iva = totalIVA
      camposLimpios.total_it = totalIT
      
      // REGLA 10: Si hay total_final manual, usarlo DIRECTAMENTE
      // Si no, usar la suma de subtotal_linea (que ya son totales finales)
      if (totalFinalManual !== undefined && totalFinalManual !== null) {
        camposLimpios.total_final = totalFinalManual
      } else {
        camposLimpios.total_final = calcularTotalFinalDesdeLineas(lineasNormalizadas)
      }
      
      camposLimpios.cantidad_items = lineasNormalizadas.length
      camposLimpios.lineas_cotizacion = lineasNormalizadas.length
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
    const tieneAlquileres = esAprobada && Array.isArray(lineasPayload) && lineasPayload.length > 0
    let hayCambiosEnSoportes = false
    
    
    if (tieneAlquileres) {
      // Obtener líneas actuales de la BD
      const lineasActuales = await getLineasByCotizacionId(id)
      const soportesActuales = lineasActuales.filter(l => l.es_soporte === true)
      const soportesNuevos = lineasNormalizadas.filter((l: any) => l.es_soporte === true)
      
      
      // Comparar cantidad de soportes
      if (soportesActuales.length !== soportesNuevos.length) {
        hayCambiosEnSoportes = true
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
            break
          }
        }
      }
      
    }
    
    // REGLA DEFINITIVA DE INVENTARIO: Revertir stock SIEMPRE que se sale de Aprobada
    // Si: estadoAnterior === 'Aprobada' AND estadoNuevo !== 'Aprobada' AND stock_descontado === true
    const seEstaSaliendoDeAprobada = estadoAnterior === 'Aprobada' && nuevoEstado !== 'Aprobada'
    
    if (seEstaSaliendoDeAprobada && cotizacionActual.stock_descontado === true) {
      try {
        // Obtener líneas para revertir stock
        const lineasParaReversion = await getLineasByCotizacionId(id)
        if (lineasParaReversion && lineasParaReversion.length > 0) {
          const sucursal = cotizacionActual.sucursal || 'La Paz'
          const usuarioResponsable = await resolverUsuarioResponsableDesdeCotizacion(
            cotizacionActual.vendedor,
            { id: usuario.id, nombre: usuario.name ?? undefined }
          )
          await revertirStockCotizacion({
            cotizacionId: id,
            cotizacionCodigo: cotizacionActual.codigo,
            lineas: lineasParaReversion,
            sucursal: sucursal,
            origen: nuevoEstado === 'Rechazada' ? 'cotizacion_rechazada' : 'cotizacion_editada',
            usuarioResponsable
          })
          
          // Marcar flag como false solo si la reversión fue completamente exitosa
          await updateCotizacion(id, { stock_descontado: false })
          console.log('✅ [PATCH /api/cotizaciones/[id]] Stock revertido y flag stock_descontado marcado como false')
        } else {
          console.warn('⚠️ [PATCH /api/cotizaciones/[id]] No hay líneas para revertir stock')
        }
      } catch (errorReversion) {
        console.error('❌ [PATCH /api/cotizaciones/[id]] Error revirtiendo stock:', errorReversion)
        // Si la reversión falla, NO actualizar estado ni cambiar stock_descontado
        // Retornar error claro
        return NextResponse.json(
          {
            success: false,
            error: 'Error revirtiendo stock de inventario. La cotización no fue actualizada. Por favor, inténtalo de nuevo.'
          },
          { status: 500 }
        )
      }
    } else if (seEstaSaliendoDeAprobada && cotizacionActual.stock_descontado === false) {
      console.log('ℹ️ [PATCH /api/cotizaciones/[id]] Stock no estaba descontado, omitiendo reversión')
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
      if (!regenerarAlquileres) {
        // Si hay cambios pero el usuario NO aceptó, rechazar la actualización
        return NextResponse.json({
          success: false,
          error: 'REQUIERE_CONFIRMACION',
          message: 'Esta cotización tiene alquileres generados. Debes confirmar la regeneración de alquileres antes de guardar.'
        }, { status: 400 })
      }
      
      // Si SÍ recibe regenerar_alquileres: true
      try {
        // Verificar que realmente hay alquileres
        const alquileresExistentes = await getAlquileresPorCotizacion(id)
        
        if (alquileresExistentes.length > 0) {
          // Cancelar alquileres antiguos (con historial)
          await cancelarAlquileresCotizacion(id, true)
        }
        
        // Cambiar estado a Pendiente y marcar requiere_nueva_aprobacion
        camposLimpios.estado = 'Pendiente'
        camposLimpios.requiere_nueva_aprobacion = true
      } catch (errorAlquileres) {
        console.error(`❌ Error en proceso de regeneración de alquileres:`, errorAlquileres)
        console.error(`   Error stack:`, errorAlquileres instanceof Error ? errorAlquileres.stack : 'No stack available')
        // No fallar la actualización si falla la cancelación de alquileres, pero loguear
      }
    }

    // ============================================================================
    // C4: TRANSACCIÓN - Actualizar cotización y líneas juntos
    // ============================================================================
    try {
      // Paso 1: Actualizar la cotización (encabezado) - Solo campos que existen en Supabase
      const cotizacionActualizada = await updateCotizacion(id, camposLimpios)


      // Detectar cambios de estado
      const seEstaAprobando = estadoAnterior !== 'Aprobada' && nuevoEstado === 'Aprobada'
      const seEstaRechazando = estadoAnterior !== 'Rechazada' && nuevoEstado === 'Rechazada'
      const hayCambioEstado = estadoAnterior !== nuevoEstado

      // Notificaciones de cotización aprobada/rechazada/actualizada ELIMINADAS según requerimientos
      
      // Si se está aprobando, descontar stock de los productos (con idempotencia)
      if (seEstaAprobando) {
        try {
          // Verificar si ya se descontó stock para esta cotización (idempotencia)
          // Usar flag persistente en BD como fuente de verdad
          const yaDescontado = cotizacionActualizada.stock_descontado === true
          
          if (yaDescontado) {
            console.log('⚠️ [PATCH /api/cotizaciones/[id]] Stock ya descontado previamente para esta cotización, omitiendo descuento duplicado')
          } else {
            // Si no se enviaron líneas en el body, obtenerlas de la BD
            let lineasParaDescuento = lineasNormalizadas
            if (lineasParaDescuento.length === 0) {
              const lineasBD = await getLineasByCotizacionId(id)
              if (lineasBD && lineasBD.length > 0) {
                lineasParaDescuento = lineasBD
              } else {
                console.warn('⚠️ [PATCH /api/cotizaciones/[id]] No se encontraron líneas en BD')
              }
            }

            if (lineasParaDescuento.length > 0) {
              // Obtener sucursal de la cotización
              const sucursal = cotizacionActualizada.sucursal || 'La Paz'
              const usuarioResponsable = await resolverUsuarioResponsableDesdeCotizacion(
                cotizacionActualizada.vendedor,
                { id: usuario.id, nombre: usuario.name ?? undefined }
              )
              // Usar la nueva función mejorada que considera m², unidades, variantes y excluye soportes
              await descontarInsumosDesdeCotizacion({
                cotizacionId: id,
                cotizacionCodigo: cotizacionActualizada.codigo,
                lineas: lineasParaDescuento,
                sucursal: sucursal,
                origen: estadoAnterior === 'Aprobada' ? 'cotizacion_editada' : 'cotizacion_aprobada',
                usuarioResponsable
              })
              
              // Marcar flag solo si el descuento fue completamente exitoso
              await updateCotizacion(id, { stock_descontado: true })
              console.log('✅ [PATCH /api/cotizaciones/[id]] Flag stock_descontado marcado como true')
            } else {
              console.warn('⚠️ [PATCH /api/cotizaciones/[id]] No hay líneas para descontar stock')
            }
          }
        } catch (errorStock) {
          console.error('❌ [PATCH /api/cotizaciones/[id]] Error descontando stock:', errorStock)
          // NO fallar la aprobación si falla el descuento de stock
          // NO marcar flag si falló el descuento
          // Solo loguear el error para que el usuario pueda revisarlo
        }
      }

      // Paso 2: Si vienen líneas, actualizarlas también
      if (lineasNormalizadas.length > 0) {
        // Eliminar líneas existentes
        await deleteLineasByCotizacionId(id)
        
        // Crear nuevas líneas
        const lineasData = lineasNormalizadas.map((linea) => ({
          cotizacion_id: id,
          tipo: linea.tipo,
          codigo_producto: linea.codigo_producto || null,
          nombre_producto: linea.nombre_producto || null,
          descripcion: linea.descripcion || null,
          cantidad: linea.cantidad,
          ancho: linea.ancho || null,
          alto: linea.alto || null,
          total_m2: linea.total_m2 || null,
          unidad_medida: linea.unidad_medida || 'm²',
          precio_unitario: linea.precio_unitario,
          comision: linea.comision_porcentaje || linea.comision || 0,
          con_iva: linea.con_iva,
          con_it: linea.con_it,
          es_soporte: linea.es_soporte || false,
          orden: linea.orden || 0,
          imagen: linea.imagen || null,
          variantes: linea.variantes || null,
          subtotal_linea: linea.subtotal_linea
        }))

        await createMultipleLineas(lineasData)
        
        // Actualizar lineas_cotizacion en el encabezado con el número real de líneas
        await updateCotizacion(id, {
          lineas_cotizacion: lineasData.length,
          cantidad_items: lineasData.length
        })
      }
      
      // Si se regeneraron alquileres, crear los nuevos alquileres ahora
      if (esAprobada && hayCambiosEnSoportes && regenerarAlquileres) {
        console.log(`🔄 [PATCH /api/cotizaciones/[id]] Creando nuevos alquileres para cotización ${id}...`)
        try {
          const { crearAlquileresDesdeCotizacion } = await import('@/lib/helpersAlquileres')
          const resultado = await crearAlquileresDesdeCotizacion(id)
          
          // Actualizar el estado de la cotización a Aprobada después de crear los alquileres
          console.log(`🔄 [PATCH /api/cotizaciones/[id]] Actualizando estado de cotización a Aprobada...`)
          const cotizacionActualizadaFinal = await updateCotizacion(id, {
            estado: 'Aprobada',
            requiere_nueva_aprobacion: false
          })
          
          // Actualizar cotizacionActualizada para devolver el estado correcto
          cotizacionActualizada.estado = cotizacionActualizadaFinal.estado
          cotizacionActualizada.requiere_nueva_aprobacion = cotizacionActualizadaFinal.requiere_nueva_aprobacion
        } catch (errorCrear) {
          console.error(`❌ [PATCH /api/cotizaciones/[id]] Error creando nuevos alquileres:`, errorCrear)
          console.error(`   Error message:`, errorCrear instanceof Error ? errorCrear.message : String(errorCrear))
          console.error(`   Error stack:`, errorCrear instanceof Error ? errorCrear.stack : 'No stack available')
          // No fallar la actualización, pero mantener requiere_nueva_aprobacion
        }
      }

      console.log("==========================================")
      
      return NextResponse.json({
        success: true,
        data: cotizacionActualizada
      })

    } catch (errorTransaccion) {
      // C4: ROLLBACK - Si falla la actualización, intentar revertir cambios
      console.error('❌ [PATCH /api/cotizaciones/[id]] Error en transacción, intentando rollback:', errorTransaccion)
      // Nota: En Supabase no hay rollback automático, pero las operaciones son atómicas
      // Si falla la creación de líneas, las líneas anteriores ya fueron eliminadas
      // En este caso, el usuario deberá reintentar la operación
      throw errorTransaccion
    }

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
  // ============================================================================
  // C1, C3: VALIDACIÓN DE SESIÓN Y AUTENTICACIÓN
  // ============================================================================
  const usuario = await getUsuarioAutenticado(request as NextRequest)
  if (!usuario) {
    return NextResponse.json(
      { success: false, error: 'No autorizado. Debes iniciar sesión.' },
      { status: 401 }
    )
  }

  try {
    const { id } = await params
    console.log('🗑️ Eliminando cotización:', id)

    // ============================================================================
    // C3: VERIFICAR ACCESO A LA COTIZACIÓN
    // ============================================================================
    const tieneAcceso = await verificarAccesoCotizacion(id, usuario)
    if (!tieneAcceso) {
      return NextResponse.json(
        { success: false, error: 'No tienes permiso para eliminar esta cotización.' },
        { status: 403 }
      )
    }

    // Obtener cotización antes de eliminar para verificar si hay stock a revertir
    const cotizacionAEliminar = await getCotizacionById(id)
    
    // Si la cotización está aprobada y tiene stock descontado, revertir antes de eliminar
    if (cotizacionAEliminar.estado === 'Aprobada' && cotizacionAEliminar.stock_descontado === true) {
      try {
        // Obtener líneas para revertir stock
        const lineasParaReversion = await getLineasByCotizacionId(id)
        if (lineasParaReversion && lineasParaReversion.length > 0) {
          const sucursal = cotizacionAEliminar.sucursal || 'La Paz'
          const usuarioResponsable = await resolverUsuarioResponsableDesdeCotizacion(
            cotizacionAEliminar.vendedor,
            { id: usuario.id, nombre: usuario.name ?? undefined }
          )
          await revertirStockCotizacion({
            cotizacionId: id,
            cotizacionCodigo: cotizacionAEliminar.codigo,
            lineas: lineasParaReversion,
            sucursal: sucursal,
            origen: 'cotizacion_eliminada',
            usuarioResponsable
          })
          console.log('✅ [DELETE /api/cotizaciones/[id]] Stock revertido antes de eliminar')
        } else {
          console.warn('⚠️ [DELETE /api/cotizaciones/[id]] No hay líneas para revertir stock')
        }
      } catch (errorReversion) {
        console.error('❌ [DELETE /api/cotizaciones/[id]] Error revirtiendo stock:', errorReversion)
        // Si la reversión falla, NO eliminar la cotización (condición obligatoria)
        return NextResponse.json(
          { 
            success: false, 
            error: 'No se pudo revertir el stock de la cotización. La cotización no fue eliminada.' 
          },
          { status: 500 }
        )
      }
    }

    // Eliminar las líneas primero (por la FK)
    const { deleteLineasByCotizacionId } = await import('@/lib/supabaseCotizacionLineas')
    await deleteLineasByCotizacionId(id)

    // Eliminar la cotización
    await deleteCotizacion(id)


    return NextResponse.json({
      success: true,
      message: 'Cotización eliminada correctamente'
    })

  } catch (error) {
    console.error('❌ Error eliminando cotización:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error al eliminar cotización'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
