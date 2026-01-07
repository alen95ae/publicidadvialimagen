import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { SignJWT } from 'jose'
import { verifySession } from '@/lib/auth/verifySession'


// Cache de clientes
let _supabaseServer: SupabaseClient | null = null
let _supabaseAdmin: SupabaseClient | null = null

/**
 * Genera un JWT compatible con Supabase/PostgREST para autenticación
 * 
 * Este JWT permite que auth.uid() funcione en políticas RLS.
 * 
 * @param userId UUID del usuario (del claim 'sub' del JWT propio)
 * @returns JWT firmado compatible con Supabase
 * 
 * Claims requeridos por Supabase:
 * - sub: UUID del usuario
 * - role: 'authenticated'
 * - aud: 'authenticated'
 * - exp: expiración (15 minutos)
 * - iat: timestamp de emisión
 */
async function generateSupabaseJWT(userId: string): Promise<string> {
  const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET

  if (!supabaseJwtSecret) {
    throw new Error(
      'Missing SUPABASE_JWT_SECRET. ' +
      'Esta variable es requerida para que auth.uid() funcione en RLS. ' +
      'Obtén el JWT secret desde el dashboard de Supabase: ' +
      'Settings > API > JWT Secret'
    )
  }

  // Convertir secret a Uint8Array (requerido por jose)
  const secret = new TextEncoder().encode(supabaseJwtSecret)

  // Calcular expiración (15 minutos desde ahora)
  const now = Math.floor(Date.now() / 1000)
  const exp = now + (15 * 60) // 15 minutos

  // Generar JWT compatible con Supabase
  const jwt = await new SignJWT({
    sub: userId,
    role: 'authenticated',
    aud: 'authenticated',
    iat: now,
    exp: exp
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(secret)

  return jwt
}

/**
 * Cliente de Supabase Admin (Service Role)
 * 
 * Este cliente bypass RLS y debe usarse SOLO cuando sea estrictamente necesario:
 * - Operaciones que requieren privilegios elevados
 * - Operaciones que no dependen del usuario autenticado
 * - Operaciones de sistema o mantenimiento
 * - Generación de códigos usando RPC
 * - Logs de transacciones
 * - Operaciones de migración o scripts
 * 
 * ⚠️ NUNCA usar para operaciones normales del usuario
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (_supabaseAdmin) {
    return _supabaseAdmin
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // Verificación explícita y obligatoria
  console.log('[getSupabaseAdmin] Verificando variables de entorno...')
  console.log('[getSupabaseAdmin] NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'EXISTS' : 'MISSING')
  console.log('[getSupabaseAdmin] SERVICE_ROLE_OK:', !!supabaseServiceKey)
  console.log('[getSupabaseAdmin] SERVICE_ROLE_KEY length:', supabaseServiceKey?.length || 0)

  if (!supabaseUrl) {
    console.error('[getSupabaseAdmin] ❌ NEXT_PUBLIC_SUPABASE_URL NO EXISTE')
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
  }

  if (!supabaseServiceKey) {
    console.error('[getSupabaseAdmin] ❌ SUPABASE_SERVICE_ROLE_KEY NO EXISTE')
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY - Esta variable es CRÍTICA para insertar notificaciones')
  }

  _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        'apikey': supabaseServiceKey
      }
    }
  })

  return _supabaseAdmin
}

/**
 * Cliente de Supabase para USUARIO (anon key + JWT compatible con Supabase)
 * 
 * Este cliente usa anon key y genera un JWT compatible con Supabase/PostgREST
 * que permite que auth.uid() funcione en políticas RLS.
 * 
 * Uso:
 * - Operaciones que dependen del usuario autenticado
 * - Operaciones normales del ERP
 * - Consultas que deben respetar permisos (cuando RLS esté activo)
 * 
 * @param request NextRequest (para API routes) o null (para server components)
 * @returns Cliente Supabase con JWT autenticado o null si no hay sesión
 * 
 * ⚠️ Si no hay sesión, retorna null. Las rutas deben manejar este caso.
 * ⚠️ NO usar fallback a admin aquí - las rutas deben decidir explícitamente.
 */
export async function getSupabaseUser(
  request?: NextRequest | null
): Promise<SupabaseClient | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Esta variable es requerida. ' +
      'Obtén la anon key desde el dashboard de Supabase.'
    )
  }

  // Extraer y validar sesión
  let token: string | undefined
  let userId: string | undefined

  try {
    if (request) {
      // API route: extraer de request.cookies
      token = request.cookies.get('session')?.value
      console.log('[getSupabaseUser] API route - Token from cookies:', token ? 'FOUND' : 'NOT FOUND')
    } else {
      // Server component: extraer de cookies()
      const cookieStore = await cookies()
      token = cookieStore.get('session')?.value
      console.log('[getSupabaseUser] Server component - Token from cookies:', token ? 'FOUND' : 'NOT FOUND')
    }

    if (!token) {
      console.warn('[getSupabaseUser] No token found - returning null')
      // No hay sesión - retornar null (NO fallback)
      return null
    }

    // Validar sesión existente
    console.log('[getSupabaseUser] Validating session token...')
    const payload = await verifySession(token)
    if (!payload || !payload.sub) {
      console.warn('[getSupabaseUser] Session invalid - no payload or sub')
      // Sesión inválida - retornar null
      return null
    }

    console.log('[getSupabaseUser] Session valid - User ID:', payload.sub)
    userId = payload.sub
  } catch (error) {
    console.warn('[getSupabaseUser] Error verificando sesión:', error)
    // Error al verificar - retornar null (NO fallback)
    return null
  }

  // Si no hay userId, retornar null
  if (!userId) {
    return null
  }

  // Generar JWT compatible con Supabase
  let supabaseJWT: string
  try {
    supabaseJWT = await generateSupabaseJWT(userId)
  } catch (error) {
    console.error('[getSupabaseUser] Error generando JWT de Supabase:', error)
    // Si falla la generación del JWT, normalmente retornamos null.
    // PERO: para el rol "desarrollador" (o el email del dev), hacemos fallback a Admin
    // para evitar quedar expulsados por configuración faltante en entornos de preview/producción.
    // ⚠️ Esto bypass RLS y debe usarse solo para desarrollador.
    try {
      const payload = await verifySession(token)
      const role = (payload?.role || "").toLowerCase().trim()
      
      // Verificar si el rol es "desarrollador" (NO por email)
      // El rol desarrollador debe tener todos los permisos asignados en BD
      if (role === "desarrollador" || role === "developer") {
        console.warn("[getSupabaseUser] ⚠️ Fallback a getSupabaseAdmin() para rol desarrollador (JWT Supabase no disponible).")
        return getSupabaseAdmin()
      }
    } catch {
      // Ignorar; seguimos a null abajo
    }

    return null
  }

  // Crear cliente con anon key + JWT en Authorization header
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        'apikey': supabaseAnonKey,
        // Inyectar JWT compatible con Supabase en Authorization header
        // Esto permite que auth.uid() funcione en políticas RLS
        'Authorization': `Bearer ${supabaseJWT}`
      }
    }
  })

  return client
}

/**
 * @deprecated Usar getSupabaseAdmin() para operaciones admin
 * Mantener para compatibilidad con código existente
 * 
 * ⚠️ Este helper será eliminado en una futura versión.
 * Migrar todas las llamadas a getSupabaseAdmin() o getSupabaseUser() según corresponda.
 */
export function getSupabaseServer(): SupabaseClient {
  if (_supabaseServer) {
    return _supabaseServer
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }

  _supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        'apikey': supabaseServiceKey
      }
    }
  })

  return _supabaseServer
}

/**
 * @deprecated Usar getSupabaseUser() o getSupabaseAdmin() según corresponda
 * Por ahora retorna admin para mantener compatibilidad
 * 
 * ⚠️ Este helper será eliminado en una futura versión.
 * TODO: Migrar todas las llamadas a getSupabaseUser() o getSupabaseAdmin()
 */
export function getSupabaseClient(): SupabaseClient {
  // Por ahora, retornar el cliente admin para mantener compatibilidad
  // En el futuro, esto deberá crear un cliente con el token del usuario
  return getSupabaseAdmin()
}

// Exportar como un objeto con un getter para mantener compatibilidad con el código existente
export const supabaseServer = new Proxy({} as SupabaseClient, {
  get: (_, prop) => {
    const client = getSupabaseServer()
    const value = (client as any)[prop]
    // Si es una función, bindear el contexto
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  }
})

