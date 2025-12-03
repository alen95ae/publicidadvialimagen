/**
 * Tipos seguros para el módulo de inventario
 * Elimina el uso excesivo de 'any' en cálculos críticos
 */

/**
 * Fila de la calculadora de precios UFC
 */
export interface PriceRow {
  id: number
  campo: string
  porcentaje: number | null | ""
  porcentajeConfig?: number | null
  valor: number | ""
  editable?: boolean
}

/**
 * Estructura de control_stock para recursos
 * Mapea sucursales a datos de precio y stock
 */
export interface RecursoControlStock {
  [sucursal: string]: {
    precio: number
    stock: number
    unidad?: string
    precioVariante?: number
    diferenciaPrecio?: number
  }
}

/**
 * Recurso con variantes y control de stock
 */
export interface RecursoConVariantes {
  id: string
  nombre: string
  codigo: string
  coste: number
  unidad_medida: string
  variantes?: any[]
  control_stock?: RecursoControlStock | string
}

/**
 * Producto base (compatible con Supabase)
 */
export interface Producto {
  id: string
  nombre: string
  codigo: string
  coste: number
  precio_venta: number
  calculadora_precios?: any // Compatibilidad con formato antiguo
  calculadora_de_precios?: any // Compatibilidad con formato nuevo
  receta?: any[]
  variantes?: any[]
}

/**
 * Calculadora de precios completa
 */
export interface CalculadoraPrecios {
  priceRows: PriceRow[]
  totalPrice?: number
  utilidadReal?: number
  objetivoUtilidadReal?: number | null
}

/**
 * Calculadora de costes (receta)
 */
export interface CalculadoraCostes {
  costRows: Array<{
    id: number
    selectedRecurso: RecursoConVariantes | null
    cantidad: number
    unidad: string
    searchTerm: string
  }>
}

/**
 * Componentes calculados de UFC
 */
export interface ComponentesUFC {
  factura: number
  iue: number
  comision: number
  utilidadNeta: number
  costosTotales: number
  utilidadBruta: number
}

