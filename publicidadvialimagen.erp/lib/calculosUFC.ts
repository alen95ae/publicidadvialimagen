/**
 * Cálculo de utilidad neta UFC (Calculadora de Precios).
 * Misma lógica que la UI: Factura, IUE, Comisión sobre el precio.
 * Usar en Variantes del Producto y en el endpoint alertas-variantes.
 */

import type { PriceRow } from '@/lib/types/inventario'

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

function parseNum(v: number | string | null | undefined): number {
  if (typeof v === 'number' && !Number.isNaN(v)) return v
  const s = (v ?? '').toString().replace(',', '.').replace(/^0+(?=\d)/, '')
  const n = parseFloat(s)
  return Number.isFinite(n) ? n : 0
}

export interface CalcularUtilidadNetaParams {
  precio: number
  coste: number
  configuracion: PriceRow[]
}

export interface CalcularUtilidadNetaResult {
  valor: number
  porcentaje: number
}

/**
 * Calcula la utilidad neta con la lógica completa de la Calculadora de Precios (UFC):
 * Factura e IUE sobre el precio, costos totales = coste + factura + iue,
 * utilidad bruta = precio - costos totales, comisión sobre utilidad bruta,
 * utilidad neta = utilidad bruta - comisión.
 * Devuelve el mismo porcentaje que muestra la UI en Variantes del Producto.
 */
export function calcularUtilidadNeta({
  precio,
  coste,
  configuracion
}: CalcularUtilidadNetaParams): CalcularUtilidadNetaResult {
  const facturaRow = configuracion.find((r) => r.campo === 'Factura')
  const iueRow = configuracion.find((r) => r.campo === 'IUE')
  const comisionRow = configuracion.find((r) => r.campo === 'Comision')

  const facturaPctConfig = parseNum(facturaRow?.porcentajeConfig ?? facturaRow?.porcentaje ?? 16)
  const iuePctConfig = parseNum(iueRow?.porcentajeConfig ?? iueRow?.porcentaje ?? 2)
  const comPctConfig = parseNum(comisionRow?.porcentajeConfig ?? comisionRow?.porcentaje ?? 12)

  const facturaPct = facturaPctConfig / 100
  const iuePct = iuePctConfig / 100

  const facturaVal = round2(precio * facturaPct)
  const iueVal = round2(precio * iuePct)

  const costosTotales = round2(coste + facturaVal + iueVal)
  const utilidadBruta = round2(precio - costosTotales)
  const comPct = comPctConfig / 100
  const comisionVal = round2(utilidadBruta * comPct)
  const utilidadNeta = round2(utilidadBruta - comisionVal)

  const utilidadNetaPct = precio > 0 ? round2((utilidadNeta / precio) * 100) : 0

  return { valor: utilidadNeta, porcentaje: utilidadNetaPct }
}
