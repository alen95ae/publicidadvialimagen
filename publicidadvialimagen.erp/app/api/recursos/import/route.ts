import { NextResponse } from 'next/server'
import { parse } from 'csv-parse/sync'
import { createRecurso } from '@/lib/supabaseRecursos'

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 })
    }

    const buf = Buffer.from(await file.arrayBuffer())
    // Decodificación robusta: intentar UTF-8 y, si hay caracteres de reemplazo, probar latin1
    let csvText = buf.toString('utf8')
    if (csvText.includes('\uFFFD')) {
      csvText = buf.toString('latin1')
    }

    // Parsear CSV
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    })

    if (records.length === 0) {
      return NextResponse.json({ error: 'El archivo CSV está vacío' }, { status: 400 })
    }

    // Validar columnas requeridas
    // NOTA: cantidad NO se incluye porque no existe en la tabla recursos de Supabase
    const requiredColumns = ['codigo', 'nombre', 'categoria', 'responsable', 'unidad_medida', 'coste']
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
        
        // Convertir datos del CSV al formato de Supabase
        // NOTA: cantidad y descripcion NO se incluyen porque no existen en la tabla recursos de Supabase
        const recursoData = {
          codigo: record.codigo?.toString().trim() || '',
          nombre: record.nombre?.toString().trim() || '',
          categoria: (record.categoria?.toString().trim() === 'Mano de Obra' ? 'Mano de Obra' : 'Insumos') as 'Insumos' | 'Mano de Obra',
          responsable: record.responsable?.toString().trim() || '',
          unidad_medida: record.unidad_medida?.toString().trim() || '',
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

        // Crear recurso en Supabase
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