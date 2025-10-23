import { NextRequest, NextResponse } from 'next/server'
import { airtableCreate, airtableList } from '@/lib/airtable-rest'

// Configuración de tablas
const TABLE_SOLICITUDES = process.env.AIRTABLE_TABLE_SOLICITUDES || "Solicitudes"
const TABLE_SOPORTES = process.env.AIRTABLE_TABLE_SOPORTES || "Soportes"

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
function generarSiguienteCodigo(): string {
  // En una implementación real, esto vendría de la base de datos
  const timestamp = Date.now()
  const numero = (timestamp % 1000).toString().padStart(3, '0')
  return `S-${numero}`
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

    // Obtener el código del soporte desde Airtable
    let codigoSoporte = soporte; // Por defecto usar el ID recibido
    try {
      console.log('🔍 Buscando código del soporte:', soporte);
      const soporteData = await airtableList(TABLE_SOPORTES, { filterByFormula: `{ID} = "${soporte}"` });
      if (soporteData.records && soporteData.records.length > 0) {
        codigoSoporte = soporteData.records[0].fields['Código'] || soporte;
        console.log('✅ Código del soporte encontrado:', codigoSoporte);
      } else {
        console.log('⚠️ No se encontró el código del soporte, usando ID recibido:', soporte);
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

    // Crear la solicitud
    const solicitud: SolicitudCotizacion = {
      codigo: generarSiguienteCodigo(),
      fechaCreacion: formatearFechaCreacion(),
      empresa,
      contacto,
      telefono,
      email,
      comentarios: comentarios || '',
      estado: 'Nueva',
      fechaInicio,
      mesesAlquiler: parseInt(mesesAlquiler),
      soporte: codigoSoporte,
      serviciosAdicionales: serviciosNormalizados
    }

    // Guardar en base de datos (Airtable)
    console.log('📋 Solicitud procesada:', solicitud)
    
    try {
      console.log('🔄 Intentando guardar en Airtable...')
      console.log('📊 Datos a enviar:', {
        'Código': solicitud.codigo,
        'Empresa': solicitud.empresa,
        'Contacto': solicitud.contacto,
        'Email': solicitud.email,
        'Teléfono': solicitud.telefono,
        'Soporte': solicitud.soporte, // Código del soporte como texto
        'Meses Alquiler': solicitud.mesesAlquiler
      })
      
      // Preparar campos para Airtable
      const fields: any = {
        'Código': solicitud.codigo,
        'Empresa': solicitud.empresa,
        'Contacto': solicitud.contacto,
        'Email': solicitud.email,
        'Teléfono': solicitud.telefono,
        'Comentarios': solicitud.comentarios,
        'Estado': 'Nueva',
        'Fecha Inicio': solicitud.fechaInicio,
        'Meses alquiler': parseInt(solicitud.mesesAlquiler), // Asegurar que sea número
        'Soporte': solicitud.soporte // Código del soporte como texto
      }
      
      console.log('🔢 Valor de mesesAlquiler:', solicitud.mesesAlquiler, 'tipo:', typeof solicitud.mesesAlquiler)
      console.log('🔢 Valor convertido:', parseInt(solicitud.mesesAlquiler), 'tipo:', typeof parseInt(solicitud.mesesAlquiler))
      console.log('📋 Campos completos que se enviarán a Airtable:', JSON.stringify(fields, null, 2))

      // Solo agregar servicios si hay alguno seleccionado
      if (solicitud.serviciosAdicionales && solicitud.serviciosAdicionales.length > 0) {
        fields['Servicios adicionales'] = solicitud.serviciosAdicionales
        console.log('🔧 Agregando servicios adicionales:', solicitud.serviciosAdicionales)
      }

      // Guardar en Airtable usando la tabla Solicitudes (correcta)
      const airtableResponse = await airtableCreate(TABLE_SOLICITUDES, [{
        fields: fields
      }])
      
      console.log('✅ Solicitud guardada en Airtable (tabla Solicitudes):', JSON.stringify(airtableResponse, null, 2))
    } catch (error: any) {
      console.error('❌ Error guardando en Airtable:', error)
      console.error('❌ Error message:', error.message)
      console.error('❌ Error stack:', error.stack)
      return NextResponse.json(
        { error: 'Error al guardar en Airtable', details: error.message },
        { status: 500 }
      )
    }

    console.log('✅ Respondiendo éxito al cliente')
    return NextResponse.json({
      success: true,
      message: 'Solicitud creada exitosamente',
      solicitud: {
        codigo: solicitud.codigo,
        fechaCreacion: solicitud.fechaCreacion
      }
    })

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
    // Leer desde Airtable
    let solicitudes: SolicitudCotizacion[] = []
    
    try {
      // Leer desde la tabla Solicitudes (correcta)
      const airtableData = await airtableList(TABLE_SOLICITUDES)
      solicitudes = airtableData.records.map((record: any) => ({
        codigo: record.fields['Código'] || '',
        fechaCreacion: record.fields['Fecha Creación'] ? new Date(record.fields['Fecha Creación']).toLocaleString('es-BO') : '',
        empresa: record.fields['Empresa'] || '',
        contacto: record.fields['Contacto'] || '',
        telefono: record.fields['Teléfono'] || '',
        email: record.fields['Email'] || '',
        comentarios: record.fields['Comentarios'] || '',
        estado: record.fields['Estado'] || 'Nueva',
        fechaInicio: record.fields['Fecha Inicio'] || '',
        mesesAlquiler: record.fields['Meses alquiler'] || 0,
        soporte: Array.isArray(record.fields['Soporte']) ? record.fields['Soporte'][0] : (record.fields['Soporte'] || ''),
        serviciosAdicionales: record.fields['Servicios adicionales'] ? 
          (Array.isArray(record.fields['Servicios adicionales']) ? record.fields['Servicios adicionales'] : record.fields['Servicios adicionales'].split(',').map((s: string) => s.trim()).filter((s: string) => s)) : []
      }))
      
      console.log('✅ Solicitudes cargadas desde Airtable (tabla Solicitudes):', solicitudes.length)
    } catch (error) {
      console.error('❌ Error cargando desde Airtable:', error)
      // Usar datos de ejemplo si falla Airtable
      solicitudes = [
        {
          codigo: "S-001",
          fechaCreacion: "15/01/2024 09:30",
          empresa: "Empresa ABC S.A.",
          contacto: "Juan Pérez",
          telefono: "+591 2 1234567",
          email: "juan.perez@empresaabc.com",
          comentarios: "Solicitud de cotización para vallas publicitarias en zona centro",
          estado: "Pendiente",
          fechaInicio: "01/02/2024",
          mesesAlquiler: 6,
          soporte: "V-001",
          serviciosAdicionales: ["Diseño gráfico", "Impresión de lona", "Instalación en valla"]
        }
      ]
    }

    return NextResponse.json(solicitudes)

  } catch (error) {
    console.error('Error al obtener solicitudes:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}