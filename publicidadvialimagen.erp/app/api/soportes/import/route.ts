import { NextResponse } from 'next/server'
import { parse } from 'csv-parse/sync'
import { supabaseServer } from '@/lib/supabaseServer'
import { buildSupabasePayload, normalizeTipoSoporte, mapStatusToSupabase } from '../helpers'

// Función para asegurar que existe un propietario por defecto
async function ensureDefaultOwner() {
  const defaultOwnerId = '00000000-0000-0000-0000-000000000000'
  
  // Verificar si ya existe
  const { data: existing } = await supabaseServer
    .from('duenos_casa')
    .select('id')
    .eq('id', defaultOwnerId)
    .maybeSingle()
  
  if (existing) {
    return defaultOwnerId
  }
  
  // Crear propietario por defecto
  const { error } = await supabaseServer
    .from('duenos_casa')
    .insert([{
      id: defaultOwnerId,
      nombre: 'Propietario por defecto',
      tipo_propietario: 'empresa',
      estado: 'activo'
    }])
  
  if (error) {
    console.error('Error creando propietario por defecto:', error)
    throw error
  }
  
  return defaultOwnerId
}

export async function POST(req: Request) {
  try {
    console.log('Iniciando importación CSV...')
    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) {
      console.log('Error: No se recibió archivo')
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 })
    }
    
    console.log(`Archivo recibido: ${file.name}, tamaño: ${file.size} bytes`)


    const buf = Buffer.from(await file.arrayBuffer())
    
    // Detección de codificación: intentar UTF-8 y, si hay caracteres de reemplazo, probar latin1
    let csvText = buf.toString('utf8')
    if (csvText.includes('\uFFFD')) {
      const latin1 = buf.toString('latin1')
      // Usar latin1 si parece contener tildes válidas
      if (/[áéíóúÁÉÍÓÚñÑ]/.test(latin1)) {
        csvText = latin1
      }
    }

    // Detección de delimitador: inspeccionar la primera línea
    const firstLine = csvText.split('\n')[0]
    const delimiter = firstLine.includes(';') && firstLine.indexOf(';') < firstLine.indexOf(',') ? ';' : ','

    const rows = parse(csvText, { 
      columns: true, 
      skip_empty_lines: true,
      delimiter: delimiter,
      bom: true
    })

    console.log(`CSV parseado: ${rows.length} filas encontradas`)
    console.log('Primera fila:', rows[0])

    // Asegurar que existe un propietario por defecto
    const defaultOwnerId = await ensureDefaultOwner()
    console.log('Propietario por defecto:', defaultOwnerId)

    let created = 0, updated = 0, skipped = 0, errors = 0
    const errorMessages: string[] = []

    // Función para normalizar números
    const normalizeNumber = (value: string, fieldName: string): number | null => {
      if (!value || value.trim() === '') return null
      
      let str = value.toString().trim()
      
      // Quitar símbolos de moneda pero NO los puntos decimales
      str = str.replace(/[€$Bs\s]/g, '')
      
      // Detectar notación europea (coma como separador decimal)
      if (str.includes(',') && str.includes('.')) {
        // Formato: 1.000,50 -> 1000.50
        const parts = str.split(',')
        if (parts.length === 2 && parts[1].length <= 2) {
          str = str.replace(/\./g, '').replace(',', '.')
        }
      } else if (str.includes(',') && !str.includes('.')) {
        // Formato: 1,50 -> 1.50
        const parts = str.split(',')
        if (parts.length === 2 && parts[1].length <= 2) {
          str = str.replace(',', '.')
        }
      }
      
      const num = parseFloat(str)
      return isNaN(num) ? null : num
    }

    // Función para normalizar texto
    const normalizeText = (value: string): string => {
      return (value || '').toString().trim()
    }

    // Mapeo de encabezados alternativos → objeto intermedio normalizado
    const mapHeaders = (row: any) => {
      const mapped: any = {}
      
      // Mapear cada campo con variantes posibles
      Object.keys(row).forEach(key => {
        const lowerKey = key.toLowerCase().trim()
        
        if (lowerKey.includes('ciudad')) {
          mapped.ciudad = normalizeText(row[key])
        } else if (lowerKey.includes('disponibilidad') || lowerKey.includes('estado')) {
          mapped.estado = normalizeText(row[key])
        } else if (lowerKey.includes('titulo') || lowerKey.includes('título')) {
          mapped.titulo = normalizeText(row[key])
        } else if (lowerKey.includes('precio') && lowerKey.includes('mes')) {
          mapped.precio_mes = normalizeNumber(row[key], 'Precio por mes')
        } else if (lowerKey.includes('codigo') || lowerKey.includes('código')) {
          mapped.codigo = normalizeText(row[key])
        } else if (lowerKey.includes('ancho')) {
          mapped.ancho = normalizeNumber(row[key], 'Ancho')
        } else if (lowerKey.includes('alto')) {
          mapped.alto = normalizeNumber(row[key], 'Alto')
        } else if (lowerKey.includes('impactos') && (lowerKey.includes('dia') || lowerKey.includes('día') || lowerKey.includes('diarios'))) {
          mapped.impactos_diarios = normalizeNumber(row[key], 'Impactos dia')
        } else if (lowerKey.includes('ubicacion') || lowerKey.includes('ubicación')) {
          mapped.ubicacion_url = normalizeText(row[key])
        } else if (lowerKey.includes('tipo')) {
          mapped.tipo = normalizeText(row[key])
        } else if (lowerKey.includes('foto_url_2')) {
          mapped.foto_url_2 = normalizeText(row[key])
        } else if (lowerKey.includes('foto_url_3')) {
          mapped.foto_url_3 = normalizeText(row[key])
        } else if (lowerKey.endsWith('foto') || lowerKey.includes('foto_url')) {
          mapped.foto_url = normalizeText(row[key])
        } else if (lowerKey.includes('notas') || lowerKey.includes('descripcion') || lowerKey.includes('descripción')) {
          mapped.notas = normalizeText(row[key])
        }
      })
      
      return mapped
    }

    // Normalización de estado a UI y luego a DB
    function normalizeStatusToDb(value: string): string {
      const v = (value || '').toLowerCase().trim()
      let ui: string = 'DISPONIBLE'
      if (v.includes('reserv')) ui = 'RESERVADO'
      else if (v.includes('ocup')) ui = 'OCUPADO'
      else if (v.includes('no dispo') || v.includes('no-dispo') || v.includes('nodispo')) ui = 'NO_DISPONIBLE'
      return mapStatusToSupabase(ui)
    }

    // ⚠️ YA NO USAMOS normalizeType local, usamos normalizeTipoSoporte de helpers
    // que es la única fuente de verdad

    for (let index = 0; index < rows.length; index++) {
      let mapped: any = {}
      try {
        const row = rows[index]
        mapped = mapHeaders(row)
        
        // Validación mínima
        const code = mapped.codigo
        if (!code) {
          skipped++
          continue
        }
        
        const title = mapped.titulo
        if (!title) {
          skipped++
          continue
        }
        // Normalizar tipo (a los 4 oficiales)
        const normalizedType = normalizeTipoSoporte(mapped.tipo || 'Vallas Publicitarias')
        
        const input = {
          code,
          title,
          type: normalizedType,
          widthM: mapped.ancho,
          heightM: mapped.alto,
          priceMonth: mapped.precio_mes,
          status: normalizeStatusToDb(mapped.estado),
          city: mapped.ciudad || null,
          googleMapsLink: mapped.ubicacion_url || null,
          impactosDiarios: mapped.impactos_diarios,
          images: [mapped.foto_url, mapped.foto_url_2, mapped.foto_url_3].filter(Boolean),
          address: mapped.notas || null,
        }

        console.log(`Procesando fila ${index + 1}: código=${code}, título=${title}`)
        console.log(`Normalización: tipo "${mapped.tipo_soporte || 'Vallas Publicitarias'}" → "${normalizedType}", estado "${mapped.disponibilidad}" → "${input.status}"`)

        // Buscar existente por codigo
        const { data: existing, error: findError } = await supabaseServer
          .from('soportes')
          .select('*')
          .eq('codigo', code)
          .maybeSingle()
        if (findError) throw findError

        // Usar helper para construir payload correcto snake_case
        const payload = buildSupabasePayload(input, existing || undefined)

        if (existing?.id) {
          console.log(`Actualizando soporte existente: ${existing.id}`)
          const { error: updateError } = await supabaseServer
            .from('soportes')
            .update(payload)
            .eq('id', existing.id)

          if (updateError) {
            console.error('Error actualizando soporte:', updateError)
            throw updateError
          }
          updated++
          console.log(`Soporte ${code} actualizado correctamente`)
        } else {
          console.log(`Creando nuevo soporte: ${code}`)
          const insertPayload: any = {
            dueno_casa_id: defaultOwnerId,
            estado: input.status || 'disponible',
            ...payload,
          }
          if (!insertPayload.tipo_soporte) insertPayload.tipo_soporte = 'Vallas Publicitarias'
          if (!insertPayload.ancho) insertPayload.ancho = 1
          if (!insertPayload.alto)  insertPayload.alto  = 1

          const { error: insertError } = await supabaseServer
            .from('soportes')
            .insert([insertPayload])

          if (insertError) {
            console.error('Error insertando soporte:', insertError)
            throw insertError
          }
          created++
          console.log(`Soporte ${code} creado correctamente`)
        }
      } catch (error) {
        console.error(`Error en fila ${index + 2}:`, error)
        console.error(`Datos de la fila:`, mapped)
        let errorMsg = 'Error desconocido'
        let extra = ''
        const anyErr: any = error
        if (anyErr) {
          if (anyErr.message) errorMsg = anyErr.message
          else if (typeof anyErr === 'string') errorMsg = anyErr
          if (anyErr.details) extra += ` | details: ${anyErr.details}`
          if (anyErr.hint) extra += ` | hint: ${anyErr.hint}`
          if (anyErr.code) extra += ` | code: ${anyErr.code}`
        }
        errorMessages.push(`Fila ${index + 2}: ${errorMsg}${extra}`)
        errors++
      }
    }

    return NextResponse.json({ 
      success: true, 
      total: rows.length,
      created,
      updated,
      skipped,
      errors,
      errorMessages: errorMessages.slice(0, 15) // Mostrar más errores para diagnóstico
    })
  } catch (error) {
    console.error("Error importing CSV:", error)
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
