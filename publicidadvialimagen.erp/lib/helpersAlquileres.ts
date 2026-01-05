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
  registrarAlquilerEliminado,
  addHistorialEvento,
  getHistorialSoporte
} from './supabaseHistorial'
import { getSoporteById } from './supabaseSoportes'

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
        // Puede ser 0.5 (15 días) o un número entero
        meses = linea.cantidad || 1
        
        // Si la cantidad no está disponible o es 0, calcular desde las fechas como fallback
        if (!linea.cantidad || linea.cantidad === 0) {
          const inicio = new Date(fechaInicio + 'T00:00:00')
          const fin = new Date(fechaFin + 'T00:00:00')
          
          // Calcular diferencia en días
          const diffMs = fin.getTime() - inicio.getTime()
          const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
          
          // Si son exactamente 15 días, es 0.5 meses
          if (diffDias === 15) {
            meses = 0.5
          } else {
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
        }
      } else {
        // Si no hay fechas en la descripción, usar cantidad como meses
        meses = linea.cantidad || 1
        const inicio = new Date()
        inicio.setHours(0, 0, 0, 0)
        fechaInicio = inicio.toISOString().split('T')[0]
        
        const fin = new Date(inicio)
        // Si es 0.5 meses, agregar 15 días; sino, agregar meses completos
        if (meses === 0.5) {
          fin.setDate(fin.getDate() + 15)
        } else {
          fin.setMonth(fin.getMonth() + meses)
        }
        fechaFin = fin.toISOString().split('T')[0]
      }
    } else {
      // Si no hay descripción, usar cantidad como meses
      meses = linea.cantidad || 1
      const inicio = new Date()
      inicio.setHours(0, 0, 0, 0)
      fechaInicio = inicio.toISOString().split('T')[0]
      
      const fin = new Date(inicio)
      // Si es 0.5 meses, agregar 15 días; sino, agregar meses completos
      if (meses === 0.5) {
        fin.setDate(fin.getDate() + 15)
      } else {
        fin.setMonth(fin.getMonth() + meses)
      }
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
      
      // Obtener estado actual del soporte antes de actualizarlo
      const soporteIdNum = typeof info.soporte.id === 'number' ? info.soporte.id : parseInt(String(info.soporte.id))
      const soporteActual = await getSoporteById(String(info.soporte.id))
      const estadoAnterior = soporteActual?.estado || 'Disponible'
      
      // Si el soporte estaba en "A Consultar", guardarlo en el historial para poder restaurarlo después
      if (estadoAnterior === 'A Consultar') {
        try {
          await addHistorialEvento({
            soporte_id: soporteIdNum,
            tipo_evento: 'CAMBIO_ESTADO',
            descripcion: `Soporte pasó de "A Consultar" a "Ocupado" por alquiler ${siguienteCodigo}. Se restaurará a "A Consultar" cuando finalice el alquiler.`,
            realizado_por: null, // Sistema automático
            datos: {
              estado_anterior: 'A Consultar',
              estado_nuevo: 'Ocupado',
              motivo: 'alquiler_creado',
              alquiler_codigo: siguienteCodigo,
              restaurar_a_consultar: true
            }
          })
        } catch (historialError) {
          console.warn('⚠️ Error guardando estado anterior "A Consultar" en historial:', historialError)
        }
      }
      
      // Actualizar estado del soporte a "Ocupado"
      await updateSoporte(String(info.soporte.id), { estado: 'Ocupado' })
      
      // Registrar evento en historial del soporte
      try {
        await registrarAlquilerCreado(
          soporteIdNum,
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
 * Obtener si un soporte debe volver a "A Consultar" cuando finalicen sus alquileres
 * Busca en el historial si alguna vez pasó de "A Consultar" a "Ocupado" por un alquiler
 * 
 * Retorna true si encuentra un evento donde se guardó que debe restaurar a "A Consultar"
 * cuando el alquiler finalice. Esta función se llama cuando NO hay alquileres vigentes,
 * lo que significa que el alquiler ya finalizó y debemos restaurar el estado anterior.
 */
async function debeVolverAConsultar(soporteId: number): Promise<boolean> {
  try {
    const historial = await getHistorialSoporte(soporteId);
    
    // Buscar el evento más reciente donde se guardó que debe restaurar a "A Consultar"
    // El historial ya viene ordenado por fecha descendente (más reciente primero)
    const eventoRestaurar = historial.find(evento => 
      evento.tipo_evento === 'CAMBIO_ESTADO' &&
      evento.datos &&
      typeof evento.datos === 'object' &&
      'restaurar_a_consultar' in evento.datos &&
      evento.datos.restaurar_a_consultar === true &&
      evento.datos.estado_anterior === 'A Consultar'
    );
    
    // Si encontramos un evento de restauración, significa que este soporte
    // estaba en "A Consultar" antes de pasar a "Ocupado" por un alquiler
    // y debe volver a "A Consultar" cuando el alquiler finalice
    return !!eventoRestaurar;
  } catch (error) {
    console.warn(`⚠️ Error verificando si soporte ${soporteId} debe volver a "A Consultar":`, error);
    return false;
  }
}

/**
 * Actualizar estado de soportes cuando un alquiler finaliza
 * Reglas:
 * - "Reservado": No cambiar (tiene su propia lógica de 48h)
 * - "No disponible": No cambiar (solo manualmente)
 * - "A Consultar": No cambiar si no tiene alquileres vigentes (solo manualmente). Si tiene alquileres vigentes, cambiar a "Ocupado". Si estaba en "A Consultar" antes de pasar a "Ocupado", volver a "A Consultar" cuando finalice.
 * - Otros: Cambiar a "Disponible" si no hay alquileres vigentes, o "Ocupado" si hay
 */
export async function actualizarEstadoSoporte(soporteId: string | number) {
  try {
    console.log(`🔄 Actualizando estado del soporte ${soporteId}...`);
    
    // Obtener el soporte actual para ver su estado
    const soporteIdStr = typeof soporteId === 'number' ? String(soporteId) : soporteId;
    const soporte = await getSoporteById(soporteIdStr);
    
    if (!soporte) {
      console.error(`❌ Soporte ${soporteIdStr} no encontrado`);
      return;
    }
    
    const estadoActual = soporte.estado || 'Disponible';
    
    // REGLA 1: No cambiar "Reservado" (tiene su propia lógica de 48h)
    if (estadoActual === 'Reservado') {
      console.log(`⏭️ Soporte ${soporteIdStr} está en "Reservado", no se modifica (tiene lógica propia)`);
      return;
    }
    
    // REGLA 2: No cambiar "No disponible" (solo manualmente)
    if (estadoActual === 'No disponible') {
      console.log(`⏭️ Soporte ${soporteIdStr} está en "No disponible", no se modifica (solo manualmente)`);
      return;
    }
    
    // Obtener alquileres vigentes del soporte
    const alquileresVigentes = await getAlquileresVigentesPorSoporte(soporteId);
    
    // REGLA 2.5: No cambiar "A Consultar" si no tiene alquileres vigentes (solo manualmente)
    if (estadoActual === 'A Consultar' && alquileresVigentes.length === 0) {
      console.log(`⏭️ Soporte ${soporteIdStr} está en "A Consultar" sin alquileres vigentes, no se modifica (solo manualmente)`);
      return;
    }
    
    if (alquileresVigentes.length > 0) {
      // Tiene alquileres vigentes, debe estar "Ocupado"
      // Solo actualizar si no está ya en "Ocupado"
      if (estadoActual !== 'Ocupado') {
        await updateSoporte(soporteIdStr, { estado: 'Ocupado' });
        console.log(`✅ Soporte ${soporteIdStr} actualizado a Ocupado (${alquileresVigentes.length} alquiler(es) vigente(s))`);
      } else {
        console.log(`⏭️ Soporte ${soporteIdStr} ya está en "Ocupado"`);
      }
    } else {
      // No tiene alquileres vigentes
      const soporteIdNum = typeof soporteId === 'number' ? soporteId : parseInt(soporteIdStr);
      
      // REGLA 3: Si estaba en "A Consultar" antes, volver a "A Consultar"
      const debeVolver = await debeVolverAConsultar(soporteIdNum);
      
      if (debeVolver) {
        await updateSoporte(soporteIdStr, { estado: 'A Consultar' });
        console.log(`✅ Soporte ${soporteIdStr} actualizado a "A Consultar" (estaba en "A Consultar" antes del alquiler)`);
      } else {
        // REGLA 4: Otros casos, cambiar a "Disponible"
        await updateSoporte(soporteIdStr, { estado: 'Disponible' });
        console.log(`✅ Soporte ${soporteIdStr} actualizado a Disponible (sin alquileres vigentes)`);
      }
    }
  } catch (error) {
    console.error(`❌ Error actualizando estado del soporte ${soporteId}:`, error);
    throw error;
  }
}

// Actualizar estados de todos los soportes basado en sus alquileres
// Esta función se puede llamar desde un CRON para actualizar estados diariamente
export async function actualizarEstadoSoportesAlquileres() {
  console.log('🔄 Iniciando actualización diaria de estados de soportes...');
  
  // Obtener todos los soportes para procesarlos
  const { data: todosSoportes } = await getSoportes({ limit: 10000 });
  
  if (!todosSoportes || todosSoportes.length === 0) {
    console.log('⚠️ No se encontraron soportes para actualizar');
    return {
      actualizados: 0,
      omitidos: 0,
      errores: 0,
      total: 0
    };
  }
  
  let actualizados = 0;
  let omitidos = 0;
  let errores = 0;
  
  // Actualizar cada soporte usando la función mejorada
  // La función actualizarEstadoSoporte ya maneja internamente las reglas:
  // - No cambiar "Reservado" ni "No disponible"
  // - Volver a "A Consultar" si estaba antes
  // - Cambiar a "Disponible" u "Ocupado" según alquileres vigentes
  for (const soporte of todosSoportes) {
    try {
      const estadoAnterior = soporte.estado || 'Disponible';
      
      // La función actualizarEstadoSoporte retorna void, pero podemos verificar cambios
      // obteniendo el estado después de la actualización
      await actualizarEstadoSoporte(soporte.id);
      
      // Verificar si hubo cambio (obtener el soporte actualizado)
      const soporteActualizado = await getSoporteById(String(soporte.id));
      if (soporteActualizado && soporteActualizado.estado !== estadoAnterior) {
        actualizados++;
      } else {
        omitidos++;
      }
    } catch (error) {
      console.error(`❌ Error actualizando soporte ${soporte.id}:`, error);
      errores++;
    }
  }
  
  console.log(`✅ Actualización de estados de soportes completada:`);
  console.log(`   - Actualizados: ${actualizados}`);
  console.log(`   - Omitidos (sin cambios necesarios): ${omitidos}`);
  console.log(`   - Errores: ${errores}`);
  console.log(`   - Total procesados: ${todosSoportes.length}`);
  
  return {
    actualizados,
    omitidos,
    errores,
    total: todosSoportes.length
  };
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

