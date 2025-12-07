import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabaseServer'

const supabase = getSupabaseServer()

/**
 * Normaliza control_stock de formato antiguo a formato nuevo
 * 
 * Formatos antiguos soportados:
 * - Claves en minúsculas: "lapaz", "santacruz"
 * - Campo "precio" en lugar de "precio_unitario"
 * - Valores numéricos directos
 * - Falta de campo "stock"
 * 
 * Formato nuevo:
 * - Claves en Title Case: "La Paz", "Santa Cruz"
 * - Campo "precio_unitario"
 * - Campo "stock" (default: 0)
 */
function normalizeControlStock(data: any): any {
  if (!data || typeof data !== 'object') {
    return {}
  }

  // Si es un array, convertir a objeto
  if (Array.isArray(data)) {
    return {}
  }

  const normalized: Record<string, any> = {}
  const mapeoSucursales: Record<string, string> = {
    'lapaz': 'La Paz',
    'santacruz': 'Santa Cruz',
    'cochabamba': 'Cochabamba',
    'lapaz': 'La Paz',
    'santa cruz': 'Santa Cruz',
    'santacruz': 'Santa Cruz'
  }

  // Iterar sobre todas las claves del objeto
  for (const [key, value] of Object.entries(data)) {
    // Normalizar nombre de sucursal
    let sucursalNormalizada = key
    
    // Si la clave está en minúsculas, buscar en el mapeo
    const keyLower = key.toLowerCase().replace(/\s+/g, '')
    if (mapeoSucursales[keyLower]) {
      sucursalNormalizada = mapeoSucursales[keyLower]
    } else if (keyLower.includes('lapaz') || keyLower.includes('la paz')) {
      sucursalNormalizada = 'La Paz'
    } else if (keyLower.includes('santacruz') || keyLower.includes('santa cruz')) {
      sucursalNormalizada = 'Santa Cruz'
    } else if (keyLower.includes('cochabamba')) {
      sucursalNormalizada = 'Cochabamba'
    } else if (key.match(/^[a-z]+$/)) {
      // Si es todo minúsculas sin espacios, capitalizar
      sucursalNormalizada = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()
    }

    // Normalizar el valor
    let valorNormalizado: any = {}

    if (value === null || value === undefined) {
      // Si es null/undefined, saltar
      continue
    } else if (typeof value === 'number') {
      // Si es un número directo, convertirlo a objeto
      if (isNaN(value) || !isFinite(value) || value < 0) {
        continue // Saltar valores inválidos
      }
      valorNormalizado = {
        precio_unitario: Math.round(value * 100) / 100,
        stock: 0
      }
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      // Si es un objeto, normalizar sus campos
      valorNormalizado = { ...value }

      // Renombrar "precio" a "precio_unitario" si existe
      if ('precio' in valorNormalizado && !('precio_unitario' in valorNormalizado)) {
        const precio = valorNormalizado.precio
        if (precio !== null && precio !== undefined && precio !== '' && !isNaN(Number(precio))) {
          valorNormalizado.precio_unitario = Math.round(Number(precio) * 100) / 100
        }
        delete valorNormalizado.precio
      }

      // Asegurar que precio_unitario existe y es válido
      if (!('precio_unitario' in valorNormalizado) || 
          valorNormalizado.precio_unitario === null || 
          valorNormalizado.precio_unitario === undefined ||
          valorNormalizado.precio_unitario === '' ||
          isNaN(Number(valorNormalizado.precio_unitario))) {
        // Si no hay precio válido, saltar esta entrada
        continue
      }

      // Normalizar precio_unitario
      valorNormalizado.precio_unitario = Math.round(Number(valorNormalizado.precio_unitario) * 100) / 100

      // Asegurar que stock existe
      if (!('stock' in valorNormalizado) || 
          valorNormalizado.stock === null || 
          valorNormalizado.stock === undefined ||
          valorNormalizado.stock === '' ||
          isNaN(Number(valorNormalizado.stock))) {
        valorNormalizado.stock = 0
      } else {
        valorNormalizado.stock = Math.max(0, Math.round(Number(valorNormalizado.stock)))
      }

      // Mantener otros campos si existen (unidad, fecha_actualizacion, etc.)
      // pero limpiar undefined
      Object.keys(valorNormalizado).forEach(k => {
        if (valorNormalizado[k] === undefined) {
          delete valorNormalizado[k]
        }
      })
    } else {
      // Si es otro tipo (string, array, etc.), saltar
      continue
    }

    // Si ya existe esta sucursal normalizada, mantener la que tenga más datos
    if (normalized[sucursalNormalizada]) {
      // Preferir la que tenga stock > 0 o más campos
      const existing = normalized[sucursalNormalizada]
      const existingKeys = Object.keys(existing).length
      const newKeys = Object.keys(valorNormalizado).length
      
      if (newKeys > existingKeys || (valorNormalizado.stock > 0 && existing.stock === 0)) {
        normalized[sucursalNormalizada] = valorNormalizado
      }
    } else {
      normalized[sucursalNormalizada] = valorNormalizado
    }
  }

  return normalized
}

/**
 * Endpoint para normalizar control_stock de todos los recursos
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Iniciando migración de control_stock...')

    // Obtener todos los recursos
    const { data: recursos, error: fetchError } = await supabase
      .from('recursos')
      .select('id, codigo, nombre, control_stock')

    if (fetchError) {
      console.error('❌ Error obteniendo recursos:', fetchError)
      throw new Error(`Error obteniendo recursos: ${fetchError.message}`)
    }

    if (!recursos || recursos.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay recursos para migrar',
        stats: {
          total: 0,
          normalizados: 0,
          sinCambios: 0,
          errores: 0
        }
      })
    }

    console.log(`📊 Total de recursos encontrados: ${recursos.length}`)

    const stats = {
      total: recursos.length,
      normalizados: 0,
      sinCambios: 0,
      errores: 0,
      cambios: [] as Array<{ id: string; codigo: string; cambios: string[] }>
    }

    // Procesar cada recurso
    for (const recurso of recursos) {
      try {
        const controlStockOriginal = recurso.control_stock
        let controlStockParsed: any = {}

        // Parsear si es string
        if (typeof controlStockOriginal === 'string') {
          try {
            controlStockParsed = JSON.parse(controlStockOriginal)
          } catch (e) {
            console.warn(`⚠️ Recurso ${recurso.codigo} (${recurso.id}): control_stock no es JSON válido, saltando`)
            stats.sinCambios++
            continue
          }
        } else if (controlStockOriginal && typeof controlStockOriginal === 'object') {
          controlStockParsed = controlStockOriginal
        } else {
          // Si es null, undefined o vacío, saltar
          stats.sinCambios++
          continue
        }

        // Normalizar
        const controlStockNormalizado = normalizeControlStock(controlStockParsed)

        // Verificar si hubo cambios
        const originalStr = JSON.stringify(controlStockParsed, Object.keys(controlStockParsed).sort())
        const normalizadoStr = JSON.stringify(controlStockNormalizado, Object.keys(controlStockNormalizado).sort())

        if (originalStr === normalizadoStr) {
          // No hay cambios
          stats.sinCambios++
          continue
        }

        // Detectar qué cambió
        const cambios: string[] = []
        const clavesOriginales = Object.keys(controlStockParsed)
        const clavesNormalizadas = Object.keys(controlStockNormalizado)

        // Verificar claves renombradas
        clavesOriginales.forEach(clave => {
          if (!clavesNormalizadas.includes(clave)) {
            const nuevaClave = clavesNormalizadas.find(nc => 
              nc.toLowerCase().replace(/\s+/g, '') === clave.toLowerCase().replace(/\s+/g, '')
            )
            if (nuevaClave) {
              cambios.push(`Clave "${clave}" → "${nuevaClave}"`)
            }
          }
        })

        // Verificar campos renombrados (precio → precio_unitario)
        clavesNormalizadas.forEach(sucursal => {
          const original = controlStockParsed[sucursal] || controlStockParsed[sucursal.toLowerCase()]
          const normalizado = controlStockNormalizado[sucursal]
          
          if (original && normalizado) {
            if ('precio' in original && !('precio' in normalizado) && 'precio_unitario' in normalizado) {
              cambios.push(`"${sucursal}": precio → precio_unitario`)
            }
            if (!('stock' in original) && 'stock' in normalizado) {
              cambios.push(`"${sucursal}": añadido stock`)
            }
          }
        })

        // Actualizar en Supabase
        const { error: updateError } = await supabase
          .from('recursos')
          .update({ control_stock: controlStockNormalizado })
          .eq('id', recurso.id)

        if (updateError) {
          console.error(`❌ Error actualizando recurso ${recurso.codigo} (${recurso.id}):`, updateError)
          stats.errores++
        } else {
          console.log(`✅ Recurso ${recurso.codigo} (${recurso.id}) normalizado:`, cambios.join(', '))
          stats.normalizados++
          stats.cambios.push({
            id: recurso.id,
            codigo: recurso.codigo || recurso.id,
            cambios
          })
        }
      } catch (error) {
        console.error(`❌ Error procesando recurso ${recurso.codigo} (${recurso.id}):`, error)
        stats.errores++
      }
    }

    console.log('✅ Migración completada:', stats)

    return NextResponse.json({
      success: true,
      message: `Migración completada: ${stats.normalizados} recursos normalizados, ${stats.sinCambios} sin cambios, ${stats.errores} errores`,
      stats
    })

  } catch (error) {
    console.error('❌ Error en migración de control_stock:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    )
  }
}





