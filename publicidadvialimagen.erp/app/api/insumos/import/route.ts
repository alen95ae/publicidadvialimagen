import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { parse } from 'csv-parse/sync'

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
      const latin1 = buf.toString('latin1')
      // Usar latin1 si parece contener tildes válidas
      if (/[áéíóúÁÉÍÓÚñÑ]/.test(latin1)) {
        csvText = latin1
      }
    }
    const rows = parse(csvText, { columns: true, skip_empty_lines: true })

    let created = 0, updated = 0, errors = 0
    const errorMessages: string[] = []

    // Normaliza cadenas: quita tildes/diacríticos, espacios extra y a minúsculas
    const normalize = (value: string) => {
      let str = (value || "").toString().trim()
      
      // Reemplazos específicos para caracteres mal codificados
      str = str.replace(/\x92/g, 'í') // Categoría
      str = str.replace(/\x97/g, 'ó') // impresión
      str = str.replace(/\x84/g, 'ñ') // señalética  
      str = str.replace(/\x83/g, 'é') // señalética
      str = str.replace(/\x87/g, 'á') // máxima
      str = str.replace(/\x96/g, 'ñ') // señalética
      str = str.replace(/\x8E/g, 'í') // señalética
      
      return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // quitar diacríticos
        .replace(/[\x00-\x1F\x7F\x80-\x9F]/g, '') // quitar control chars
        .replace(/\s+/g, ' ')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // dejar solo alfanumérico y espacios
    }

    // Categorías permitidas (exactas en DB)
    const allowedCategories = [
      'Categoria general',
      'Corte y grabado',
      'Displays',
      'Impresion digital',
      'Insumos',
      'Mano de obra',
    ] as const

    // Índice por forma normalizada para aceptar variantes con/ sin tildes y abreviadas
    const normalizedCategoryToCanonical = (() => {
      const index = new Map<string, string>()
      for (const c of allowedCategories) {
        index.set(normalize(c), c)
      }
      // Variantes adicionales con acentos/mayúsculas
      index.set(normalize('Categoría general'), 'Categoria general')
      index.set(normalize('CATEGORIA GENERAL'), 'Categoria general')
      index.set(normalize('Impresión digital'), 'Impresion digital')
      index.set(normalize('IMPRESION DIGITAL'), 'Impresion digital')
      index.set(normalize('Impresión Digital'), 'Impresion digital')
      index.set(normalize('CORTE Y GRABADO'), 'Corte y grabado')
      index.set(normalize('Corte Y Grabado'), 'Corte y grabado')
      index.set(normalize('DISPLAYS'), 'Displays')
      index.set(normalize('INSUMOS'), 'Insumos')
      index.set(normalize('MANO DE OBRA'), 'Mano de obra')
      index.set(normalize('Mano De Obra'), 'Mano de obra')
      return index
    })()

    const mapCategory = (raw: string): string => {
      const n = normalize(raw)
      if (!n) return 'Insumos' // Default para insumos
      const exact = normalizedCategoryToCanonical.get(n)
      if (exact) return exact
      // heurísticos por tokens
      const tokens = new Set(n.split(' '))
      const has = (w: string) => Array.from(tokens).some(t => t.startsWith(w))
      if ((has('impresion') || has('impresi')) && has('digital')) return 'Impresion digital'
      if (has('corte') && (has('grabado') || has('grab'))) return 'Corte y grabado'
      if (has('categoria') && has('general')) return 'Categoria general'
      if (has('display') || has('displays')) return 'Displays'
      if (has('insumo') || has('insumos')) return 'Insumos'
      if (has('mano') && has('obra')) return 'Mano de obra'
      // Fallback: si contiene "insumo" por separado
      if (has('insumo')) return 'Insumos'
      return 'Insumos' // Default para insumos
    }

    // Unidades permitidas por constraint
    const allowedUnits = [
      'unidad', 'm²', 'kg', 'hora', 'metro', 'litro', 'pieza', 'rollo', 'pliego'
    ] as const

    const normalizedUnitToCanonical = (() => {
      const idx = new Map<string, string>()
      for (const u of allowedUnits) idx.set(normalize(u), u)
      // variantes comunes
      idx.set('m2', 'm²')
      idx.set('m^2', 'm²')
      idx.set('m²', 'm²')
      idx.set('m_', 'm²')
      idx.set('mt2', 'm²')
      idx.set('mts2', 'm²')
      idx.set('metros2', 'm²')
      idx.set('metros', 'metro')
      idx.set('metro(s)', 'metro')
      idx.set('unidades', 'unidad')
      idx.set('uds', 'unidad')
      idx.set('uds.', 'unidad')
      idx.set('ud', 'unidad')
      idx.set('l', 'litro')
      idx.set('lt', 'litro')
      idx.set('lts', 'litro')
      idx.set('litros', 'litro')
      idx.set('hrs', 'hora')
      idx.set('hr', 'hora')
      idx.set('horas', 'hora')
      idx.set('kgs', 'kg')
      idx.set('kg(s)', 'kg')
      // Unidades adicionales del CSV
      idx.set('resma', 'pieza')
      idx.set('km', 'metro')
      idx.set('kilometro', 'metro')
      idx.set('kilometros', 'metro')
      return idx
    })()

    const mapUnit = (raw: string): string => {
      const n = normalize(raw)
      if (!n) return 'unidad'
      const direct = normalizedUnitToCanonical.get(n)
      if (direct) return direct
      if (n === 'm') return 'metro'
      if (n === 'm_') return 'm²'
      return raw
    }

    for (const [index, r] of rows.entries()) {
      // Declarar variables fuera del try para usarlas en el catch
      let categoriaRaw = ''
      let unidadRaw = ''
      
      try {
        // Columnas esperadas (case-insensitive)
        const codigo = String(r.codigo || r.Codigo || r.CÓDIGO || '').trim()
        if (!codigo) {
          errorMessages.push(`Fila ${index + 2}: Código requerido`)
          errors++
          continue
        }
        
        // Mapear a categorías y unidades canónicas, tolerando acentos y abreviaturas
        categoriaRaw = (r.categoria ?? r.Categoría ?? r.CATEGORIA ?? '') as string
        const categoria = mapCategory(categoriaRaw)

        unidadRaw = (
          r.unidad ?? r.Unidad ?? r['Unidad de Medida'] ?? r.unidad_medida ?? r['unidad_medida'] ?? r.unidad_medi ?? r['unidad_medi'] ?? ''
        ) as string
        const unidad_medida = mapUnit(unidadRaw)

        const data: any = {
          codigo,
          nombre: r.nombre || r.Nombre || '',
          descripcion: r.descripcion || r.Descripción || r.descripcion || '',
          categoria,
          cantidad: r.cantidad ? Number(r.cantidad) : 0,
          unidad_medida,
          coste: (r.coste ?? r.Coste ?? r['Coste']) ? Number(r.coste ?? r.Coste ?? r['Coste']) : 0,
          responsable: r.responsable || r.Responsable || '',
          disponibilidad: r.disponibilidad || r.Disponibilidad || 'Disponible'
        }
        
        // Asegurar que coste no sea null
        if (data.coste === null || data.coste === undefined || isNaN(data.coste)) {
          data.coste = 0
        }

        // Verificar si existe el item
        const { data: existingItem } = await supabaseServer
          .from('insumos')
          .select('codigo')
          .eq('codigo', codigo)
          .single()

        if (existingItem) { 
          const { error } = await supabaseServer
            .from('insumos')
            .update(data)
            .eq('codigo', codigo)
          
          if (error) throw error
          updated++ 
        } else { 
          const { error } = await supabaseServer
            .from('insumos')
            .insert([data])
          
          if (error) throw error
          created++ 
        }
        } catch (error) {
          console.error(`Error en fila ${index + 2}:`, error)
          let errorMsg = 'Error desconocido'
          if (error instanceof Error) {
            if (error.message.includes('categoria_check')) {
              errorMsg = `Categoría '${categoriaRaw}' no válida. Use: Categoria general, Corte y grabado, Displays, Impresion digital, Insumos, Mano de obra`
            } else if (error.message.includes('unidad_medida_check')) {
              errorMsg = `Unidad '${unidadRaw}' no válida. Use: unidad, m², kg, hora, metro, litro, pieza, rollo, pliego`
            } else if (error.message.includes('null value')) {
              errorMsg = 'Valor requerido faltante (código, categoría, unidad)'
            } else {
              errorMsg = error.message
            }
          }
          errorMessages.push(`Fila ${index + 2}: ${errorMsg}`)
          errors++
        }
    }

    return NextResponse.json({ 
      ok: true, 
      created, 
      updated, 
      errors,
      errorMessages: errorMessages.slice(0, 10) // Limitar a 10 errores para no sobrecargar la respuesta
    })
  } catch (error) {
    console.error("Error importing CSV insumos:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
