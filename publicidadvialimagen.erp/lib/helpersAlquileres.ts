import { getLineasByCotizacionId } from './supabaseCotizacionLineas'
import { getCotizacionById } from './supabaseCotizaciones'
import { getSoportes, updateSoporte } from './supabaseSoportes'
import { 
  createAlquiler, 
  generarSiguienteCodigoAlquiler, 
  getAllAlquileresParaActualizarSoportes,
  getAlquileresPorCotizacion,
  cancelarAlquileresDeCotizacion,
  getAlquileresVigentesPorSoporte
} from './supabaseAlquileres'
import { 
  registrarAlquilerCreado, 
  registrarAlquilerEliminado 
} from './supabaseHistorial'

/**
 * Obtener información de los soportes que se crearán alquileres al aprobar una cotización
 */
export async function getSoportesParaAlquiler(cotizacionId: string) {
  const cotizacion = await getCotizacionById(cotizacionId)
  const lineas = await getLineasByCotizacionId(cotizacionId)
  
  // Filtrar solo líneas que son soportes
  const lineasSoportes = lineas.filter(linea => linea.es_soporte === true)
  
  // Obtener todos los soportes para buscar por código
  const { data: todosSoportes } = await getSoportes({ limit: 10000 })
  
  const soportesInfo = []
  
  for (const linea of lineasSoportes) {
    if (!linea.codigo_producto) continue
    
    // Buscar el soporte por código
    const soporte = todosSoportes.find((s: any) => s.codigo === linea.codigo_producto)
    
    if (!soporte) {
      console.warn(`⚠️ Soporte con código ${linea.codigo_producto} no encontrado`)
      continue
    }
    
    // Extraer fechas de la descripción si están disponibles
    // Formato esperado: "[CODIGO] NOMBRE - Del YYYY-MM-DD al YYYY-MM-DD"
    let fechaInicio = new Date().toISOString().split('T')[0] // Por defecto: hoy
    let fechaFin = new Date().toISOString().split('T')[0]
    let meses = 1
    
    if (linea.descripcion) {
      const fechaMatch = linea.descripcion.match(/Del (\d{4}-\d{2}-\d{2}) al (\d{4}-\d{2}-\d{2})/)
      if (fechaMatch) {
        fechaInicio = fechaMatch[1]
        fechaFin = fechaMatch[2]
        
        // Usar la cantidad de la línea como meses (es más confiable que calcular desde fechas)
        // La cantidad en líneas de soporte representa los meses seleccionados por el usuario
        meses = Math.ceil(linea.cantidad || 1)
        
        // Si la cantidad no está disponible o es 0, calcular desde las fechas como fallback
        if (!linea.cantidad || linea.cantidad === 0) {
          const inicio = new Date(fechaInicio + 'T00:00:00')
          const fin = new Date(fechaFin + 'T00:00:00')
          
          // Calcular diferencia en meses considerando año y mes
          const yearDiff = fin.getFullYear() - inicio.getFullYear()
          const monthDiff = fin.getMonth() - inicio.getMonth()
          
          // Calcular meses base (diferencia de meses)
          meses = yearDiff * 12 + monthDiff
          
          // Si están en el mismo mes (meses === 0), es 1 mes
          if (meses === 0) {
            meses = 1
          }
          
          // Asegurar mínimo 1 mes
          meses = Math.max(1, meses)
        }
      } else {
        // Si no hay fechas en la descripción, usar cantidad como meses
        meses = Math.ceil(linea.cantidad || 1)
        const inicio = new Date()
        inicio.setHours(0, 0, 0, 0)
        fechaInicio = inicio.toISOString().split('T')[0]
        
        const fin = new Date(inicio)
        fin.setMonth(fin.getMonth() + meses)
        fechaFin = fin.toISOString().split('T')[0]
      }
    } else {
      // Si no hay descripción, usar cantidad como meses
      meses = Math.ceil(linea.cantidad || 1)
      const inicio = new Date()
      inicio.setHours(0, 0, 0, 0)
      fechaInicio = inicio.toISOString().split('T')[0]
      
      const fin = new Date(inicio)
      fin.setMonth(fin.getMonth() + meses)
      fechaFin = fin.toISOString().split('T')[0]
    }
    
    soportesInfo.push({
      linea,
      soporte,
      fechaInicio,
      fechaFin,
      meses,
      importe: linea.subtotal_linea || 0
    })
  }
  
  return {
    cotizacion,
    soportesInfo
  }
}

/**
 * Crear alquileres para una cotización aprobada
 */
export async function crearAlquileresDesdeCotizacion(cotizacionId: string) {
  const { cotizacion, soportesInfo } = await getSoportesParaAlquiler(cotizacionId)
  
  if (soportesInfo.length === 0) {
    return { success: true, alquileresCreados: [], message: 'No hay soportes en esta cotización' }
  }
  
  const alquileresCreados = []
  const errores = []
  
  // Generar códigos de alquiler
  let siguienteCodigo = await generarSiguienteCodigoAlquiler()
  let numeroAlquiler = 1
  
  for (const info of soportesInfo) {
    try {
      // Crear alquiler
      // Nota: Si soporte_id es UUID pero soportes.id es numérico, hay un problema de esquema
      // Por ahora, intentamos usar el ID numérico directamente
      // Si el esquema requiere UUID, el usuario deberá ajustar el esquema o proporcionar un UUID
      const alquiler = await createAlquiler({
        codigo: siguienteCodigo,
        cotizacion_id: cotizacionId,
        cliente: cotizacion.cliente || null,
        vendedor: cotizacion.vendedor || null,
        soporte_id: info.soporte.id, // Usar ID numérico directamente (no convertir a string)
        inicio: info.fechaInicio,
        fin: info.fechaFin,
        meses: info.meses,
        total: info.importe
      })
      
      console.log(`✅ Alquiler creado para soporte ${info.soporte.codigo} (ID: ${info.soporte.id}, tipo: ${typeof info.soporte.id})`)
      
      alquileresCreados.push(alquiler)
      
      // Crear notificación de alquiler creado
      try {
        const { notificarAlquilerCreado } = await import('@/lib/notificaciones')
        await notificarAlquilerCreado(alquiler.id, alquiler.codigo)
      } catch (notifError) {
        // No fallar la creación si falla la notificación
        console.error('⚠️ Error creando notificación de alquiler:', notifError)
      }
      
      // Actualizar estado del soporte a "Ocupado"
      await updateSoporte(String(info.soporte.id), { estado: 'Ocupado' })
      
      // Registrar evento en historial del soporte
      try {
        await registrarAlquilerCreado(
          typeof info.soporte.id === 'number' ? info.soporte.id : parseInt(String(info.soporte.id)),
          cotizacionId,
          info.fechaInicio,
          info.fechaFin,
          info.importe
        )
      } catch (historialError) {
        // No fallar si el historial falla, solo loguear
        console.warn('⚠️ Error registrando historial de alquiler creado:', historialError)
      }
      
      // Generar siguiente código
      const match = siguienteCodigo.match(/ALQ-(\d+)/)
      if (match) {
        const num = parseInt(match[1], 10) + 1
        siguienteCodigo = `ALQ-${num.toString().padStart(4, '0')}`
      }
      
      numeroAlquiler++
    } catch (error) {
      console.error(`❌ Error creando alquiler para soporte ${info.soporte.codigo}:`, error)
      const errorMessage = error instanceof Error 
        ? error.message 
        : (typeof error === 'object' && error !== null && 'message' in error)
          ? String(error.message)
          : 'Error desconocido'
      
      // Log detallado del error
      if (error instanceof Error) {
        console.error(`   Error name: ${error.name}`)
        console.error(`   Error stack: ${error.stack}`)
      }
      if (typeof error === 'object' && error !== null) {
        console.error(`   Error object:`, JSON.stringify(error, null, 2))
      }
      
      errores.push({
        soporte: info.soporte.codigo,
        error: errorMessage
      })
    }
  }
  
  if (errores.length > 0) {
    // Si hay errores, revertir los alquileres creados
    // Por ahora solo logueamos, en producción podríamos implementar rollback
    console.error('❌ Errores al crear alquileres:', errores)
    throw new Error(`Error al crear algunos alquileres: ${errores.map(e => `${e.soporte}: ${e.error}`).join(', ')}`)
  }
  
  return {
    success: true,
    alquileresCreados,
    message: `Se crearon ${alquileresCreados.length} alquiler(es) exitosamente`
  }
}

/**
 * Actualizar estado de soportes cuando un alquiler finaliza
 */
// Actualizar estado de un soporte específico basado en sus alquileres
export async function actualizarEstadoSoporte(soporteId: string | number) {
  try {
    console.log(`🔄 Actualizando estado del soporte ${soporteId}...`);
    
    // Obtener alquileres vigentes del soporte
    const alquileresVigentes = await getAlquileresVigentesPorSoporte(soporteId);
    
    const soporteIdStr = typeof soporteId === 'number' ? String(soporteId) : soporteId;
    
    if (alquileresVigentes.length > 0) {
      // Tiene alquileres vigentes, debe estar "Ocupado"
      await updateSoporte(soporteIdStr, { estado: 'Ocupado' });
      console.log(`✅ Soporte ${soporteIdStr} actualizado a Ocupado (${alquileresVigentes.length} alquiler(es) vigente(s))`);
    } else {
      // No tiene alquileres vigentes, debe estar "Disponible"
      await updateSoporte(soporteIdStr, { estado: 'Disponible' });
      console.log(`✅ Soporte ${soporteIdStr} actualizado a Disponible (sin alquileres vigentes)`);
    }
  } catch (error) {
    console.error(`❌ Error actualizando estado del soporte ${soporteId}:`, error);
    throw error;
  }
}

// Actualizar estados de todos los soportes basado en sus alquileres
export async function actualizarEstadoSoportesAlquileres() {
  // Esta función se puede llamar desde un CRON para actualizar estados
  // Por ahora la dejamos como helper para uso manual
  
  // Obtener todos los alquileres
  const alquileres = await getAllAlquileresParaActualizarSoportes()
  
  // Agrupar por soporte_id
  const soportesPorAlquiler: Record<string, any[]> = {}
  
  for (const alquiler of alquileres) {
    if (!soportesPorAlquiler[alquiler.soporte_id]) {
      soportesPorAlquiler[alquiler.soporte_id] = []
    }
    soportesPorAlquiler[alquiler.soporte_id].push(alquiler)
  }
  
  // Para cada soporte, verificar si tiene alquileres vigentes
  for (const [soporteId, alquileresSoporte] of Object.entries(soportesPorAlquiler)) {
    const tieneVigentes = alquileresSoporte.some(a => 
      a.estado === 'activo' || a.estado === 'reservado' || a.estado === 'proximo'
    )
    
    if (!tieneVigentes) {
      // No tiene alquileres vigentes, poner en "Disponible"
      try {
        // Convertir soporteId a string si es necesario para updateSoporte
        const soporteIdStr = typeof soporteId === 'number' ? String(soporteId) : soporteId
        await updateSoporte(soporteIdStr, { estado: 'Disponible' })
        console.log(`✅ Soporte ${soporteIdStr} actualizado a Disponible`)
      } catch (error) {
        console.error(`❌ Error actualizando soporte ${soporteId}:`, error)
      }
    }
  }
  
  console.log('✅ Actualización de estados de soportes completada')
}

// Cancelar alquileres de una cotización y actualizar estados de soportes
export async function cancelarAlquileresCotizacion(cotizacionId: string, registrarHistorial: boolean = true) {
  try {
    console.log(`🗑️ [cancelarAlquileresCotizacion] Iniciando para cotización ${cotizacionId}...`);
    
    // Cancelar alquileres y obtener soportes afectados
    const resultado = await cancelarAlquileresDeCotizacion(cotizacionId);
    
    // Registrar eventos en historial si se solicita
    if (registrarHistorial) {
      for (const alquiler of resultado.alquileresCancelados) {
        try {
          const soporteId = typeof alquiler.soporte_id === 'number' 
            ? alquiler.soporte_id 
            : parseInt(String(alquiler.soporte_id));
          
          await registrarAlquilerEliminado(
            soporteId,
            cotizacionId,
            alquiler.codigo
          );
        } catch (historialError) {
          // No fallar si el historial falla, solo loguear
          console.warn(`⚠️ Error registrando historial de alquiler eliminado ${alquiler.codigo}:`, historialError);
        }
      }
    }
    
    // Actualizar estado de cada soporte afectado
    for (const soporteId of resultado.soportesAfectados) {
      await actualizarEstadoSoporte(soporteId);
    }
    
    console.log(`✅ [cancelarAlquileresCotizacion] Completado: ${resultado.alquileresCancelados.length} alquiler(es) cancelado(s), ${resultado.soportesAfectados.length} soporte(s) actualizado(s)`);
    
    return resultado;
  } catch (error) {
    console.error(`❌ [cancelarAlquileresCotizacion] Error:`, error);
    throw error;
  }
}

