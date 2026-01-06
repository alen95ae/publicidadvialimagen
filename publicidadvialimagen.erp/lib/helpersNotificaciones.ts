/**
 * Helpers para el sistema de notificaciones basado en notificacion_tipos y notificacion_roles
 */

import { getSupabaseAdmin } from "@/lib/supabaseServer";

/**
 * Obtener usuarios activos por nombre de rol
 * @param rolNombre Nombre del rol (case-insensitive)
 * @returns Array de IDs de usuarios
 */
export async function obtenerUsuariosPorRol(rolNombre: string): Promise<string[]> {
  const supabase = getSupabaseAdmin();
  const rolNombreLower = rolNombre.toLowerCase();

  // Obtener usuarios con ese rol
  const { data: usuariosData, error } = await supabase
    .from('usuarios')
    .select('id, activo, roles(nombre)')
    .eq('activo', true);

  if (error) {
    console.error(`❌ Error obteniendo usuarios por rol ${rolNombre}:`, error);
    return [];
  }

  if (!usuariosData) {
    return [];
  }

  // Filtrar por nombre de rol (case-insensitive)
  const usuariosIds = usuariosData
    .filter((usuario: any) => {
      const usuarioRolNombre = (usuario.roles as any)?.nombre?.toLowerCase();
      return usuarioRolNombre === rolNombreLower;
    })
    .map((usuario: any) => usuario.id);

  return usuariosIds;
}

/**
 * Obtener roles habilitados para un tipo de notificación
 * @param notificacionTipoId ID del tipo de notificación
 * @returns Array de nombres de roles (lowercase)
 */
export async function obtenerRolesHabilitadosPorTipo(
  notificacionTipoId: string
): Promise<string[]> {
  const supabase = getSupabaseAdmin();

  // Obtener notificacion_roles con enabled=true para este tipo
  const { data: notificacionRolesData, error } = await supabase
    .from('notificacion_roles')
    .select('rol_id, roles(nombre)')
    .eq('notificacion_tipo_id', notificacionTipoId)
    .eq('enabled', true);

  if (error) {
    console.error(
      `❌ Error obteniendo roles habilitados para tipo ${notificacionTipoId}:`,
      error
    );
    return [];
  }

  if (!notificacionRolesData) {
    return [];
  }

  // Extraer nombres de roles y normalizar a lowercase
  const rolesNombres = notificacionRolesData
    .map((nr: any) => (nr.roles as any)?.nombre?.toLowerCase())
    .filter((nombre: string | undefined) => nombre !== undefined) as string[];

  return rolesNombres;
}

/**
 * Verificar si ya existe una notificación no leída del mismo tipo y entidad
 * @param entidadTipo Tipo de entidad (ej: 'alquiler')
 * @param entidadId ID de la entidad
 * @param tipoCodigo Código del tipo de notificación
 * @returns true si existe, false si no
 */
export async function existeNotificacionDuplicada(
  entidadTipo: string,
  entidadId: string,
  tipoCodigo: string
): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  // Obtener el tipo de notificación por código
  const { data: tipoData, error: tipoError } = await supabase
    .from('notificacion_tipos')
    .select('id, titulo')
    .eq('codigo', tipoCodigo)
    .single();

  if (tipoError || !tipoData) {
    console.warn(`⚠️ Tipo de notificación no encontrado: ${tipoCodigo}`);
    return false; // Si no existe el tipo, no hay duplicado
  }

  // Buscar notificaciones no leídas del mismo tipo y entidad
  // Usamos el título como referencia (ya que no tenemos campo directo de tipo_id en notificaciones)
  const { data: notificacionesData, error } = await supabase
    .from('notificaciones')
    .select('id')
    .eq('entidad_tipo', entidadTipo)
    .eq('entidad_id', entidadId)
    .eq('titulo', tipoData.titulo) // Usar título como identificador del tipo
    .eq('leida', false)
    .limit(1);

  if (error) {
    console.error(`❌ Error verificando duplicados:`, error);
    return false; // En caso de error, permitir crear (mejor duplicar que perder)
  }

  return (notificacionesData?.length ?? 0) > 0;
}

