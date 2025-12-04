/**
 * Motor de cálculo unificado para precios UFC
 * 
 * Centraliza toda la lógica de cálculo de precios para garantizar
 * consistencia entre frontend, backend y APIs.
 * 
 * Funciones puras, sin dependencias de React.
 */

import { PriceRow, ComponentesUFC } from '@/lib/types/inventario'

/**
 * Redondea a 2 decimales
 */
const round2 = (n: number): number => {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

/**
 * Parsea un valor numérico de forma segura
 */
const parseNum = (v: number | string | null | undefined): number => {
  if (typeof v === "number") return isFinite(v) ? v : 0
  if (v === null || v === undefined || v === "") return 0
  const s = v.toString().replace(",", ".").replace(/^0+(?=\d)/, "")
  const n = parseFloat(s)
  return isFinite(n) ? n : 0
}

/**
 * Obtiene el porcentaje configurado de una fila (prioriza porcentajeConfig)
 */
const getPorcentaje = (row: PriceRow | undefined, defaultPct: number): number => {
  if (!row) return defaultPct
  const pct = row.porcentajeConfig != null 
    ? parseNum(row.porcentajeConfig) 
    : parseNum(row.porcentaje)
  return pct > 0 ? pct : defaultPct
}

/**
 * Encuentra una fila por campo (con variaciones de nombre)
 */
const findRow = (rows: PriceRow[], campos: string[]): PriceRow | undefined => {
  return rows.find(r => campos.includes(r.campo))
}

/**
 * Calcula los componentes de UFC desde un coste base
 * 
 * @param coste Coste base del producto
 * @param priceRows Filas de la calculadora (opcional, usa defaults si no se proporciona)
 * @returns Componentes calculados
 */
export function calcularComponentesUFC(
  coste: number,
  priceRows?: PriceRow[]
): ComponentesUFC {
  const costeNum = parseNum(coste)
  
  // Si no hay priceRows, usar valores por defecto
  if (!priceRows || priceRows.length === 0) {
    const facturaPct = 16 / 100
    const iuePct = 2 / 100
    const comPct = 12 / 100
    
    const factura = round2(costeNum * facturaPct)
    const iue = round2(costeNum * iuePct)
    const costosTotales = round2(costeNum + factura + iue)
    
    // Utilidad bruta estimada (30% del coste)
    const utilidadBruta = round2(costeNum * 0.3)
    const comision = round2(utilidadBruta * comPct)
    const utilidadNeta = round2(utilidadBruta - comision)
    
    return {
      factura,
      iue,
      comision,
      utilidadNeta,
      costosTotales,
      utilidadBruta
    }
  }
  
  // Filtrar fila "Precio" (no se usa en cálculos)
  const rowsFiltered = priceRows.filter(r => r.campo !== "Precio")
  
  // Encontrar filas con nombres flexibles
  const facturaRow = findRow(rowsFiltered, ["Fact", "Factura", "Factura (F)"])
  const iueRow = findRow(rowsFiltered, ["IUE"])
  const comRow = findRow(rowsFiltered, ["Comision", "Comisión", "Comisión (C)"])
  const utilidadNetaRow = findRow(rowsFiltered, ["Utilidad neta", "Utilidad Neta"])
  
  // Obtener porcentajes
  const facturaPct = getPorcentaje(facturaRow, 16) / 100
  const iuePct = getPorcentaje(iueRow, 2) / 100
  const comPct = getPorcentaje(comRow, 12) / 100
  
  // Calcular factura e IUE sobre coste base
  const factura = round2(costeNum * facturaPct)
  const iue = round2(costeNum * iuePct)
  
  // Calcular utilidad neta y comisión
  const utilidadNeta = parseNum(utilidadNetaRow?.valor) || 0
  let utilidadBruta = 0
  let comision = 0
  
  if (utilidadNeta > 0 && comPct > 0) {
    // Si hay utilidad neta guardada, calcular utilidad bruta desde ahí
    // utilidadNeta = utilidadBruta - comision
    // comision = utilidadBruta * comPct
    // utilidadNeta = utilidadBruta * (1 - comPct)
    // utilidadBruta = utilidadNeta / (1 - comPct)
    utilidadBruta = round2(utilidadNeta / (1 - comPct))
    comision = round2(utilidadBruta * comPct)
  } else if (comRow?.valor) {
    // Si hay valor de comisión guardado, calcular utilidad bruta desde ahí
    comision = parseNum(comRow.valor)
    utilidadBruta = comPct > 0 ? round2(comision / comPct) : 0
  } else {
    // Fallback: calcular utilidad bruta como 30% del coste
    utilidadBruta = round2(costeNum * 0.3)
    comision = round2(utilidadBruta * comPct)
  }
  
  const costosTotales = round2(costeNum + factura + iue)
  
  return {
    factura,
    iue,
    comision,
    utilidadNeta,
    costosTotales,
    utilidadBruta
  }
}

/**
 * Calcula el precio UFC final desde un coste base
 * 
 * @param coste Coste base del producto
 * @param priceRows Filas de la calculadora (opcional)
 * @returns Precio final calculado
 */
export function calcularPrecioUFC(
  coste: number,
  priceRows?: PriceRow[]
): number {
  const componentes = calcularComponentesUFC(coste, priceRows)
  
  // Precio total según modelo UFC
  // Fórmula: coste + factura + iue + comision + utilidadNeta
  const precioCalculado = round2(
    coste +
    componentes.factura +
    componentes.iue +
    componentes.comision +
    componentes.utilidadNeta
  )
  
  return precioCalculado
}

/**
 * Calcula el precio base para una variante
 * 
 * @param params Parámetros de cálculo
 * @returns Precio calculado para la variante
 */
export function calcularPrecioVarianteBase(params: {
  coste: number
  priceRows?: PriceRow[]
}): number {
  return calcularPrecioUFC(params.coste, params.priceRows)
}

/**
 * Calcula componentes desde un precio objetivo (cálculo inverso)
 * 
 * @param precioObjetivo Precio objetivo del mercado
 * @param coste Coste base
 * @param priceRows Filas de la calculadora (opcional)
 * @returns Componentes calculados desde el precio objetivo
 */
export function calcularComponentesDesdePrecio(
  precioObjetivo: number,
  coste: number,
  priceRows?: PriceRow[]
): ComponentesUFC {
  const precioNum = parseNum(precioObjetivo)
  const costeNum = parseNum(coste)
  
  // Si no hay priceRows, usar valores por defecto
  if (!priceRows || priceRows.length === 0) {
    const facturaPct = 16 / 100
    const iuePct = 2 / 100
    const comPct = 12 / 100
    
    const factura = round2(precioNum * facturaPct)
    const iue = round2(precioNum * iuePct)
    const costosTotales = round2(costeNum + factura + iue)
    const utilidadBruta = round2(precioNum - costosTotales)
    const comision = round2(utilidadBruta * comPct)
    const utilidadNeta = round2(utilidadBruta - comision)
    
    return {
      factura,
      iue,
      comision,
      utilidadNeta,
      costosTotales,
      utilidadBruta
    }
  }
  
  // Filtrar fila "Precio"
  const rowsFiltered = priceRows.filter(r => r.campo !== "Precio")
  
  // Encontrar filas
  const facturaRow = findRow(rowsFiltered, ["Fact", "Factura", "Factura (F)"])
  const iueRow = findRow(rowsFiltered, ["IUE"])
  const comRow = findRow(rowsFiltered, ["Comision", "Comisión", "Comisión (C)"])
  
  // Obtener porcentajes configurables
  const facturaPct = getPorcentaje(facturaRow, 16) / 100
  const iuePct = getPorcentaje(iueRow, 2) / 100
  const comPct = getPorcentaje(comRow, 12) / 100
  
  // Calcular factura e IUE sobre precio objetivo
  const factura = round2(precioNum * facturaPct)
  const iue = round2(precioNum * iuePct)
  
  // Calcular costos totales y utilidad bruta
  const costosTotales = round2(costeNum + factura + iue)
  const utilidadBruta = round2(precioNum - costosTotales)
  
  // Calcular comisión y utilidad neta
  const comision = round2(utilidadBruta * comPct)
  const utilidadNeta = round2(utilidadBruta - comision)
  
  return {
    factura,
    iue,
    comision,
    utilidadNeta,
    costosTotales,
    utilidadBruta
  }
}


