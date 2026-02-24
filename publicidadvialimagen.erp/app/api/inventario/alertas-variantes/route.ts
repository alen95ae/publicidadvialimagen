/**
 * GET ?ids=id1,id2
 * Devuelve { [productoId]: true } para productos cuyas variantes
 * tienen utilidad_neta_calculada < 10 (valor persistido en BD).
 * Sin cálculo dinámico — solo lectura.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabaseServer'

const supabase = getSupabaseServer()

const UMBRAL_UTILIDAD = 10

export async function GET(request: NextRequest) {
  try {
    const idsParam = request.nextUrl.searchParams.get('ids') || ''
    const ids = idsParam.split(',').map((id) => id.trim()).filter(Boolean)
    if (ids.length === 0) {
      return NextResponse.json({})
    }

    const { data: filas, error } = await supabase
      .from('producto_variantes')
      .select('producto_id')
      .in('producto_id', ids)
      .lt('utilidad_neta_calculada', UMBRAL_UTILIDAD)

    if (error) {
      console.error('[ALERTAS] Error query:', error.message)
      return NextResponse.json({})
    }

    const alertas: Record<string, boolean> = {}
    for (const f of filas || []) {
      alertas[f.producto_id] = true
    }

    return NextResponse.json(alertas)
  } catch (e) {
    console.error('Error alertas-variantes:', e)
    return NextResponse.json({})
  }
}
