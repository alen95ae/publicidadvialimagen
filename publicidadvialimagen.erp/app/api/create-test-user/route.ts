import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import bcrypt from 'bcryptjs'

export async function POST() {
  try {
    // Primero agregar la columna password si no existe
    const { error: alterError } = await supabaseServer.rpc('exec_sql', {
      sql: `
        ALTER TABLE empleados 
        ADD COLUMN IF NOT EXISTS password TEXT;
      `
    })

    if (alterError) {
      console.log('Error adding password column:', alterError)
    }

    // Crear usuario de prueba
    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    const { data, error } = await supabaseServer
      .from('empleados')
      .insert({
        email: 'admin@publicidadvialimagen.com',
        password: hashedPassword,
        nombre: 'Administrador',
        apellidos: 'Sistema',
        rol: 'admin',
        estado: 'activo',
        telefono: '123456789'
      })
      .select()

    if (error) {
      console.error('Error creating user:', error)
      return NextResponse.json({ 
        error: 'Error al crear usuario', 
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Usuario de prueba creado exitosamente',
      user: data[0]
    })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}
