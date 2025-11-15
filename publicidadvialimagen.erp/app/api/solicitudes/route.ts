import { NextRequest, NextResponse } from 'next/server'
import {
  getAllSolicitudes,
  createSolicitud,
  generarSiguienteCodigo
} from '@/lib/supabaseSolicitudes'

// Interface para las solicitudes de cotización
interface SolicitudCotizacion {
  codigo: string
  fechaCreacion: string
  empresa: string
  contacto: string
  telefono: string
  email: string
  comentarios: string
  estado: "Nueva" | "Pendiente" | "Cotizada"
  fechaInicio: string
  mesesAlquiler: number
  soporte: string
  serviciosAdicionales: string[]
}

// Función para generar el siguiente código de solicitud consecutivo
// Ahora usa Supabase
async function obtenerSiguienteCodigo(): Promise<string> {
  return await generarSiguienteCodigo()
}

// Función para formatear fecha y hora actual
function formatearFechaCreacion(): string {
  const ahora = new Date()
  const dia = ahora.getDate().toString().padStart(2, '0')
  const mes = (ahora.getMonth() + 1).toString().padStart(2, '0')
  const año = ahora.getFullYear()
  const horas = ahora.getHours().toString().padStart(2, '0')
  const minutos = ahora.getMinutes().toString().padStart(2, '0')
  
  return `${dia}/${mes}/${año} ${horas}:${minutos}`
}

// Función para normalizar servicios adicionales a las opciones correctas de Airtable
function normalizarServiciosAdicionales(servicios: string[]): string[] {
  const mapeo: Record<string, string> = {
    'Diseño gráfico': 'Diseño Gráfico',
    'diseño gráfico': 'Diseño Gráfico',
    'Diseño Gráfico': 'Diseño Gráfico',
    'Impresión de lona': 'Impresión de lona',
    'impresión de lona': 'Impresión de lona',
    'Instalación en valla': 'Instalación en valla',
    'instalación en valla': 'Instalación en valla'
  }
  
  return servicios.map(servicio => mapeo[servicio] || servicio)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar datos requeridos
    const { 
      empresa, 
      contacto, 
      telefono, 
      email, 
      comentarios, 
      fechaInicio, 
      mesesAlquiler, 
      soporte, 
      serviciosAdicionales = [] 
    } = body

    if (!empresa || !contacto || !telefono || !email || !fechaInicio || !mesesAlquiler || !soporte) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Generar el siguiente código consecutivo
    const codigo = await obtenerSiguienteCodigo()
    
    // Normalizar servicios adicionales
    const serviciosNormalizados = normalizarServiciosAdicionales(
      Array.isArray(serviciosAdicionales) ? serviciosAdicionales : []
    )
    
    console.log('🔧 Servicios originales:', serviciosAdicionales)
    console.log('🔧 Servicios normalizados:', serviciosNormalizados)

    // Crear la solicitud en Supabase
    try {
      const nuevaSolicitud = await createSolicitud(
        codigo,
        'Nueva',
        fechaInicio,
        parseInt(mesesAlquiler),
        soporte,
        serviciosNormalizados,
        empresa,
        contacto,
        telefono,
        email,
        comentarios || ''
      )

      console.log('✅ Solicitud guardada en Supabase:', nuevaSolicitud.codigo)

      return NextResponse.json({
        success: true,
        message: 'Solicitud creada exitosamente',
        solicitud: {
          codigo: nuevaSolicitud.codigo,
          fechaCreacion: nuevaSolicitud.fechaCreacion
        }
      })
    } catch (error: any) {
      console.error('❌ Error guardando en Supabase:', error)
      console.error('❌ Stack trace:', error.stack)
      return NextResponse.json(
        { error: 'Error al guardar en Supabase', details: error.message },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error al crear solicitud:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Leer desde Supabase
    console.log('🔍 Leyendo solicitudes desde Supabase...')
    const solicitudes = await getAllSolicitudes()
    console.log('✅ Solicitudes cargadas desde Supabase:', solicitudes.length)

    return NextResponse.json(solicitudes)

  } catch (error) {
    console.error('Error al obtener solicitudes:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
