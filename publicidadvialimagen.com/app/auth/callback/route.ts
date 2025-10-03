import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    // El código se maneja automáticamente por Supabase en el cliente
    // Redirigir a la home
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Si no hay código, redirigir al login
  return NextResponse.redirect(new URL('/login', request.url))
}

