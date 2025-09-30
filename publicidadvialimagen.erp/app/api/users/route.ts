import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabaseServer"

export async function GET() {
  try {
    const { data: users, error } = await supabaseServer
      .from('empleados')
      .select('id, nombre, apellidos, email, rol, created_at')
      .eq('estado', 'activo')
      .order('nombre', { ascending: true })
    
    if (error) {
      console.error('Error fetching users from Supabase:', error)
      return NextResponse.json({ error: 'Error obteniendo usuarios' }, { status: 500 })
    }
    
    // Transformar datos para mantener compatibilidad
    const transformedUsers = (users || []).map(user => ({
      id: user.id,
      name: `${user.nombre} ${user.apellidos}`.trim(),
      email: user.email,
      role: user.rol,
      createdAt: user.created_at
    }))
    
    return NextResponse.json(transformedUsers)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
