/**
 * Función para calcular el coste de un producto según una combinación de variantes
 * Considera las variantes de los recursos en la receta
 */

import { generarClaveVariante, normalizarClaveProducto } from './generarCombinaciones'
import { RecursoConVariantes } from '@/lib/types/inventario'

export interface ItemReceta {
  recurso_id?: string
  recurso_codigo?: string
  recurso_nombre?: string
  cantidad: number
  unidad?: string
}

/**
 * Calcula el coste total de un producto según una combinación de variantes
 * FÓRMULA CORRECTA: coste_variante = coste_base_producto + (precio_recurso_variant – precio_recurso_base)
 * 
 * @param receta Array de items de la receta del producto
 * @param recursos Array completo de recursos disponibles
 * @param combinacionVariantes Combinación de variantes del producto (ej: { Color: "Blanco", Tamaño: "A4" })
 * @param sucursal Sucursal opcional para obtener precios específicos (sucursal destino)
 * @param sucursalBase Sucursal base del producto (por defecto "La Paz")
 * @returns Coste total calculado
 */
export function calcularCosteVariante(
  receta: ItemReceta[],
  recursos: RecursoConVariantes[],
  combinacionVariantes: Record<string, string>,
  sucursal?: string,
  sucursalBase: string = "La Paz"
): number {
  if (!receta || !Array.isArray(receta) || receta.length === 0) {
    console.log('⚠️ calcularCosteVariante: receta vacía o inválida')
    return 0
  }

  if (!recursos || !Array.isArray(recursos)) {
    console.log('⚠️ calcularCosteVariante: recursos vacíos o inválidos')
    return 0
  }

  // Extraer sucursal de la combinación si no se proporciona
  const sucursalDestino = sucursal || combinacionVariantes.Sucursal || combinacionVariantes.sucursal || sucursalBase

  console.log('🧮 Calculando coste de variante (fórmula corregida):', {
    combinacionVariantes,
    sucursal: sucursalDestino,
    sucursalBase,
    receta: receta.map(r => `${r.recurso_nombre} (${r.cantidad})`),
    recursosDisponibles: recursos.length
  })

  // Paso 1: Calcular coste base del producto (suma de costes base de recursos)
  let costeBaseProducto = 0

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

    // Coste base del recurso (sin variantes)
    const costeBaseRecurso = recurso.coste || 0
    const cantidad = Number(item.cantidad) || 1
    const costeItemBase = costeBaseRecurso * cantidad
    costeBaseProducto += costeItemBase
  })

  console.log('💰 Coste base del producto:', costeBaseProducto)

  // Paso 2: Calcular diferencias de precios por recurso según sucursal
  // FÓRMULA: coste_variante = coste_base_producto + (precio_recurso_variant – precio_recurso_base)
  let sumaDiferencias = 0

  receta.forEach(item => {
    const recurso = recursos.find(r => 
      r.id === item.recurso_id || 
      r.codigo === item.recurso_codigo ||
      r.nombre === item.recurso_nombre
    )

    if (!recurso) return

    const cantidad = Number(item.cantidad) || 1

    // Obtener precio base del recurso en sucursal base
    const precioRecursoBase = getPrecioRecursoPorSucursal(recurso, sucursalBase)

    // Obtener precio variante del recurso en sucursal destino
    const precioRecursoVariant = getPrecioRecursoPorSucursal(recurso, sucursalDestino)

    // Calcular diferencia: precio_recurso_variant – precio_recurso_base
    const diferencia = precioRecursoVariant - precioRecursoBase
    const diferenciaTotal = diferencia * cantidad
    sumaDiferencias += diferenciaTotal

    console.log(`  📦 ${recurso.nombre}: precio_base(${sucursalBase})=${precioRecursoBase}, precio_variant(${sucursalDestino})=${precioRecursoVariant}, diferencia=${diferencia}, diferenciaTotal=${diferenciaTotal}`)
  })

  console.log('💰 Suma de diferencias:', sumaDiferencias)

  // Paso 3: Calcular coste variante final
  // FÓRMULA: coste_variante = coste_base_producto + suma_diferencias
  const costeVariante = costeBaseProducto + sumaDiferencias

  const costeRedondeado = Math.round(costeVariante * 100) / 100
  console.log('💰 Coste variante calculado:', costeRedondeado)

  return costeRedondeado // Redondear a 2 decimales
}

/**
 * Obtiene el precio de un recurso en una sucursal específica
 * Usa el variantAdapter para normalizar y obtener el precio de forma consistente
 * 
 * @param recurso Recurso con control_stock
 * @param sucursal Sucursal para buscar el precio
 * @returns Precio del recurso en esa sucursal (nunca null, siempre número)
 */
function getPrecioRecursoPorSucursal(
  recurso: RecursoConVariantes,
  sucursal: string
): number {
  if (!recurso) return 0

  // Usar variantAdapter para normalizar variantes del recurso
  try {
    const { normalizeRecursoVariant } = require('@/lib/adapters/variantAdapter')
    const variantesUnificadas = normalizeRecursoVariant(recurso, sucursal)
    
    // Buscar la variante que coincida con la sucursal
    // Tipo inline para evitar dependencias circulares
    type VarianteUnificadaLocal = {
      clave: string
      sucursal?: string
      precio: number
    }
    const varianteSucursal = variantesUnificadas.find((v: VarianteUnificadaLocal) => 
      v.sucursal === sucursal || 
      v.sucursal?.toLowerCase() === sucursal.toLowerCase() ||
      v.clave.toLowerCase().includes(sucursal.toLowerCase())
    )
    
    if (varianteSucursal && typeof varianteSucursal.precio === 'number') {
      return varianteSucursal.precio // Incluso si es 0, es válido
    }
    
    // Si no se encuentra para la sucursal específica, usar la primera disponible
    if (variantesUnificadas.length > 0) {
      const primeraVariante = variantesUnificadas[0]
      if (typeof primeraVariante.precio === 'number') {
        return primeraVariante.precio // Incluso si es 0
      }
    }
  } catch (error) {
    // Si falla el adapter, usar lógica de fallback
    console.warn('Error usando variantAdapter, usando fallback:', error)
  }

  // Fallback: si no hay control_stock o el adapter falla, usar coste base
  return recurso.coste || 0
}

