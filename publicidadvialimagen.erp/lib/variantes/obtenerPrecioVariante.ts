/**
 * Función para obtener el precio de un producto según sus variantes
 * Jerarquía de precios CORRECTA:
 * 1. precio_override (solo si es DIFERENTE del precio_variante.totalPrice)
 * 2. precio_variante.totalPrice (precio REAL de la calculadora configurada por el usuario)
 * 3. precio_calculado (si existe y es > 0)
 * 4. precio_base (fallback)
 */

import { generarClaveVariante, parsearClaveVariante } from './generarCombinaciones'

/**
 * Compara dos combinaciones de variantes sin importar el orden de las claves
 * @param combinacion1 Primera combinación (objeto o string)
 * @param combinacion2 Segunda combinación (objeto o string)
 * @returns true si las combinaciones son equivalentes
 */
function compararCombinaciones(combinacion1: Record<string, string> | string, combinacion2: Record<string, string> | string): boolean {
  // Convertir ambas a objetos si vienen como string
  let obj1: Record<string, string>
  let obj2: Record<string, string>
  
  if (typeof combinacion1 === 'string') {
    obj1 = parsearClaveVariante(combinacion1)
  } else {
    obj1 = combinacion1
  }
  
  if (typeof combinacion2 === 'string') {
    obj2 = parsearClaveVariante(combinacion2)
  } else {
    obj2 = combinacion2
  }
  
  // Comparar número de claves
  const keys1 = Object.keys(obj1).sort()
  const keys2 = Object.keys(obj2).sort()
  
  if (keys1.length !== keys2.length) {
    return false
  }
  
  // Comparar cada clave y valor
  for (const key of keys1) {
    if (!keys2.includes(key)) {
      return false
    }
    // Normalizar valores (eliminar espacios, comparar sin case)
    const val1 = String(obj1[key]).trim().toLowerCase()
    const val2 = String(obj2[key]).trim().toLowerCase()
    
    // Si el valor contiene código hexadecimal, comparar solo el nombre del color
    if (val1.includes('#')) {
      const nombre1 = val1.split('#')[0].trim()
      const nombre2 = val2.includes('#') ? val2.split('#')[0].trim() : val2
      if (nombre1 !== nombre2) {
        return false
      }
    } else if (val1 !== val2) {
      return false
    }
  }
  
  return true
}

/**
 * Extrae el precio desde precio_variante.totalPrice si existe
 * @param precioVariante Campo precio_variante (puede ser JSONB o string JSON)
 * @returns Precio extraído o null si no existe o no es válido
 */
function extraerPrecioVariante(precioVariante: any): number | null {
  console.log('🔍 extraerPrecioVariante - INICIO')
  console.log('  📦 Tipo de precioVariante:', typeof precioVariante)
  console.log('  📦 Es null/undefined?', precioVariante === null || precioVariante === undefined)
  
  if (!precioVariante) {
    console.log('  ⚪ extraerPrecioVariante: precioVariante es null/undefined/vacío')
    return null
  }

  try {
    // Parsear si viene como string JSON
    let calc: any = null
    if (typeof precioVariante === 'string') {
      console.log('  📝 precioVariante es STRING, parseando JSON...')
      try {
        calc = JSON.parse(precioVariante)
        console.log('  ✅ JSON parseado exitosamente')
      } catch (parseError) {
        console.error('  ❌ Error parseando JSON string:', parseError)
        return null
      }
    } else {
      console.log('  📝 precioVariante es OBJETO/JSONB, usando directamente')
      calc = precioVariante
    }

    console.log('  📋 Contenido completo de precio_variante:', JSON.stringify(calc, null, 2))

    // Verificar que existe totalPrice
    if (!calc || !('totalPrice' in calc)) {
      console.log('  ⚪ No se encontró totalPrice en el objeto')
      return null
    }

    console.log('  💰 totalPrice encontrado:', calc.totalPrice)
    console.log('  📊 Tipo de totalPrice:', typeof calc.totalPrice)

    // Convertir a número si viene como string
    let totalPrice: number
    if (typeof calc.totalPrice === 'string') {
      console.log('  🔄 totalPrice es string, convirtiendo a número...')
      totalPrice = Number(calc.totalPrice)
    } else if (typeof calc.totalPrice === 'number') {
      totalPrice = calc.totalPrice
    } else {
      console.log('  ❌ totalPrice no es string ni number, es:', typeof calc.totalPrice)
      return null
    }

    // Validar que es un número válido y > 0
    if (isNaN(totalPrice)) {
      console.log('  ❌ totalPrice no es un número válido (NaN)')
      return null
    }

    if (totalPrice <= 0) {
      console.log('  ❌ totalPrice es <= 0:', totalPrice)
      return null
    }

    console.log('  ✅ extraerPrecioVariante: totalPrice válido encontrado:', totalPrice)
    return totalPrice

  } catch (e) {
    console.error('  ❌ extraerPrecioVariante: Error inesperado:', e)
    return null
  }
}

/**
 * Obtiene el precio de un producto según una combinación de variantes
 * @param productoId ID del producto
 * @param variantes Combinación de variantes (ej: { Color: "Blanco", Tamaño: "A4" })
 * @param precioBase Precio base del producto (fallback)
 * @param sucursal Sucursal opcional para buscar precio específico de variante de sucursal
 * @returns Precio final a usar
 */
export async function obtenerPrecioVariante(
  productoId: string,
  variantes: Record<string, string>,
  precioBase: number,
  sucursal?: string
): Promise<number> {
  console.log('═══════════════════════════════════════════════════════════')
  console.log('🔍 obtenerPrecioVariante - INICIO')
  console.log('═══════════════════════════════════════════════════════════')
  
  // Si no hay variantes, retornar precio base
  if (!variantes || Object.keys(variantes).length === 0) {
    console.log('⚠️ No hay variantes, retornando precio base:', precioBase)
    return precioBase
  }

  try {
    // Si hay sucursal, incluirla en la combinación de variantes
    const variantesConSucursal = sucursal
      ? { ...variantes, Sucursal: sucursal }
      : variantes

    // Generar clave de combinación
    const combinacion = generarClaveVariante(variantesConSucursal)
    const combinacionSinSucursal = generarClaveVariante(variantes)

    console.log('📋 Parámetros de búsqueda:')
    console.log('  - productoId:', productoId)
    console.log('  - variantes:', JSON.stringify(variantes, null, 2))
    console.log('  - sucursal:', sucursal || '(no especificada)')
    console.log('  - combinacionGenerada (con sucursal):', combinacion)
    console.log('  - combinacionGenerada (sin sucursal):', combinacionSinSucursal)
    console.log('  - precioBase:', precioBase)

    // Obtener variante de la BD
    console.log('📡 Consultando API /api/productos/variantes...')
    const response = await fetch(`/api/productos/variantes?producto_id=${productoId}`)

    if (!response.ok) {
      console.error('❌ Error obteniendo variantes de la API:', response.status, response.statusText)
      console.log('💰 Usando precio base (error en API):', precioBase)
      return precioBase
    }

    const data = await response.json()
    const variantesProducto = data.variantes || []

    console.log(`📋 Variantes disponibles en BD: ${variantesProducto.length}`)
    
    // Log detallado de TODAS las variantes con TODOS sus campos
    variantesProducto.forEach((v: any, index: number) => {
      console.log(`  ┌─ Variante ${index + 1}:`)
      console.log(`  │  combinacion: "${v.combinacion}"`)
      console.log(`  │  precio_override:`, v.precio_override, `(tipo: ${typeof v.precio_override})`)
      console.log(`  │  precio_calculado:`, v.precio_calculado, `(tipo: ${typeof v.precio_calculado})`)
      console.log(`  │  precio_variante:`, v.precio_variante ? 'PRESENTE' : 'NULL/UNDEFINED', `(tipo: ${typeof v.precio_variante})`)
      
      if (v.precio_variante) {
        if (typeof v.precio_variante === 'string') {
          console.log(`  │  precio_variante (string):`, v.precio_variante.substring(0, 200) + (v.precio_variante.length > 200 ? '...' : ''))
        } else {
          console.log(`  │  precio_variante (objeto):`, JSON.stringify(v.precio_variante, null, 2))
        }
        
        // Intentar extraer totalPrice directamente para mostrar
        try {
          const calc = typeof v.precio_variante === 'string' ? JSON.parse(v.precio_variante) : v.precio_variante
          if (calc && calc.totalPrice !== undefined) {
            console.log(`  │  precio_variante.totalPrice:`, calc.totalPrice)
          }
        } catch (e) {
          console.log(`  │  precio_variante.totalPrice: (error al extraer)`)
        }
      }
      console.log(`  └────────────────────────────────────────────────────`)
    })

    // Buscar la variante que coincida
    // Primero intentar búsqueda exacta (más rápida)
    let varianteEncontrada = variantesProducto.find(
      (v: any) => v.combinacion === combinacion
    )

    if (!varianteEncontrada) {
      console.log('⚠️ Variante NO encontrada con búsqueda exacta (con sucursal):', combinacion)
      console.log('🔍 Intentando búsqueda flexible (comparando valores sin importar orden)...')
      
      // Búsqueda flexible: comparar valores sin importar el orden de las claves
      varianteEncontrada = variantesProducto.find((v: any) => {
        return compararCombinaciones(combinacion, v.combinacion)
      })

      if (varianteEncontrada) {
        console.log('✅ Variante encontrada con búsqueda flexible (con sucursal)')
        console.log('  BD tiene:', varianteEncontrada.combinacion)
        console.log('  Buscábamos:', combinacion)
      }
    } else {
      console.log('✅ Variante encontrada con búsqueda exacta (con sucursal):', combinacion)
    }

    if (!varianteEncontrada) {
      // Si no se encuentra la variante con sucursal, intentar sin sucursal
      if (sucursal && variantes) {
        console.log('🔍 Intentando buscar sin sucursal (búsqueda exacta)...')
        varianteEncontrada = variantesProducto.find(
          (v: any) => v.combinacion === combinacionSinSucursal
        )

        if (!varianteEncontrada) {
          console.log('⚠️ No encontrada con búsqueda exacta sin sucursal')
          console.log('🔍 Intentando búsqueda flexible sin sucursal...')
          varianteEncontrada = variantesProducto.find((v: any) => {
            return compararCombinaciones(combinacionSinSucursal, v.combinacion)
          })
          
          if (varianteEncontrada) {
            console.log('✅ Variante encontrada con búsqueda flexible (sin sucursal)')
            console.log('  BD tiene:', varianteEncontrada.combinacion)
            console.log('  Buscábamos:', combinacionSinSucursal)
          }
        } else {
          console.log('✅ Variante encontrada con búsqueda exacta (sin sucursal):', combinacionSinSucursal)
        }

        if (!varianteEncontrada) {
          console.log('❌ Tampoco se encontró variante sin sucursal (ni exacta ni flexible)')
          console.log('💰 Usando precio base (no se encontró variante):', precioBase)
          return precioBase
        }
      } else {
        console.log('💰 Usando precio base (no se encontró variante):', precioBase)
        return precioBase
      }
    }

    // A partir de aquí tenemos varianteEncontrada
    console.log('═══════════════════════════════════════════════════════════')
    console.log('📦 VARIANTE ENCONTRADA - Análisis completo:')
    console.log('═══════════════════════════════════════════════════════════')
    console.log('  🔑 combinacion:', varianteEncontrada.combinacion)
    console.log('  💰 precio_override:', varianteEncontrada.precio_override, `(tipo: ${typeof varianteEncontrada.precio_override})`)
    console.log('  💰 precio_calculado:', varianteEncontrada.precio_calculado, `(tipo: ${typeof varianteEncontrada.precio_calculado})`)
    console.log('  📦 precio_variante existe?', varianteEncontrada.precio_variante ? 'SÍ' : 'NO')
    console.log('  📦 precio_variante tipo:', typeof varianteEncontrada.precio_variante)
    
    if (varianteEncontrada.precio_variante) {
      if (typeof varianteEncontrada.precio_variante === 'string') {
        console.log('  📝 precio_variante (primeros 300 chars):', varianteEncontrada.precio_variante.substring(0, 300))
      } else {
        console.log('  📝 precio_variante (completo):', JSON.stringify(varianteEncontrada.precio_variante, null, 2))
      }
    }

    // 1. Extraer precio de calculadora (precio_variante.totalPrice)
    console.log('─────────────────────────────────────────────────────────')
    console.log('🔍 PASO 1: Extrayendo precio_variante.totalPrice...')
    const precioCalculadora = extraerPrecioVariante(varianteEncontrada.precio_variante)
    if (precioCalculadora !== null) {
      console.log('💡 precio_variante.totalPrice detectado:', precioCalculadora)
    } else {
      console.log('💡 precio_variante.totalPrice detectado: NULL (no existe o no es válido)')
    }

    // 2. Extraer precio override
    console.log('─────────────────────────────────────────────────────────')
    console.log('🔍 PASO 2: Extrayendo precio_override...')
    let precioOverride: number | null = null
    if (varianteEncontrada.precio_override !== null && varianteEncontrada.precio_override !== undefined) {
      precioOverride = Number(varianteEncontrada.precio_override)
      if (!isNaN(precioOverride)) {
        console.log('💡 precio_override detectado:', precioOverride)
      } else {
        console.log('💡 precio_override detectado: NaN (no es un número válido)')
        precioOverride = null
      }
    } else {
      console.log('💡 precio_override detectado: NULL')
    }

    // 3. Extraer precio calculado (antiguo/fallback)
    console.log('─────────────────────────────────────────────────────────')
    console.log('🔍 PASO 3: Extrayendo precio_calculado...')
    let precioCalculado: number | null = null
    if (varianteEncontrada.precio_calculado !== null && varianteEncontrada.precio_calculado !== undefined) {
      precioCalculado = Number(varianteEncontrada.precio_calculado)
      if (!isNaN(precioCalculado) && precioCalculado > 0) {
        console.log('💡 precio_calculado detectado:', precioCalculado)
      } else {
        console.log('💡 precio_calculado detectado:', precioCalculado, '(es 0 o NaN, se ignorará)')
        precioCalculado = null
      }
    } else {
      console.log('💡 precio_calculado detectado: NULL')
    }

    console.log('─────────────────────────────────────────────────────────')
    console.log('💡 precio_base:', precioBase)
    console.log('═══════════════════════════════════════════════════════════')
    console.log('🎯 APLICANDO JERARQUÍA DE PRECIOS...')
    console.log('═══════════════════════════════════════════════════════════')

    // APLICAR JERARQUÍA CORRECTA

    // Paso 1: Verificar Override vs Calculadora
    if (precioOverride !== null) {
      console.log('🔍 Verificando si precio_override es diferente de precio_variante.totalPrice...')
      
      // Si existe precio de calculadora y es IGUAL al override, ignoramos el override
      // para dar preferencia a la fuente "real" (calculadora)
      if (precioCalculadora !== null) {
        const diferencia = Math.abs(precioOverride - precioCalculadora)
        console.log(`  📊 Diferencia entre override y calculadora: ${diferencia}`)
        
        if (diferencia < 0.01) { // Tolerancia de 0.01 para comparación de decimales
          console.log('⚠️ precio_override es IGUAL a precio_variante.totalPrice')
          console.log('   → Ignorando override para usar calculadora (fuente real)')
          console.log('➡️ Precio FINAL usado:', precioCalculadora)
          console.log('🔍 Variante elegida:', varianteEncontrada.combinacion)
          console.log('═══════════════════════════════════════════════════════════')
          return precioCalculadora
        } else {
          console.log('✅ precio_override es DIFERENTE de precio_variante.totalPrice')
          console.log('   → Usando override (usuario lo editó manualmente)')
        }
      } else {
        console.log('ℹ️ No hay precio_variante.totalPrice para comparar')
        console.log('   → Usando override directamente')
      }

      // Si son diferentes o no hay calculadora, el override manda (usuario lo editó manualmente)
      console.log('💰 Usando precio_override (es diferente al de calculadora o no hay calculadora)')
      console.log('➡️ Precio FINAL usado:', precioOverride)
      console.log('🔍 Variante elegida:', varianteEncontrada.combinacion)
      console.log('═══════════════════════════════════════════════════════════')
      return precioOverride
    }

    // Paso 2: Usar precio de calculadora si existe
    if (precioCalculadora !== null) {
      console.log('💰 Usando precio_variante.totalPrice (precio de calculadora)')
      console.log('➡️ Precio FINAL usado:', precioCalculadora)
      console.log('🔍 Variante elegida:', varianteEncontrada.combinacion)
      console.log('═══════════════════════════════════════════════════════════')
      return precioCalculadora
    }

    // Paso 3: Usar precio calculado (fallback antiguo)
    if (precioCalculado !== null && precioCalculado > 0) {
      console.log('💰 Usando precio_calculado (fallback)')
      console.log('➡️ Precio FINAL usado:', precioCalculado)
      console.log('🔍 Variante elegida:', varianteEncontrada.combinacion)
      console.log('═══════════════════════════════════════════════════════════')
      return precioCalculado
    }

    // Paso 4: Precio base
    console.log('💰 Usando precio_base (fallback final - no hay precios de variante)')
    console.log('➡️ Precio FINAL usado:', precioBase)
    console.log('🔍 Variante elegida:', varianteEncontrada.combinacion)
    console.log('═══════════════════════════════════════════════════════════')
    return precioBase

  } catch (error) {
    console.error('❌ Error obteniendo precio variante:', error)
    console.log('💰 Usando precio base (error):', precioBase)
    return precioBase
  }
}

/**
 * Obtiene el precio de un producto según una combinación de variantes (versión síncrona con datos ya cargados)
 * Útil cuando ya se tienen las variantes en memoria
 * @param variantesProducto Array de variantes del producto ya cargadas
 * @param variantes Combinación de variantes (ej: { Color: "Blanco", Tamaño: "A4" })
 * @param precioBase Precio base del producto (fallback)
 * @param sucursal Sucursal opcional para buscar precio específico de variante de sucursal
 * @returns Precio final a usar
 */
export function obtenerPrecioVarianteSync(
  variantesProducto: any[],
  variantes: Record<string, string>,
  precioBase: number,
  sucursal?: string
): number {
  // Si no hay variantes, retornar precio base
  if (!variantes || Object.keys(variantes).length === 0) {
    return precioBase
  }

  try {
    // Si hay sucursal, incluirla en la combinación de variantes
    const variantesConSucursal = sucursal
      ? { ...variantes, Sucursal: sucursal }
      : variantes

    // Generar clave de combinación
    const combinacion = generarClaveVariante(variantesConSucursal)
    const combinacionSinSucursal = generarClaveVariante(variantes)

    // Buscar la variante que coincida
    // Primero intentar búsqueda exacta
    let varianteEncontrada = variantesProducto.find(
      (v: any) => v.combinacion === combinacion
    )

    if (!varianteEncontrada) {
      // Búsqueda flexible: comparar valores sin importar el orden de las claves
      varianteEncontrada = variantesProducto.find((v: any) => {
        return compararCombinaciones(combinacion, v.combinacion)
      })
    }

    if (!varianteEncontrada) {
      // Si no se encuentra la variante con sucursal, intentar sin sucursal
      if (sucursal && variantes) {
        varianteEncontrada = variantesProducto.find(
          (v: any) => v.combinacion === combinacionSinSucursal
        )
        
        if (!varianteEncontrada) {
          varianteEncontrada = variantesProducto.find((v: any) => {
            return compararCombinaciones(combinacionSinSucursal, v.combinacion)
          })
        }
      }
    }

    if (!varianteEncontrada) {
      return precioBase
    }

    // Lógica de jerarquía (Sync) - misma lógica que la versión async

    // 1. Extraer precio de calculadora
    const precioCalculadora = extraerPrecioVariante(varianteEncontrada.precio_variante)

    // 2. Extraer precio override
    let precioOverride: number | null = null
    if (varianteEncontrada.precio_override !== null && varianteEncontrada.precio_override !== undefined) {
      precioOverride = Number(varianteEncontrada.precio_override)
      if (isNaN(precioOverride)) {
        precioOverride = null
      }
    }

    // 3. Extraer precio calculado
    let precioCalculado: number | null = null
    if (varianteEncontrada.precio_calculado !== null && varianteEncontrada.precio_calculado !== undefined) {
      precioCalculado = Number(varianteEncontrada.precio_calculado)
      if (isNaN(precioCalculado) || precioCalculado <= 0) {
        precioCalculado = null
      }
    }

    // APLICAR JERARQUÍA (misma lógica que async)

    // Paso 1: Verificar Override vs Calculadora
    if (precioOverride !== null) {
      // Si existe precio de calculadora y es IGUAL al override, ignoramos el override
      if (precioCalculadora !== null && Math.abs(precioOverride - precioCalculadora) < 0.01) {
        return precioCalculadora
      }
      // Si son diferentes, el override manda
      return precioOverride
    }

    // Paso 2: Usar precio de calculadora
    if (precioCalculadora !== null) {
      return precioCalculadora
    }

    // Paso 3: Usar precio calculado
    if (precioCalculado !== null && precioCalculado > 0) {
      return precioCalculado
    }

    // Paso 4: Precio base
    return precioBase

  } catch (error) {
    console.error('Error obteniendo precio variante sync:', error)
    return precioBase
  }
}
