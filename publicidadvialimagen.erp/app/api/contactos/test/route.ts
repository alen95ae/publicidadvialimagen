import { NextResponse } from "next/server"
import { airtable } from "@/lib/airtable"

export async function GET() {
  try {
    console.log('🧪 Testing Airtable connection...')
    
    // Probar obtener un contacto
    const records = await airtable("Contactos").select({
      maxRecords: 1
    }).all()
    
    console.log('✅ Airtable connection successful')
    console.log('📊 Found records:', records.length)
    
    if (records.length > 0) {
      console.log('📋 Sample record:', {
        id: records[0].id,
        name: records[0].fields['Nombre'] || 'No name',
        fields: Object.keys(records[0].fields)
      })
    }
    
    return NextResponse.json({ 
      success: true, 
      records: records.length,
      sample: records.length > 0 ? {
        id: records[0].id,
        name: records[0].fields['Nombre'] || 'No name'
      } : null
    })
  } catch (error) {
    console.error("❌ Airtable test failed:", error)
    return NextResponse.json({ 
      error: "Airtable connection failed",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
