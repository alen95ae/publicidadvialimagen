import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🔍 === DIAGNÓSTICO AIRTABLE ===')
    
    // Verificar variables de entorno
    const baseId = process.env.AIRTABLE_BASE_ID
    const apiKey = process.env.AIRTABLE_API_KEY
    const tableSolicitudes = process.env.AIRTABLE_TABLE_SOLICITUDES
    
    const config = {
      baseId: baseId ? '✅ Configurado' : '❌ No configurado',
      apiKey: apiKey ? '✅ Configurado' : '❌ No configurado',
      tableSolicitudes: tableSolicitudes || 'Solicitudes (default)',
      nodeEnv: process.env.NODE_ENV
    }
    
    console.log('📋 Configuración:', config)
    
    return NextResponse.json({
      success: true,
      config,
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('❌ Error en diagnóstico:', error)
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
