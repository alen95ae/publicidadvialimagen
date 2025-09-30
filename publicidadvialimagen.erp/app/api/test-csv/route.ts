import { NextResponse } from 'next/server'
import { parse } from 'csv-parse/sync'

export async function POST(req: Request) {
  try {
    console.log('=== TEST CSV ENDPOINT ===')
    const form = await req.formData()
    const file = form.get('file') as File | null
    
    if (!file) {
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 })
    }
    
    console.log(`Archivo recibido: ${file.name}, tamaño: ${file.size} bytes`)
    
    const buf = Buffer.from(await file.arrayBuffer())
    const csvText = buf.toString('utf8')
    
    console.log('Contenido CSV (primeros 200 chars):', csvText.substring(0, 200))
    
    const rows = parse(csvText, { 
      columns: true, 
      skip_empty_lines: true 
    })
    
    console.log(`CSV parseado: ${rows.length} filas`)
    console.log('Primera fila:', rows[0])
    
    return NextResponse.json({ 
      success: true,
      rows: rows.length,
      firstRow: rows[0],
      message: 'CSV parseado correctamente'
    })
    
  } catch (error) {
    console.error('Error en test CSV:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      }, 
      { status: 500 }
    )
  }
}
