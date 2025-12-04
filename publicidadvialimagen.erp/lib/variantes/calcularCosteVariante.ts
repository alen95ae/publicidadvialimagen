/**
 * Función para calcular el coste de un producto según una combinación de variantes
 * DELEGADA al VariantEngine para consistencia
 */

import { computeVariantCost } from './variantEngine'
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
 * 
 * @param receta Array de items de la receta del producto
 * @param recursos Array completo de recursos disponibles
 * @param combinacionVariantes Combinación de variantes del producto (ej: { Color: "Blanco", Tamaño: "A4" })
 * @param sucursal Sucursal opcional para obtener precios específicos (sucursal destino)
 * @param sucursalBase Sucursal base del producto (por defecto "La Paz") - Ignorado en nueva lógica
 * @returns Coste total calculado
 */
export function calcularCosteVariante(
  receta: ItemReceta[],
  recursos: RecursoConVariantes[],
  combinacionVariantes: Record<string, string>,
  sucursal?: string,
  sucursalBase: string = "La Paz"
): number {
  // Delegar al motor central
  return computeVariantCost(
    receta,
    recursos,
    combinacionVariantes,
    sucursal
  )
}
