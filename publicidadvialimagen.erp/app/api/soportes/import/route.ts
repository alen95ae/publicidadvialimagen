import { NextRequest, NextResponse } from 'next/server'
import { getSoportes, createSoporte, updateSoporte, getSoporteById } from '@/lib/supabaseSoportes'
import { buildPayload, processCsvRow } from '../helpers'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 })
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'El archivo debe ser un CSV' }, { status: 400 })
    }

    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      return NextResponse.json({ error: 'El archivo CSV debe tener al menos una fila de datos' }, { status: 400 })
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const dataRows = lines.slice(1)

    console.log('📊 Headers:', headers)
    console.log('📊 Data rows:', dataRows.length)

    let created = 0
    let updated = 0
    let skipped = 0
    let errors = 0
    const errorMessages: string[] = []

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i]
      if (!row.trim()) continue

      try {
        const values = row.split(',').map(v => v.trim().replace(/"/g, ''))
        
        if (values.length !== headers.length) {
          errorMessages.push(`Fila ${i + 2}: Número de columnas incorrecto`)
          errors++
          continue
        }

        // Crear objeto con los datos de la fila
        const rowData: any = {}
        headers.forEach((header, index) => {
          rowData[header] = values[index] || ''
        })

        console.log(`📊 Procesando fila ${i + 2}:`, rowData)

        // Procesar la fila usando la función existente
        const processedData = processCsvRow(rowData)
        
        // Verificar si ya existe un soporte con este código
        const existingResult = await getSoportes({
          q: processedData.code,
          limit: 1
        })

        if (existingResult.records.length > 0) {
          // Actualizar registro existente
          const existing = existingResult.records[0]
          const payload = buildPayload(processedData, existing.fields)
          await updateSoporte(existing.id, payload)
          updated++
          console.log(`✅ Actualizado: ${processedData.code}`)
        } else {
          // Crear nuevo registro
          const payload = buildPayload(processedData)
          await createSoporte(payload)
          created++
          console.log(`✅ Creado: ${processedData.code}`)
        }

      } catch (error) {
        console.error(`❌ Error en fila ${i + 2}:`, error)
        errorMessages.push(`Fila ${i + 2}: ${error instanceof Error ? error.message : 'Error desconocido'}`)
        errors++
      }
    }

    return NextResponse.json({
      success: true,
      created,
      updated,
      skipped,
      errors,
      errorMessages: errorMessages.slice(0, 10) // Limitar a 10 errores
    })

  } catch (error) {
    console.error('❌ Error en importación:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

