import { getSupabaseServer } from './supabaseServer'

export interface MensajeSupabase {
  id?: string
  nombre: string
  email: string
  telefono?: string
  empresa?: string
  mensaje: string
  estado: string
  fecha?: string
  created_at?: string
  updated_at?: string
}

/**
 * Crear un nuevo mensaje en Supabase
 */
export async function createMensajeSupabase(data: {
  nombre: string
  email: string
  telefono?: string
  empresa?: string
  mensaje: string
  estado?: string
}): Promise<MensajeSupabase> {
  const supabase = getSupabaseServer()
  
  const now = new Date().toISOString()
  
  // Preparar datos para Supabase (los campos opcionales deben ser null, no undefined)
  const mensajeData = {
    nombre: (data.nombre || '').trim(),
    email: data.email.trim(),
    telefono: data.telefono?.trim() || null,
    empresa: data.empresa?.trim() || null,
    mensaje: data.mensaje.trim(),
    estado: data.estado || 'NUEVO',
    fecha: now
  }

  const { data: inserted, error } = await supabase
    .from('mensajes')
    .insert([mensajeData])
    .select()
    .single()

  if (error) {
    console.error('❌ Error creando mensaje en Supabase:', error)
    throw new Error(`Error creando mensaje: ${error.message}`)
  }

  console.log('✅ Mensaje creado en Supabase:', inserted.id)
  return inserted
}

