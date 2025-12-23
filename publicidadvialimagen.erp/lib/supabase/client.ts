/**
 * Cliente Supabase Singleton para Browser
 * 
 * Este es el ÚNICO lugar donde se crea un cliente Supabase para el browser.
 * Todas las instancias deben importarse desde aquí para evitar múltiples GoTrueClient.
 * 
 * ⚠️ AUTH DESACTIVADO: No se usa Supabase Auth en este proyecto.
 * - persistSession: false
 * - autoRefreshToken: false
 * - detectSessionInUrl: false
 * - No se usa localStorage ni keys de auth
 * 
 * Uso:
 * ```ts
 * import { getSupabaseBrowserClient } from '@/lib/supabase/client'
 * const supabase = getSupabaseBrowserClient()
 * ```
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Singleton: una sola instancia para todo el browser
let _supabaseBrowserClient: SupabaseClient | null = null

/**
 * Obtiene el cliente Supabase singleton para el browser
 * 
 * Este cliente está configurado SIN autenticación de Supabase.
 * Solo se usa para:
 * - Realtime subscriptions
 * - Queries a la base de datos (con RLS si es necesario)
 * - Storage operations
 * 
 * ⚠️ NO usar para autenticación - este proyecto tiene su propio sistema de auth
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  // Si ya existe, retornar la instancia singleton
  if (_supabaseBrowserClient) {
    return _supabaseBrowserClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Estas variables son requeridas para el cliente Supabase en el browser.'
    )
  }

  // Crear cliente con auth completamente desactivado
  // Usar un storage personalizado que no persiste nada
  const noopStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    get length() { return 0; },
    key: () => null,
  }

  _supabaseBrowserClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // Desactivar completamente la persistencia de sesión
      persistSession: false,
      // Desactivar refresh automático de tokens
      autoRefreshToken: false,
      // No detectar sesión en URL (evita redirects de auth)
      detectSessionInUrl: false,
      // Usar storage no-op para evitar que GoTrue use localStorage
      storage: noopStorage,
    },
    global: {
      headers: {
        'apikey': supabaseAnonKey,
      },
    },
  })

  return _supabaseBrowserClient
}

/**
 * Exportar como default para compatibilidad
 */
export default getSupabaseBrowserClient

