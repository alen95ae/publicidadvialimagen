/**
 * Función para calcular el coste de un producto según una combinación de variantes
 * Considera las variantes de los recursos en la receta
 */

import { generarClaveVariante, normalizarClaveProducto } from './generarCombinaciones'

export interface RecursoConVariantes {
  id: string
  nombre: string
  codigo: string
  coste: number
  variantes?: any[]
  control_stock?: any
}

export interface ItemReceta {
  recurso_id?: string
  recurso_codigo?: string
  recurso_nombre?: string
  cantidad: number
  unidad?: string
}

/**
 * Obtiene el precio variante de un recurso según una combinación de variantes
 * NUEVA ESTRATEGIA: Normaliza claves a solo valores para evitar problemas con nombres diferentes
 */
function obtenerPrecioVarianteRecurso(
  recurso: RecursoConVariantes,
  combinacionVariantes: Record<string, string>,
  sucursal?: string
): number {
  // Si el recurso no tiene variantes, usar coste base
  if (!recurso.variantes || !Array.isArray(recurso.variantes) || recurso.variantes.length === 0) {
    console.log(`  📦 ${recurso.nombre}: SIN variantes → coste base ${recurso.coste}`)
    return recurso.coste || 0
  }

  // Si no hay control_stock, usar coste base
  if (!recurso.control_stock) {
    console.log(`  📦 ${recurso.nombre}: SIN control_stock → coste base ${recurso.coste}`)
    return recurso.coste || 0
  }

  try {
    let controlStock: any = null
    if (typeof recurso.control_stock === 'string') {
      controlStock = JSON.parse(recurso.control_stock)
    } else {
      controlStock = recurso.control_stock
    }

    if (!controlStock || typeof controlStock !== 'object') {
      console.log(`  📦 ${recurso.nombre}: control_stock inválido → coste base ${recurso.coste}`)
      return recurso.coste || 0
    }

    console.log(`  📦 ${recurso.nombre}: tiene ${recurso.variantes.length} variantes definidas`)
    console.log(`  📋 Variantes del recurso:`, recurso.variantes.map(v => v.nombre))
    console.log(`  📋 Combinación del producto:`, combinacionVariantes)

    // NUEVA ESTRATEGIA: Buscar por valores en lugar de nombres
    // Extraer todos los valores de las variantes del producto (excepto Sucursal)
    const valoresProducto = Object.entries(combinacionVariantes)
      .filter(([key]) => key !== 'Sucursal')
      .map(([_, value]) => value)
    
    console.log(`  🔍 Valores del producto a buscar:`, valoresProducto)

    // Buscar en control_stock usando dos estrategias:
    // 1. Primero: Clave completa con nombres (método viejo)
    const claveCompleta = sucursal 
      ? generarClaveVariante({ ...combinacionVariantes, Sucursal: sucursal })
      : generarClaveVariante(combinacionVariantes)
    
    console.log(`  🔍 Intentando clave completa: "${claveCompleta}"`)
    let datosVariante = controlStock[claveCompleta]
    
    // 2. Si no funciona: Buscar por coincidencia de valores
    if (!datosVariante) {
      console.log(`  ⚠️ No encontrada con clave completa, buscando por valores...`)
      console.log(`  🔍 Claves disponibles en control_stock:`, Object.keys(controlStock).slice(0, 5))
      
      // Buscar una clave que contenga TODOS los valores del producto
      const claveEncontrada = Object.keys(controlStock).find(clave => {
        // Verificar si la sucursal coincide (si se especifica)
        if (sucursal && clave.includes('Sucursal')) {
          if (!clave.includes(`Sucursal:${sucursal}`)) {
            return false
          }
        }
        
        // Verificar que todos los valores del producto estén en la clave
        return valoresProducto.every(valor => clave.includes(valor))
      })
      
      if (claveEncontrada) {
        console.log(`  ✅ Clave encontrada por coincidencia de valores: "${claveEncontrada}"`)
        datosVariante = controlStock[claveEncontrada]
      }
    }
    
    if (datosVariante && datosVariante.precioVariante !== undefined) {
      const precio = Number(datosVariante.precioVariante) || recurso.coste || 0
      console.log(`  ✅ ${recurso.nombre}: encontrado precioVariante = ${precio}`)
      return precio
    }

    // Si hay diferencia de precio, aplicarla
    if (datosVariante && datosVariante.diferenciaPrecio !== undefined) {
      const diferencia = Number(datosVariante.diferenciaPrecio) || 0
      const precio = (recurso.coste || 0) + diferencia
      console.log(`  ✅ ${recurso.nombre}: encontrado diferenciaPrecio = ${diferencia}, precio final = ${precio}`)
      return precio
    }

    // Si no se encuentra, usar coste base
    console.log(`  ⚠️ ${recurso.nombre}: NO se encontró variante con valores [${valoresProducto.join(', ')}]`)
    console.log(`  🔍 Todas las claves en control_stock:`, Object.keys(controlStock))
    return recurso.coste || 0
  } catch (e) {
    console.error(`  ❌ ${recurso.nombre}: Error obteniendo precio variante:`, e)
    return recurso.coste || 0
  }
}

/**
 * Calcula el coste total de un producto según una combinación de variantes
 * @param receta Array de items de la receta del producto
 * @param recursos Array completo de recursos disponibles
 * @param combinacionVariantes Combinación de variantes del producto (ej: { Color: "Blanco", Tamaño: "A4" })
 * @param sucursal Sucursal opcional para obtener precios específicos
 * @returns Coste total calculado
 */
export function calcularCosteVariante(
  receta: ItemReceta[],
  recursos: RecursoConVariantes[],
  combinacionVariantes: Record<string, string>,
  sucursal?: string
): number {
  if (!receta || !Array.isArray(receta) || receta.length === 0) {
    console.log('⚠️ calcularCosteVariante: receta vacía o inválida')
    return 0
  }

  if (!recursos || !Array.isArray(recursos)) {
    console.log('⚠️ calcularCosteVariante: recursos vacíos o inválidos')
    return 0
  }

  console.log('🧮 Calculando coste de variante:', {
    combinacionVariantes,
    sucursal,
    receta: receta.map(r => `${r.recurso_nombre} (${r.cantidad})`),
    recursosDisponibles: recursos.length
  })

  let costeTotal = 0
  const detalleCalculo: any[] = []

  receta.forEach(item => {
    // Buscar el recurso completo
    const recurso = recursos.find(r => 
      r.id === item.recurso_id || 
      r.codigo === item.recurso_codigo ||
      r.nombre === item.recurso_nombre
    )

    if (!recurso) {
      console.warn('❌ Recurso no encontrado en receta:', item.recurso_id || item.recurso_codigo)
      return
    }

    // Obtener precio variante del recurso
    const precioVariante = obtenerPrecioVarianteRecurso(
      recurso,
      combinacionVariantes,
      sucursal
    )

    // Calcular coste de este item: precio * cantidad
    const cantidad = Number(item.cantidad) || 1
    const costeItem = precioVariante * cantidad

    detalleCalculo.push({
      recurso: recurso.nombre,
      tieneVariantes: recurso.variantes && recurso.variantes.length > 0,
      precioUnitario: precioVariante,
      cantidad: cantidad,
      subtotal: costeItem
    })

    costeTotal += costeItem
  })

  console.log('✅ Detalle del cálculo:', detalleCalculo)
  console.log('💰 Coste total calculado:', Math.round(costeTotal * 100) / 100)

  return Math.round(costeTotal * 100) / 100 // Redondear a 2 decimales
}

