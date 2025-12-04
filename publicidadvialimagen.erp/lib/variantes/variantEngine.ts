
/**
 * Motor central para la gestión de variantes (Shared Logic)
 * Usado tanto en Frontend (React) como Backend (API/Scripts)
 */

export interface VariantDefinition {
  nombre: string
  valores: string[]
}

export interface VariantCombination {
  combinacion: string // Clave normalizada
  valores: Record<string, string> // Objeto de valores
}

/**
 * Normaliza una clave de variante a un formato estándar universal.
 * Formato: "nombre=valor|nombre=valor" (ordenado alfabéticamente por nombre)
 * Todo en minúsculas para las claves, valores trimmeados.
 * 
 * Ejemplo: 
 *   Input: { "Color": " Rojo ", "Tamaño": "XL" }
 *   Output: "color=rojo|tamaño=xl"
 * 
 *   Input: { "Sucursal": "La Paz", "Grosor": "10 Oz" }
 *   Output: "grosor=10 oz|sucursal=la paz"
 */
export function normalizeVariantKey(valores: Record<string, string>): string {
  if (!valores || Object.keys(valores).length === 0) return "base"

  return Object.entries(valores)
    .filter(([_, val]) => val !== null && val !== undefined && String(val).trim() !== '')
    .map(([key, val]) => {
      const k = key.trim().toLowerCase()
      const v = String(val).trim() // Mantener casing del valor para display, o lowercase para comparación estricta?
      // El usuario pidió "dimensionSlug=valueSlug". Vamos a normalizar a lowercase para evitar duplicados por casing.
      return `${k}=${v.toLowerCase()}`
    })
    .sort() // Orden alfabético para consistencia
    .join('|')
}

/**
 * Parsea una clave normalizada de vuelta a un objeto
 */
export function parseVariantKey(key: string): Record<string, string> {
  if (!key || key === 'base') return {}
  
  const valores: Record<string, string> = {}
  key.split('|').forEach(part => {
    const [k, v] = part.split('=')
    if (k && v) {
      valores[k] = v // Nota: los valores estarán en lowercase
    }
  })
  return valores
}

/**
 * Convierte una combinación legible (legacy) a objeto de valores
 * Input: "Color: Rojo | Tamaño: XL"
 * Output: { "Color": "Rojo", "Tamaño": "XL" }
 */
export function parseLegacyCombination(combinacion: string): Record<string, string> {
  if (!combinacion) return {}
  
  const valores: Record<string, string> = {}
  const partes = combinacion.split('|')
  
  partes.forEach(parte => {
    const [key, val] = parte.split(':')
    if (key && val) {
      valores[key.trim()] = val.trim()
    } else if (key && !val) {
      // Caso especial: "A | La Paz" (formato control_stock antiguo)
      // Es difícil inferir keys aquí sin contexto.
    }
  })
  
  return valores
}

/**
 * Construye la definición de variantes del producto basada en su receta
 */
export function buildVariantDefinitionFromReceta(recetaItems: any[]): VariantDefinition[] {
  const definitionsMap = new Map<string, Set<string>>()

  recetaItems.forEach(item => {
    // Intentar obtener variantes del recurso (item.recurso o item.selectedRecurso)
    const recurso = item.selectedRecurso || item // Adaptarse a estructura de costRows o receta raw
    
    let variantes: any[] = []
    
    // Extraer variantes del recurso (soporta múltiples formatos)
    if (recurso.variantes) {
      if (Array.isArray(recurso.variantes)) {
        variantes = recurso.variantes
      } else if (typeof recurso.variantes === 'object' && Array.isArray(recurso.variantes.variantes)) {
        variantes = recurso.variantes.variantes
      } else if (typeof recurso.variantes === 'string') {
        try {
          const parsed = JSON.parse(recurso.variantes)
          if (Array.isArray(parsed)) variantes = parsed
          else if (parsed.variantes && Array.isArray(parsed.variantes)) variantes = parsed.variantes
        } catch (e) {}
      }
    }

    // Procesar variantes encontradas
    variantes.forEach((v: any) => {
      if (!v.nombre) return
      const nombre = v.nombre.trim()
      const valores = v.valores || v.posibilidades || []
      
      if (!Array.isArray(valores)) return

      if (!definitionsMap.has(nombre)) {
        definitionsMap.set(nombre, new Set())
      }
      
      valores.forEach((val: any) => {
        const valStr = String(val).trim()
        // Limpiar códigos de color si existen (ej: "Blanco:#ffffff" -> "Blanco")
        const valClean = valStr.includes(':') && valStr.includes('#') 
          ? valStr.split(':')[0].trim() 
          : valStr
          
        if (valClean) {
          definitionsMap.get(nombre)!.add(valClean)
        }
      })
    })
  })

  // Convertir a array
  return Array.from(definitionsMap.entries()).map(([nombre, valoresSet]) => ({
    nombre,
    valores: Array.from(valoresSet).sort()
  }))
}

/**
 * Encuentra el precio de una variante de recurso específica.
 * Intenta hacer match entre la variante del producto y las claves de control_stock del recurso.
 */
export function findResourceVariantPrice(
  recurso: any,
  productVariantValues: Record<string, string>,
  sucursal?: string
): number {
  const costeBase = Number(recurso.coste) || 0
  
  // Si no hay control_stock, retornar coste base
  if (!recurso.control_stock) return costeBase

  let controlStock: any = recurso.control_stock
  if (typeof controlStock === 'string') {
    try { controlStock = JSON.parse(controlStock) } catch { return costeBase }
  }
  
  if (!controlStock || Object.keys(controlStock).length === 0) return costeBase

  // Estrategia de Matching:
  // 1. Construir claves candidatas basadas en los valores del producto que coinciden con variantes del recurso.
  
  // Identificar qué variantes tiene este recurso
  let recursoVariantesDef: any[] = []
  // (Reutilizar lógica de extracción de variantes)
  if (Array.isArray(recurso.variantes)) recursoVariantesDef = recurso.variantes
  else if (recurso.variantes?.variantes) recursoVariantesDef = recurso.variantes.variantes
  else if (typeof recurso.variantes === 'string') {
    try { 
      const p = JSON.parse(recurso.variantes)
      recursoVariantesDef = Array.isArray(p) ? p : p.variantes || []
    } catch {}
  }

  // Filtrar valores del producto que son relevantes para este recurso
  const relevantValues: string[] = []
  
  recursoVariantesDef.forEach(rv => {
    const nombre = rv.nombre // ej: "Grosor"
    // Buscar en productVariantValues (case insensitive key)
    const prodVal = Object.entries(productVariantValues).find(([k, v]) => k.toLowerCase() === nombre.toLowerCase())?.[1]
    
    if (prodVal) {
      relevantValues.push(prodVal)
    }
  })

  // Añadir sucursal si existe
  const targetSucursal = sucursal || productVariantValues['Sucursal'] || productVariantValues['sucursal']
  
  // Generar candidatos de clave para buscar en control_stock
  // Las claves en control_stock suelen ser "Valor1 | Valor2 | Sucursal: X" o "Valor | Sucursal"
  // El orden no está garantizado en el legacy, así que probamos combinaciones o búsqueda parcial.
  
  const stockKeys = Object.keys(controlStock)
  
  // Búsqueda: Encontrar una clave en stockKeys que contenga TODOS los relevantValues Y la sucursal
  const matchKey = stockKeys.find(key => {
    const keyLower = key.toLowerCase()
    
    // Verificar sucursal
    if (targetSucursal) {
      // Formatos posibles: "Sucursal: La Paz", "La Paz" (si es solo sucursal)
      const sucursalFound = keyLower.includes(targetSucursal.toLowerCase())
      if (!sucursalFound) return false
    }
    
    // Verificar valores de variantes
    // Todos los valores relevantes deben estar presentes en la clave
    return relevantValues.every(val => keyLower.includes(val.toLowerCase()))
  })

  if (matchKey) {
    const data = controlStock[matchKey]
    // Prioridad: precioVariante > precio > diferenciaPrecio (+base)
    if (data.precioVariante !== undefined) return Number(data.precioVariante)
    if (data.precio !== undefined) return Number(data.precio)
    if (data.diferenciaPrecio !== undefined) return costeBase + Number(data.diferenciaPrecio)
  }

  // Si no hay match, retornar coste base (con warning en logs si fuera necesario)
  return costeBase
}

/**
 * Calcula el coste total de una variante de producto
 */
export function computeVariantCost(
  receta: any[],
  recursos: any[], // Array completo de recursos para lookup
  productVariantValues: Record<string, string>,
  sucursal?: string
): number {
  let totalCost = 0

  receta.forEach(item => {
    const recursoId = item.recurso_id
    const recurso = recursos.find((r: any) => r.id === recursoId)
    
    if (!recurso) return // Skip si no encuentra recurso

    const cantidad = Number(item.cantidad) || 0
    
    // Calcular precio unitario del recurso para esta variante
    const precioUnitario = findResourceVariantPrice(recurso, productVariantValues, sucursal)
    
    totalCost += precioUnitario * cantidad
  })

  return Math.round(totalCost * 100) / 100
}
