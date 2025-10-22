import { NextResponse } from 'next/server'
import { airtableList } from '@/lib/airtable-rest'

export async function GET() {
  try {
    console.log('🧪 === TEST API COTIZACIONES ===')
    console.log('🔍 Verificando configuración...')
    
    // Verificar variables de entorno
    const baseId = process.env.AIRTABLE_BASE_ID
    const apiKey = process.env.AIRTABLE_API_KEY
    const tableSolicitudes = process.env.AIRTABLE_TABLE_SOLICITUDES || "Solicitudes"
    
    console.log('📋 Base ID:', baseId ? '✅ Configurado' : '❌ No configurado')
    console.log('🔑 API Key:', apiKey ? '✅ Configurado' : '❌ No configurado')
    console.log('📊 Tabla:', tableSolicitudes)
    
    if (!baseId || !apiKey) {
      return NextResponse.json({
        error: 'Variables de entorno no configuradas',
        baseId: !!baseId,
        apiKey: !!apiKey
      }, { status: 500 })
    }
    
    console.log('🔄 Intentando conectar con Airtable...')
    
    // Intentar listar la tabla
    const result = await airtableList(tableSolicitudes, {
      maxRecords: 5 // Solo 5 registros para prueba
    })
    
    console.log('📊 Resultado:', {
      hasRecords: !!result.records,
      recordCount: result.records?.length || 0,
      firstRecord: result.records?.[0] || null
    })
    
    return NextResponse.json({
      success: true,
      table: tableSolicitudes,
      recordCount: result.records?.length || 0,
      sampleRecord: result.records?.[0] || null
    })
    
  } catch (error: any) {
    console.error('❌ Error en test:', error)
    return NextResponse.json({
      error: 'Error en test',
      message: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
