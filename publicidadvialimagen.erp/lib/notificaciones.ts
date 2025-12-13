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
  entidad_tipo?: string; // ej: 'cotizacion', 'alquiler', 'formulario'
  entidad_id?: string; // ID de la entidad relacionada
  url?: string; // URL opcional para navegar
}

/**
 * Crea una notificación para un usuario específico
 */
export async function crearNotificacionUsuario(
  userId: string,
  data: NotificacionData
): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();

    const { error } = await supabase.from('notificaciones').insert({
      user_id: userId,
      titulo: data.titulo,
      mensaje: data.mensaje,
      tipo: data.tipo,
      entidad_tipo: data.entidad_tipo || null,
      entidad_id: data.entidad_id || null,
      url: data.url || null,
      leida: false,
    });

    if (error) {
      console.error('Error creando notificación para usuario:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error en crearNotificacionUsuario:', error);
    throw error;
  }
}

/**
 * Crea notificaciones para todos los usuarios de un rol
 */
export async function crearNotificacionPorRol(
  rolNombre: string,
  data: NotificacionData
): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();

    // 1. Obtener el rol_id desde el nombre
    const { data: rolData, error: rolError } = await supabase
      .from('roles')
      .select('id')
      .eq('nombre', rolNombre)
      .single();

    if (rolError || !rolData) {
      console.error('Error obteniendo rol:', rolError);
      throw new Error(`Rol "${rolNombre}" no encontrado`);
    }

    // 2. Obtener todos los usuarios con ese rol
    const { data: usuariosData, error: usuariosError } = await supabase
      .from('usuarios')
      .select('id')
      .eq('rol_id', rolData.id);

    if (usuariosError) {
      console.error('Error obteniendo usuarios del rol:', usuariosError);
      throw usuariosError;
    }

    if (!usuariosData || usuariosData.length === 0) {
      console.warn(`No hay usuarios con rol "${rolNombre}"`);
      return;
    }

    // 3. Crear notificación para cada usuario
    const notificaciones = usuariosData.map((usuario) => ({
      user_id: usuario.id,
      titulo: data.titulo,
      mensaje: data.mensaje,
      tipo: data.tipo,
      entidad_tipo: data.entidad_tipo || null,
      entidad_id: data.entidad_id || null,
      url: data.url || null,
      leida: false,
    }));

    const { error: insertError } = await supabase
      .from('notificaciones')
      .insert(notificaciones);

    if (insertError) {
      console.error('Error creando notificaciones por rol:', insertError);
      throw insertError;
    }

    console.log(`✅ Notificaciones creadas para ${notificaciones.length} usuarios del rol "${rolNombre}"`);
  } catch (error) {
    console.error('Error en crearNotificacionPorRol:', error);
    throw error;
  }
}

/**
 * Helper para crear notificación de formulario nuevo
 */
export async function notificarFormularioNuevo(
  formularioId: string,
  nombre: string,
  email: string
): Promise<void> {
  // Notificar a usuarios con permiso ver mensajes
  await crearNotificacionPorRol('admin', {
    titulo: 'Nuevo formulario recibido',
    mensaje: `${nombre} (${email}) ha enviado un nuevo formulario`,
    tipo: 'info',
    entidad_tipo: 'formulario',
    entidad_id: formularioId,
    url: `/panel/mensajes/${formularioId}`,
  });
}

/**
 * Helper para crear notificación de cotización creada/actualizada
 */
export async function notificarCotizacion(
  cotizacionId: string,
  accion: 'creada' | 'actualizada',
  userId?: string
): Promise<void> {
  const data: NotificacionData = {
    titulo: `Cotización ${accion}`,
    mensaje: `Una cotización ha sido ${accion}`,
    tipo: 'info',
    entidad_tipo: 'cotizacion',
    entidad_id: cotizacionId,
    url: `/panel/ventas/cotizaciones`,
  };

  if (userId) {
    await crearNotificacionUsuario(userId, data);
  } else {
    await crearNotificacionPorRol('ventas', data);
  }
}

/**
 * Helper para crear notificación de alquiler próximo a finalizar
 */
export async function notificarAlquilerProximoFinalizar(
  alquilerId: string,
  diasRestantes: number,
  userId?: string
): Promise<void> {
  const data: NotificacionData = {
    titulo: 'Alquiler próximo a finalizar',
    mensaje: `Un alquiler finaliza en ${diasRestantes} día(s)`,
    tipo: 'warning',
    entidad_tipo: 'alquiler',
    entidad_id: alquilerId,
    url: `/panel/soportes/alquileres`,
  };

  if (userId) {
    await crearNotificacionUsuario(userId, data);
  } else {
    await crearNotificacionPorRol('ventas', data);
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
    url: `/panel/inventario/${productoId}`,
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
    url: `/panel/calendario`,
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
    url: `/panel/mantenimiento`,
  });
}

/**
 * Helper para crear notificación de factura vencida/próxima
 */
export async function notificarFactura(
  facturaId: string,
  tipo: 'vencida' | 'proxima',
  dias: number
): Promise<void> {
  const mensaje = tipo === 'vencida' 
    ? `Una factura está vencida`
    : `Una factura vence en ${dias} día(s)`;

  await crearNotificacionPorRol('admin', {
    titulo: tipo === 'vencida' ? 'Factura vencida' : 'Factura próxima a vencer',
    mensaje,
    tipo: tipo === 'vencida' ? 'error' : 'warning',
    entidad_tipo: 'factura',
    entidad_id: facturaId,
    url: `/panel/contabilidad`,
  });
}
