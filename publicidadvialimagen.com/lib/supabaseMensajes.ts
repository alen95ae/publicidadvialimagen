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
  try {
    console.log('📝 [createMensajeSupabase] Iniciando...', { email: data.email, nombre: data.nombre })
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

    console.log('📝 [createMensajeSupabase] Datos preparados:', mensajeData)
    console.log('📝 [createMensajeSupabase] Insertando en tabla "formularios"...')

    const { data: inserted, error } = await supabase
      .from('formularios')
      .insert([mensajeData])
      .select()
      .single()

    if (error) {
      console.error('❌ [createMensajeSupabase] Error de Supabase:', error)
      console.error('❌ [createMensajeSupabase] Error code:', error.code)
      console.error('❌ [createMensajeSupabase] Error message:', error.message)
      console.error('❌ [createMensajeSupabase] Error details:', error.details)
      console.error('❌ [createMensajeSupabase] Error hint:', error.hint)
      throw new Error(`Error creando mensaje: ${error.message} (code: ${error.code})`)
    }

    console.log('✅ [createMensajeSupabase] Mensaje creado exitosamente:', inserted.id)
    return inserted
  } catch (error: any) {
    console.error('❌ [createMensajeSupabase] Error general:', error)
    throw error
  }
}

