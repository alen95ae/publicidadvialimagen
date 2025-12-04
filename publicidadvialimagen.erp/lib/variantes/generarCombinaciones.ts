/**
 * Utilidad para generar todas las combinaciones posibles de variantes
 * Compatible con backend, frontend y control_stock
 */

export interface VarianteDefinicion {
  nombre: string
  valores: string[]
}

export interface VarianteCombinacion {
  combinacion: string // Ej: "Color:Blanco|Tamaño:A4"
  valores: Record<string, string> // Ej: { Color: "Blanco", Tamaño: "A4" }
}

/* ============================================================
   🔥 Generación de TODAS las combinaciones (producto cartesiano)
   ============================================================ */
export function generarCombinacionesVariantes(
  variantes: VarianteDefinicion[]
): VarianteCombinacion[] {

  if (!Array.isArray(variantes) || variantes.length === 0) return []

  // 1. Mantener solo variantes válidas y con valores reales
  const variantesValidas = variantes.filter(v =>
    v &&
    typeof v.nombre === "string" &&
    Array.isArray(v.valores) &&
    v.valores.length > 0
  )

  if (variantesValidas.length === 0) return []

  // 2. Extraer solo los arrays de valores
  const variantesArrays = variantesValidas.map(v => v.valores)

  // 3. Producto cartesiano
  function cartesian(arrays: string[][]): string[][] {
    return arrays.reduce(
      (acc, curr) =>
        acc.flatMap(a => curr.map(c => [...a, c])),
      [[]] as string[][]
    )
  }

  const rawCombinations = cartesian(variantesArrays)

  // 4. Convertir cada combinación a objeto + string normalizado
  return rawCombinations.map(combo => {
    const valores: Record<string, string> = {}
    const partes: string[] = []

    combo.forEach((valor, idx) => {
      const nombre = variantesValidas[idx].nombre
      valores[nombre] = valor
      partes.push(`${nombre}:${valor}`)
    })

    return {
      combinacion: partes.join("|"),
      valores
    }
  })
}

/* ============================================================
   🔥 Genera clave universal ordenada Ej: "Color:Rojo|Tamaño:A4"
   ============================================================ */
export function generarClaveVariante(obj: Record<string, string>): string {
  if (!obj || Object.keys(obj).length === 0) return "Base"

  return Object.entries(obj)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${String(v).trim()}`)
    .join("|")
}

/* ============================================================
   Clave normalizada SOLO valores → para agrupar variantes
   Ej:
      { Color:"Blanco", Grosor:"11 Oz" }
      → "11 Oz|Blanco"
   ============================================================ */
export function normalizarClaveProducto(obj: Record<string, string>): string {
  return Object.values(obj)
    .map(v => String(v).trim())
    .sort()
    .join("|") || "Base"
}

/* ============================================================
   🔥 Parseo robusto de claves
   Acepta "=" o ":" indistintamente
   ============================================================ */
export function parsearClaveVariante(clave: string): Record<string, string> {
  const out: Record<string, string> = {}
  if (!clave || clave === "Base" || clave === "sin_variantes") return out

  clave.split("|").forEach(part => {
    let [k, v] = part.includes("=")
      ? part.split("=")
      : part.split(":")

    if (k && v) out[k.trim()] = v.trim()
  })

  return out
}

/* ============================================================
   🔥 convertirVariantesAFormato
   Entrada:
     [{ nombre:"Color", valores:["Rojo","#FFF"] }]
   Salida:
     [{ nombre:"Color", valores:["Rojo"] }]
   ============================================================ */
export function convertirVariantesAFormato(
  variantes: any[]
): VarianteDefinicion[] {

  if (!Array.isArray(variantes)) return []

  const agrupadas = new Map<string, Set<string>>()

  variantes.forEach(v => {
    if (!v || !v.nombre) return

    const nombre = v.nombre
    const valores = v.valores ?? v.posibilidades ?? []

    if (!Array.isArray(valores)) return

    if (!agrupadas.has(nombre)) agrupadas.set(nombre, new Set())

    valores.forEach(val => {
      const clean = String(val).includes(":") && /^#[0-9A-Fa-f]{6}$/.test(String(val).split(":")[1])
        ? String(val).split(":")[0]
        : String(val)

      agrupadas.get(nombre)!.add(clean)
    })
  })

  return Array.from(agrupadas.entries()).map(([nombre, valores]) => ({
    nombre,
    valores: Array.from(valores).sort()
  }))
}
