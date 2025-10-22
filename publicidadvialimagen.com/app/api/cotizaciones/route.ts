import { NextResponse } from 'next/server'
import { airtableList } from '@/lib/airtable-rest'

// Usar la misma configuración que el API de solicitudes
const TABLE_SOLICITUDES = process.env.AIRTABLE_TABLE_SOLICITUDES || "Solicitudes"

export async function GET() {
  try {
    console.log('📋 === INICIANDO CARGA DE COTIZACIONES ===')
    console.log('📋 Usando tabla:', TABLE_SOLICITUDES)
    
    // Verificar configuración básica
    if (!process.env.AIRTABLE_BASE_ID || !process.env.AIRTABLE_API_KEY) {
      console.error('❌ Variables de entorno no configuradas')
      return NextResponse.json(
        { error: 'Configuración de Airtable no encontrada' },
        { status: 500 }
      )
    }
    
    console.log('🔄 Conectando con Airtable...')
    
    // Obtener todas las solicitudes de cotización desde Airtable
    const result = await airtableList(TABLE_SOLICITUDES, {})

    console.log('📊 Resultado recibido:', {
      hasRecords: !!result?.records,
      recordCount: result?.records?.length || 0
    })

    if (!result || !result.records || result.records.length === 0) {
      console.log('⚠️ No se encontraron registros en Airtable')
      return NextResponse.json([])
    }

    console.log('🔄 Transformando datos...')
    
    // Transformar los datos de forma más segura
    const cotizaciones = result.records.map((record: any) => {
      const fields = record.fields || {}
      return {
        id: record.id || '',
        created_at: fields['Fecha Creación'] || new Date().toISOString(),
        empresa: fields['Empresa'] || '',
        email: fields['Email'] || '',
        telefono: fields['Teléfono'] || '',
        mensaje: fields['Comentarios'] || '',
        estado: fields['Estado'] || 'Nueva',
        respuesta: fields['Respuesta'] || '',
        fecha_respuesta: fields['Fecha Respuesta'] || '',
        soporte: Array.isArray(fields['Soporte']) ? fields['Soporte'][0] : (fields['Soporte'] || ''),
        fecha_inicio: fields['Fecha Inicio'] || '',
        meses_alquiler: fields['Meses alquiler'] || 0,
        servicios_adicionales: fields['Servicios adicionales'] || []
      }
    })

    console.log(`✅ Se cargaron ${cotizaciones.length} cotizaciones`)
    return NextResponse.json(cotizaciones)

  } catch (error: any) {
    console.error('❌ === ERROR EN API COTIZACIONES ===')
    console.error('❌ Error:', error.message)
    console.error('❌ Stack:', error.stack)
    console.error('❌ Tabla:', TABLE_SOLICITUDES)
    
    return NextResponse.json(
      { 
        error: 'Error al cargar cotizaciones',
        message: error.message,
        table: TABLE_SOLICITUDES
      },
      { status: 500 }
    )
  }
}
