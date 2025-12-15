export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextRequest, NextResponse } from 'next/server'
import {
  getAllSolicitudes,
  createSolicitud,
  generarSiguienteCodigo
} from '@/lib/supabaseSolicitudes'
import { getAllSoportes } from '@/lib/supabaseSoportes'
import { getSupabaseAdmin } from '@/lib/supabaseServer'

// Configuración de tablas
const TABLE_SOLICITUDES = process.env.AIRTABLE_TABLE_SOLICITUDES || "Solicitudes"

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

// Función para generar el siguiente código de solicitud
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
    console.log('🔥 ===== SOLICITUD RECIBIDA EN API =====')
    const body = await request.json()
    console.log('📦 Body recibido:', JSON.stringify(body, null, 2))
    
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

    console.log('🔍 Validando campos requeridos:', {
      empresa: !!empresa,
      contacto: !!contacto,
      telefono: !!telefono,
      email: !!email,
      fechaInicio: !!fechaInicio,
      mesesAlquiler: !!mesesAlquiler,
      soporte: !!soporte
    })

    if (!empresa || !contacto || !telefono || !email || !fechaInicio || !mesesAlquiler || !soporte) {
      console.log('❌ Faltan campos requeridos')
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Obtener el código del soporte desde Supabase
    let codigoSoporte = soporte; // Por defecto usar el código recibido
    try {
      console.log('🔍 Buscando código del soporte:', soporte);
      const soportesData = await getAllSoportes();
      const soporteEncontrado = soportesData.records.find(r => r.id === soporte || r.fields['Código'] === soporte);
      if (soporteEncontrado) {
        codigoSoporte = soporteEncontrado.fields['Código'] || soporte;
        console.log('✅ Código del soporte encontrado:', codigoSoporte);
      } else {
        console.log('⚠️ No se encontró el código del soporte, usando valor recibido:', soporte);
      }
    } catch (error) {
      console.log('⚠️ Error obteniendo código del soporte:', error);
    }

    // Normalizar servicios adicionales
    const serviciosNormalizados = normalizarServiciosAdicionales(
      Array.isArray(serviciosAdicionales) ? serviciosAdicionales : []
    )
    
    console.log('🔧 Servicios originales:', serviciosAdicionales)
    console.log('🔧 Servicios normalizados:', serviciosNormalizados)

    // Generar código
    const codigo = await obtenerSiguienteCodigo()

    // Crear la solicitud en Supabase
    try {
      const nuevaSolicitud = await createSolicitud(
        codigo,
        'Nueva',
        fechaInicio,
        parseInt(mesesAlquiler),
        codigoSoporte,
        serviciosNormalizados,
        empresa,
        contacto,
        telefono,
        email,
        comentarios || ''
      )

      console.log('✅ Solicitud guardada en Supabase:', nuevaSolicitud.codigo)

      // ============================================
      // NOTIFICACIONES → SIDE EFFECT (NO BLOQUEANTE)
      // ============================================
      try {
        const supabase = getSupabaseAdmin();
        
        // Helper local para crear notificación por rol
        const crearNotificacionPorRol = async (rolNombre: string, data: {
          titulo: string;
          mensaje: string;
          tipo: 'info' | 'success' | 'warning' | 'error';
          entidad_tipo: string;
          entidad_id: string;
          prioridad: 'baja' | 'media' | 'alta';
        }) => {
          const rolNormalizado = rolNombre.toLowerCase().trim();
          
          const { error } = await supabase
            .from('notificaciones')
            .insert({
              titulo: data.titulo,
              mensaje: data.mensaje,
              tipo: data.tipo,
              entidad_tipo: data.entidad_tipo,
              entidad_id: data.entidad_id,
              prioridad: data.prioridad,
              roles_destino: [rolNormalizado],
              leida: false,
            });

          if (error) {
            throw error;
          }
        };

        // Crear notificación para 'admin'
        try {
          await crearNotificacionPorRol('admin', {
            titulo: 'Nueva solicitud de cotización',
            mensaje: `${empresa} (${contacto}) ha enviado una solicitud de cotización`,
            tipo: 'info',
            entidad_tipo: 'solicitud',
            entidad_id: nuevaSolicitud.id,
            prioridad: 'alta',
          });
        } catch (error: any) {
          console.error('[NOTIFICACIONES] Error creando notificación de solicitud para admin:', error?.message || 'Unknown');
        }

        // Crear notificación para 'desarrollador'
        try {
          await crearNotificacionPorRol('desarrollador', {
            titulo: 'Nueva solicitud de cotización',
            mensaje: `${empresa} (${contacto}) ha enviado una solicitud de cotización`,
            tipo: 'info',
            entidad_tipo: 'solicitud',
            entidad_id: nuevaSolicitud.id,
            prioridad: 'alta',
          });
        } catch (error: any) {
          console.error('[NOTIFICACIONES] Error creando notificación de solicitud para desarrollador:', error?.message || 'Unknown');
        }
      } catch (notifError: any) {
        // ERROR SILENCIOSO - NO afecta a la solicitud
        console.error('[NOTIFICACIONES] Error en bloque de notificaciones (no bloquea solicitud):', notifError?.message || 'Unknown');
      }

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
      console.error('❌ Error message:', error.message)
      console.error('❌ Error stack:', error.stack)
      return NextResponse.json(
        { error: 'Error al guardar en Supabase', details: error.message },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('❌❌❌ Error al crear solicitud:', error)
    console.error('❌ Error message:', error.message)
    console.error('❌ Error stack:', error.stack)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
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