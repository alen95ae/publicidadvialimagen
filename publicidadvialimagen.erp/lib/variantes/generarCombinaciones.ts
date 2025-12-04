/**
 * Utilidad para generar todas las combinaciones posibles de variantes
 * Similar a la función en ajustes-inventario pero para productos
 */

export interface VarianteDefinicion {
  nombre: string
  valores: string[]
}

export interface VarianteCombinacion {
  combinacion: string // Formato: "Color:Blanco|Tamaño:A4"
  valores: Record<string, string> // { Color: "Blanco", Tamaño: "A4" }
}

/**
 * Genera todas las combinaciones posibles de variantes (producto cartesiano)
 * @param variantes Array de definiciones de variantes
 * @returns Array de combinaciones con su representación en string y objeto
 */
export function generarCombinacionesVariantes(
  variantes: VarianteDefinicion[]
): VarianteCombinacion[] {
  if (!variantes || variantes.length === 0) {
    return []
  }

  // Filtrar variantes que tengan valores válidos
  const variantesValidas = variantes.filter(v =>
    v &&
    v.nombre &&
    Array.isArray(v.valores) &&
    v.valores.length > 0
  )

  if (variantesValidas.length === 0) {
    console.warn("⚠️ No hay variantes válidas para generar combinaciones")
    return []
  }

  // Función auxiliar para generar producto cartesiano
  function cartesianProduct(arrays: string[][]): string[][] {
    if (arrays.length === 0) return []
    return arrays.reduce((acc, curr) => {
      if (curr.length === 0) return acc
      return acc.flatMap(accVal => curr.map(currVal => [...accVal, currVal]))
    }, [[]] as string[][])
  }

  // Obtener todas las posibilidades de cada variante válida
  const variantesArrays = variantesValidas.map(v => v.valores || [])

  // Generar producto cartesiano
  const combinations = cartesianProduct(variantesArrays)

  // Convertir a formato de objeto y string
  return combinations.map(combo => {
    const valores: Record<string, string> = {}
    const partes: string[] = []

    combo.forEach((valor, index) => {
      const nombreVariante = variantes[index].nombre
      valores[nombreVariante] = valor
      partes.push(`${nombreVariante}:${valor}`)
    })

    return {
      combinacion: partes.join('|'),
      valores
    }
  })
}

/**
 * Genera clave de combinación de variantes (formato: "Color:blanco|Tamaño:A4")
 * Similar a generateVarianteKey en ajustes-inventario
 */
export function generarClaveVariante(combinacion: Record<string, string>): string {
  if (!combinacion || Object.keys(combinacion).length === 0) {
    return "sin_variantes"
  }

  const parts = Object.entries(combinacion)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => {
      const valueStr = String(value)
      // Si el valor contiene un código hexadecimal, solo usar el nombre del color
      if (valueStr.includes(':') && /^#[0-9A-Fa-f]{6}$/.test(valueStr.split(':')[1])) {
        return `${key}:${valueStr.split(':')[0]}`
      }
      return `${key}:${valueStr}`
    })

  return parts.join("|")
}

/**
 * Normaliza una combinación de variantes a formato de solo valores
 * Esto permite comparar variantes independientemente de los nombres
 * @param combinacion Objeto { Color: "Blanco", Grosor: "11 Oz" }
 * @returns Clave normalizada: "Blanco|11 Oz" (solo valores, ordenados alfabéticamente)
 */
export function normalizarClaveProducto(combinacion: Record<string, string>): string {
  if (!combinacion || Object.keys(combinacion).length === 0) {
    return "sin_variantes"
  }

  // Extraer solo valores, ordenarlos alfabéticamente para consistencia
  const valores = Object.entries(combinacion)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([_, value]) => String(value))
    .filter(v => v && v.trim().length > 0) // Filtrar valores vacíos

  return valores.join("|")
}

/**
 * Parsea una clave de variante en un objeto
 * @param clave Formato: "Color:Blanco|Tamaño:A4"
 * @returns Objeto { Color: "Blanco", Tamaño: "A4" }
 */
export function parsearClaveVariante(clave: string): Record<string, string> {
  if (!clave || clave === "sin_variantes") {
    return {}
  }

  const valores: Record<string, string> = {}
  const partes = clave.split('|')

  partes.forEach(parte => {
    let nombre, valor
    if (parte.includes('=')) {
      [nombre, valor] = parte.split('=')
    } else {
      [nombre, valor] = parte.split(':')
    }

    if (nombre && valor) {
      valores[nombre.trim()] = valor.trim()
    }
  })

  return valores
}

/**
 * Convierte array de variantes del producto a formato VarianteDefinicion
 * @param variantes Array de variantes del producto (formato actual)
 * @returns Array de VarianteDefinicion
 */
export function convertirVariantesAFormato(
  variantes: any[]
): VarianteDefinicion[] {
  if (!variantes || !Array.isArray(variantes)) {
    return []
  }

  // Agrupar variantes por nombre
  const variantesMap = new Map<string, Set<string>>()

  variantes.forEach(variante => {
    if (variante && variante.nombre) {
      const nombre = variante.nombre
      // Aceptar tanto 'valores' como 'posibilidades' para compatibilidad
      const valores = variante.valores ?? variante.posibilidades ?? []

      // Validar que valores sea un array y tenga elementos
      if (!Array.isArray(valores) || valores.length === 0) {
        console.warn(`⚠️ Variante "${nombre}" ignorada: sin valores válidos`)
        return // Saltar variantes sin valores
      }

      if (!variantesMap.has(nombre)) {
        variantesMap.set(nombre, new Set())
      }

      valores.forEach((valor: string) => {
        // Extraer solo el nombre si viene con código de color
        const valorLimpio = valor.includes(':') && /^#[0-9A-Fa-f]{6}$/.test(valor.split(':')[1])
          ? valor.split(':')[0]
          : valor
        variantesMap.get(nombre)!.add(valorLimpio)
      })
    }
  })

  // Convertir a formato VarianteDefinicion
  return Array.from(variantesMap.entries()).map(([nombre, valores]) => ({
    nombre,
    valores: Array.from(valores)
  }))
}

