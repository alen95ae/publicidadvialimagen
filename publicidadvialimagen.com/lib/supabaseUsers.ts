import { getSupabaseServer } from './supabaseServer'

const supabase = getSupabaseServer()

// Interfaz para el usuario en Supabase
// NOTA: La tabla en Supabase tiene estos campos:
// id, uuid, email, passwordhash, nombre, rol, activo, puesto, fecha_creacion, ultimo_acceso, created_at, updated_at
export interface UsuarioSupabase {
  id: string
  uuid?: string
  email: string
  passwordhash?: string  // En Supabase se llama "passwordhash" (sin guión bajo)
  nombre?: string
  rol: string
  activo: boolean
  puesto?: string
  fecha_creacion?: string
  ultimo_acceso?: string
  created_at?: string
  updated_at?: string
}

// Interfaz para el usuario en el frontend (compatible con UserRecord)
export interface Usuario {
  id: string
  fields: {
    Email: string
    PasswordHash?: string
    Nombre?: string
    Rol?: string
    Activo?: boolean
    UltimoAcceso?: string
    Puesto?: string
  }
}

/**
 * Convertir usuario de Supabase al formato esperado por el frontend (compatible con Airtable)
 */
function supabaseToUsuario(record: any): Usuario {
  // En Supabase el campo se llama "passwordhash" (sin guión bajo)
  return {
    id: record.id,
    fields: {
      Email: record.email,
      PasswordHash: record.passwordhash || record.password_hash || undefined,  // Soporta ambos nombres
      Nombre: record.nombre || '',
      Rol: record.rol || 'invitado',
      Activo: record.activo ?? true,
      UltimoAcceso: record.ultimo_acceso || undefined,
      Puesto: record.puesto || undefined,
    }
  }
}

/**
 * Buscar usuario por email
 */
export async function findUserByEmailSupabase(email: string): Promise<Usuario | null> {
  const emailNormalized = email.trim().toLowerCase()
  console.log('🔍 [Supabase] Buscando usuario con email:', emailNormalized)
  
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('email', emailNormalized)
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('❌ [Supabase] Error finding user by email:', error)
    console.error('   Error code:', error.code)
    console.error('   Error message:', error.message)
    return null
  }

  if (!data) {
    console.log('⚠️ [Supabase] No se encontró usuario con email:', emailNormalized)
    return null
  }

  console.log('✅ [Supabase] Usuario encontrado:', data.id, data.email)
  return supabaseToUsuario(data as UsuarioSupabase)
}

/**
 * Crear nuevo usuario
 */
export async function createUserSupabase(
  email: string,
  passwordHash: string,
  nombre?: string,
  rol: string = 'invitado'
): Promise<Usuario> {
  const now = new Date().toISOString()
  
  // Preparar datos para insertar
  // En Supabase el campo se llama "passwordhash" (sin guión bajo)
  const userData: any = {
    email: email.trim().toLowerCase(),
    passwordhash: passwordHash,  // Usar "passwordhash" (sin guión bajo)
    nombre: nombre || '',
    rol: rol,
    activo: true,
    fecha_creacion: now,
    created_at: now,
    updated_at: now
  }
  
  const { data, error } = await supabase
    .from('usuarios')
    .insert([userData])
    .select()
    .single()

  if (error) {
    console.error('❌ Error creating user:', error)
    console.error('   Error code:', error.code)
    console.error('   Error message:', error.message)
    console.error('   Error details:', error.details)
    throw new Error(`Error creating user: ${error.message}`)
  }

  if (!data) {
    throw new Error('No data returned after creating user')
  }

  return supabaseToUsuario(data as UsuarioSupabase)
}

/**
 * Actualizar último acceso del usuario
 */
export async function updateLastAccessSupabase(userId: string): Promise<void> {
  const { error } = await supabase
    .from('usuarios')
    .update({
      ultimo_acceso: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)

  if (error) {
    console.error('Error updating last access:', error)
    // No lanzar error, solo loguear
  }
}

/**
 * Actualizar usuario
 */
export async function updateUserSupabase(
  userId: string,
  updates: {
    nombre?: string
    rol?: string
    activo?: boolean
    puesto?: string
    password_hash?: string
  }
): Promise<Usuario | null> {
  const updateData: any = {
    updated_at: new Date().toISOString()
  }

  if (updates.nombre !== undefined) updateData.nombre = updates.nombre
  if (updates.rol !== undefined) updateData.rol = updates.rol
  if (updates.activo !== undefined) updateData.activo = updates.activo
  if (updates.puesto !== undefined) updateData.puesto = updates.puesto
  // En Supabase el campo se llama "passwordhash" (sin guión bajo)
  if (updates.password_hash !== undefined) updateData.passwordhash = updates.password_hash

  const { data, error } = await supabase
    .from('usuarios')
    .update(updateData)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating user:', error)
    return null
  }

  if (!data) return null

  return supabaseToUsuario(data as UsuarioSupabase)
}

/**
 * Obtener usuario por ID
 */
export async function getUserByIdSupabase(userId: string): Promise<Usuario | null> {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Error getting user by id:', error)
    return null
  }

  if (!data) return null

  return supabaseToUsuario(data as UsuarioSupabase)
}

/**
 * Obtener todos los usuarios
 */
export async function getAllUsersSupabase(): Promise<Usuario[]> {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error getting all users:', error)
    return []
  }

  if (!data) return []

  return data.map((record: UsuarioSupabase) => supabaseToUsuario(record))
}

