/**
 * Función para obtener el precio de un producto según sus variantes
 * Usa COALESCE: precio_override si existe, sino precio_calculado, sino precio_base
 */

import { generarClaveVariante } from './generarCombinaciones'

/**
 * Obtiene el precio de un producto según una combinación de variantes
 * @param productoId ID del producto
 * @param variantes Combinación de variantes (ej: { Color: "Blanco", Tamaño: "A4" })
 * @param precioBase Precio base del producto (fallback)
 * @returns Precio final a usar
 */
export async function obtenerPrecioVariante(
  productoId: string,
  variantes: Record<string, string>,
  precioBase: number
): Promise<number> {
  // Si no hay variantes, retornar precio base
  if (!variantes || Object.keys(variantes).length === 0) {
    return precioBase
  }

  try {
    // Generar clave de combinación
    const combinacion = generarClaveVariante(variantes)

    // Obtener variante de la BD
    const response = await fetch(`/api/productos/variantes?producto_id=${productoId}`)
    
    if (!response.ok) {
      console.warn('Error obteniendo variantes, usando precio base')
      return precioBase
    }

    const data = await response.json()
    const variantesProducto = data.variantes || []

    // Buscar la variante que coincida
    const varianteEncontrada = variantesProducto.find(
      (v: any) => v.combinacion === combinacion
    )

    if (!varianteEncontrada) {
      // Si no se encuentra la variante, usar precio base
      return precioBase
    }

    // Usar COALESCE: precio_override > precio_calculado > precio_base
    if (varianteEncontrada.precio_override !== null && varianteEncontrada.precio_override !== undefined) {
      return Number(varianteEncontrada.precio_override) || precioBase
    }

    if (varianteEncontrada.precio_calculado !== null && varianteEncontrada.precio_calculado !== undefined) {
      return Number(varianteEncontrada.precio_calculado) || precioBase
    }

    return precioBase
  } catch (error) {
    console.error('Error obteniendo precio variante:', error)
    return precioBase
  }
}

/**
 * Obtiene el precio de un producto según una combinación de variantes (versión síncrona con datos ya cargados)
 * Útil cuando ya se tienen las variantes en memoria
 */
export function obtenerPrecioVarianteSync(
  variantesProducto: any[],
  variantes: Record<string, string>,
  precioBase: number
): number {
  // Si no hay variantes, retornar precio base
  if (!variantes || Object.keys(variantes).length === 0) {
    return precioBase
  }

  try {
    // Generar clave de combinación
    const combinacion = generarClaveVariante(variantes)

    // Buscar la variante que coincida
    const varianteEncontrada = variantesProducto.find(
      (v: any) => v.combinacion === combinacion
    )

    if (!varianteEncontrada) {
      return precioBase
    }

    // Usar COALESCE: precio_override > precio_calculado > precio_base
    if (varianteEncontrada.precio_override !== null && varianteEncontrada.precio_override !== undefined) {
      return Number(varianteEncontrada.precio_override) || precioBase
    }

    if (varianteEncontrada.precio_calculado !== null && varianteEncontrada.precio_calculado !== undefined) {
      return Number(varianteEncontrada.precio_calculado) || precioBase
    }

    return precioBase
  } catch (error) {
    console.error('Error obteniendo precio variante sync:', error)
    return precioBase
  }
}

