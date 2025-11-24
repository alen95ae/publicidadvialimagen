import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { getUserByIdSupabase } from '@/lib/supabaseUsers'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('session')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const payload = await verifySession(token)
    
    if (!payload || !payload.sub) {
      return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 })
    }

    // Obtener información completa del usuario
    const user = await getUserByIdSupabase(payload.sub)
    
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email || payload.email,
        name: user.nombre || payload.name, // Cambiado 'nombre' a 'name' para el header
        nombre: user.nombre || payload.name, // Mantener 'nombre' para compatibilidad con cotizaciones
        rol: user.rol || payload.role,
        role: user.rol || payload.role, // Agregar 'role' para compatibilidad con header
      }
    })
  } catch (error) {
    console.error('Error obteniendo usuario actual:', error)
    return NextResponse.json({ error: 'Error al obtener usuario' }, { status: 500 })
  }
}
