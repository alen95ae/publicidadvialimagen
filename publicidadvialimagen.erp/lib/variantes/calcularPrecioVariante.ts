/**
 * Función para calcular el precio de venta de un producto según una combinación de variantes
 * Aplica el mismo markup que la calculadora base del producto
 */

export interface PriceRow {
  id: number
  campo: string
  porcentaje: number
  valor: number
}

export interface CalculadoraPrecios {
  priceRows: PriceRow[]
  totalPrice: number
  utilidadReal?: number
  objetivoUtilidadReal?: number
}

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

  const rows = [...calculadora.priceRows]
  const costeRow = rows.find(r => r.campo === "Coste")
  
  if (costeRow) {
    costeRow.valor = coste
  } else {
    // Si no existe fila de coste, agregarla
    rows.unshift({ id: 0, campo: "Coste", porcentaje: 0, valor: coste })
  }

  // Recalcular filas dependientes
  const utilidad = rows.find(r => r.campo === "Utilidad (U)")
  const adicionales = rows
    .filter(r => !["Coste", "Utilidad (U)", "Factura (F)", "Comisión (C)"].includes(r.campo))
    .reduce((sum, r) => sum + (Number(r.valor) || 0), 0)
  
  const base = coste + (utilidad ? Number(utilidad.valor) || 0 : 0) + adicionales

  // Calcular comisión sobre base
  const comision = rows.find(r => r.campo === "Comisión (C)")
  if (comision) {
    const pct = Number(comision.porcentaje) || 8
    comision.valor = Math.round(base * (pct / 100) * 100) / 100
  }

  // Calcular factura sobre base + comisión
  const factura = rows.find(r => r.campo === "Factura (F)")
  if (factura) {
    const pct = Number(factura.porcentaje) || 16
    const baseConComision = base + (comision ? Number(comision.valor) || 0 : 0)
    factura.valor = Math.round(baseConComision * (pct / 100) * 100) / 100
  }

  // Calcular total
  const total = rows.reduce((sum, r) => sum + (Number(r.valor) || 0), 0)

  return Math.round(total * 100) / 100
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

