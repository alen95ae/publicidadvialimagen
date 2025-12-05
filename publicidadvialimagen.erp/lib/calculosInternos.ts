/**
 * Funciones internas unificadas para cálculos de cotizaciones
 * 
 * Este archivo centraliza la lógica de cálculo que estaba duplicada
 * entre nuevo/page.tsx y editar/[id]/page.tsx
 * 
 * IMPORTANTE: Estas funciones mantienen EXACTAMENTE la misma lógica
 * y fórmulas que existían antes. NO se modifica la fórmula de IVA/IT.
 */

import { obtenerPrecioVariante } from '@/lib/variantes/obtenerPrecioVariante'

/**
 * Redondea un número a 2 decimales
 * @param num Número a redondear
 * @returns Número redondeado a 2 decimales
 */
function redondearADosDecimales(num: number): number {
  return Math.round(num * 100) / 100
}

/**
 * Calcula el total en m² (ancho × alto)
 */
export function calcularTotalM2(ancho: number, alto: number): number {
  return ancho * alto
}

/**
 * Calcula el total de una línea de producto
 * 
 * NOTA: Esta función mantiene EXACTAMENTE la misma lógica que existía antes.
 * La fórmula de IVA/IT NO se modifica (punto A1 explícitamente prohibido).
 * 
 * @param cantidad Cantidad del producto
 * @param totalM2 Total en metros cuadrados
 * @param precio Precio unitario
 * @param comision Porcentaje de comisión
 * @param conIVA Si el producto tiene IVA (13%)
 * @param conIT Si el producto tiene IT (3%)
 * @param esSoporte Si es un soporte (usa cantidad × precio sin totalM2)
 * @param udm Unidad de medida (m², unidad, unidades)
 * @returns Total calculado de la línea
 */
export function calcularTotal(
  cantidad: number,
  totalM2: number,
  precio: number,
  comision: number,
  conIVA: boolean,
  conIT: boolean,
  esSoporte: boolean = false,
  udm?: string
): number {
  // Para soportes: cantidad × precio (sin totalM2)
  // Para productos con unidad m²: cantidad × totalM2 × precio
  // Para productos con unidad "unidad" o "unidades": cantidad × precio (sin totalM2)
  let subtotal: number
  if (esSoporte) {
    subtotal = cantidad * precio
  } else {
    const udmLower = (udm || '').toLowerCase().trim()
    if (udmLower === 'unidad' || udmLower === 'unidades' || udmLower === 'unidade') {
      subtotal = cantidad * precio
    } else {
      // Para m²: cantidad × totalM2 × precio
      subtotal = cantidad * totalM2 * precio
    }
  }

  const comisionTotal = subtotal * (comision / 100)

  // Si no tiene IVA, descontar 13% (el total YA incluye IVA si está activo)
  // NOTA: Esta fórmula NO se modifica (punto A1 explícitamente prohibido)
  if (!conIVA) {
    subtotal = subtotal * (1 - 0.13)
  }

  // Si no tiene IT, descontar 3% (el total YA incluye IT si está activo)
  // NOTA: Esta fórmula NO se modifica (punto A1 explícitamente prohibido)
  if (!conIT) {
    subtotal = subtotal * (1 - 0.03)
  }

  // Redondear a 2 decimales antes de retornar
  return redondearADosDecimales(subtotal + comisionTotal)
}

/**
 * Calcula el precio ajustado según variantes de mano de obra
 * 
 * Mejoras respecto a la versión original:
 * - Muestra warning controlado si falla la obtención de precio variante
 * - Mantiene el mismo comportamiento final (retorna precio base en caso de error)
 * 
 * @param precioBase Precio base del producto
 * @param item Item del producto con información de receta
 * @param variantes Variantes seleccionadas (ej: { Color: "Blanco", Tamaño: "A4" })
 * @param sucursal Sucursal seleccionada en la cotización
 * @param onWarning Callback opcional para mostrar warnings (ej: toast.warning)
 * @returns Precio ajustado según variantes
 */
export async function calcularPrecioConVariantes(
  precioBase: number,
  item: any,
  variantes: Record<string, string>,
  sucursal?: string,
  onWarning?: (message: string) => void
): Promise<number> {
  // Si no hay variantes, retornar el precio base
  if (!variantes || Object.keys(variantes).length === 0) {
    return precioBase
  }

  // PRIMERO: Intentar obtener precio desde producto_variantes
  // Incluir la sucursal seleccionada en la cotización para buscar la variante correcta
  if (item.producto_id || item.id) {
    try {
      // Usar import estático en lugar de dinámico para evitar errores de chunk loading
      const precioVariante = await obtenerPrecioVariante(
        item.producto_id || item.id,
        variantes,
        precioBase,
        sucursal || undefined // Pasar la sucursal seleccionada en la cotización
      )

      console.log(`💰 Precio obtenido para variante con sucursal ${sucursal}:`, precioVariante)

      // Si el precio variante es diferente al base, significa que se encontró una variante
      if (precioVariante !== precioBase) {
        return precioVariante
      }
      // Si es igual, continuar con el cálculo manual (puede que no exista la variante en BD)
    } catch (error) {
      // MEJORA A5: Mostrar warning controlado pero mantener comportamiento
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      console.warn('Error obteniendo precio variante, usando cálculo manual:', error)
      
      // Mostrar warning solo si se proporciona el callback
      if (onWarning) {
        onWarning(`No se pudo obtener el precio de variante para ${item.nombre || item.producto || 'el producto'}. Se usará el precio base.`)
      }
      
      // Continuar con cálculo manual (mantener comportamiento actual)
    }
  }

  // Si no hay receta, retornar el precio base
  if (!item.receta || !Array.isArray(item.receta) || item.receta.length === 0) {
    return precioBase
  }

  try {
    // Cargar recursos para obtener información de categoría
    const recursosRes = await fetch('/api/recursos')
    if (!recursosRes.ok) {
      // MEJORA A5: Mostrar warning si falla la carga de recursos
      if (onWarning) {
        onWarning('No se pudieron cargar los recursos. Se usará el precio base.')
      }
      return precioBase
    }
    const recursosData = await recursosRes.json()
    const recursos = recursosData.data || []

    // Crear un mapa de recursos por ID para acceso rápido
    const recursosMap = new Map(recursos.map((r: any) => [r.id, r]))

    let precioAjustado = precioBase
    let precioManoObraTotal = 0

    // Recorrer la receta para encontrar recursos de mano de obra
    for (const itemReceta of item.receta) {
      const recursoId = itemReceta.recurso_id || itemReceta.recursoId
      if (!recursoId) continue

      const recurso = recursosMap.get(recursoId)
      if (!recurso) continue

      // Verificar si el recurso es de categoría "Mano de Obra"
      const categoria = (recurso.categoria || '').toLowerCase().trim()
      if (categoria !== 'mano de obra') {
        continue
      }

      // Buscar si hay una variante que corresponda a este recurso
      // Las variantes pueden tener el nombre del recurso o un nombre relacionado
      const nombreRecurso = (recurso.nombre || '').toLowerCase()
      const codigoRecurso = (recurso.codigo || '').toLowerCase()

      // Buscar variante que coincida con el nombre o código del recurso
      let varianteEncontrada: { nombre: string; valor: string } | null = null
      for (const [nombreVariante, valorVariante] of Object.entries(variantes)) {
        const nombreVarianteLower = nombreVariante.toLowerCase()
        // Verificar si el nombre de la variante contiene el nombre del recurso o viceversa
        if (nombreVarianteLower.includes(nombreRecurso) ||
          nombreRecurso.includes(nombreVarianteLower) ||
          nombreVarianteLower.includes(codigoRecurso) ||
          codigoRecurso.includes(nombreVarianteLower)) {
          varianteEncontrada = { nombre: nombreVariante, valor: valorVariante as string }
          break
        }
      }

      // Si no se encontró variante por nombre, intentar buscar por el nombre del recurso en la receta
      if (!varianteEncontrada && itemReceta.recurso_nombre) {
        const recursoNombreReceta = (itemReceta.recurso_nombre || '').toLowerCase()
        for (const [nombreVariante, valorVariante] of Object.entries(variantes)) {
          const nombreVarianteLower = nombreVariante.toLowerCase()
          if (nombreVarianteLower.includes(recursoNombreReceta) ||
            recursoNombreReceta.includes(nombreVarianteLower)) {
            varianteEncontrada = { nombre: nombreVariante, valor: valorVariante as string }
            break
          }
        }
      }

      // Si se encontró una variante y su valor es "no", restar el precio del recurso
      if (varianteEncontrada) {
        const valorVariante = varianteEncontrada.valor.toLowerCase().trim()
        if (valorVariante === 'no') {
          // Calcular el precio del recurso (cantidad * coste)
          const cantidadReceta = parseFloat(itemReceta.cantidad) || 0
          const costeRecurso = parseFloat(recurso.coste) || 0
          const precioRecurso = cantidadReceta * costeRecurso
          precioManoObraTotal += precioRecurso
        }
      }
    }

    // Restar el total de manos de obra con valor "no" del precio base
    precioAjustado = precioBase - precioManoObraTotal

    // Asegurar que el precio no sea negativo
    return Math.max(0, precioAjustado)
  } catch (error) {
    // MEJORA A5: Mostrar warning controlado pero mantener comportamiento
    console.error('Error calculando precio con variantes:', error)
    
    if (onWarning) {
      onWarning(`Error al calcular precio con variantes. Se usará el precio base.`)
    }
    
    return precioBase
  }
}



