import { NextResponse } from "next/server"
import { airtable } from "@/lib/airtable"

export async function GET() {
  try {
    console.log('🔍 Debugging Airtable connection...')
    
    // Verificar variables de entorno
    const envVars = {
      AIRTABLE_BASE_ID: process.env.AIRTABLE_BASE_ID ? '✅ Configurado' : '❌ No configurado',
      AIRTABLE_API_KEY: process.env.AIRTABLE_API_KEY ? '✅ Configurado' : '❌ No configurado',
      AIRTABLE_TABLE_SOPORTES: process.env.AIRTABLE_TABLE_SOPORTES ? '✅ Configurado' : '❌ No configurado',
      AIRTABLE_TABLE_CONTACTOS: process.env.AIRTABLE_TABLE_CONTACTOS ? '✅ Configurado' : '❌ No configurado',
      AIRTABLE_TABLE_MENSAJES: process.env.AIRTABLE_TABLE_MENSAJES ? '✅ Configurado' : '❌ No configurado',
      AIRTABLE_TABLE_DUENOS_CASA: process.env.AIRTABLE_TABLE_DUENOS_CASA ? '✅ Configurado' : '❌ No configurado',
    }
    
    console.log('📋 Variables de entorno:', envVars)
    
    // Verificar conexión con Airtable
    const testResponse = await airtable("Soportes").select({
      maxRecords: 1
    }).all()
    
    console.log('✅ Conexión con Airtable exitosa')
    console.log(`📊 Registros encontrados: ${testResponse.length}`)
    
    return NextResponse.json({
      status: 'success',
      message: 'Conexión con Airtable exitosa',
      envVars,
      recordsFound: testResponse.length,
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('❌ Error en conexión con Airtable:', error)
    
    return NextResponse.json({
      status: 'error',
      message: 'Error en conexión con Airtable',
      error: error.message,
      envVars: {
        AIRTABLE_BASE_ID: process.env.AIRTABLE_BASE_ID ? '✅ Configurado' : '❌ No configurado',
        AIRTABLE_API_KEY: process.env.AIRTABLE_API_KEY ? '✅ Configurado' : '❌ No configurado',
        AIRTABLE_TABLE_SOPORTES: process.env.AIRTABLE_TABLE_SOPORTES ? '✅ Configurado' : '❌ No configurado',
        AIRTABLE_TABLE_CONTACTOS: process.env.AIRTABLE_TABLE_CONTACTOS ? '✅ Configurado' : '❌ No configurado',
        AIRTABLE_TABLE_MENSAJES: process.env.AIRTABLE_TABLE_MENSAJES ? '✅ Configurado' : '❌ No configurado',
        AIRTABLE_TABLE_DUENOS_CASA: process.env.AIRTABLE_TABLE_DUENOS_CASA ? '✅ Configurado' : '❌ No configurado',
      },
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}