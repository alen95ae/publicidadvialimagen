/**
 * Modelos normalizados para productos
 * 
 * Unifica cómo fluyen los datos entre frontend ↔ backend ↔ API
 * Elimina inconsistencias entre "precio_venta", "precioBase", "precio_calculado", etc.
 */

import { PriceRow, CalculadoraPrecios } from '@/lib/types/inventario'

/**
 * Modelo normalizado de calculadora de precios
 */
export interface ProductoCalculadora {
  priceRows: PriceRow[]
  totalPrice: number
  utilidadReal?: number
  objetivoUtilidadReal?: number | null
}

/**
 * Parsea una calculadora desde cualquier formato (compatibilidad)
 * 
 * @param input Puede ser string JSON, objeto, o null/undefined
 * @returns Calculadora normalizada
 */
export function parseCalculadora(input: any): ProductoCalculadora {
  // Si es null/undefined, retornar estructura vacía
  if (!input) {
    return {
      priceRows: [],
      totalPrice: 0
    }
  }
  
  // Si es string, parsearlo
  let parsed: any = input
  if (typeof input === 'string') {
    try {
      parsed = JSON.parse(input)
    } catch (e) {
      console.warn('Error parseando calculadora desde string:', e)
      return {
        priceRows: [],
        totalPrice: 0
      }
    }
  }
  
  // Si ya tiene la estructura correcta, retornarla
  if (parsed && typeof parsed === 'object') {
    // Normalizar priceRows
    const priceRows: PriceRow[] = Array.isArray(parsed.priceRows)
      ? parsed.priceRows.map((row: any) => ({
          id: row.id || 0,
          campo: row.campo || '',
          porcentaje: row.porcentaje ?? null,
          porcentajeConfig: row.porcentajeConfig ?? null,
          valor: row.valor ?? 0,
          editable: row.editable ?? false
        }))
      : []
    
    return {
      priceRows,
      totalPrice: typeof parsed.totalPrice === 'number' ? parsed.totalPrice : 0,
      utilidadReal: typeof parsed.utilidadReal === 'number' ? parsed.utilidadReal : undefined,
      objetivoUtilidadReal: parsed.objetivoUtilidadReal ?? null
    }
  }
  
  // Fallback: estructura vacía
  return {
    priceRows: [],
    totalPrice: 0
  }
}

/**
 * Serializa una calculadora para guardar en Supabase
 * 
 * @param calc Calculadora normalizada
 * @returns Objeto serializable para Supabase
 */
export function serializeCalculadora(calc: ProductoCalculadora): any {
  return {
    priceRows: calc.priceRows.map(row => ({
      id: row.id,
      campo: row.campo,
      porcentaje: row.porcentaje,
      porcentajeConfig: row.porcentajeConfig ?? null,
      valor: row.valor,
      editable: row.editable ?? false
    })),
    totalPrice: calc.totalPrice,
    utilidadReal: calc.utilidadReal,
    objetivoUtilidadReal: calc.objetivoUtilidadReal ?? null
  }
}

/**
 * Convierte de formato antiguo (calculadora_precios) a nuevo (calculadora_de_precios)
 * Mantiene compatibilidad con ambos formatos
 */
export function normalizarCalculadoraProducto(producto: any): ProductoCalculadora {
  // Intentar primero con calculadora_de_precios (formato nuevo)
  if (producto.calculadora_de_precios) {
    return parseCalculadora(producto.calculadora_de_precios)
  }
  
  // Fallback a calculadora_precios (formato antiguo)
  if (producto.calculadora_precios) {
    return parseCalculadora(producto.calculadora_precios)
  }
  
  // Si no hay calculadora, retornar estructura vacía
  return {
    priceRows: [],
    totalPrice: 0
  }
}













