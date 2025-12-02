import { getSupabaseServer } from "@/lib/supabaseServer";

/**
 * Tipos de eventos del historial
 */
export type TipoEvento = 
  | 'ALQUILER'
  | 'RESERVA'
  | 'MANTENIMIENTO'
  | 'EDICION'
  | 'FOTO_SUBIDA'
  | 'CAMBIO_ESTADO'
  | 'CREACION'
  | 'ELIMINACION'
  | 'OTRO';

/**
 * Interfaz para un evento del historial
 */
export interface HistorialEvento {
  id: string;
  soporte_id: number;
  tipo_evento: TipoEvento;
  descripcion: string;
  fecha: string;
  realizado_por: string | null;
  datos: Record<string, any> | null;
  created_at: string;
}

/**
 * Interfaz para crear un nuevo evento
 */
export interface NuevoHistorialEvento {
  soporte_id: number;
  tipo_evento: TipoEvento;
  descripcion: string;
  realizado_por?: string | null;
  datos?: Record<string, any> | null;
}

/**
 * Obtener el historial de un soporte
 */
export async function getHistorialSoporte(soporteId: number): Promise<HistorialEvento[]> {
  const supabase = getSupabaseServer();
  
  const { data, error } = await supabase
    .from('soportes_historial')
    .select('*')
    .eq('soporte_id', soporteId)
    .order('fecha', { ascending: false });
  
  if (error) {
    console.error('Error obteniendo historial:', error);
    throw error;
  }
  
  return (data || []) as HistorialEvento[];
}

/**
 * Agregar un nuevo evento al historial
 */
export async function addHistorialEvento(evento: NuevoHistorialEvento): Promise<HistorialEvento> {
  const supabase = getSupabaseServer();
  
  const payload = {
    soporte_id: evento.soporte_id,
    tipo_evento: evento.tipo_evento,
    descripcion: evento.descripcion,
    realizado_por: evento.realizado_por || null,
    datos: evento.datos || null,
    fecha: new Date().toISOString(),
  };
  
  const { data, error } = await supabase
    .from('soportes_historial')
    .insert(payload)
    .select()
    .single();
  
  if (error) {
    console.error('Error insertando evento en historial:', error);
    throw error;
  }
  
  return data as HistorialEvento;
}

/**
 * Obtener información del usuario por ID (UUID)
 */
export async function getUsuarioPorId(userId: string): Promise<{ id: string; nombre: string; email: string } | null> {
  const supabase = getSupabaseServer();
  
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, nombre, email')
    .eq('id', userId)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return {
    id: data.id,
    nombre: data.nombre || data.email || 'Usuario desconocido',
    email: data.email,
  };
}

/**
 * Obtener información del usuario por email (para compatibilidad)
 */
export async function getUsuarioPorEmail(email: string): Promise<{ id: string; nombre: string; email: string } | null> {
  const supabase = getSupabaseServer();
  
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, nombre, email')
    .eq('email', email)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return {
    id: data.id,
    nombre: data.nombre || email,
    email: data.email,
  };
}

/**
 * Registrar evento de alquiler creado desde cotización
 */
export async function registrarAlquilerCreado(
  soporteId: number,
  cotizacionId: string,
  inicio: string,
  fin: string,
  total: number,
  realizadoPor?: string | null
): Promise<HistorialEvento> {
  return addHistorialEvento({
    soporte_id: soporteId,
    tipo_evento: 'ALQUILER',
    descripcion: `Alquiler generado desde cotización editada (${cotizacionId})`,
    realizado_por: realizadoPor || null,
    datos: {
      cotizacion_id: cotizacionId,
      inicio,
      fin,
      total,
      origen: 'cotizacion_editada'
    }
  });
}

/**
 * Registrar evento de alquiler eliminado por edición de cotización
 */
export async function registrarAlquilerEliminado(
  soporteId: number,
  cotizacionId: string,
  alquilerCodigo: string,
  realizadoPor?: string | null
): Promise<HistorialEvento> {
  return addHistorialEvento({
    soporte_id: soporteId,
    tipo_evento: 'ELIMINACION',
    descripcion: `Alquiler ${alquilerCodigo} eliminado debido a edición de cotización (${cotizacionId})`,
    realizado_por: realizadoPor || null,
    datos: {
      cotizacion_id: cotizacionId,
      alquiler_codigo: alquilerCodigo,
      motivo: 'edicion_cotizacion'
    }
  });
}

