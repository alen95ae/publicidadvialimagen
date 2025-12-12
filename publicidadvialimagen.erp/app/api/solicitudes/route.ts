import { NextRequest, NextResponse } from 'next/server'
import {
  getAllSolicitudes,
  createSolicitud,
  generarSiguienteCodigo
} from '@/lib/supabaseSolicitudes'
import { getSupabaseUser } from '@/lib/supabaseServer'
import { verifySession } from '@/lib/auth'

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
    // Usar cliente de usuario (RLS controla acceso)
    const supabase = await getSupabaseUser(request);
    
    if (!supabase) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Extraer sesión para obtener user_id
    const token = request.cookies.get('session')?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const session = await verifySession(token);
    if (!session || !session.sub) {
      return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
    }

    const userId = session.sub;

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

    // Crear la solicitud en Supabase usando cliente de usuario
    // RLS controlará el acceso, y asignamos user_id explícitamente
    try {
      const now = new Date().toISOString();
      
      const solicitudData: any = {
        codigo,
        estado: 'Nueva',
        fecha_inicio: fechaInicio,
        meses_alquiler: parseInt(mesesAlquiler),
        soporte,
        servicios_adicionales: serviciosNormalizados.length > 0 ? serviciosNormalizados : null,
        empresa,
        contacto,
        telefono,
        email,
        comentarios: comentarios || '',
        user_id: userId, // Asignar explícitamente user_id del usuario autenticado
        created_at: now,
        updated_at: now
      };

      const { data, error } = await supabase
        .from('solicitudes')
        .insert([solicitudData])
        .select()
        .single();

      if (error) {
        console.error('❌ Error guardando en Supabase:', error);
        return NextResponse.json(
          { error: 'Error al guardar en Supabase', details: error.message },
          { status: 500 }
        );
      }

      if (!data) {
        return NextResponse.json(
          { error: 'Error al guardar en Supabase' },
          { status: 500 }
        );
      }

      // Convertir a formato esperado por el frontend
      const fechaCreacion = data.created_at 
        ? new Date(data.created_at).toLocaleString('es-BO')
        : new Date().toLocaleString('es-BO');

      const nuevaSolicitud = {
        id: data.id,
        codigo: data.codigo,
        fechaCreacion,
        empresa: data.empresa || '',
        contacto: data.contacto || '',
        telefono: data.telefono || '',
        email: data.email || '',
        comentarios: data.comentarios || '',
        estado: data.estado || 'Nueva',
        fechaInicio: data.fecha_inicio,
        mesesAlquiler: data.meses_alquiler,
        soporte: data.soporte,
        serviciosAdicionales: Array.isArray(data.servicios_adicionales) 
          ? data.servicios_adicionales 
          : (data.servicios_adicionales ? [data.servicios_adicionales] : [])
      };

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
    // Usar cliente de usuario (RLS controla acceso)
    const supabase = await getSupabaseUser(request);
    
    if (!supabase) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Leer desde Supabase usando cliente de usuario
    console.log('🔍 Leyendo solicitudes desde Supabase...')
    
    const { data, error } = await supabase
      .from('solicitudes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener solicitudes:', error);
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }

    // Convertir a formato esperado por el frontend
    const solicitudes = (data || []).map((record: any) => {
      const fechaCreacion = record.created_at 
        ? new Date(record.created_at).toLocaleString('es-BO')
        : new Date().toLocaleString('es-BO');

      return {
        id: record.id,
        codigo: record.codigo,
        fechaCreacion,
        empresa: record.empresa || '',
        contacto: record.contacto || '',
        telefono: record.telefono || '',
        email: record.email || '',
        comentarios: record.comentarios || '',
        estado: record.estado || 'Nueva',
        fechaInicio: record.fecha_inicio,
        mesesAlquiler: record.meses_alquiler,
        soporte: record.soporte,
        serviciosAdicionales: Array.isArray(record.servicios_adicionales) 
          ? record.servicios_adicionales 
          : (record.servicios_adicionales ? [record.servicios_adicionales] : [])
      };
    });

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
