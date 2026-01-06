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
import { validateCriticalEndpoint } from "@/lib/api-protection"
import { solicitudesSchema, sanitizeEmailForLog } from "@/lib/validation-schemas"
import { sanitizeText } from "@/lib/sanitize"

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
  // 1. Validación de protección contra bots (ANTES de parsear body)
  const protection = validateCriticalEndpoint(request, false);
  if (!protection.allowed) {
    return protection.response!;
  }

  const requestId = crypto.randomUUID().substring(0, 8);
  console.log(`[${requestId}] Solicitud recibida`);

  try {
    const body = await request.json()
    
    // Validación robusta con Zod
    const validationResult = solicitudesSchema.safeParse(body);
    if (!validationResult.success) {
      console.warn(`[${requestId}] Validación fallida:`, validationResult.error.errors[0]?.message);
      return NextResponse.json(
        { 
          error: validationResult.error.errors[0]?.message || 'Datos inválidos',
          details: validationResult.error.errors.map(e => e.message)
        },
        { status: 400 }
      )
    }

    const { 
      empresa, 
      contacto, 
      telefono, 
      email, 
      comentarios, 
      fechaInicio, 
      mesesAlquiler, 
      soporte, 
      serviciosAdicionales 
    } = validationResult.data

    // Sanitización XSS: eliminar HTML y atributos peligrosos de campos de texto libre
    // Aplicar DESPUÉS de validar con Zod y ANTES de guardar en BD
    const empresaSanitizada = sanitizeText(empresa);
    const contactoSanitizado = sanitizeText(contacto);
    const comentariosSanitizados = comentarios ? sanitizeText(comentarios) : '';
    // NO sanitizar: telefono, email (tienen formato específico validado por Zod)
    // NO sanitizar: fechaInicio, mesesAlquiler, soporte, serviciosAdicionales (no son texto libre)

    // Obtener el código del soporte desde Supabase
    let codigoSoporte = soporte;
    try {
      console.log(`[${requestId}] Buscando código del soporte`);
      const soportesData = await getAllSoportes();
      const soporteEncontrado = soportesData.records.find(r => r.id === soporte || r.fields['Código'] === soporte);
      if (soporteEncontrado) {
        codigoSoporte = soporteEncontrado.fields['Código'] || soporte;
      }
    } catch (error) {
      console.warn(`[${requestId}] Error obteniendo código del soporte`);
    }

    // Normalizar servicios adicionales
    const serviciosNormalizados = normalizarServiciosAdicionales(serviciosAdicionales)

    // Generar código
    const codigo = await obtenerSiguienteCodigo()

    // Crear la solicitud en Supabase
    try {
      const nuevaSolicitud = await createSolicitud(
        codigo,
        'Nueva',
        fechaInicio,
        mesesAlquiler,
        codigoSoporte,
        serviciosNormalizados,
        empresaSanitizada,
        contactoSanitizado,
        telefono,
        email,
        comentariosSanitizados
      )

      console.log(`[${requestId}] Solicitud guardada: ${nuevaSolicitud.codigo}`)

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
            mensaje: `Nueva solicitud recibida (Código: ${nuevaSolicitud.codigo})`,
            tipo: 'info',
            entidad_tipo: 'solicitud',
            entidad_id: nuevaSolicitud.id,
            prioridad: 'alta',
          });
        } catch (error: any) {
          console.error(`[${requestId}] Error creando notificación admin:`, error?.message || 'Unknown');
        }

        // Crear notificación para 'desarrollador'
        try {
          await crearNotificacionPorRol('desarrollador', {
            titulo: 'Nueva solicitud de cotización',
            mensaje: `Nueva solicitud recibida (Código: ${nuevaSolicitud.codigo})`,
            tipo: 'info',
            entidad_tipo: 'solicitud',
            entidad_id: nuevaSolicitud.id,
            prioridad: 'alta',
          });
        } catch (error: any) {
          console.error(`[${requestId}] Error creando notificación desarrollador:`, error?.message || 'Unknown');
        }
      } catch (notifError: any) {
        console.error(`[${requestId}] Error en notificaciones (no bloquea solicitud):`, notifError?.message || 'Unknown');
      }

      console.log(`[${requestId}] Solicitud procesada exitosamente`);
      return NextResponse.json({
        success: true,
        message: 'Solicitud creada exitosamente',
        solicitud: {
          codigo: nuevaSolicitud.codigo,
          fechaCreacion: nuevaSolicitud.fechaCreacion
        }
      })
    } catch (error: any) {
      console.error(`[${requestId}] Error guardando en Supabase:`, error?.message || 'unknown');
      return NextResponse.json(
        { error: 'Error al guardar en Supabase', details: error.message },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error(`[${requestId}] Error al crear solicitud:`, error?.message || 'unknown');
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const solicitudes = await getAllSolicitudes()
    console.log(`[GET] Solicitudes cargadas: ${solicitudes.length}`)
    return NextResponse.json(solicitudes)
  } catch (error: any) {
    console.error('[GET] Error al obtener solicitudes:', error?.message || 'unknown');
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}