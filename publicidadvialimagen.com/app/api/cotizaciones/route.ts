export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextResponse } from 'next/server'
import { getAllSolicitudes } from '@/lib/supabaseSolicitudes'

export async function GET() {
  try {
    console.log('📋 === INICIANDO CARGA DE COTIZACIONES ===')
    console.log('📋 Usando Supabase (tabla: solicitudes)')
    
    // Obtener todas las solicitudes desde Supabase
    const solicitudes = await getAllSolicitudes()

    console.log('📊 Resultado recibido:', {
      hasRecords: !!solicitudes,
      recordCount: solicitudes?.length || 0
    })

    if (!solicitudes || solicitudes.length === 0) {
      console.log('⚠️ No se encontraron registros en Supabase')
      return NextResponse.json([])
    }

    console.log('🔄 Transformando datos...')
    
    // Transformar los datos de Supabase al formato esperado por el frontend
    const cotizaciones = solicitudes.map((solicitud) => {
      return {
        id: solicitud.codigo || solicitud.id || '',
        created_at: solicitud.fechaCreacion || new Date().toISOString(),
        empresa: solicitud.empresa || '',
        email: solicitud.email || '',
        telefono: solicitud.telefono || '',
        mensaje: solicitud.comentarios || '',
        estado: solicitud.estado || 'Nueva',
        respuesta: '', // Campo no disponible en Supabase actualmente
        fecha_respuesta: '', // Campo no disponible en Supabase actualmente
        soporte: solicitud.soporte || '',
        fecha_inicio: solicitud.fechaInicio || '',
        meses_alquiler: solicitud.mesesAlquiler || 0,
        servicios_adicionales: solicitud.serviciosAdicionales || []
      }
    })

    console.log(`✅ Se cargaron ${cotizaciones.length} cotizaciones`)
    return NextResponse.json(cotizaciones)

  } catch (error: any) {
    console.error('❌ === ERROR EN API COTIZACIONES ===')
    console.error('❌ Error:', error.message)
    console.error('❌ Stack:', error.stack)
    
    return NextResponse.json(
      { 
        error: 'Error al cargar cotizaciones',
        message: error.message
      },
      { status: 500 }
    )
  }
}
