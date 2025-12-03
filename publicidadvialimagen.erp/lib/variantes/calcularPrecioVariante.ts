/**
 * Función para calcular el precio de venta de un producto según una combinación de variantes
 * Aplica el mismo markup que la calculadora base del producto
 * 
 * NOTA: Ahora usa el motor de cálculo unificado (pricingEngine)
 */

import { calcularPrecioVarianteBase } from '@/lib/engines/pricingEngine'
import { CalculadoraPrecios, PriceRow } from '@/lib/types/inventario'

// Re-exportar tipos para compatibilidad
export type { PriceRow, CalculadoraPrecios }

/**
 * Calcula el precio de venta aplicando el markup de la calculadora base
 * @param coste Coste base o coste de la variante
 * @param calculadora Configuración de la calculadora de precios del producto
 * @returns Precio de venta calculado
 */
export function calcularPrecioVariante(
  coste: number,
  calculadora: CalculadoraPrecios | null
): number {
  if (!calculadora || !calculadora.priceRows || !Array.isArray(calculadora.priceRows)) {
    // Si no hay calculadora, aplicar un markup simple del 50%
    return Math.round((coste * 1.5) * 100) / 100
  }

  // Usar el motor de cálculo unificado
  return calcularPrecioVarianteBase({
    coste,
    priceRows: calculadora.priceRows as PriceRow[]
  })
}

/**
 * Calcula la diferencia de precio respecto al precio base
 */
export function calcularDiferenciaPrecio(
  precioVariante: number,
  precioBase: number
): number {
  return Math.round((precioVariante - precioBase) * 100) / 100
}

/**
 * Calcula la diferencia de coste respecto al coste base
 */
export function calcularDiferenciaCoste(
  costeVariante: number,
  costeBase: number
): number {
  return Math.round((costeVariante - costeBase) * 100) / 100
}

