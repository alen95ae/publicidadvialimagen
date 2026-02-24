/**
 * Utilidades para historial de stock.
 * Filtro "última versión por cotización": deja solo los registros de la modificación más reciente de cada cotización.
 */

const COTIZACION_ORIGENES = [
  'cotizacion_aprobada',
  'cotizacion_rechazada',
  'cotizacion_editada',
  'cotizacion_eliminada'
] as const

function isOrigenCotizacion(origen: string): boolean {
  return (COTIZACION_ORIGENES as readonly string[]).includes(origen)
}

/**
 * Filtra el historial para conservar solo la última versión de cada cotización.
 *
 * 1) Ordena por fecha DESC.
 * 2) Agrupa por referencia_id solo para orígenes cotización (aprobada, editada, rechazada, eliminada).
 * 3) Para cada referencia_id: el primer registro (más reciente) es el último evento; se mantienen
 *    TODOS los registros consecutivos con mismo referencia_id y mismo origen hasta que cambie el origen.
 * 4) registro_manual se mantiene todo sin filtrar.
 */
export function filterUltimaVersionPorCotizacion(entries: any[]): any[] {
  if (!entries?.length) return entries

  const resto = entries.filter(
    (e) => !e.referencia_id || !isOrigenCotizacion(e.origen || '')
  )

  const conRefCotizacion = entries.filter(
    (e) => e.referencia_id && isOrigenCotizacion(e.origen || '')
  )

  const sorted = [...conRefCotizacion].sort((a, b) => {
    const fa = a.fecha || a.created_at || ''
    const fb = b.fecha || b.created_at || ''
    return fa > fb ? -1 : fa < fb ? 1 : 0
  })

  const lastEventOriginByRef = new Map<string, string>()
  const stillInLastEventBlock = new Map<string, boolean>()
  const cotizacionLast: any[] = []

  for (const e of sorted) {
    const ref = e.referencia_id
    const origen = e.origen || ''

    if (!lastEventOriginByRef.has(ref)) {
      lastEventOriginByRef.set(ref, origen)
      stillInLastEventBlock.set(ref, true)
      cotizacionLast.push(e)
      continue
    }

    if (stillInLastEventBlock.get(ref) && lastEventOriginByRef.get(ref) === origen) {
      cotizacionLast.push(e)
    } else if (lastEventOriginByRef.get(ref) !== origen) {
      stillInLastEventBlock.set(ref, false)
    }
  }

  const result = [...resto, ...cotizacionLast]
  result.sort((a, b) => {
    const fa = a.fecha || a.created_at || ''
    const fb = b.fecha || b.created_at || ''
    return fa > fb ? -1 : fa < fb ? 1 : 0
  })
  return result
}
