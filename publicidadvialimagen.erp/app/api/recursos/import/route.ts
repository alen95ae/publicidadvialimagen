import { NextResponse } from 'next/server'
import { parse } from 'csv-parse/sync'
import { createRecurso } from '@/lib/airtableRecursos'

export async function POST(req: Request) {
  try {
    console.log('=== INICIO IMPORTACIÓN RECURSOS ===')
    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) {
      console.log('Error: No se recibió archivo')
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 })
    }
    
    console.log(`Archivo recibido: ${file.name}, tamaño: ${file.size} bytes`)

    const buf = Buffer.from(await file.arrayBuffer())
    // Decodificación robusta: intentar UTF-8 y, si hay caracteres de reemplazo, probar latin1
    let csvText = buf.toString('utf8')
    if (csvText.includes('\uFFFD')) {
      console.log('Detectados caracteres de reemplazo, probando latin1...')
      csvText = buf.toString('latin1')
    }

    console.log(`CSV decodificado, longitud: ${csvText.length} caracteres`)

    // Parsear CSV
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    })

    console.log(`CSV parseado: ${records.length} registros encontrados`)

    if (records.length === 0) {
      return NextResponse.json({ error: 'El archivo CSV está vacío' }, { status: 400 })
    }

    // Validar columnas requeridas
    const requiredColumns = ['codigo', 'nombre', 'categoria', 'responsable', 'unidad_medida', 'cantidad', 'coste']
    const firstRecord = records[0] as Record<string, any>
    const missingColumns = requiredColumns.filter(col => !(col in firstRecord))
    
    if (missingColumns.length > 0) {
      return NextResponse.json({ 
        error: `Faltan columnas requeridas: ${missingColumns.join(', ')}` 
      }, { status: 400 })
    }

    let created = 0
    let updated = 0
    let errors = 0
    const errorMessages: string[] = []

    // Procesar cada registro
    for (let i = 0; i < records.length; i++) {
      try {
        const record = records[i] as Record<string, any>
        
        // Convertir datos del CSV al formato de Airtable
        const recursoData = {
          codigo: record.codigo?.toString().trim() || '',
          nombre: record.nombre?.toString().trim() || '',
          descripcion: record.descripcion?.toString().trim() || '',
          categoria: (record.categoria?.toString().trim() === 'Mano de Obra' ? 'Mano de Obra' : 'Insumos') as 'Insumos' | 'Mano de Obra',
          responsable: record.responsable?.toString().trim() || '',
          unidad_medida: record.unidad_medida?.toString().trim() || '',
          cantidad: parseInt(record.cantidad) || 0,
          coste: parseFloat(record.coste) || 0,
          precio_venta: record.precio_venta ? parseFloat(record.precio_venta) : 0,
          fecha_creacion: new Date().toISOString(),
          fecha_actualizacion: new Date().toISOString()
        }

        // Validar datos requeridos
        if (!recursoData.codigo || !recursoData.nombre) {
          errorMessages.push(`Fila ${i + 2}: Código y nombre son requeridos`)
          errors++
          continue
        }

        // Crear recurso en Airtable
        await createRecurso(recursoData)
        created++

        console.log(`✅ Recurso creado: ${recursoData.codigo} - ${recursoData.nombre}`)

      } catch (error) {
        console.error(`❌ Error procesando fila ${i + 2}:`, error)
        errorMessages.push(`Fila ${i + 2}: ${error instanceof Error ? error.message : 'Error desconocido'}`)
        errors++
      }
    }

    console.log(`=== IMPORTACIÓN COMPLETADA ===`)
    console.log(`Creados: ${created}, Errores: ${errors}`)

    return NextResponse.json({
      success: true,
      created,
      updated,
      errors,
      errorMessages: errorMessages.slice(0, 10) // Solo los primeros 10 errores
    })

  } catch (error) {
    console.error('❌ Error en importación:', error)
    return NextResponse.json(
      { success: false, error: 'Error al procesar el archivo CSV' },
      { status: 500 }
    )
  }
}