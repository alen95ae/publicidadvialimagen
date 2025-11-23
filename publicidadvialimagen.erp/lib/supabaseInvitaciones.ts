import { getSupabaseServer } from './supabaseServer'

const supabase = getSupabaseServer()

// Interfaz para la invitación en Supabase
// NOTA: La tabla en Supabase debe tener estos campos:
// id, email, rol, token, estado, fecha_creacion, fecha_expiracion, fecha_uso, enlace, created_at, updated_at
export interface InvitacionSupabase {
  id: string
  email: string
  rol: string
  token: string
  estado: 'pendiente' | 'usado' | 'expirado' | 'revocado'
  fecha_creacion: string
  fecha_expiracion: string
  fecha_uso?: string | null
  enlace: string
  created_at?: string
  updated_at?: string
}

// Interfaz para la invitación en el frontend (compatible con Airtable)
export interface Invitacion {
  id: string
  email: string
  rol: string
  token: string
  estado: string
  fechaCreacion: string
  fechaExpiracion: string
  fechaUso?: string | null
  enlace: string
}

/**
 * Convertir invitación de Supabase al formato esperado por el frontend (compatible con Airtable)
 */
function supabaseToInvitacion(record: InvitacionSupabase): Invitacion {
  return {
    id: record.id,
    email: record.email,
    rol: record.rol,
    token: record.token,
    estado: record.estado,
    fechaCreacion: record.fecha_creacion,
    fechaExpiracion: record.fecha_expiracion,
    fechaUso: record.fecha_uso || null,
    enlace: record.enlace
  }
}

/**
 * Buscar invitación por token y email
 */
export async function findInvitacionByTokenAndEmail(
  token: string,
  email: string,
  estado?: string
): Promise<Invitacion | null> {
  const emailNormalized = email.trim().toLowerCase()
  
  let query = supabase
    .from('invitaciones')
    .select('*')
    .eq('token', token)
    .eq('email', emailNormalized)
  
  if (estado) {
    query = query.eq('estado', estado)
  }
  
  const { data, error } = await query
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('❌ [Supabase] Error finding invitation:', error)
    return null
  }

  if (!data) {
    return null
  }

  return supabaseToInvitacion(data as InvitacionSupabase)
}

/**
 * Buscar invitación por token
 */
export async function findInvitacionByToken(token: string): Promise<Invitacion | null> {
  const { data, error } = await supabase
    .from('invitaciones')
    .select('*')
    .eq('token', token)
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('❌ [Supabase] Error finding invitation by token:', error)
    return null
  }

  if (!data) {
    return null
  }

  return supabaseToInvitacion(data as InvitacionSupabase)
}

/**
 * Buscar invitaciones pendientes por email
 */
export async function findInvitacionPendienteByEmail(email: string): Promise<Invitacion | null> {
  const emailNormalized = email.trim().toLowerCase()
  
  const { data, error } = await supabase
    .from('invitaciones')
    .select('*')
    .eq('email', emailNormalized)
    .eq('estado', 'pendiente')
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('❌ [Supabase] Error finding pending invitation:', error)
    return null
  }

  if (!data) {
    return null
  }

  return supabaseToInvitacion(data as InvitacionSupabase)
}

/**
 * Obtener todas las invitaciones con filtro opcional por estado
 */
export async function getAllInvitaciones(estado?: string): Promise<Invitacion[]> {
  let query = supabase
    .from('invitaciones')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)
  
  if (estado && estado !== 'all') {
    query = query.eq('estado', estado)
  }
  
  const { data, error } = await query

  if (error) {
    console.error('❌ [Supabase] Error getting invitations:', error)
    return []
  }

  if (!data) {
    return []
  }

  return data.map((record: InvitacionSupabase) => supabaseToInvitacion(record))
}

/**
 * Crear nueva invitación
 */
export async function createInvitacion(
  email: string,
  rol: string,
  token: string,
  fechaCreacion: string,
  fechaExpiracion: string,
  enlace: string
): Promise<Invitacion> {
  const now = new Date().toISOString()
  
  const invitacionData: any = {
    email: email.trim().toLowerCase(),
    rol: rol,
    token: token,
    estado: 'pendiente',
    fecha_creacion: fechaCreacion,
    fecha_expiracion: fechaExpiracion,
    enlace: enlace,
    created_at: now,
    updated_at: now
  }
  
  const { data, error } = await supabase
    .from('invitaciones')
    .insert([invitacionData])
    .select()
    .single()

  if (error) {
    console.error('❌ Error creating invitation:', error)
    console.error('   Error code:', error.code)
    console.error('   Error message:', error.message)
    throw new Error(`Error creating invitation: ${error.message}`)
  }

  if (!data) {
    throw new Error('No data returned after creating invitation')
  }

  return supabaseToInvitacion(data as InvitacionSupabase)
}

/**
 * Actualizar invitación
 */
export async function updateInvitacion(
  id: string,
  updates: {
    estado?: string
    fecha_uso?: string
  }
): Promise<Invitacion | null> {
  const updateData: any = {
    updated_at: new Date().toISOString()
  }

  if (updates.estado !== undefined) updateData.estado = updates.estado
  if (updates.fecha_uso !== undefined) updateData.fecha_uso = updates.fecha_uso

  const { data, error } = await supabase
    .from('invitaciones')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('❌ Error updating invitation:', error)
    return null
  }

  if (!data) return null

  return supabaseToInvitacion(data as InvitacionSupabase)
}

/**
 * Marcar invitación como usada
 */
export async function marcarInvitacionComoUsada(id: string): Promise<Invitacion | null> {
  return updateInvitacion(id, {
    estado: 'usado',
    fecha_uso: new Date().toISOString()
  })
}

/**
 * Marcar invitación como expirada
 */
export async function marcarInvitacionComoExpirada(id: string): Promise<Invitacion | null> {
  return updateInvitacion(id, {
    estado: 'expirado'
  })
}





