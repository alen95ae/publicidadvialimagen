/**
 * POST /api/admin/recalcular-variantes-financieras
 *
 * Endpoint administrativo. Usa service role (bypass RLS).
 * Recalcula y persiste campos financieros de TODAS las variantes.
 */

import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseServer'
import { calcularFinanzasVariante, type ProductoInput } from '@/lib/calcularVarianteFinanciera'

export async function POST() {
  console.log('USANDO SERVICE ROLE:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)

  const supabase = getSupabaseAdmin()
  const errores: string[] = []
  let productosProcesados = 0
  let variantesProcesadas = 0
  let variantesActualizadas = 0
  let filasAfectadasReales = 0

  try {
    // 1) Obtener todos los producto_id distintos que tienen variantes
    const { data: rows, error: idsError } = await supabase
      .from('producto_variantes')
      .select('producto_id')

    if (idsError) {
      console.error('[ADMIN] Error obteniendo producto_ids:', idsError.message)
      return NextResponse.json({ error: idsError.message }, { status: 500 })
    }

    const productoIds = [...new Set((rows || []).map((r: any) => r.producto_id))]
    console.log(`[ADMIN] Productos con variantes: ${productoIds.length}`)

    if (productoIds.length === 0) {
      return NextResponse.json({ productosProcesados: 0, variantesProcesadas: 0, variantesActualizadas: 0, filasAfectadasReales: 0 })
    }

    // 2) Cargar todos los productos
    const { data: productos, error: prodError } = await supabase
      .from('productos')
      .select('id, coste, precio_venta')
      .in('id', productoIds)

    if (prodError || !productos) {
      console.error('[ADMIN] Error cargando productos:', prodError?.message)
      return NextResponse.json({ error: prodError?.message || 'Sin productos' }, { status: 500 })
    }

    const productoMap = new Map<string, ProductoInput>()
    for (const p of productos) {
      productoMap.set(p.id, {
        coste: Number(p.coste) || 0,
        precio_venta: Number(p.precio_venta) || 0,
      })
    }

    // 3) Cargar TODAS las variantes
    const { data: variantes, error: varError } = await supabase
      .from('producto_variantes')
      .select('id, producto_id, coste_override, coste_calculado, precio_override, precio_calculado')

    if (varError || !variantes) {
      console.error('[ADMIN] Error cargando variantes:', varError?.message)
      return NextResponse.json({ error: varError?.message || 'Sin variantes' }, { status: 500 })
    }

    console.log(`[ADMIN] Total variantes cargadas: ${variantes.length}`)

    // Agrupar variantes por producto_id
    const variantesPorProducto = new Map<string, any[]>()
    for (const v of variantes) {
      const list = variantesPorProducto.get(v.producto_id) || []
      list.push(v)
      variantesPorProducto.set(v.producto_id, list)
    }

    // 4) Recalcular y persistir producto por producto
    for (const productoId of productoIds) {
      const producto = productoMap.get(productoId)
      if (!producto) {
        errores.push(`Producto ${productoId} no encontrado en tabla productos`)
        continue
      }

      const vars = variantesPorProducto.get(productoId) || []
      if (vars.length === 0) continue

      for (const v of vars) {
        variantesProcesadas++
        const finanzas = calcularFinanzasVariante(v, producto)

        const { data, error } = await supabase
          .from('producto_variantes')
          .update({
            coste_final_usado: finanzas.coste_final_usado,
            precio_final_usado: finanzas.precio_final_usado,
            utilidad_neta_calculada: finanzas.utilidad_neta_calculada,
            margen_bruto_calculado: finanzas.margen_bruto_calculado,
            updated_at_calculo: new Date().toISOString(),
          })
          .eq('id', v.id)
          .select('id')

        if (error) {
          console.error(`[ADMIN] ERROR UPDATE variante ${v.id}:`, error.message)
          errores.push(`UPDATE ${v.id}: ${error.message}`)
        } else if (!data || data.length === 0) {
          console.error(`[ADMIN] RLS BLOQUEÓ UPDATE variante ${v.id}`)
          errores.push(`RLS BLOQUEÓ ${v.id}`)
        } else {
          variantesActualizadas++
          filasAfectadasReales += data.length
        }
      }

      productosProcesados++
      console.log(`[ADMIN] Producto ${productoId}: ${vars.length} variantes procesadas`)
    }

    console.log(`[ADMIN] FINALIZADO: ${productosProcesados} productos, ${variantesProcesadas} procesadas, ${variantesActualizadas} actualizadas, ${filasAfectadasReales} filas reales, ${errores.length} errores`)

    return NextResponse.json({
      productosProcesados,
      variantesProcesadas,
      variantesActualizadas,
      filasAfectadasReales,
      errores: errores.length > 0 ? errores : undefined,
    })
  } catch (e: any) {
    console.error('[ADMIN] Error fatal:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
