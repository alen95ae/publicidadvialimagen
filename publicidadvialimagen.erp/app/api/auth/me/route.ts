export const runtime = "nodejs";

import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { getUserByIdSupabase } from '@/lib/supabaseUsers'
import { getSupabaseUser, getSupabaseAdmin } from '@/lib/supabaseServer'

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

    // Asegurar que tenemos el nombre del rol correcto
    let roleName = user.rol || payload.role || 'invitado'
    if (user.rol_id && !user.rol) {
      // Si tenemos rol_id pero no el nombre, obtenerlo
      // FASE 0: Usar cliente de usuario (bajo riesgo - solo lectura de roles)
      const supabase = await getSupabaseUser(request)
      // ⚠️ TEMPORAL: Fallback a admin si no hay sesión (solo para FASE 0)
      // ANTES DE ACTIVAR RLS: Eliminar este fallback y manejar el error correctamente
      const supabaseClient = supabase || getSupabaseAdmin()
      
      const { data: roleData } = await supabaseClient
        .from('roles')
        .select('nombre')
        .eq('id', user.rol_id)
        .single()
      
      if (roleData?.nombre) {
        roleName = roleData.nombre
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        sub: user.id,
        email: user.email || payload.email,
        name: user.nombre || payload.name, // Cambiado 'nombre' a 'name' para el header
        nombre: user.nombre || payload.name, // Mantener 'nombre' para compatibilidad con cotizaciones
        rol: roleName,
        role: roleName, // Agregar 'role' para compatibilidad con header
        imagen_usuario: user.imagen_usuario || null,
        vendedor: user.vendedor ?? false,
        numero: user.numero || null,
      }
    })
  } catch (error) {
    console.error('Error obteniendo usuario actual:', error)
    return NextResponse.json({ error: 'Error al obtener usuario' }, { status: 500 })
  }
}
