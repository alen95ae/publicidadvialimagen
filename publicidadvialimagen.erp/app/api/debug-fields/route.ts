import { NextResponse } from "next/server"
import { airtable } from "@/lib/airtable"

export async function GET() {
  try {
    console.log('🔍 Obteniendo campos de la tabla Soportes...')
    
    // Obtener un registro para ver los campos disponibles
    const response = await airtable("Soportes").select({
      maxRecords: 1
    }).all()
    
    if (response.length === 0) {
      return NextResponse.json({
        status: 'error',
        message: 'No hay registros en la tabla Soportes'
      })
    }
    
    const record = response[0]
    const fields = Object.keys(record.fields)
    
    console.log('📋 Campos encontrados en Airtable:')
    fields.forEach(field => console.log(`   - ${field}`))
    
    return NextResponse.json({
      status: 'success',
      message: 'Campos obtenidos correctamente',
      fields: fields.sort(),
      totalFields: fields.length,
      sampleRecord: {
        id: record.id,
        fields: record.fields
      }
    })
    
  } catch (error: any) {
    console.error('❌ Error obteniendo campos:', error)
    
    return NextResponse.json({
      status: 'error',
      message: 'Error obteniendo campos de Airtable',
      error: error.message
    }, { status: 500 })
  }
}
