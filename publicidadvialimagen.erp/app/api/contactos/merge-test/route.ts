import { NextResponse } from "next/server"
import { airtable } from "@/lib/airtable"

export async function POST(request: Request) {
  try {
    console.log('🧪 Starting merge test...')
    
    const { primaryId, duplicateIds } = await request.json()
    console.log('📥 Request data:', { primaryId, duplicateIds })

    if (!primaryId || !duplicateIds || !Array.isArray(duplicateIds) || duplicateIds.length === 0) {
      console.log('❌ Invalid request data')
      return NextResponse.json({ error: "IDs requeridos" }, { status: 400 })
    }

    // Solo verificar que los contactos existen, sin modificar nada
    console.log('📋 Step 1: Finding primary contact:', primaryId)
    let primary
    try {
      primary = await airtable("Contactos").find(primaryId)
      console.log('✅ Primary found:', primary.fields['Nombre'])
    } catch (primaryError) {
      console.error('❌ Primary not found:', primaryError)
      return NextResponse.json({ error: "Contacto principal no encontrado" }, { status: 404 })
    }

    // Verificar duplicados
    console.log('📋 Step 2: Finding duplicates...')
    const duplicates = [] as any[]
    for (const id of duplicateIds) {
      try {
        console.log('📋 Finding duplicate:', id)
        const r = await airtable("Contactos").find(id)
        duplicates.push(r)
        console.log('✅ Duplicate found:', r.fields['Nombre'])
      } catch (e) {
        console.log('❌ Duplicate not found:', id, e)
      }
    }

    console.log('📊 Found', duplicates.length, 'duplicates to merge')
    console.log('✅ Merge test completed successfully (no actual merge performed)')
    
    return NextResponse.json({ 
      success: true, 
      message: "Test completed - no actual merge performed",
      primary: {
        id: primary.id,
        name: primary.fields['Nombre']
      },
      duplicates: duplicates.map(d => ({
        id: d.id,
        name: d.fields['Nombre']
      }))
    })
  } catch (error) {
    console.error("❌ Error in merge test:", error)
    console.error("❌ Error details:", error instanceof Error ? error.message : String(error))
    console.error("❌ Error stack:", error instanceof Error ? error.stack : 'No stack')
    return NextResponse.json({ 
      error: "Error en test de merge", 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
