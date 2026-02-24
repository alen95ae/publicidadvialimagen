export const runtime = "nodejs";

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer, getSupabaseAdmin } from '@/lib/supabaseServer'
import { calcularCosteVariante } from '@/lib/variantes/calcularCosteVariante'
import { calcularPrecioVariante } from '@/lib/variantes/calcularPrecioVariante'
import { syncProductVariants } from '@/lib/variantes/variantSync'
import { recalcularYPersistirVariantes } from '@/lib/calcularVarianteFinanciera'

const supabase = getSupabaseServer()
const supabaseAdmin = getSupabaseAdmin()

/**
 * GET - Obtener variantes de un producto
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productoId = searchParams.get('producto_id')

    if (!productoId) {
      return NextResponse.json(
        { error: 'producto_id es requerido' },
        { status: 400 }
      )
    }

    // Obtener variantes de la base de datos
    const { data: variantes, error } = await supabase
      .from('producto_variantes')
      .select('*')
      .eq('producto_id', productoId)
      .order('combinacion', { ascending: true })

    if (error) {
      console.error('❌ Error obteniendo variantes:', error)
      return NextResponse.json(
        { error: 'Error al obtener variantes' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      variantes: variantes || []
    })
  } catch (error) {
    console.error('Error en GET /api/productos/variantes:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST - Guardar/actualizar overrides de una variante
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      variante_id,
      producto_id,
      coste_override,
      precio_override,
      margen_override,
      precio_variante,
      dif_precio
    } = body

    if (!variante_id || !producto_id) {
      return NextResponse.json(
        { error: 'variante_id y producto_id son requeridos' },
        { status: 400 }
      )
    }

    // Actualizar la variante
    const updateData: any = {
      fecha_actualizacion: new Date().toISOString()
    }

    if (coste_override !== undefined) {
      updateData.coste_override = coste_override === null || coste_override === '' ? null : Number(coste_override)
    }
    if (precio_override !== undefined) {
      updateData.precio_override = precio_override === null || precio_override === '' ? null : Number(precio_override)
    }
    if (margen_override !== undefined) {
      updateData.margen_override = margen_override === null || margen_override === '' ? null : Number(margen_override)
    }
    if (precio_variante !== undefined) {
      updateData.precio_variante = precio_variante === null || precio_variante === ''
        ? null
        : precio_variante
    }
    if (dif_precio !== undefined) {
      updateData.dif_precio = dif_precio === null || dif_precio === '' ? null : Number(dif_precio)
    }

    console.log('📤 Actualizando variante:', { variante_id, updateData })

    const { data, error } = await supabase
      .from('producto_variantes')
      .update(updateData)
      .eq('id', variante_id)
      .eq('producto_id', producto_id)
      .select()
      .single()

    if (error) {
      console.error('❌ Error actualizando variante:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Error al actualizar variante',
          details: error.message
        },
        { status: 500 }
      )
    }

    // Recalcular campos financieros de TODAS las variantes del producto
    const { data: prod } = await supabase
      .from('productos')
      .select('coste, precio_venta')
      .eq('id', producto_id)
      .single()

    if (prod) {
      await recalcularYPersistirVariantes(producto_id, prod, supabaseAdmin)
    }

    // Devolver variante actualizada con campos financieros
    const { data: varianteActualizada } = await supabase
      .from('producto_variantes')
      .select('*')
      .eq('id', variante_id)
      .single()

    return NextResponse.json({
      success: true,
      variante: varianteActualizada || data
    })
  } catch (error) {
    console.error('Error en POST /api/productos/variantes:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * PUT - Recalcular o regenerar variantes
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { producto_id, action } = body

    if (!producto_id) {
      return NextResponse.json(
        { error: 'producto_id es requerido' },
        { status: 400 }
      )
    }

    // Cargar producto para campos financieros
    const { data: prod } = await supabase
      .from('productos')
      .select('coste, precio_venta')
      .eq('id', producto_id)
      .single()

    if (action === 'recalcular') {
      // Recalcular costes y precios de todas las variantes existentes
      const response = await recalcularVariantes(producto_id)

      // Persistir campos financieros
      if (prod) {
        await recalcularYPersistirVariantes(producto_id, prod, supabaseAdmin)
      }

      return response
    } else if (action === 'regenerar' || action === 'sync') {
      try {
        await syncProductVariants(producto_id)

        // Persistir campos financieros tras la sincronización
        if (prod) {
          await recalcularYPersistirVariantes(producto_id, prod, supabaseAdmin)
        }

        const { data: variantes } = await supabase
          .from('producto_variantes')
          .select('*')
          .eq('producto_id', producto_id)
          .order('combinacion', { ascending: true })

        return NextResponse.json({
          success: true,
          variantes: variantes || [],
          mensaje: 'Variantes sincronizadas correctamente'
        })
      } catch (e: any) {
        console.error('❌ Error en syncProductVariants:', e)
        return NextResponse.json(
          { error: e.message || 'Error al sincronizar variantes' },
          { status: 500 }
        )
      }
    } else {
      return NextResponse.json(
        { error: 'action debe ser "recalcular", "regenerar" o "sync"' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('❌ Error en PUT /api/productos/variantes:', error)
    return NextResponse.json(
      { error: error?.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * Recalcular costes y precios de todas las variantes existentes (Legacy support)
 * TODO: Considerar mover esto también a variantSync o usar computeVariantCost
 */
async function recalcularVariantes(productoId: string) {
  try {
    const { data: producto } = await supabase
      .from('productos')
      .select('*')
      .eq('id', productoId)
      .single()

    if (!producto) throw new Error('Producto no encontrado')

    const { data: variantes } = await supabase
      .from('producto_variantes')
      .select('*')
      .eq('producto_id', productoId)

    const { data: recursos } = await supabase
      .from('recursos')
      .select('*')

    const receta = producto.receta || []
    const rawCalc = producto.calculadora_precios || producto.calculadora_de_precios
    const calculadora = typeof rawCalc === "string" ? JSON.parse(rawCalc) : rawCalc

    const variantesActualizadas = await Promise.all(
      (variantes || []).map(async (variante) => {
        // Parsear combinación (Legacy format support)
        const combinacionObj: Record<string, string> = {}
        const partes = variante.combinacion.split('|')
        partes.forEach((parte: string) => {
          // Soporta tanto "Key:Val" como "key=val"
          let nombre, valor
          if (parte.includes('=')) {
            [nombre, valor] = parte.split('=')
          } else {
            [nombre, valor] = parte.split(':')
          }

          if (nombre && valor) {
            combinacionObj[nombre.trim()] = valor.trim()
          }
        })

        // Calcular coste usando la función legacy (o actualizarla a usar variantEngine)
        // Por ahora mantenemos la importación legacy para no romper este flujo específico
        // pero idealmente debería usar variantEngine.computeVariantCost
        const costeCalculado = calcularCosteVariante(
          receta,
          recursos || [],
          combinacionObj
        )

        const precioCalculado = calcularPrecioVariante(
          costeCalculado,
          calculadora
        )

        await supabase
          .from('producto_variantes')
          .update({
            coste_calculado: costeCalculado,
            precio_calculado: precioCalculado,
            fecha_actualizacion: new Date().toISOString()
          })
          .eq('id', variante.id)

        return {
          ...variante,
          coste_calculado: costeCalculado,
          precio_calculado: precioCalculado
        }
      })
    )

    return NextResponse.json({
      success: true,
      variantes: variantesActualizadas
    })
  } catch (error) {
    console.error('Error recalculando variantes:', error)
    return NextResponse.json(
      { error: 'Error al recalcular variantes' },
      { status: 500 }
    )
  }
}
