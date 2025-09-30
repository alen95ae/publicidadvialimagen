import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST() {
  try {
    console.log('🏠 Creando propietario por defecto...')

    const defaultOwner = {
      id: '00000000-0000-0000-0000-000000000000',
      nombre: 'Propietario por defecto',
      contacto: 'Sin contacto',
      email: null,
      telefono: null,
      direccion: null,
      ciudad: null,
      codigo_postal: null,
      pais: 'Bolivia',
      tipo_propietario: 'empresa',
      condiciones_renta: null,
      porcentaje_comision: null,
      renta_fija: null,
      estado: 'activo',
      notas: 'Propietario por defecto para soportes sin propietario asignado'
    }

    const { data, error } = await supabaseServer
      .from('duenos_casa')
      .upsert(defaultOwner, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select()

    if (error) {
      console.error('Error creando propietario por defecto:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        message: 'Error creando propietario por defecto'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Propietario por defecto creado exitosamente'
    })

  } catch (error: any) {
    console.error('❌ Error creando propietario por defecto:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        message: 'Error creando propietario por defecto'
      },
      { status: 500 }
    )
  }
}
