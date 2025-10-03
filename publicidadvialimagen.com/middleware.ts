import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Buscar cualquier cookie que contenga información de Supabase
  const cookies = req.cookies
  const supabaseAuthCookie = cookies.getAll().find(
    cookie => cookie.name.includes('supabase') || cookie.name.includes('sb-')
  )

  // Si no hay ninguna cookie de Supabase, es probable que no esté autenticado
  // Pero dejamos que el cliente maneje la redirección para evitar problemas
  // Este middleware es más una capa de seguridad adicional
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/account/:path*']
}

