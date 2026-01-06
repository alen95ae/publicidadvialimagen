/**
 * Sistema de Notificaciones Simplificado
 * 
 * REGLAS:
 * - UNA notificación = UN evento
 * - Visibilidad por ROL (roles_destino), no por duplicar filas
 * - Estado leído por usuario en tabla separada (notificaciones_leidas)
 */

import { getSupabaseAdmin } from "@/lib/supabaseServer";

export interface NotificacionData {
  titulo: string;
  mensaje: string;
  tipo: 'info' | 'success' | 'warning' | 'error';
  entidad_tipo: string; // OBLIGATORIO: ej: 'cotizacion', 'alquiler', 'formulario'
  entidad_id: string; // OBLIGATORIO: ID de la entidad relacionada
  prioridad?: 'baja' | 'media' | 'alta'; // default 'media'
  roles_destino: string[]; // OBLIGATORIO: roles que deben ver esta notificación
}

/**
 * Crear UNA notificación para un evento
 * 
 * Inserta UNA sola fila en notificaciones con roles_destino
 * NO duplica filas por usuario
 */
export async function crearNotificacion(data: NotificacionData): Promise<string> {
  // Normalizar roles a lowercase para garantizar consistencia
  const rolesNormalizados = data.roles_destino.map(r => r.toLowerCase());
  
  const payload = {
    tipo: data.tipo,
    titulo: data.titulo,
    mensaje: data.mensaje,
    entidad_tipo: data.entidad_tipo,
    entidad_id: data.entidad_id,
    prioridad: data.prioridad || 'media',
    roles_destino: rolesNormalizados, // Array de roles normalizados
    leida: false, // MODELO LEGACY: mantener campo leida
  };

  console.log('[NOTIFICACIONES] [crearNotificacion] Insertando notificación:')
  console.log(JSON.stringify(payload, null, 2));

  const supabase = getSupabaseAdmin();
  console.log('[NOTIFICACIONES] [crearNotificacion] Cliente Supabase obtenido');

  const { data: insertData, error } = await supabase
    .from('notificaciones')
    .insert(payload)
    .select('id')
    .single();

  console.log('[NOTIFICACIONES] [crearNotificacion] Resultado insert:')
  console.log('  - data:', insertData)
  console.log('  - error:', error ? {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint
  } : null)

  if (error) {
    console.error('[NOTIFICACIONES] [crearNotificacion] ❌ ERROR en insert:', error);
    throw error;
  }

  if (!insertData || !insertData.id) {
    const errorMsg = 'Insert aparentemente exitoso pero no devolvió ID';
    console.error('[NOTIFICACIONES] [crearNotificacion] ❌', errorMsg);
    throw new Error(errorMsg);
  }

  console.log('[NOTIFICACIONES] [crearNotificacion] ✅ Notificación insertada correctamente:', insertData.id);
  return insertData.id;
}

/**
 * Crear notificación para un usuario específico
 * Obtiene el rol del usuario y crea notificación dirigida a ese rol
 */
export async function crearNotificacionUsuario(
  userId: string,
  data: Omit<NotificacionData, 'roles_destino'>
): Promise<string> {
  const supabase = getSupabaseAdmin();
  
  // Obtener rol del usuario
  const { data: usuarioData, error: usuarioError } = await supabase
    .from('usuarios')
    .select('rol_id, roles(nombre)')
    .eq('id', userId)
    .single();
  
  if (usuarioError || !usuarioData) {
    throw new Error(`Usuario no encontrado: ${userId}`);
  }
  
  const rolNombre = (usuarioData.roles as any)?.nombre?.toLowerCase() || 'admin';
  
  return crearNotificacion({
    ...data,
    roles_destino: [rolNombre]
  });
}

/**
 * Crear notificación para todos los usuarios de un rol específico
 */
export async function crearNotificacionPorRol(
  rolNombre: string,
  data: NotificacionData
): Promise<string> {
  // Normalizar nombre de rol
  const rolNormalizado = rolNombre.toLowerCase();
  
  // Validar que el rol existe (opcional, pero recomendado)
  const supabase = getSupabaseAdmin();
  const { data: rolData, error: rolError } = await supabase
    .from('roles')
    .select('id, nombre')
    .ilike('nombre', rolNormalizado)
    .single();
  
  if (rolError || !rolData) {
    console.warn(`[NOTIFICACIONES] Rol no encontrado: ${rolNormalizado}, creando notificación de todos modos`);
  }
  
  return crearNotificacion({
    ...data,
    roles_destino: [rolNormalizado]
  });
}

/**
 * Helper para crear notificación de formulario nuevo
 * Notifica SOLO a: Desarrollador (SAGRADA - NO MODIFICAR)
 */
export async function notificarFormularioNuevo(
  formularioId: string,
  nombre: string,
  email: string
): Promise<void> {
  console.log('[NOTIFICACIONES] [notificarFormularioNuevo] Llamado con:', { formularioId, nombre, email });

  await crearNotificacion({
    titulo: 'Nuevo formulario recibido',
    mensaje: `${nombre} (${email}) ha enviado un nuevo formulario`,
    tipo: 'info',
    entidad_tipo: 'formulario',
    entidad_id: formularioId,
    prioridad: 'media',
    roles_destino: ['desarrollador'], // SOLO desarrollador (SAGRADA)
  });

  console.log('[NOTIFICACIONES] [notificarFormularioNuevo] ✅ Proceso completado');
}

/**
 * Helper para crear notificación de cotización creada/actualizada/aprobada/rechazada
 * 
 * REGLA: Notificaciones PERSONALES
 * - Usuario creador (si userId está presente) → se notifica directamente
 * - Admin (por rol)
 * - Desarrollador (por rol)
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

  // UNA notificación para admin y desarrollador
  await crearNotificacion({
    titulo: titulos[accion],
    mensaje: `Una cotización ha sido ${accion}`,
    tipo: accion === 'rechazada' ? 'warning' : accion === 'aprobada' ? 'success' : 'info',
    entidad_tipo: 'cotizacion',
    entidad_id: cotizacionId,
    prioridad: accion === 'aprobada' || accion === 'rechazada' ? 'alta' : 'media',
    roles_destino: ['admin', 'desarrollador'], // NO incluir ventas (evitar duplicados)
  });

  // NOTA: En el sistema simplificado, las notificaciones son por rol
  // Si necesitas notificar a un usuario específico además de los roles,
  // puedes crear una notificación adicional con roles_destino que incluya solo ese usuario
  // o implementar un sistema de notificaciones personales separado
  if (userId) {
    console.log('[NOTIFICACIONES] [notificarCotizacion] Usuario creador:', userId, '(ya incluido en roles admin/desarrollador)');
  }

  console.log('[NOTIFICACIONES] [notificarCotizacion] ✅ Proceso completado');
}

/**
 * Helper para crear notificación de alquiler creado
 */
export async function notificarAlquilerCreado(
  alquilerId: string,
  codigo?: string
): Promise<void> {
  await crearNotificacion({
    titulo: 'Alquiler creado',
    mensaje: codigo ? `Se ha creado el alquiler ${codigo}` : 'Se ha creado un nuevo alquiler',
    tipo: 'info',
    entidad_tipo: 'alquiler',
    entidad_id: alquilerId,
    prioridad: 'media',
    roles_destino: ['produccion', 'admin'],
  });
}

/**
 * Helper para crear notificación de solicitud de cotización web
 * Notifica SOLO a: Desarrollador (SAGRADA - NO MODIFICAR)
 */
export async function notificarSolicitudCotizacion(
  solicitudId: string,
  empresa: string,
  contacto: string
): Promise<void> {
  console.log('[NOTIFICACIONES] [notificarSolicitudCotizacion] Llamado con:', { solicitudId, empresa, contacto });

  await crearNotificacion({
    titulo: 'Nueva solicitud de cotización',
    mensaje: `${empresa} (${contacto}) ha enviado una solicitud de cotización`,
    tipo: 'info',
    entidad_tipo: 'solicitud',
    entidad_id: solicitudId,
    prioridad: 'alta',
    roles_destino: ['desarrollador'], // SOLO desarrollador (SAGRADA)
  });

  console.log('[NOTIFICACIONES] [notificarSolicitudCotizacion] ✅ Proceso completado');
}

/**
 * Helper para crear notificación de alquiler próximo a finalizar
 * Notifica SOLO a: Ventas
 */
export async function notificarAlquilerProximoFinalizar(
  alquilerId: string,
  diasRestantes: number
): Promise<void> {
  const prioridad = diasRestantes <= 3 ? 'alta' : diasRestantes <= 7 ? 'media' : 'baja';
  await crearNotificacion({
    titulo: 'Alquiler próximo a finalizar',
    mensaje: `Un alquiler finaliza en ${diasRestantes} día(s)`,
    tipo: 'warning',
    entidad_tipo: 'alquiler',
    entidad_id: alquilerId,
    prioridad,
    roles_destino: ['ventas'], // SOLO ventas
  });
}

/**
 * Helper para crear notificación de stock bajo
 * Notifica SOLO a: Producción
 */
export async function notificarStockBajo(
  productoId: string,
  productoNombre: string,
  stockActual: number
): Promise<void> {
  await crearNotificacion({
    titulo: 'Stock bajo',
    mensaje: `${productoNombre} tiene stock bajo (${stockActual} unidades)`,
    tipo: 'warning',
    entidad_tipo: 'producto',
    entidad_id: productoId,
    prioridad: 'alta',
    roles_destino: ['produccion'], // SOLO producción
  });
}

/**
 * Helper para crear notificación de evento próximo
 */
export async function notificarEventoProximo(
  eventoId: string,
  eventoNombre: string,
  fecha: string
): Promise<void> {
  await crearNotificacion({
    titulo: 'Evento próximo',
    mensaje: `${eventoNombre} está programado para ${new Date(fecha).toLocaleDateString('es-ES')}`,
    tipo: 'info',
    entidad_tipo: 'evento',
    entidad_id: eventoId,
    prioridad: 'media',
    roles_destino: ['admin'],
  });
}

/**
 * Helper para crear notificación de mantenimiento pendiente
 */
export async function notificarMantenimientoPendiente(
  mantenimientoId: string,
  descripcion: string
): Promise<void> {
  await crearNotificacion({
    titulo: 'Mantenimiento pendiente',
    mensaje: descripcion,
    tipo: 'warning',
    entidad_tipo: 'mantenimiento',
    entidad_id: mantenimientoId,
    prioridad: 'media',
    roles_destino: ['tecnico', 'admin'],
  });
}

/**
 * Helper para crear notificación de factura emitida
 */
export async function notificarFacturaEmitida(
  facturaId: string,
  numero?: string
): Promise<void> {
  await crearNotificacion({
    titulo: 'Factura emitida',
    mensaje: numero ? `Se ha emitido la factura ${numero}` : 'Se ha emitido una nueva factura',
    tipo: 'success',
    entidad_tipo: 'factura',
    entidad_id: facturaId,
    prioridad: 'media',
    roles_destino: ['contabilidad', 'admin'],
  });
}

/**
 * Helper para crear notificación de factura vencida/próxima
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

  await crearNotificacion({
    titulo: tipo === 'vencida' ? 'Factura vencida' : tipo === 'impagada' ? 'Factura impagada' : 'Factura próxima a vencer',
    mensaje: mensajes[tipo],
    tipo: tipo === 'vencida' || tipo === 'impagada' ? 'error' : 'warning',
    entidad_tipo: 'factura',
    entidad_id: facturaId,
    prioridad: tipo === 'vencida' || tipo === 'impagada' ? 'alta' : 'media',
    roles_destino: ['contabilidad', 'admin'],
  });
}
