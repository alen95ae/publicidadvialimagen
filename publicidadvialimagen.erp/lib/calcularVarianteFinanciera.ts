/**
 * Helper único y determinista para calcular los campos financieros
 * de una variante de producto.
 *
 * Todas las escrituras en producto_variantes deben pasar por aquí
 * para garantizar coherencia entre backend, alertas y UI.
 */

export interface VarianteInput {
  coste_override?: number | null
  coste_calculado?: number | null
  precio_override?: number | null
  precio_calculado?: number | null
}

export interface ProductoInput {
  coste: number
  precio_venta: number
}

export interface FinanzasVariante {
  coste_final_usado: number
  precio_final_usado: number
  utilidad_neta_calculada: number
  margen_bruto_calculado: number
}

export function calcularFinanzasVariante(
  variante: VarianteInput,
  producto: ProductoInput
): FinanzasVariante {
  const costeBase = Number(producto.coste) || 0
  const precioBase = Number(producto.precio_venta) || 0

  // --- Coste final ---
  const costeRaw =
    variante.coste_override != null
      ? Number(variante.coste_override)
      : variante.coste_calculado != null
        ? Number(variante.coste_calculado)
        : costeBase

  const difCoste = Math.max(0, costeRaw - costeBase)
  const coste_final_usado = round2(costeBase + difCoste)

  // --- Precio final ---
  const precio_final_usado =
    variante.precio_override != null
      ? round2(Number(variante.precio_override))
      : variante.precio_calculado != null && Number(variante.precio_calculado) > 0
        ? round2(Number(variante.precio_calculado))
        : round2(precioBase)

  // --- Margen bruto ---
  const margen_bruto_calculado = round2(precio_final_usado - coste_final_usado)

  // --- Utilidad neta (% sobre precio) ---
  const utilidad_neta_calculada =
    precio_final_usado > 0
      ? round2((margen_bruto_calculado / precio_final_usado) * 100)
      : 0

  return {
    coste_final_usado,
    precio_final_usado,
    utilidad_neta_calculada,
    margen_bruto_calculado,
  }
}

/**
 * Recalcula los campos financieros de TODAS las variantes de un producto
 * y las persiste en producto_variantes.
 */
export async function recalcularYPersistirVariantes(
  productoId: string,
  producto: ProductoInput,
  supabase: any
): Promise<void> {
  const { data: variantes, error } = await supabase
    .from('producto_variantes')
    .select('id, coste_override, coste_calculado, precio_override, precio_calculado')
    .eq('producto_id', productoId)

  if (error || !variantes?.length) return

  const ops = variantes.map((v: any) => {
    const finanzas = calcularFinanzasVariante(v, producto)
    return supabase
      .from('producto_variantes')
      .update({
        ...finanzas,
        updated_at_calculo: new Date().toISOString(),
      })
      .eq('id', v.id)
  })

  await Promise.all(ops)
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}
