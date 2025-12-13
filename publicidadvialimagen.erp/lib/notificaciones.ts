/**
 * Helper centralizado para crear notificaciones del sistema
 * 
 * Este módulo proporciona funciones para crear notificaciones que se mostrarán
 * a usuarios específicos o a todos los usuarios de un rol determinado.
 * 
 * IMPORTANTE:
 * - Siempre usar getSupabaseAdmin() para inserts (bypass RLS)
 * - Las notificaciones deben tener user_id o rol_id, nunca ambos vacíos
 * - Las notificaciones por rol se expanden automáticamente a usuarios
 */

import { getSupabaseAdmin } from "@/lib/supabaseServer";

export interface NotificacionData {
  titulo: string;
  mensaje: string;
  tipo: 'info' | 'success' | 'warning' | 'error';
  entidad_tipo: string; // OBLIGATORIO: ej: 'cotizacion', 'alquiler', 'formulario'
  entidad_id: string; // OBLIGATORIO: ID de la entidad relacionada
  // NOTA: url NO se guarda en BD (la tabla no tiene esa columna)
  // Se construye en el frontend desde entidad_tipo y entidad_id
  prioridad?: 'baja' | 'media' | 'alta'; // default 'media'
}

/**
 * Crea una notificación para un usuario específico
 * 
 * IMPLEMENTACIÓN DIRECTA - Sin abstracciones
 * Copia exacta del código que funciona en /api/debug/notificaciones-hard-test
 */
export async function crearNotificacionUsuario(
  userId: string,
  data: NotificacionData
): Promise<void> {
  // Payload exacto según estructura de tabla
  const payload = {
    user_id: userId,
    tipo: data.tipo,
    titulo: data.titulo,
    mensaje: data.mensaje,
    entidad_tipo: data.entidad_tipo || null,
    entidad_id: data.entidad_id || null,
    prioridad: data.prioridad || 'media',
    leida: false,
  };

  console.log('[NOTIFICACIONES] [crearNotificacionUsuario] Insertando notificación:')
  console.log(JSON.stringify(payload, null, 2));

  // Obtener cliente Supabase Admin (mismo código que hard-test)
  const supabase = getSupabaseAdmin();
  console.log('[NOTIFICACIONES] [crearNotificacionUsuario] Cliente Supabase obtenido');

  // INSERT DIRECTO (mismo código que hard-test)
  const { data: insertData, error } = await supabase
    .from('notificaciones')
    .insert(payload)
    .select();

  console.log('[NOTIFICACIONES] [crearNotificacionUsuario] Resultado insert:')
  console.log('  - data:', insertData)
  console.log('  - error:', error ? {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint
  } : null)

  // NO silenciar errores - lanzar siempre
  if (error) {
    console.error('[NOTIFICACIONES] [crearNotificacionUsuario] ❌ ERROR en insert:', error);
    throw error;
  }

  if (!insertData || insertData.length === 0) {
    const errorMsg = 'Insert aparentemente exitoso pero no devolvió datos';
    console.error('[NOTIFICACIONES] [crearNotificacionUsuario] ❌', errorMsg);
    throw new Error(errorMsg);
  }

  console.log('[NOTIFICACIONES] [crearNotificacionUsuario] ✅ Notificación insertada correctamente:', insertData[0].id);
}

/**
 * Crea notificaciones para todos los usuarios de un rol
 * 
 * IMPLEMENTACIÓN: Llama crearNotificacionUsuario() uno a uno
 * Si falla uno, loguea pero continúa con los demás
 */
export async function crearNotificacionPorRol(
  rolNombre: string,
  data: NotificacionData
): Promise<void> {
  console.log('[NOTIFICACIONES] [crearNotificacionPorRol] Iniciando para rol:', rolNombre);

  const supabase = getSupabaseAdmin();

  // 1. Obtener el rol_id desde el nombre (SIN .single() - puede haber 0 o más)
  const { data: rolesData, error: rolError } = await supabase
    .from('roles')
    .select('id')
    .eq('nombre', rolNombre);

  if (rolError) {
    console.error('[NOTIFICACIONES] [crearNotificacionPorRol] ❌ Error obteniendo rol:', rolError);
    throw rolError;
  }

  if (!rolesData || rolesData.length === 0) {
    console.warn(`[NOTIFICACIONES] [crearNotificacionPorRol] ⚠️ Rol "${rolNombre}" no encontrado - continuando sin error`);
    return; // No lanzar error, solo loguear y continuar
  }

  // Si hay varios roles con el mismo nombre, usar el primero
  const rolData = rolesData[0];
  console.log('[NOTIFICACIONES] [crearNotificacionPorRol] Rol encontrado:', rolData.id, `(${rolesData.length} coincidencias)`);

  // 2. Obtener todos los usuarios con ese rol
  const { data: usuariosData, error: usuariosError } = await supabase
    .from('usuarios')
    .select('id')
    .eq('rol_id', rolData.id);

  if (usuariosError) {
    console.error('[NOTIFICACIONES] [crearNotificacionPorRol] ❌ Error obteniendo usuarios:', usuariosError);
    throw usuariosError;
  }

  if (!usuariosData || usuariosData.length === 0) {
    console.warn(`[NOTIFICACIONES] [crearNotificacionPorRol] ⚠️ No hay usuarios con rol "${rolNombre}"`);
    return;
  }

  console.log(`[NOTIFICACIONES] [crearNotificacionPorRol] Encontrados ${usuariosData.length} usuarios con rol "${rolNombre}"`);

  // 3. Crear notificación para cada usuario (uno a uno)
  let exitosos = 0;
  let fallidos = 0;

  for (const usuario of usuariosData) {
    try {
      await crearNotificacionUsuario(usuario.id, data);
      exitosos++;
    } catch (error) {
      fallidos++;
      console.error(`[NOTIFICACIONES] [crearNotificacionPorRol] ❌ Error notificando a usuario ${usuario.id}:`, error);
      // Continuar con siguiente usuario
    }
  }

  console.log(`[NOTIFICACIONES] [crearNotificacionPorRol] ✅ Completado: ${exitosos} exitosos, ${fallidos} fallidos`);
  
  if (exitosos === 0 && fallidos > 0) {
    throw new Error(`No se pudo crear ninguna notificación para el rol "${rolNombre}" (${fallidos} fallos)`);
  }
}

/**
 * Helper para crear notificación de formulario nuevo
 * 
 * REGLA: Notificaciones POR ROL (todos los usuarios del rol)
 * - Admin (por rol)
 * - Ventas (por rol)
 * - Desarrollador (por rol)
 */
export async function notificarFormularioNuevo(
  formularioId: string,
  nombre: string,
  email: string
): Promise<void> {
  console.log('[NOTIFICACIONES] [notificarFormularioNuevo] Llamado con:', { formularioId, nombre, email });

  const data: NotificacionData = {
    titulo: 'Nuevo formulario recibido',
    mensaje: `${nombre} (${email}) ha enviado un nuevo formulario`,
    tipo: 'info',
    entidad_tipo: 'formulario',
    entidad_id: formularioId,
    prioridad: 'media',
  };

  // Notificar a admin (POR ROL)
  try {
    console.log('[NOTIFICACIONES] [notificarFormularioNuevo] Notificando a admin (por rol)...');
    await crearNotificacionPorRol('admin', data);
    console.log('[NOTIFICACIONES] [notificarFormularioNuevo] ✅ Admin notificado');
  } catch (error) {
    console.error('[NOTIFICACIONES] [notificarFormularioNuevo] ❌ Error notificando a admin:', error);
    // Continuar - no fallar el evento principal
  }

  // Notificar a ventas (POR ROL)
  try {
    console.log('[NOTIFICACIONES] [notificarFormularioNuevo] Notificando a ventas (por rol)...');
    await crearNotificacionPorRol('ventas', data);
    console.log('[NOTIFICACIONES] [notificarFormularioNuevo] ✅ Ventas notificado');
  } catch (error) {
    console.warn('[NOTIFICACIONES] [notificarFormularioNuevo] ⚠️ Error notificando a ventas (continuando):', error);
    // Continuar pero loguear
  }

  // Notificar a desarrollador (POR ROL)
  try {
    console.log('[NOTIFICACIONES] [notificarFormularioNuevo] Notificando a desarrollador (por rol)...');
    await crearNotificacionPorRol('desarrollador', data);
    console.log('[NOTIFICACIONES] [notificarFormularioNuevo] ✅ Desarrollador notificado');
  } catch (error) {
    console.warn('[NOTIFICACIONES] [notificarFormularioNuevo] ⚠️ Error notificando a desarrollador (continuando):', error);
    // Continuar pero loguear
  }

  console.log('[NOTIFICACIONES] [notificarFormularioNuevo] ✅ Proceso completado');
}

/**
 * Helper para crear notificación de cotización creada/actualizada/aprobada/rechazada
 * Notifica a: Ventas, Administrador, Desarrollador
 */
/**
 * Helper para crear notificación de cotización creada/actualizada/aprobada/rechazada
 * 
 * REGLA: Notificaciones PERSONALES (NO por rol ventas)
 * - Usuario creador (si userId está presente)
 * - Admin (por rol)
 * - Desarrollador (usuario específico, no por rol)
 */
export async function notificarCotizacion(
  cotizacionId: string,
  accion: 'creada' | 'actualizada' | 'aprobada' | 'rechazada',
  userId?: string
): Promise<void> {
  console.log('[NOTIFICACIONES] [notificarCotizacion] Llamado con:', { cotizacionId, accion, userId });

  const titulos = {
    creada: 'Cotización creada',
    actualizada: 'Cotización actualizada',
    aprobada: 'Cotización aprobada',
    rechazada: 'Cotización rechazada',
  };

  const data: NotificacionData = {
    titulo: titulos[accion],
    mensaje: `Una cotización ha sido ${accion}`,
    tipo: accion === 'rechazada' ? 'warning' : accion === 'aprobada' ? 'success' : 'info',
    entidad_tipo: 'cotizacion',
    entidad_id: cotizacionId,
    prioridad: accion === 'aprobada' || accion === 'rechazada' ? 'alta' : 'media',
  };

  // 1. Notificar al usuario creador (PERSONAL - no por rol)
  if (userId) {
    try {
      console.log('[NOTIFICACIONES] [notificarCotizacion] Notificando a usuario creador:', userId);
      await crearNotificacionUsuario(userId, data);
      console.log('[NOTIFICACIONES] [notificarCotizacion] ✅ Usuario creador notificado');
    } catch (error) {
      console.error('[NOTIFICACIONES] [notificarCotizacion] ❌ Error notificando a usuario creador:', error);
      // Continuar - no fallar el evento principal
    }
  }

  // 2. Notificar a admin (POR ROL)
  try {
    console.log('[NOTIFICACIONES] [notificarCotizacion] Notificando a admin (por rol)...');
    await crearNotificacionPorRol('admin', data);
    console.log('[NOTIFICACIONES] [notificarCotizacion] ✅ Admin notificado');
  } catch (error) {
    console.error('[NOTIFICACIONES] [notificarCotizacion] ❌ Error notificando a admin:', error);
    // Continuar - no fallar el evento principal
  }

  // 3. Notificar a desarrollador (PERSONAL - obtener ID del desarrollador)
  try {
    console.log('[NOTIFICACIONES] [notificarCotizacion] Notificando a desarrollador...');
    const supabase = getSupabaseAdmin();
    
    // Obtener rol desarrollador
    const { data: devRolData } = await supabase
      .from('roles')
      .select('id')
      .eq('nombre', 'desarrollador')
      .limit(1);
    
    if (devRolData && devRolData.length > 0) {
      // Obtener usuarios desarrollador
      const { data: devUsuarios } = await supabase
        .from('usuarios')
        .select('id')
        .eq('rol_id', devRolData[0].id);
      
      if (devUsuarios && devUsuarios.length > 0) {
        // Notificar a cada desarrollador (personal, no por rol)
        for (const dev of devUsuarios) {
          try {
            await crearNotificacionUsuario(dev.id, data);
          } catch (error) {
            console.error(`[NOTIFICACIONES] [notificarCotizacion] Error notificando a desarrollador ${dev.id}:`, error);
          }
        }
        console.log('[NOTIFICACIONES] [notificarCotizacion] ✅ Desarrolladores notificados');
      }
    }
  } catch (error) {
    console.warn('[NOTIFICACIONES] [notificarCotizacion] ⚠️ Error notificando a desarrollador (continuando):', error);
  }

  console.log('[NOTIFICACIONES] [notificarCotizacion] ✅ Proceso completado');
}

/**
 * Helper para crear notificación de alquiler creado
 * Notifica a: Producción, Administrador, Desarrollador
 */
export async function notificarAlquilerCreado(
  alquilerId: string,
  codigo?: string
): Promise<void> {
  const data: NotificacionData = {
    titulo: 'Alquiler creado',
    mensaje: codigo ? `Se ha creado el alquiler ${codigo}` : 'Se ha creado un nuevo alquiler',
    tipo: 'info',
    entidad_tipo: 'alquiler',
    entidad_id: alquilerId,
    prioridad: 'media',
  };

  // Notificar a producción
  try {
    await crearNotificacionPorRol('produccion', data);
  } catch (error) {
    // Si el rol producción no existe, continuar sin error
  }

  // Notificar a admin
  try {
    await crearNotificacionPorRol('admin', data);
  } catch (error) {
    console.warn('⚠️ Error notificando a admin:', error);
  }

  // Notificar a desarrollador (siempre recibe todas)
  try {
    await crearNotificacionPorRol('desarrollador', data);
  } catch (error) {
    // Si el rol desarrollador no existe, continuar sin error
  }
}

/**
 * Helper para crear notificación de alquiler próximo a finalizar
 * Notifica a: Producción, Administrador, Ventas, Desarrollador
 */
export async function notificarAlquilerProximoFinalizar(
  alquilerId: string,
  diasRestantes: number,
  userId?: string
): Promise<void> {
  const prioridad = diasRestantes <= 3 ? 'alta' : diasRestantes <= 7 ? 'media' : 'baja';
  const data: NotificacionData = {
    titulo: 'Alquiler próximo a finalizar',
    mensaje: `Un alquiler finaliza en ${diasRestantes} día(s)`,
    tipo: 'warning',
    entidad_tipo: 'alquiler',
    entidad_id: alquilerId,
    prioridad,
  };

  if (userId) {
    try {
      await crearNotificacionUsuario(userId, data);
    } catch (error) {
      console.warn('⚠️ Error notificando a usuario específico:', error);
    }
  }

  // Notificar a producción
  try {
    await crearNotificacionPorRol('produccion', data);
  } catch (error) {
    // Si el rol producción no existe, continuar sin error
  }

  // Notificar a admin
  try {
    await crearNotificacionPorRol('admin', data);
  } catch (error) {
    console.warn('⚠️ Error notificando a admin:', error);
  }

  // Notificar a ventas
  try {
    await crearNotificacionPorRol('ventas', data);
  } catch (error) {
    // Si el rol ventas no existe, continuar sin error
  }

  // Notificar a desarrollador (siempre recibe todas)
  try {
    await crearNotificacionPorRol('desarrollador', data);
  } catch (error) {
    // Si el rol desarrollador no existe, continuar sin error
  }
}

/**
 * Helper para crear notificación de stock bajo
 */
export async function notificarStockBajo(
  productoId: string,
  productoNombre: string,
  stockActual: number
): Promise<void> {
  await crearNotificacionPorRol('admin', {
    titulo: 'Stock bajo',
    mensaje: `${productoNombre} tiene stock bajo (${stockActual} unidades)`,
    tipo: 'warning',
    entidad_tipo: 'producto',
    entidad_id: productoId,
    prioridad: 'alta',
  });
}

/**
 * Helper para crear notificación de evento próximo
 */
export async function notificarEventoProximo(
  eventoId: string,
  eventoNombre: string,
  fecha: string,
  userId?: string
): Promise<void> {
  const data: NotificacionData = {
    titulo: 'Evento próximo',
    mensaje: `${eventoNombre} está programado para ${new Date(fecha).toLocaleDateString('es-ES')}`,
    tipo: 'info',
    entidad_tipo: 'evento',
    entidad_id: eventoId,
    url: `/panel/calendario?evento=${eventoId}`,
    prioridad: 'media',
  };

  if (userId) {
    await crearNotificacionUsuario(userId, data);
  } else {
    await crearNotificacionPorRol('admin', data);
  }
}

/**
 * Helper para crear notificación de mantenimiento pendiente
 */
export async function notificarMantenimientoPendiente(
  mantenimientoId: string,
  descripcion: string
): Promise<void> {
  await crearNotificacionPorRol('tecnico', {
    titulo: 'Mantenimiento pendiente',
    mensaje: descripcion,
    tipo: 'warning',
    entidad_tipo: 'mantenimiento',
    entidad_id: mantenimientoId,
    prioridad: 'media',
  });
}

/**
 * Helper para crear notificación de factura emitida
 * Notifica a: Contabilidad, Administrador, Desarrollador
 */
export async function notificarFacturaEmitida(
  facturaId: string,
  numero?: string
): Promise<void> {
  const data: NotificacionData = {
    titulo: 'Factura emitida',
    mensaje: numero ? `Se ha emitido la factura ${numero}` : 'Se ha emitido una nueva factura',
    tipo: 'success',
    entidad_tipo: 'factura',
    entidad_id: facturaId,
    prioridad: 'media',
  };

  // Notificar a contabilidad
  try {
    await crearNotificacionPorRol('contabilidad', data);
  } catch (error) {
    // Si el rol contabilidad no existe, continuar sin error
  }

  // Notificar a admin
  try {
    await crearNotificacionPorRol('admin', data);
  } catch (error) {
    console.warn('⚠️ Error notificando a admin:', error);
  }

  // Notificar a desarrollador (siempre recibe todas)
  try {
    await crearNotificacionPorRol('desarrollador', data);
  } catch (error) {
    // Si el rol desarrollador no existe, continuar sin error
  }
}

/**
 * Helper para crear notificación de factura vencida/próxima
 * Notifica a: Contabilidad, Administrador, Desarrollador
 */
export async function notificarFactura(
  facturaId: string,
  tipo: 'vencida' | 'proxima' | 'impagada',
  dias: number
): Promise<void> {
  const mensajes = {
    vencida: 'Una factura está vencida',
    proxima: `Una factura vence en ${dias} día(s)`,
    impagada: 'Una factura está impagada',
  };

  const data: NotificacionData = {
    titulo: tipo === 'vencida' ? 'Factura vencida' : tipo === 'impagada' ? 'Factura impagada' : 'Factura próxima a vencer',
    mensaje: mensajes[tipo],
    tipo: tipo === 'vencida' || tipo === 'impagada' ? 'error' : 'warning',
    entidad_tipo: 'factura',
    entidad_id: facturaId,
    prioridad: tipo === 'vencida' || tipo === 'impagada' ? 'alta' : 'media',
  };

  // Notificar a contabilidad
  try {
    await crearNotificacionPorRol('contabilidad', data);
  } catch (error) {
    // Si el rol contabilidad no existe, continuar sin error
  }

  // Notificar a admin
  try {
    await crearNotificacionPorRol('admin', data);
  } catch (error) {
    console.warn('⚠️ Error notificando a admin:', error);
  }

  // Notificar a desarrollador (siempre recibe todas)
  try {
    await crearNotificacionPorRol('desarrollador', data);
  } catch (error) {
    // Si el rol desarrollador no existe, continuar sin error
  }
}
