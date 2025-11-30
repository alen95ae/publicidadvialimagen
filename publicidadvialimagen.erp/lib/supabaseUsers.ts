import { getSupabaseServer } from './supabaseServer'

const supabase = getSupabaseServer()

// Interfaz para el usuario en Supabase
// NOTA: La tabla en Supabase tiene estos campos:
// id, uuid, email, passwordhash, nombre, rol_id, activo, fecha_creacion, ultimo_acceso, created_at, updated_at
export interface UsuarioSupabase {
  id: string
  uuid?: string
  email: string
  passwordhash?: string  // En Supabase se llama "passwordhash" (sin guión bajo)
  nombre?: string
  rol_id?: string
  activo: boolean
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
    RolId?: string
    Activo?: boolean
    UltimoAcceso?: string
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
      Rol: record.rol || 'invitado', // Mantener para compatibilidad, pero usar RolId
      RolId: record.rol_id || undefined,
      Activo: record.activo ?? true,
      UltimoAcceso: record.ultimo_acceso || undefined,
    }
  }
}

/**
 * Buscar usuario por email
 */
export async function findUserByEmailSupabase(email: string): Promise<Usuario | null> {
  const emailNormalized = email.trim().toLowerCase()
  console.log('🔍 [Supabase ERP] Buscando usuario con email:', emailNormalized)
  
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('email', emailNormalized)
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('❌ [Supabase ERP] Error finding user by email:', error)
    console.error('   Error code:', error.code)
    console.error('   Error message:', error.message)
    return null
  }

  if (!data) {
    console.log('⚠️ [Supabase ERP] No se encontró usuario con email:', emailNormalized)
    return null
  }

  console.log('✅ [Supabase ERP] Usuario encontrado:', data.id, data.email)
  return supabaseToUsuario(data as UsuarioSupabase)
}

/**
 * Crear nuevo usuario
 */
export async function createUserSupabase(
  email: string,
  passwordHash: string,
  nombre?: string,
  rol_id?: string
): Promise<Usuario> {
  const now = new Date().toISOString()
  
  // Preparar datos para insertar
  // En Supabase el campo se llama "passwordhash" (sin guión bajo)
  const userData: any = {
    email: email.trim().toLowerCase(),
    passwordhash: passwordHash,  // Usar "passwordhash" (sin guión bajo)
    nombre: nombre || '',
    activo: true,
    fecha_creacion: now,
    created_at: now,
    updated_at: now
  }
  
  if (rol_id) {
    userData.rol_id = rol_id;
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
    email?: string
    rol_id?: string
    activo?: boolean
    password_hash?: string
    imagen_usuario?: any
    vendedor?: boolean
    numero?: string
  }
): Promise<Usuario | null> {
  const updateData: any = {
    updated_at: new Date().toISOString()
  }

  if (updates.nombre !== undefined) updateData.nombre = updates.nombre
  if (updates.email !== undefined) updateData.email = updates.email.trim().toLowerCase()
  if (updates.rol_id !== undefined) updateData.rol_id = updates.rol_id
  if (updates.activo !== undefined) updateData.activo = updates.activo
  // En Supabase el campo se llama "passwordhash" (sin guión bajo)
  if (updates.password_hash !== undefined) updateData.passwordhash = updates.password_hash
  if (updates.imagen_usuario !== undefined) updateData.imagen_usuario = updates.imagen_usuario
  if (updates.vendedor !== undefined) updateData.vendedor = updates.vendedor
  if (updates.numero !== undefined) updateData.numero = updates.numero

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

  const usuario = supabaseToUsuario(data as UsuarioSupabase)
  return {
    ...usuario,
    imagen_usuario: data.imagen_usuario || null,
    vendedor: data.vendedor ?? false,
    email: data.email,
    nombre: data.nombre,
    rol: data.rol || 'invitado',
  }
}

/**
 * Obtener usuario por ID (con todos los campos incluyendo imagen_usuario y vendedor)
 */
export async function getUserByIdSupabase(userId: string): Promise<any | null> {
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

  // Obtener el nombre del rol desde la tabla roles
  let roleName = 'invitado'
  if (data.rol_id) {
    try {
      const { data: roleData } = await supabase
        .from('roles')
        .select('nombre')
        .eq('id', data.rol_id)
        .single()
      
      if (roleData?.nombre) {
        roleName = roleData.nombre
      }
    } catch (error) {
      console.error('Error obteniendo nombre del rol:', error)
    }
  }

  const usuario = supabaseToUsuario(data as UsuarioSupabase)
  return {
    ...usuario,
    imagen_usuario: data.imagen_usuario || null,
    vendedor: data.vendedor ?? false,
    email: data.email,
    nombre: data.nombre,
    rol: roleName,
    rol_id: data.rol_id || null,
    numero: data.numero || null,
  }
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

