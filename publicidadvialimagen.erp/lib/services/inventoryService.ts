/**
 * Servicio centralizado para gestión de inventario
 * Maneja descuentos de stock en ventas, cotizaciones y órdenes de trabajo
 */

import { getSupabaseServer } from '@/lib/supabaseServer'
import { generarClaveVariante } from '@/lib/variantes/generarCombinaciones'

const supabase = getSupabaseServer()

export interface DescontarStockParams {
  productoId: string
  cantidad: number
  sucursal: string
  variantes?: Record<string, string>
}

export interface RegistrarMovimientoParams {
  tipo: 'venta' | 'cotizacion' | 'orden_trabajo'
  productoId?: string
  recursoId?: string
  variante?: Record<string, string>
  delta: number // Cantidad a descontar (negativo) o agregar (positivo)
  sucursal: string
  referencia?: string // ID de venta, cotización u OT
}

/**
 * Descuenta stock de un producto (si tiene receta, descuenta recursos)
 */
export async function descontarStockProducto(params: DescontarStockParams): Promise<void> {
  const { productoId, cantidad, sucursal, variantes = {} } = params

  try {
    // Obtener producto con receta
    const { data: producto, error: productoError } = await supabase
      .from('productos')
      .select('id, nombre, receta')
      .eq('id', productoId)
      .single()

    if (productoError || !producto) {
      console.error('❌ Error obteniendo producto:', productoError)
      throw new Error(`Producto no encontrado: ${productoId}`)
    }

    // Si tiene receta, descontar recursos
    if (producto.receta && Array.isArray(producto.receta) && producto.receta.length > 0) {
      await descontarStockPorReceta({
        productoId,
        cantidad,
        sucursal,
        variantes
      })
    } else {
      // Si no tiene receta, solo registrar movimiento (no hay stock directo de productos)
      await registrarMovimiento({
        tipo: 'cotizacion', // Se actualizará según el contexto
        productoId,
        variante: variantes,
        delta: -cantidad,
        sucursal,
        referencia: productoId
      })
    }
  } catch (error) {
    console.error('❌ Error descontando stock de producto:', error)
    throw error
  }
}

/**
 * Descuenta stock de recursos según la receta del producto
 */
export async function descontarStockPorReceta(params: DescontarStockParams): Promise<void> {
  const { productoId, cantidad, sucursal, variantes = {} } = params

  try {
    // Obtener producto con receta
    const { data: producto, error: productoError } = await supabase
      .from('productos')
      .select('id, nombre, receta')
      .eq('id', productoId)
      .single()

    if (productoError || !producto) {
      console.error('❌ Error obteniendo producto:', productoError)
      throw new Error(`Producto no encontrado: ${productoId}`)
    }

    const receta = producto.receta || []
    if (!Array.isArray(receta) || receta.length === 0) {
      console.log('⚠️ Producto sin receta, no se descuenta stock')
      return
    }

    // Obtener todos los recursos
    const { data: recursos, error: recursosError } = await supabase
      .from('recursos')
      .select('id, nombre, control_stock')

    if (recursosError || !recursos) {
      console.error('❌ Error obteniendo recursos:', recursosError)
      throw new Error('Error obteniendo recursos')
    }

    // Procesar cada item de la receta
    for (const item of receta) {
      const recurso = recursos.find(
        r => r.id === item.recurso_id ||
        r.codigo === item.recurso_codigo ||
        r.nombre === item.recurso_nombre
      )

      if (!recurso) {
        console.warn(`⚠️ Recurso no encontrado: ${item.recurso_id || item.recurso_nombre}`)
        continue
      }

      const cantidadItem = (Number(item.cantidad) || 1) * cantidad
      const cantidadDescontar = Math.max(cantidadItem, 0)

      // Descontar stock del recurso
      await descontarStockRecurso({
        recursoId: recurso.id,
        cantidad: cantidadDescontar,
        sucursal,
        variantes
      })

      // Registrar movimiento
      await registrarMovimiento({
        tipo: 'cotizacion', // Se actualizará según el contexto
        recursoId: recurso.id,
        variante: variantes,
        delta: -cantidadDescontar,
        sucursal,
        referencia: productoId
      })
    }
  } catch (error) {
    console.error('❌ Error descontando stock por receta:', error)
    throw error
  }
}

/**
 * Descuenta stock de un recurso específico
 */
async function descontarStockRecurso(params: {
  recursoId: string
  cantidad: number
  sucursal: string
  variantes?: Record<string, string>
}): Promise<void> {
  const { recursoId, cantidad, sucursal, variantes = {} } = params

  try {
    // Obtener recurso actual
    const { data: recurso, error: recursoError } = await supabase
      .from('recursos')
      .select('id, nombre, control_stock')
      .eq('id', recursoId)
      .single()

    if (recursoError || !recurso) {
      console.error('❌ Error obteniendo recurso:', recursoError)
      throw new Error(`Recurso no encontrado: ${recursoId}`)
    }

    // Parsear control_stock
    let controlStock: any = {}
    if (recurso.control_stock) {
      if (typeof recurso.control_stock === 'string') {
        controlStock = JSON.parse(recurso.control_stock)
      } else {
        controlStock = recurso.control_stock
      }
    }

    // Generar clave de variante con sucursal
    const combinacionConSucursal = { ...variantes, Sucursal: sucursal }
    const claveVariante = generarClaveVariante(combinacionConSucursal)

    // Obtener stock actual
    const datosVariante = controlStock[claveVariante] || {}
    const stockActual = Number(datosVariante.stock) || 0

    // Calcular nuevo stock (evitar negativo)
    const nuevoStock = Math.max(stockActual - cantidad, 0)

    // Actualizar control_stock
    controlStock[claveVariante] = {
      ...datosVariante,
      stock: nuevoStock
    }

    // Guardar en Supabase
    const { error: updateError } = await supabase
      .from('recursos')
      .update({ control_stock: controlStock })
      .eq('id', recursoId)

    if (updateError) {
      console.error('❌ Error actualizando stock:', updateError)
      throw new Error(`Error actualizando stock: ${updateError.message}`)
    }

    console.log(`✅ Stock actualizado: ${recurso.nombre} (${claveVariante}): ${stockActual} → ${nuevoStock}`)
  } catch (error) {
    console.error('❌ Error descontando stock de recurso:', error)
    throw error
  }
}

/**
 * Registra un movimiento de inventario (log)
 * Por ahora solo loguea, puede extenderse para guardar en tabla de movimientos
 */
export async function registrarMovimiento(params: RegistrarMovimientoParams): Promise<void> {
  const { tipo, productoId, recursoId, variante, delta, sucursal, referencia } = params

  try {
    const movimiento = {
      tipo,
      productoId: productoId || null,
      recursoId: recursoId || null,
      variante: variante || null,
      delta,
      sucursal,
      referencia: referencia || null,
      fecha: new Date().toISOString()
    }

    console.log('📝 Movimiento de inventario:', JSON.stringify(movimiento, null, 2))

    // TODO: Guardar en tabla de movimientos si existe
    // Por ahora solo logueamos
  } catch (error) {
    console.error('❌ Error registrando movimiento:', error)
    // No lanzar error, solo loguear
  }
}





