import { getLineasByCotizacionId } from './supabaseCotizacionLineas'
import { getCotizacionById } from './supabaseCotizaciones'
import { getSoportes, updateSoporte } from './supabaseSoportes'
import { 
  createAlquiler, 
  generarSiguienteCodigoAlquiler, 
  getAllAlquileresParaActualizarSoportes,
  getAlquileresPorCotizacion,
  cancelarAlquileresDeCotizacion,
  getAlquileresVigentesPorSoporte,
  validarSolapeAlquileres
} from './supabaseAlquileres'
import { 
  registrarAlquilerCreado, 
  registrarAlquilerEliminado,
  addHistorialEvento,
  getHistorialSoporte,
  getUltimaReservaPorSoporte
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
      // VALIDACIÓN PREVENTIVA: Verificar solape con alquileres existentes
      // Esta validación es NO DESTRUCTIVA: solo lee datos, no modifica nada
      await validarSolapeAlquileres(
        info.soporte.id,
        info.fechaInicio,
        info.fechaFin,
        undefined, // No excluir ningún alquiler (es creación nueva)
        info.soporte.codigo // Código del soporte para mensaje de error claro
      );

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
      
      const soporteIdNum = typeof info.soporte.id === 'number' ? info.soporte.id : parseInt(String(info.soporte.id))
      const soporteActual = await getSoporteById(String(info.soporte.id))
      const estadoAnterior = soporteActual?.estado || 'Disponible'
      
      // Guardar en historial si estaba en "A Consultar" para poder restaurarlo después
      if (estadoAnterior === 'A Consultar') {
        try {
          await addHistorialEvento({
            soporte_id: soporteIdNum,
            tipo_evento: 'CAMBIO_ESTADO',
            descripcion: `Soporte salió de "A Consultar" por alquiler ${siguienteCodigo}. Se restaurará cuando finalice.`,
            realizado_por: null,
            datos: {
              estado_anterior: 'A Consultar',
              motivo: 'alquiler_creado',
              alquiler_codigo: siguienteCodigo,
              restaurar_a_consultar: true
            }
          })
        } catch (historialError) {
          console.warn('⚠️ Error guardando estado anterior "A Consultar" en historial:', historialError)
        }
      }
      
      // Recalcular estado del soporte según fechas (NO forzar "Ocupado")
      await actualizarEstadoSoporte(info.soporte.id)
      
      try {
        await registrarAlquilerCreado(
          soporteIdNum,
          cotizacionId,
          info.fechaInicio,
          info.fechaFin,
          info.importe
        )
      } catch (historialError) {
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
 * Actualizar estado de un soporte BASÁNDOSE SOLO EN FECHAS de sus alquileres.
 *
 * Reglas (en orden de prioridad):
 * 1. "No disponible" → no se toca (solo manual).
 * 2. "Reservado" manual (48h) → no se toca (tiene su propia lógica de expiración).
 * 3. Si existe alquiler donde inicio <= hoy <= fin → "Ocupado".
 * 4. Si existe alquiler futuro (inicio > hoy) a ≤ 30 días → "Reservado".
 * 5. Si no hay alquileres vigentes ni próximos (≤30d): "A Consultar" si estaba antes, sino "Disponible".
 */
/** Normaliza a fecha "solo día" en hora local (00:00:00) para evitar bugs de zona horaria. */
function toLocalDay(d: Date | string): Date {
  const x = typeof d === 'string' ? new Date(d) : d;
  const out = new Date(x.getFullYear(), x.getMonth(), x.getDate());
  out.setHours(0, 0, 0, 0);
  return out;
}

export async function actualizarEstadoSoporte(soporteId: string | number) {
  try {
    const soporteIdStr = typeof soporteId === 'number' ? String(soporteId) : soporteId;
    const soporte = await getSoporteById(soporteIdStr);

    if (!soporte) {
      console.error(`❌ Soporte ${soporteIdStr} no encontrado`);
      return;
    }

    const estadoActual = soporte.estado || 'Disponible';

    if (estadoActual === 'No disponible') return;

    const soporteIdNum = typeof soporteId === 'number' ? soporteId : parseInt(soporteIdStr, 10);

    // Si está Reservado, consultar historial para saber si es reserva protegida (manual o temporal no expirada)
    let esReservaProtegida = false;
    if (estadoActual === 'Reservado') {
      try {
        const ultimaReserva = await getUltimaReservaPorSoporte(soporteIdNum);
        if (ultimaReserva?.datos) {
          const { tipo, fecha_expiracion } = ultimaReserva.datos;
          if (tipo === 'reserva_manual') {
            esReservaProtegida = true;
          } else if (tipo === 'reserva_temporal' && fecha_expiracion) {
            const expiracion = new Date(String(fecha_expiracion));
            if (expiracion.getTime() > Date.now()) esReservaProtegida = true;
          }
        }
      } catch {
        esReservaProtegida = false;
      }
    }

    // Obtener alquileres del soporte con fin >= hoy (vigentes por fecha)
    const alquileresVigentes = await getAlquileresVigentesPorSoporte(soporteId);

    const hoy = toLocalDay(new Date());
    const hoyMas30 = new Date(hoy);
    hoyMas30.setDate(hoyMas30.getDate() + 30);
    hoyMas30.setHours(0, 0, 0, 0);

    let tieneAlquilerActivo = false;
    let tieneAlquilerProximo30d = false;

    for (const alq of alquileresVigentes) {
      const inicio = toLocalDay(alq.inicio);
      const fin = toLocalDay(alq.fin);

      // Ocupado: solo si hoy está entre inicio y fin (inclusive)
      if (inicio.getTime() <= hoy.getTime() && hoy.getTime() <= fin.getTime()) {
        tieneAlquilerActivo = true;
        break;
      }

      // Reservado por alquiler próximo: inicio > hoy y inicio <= hoy + 30 días
      if (inicio.getTime() > hoy.getTime() && inicio.getTime() <= hoyMas30.getTime()) {
        tieneAlquilerProximo30d = true;
      }
    }

    let nuevoEstado: string;

    if (tieneAlquilerActivo) {
      nuevoEstado = 'Ocupado';
    } else if (tieneAlquilerProximo30d) {
      nuevoEstado = 'Reservado';
    } else {
      // Sin alquileres vigentes ni próximos a 30d: escudo solo evita bajar a Disponible
      if (esReservaProtegida) {
        nuevoEstado = 'Reservado';
      } else {
        const debeVolver = await debeVolverAConsultar(soporteIdNum);
        nuevoEstado = debeVolver ? 'A Consultar' : 'Disponible';
      }
    }

    if (estadoActual !== nuevoEstado) {
      await updateSoporte(soporteIdStr, { estado: nuevoEstado });
      console.log(`✅ Soporte ${soporteIdStr}: ${estadoActual} → ${nuevoEstado}`);
    }
  } catch (error) {
    console.error(`❌ Error actualizando estado del soporte ${soporteId}:`, error);
    throw error;
  }
}

// Actualizar estados de todos los soportes basado en sus alquileres
/**
 * Verificar y notificar alquileres próximos a finalizar
 * Notifica a ventas sobre alquileres que finalizan en los próximos 7 días
 */
export async function verificarYNotificarAlquileresProximosFinalizar() {
  console.log('🔔 Iniciando verificación de alquileres próximos a finalizar...');
  
  try {
    const { getAlquileres } = await import('@/lib/supabaseAlquileres');
    const { notificarAlquilerProximoFinalizar } = await import('@/lib/notificaciones');
    const { getSupabaseAdmin } = await import('@/lib/supabaseServer');
    
    // Obtener todos los alquileres activos
    const { data: alquileres } = await getAlquileres({ estado: 'activo', limit: 10000 });
    
    if (!alquileres || alquileres.length === 0) {
      console.log('⚠️ No se encontraron alquileres activos');
      return { notificados: 0, omitidos: 0 };
    }
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const supabase = getSupabaseAdmin();
    let notificados = 0;
    let omitidos = 0;
    
    for (const alquiler of alquileres) {
      try {
        if (!alquiler.fin) continue;
        
        const fechaFin = new Date(alquiler.fin);
        fechaFin.setHours(0, 0, 0, 0);
        
        // Calcular días restantes
        const diffMs = fechaFin.getTime() - hoy.getTime();
        const diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        
        // Solo notificar si está entre 1 y 7 días
        if (diasRestantes > 0 && diasRestantes <= 7) {
          // Verificar si ya existe una notificación reciente para este alquiler (últimas 24h)
          const ayer = new Date();
          ayer.setDate(ayer.getDate() - 1);
          
          const { data: notificacionesExistentes } = await supabase
            .from('notificaciones')
            .select('id')
            .eq('entidad_tipo', 'alquiler')
            .eq('entidad_id', alquiler.id)
            .gte('created_at', ayer.toISOString())
            .limit(1);
          
          // Si ya existe una notificación reciente, omitir
          if (notificacionesExistentes && notificacionesExistentes.length > 0) {
            omitidos++;
            continue;
          }
          
          // Crear notificación
          await notificarAlquilerProximoFinalizar(alquiler.id, diasRestantes);
          notificados++;
          console.log(`✅ Notificación creada para alquiler ${alquiler.codigo || alquiler.id} (${diasRestantes} días restantes)`);
        }
      } catch (error) {
        console.error(`❌ Error procesando alquiler ${alquiler.id}:`, error);
        omitidos++;
      }
    }
    
    console.log(`✅ Verificación de alquileres próximos completada: ${notificados} notificados, ${omitidos} omitidos`);
    return { notificados, omitidos };
  } catch (error) {
    console.error('❌ Error en verificarYNotificarAlquileresProximosFinalizar:', error);
    return { notificados: 0, omitidos: 0 };
  }
}

/**
 * CRON diario: primero sincroniza alquileres (fechas → estado en BD),
 * después recalcula estado de cada soporte (basado en fechas de alquileres).
 */
export async function actualizarEstadoSoportesAlquileres() {
  const { sincronizarEstadosAlquileresDiario } = await import('@/lib/supabaseAlquileres');

  // FASE 1: Sincronizar estados de alquileres según fechas
  console.log('🔄 FASE 1: Sincronizando estados de alquileres...');
  const resAlquileres = await sincronizarEstadosAlquileresDiario();

  // FASE 2: Actualizar estados de soportes según fechas de alquileres
  console.log('🔄 FASE 2: Actualizando estados de soportes...');
  const { data: todosSoportes } = await getSoportes({ limit: 10000 });

  if (!todosSoportes || todosSoportes.length === 0) {
    console.log('⚠️ No se encontraron soportes para actualizar');
    return { alquileres: resAlquileres, soportes: { actualizados: 0, omitidos: 0, errores: 0, total: 0 } };
  }

  let actualizados = 0;
  let omitidos = 0;
  let errores = 0;

  for (const soporte of todosSoportes) {
    try {
      const estadoAnterior = soporte.estado || 'Disponible';
      await actualizarEstadoSoporte(soporte.id);
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

  console.log(`✅ Soportes: ${actualizados} actualizados, ${omitidos} sin cambios, ${errores} errores (${todosSoportes.length} total)`);

  return {
    alquileres: resAlquileres,
    soportes: { actualizados, omitidos, errores, total: todosSoportes.length }
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

