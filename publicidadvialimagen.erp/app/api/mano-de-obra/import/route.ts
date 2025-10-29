import { NextResponse } from 'next/server'
import { parse } from 'csv-parse/sync'

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 })
    }

    const buf = Buffer.from(await file.arrayBuffer())
    // Intentar UTF-8; si hay caracteres de reemplazo, probar latin1
    let csvText = buf.toString('utf8')
    if (csvText.includes('\uFFFD')) {
      const latin1 = buf.toString('latin1')
      if (/[áéíóúÁÉÍÓÚñÑ]/.test(latin1)) {
        csvText = latin1
      }
    }

    const rows = parse(csvText, { columns: true, skip_empty_lines: true })

    // Esta ruta de importación es mock: valida y devuelve conteos sin persistir
    let created = 0, updated = 0, errors = 0
    const errorMessages: string[] = []

    for (const [index, r] of rows.entries()) {
      const codigo = String(r.codigo || r.Codigo || '').trim()
      if (!codigo) {
        errorMessages.push(`Fila ${index + 2}: Código requerido`)
        errors++
        continue
      }
      created++
    }

    return NextResponse.json({ ok: true, created, updated, errors, errorMessages })
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}



