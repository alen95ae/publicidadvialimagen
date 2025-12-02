import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabaseServer: SupabaseClient | null = null
let _supabaseAdmin: SupabaseClient | null = null

/**
 * Cliente de Supabase con Service Role (Admin)
 * 
 * Este cliente bypass RLS automáticamente y debe usarse SOLO cuando sea necesario:
 * - Operaciones que requieren privilegios elevados
 * - Operaciones que no dependen del usuario autenticado
 * - Operaciones de sistema o mantenimiento
 * 
 * Para operaciones normales del usuario, usar getSupabaseClient() que respeta RLS.
 * 
 * @deprecated Usar getSupabaseAdmin() para operaciones admin y getSupabaseClient() para operaciones normales
 */
export function getSupabaseServer() {
  if (_supabaseServer) {
    return _supabaseServer
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }

  // Crear cliente con Service Role Key (bypass RLS automáticamente)
  _supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    // Asegurar que use el service role key correctamente
    global: {
      headers: {
        'apikey': supabaseServiceKey
      }
    }
  })

  return _supabaseServer
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
 * 
 * Para operaciones normales del usuario, usar getSupabaseClient() que respeta RLS.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (_supabaseAdmin) {
    return _supabaseAdmin
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }

  // Crear cliente con Service Role Key (bypass RLS automáticamente)
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
 * Cliente de Supabase normal (respeta RLS)
 * 
 * Este cliente respeta las políticas RLS y debe usarse para:
 * - Operaciones que dependen del usuario autenticado
 * - Operaciones normales del ERP
 * - Consultas que deben respetar permisos
 * 
 * NOTA: Por ahora, esta función retorna el cliente admin porque el sistema
 * actual no tiene un cliente autenticado por usuario. En el futuro, esto
 * deberá crear un cliente con el token del usuario autenticado.
 * 
 * TODO: Implementar cliente autenticado por usuario cuando se active RLS completo
 */
export function getSupabaseClient(): SupabaseClient {
  // Por ahora, retornar el cliente admin para mantener compatibilidad
  // Cuando se active RLS completo, esto deberá crear un cliente con el token del usuario
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

