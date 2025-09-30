import { NextResponse } from 'next/server'
import { parse } from 'csv-parse/sync'
import { supabaseServer } from '@/lib/supabaseServer'
import { buildSupabasePayload } from '../helpers'

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

    // Mapeo de encabezados alternativos
    const mapHeaders = (row: any) => {
      const mapped: any = {}
      
      // Mapear cada campo con variantes posibles
      Object.keys(row).forEach(key => {
        const lowerKey = key.toLowerCase().trim()
        
        if (lowerKey.includes('ciudad')) {
          mapped.ciudad = normalizeText(row[key])
        } else if (lowerKey.includes('disponibilidad')) {
          mapped.disponibilidad = normalizeText(row[key])
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
          mapped.ubicacion = normalizeText(row[key])
        } else if (lowerKey.includes('tipo')) {
          mapped.tipo = normalizeText(row[key])
        }
      })
      
      return mapped
    }

    // Funciones de normalización
    function normalizeStatus(value: string): string {
      const v = (value || "").toLowerCase().trim()
      if (v.includes("reserv")) return "ocupado"
      if (v.includes("ocup")) return "ocupado"
      if (v.includes("manten")) return "mantenimiento"
      if (v.includes("fuera")) return "fuera_servicio"
      return "disponible"
    }

    function normalizeType(value: string): string {
      const v = (value || "").toLowerCase().trim()
      if (v.includes("pantalla")) return "pantalla_led"
      if (v.includes("marquesina")) return "marquesina"
      if (v.includes("monoposte")) return "monoposte"
      if (v.includes("mupi")) return "mupi"
      if (v.includes("banderola")) return "banderola"
      if (v.includes("valla")) return "valla"
      if (v.includes("totem") || v.includes("tótem")) return "otro"
      return "otro"
    }

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
        const input = {
          code,
          title,
          type: normalizeType(mapped.tipo || 'valla'),
          widthM: mapped.ancho,
          heightM: mapped.alto,
          priceMonth: mapped.precio_mes,
          status: normalizeStatus(mapped.disponibilidad),
          city: mapped.ciudad || null,
          googleMapsLink: mapped.ubicacion || null,
          impactosDiarios: mapped.impactos_diarios,
        }

        console.log(`Procesando fila ${index + 1}: código=${code}, título=${title}`)
        console.log(`Normalización: tipo "${mapped.tipo || 'valla'}" → "${input.type}", estado "${mapped.disponibilidad}" → "${input.status}"`)

        // Detectar esquema (minúsculas vs antiguo en Mayúsculas)
        let schemaUpper = false
        let existing: any = null
        {
          const { data, error } = await supabaseServer
            .from('soportes')
            .select('*')
            .eq('codigo', code)
            .maybeSingle()

          if (error) {
            const msg = String(error.message || '')
            if (msg.toLowerCase().includes('column') && msg.toLowerCase().includes('codigo')) {
              schemaUpper = true
              console.log('Esquema detectado: variante antigua (Mayúsculas). Reintentando consulta por Codigo...')
              const retry = await supabaseServer
                .from('soportes')
                .select('*')
                .eq('Codigo', code)
                .maybeSingle()
              existing = retry.data
              if (retry.error) {
                console.error('Error buscando soporte existente (Upper):', retry.error)
                throw retry.error
              }
            } else {
              console.error('Error buscando soporte existente:', error)
              throw error
            }
          } else {
            existing = data
          }
        }

        // Payload según esquema detectado
        const payload = schemaUpper
          ? {
              Codigo: input.code,
              nombre: input.title,
              Tipo: input.type,
              Ancho: input.widthM ?? 0,
              Alto: input.heightM ?? 0,
              Ciudad: input.city,
              Disponibilidad: input.status, // disponible|reservado|ocupado|no_disponible
              'Precio por mes': input.priceMonth ?? null,
              'Impactos diarios': input.impactosDiarios ?? null,
              ubicacion: input.googleMapsLink ?? null,
              dueno_casa_id: defaultOwnerId,
            }
          : {
              codigo: input.code,
              titulo: input.title,
              tipo: input.type,
              ancho: input.widthM ?? 0,
              alto: input.heightM ?? 0,
              ciudad: input.city,
              estado: input.status, // disponible|reservado|ocupado|no_disponible
              precio_mes: input.priceMonth ?? null,
              impactos_diarios: input.impactosDiarios ?? null,
              ubicacion_url: input.googleMapsLink ?? null,
              dueno_casa_id: defaultOwnerId,
            }

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
          const { error: insertError } = await supabaseServer
            .from('soportes')
            .insert([payload])

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
