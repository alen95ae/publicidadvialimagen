/**
 * Adapter unificador para variantes de recursos y productos
 * 
 * Este adapter convierte los diferentes formatos de variantes a un formato unificado
 * para facilitar reportes, mantener consistencia y simplificar el control de stock.
 * 
 * NO modifica los modelos originales en Supabase, solo adapta la entrada.
 */

/**
 * Formato unificado de variante
 */
export interface VarianteUnificada {
  clave: string
  sucursal?: string
  precio: number
  precio_base?: number
  precio_calculado?: number
  stock?: number
  unidad?: string
  ajustes?: Record<string, any>
}

/**
 * Normaliza una variante de recurso (desde control_stock JSON) a formato unificado
 * 
 * @param recurso - Recurso con control_stock
 * @param sucursal - Sucursal específica a normalizar (opcional)
 * @returns Array de variantes unificadas
 */
export function normalizeRecursoVariant(
  recurso: any,
  sucursal?: string
): VarianteUnificada[] {
  if (!recurso || !recurso.control_stock) {
    return []
  }

  try {
    let controlStock: any = null
    if (typeof recurso.control_stock === 'string') {
      controlStock = JSON.parse(recurso.control_stock)
    } else {
      controlStock = recurso.control_stock
    }

    if (!controlStock || typeof controlStock !== 'object') {
      return []
    }

    const variantes: VarianteUnificada[] = []
    const claves = Object.keys(controlStock)

    // Si se especifica una sucursal, filtrar solo esa
    const clavesFiltradas = sucursal
      ? claves.filter(key => 
          key.includes(`Sucursal:${sucursal}`) || 
          key.includes(`Sucursal:${sucursal.toLowerCase()}`) ||
          key === sucursal ||
          key.toLowerCase().includes(sucursal.toLowerCase())
        )
      : claves

    clavesFiltradas.forEach(clave => {
      const datosVariante = controlStock[clave]
      if (!datosVariante || typeof datosVariante !== 'object') {
        return
      }

      // Extraer sucursal de la clave si está presente
      let sucursalExtraida: string | undefined
      if (clave.includes('Sucursal:')) {
        const match = clave.match(/Sucursal:([^|]+)/)
        if (match) {
          sucursalExtraida = match[1].trim()
        }
      } else if (claves.length === 1 && ['La Paz', 'Santa Cruz'].includes(clave)) {
        // Si la clave es directamente una sucursal
        sucursalExtraida = clave
      }

      // Obtener precio (priorizar precioVariante, luego precio, luego diferenciaPrecio)
      let precio = 0
      if (datosVariante.precioVariante !== undefined && datosVariante.precioVariante !== null) {
        precio = Number(datosVariante.precioVariante) || 0
      } else if (datosVariante.precio !== undefined && datosVariante.precio !== null) {
        precio = Number(datosVariante.precio) || 0
      } else if (datosVariante.diferenciaPrecio !== undefined && datosVariante.diferenciaPrecio !== null) {
        precio = (recurso.coste || 0) + Number(datosVariante.diferenciaPrecio)
      } else {
        precio = recurso.coste || 0
      }

      variantes.push({
        clave: clave,
        sucursal: sucursalExtraida || sucursal,
        precio: precio,
        precio_base: recurso.coste || 0,
        stock: datosVariante.stock !== undefined ? Number(datosVariante.stock) : undefined,
        unidad: datosVariante.unidad || recurso.unidad_medida || undefined,
        ajustes: {
          precioVariante: datosVariante.precioVariante,
          diferenciaPrecio: datosVariante.diferenciaPrecio,
          ...datosVariante
        }
      })
    })

    return variantes
  } catch (error) {
    console.error('Error normalizando variante de recurso:', error)
    return []
  }
}

/**
 * Normaliza una variante de producto (desde producto_variantes) a formato unificado
 * 
 * @param producto - Producto con variantes
 * @param variante - Variante específica del producto
 * @returns Variante unificada
 */
export function normalizeProductoVariant(
  producto: any,
  variante: any
): VarianteUnificada | null {
  if (!producto || !variante) {
    return null
  }

  try {
    // Extraer sucursal de la combinación si está presente
    let sucursal: string | undefined
    if (variante.combinacion && typeof variante.combinacion === 'string') {
      const match = variante.combinacion.match(/Sucursal:([^|]+)/)
      if (match) {
        sucursal = match[1].trim()
      }
    }

    // Obtener precio (priorizar precio_override, luego precio_calculado, luego precio_base)
    const precio = 
      (variante.precio_override !== null && variante.precio_override !== undefined)
        ? Number(variante.precio_override)
        : (variante.precio_calculado !== null && variante.precio_calculado !== undefined)
        ? Number(variante.precio_calculado)
        : (variante.precio_base !== null && variante.precio_base !== undefined)
        ? Number(variante.precio_base)
        : producto.precio_venta || 0

    // Obtener precio base
    const precio_base = 
      (variante.coste_override !== null && variante.coste_override !== undefined)
        ? Number(variante.coste_override)
        : (variante.coste_calculado !== null && variante.coste_calculado !== undefined)
        ? Number(variante.coste_calculado)
        : (variante.coste_base !== null && variante.coste_base !== undefined)
        ? Number(variante.coste_base)
        : producto.coste || 0

    return {
      clave: variante.combinacion || '',
      sucursal: sucursal,
      precio: precio,
      precio_base: precio_base,
      precio_calculado: variante.precio_calculado ? Number(variante.precio_calculado) : undefined,
      ajustes: {
        coste_override: variante.coste_override,
        precio_override: variante.precio_override,
        margen_override: variante.margen_override,
        coste_calculado: variante.coste_calculado,
        ...variante
      }
    }
  } catch (error) {
    console.error('Error normalizando variante de producto:', error)
    return null
  }
}

/**
 * Normaliza todas las variantes de un recurso
 */
export function normalizeAllRecursoVariants(recurso: any): VarianteUnificada[] {
  return normalizeRecursoVariant(recurso)
}

/**
 * Normaliza todas las variantes de un producto
 */
export function normalizeAllProductoVariants(
  producto: any,
  variantes: any[]
): VarianteUnificada[] {
  return variantes
    .map(variante => normalizeProductoVariant(producto, variante))
    .filter((v): v is VarianteUnificada => v !== null)
}
