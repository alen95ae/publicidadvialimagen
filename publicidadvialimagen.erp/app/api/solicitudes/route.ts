import { NextRequest, NextResponse } from 'next/server'
import { airtableCreate, airtableList } from '@/lib/airtable-rest'

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
async function generarSiguienteCodigo(): Promise<string> {
  try {
    // Obtener todas las solicitudes existentes desde Airtable
    const airtableData = await airtableList('Solicitudes')
    
    // Filtrar códigos que empiecen con "SC-" y extraer números
    const codigosSC = airtableData.records
      .map((record: any) => record.fields['Código'])
      .filter((codigo: string) => codigo && codigo.startsWith('SC-'))
      .map((codigo: string) => {
        const match = codigo.match(/^SC-(\d+)$/)
        return match ? parseInt(match[1]) : 0
      })
      .filter((numero: number) => numero > 0)
    
    // Encontrar el siguiente número disponible
    const siguienteNumero = codigosSC.length > 0 ? Math.max(...codigosSC) + 1 : 1
    
    // Formatear con 3 dígitos
    const numeroFormateado = siguienteNumero.toString().padStart(3, '0')
    
    return `SC-${numeroFormateado}`
    
  } catch (error) {
    console.error('Error obteniendo códigos existentes:', error)
    // Fallback: empezar desde SC-001
    return 'SC-001'
  }
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
    const codigo = await generarSiguienteCodigo()
    
    // Normalizar servicios adicionales
    const serviciosNormalizados = normalizarServiciosAdicionales(
      Array.isArray(serviciosAdicionales) ? serviciosAdicionales : []
    )
    
    console.log('🔧 Servicios originales:', serviciosAdicionales)
    console.log('🔧 Servicios normalizados:', serviciosNormalizados)
    
    // Crear la solicitud
    const solicitud: SolicitudCotizacion = {
      codigo,
      fechaCreacion: formatearFechaCreacion(),
      empresa,
      contacto,
      telefono,
      email,
      comentarios: comentarios || '',
      estado: 'Nueva',
      fechaInicio,
      mesesAlquiler: parseInt(mesesAlquiler),
      soporte,
      serviciosAdicionales: serviciosNormalizados
    }

    // Guardar en base de datos (Airtable)
    console.log('Nueva solicitud recibida:', solicitud)
    
    try {
      // Guardar en Airtable usando la tabla Solicitudes (correcta)
      console.log('🔍 Intentando guardar en Airtable con datos:', {
        codigo: solicitud.codigo,
        empresa: solicitud.empresa,
        mesesAlquiler: solicitud.mesesAlquiler,
        soporte: solicitud.soporte
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
        'Meses alquiler': solicitud.mesesAlquiler,
        'Soporte': solicitud.soporte
      }
      
      // Solo agregar servicios si hay alguno seleccionado
      if (solicitud.serviciosAdicionales && solicitud.serviciosAdicionales.length > 0) {
        fields['Servicios adicionales'] = solicitud.serviciosAdicionales
        console.log('🔧 Agregando servicios adicionales:', solicitud.serviciosAdicionales)
      }
      
      const airtableResponse = await airtableCreate('Solicitudes', [{
        fields: fields
      }])
      
      console.log('✅ Solicitud guardada en Airtable (tabla Solicitudes):', airtableResponse)
    } catch (error) {
      console.error('❌ Error guardando en Airtable:', error)
      console.error('❌ Stack trace:', error.stack)
      return NextResponse.json(
        { error: 'Error al guardar en Airtable', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Solicitud creada exitosamente',
      solicitud: {
        codigo: solicitud.codigo,
        fechaCreacion: solicitud.fechaCreacion
      }
    })

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
    // Leer desde Airtable
    let solicitudes: SolicitudCotizacion[] = []
    
    try {
      // Leer desde la tabla Solicitudes (correcta)
      console.log('🔍 Leyendo solicitudes desde Airtable...')
      const airtableData = await airtableList('Solicitudes')
      console.log('📊 Records raw de Airtable:', airtableData.records.length)
      
      // Obtener códigos de soportes para mapear IDs a códigos
      let soportesMap: { [key: string]: string } = {}
      try {
        const soportesData = await airtableList('Soportes')
        soportesMap = soportesData.records.reduce((acc: { [key: string]: string }, record: any) => {
          acc[record.id] = record.fields['Código'] || record.fields['ID'] || record.id
          return acc
        }, {})
        console.log('📋 Mapa de soportes creado:', Object.keys(soportesMap).length, 'soportes')
      } catch (error) {
        console.log('⚠️ Error obteniendo soportes, usando IDs directamente:', error)
      }

      solicitudes = airtableData.records.map((record: any) => {
        const soporteId = record.fields['Soporte'] ? 
          (Array.isArray(record.fields['Soporte']) ? record.fields['Soporte'][0] : record.fields['Soporte']) : ''
        
        console.log(`🔍 Procesando solicitud ${record.fields['Código']}:`)
        console.log(`  - Soporte ID: ${soporteId}`)
        console.log(`  - Mapa de soportes:`, soportesMap)
        
        const soporteCodigo = soporteId ? (soportesMap[soporteId] || soporteId) : ''
        
        console.log(`  - Código de soporte resultante: ${soporteCodigo}`)
        
        return {
          codigo: record.fields['Código'] || '',
          fechaCreacion: record.fields['Fecha Creación'] ? 
            new Date(record.fields['Fecha Creación']).toLocaleString('es-BO') : 
            new Date().toLocaleString('es-BO'),
          empresa: record.fields['Empresa'] || '',
          contacto: record.fields['Contacto'] || '',
          telefono: record.fields['Teléfono'] || '',
          email: record.fields['Email'] || '',
          comentarios: record.fields['Comentarios'] || '',
          estado: record.fields['Estado'] || 'Nueva',
          fechaInicio: record.fields['Fecha Inicio'] || '',
          mesesAlquiler: record.fields['Meses alquiler'] || 0,
          soporte: soporteCodigo,
          serviciosAdicionales: record.fields['Servicios adicionales'] ? 
            (Array.isArray(record.fields['Servicios adicionales']) ? 
              record.fields['Servicios adicionales'] : 
              record.fields['Servicios adicionales'].split(',').map((s: string) => s.trim()).filter((s: string) => s)) : []
        }
      })
      
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