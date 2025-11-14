import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabaseServer: SupabaseClient | null = null

// Cliente de Supabase para uso en el servidor con privilegios elevados
// Usa lazy initialization para evitar errores durante el build
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

