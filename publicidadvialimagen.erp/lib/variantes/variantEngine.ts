/**
 * Motor central para la gestión de variantes (Shared Logic)
 * Usado tanto en Frontend como Backend
 */

export interface VariantDefinition {
  nombre: string
  valores: string[]
}

export interface VariantCombination {
  combinacion: string
  valores: Record<string, string>
}

/* ============================================================
   🔥 CLAVE UNIVERSAL DE VARIANTES (formato estándar)
   Ejemplo:
     { Color: "Rojo", Tamaño: "XL" }
     → "Color:Rojo|Tamaño:XL"
   ============================================================ */
export function buildVariantKey(valores: Record<string, string>): string {
  if (!valores || Object.keys(valores).length === 0) return "Base"

  return Object.entries(valores)
    .filter(([_, val]) => val && String(val).trim() !== "")
    .map(([k, v]) => `${capitalize(k)}:${String(v).trim()}`)
    .sort()
    .join("|")
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/* ============================================================
   Parsear clave "Color:Rojo|Tamaño:XL" → { Color: "Rojo", Tamaño: "XL" }
   ============================================================ */
export function parseVariantKey(key: string): Record<string, string> {
  if (!key || key === "Base") return {}

  const out: Record<string, string> = {}
  key.split("|").forEach(part => {
    const [k, v] = part.split(":")
    if (k && v) out[capitalize(k.trim())] = v.trim()
  })
  return out
}

/* ============================================================
   Parseo LEGACY (por compatibilidad)
   ============================================================ */
export function parseLegacyCombination(combinacion: string): Record<string, string> {
  if (!combinacion) return {}
  
  const out: Record<string, string> = {}

  combinacion.split("|").forEach(parte => {
    const [key, val] = parte.split(":")
    if (key && val) out[key.trim()] = val.trim()
  })

  return out
}

/* ============================================================
   🔥 NUEVA buildVariantDefinitionFromReceta
   Ahora depende de RECURSOS reales, no de selectedRecurso
   ============================================================ */
export function buildVariantDefinitionFromReceta(
  recetaItems: any[],
  recursosMap: Map<string, any> // recurso_id → recurso real con variantes ya parseadas
): VariantDefinition[] {
  
  const defs = new Map<string, Set<string>>()

  recetaItems.forEach(item => {
    const recurso = recursosMap.get(item.recurso_id)
    if (!recurso) return

    // Normalizar variantes del recurso (pueden venir en diferentes formatos)
    let variantesArray: any[] = []
    
    if (Array.isArray(recurso.variantes)) {
      variantesArray = recurso.variantes
    } else if (typeof recurso.variantes === 'string') {
      try {
        const parsed = JSON.parse(recurso.variantes)
        if (Array.isArray(parsed)) {
          variantesArray = parsed
        } else if (parsed && Array.isArray(parsed.variantes)) {
          variantesArray = parsed.variantes
        }
      } catch (e) {
        console.warn('Error parseando variantes del recurso:', e)
      }
    } else if (recurso.variantes && typeof recurso.variantes === 'object' && Array.isArray(recurso.variantes.variantes)) {
      variantesArray = recurso.variantes.variantes
    }

    if (variantesArray.length === 0) return

    variantesArray.forEach(v => {
      if (!v || !v.nombre) return

      const nombre = v.nombre.trim()
      // Aceptar tanto 'valores' como 'posibilidades' para compatibilidad
      const valores = Array.isArray(v.valores) 
        ? v.valores 
        : Array.isArray(v.posibilidades)
        ? v.posibilidades
        : []

      if (valores.length === 0) return

      if (!defs.has(nombre)) defs.set(nombre, new Set())

      valores.forEach((val: any) => {
        // Limpiar valores: si vienen con código de color (ej: "Blanco:#ffffff"), extraer solo el nombre
        let clean = String(val).trim()
        if (clean.includes(':') && /^#[0-9A-Fa-f]{6}$/i.test(clean.split(':')[1]?.trim())) {
          clean = clean.split(':')[0].trim()
        }
        if (clean) defs.get(nombre)!.add(clean)
      })
    })
  })

  // Convertir a array ordenado
  return Array.from(defs.entries()).map(([nombre, valores]) => ({
    nombre,
    valores: Array.from(valores).sort()
  }))
}

/* ============================================================
   findResourceVariantPrice — AHORA MATCH EXACTO Y SEGURO
   ============================================================ */
export function findResourceVariantPrice(
  recurso: any,
  productVariant: Record<string, string>,
  sucursal?: string
): number {
  const base = Number(recurso.coste) || 0

  if (!recurso.control_stock || typeof recurso.control_stock !== "object")
    return base

  const stock = recurso.control_stock
  const keys = Object.keys(stock)

  // Añadir sucursal si existe
  const productSucursal =
    sucursal ||
    productVariant["Sucursal"] ||
    productVariant["sucursal"] ||
    null

  // Claves candidatas: EXACT MATCH
  const candidate = keys.find(k => {
    const parsed = parseLegacyCombination(k)

    // 1. Si tiene sucursal, debe coincidir exactamente
    if (productSucursal) {
      if (!parsed["Sucursal"]) return false
      if (parsed["Sucursal"].toLowerCase() !== productSucursal.toLowerCase())
        return false
    }

    // 2. Todas las variantes que el recurso tiene deben coincidir
    if (Array.isArray(recurso.variantes)) {
      for (const v of recurso.variantes) {
        const nombre = v.nombre
        if (!nombre) continue

        const prodVal = productVariant[nombre]
        const keyVal = parsed[nombre]

        if (prodVal && keyVal && prodVal !== keyVal) return false
      }
    }

    return true
  })

  if (!candidate) return base

  const data = stock[candidate]

  // IMPORTANTE: Solo retornar la DIFERENCIA DE PRECIO
  // El coste base del producto YA incluye el coste base de los recursos
  // Aquí solo devolvemos el incremento/decremento por la variante específica
  if (data.diferenciaPrecio != null) return base + Number(data.diferenciaPrecio)
  
  // Si no hay diferenciaPrecio pero hay precioVariante, calcular la diferencia
  if (data.precioVariante != null) return Number(data.precioVariante)
  
  // Si no hay precio, calcular desde diferencia
  if (data.precio != null) return Number(data.precio)

  return base
}

/* ============================================================
   computeVariantCost — Calcula coste de producto con variantes
   
   IMPORTANTE: 
   - El coste base del producto viene de su calculadora de precios
   - A ese coste base se le SUMAN las diferencias de precio de las variantes
   - Las diferencias vienen del control_stock de cada recurso
   ============================================================ */
export function computeVariantCost(
  receta: any[],
  recursos: any[],
  productVariant: Record<string, string>,
  sucursal?: string,
  costeBase?: number // Coste base del producto (de calculadora)
): number {
  
  let total = costeBase || 0 // Partir del coste base si se proporciona

  receta.forEach(item => {
    const recurso = recursos.find(r => r.id === item.recurso_id)
    if (!recurso) return

    const qty = Number(item.cantidad) || 0
    
    // Obtener el precio del recurso para esta variante específica
    const precioRecurso = findResourceVariantPrice(recurso, productVariant, sucursal)
    
    // Si el coste base NO fue proporcionado, sumar el coste completo del recurso
    // Si fue proporcionado, solo sumar la diferencia (precioRecurso ya incluye base + diferencia)
    if (costeBase === undefined) {
      total += precioRecurso * qty
    } else {
      // Calcular solo la diferencia sobre el coste base del recurso
      const costeBaseRecurso = Number(recurso.coste) || 0
      const diferencia = precioRecurso - costeBaseRecurso
      total += diferencia * qty
    }
  })

  return Math.round(total * 100) / 100
}
