/**
 * Servicio centralizado para gestión de inventario
 * Maneja descuentos de stock en ventas, cotizaciones y órdenes de trabajo
 */

import { getSupabaseServer } from '@/lib/supabaseServer'
import { generarClaveVariante } from '@/lib/variantes/generarCombinaciones'
import { insertarHistorialStock } from '@/lib/supabaseHistorialStock'

const supabase = getSupabaseServer()

/** Usuario responsable del movimiento (quien creó la cotización o quien registra). Obligatorio para historial. */
export type UsuarioResponsable = { id: string; nombre?: string }

export interface DescontarStockParams {
  productoId: string
  cantidad: number
  sucursal: string
  variantes?: Record<string, string>
  usuarioResponsable: UsuarioResponsable
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
  const { productoId, cantidad, sucursal, variantes = {}, usuarioResponsable } = params

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
        variantes,
        usuarioResponsable
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
  const { productoId, cantidad, sucursal, variantes = {}, usuarioResponsable } = params

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
        variantes,
        usuarioResponsable,
        origen: 'cotizacion_aprobada', // Origen por defecto para recetas
        tipo_movimiento: 'Venta'
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
  usuarioResponsable: UsuarioResponsable
  // Parámetros para historial
  origen?: 'registro_manual' | 'cotizacion_aprobada' | 'cotizacion_rechazada' | 'cotizacion_editada' | 'cotizacion_eliminada'
  referencia_id?: string | null
  referencia_codigo?: string | null
  tipo_movimiento?: string | null
  observaciones?: string | null
  formato?: any | null
}): Promise<void> {
  const { recursoId, cantidad, sucursal, variantes = {}, usuarioResponsable, origen, referencia_id, referencia_codigo, tipo_movimiento, observaciones, formato } = params

  try {
    // Obtener recurso actual con más campos para historial
    const { data: recurso, error: recursoError } = await supabase
      .from('recursos')
      .select('id, codigo, nombre, control_stock, unidad_medida, formato')
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

    // Calcular nuevo stock (PERMITIR NEGATIVO - el usuario pidió esto explícitamente)
    const nuevoStock = round2(stockActual - cantidad)

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

    // Registrar en historial SIEMPRE (usuario pasado explícitamente, sin depender de sesión HTTP)
    const origenFinal = origen || 'registro_manual'
    await insertarHistorialStock({
      origen: origenFinal,
      referencia_id: referencia_id || null,
      referencia_codigo: referencia_codigo || null,
      item_tipo: 'Recurso',
      item_id: recurso.id,
      item_codigo: recurso.codigo || '',
      item_nombre: recurso.nombre || '',
      sucursal,
      formato: formato || recurso.formato || null,
      cantidad_udm: cantidad,
      unidad_medida: recurso.unidad_medida || '',
      impacto: -cantidad, // Numérico negativo para descuento
      stock_anterior: stockActual,
      stock_nuevo: nuevoStock,
      tipo_movimiento: tipo_movimiento || 'Descuento stock',
      observaciones: observaciones || null,
      usuario_id: usuarioResponsable.id,
      usuario_nombre: usuarioResponsable.nombre ?? null
    })
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0c38a0dd-0488-46f2-9e99-19064c1193dd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'inventoryService.ts:241',message:'descontarStockRecurso DESPUÉS de insertarHistorialStock',data:{recursoId,success:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    console.log(`✅ [DESCONTAR] Stock actualizado: ${recurso.nombre}`)
    console.log(`   - Clave variante: ${claveVariante}`)
    console.log(`   - Stock anterior: ${stockActual}`)
    console.log(`   - Cantidad descontada: ${cantidad}`)
    console.log(`   - Stock nuevo: ${nuevoStock}`)
    console.log(`   - UPDATE ejecutado correctamente en recursos.id = ${recursoId}`)
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0c38a0dd-0488-46f2-9e99-19064c1193dd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'inventoryService.ts:252',message:'descontarStockRecurso CATCH ERROR',data:{recursoId,error:error instanceof Error?error.message:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    console.error('❌ Error descontando stock de recurso:', error)
    throw error
  }
}

/**
 * Aumenta stock de un recurso específico (inverso de descontarStockRecurso)
 */
async function aumentarStockRecurso(params: {
  recursoId: string
  cantidad: number
  sucursal: string
  variantes?: Record<string, string>
  usuarioResponsable: UsuarioResponsable
  // Parámetros para historial
  origen?: 'registro_manual' | 'cotizacion_aprobada' | 'cotizacion_rechazada' | 'cotizacion_editada' | 'cotizacion_eliminada'
  referencia_id?: string | null
  referencia_codigo?: string | null
  tipo_movimiento?: string | null
  observaciones?: string | null
  formato?: any | null
}): Promise<void> {
  const { recursoId, cantidad, sucursal, variantes = {}, usuarioResponsable, origen, referencia_id, referencia_codigo, tipo_movimiento, observaciones, formato } = params

  try {
    // Obtener recurso actual con más campos para historial
    const { data: recurso, error: recursoError } = await supabase
      .from('recursos')
      .select('id, codigo, nombre, control_stock, unidad_medida, formato')
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

    // Calcular nuevo stock (sumar en lugar de restar)
    const nuevoStock = round2(stockActual + cantidad)

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

    // Registrar en historial SIEMPRE (usuario pasado explícitamente)
    const origenFinal = origen || 'registro_manual'
    await insertarHistorialStock({
      origen: origenFinal,
      referencia_id: referencia_id || null,
      referencia_codigo: referencia_codigo || null,
      item_tipo: 'Recurso',
      item_id: recurso.id,
      item_codigo: recurso.codigo || '',
      item_nombre: recurso.nombre || '',
      sucursal,
      formato: formato || recurso.formato || null,
      cantidad_udm: cantidad,
      unidad_medida: recurso.unidad_medida || '',
      impacto: cantidad, // Numérico positivo para aumento
      stock_anterior: stockActual,
      stock_nuevo: nuevoStock,
      tipo_movimiento: tipo_movimiento || 'Aumento stock',
      observaciones: observaciones || null,
      usuario_id: usuarioResponsable.id,
      usuario_nombre: usuarioResponsable.nombre ?? null
    })
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0c38a0dd-0488-46f2-9e99-19064c1193dd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'inventoryService.ts:346',message:'aumentarStockRecurso DESPUÉS de insertarHistorialStock',data:{recursoId,success:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    console.log(`✅ [REVERTIR] Stock actualizado: ${recurso.nombre}`)
    console.log(`   - Clave variante: ${claveVariante}`)
    console.log(`   - Stock anterior: ${stockActual}`)
    console.log(`   - Cantidad revertida: ${cantidad}`)
    console.log(`   - Stock nuevo: ${nuevoStock}`)
    console.log(`   - UPDATE ejecutado correctamente en recursos.id = ${recursoId}`)
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0c38a0dd-0488-46f2-9e99-19064c1193dd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'inventoryService.ts:354',message:'aumentarStockRecurso CATCH ERROR',data:{recursoId,error:error instanceof Error?error.message:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    console.error('❌ Error aumentando stock de recurso:', error)
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

/**
 * Interface para descontar insumos desde cotización
 */
export interface DescontarInsumosParams {
  cotizacionId: string
  cotizacionCodigo?: string
  lineas: Array<{
    tipo: string
    codigo_producto?: string | null
    nombre_producto?: string | null
    cantidad: number
    ancho?: number | null
    alto?: number | null
    total_m2?: number | null
    unidad_medida?: string
    es_soporte?: boolean
    variantes?: any
  }>
  sucursal: string
  origen?: 'cotizacion_aprobada' | 'cotizacion_editada'
  usuarioResponsable: UsuarioResponsable
}

/**
 * Redondea a 2 decimales
 */
function round2(num: number): number {
  return Math.round(num * 100) / 100
}

/**
 * Busca un recurso por ID, código o nombre (insensible a mayúsculas)
 */
async function buscarRecurso(itemReceta: any, recursosCache?: any[]): Promise<any> {
  // Si hay cache, buscar primero ahí
  if (recursosCache) {
    // Buscar por ID
    if (itemReceta.recurso_id) {
      const encontrado = recursosCache.find(r => r.id === itemReceta.recurso_id)
      if (encontrado) return encontrado
    }

    // Buscar por código
    if (itemReceta.recurso_codigo) {
      const encontrado = recursosCache.find(r => r.codigo && r.codigo.toLowerCase() === itemReceta.recurso_codigo.toLowerCase())
      if (encontrado) return encontrado
    }

    // Buscar por nombre (insensible a mayúsculas)
    if (itemReceta.recurso_nombre) {
      const nombreBuscar = itemReceta.recurso_nombre.trim()
      const encontrado = recursosCache.find(r => 
        r.nombre && r.nombre.trim().toLowerCase() === nombreBuscar.toLowerCase()
      )
      if (encontrado) return encontrado
    }
  }

  // Si no se encontró en cache, buscar en BD
  // Buscar por recurso_id primero
  if (itemReceta.recurso_id) {
    const { data, error } = await supabase
      .from('recursos')
      .select('id, nombre, codigo, control_stock, variantes, categoria')
      .eq('id', itemReceta.recurso_id)
      .single()
    
    if (!error && data) return data
  }

  // Buscar por recurso_codigo
  if (itemReceta.recurso_codigo) {
    const { data, error } = await supabase
      .from('recursos')
      .select('id, nombre, codigo, control_stock, variantes, categoria')
      .ilike('codigo', itemReceta.recurso_codigo)
      .single()
    
    if (!error && data) return data
  }

  // Buscar por recurso_nombre (insensible a mayúsculas)
  if (itemReceta.recurso_nombre) {
    const { data, error } = await supabase
      .from('recursos')
      .select('id, nombre, codigo, control_stock, variantes, categoria')
      .ilike('nombre', itemReceta.recurso_nombre.trim())
      .single()
    
    if (!error && data) return data
  }

  throw new Error(`Recurso no encontrado: ${itemReceta.recurso_id || itemReceta.recurso_codigo || itemReceta.recurso_nombre}`)
}

/**
 * Aplica variantes del producto a los insumos
 * Solo incluye variantes que el insumo también tiene
 */
function aplicarVariantesAInsumo(
  recurso: any,
  variantesProducto: Record<string, string>
): Record<string, string> {
  // Si no hay variantes del producto, retornar vacío
  if (!variantesProducto || Object.keys(variantesProducto).length === 0) {
    return {}
  }

  // Si el recurso no tiene variantes definidas, retornar vacío
  if (!recurso.variantes) {
    return {}
  }

  // Parsear variantes del recurso
  let variantesRecurso: any[] = []
  try {
    if (typeof recurso.variantes === 'string') {
      variantesRecurso = JSON.parse(recurso.variantes)
    } else if (Array.isArray(recurso.variantes)) {
      variantesRecurso = recurso.variantes
    } else if (recurso.variantes.variantes && Array.isArray(recurso.variantes.variantes)) {
      variantesRecurso = recurso.variantes.variantes
    }
  } catch (e) {
    console.warn('⚠️ Error parseando variantes del recurso:', e)
    return {}
  }

  // Extraer nombres de variantes que el recurso tiene
  const nombresVariantesRecurso = new Set<string>()
  variantesRecurso.forEach((v: any) => {
    if (v && v.nombre) {
      nombresVariantesRecurso.add(v.nombre)
    }
  })

  // Filtrar variantes del producto solo por las que el recurso tiene
  const variantesAplicadas: Record<string, string> = {}
  Object.entries(variantesProducto).forEach(([nombre, valor]) => {
    if (nombresVariantesRecurso.has(nombre)) {
      variantesAplicadas[nombre] = valor
    }
  })

  return variantesAplicadas
}

/**
 * Descuenta insumos desde una cotización aprobada
 * Considera unidad de medida (m² vs unidades), receta, variantes y excluye soportes
 */
export async function descontarInsumosDesdeCotizacion(
  params: DescontarInsumosParams
): Promise<void> {
  const { cotizacionId, cotizacionCodigo, lineas, sucursal, origen = 'cotizacion_aprobada', usuarioResponsable } = params

  console.log(`📦 [DESCONTAR] Procesando cotización ${cotizacionId}`)
  console.log(`📦 [DESCONTAR] Sucursal: ${sucursal}`)
  console.log(`📦 [DESCONTAR] Total líneas recibidas: ${lineas.length}`)

  try {
    // 1. Filtrar líneas válidas
    const lineasValidas = lineas.filter(linea => {
      // Solo procesar líneas de tipo 'Producto'
      if (linea.tipo !== 'Producto') {
        return false
      }

      // Excluir soportes
      if (linea.es_soporte === true) {
        console.log(`⚠️ [DESCONTAR] Línea ${linea.nombre_producto || linea.codigo_producto} es soporte, omitiendo`)
        return false
      }

      // Debe tener código o nombre de producto
      if (!linea.codigo_producto && !linea.nombre_producto) {
        console.log(`⚠️ [DESCONTAR] Línea sin código ni nombre, omitiendo`)
        return false
      }

      // Debe tener cantidad > 0
      if (!linea.cantidad || linea.cantidad <= 0) {
        console.log(`⚠️ [DESCONTAR] Línea ${linea.nombre_producto || linea.codigo_producto} sin cantidad válida, omitiendo`)
        return false
      }

      return true
    })

    console.log(`📦 [DESCONTAR] Líneas válidas a procesar: ${lineasValidas.length}`)

    if (lineasValidas.length === 0) {
      console.log('⚠️ [DESCONTAR] No hay líneas válidas para procesar')
      return
    }

    // 2. Obtener todos los recursos de una vez (optimización)
    const { data: recursos, error: recursosError } = await supabase
      .from('recursos')
      .select('id, nombre, codigo, control_stock, variantes, categoria')

    if (recursosError || !recursos) {
      console.error('❌ [DESCONTAR] Error obteniendo recursos:', recursosError)
      throw new Error('Error obteniendo recursos')
    }

    // 3. Procesar cada línea válida
    for (const linea of lineasValidas) {
      try {
        console.log(`📦 [DESCONTAR] Procesando: ${linea.nombre_producto || linea.codigo_producto}`)

        // a. Buscar producto
        let producto: any = null
        if (linea.codigo_producto) {
          const { data, error } = await supabase
            .from('productos')
            .select('id, nombre, codigo, receta, unidad_medida')
            .eq('codigo', linea.codigo_producto)
            .single()
          
          if (!error && data) {
            producto = data
          }
        }

        // Si no se encontró por código, buscar por nombre
        if (!producto && linea.nombre_producto) {
          const { data, error } = await supabase
            .from('productos')
            .select('id, nombre, codigo, receta, unidad_medida')
            .eq('nombre', linea.nombre_producto)
            .single()
          
          if (!error && data) {
            producto = data
          }
        }

        if (!producto) {
          console.warn(`⚠️ [DESCONTAR] Producto no encontrado: ${linea.codigo_producto || linea.nombre_producto}`)
          continue
        }

        // b. Validar que tenga receta
        const receta = producto.receta || []
        if (!Array.isArray(receta) || receta.length === 0) {
          console.log(`⚠️ [DESCONTAR] Producto ${producto.nombre} no tiene receta, omitiendo`)
          continue
        }

        // c. Calcular consumo real según unidad de medida
        let consumoReal: number = 0

        const unidadMedida = linea.unidad_medida || producto.unidad_medida || ''
        const unidadNormalizada = unidadMedida.toLowerCase().trim()

        if (unidadNormalizada === 'm²' || unidadNormalizada === 'm2' || unidadNormalizada === 'm') {
          // Calcular m² reales: cantidad × ancho × alto
          const cantidad = Number(linea.cantidad) || 0
          const ancho = Number(linea.ancho) || 0
          const alto = Number(linea.alto) || 0
          const m2 = cantidad * ancho * alto
          
          // Si no hay ancho/alto, usar total_m2 si existe
          const m2Final = m2 > 0 ? m2 : (Number(linea.total_m2) || 0)
          consumoReal = round2(m2Final)

          console.log(`📦 [DESCONTAR]   - Unidad: m²`)
          console.log(`📦 [DESCONTAR]   - Cantidad items: ${cantidad}, Ancho: ${ancho}, Alto: ${alto}`)
          console.log(`📦 [DESCONTAR]   - m² calculados: ${m2Final}`)
          console.log(`📦 [DESCONTAR]   - Consumo real (m²): ${consumoReal}`)
        } else {
          // Para unidades, solo usar cantidad
          consumoReal = round2(Number(linea.cantidad) || 0)
          console.log(`📦 [DESCONTAR]   - Unidad: ${unidadMedida}`)
          console.log(`📦 [DESCONTAR]   - Cantidad items: ${consumoReal}`)
          console.log(`📦 [DESCONTAR]   - Consumo real (unidades): ${consumoReal}`)
        }

        if (consumoReal <= 0) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/0c38a0dd-0488-46f2-9e99-19064c1193dd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'inventoryService.ts:679',message:'descontarInsumosDesdeCotizacion CONSUMO INVALIDO - OMITIENDO',data:{productoNombre:producto.nombre,consumoReal,linea},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
          // #endregion
          console.warn(`⚠️ [DESCONTAR] Consumo inválido para producto ${producto.nombre}, omitiendo`)
          continue
        }

        // d. Obtener variantes del producto
        let variantesProducto: Record<string, string> = {}
        if (linea.variantes) {
          try {
            if (typeof linea.variantes === 'string') {
              variantesProducto = JSON.parse(linea.variantes)
            } else if (typeof linea.variantes === 'object') {
              variantesProducto = linea.variantes
            }
          } catch (e) {
            console.warn('⚠️ [DESCONTAR] Error parseando variantes:', e)
          }
        }

        console.log(`📦 [DESCONTAR]   - Variantes producto: ${JSON.stringify(variantesProducto)}`)

        // e. Procesar cada item de la receta
        for (const itemReceta of receta) {
          try {
            // Buscar recurso (insumo) - usar cache primero
            let recurso: any = null
            
            // Buscar en cache por nombre (insensible a mayúsculas)
            if (itemReceta.recurso_nombre) {
              const nombreBuscar = itemReceta.recurso_nombre.trim().toLowerCase()
              recurso = recursos.find(r => 
                r.nombre && r.nombre.trim().toLowerCase() === nombreBuscar
              )
            }

            // Si no se encuentra, buscar por código
            if (!recurso && itemReceta.recurso_codigo) {
              recurso = recursos.find(r => 
                r.codigo && r.codigo.toLowerCase() === itemReceta.recurso_codigo.toLowerCase()
              )
            }

            // Si no se encuentra, buscar por ID
            if (!recurso && itemReceta.recurso_id) {
              recurso = recursos.find(r => r.id === itemReceta.recurso_id)
            }

            // Si no se encuentra en cache, buscar en BD
            if (!recurso) {
              try {
                recurso = await buscarRecurso(itemReceta, recursos)
              } catch (e) {
                console.error(`❌ [DESCONTAR] Recurso no encontrado para receta:`, {
                  recurso_id: itemReceta.recurso_id,
                  recurso_codigo: itemReceta.recurso_codigo,
                  recurso_nombre: itemReceta.recurso_nombre,
                  error: e instanceof Error ? e.message : String(e)
                })
                continue
              }
            }

            if (!recurso) {
              console.error(`❌ [DESCONTAR] No se pudo encontrar recurso: ${itemReceta.recurso_nombre || itemReceta.recurso_id}`)
              continue
            }

            // Validar que sea insumo
            if (recurso.categoria !== 'Insumos') {
              console.log(`⚠️ [DESCONTAR] Recurso ${recurso.nombre} no es insumo (categoría: ${recurso.categoria}), omitiendo`)
              continue
            }

            // Calcular cantidad a descontar
            // IMPORTANTE: cantidadReceta es la cantidad por m² o por unidad
            // consumoReal es el total de m² o unidades vendidas
            // cantidadDescontar = cantidadReceta × consumoReal
            const cantidadReceta = Number(itemReceta.cantidad) || 0
            const cantidadDescontar = round2(cantidadReceta * consumoReal)

            if (cantidadDescontar <= 0) {
              console.warn(`⚠️ [DESCONTAR] Cantidad a descontar inválida para ${recurso.nombre}: ${cantidadDescontar}`)
              continue
            }

            // Aplicar variantes del producto a los insumos SOLO si el insumo tiene variantes
            const variantesInsumo = aplicarVariantesAInsumo(recurso, variantesProducto)

            console.log(`📦 [DESCONTAR]   - Insumo: ${recurso.nombre}`)
            console.log(`📦 [DESCONTAR]   - Cantidad en receta (por m²/unidad): ${cantidadReceta}`)
            console.log(`📦 [DESCONTAR]   - Consumo real (m²/unidades vendidas): ${consumoReal}`)
            console.log(`📦 [DESCONTAR]   - Cantidad a descontar: ${cantidadDescontar}`)
            console.log(`📦 [DESCONTAR]   - Variantes aplicadas: ${JSON.stringify(variantesInsumo)}`)

            // Descontar stock del insumo con variantes
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/0c38a0dd-0488-46f2-9e99-19064c1193dd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'inventoryService.ts:774',message:'descontarInsumosDesdeCotizacion LLAMANDO descontarStockRecurso',data:{recursoId:recurso.id,cantidadDescontar,origen,cotizacionId,cotizacionCodigo},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
            await descontarStockRecurso({
              recursoId: recurso.id,
              cantidad: cantidadDescontar,
              sucursal: sucursal,
              variantes: variantesInsumo,
              usuarioResponsable,
              origen,
              referencia_id: cotizacionId,
              referencia_codigo: cotizacionCodigo,
              tipo_movimiento: 'Venta',
              formato: recurso.formato || null
            })

            // Registrar movimiento
            await registrarMovimiento({
              tipo: 'cotizacion',
              recursoId: recurso.id,
              variante: variantesInsumo,
              delta: -cantidadDescontar,
              sucursal,
              referencia: cotizacionId
            })

            console.log(`✅ [DESCONTAR] Stock descontado: ${recurso.nombre} - ${cantidadDescontar} unidades`)
          } catch (error) {
            console.error(`❌ [DESCONTAR] Error procesando insumo ${itemReceta.recurso_nombre || itemReceta.recurso_id}:`, error)
            // Continuar con siguiente insumo
          }
        }
      } catch (error) {
        console.error(`❌ [DESCONTAR] Error procesando línea ${linea.nombre_producto || linea.codigo_producto}:`, error)
        // Continuar con siguiente línea
      }
    }

    console.log(`✅ [DESCONTAR] Procesamiento completado para cotización ${cotizacionId}`)
  } catch (error) {
    console.error('❌ [DESCONTAR] Error general descontando insumos:', error)
    throw error
  }
}

/**
 * Interface para revertir insumos desde una cotización
 */
export interface RevertirInsumosParams {
  cotizacionId: string
  cotizacionCodigo?: string
  lineas: Array<{
    tipo: string
    codigo_producto?: string | null
    nombre_producto?: string | null
    cantidad: number
    ancho?: number | null
    alto?: number | null
    total_m2?: number | null
    unidad_medida?: string
    es_soporte?: boolean
    variantes?: any
  }>
  sucursal: string
  origen?: 'cotizacion_rechazada' | 'cotizacion_editada' | 'cotizacion_eliminada'
  usuarioResponsable: UsuarioResponsable
}

/**
 * Revierte insumos desde una cotización aprobada
 * Es el inverso exacto de descontarInsumosDesdeCotizacion
 * Considera unidad de medida (m² vs unidades), receta, variantes y excluye soportes
 */
export async function revertirStockCotizacion(
  params: RevertirInsumosParams
): Promise<void> {
  const { cotizacionId, cotizacionCodigo, lineas, sucursal, origen = 'cotizacion_rechazada', usuarioResponsable } = params

  console.log(`🔄 [REVERTIR] Procesando cotización ${cotizacionId}`)
  console.log(`🔄 [REVERTIR] Sucursal: ${sucursal}`)
  console.log(`🔄 [REVERTIR] Total líneas recibidas: ${lineas.length}`)

  try {
    // 1. Filtrar líneas válidas (mismo filtro que descuento)
    const lineasValidas = lineas.filter(linea => {
      // Solo procesar líneas de tipo 'Producto'
      if (linea.tipo !== 'Producto') {
        return false
      }

      // Excluir soportes
      if (linea.es_soporte === true) {
        console.log(`⚠️ [REVERTIR] Línea ${linea.nombre_producto || linea.codigo_producto} es soporte, omitiendo`)
        return false
      }

      // Debe tener código o nombre de producto
      if (!linea.codigo_producto && !linea.nombre_producto) {
        console.log(`⚠️ [REVERTIR] Línea sin código ni nombre, omitiendo`)
        return false
      }

      // Debe tener cantidad > 0
      if (!linea.cantidad || linea.cantidad <= 0) {
        console.log(`⚠️ [REVERTIR] Línea ${linea.nombre_producto || linea.codigo_producto} sin cantidad válida, omitiendo`)
        return false
      }

      return true
    })

    console.log(`🔄 [REVERTIR] Líneas válidas a procesar: ${lineasValidas.length}`)

    if (lineasValidas.length === 0) {
      console.log('⚠️ [REVERTIR] No hay líneas válidas para procesar')
      return
    }

    // 2. Obtener todos los recursos de una vez (optimización)
    const { data: recursos, error: recursosError } = await supabase
      .from('recursos')
      .select('id, nombre, codigo, control_stock, variantes, categoria')

    if (recursosError || !recursos) {
      console.error('❌ [REVERTIR] Error obteniendo recursos:', recursosError)
      throw new Error('Error obteniendo recursos')
    }

    // 3. Procesar cada línea válida
    for (const linea of lineasValidas) {
      try {
        console.log(`🔄 [REVERTIR] Procesando: ${linea.nombre_producto || linea.codigo_producto}`)

        // a. Buscar producto
        let producto: any = null
        if (linea.codigo_producto) {
          const { data, error } = await supabase
            .from('productos')
            .select('id, nombre, codigo, receta, unidad_medida')
            .eq('codigo', linea.codigo_producto)
            .single()
          
          if (!error && data) {
            producto = data
          }
        }

        // Si no se encontró por código, buscar por nombre
        if (!producto && linea.nombre_producto) {
          const { data, error } = await supabase
            .from('productos')
            .select('id, nombre, codigo, receta, unidad_medida')
            .eq('nombre', linea.nombre_producto)
            .single()
          
          if (!error && data) {
            producto = data
          }
        }

        if (!producto) {
          console.warn(`⚠️ [REVERTIR] Producto no encontrado: ${linea.codigo_producto || linea.nombre_producto}`)
          continue
        }

        // b. Validar que tenga receta
        const receta = producto.receta || []
        if (!Array.isArray(receta) || receta.length === 0) {
          console.log(`⚠️ [REVERTIR] Producto ${producto.nombre} no tiene receta, omitiendo`)
          continue
        }

        // c. Calcular consumo real según unidad de medida (mismo cálculo que descuento)
        let consumoReal: number = 0

        const unidadMedida = linea.unidad_medida || producto.unidad_medida || ''
        const unidadNormalizada = unidadMedida.toLowerCase().trim()

        if (unidadNormalizada === 'm²' || unidadNormalizada === 'm2' || unidadNormalizada === 'm') {
          // Calcular m² reales: cantidad × ancho × alto
          const cantidad = Number(linea.cantidad) || 0
          const ancho = Number(linea.ancho) || 0
          const alto = Number(linea.alto) || 0
          const m2 = cantidad * ancho * alto
          
          // Si no hay ancho/alto, usar total_m2 si existe
          const m2Final = m2 > 0 ? m2 : (Number(linea.total_m2) || 0)
          consumoReal = round2(m2Final)

          console.log(`🔄 [REVERTIR]   - Unidad: m²`)
          console.log(`🔄 [REVERTIR]   - Cantidad items: ${cantidad}, Ancho: ${ancho}, Alto: ${alto}`)
          console.log(`🔄 [REVERTIR]   - m² calculados: ${m2Final}`)
          console.log(`🔄 [REVERTIR]   - Consumo real (m²): ${consumoReal}`)
        } else {
          // Para unidades, solo usar cantidad
          consumoReal = round2(Number(linea.cantidad) || 0)
          console.log(`🔄 [REVERTIR]   - Unidad: ${unidadMedida}`)
          console.log(`🔄 [REVERTIR]   - Cantidad items: ${consumoReal}`)
          console.log(`🔄 [REVERTIR]   - Consumo real (unidades): ${consumoReal}`)
        }

        if (consumoReal <= 0) {
          console.warn(`⚠️ [REVERTIR] Consumo inválido para producto ${producto.nombre}, omitiendo`)
          continue
        }

        // d. Obtener variantes del producto
        let variantesProducto: Record<string, string> = {}
        if (linea.variantes) {
          try {
            if (typeof linea.variantes === 'string') {
              variantesProducto = JSON.parse(linea.variantes)
            } else if (typeof linea.variantes === 'object') {
              variantesProducto = linea.variantes
            }
          } catch (e) {
            console.warn('⚠️ [REVERTIR] Error parseando variantes:', e)
          }
        }

        console.log(`🔄 [REVERTIR]   - Variantes producto: ${JSON.stringify(variantesProducto)}`)

        // e. Procesar cada item de la receta
        for (const itemReceta of receta) {
          try {
            // Buscar recurso (insumo) - usar cache primero
            let recurso: any = null
            
            // Buscar en cache por nombre (insensible a mayúsculas)
            if (itemReceta.recurso_nombre) {
              const nombreBuscar = itemReceta.recurso_nombre.trim().toLowerCase()
              recurso = recursos.find(r => 
                r.nombre && r.nombre.trim().toLowerCase() === nombreBuscar
              )
            }

            // Si no se encuentra, buscar por código
            if (!recurso && itemReceta.recurso_codigo) {
              recurso = recursos.find(r => 
                r.codigo && r.codigo.toLowerCase() === itemReceta.recurso_codigo.toLowerCase()
              )
            }

            // Si no se encuentra, buscar por ID
            if (!recurso && itemReceta.recurso_id) {
              recurso = recursos.find(r => r.id === itemReceta.recurso_id)
            }

            // Si no se encuentra en cache, buscar en BD
            if (!recurso) {
              try {
                recurso = await buscarRecurso(itemReceta, recursos)
              } catch (e) {
                console.error(`❌ [REVERTIR] Recurso no encontrado para receta:`, {
                  recurso_id: itemReceta.recurso_id,
                  recurso_codigo: itemReceta.recurso_codigo,
                  recurso_nombre: itemReceta.recurso_nombre,
                  error: e instanceof Error ? e.message : String(e)
                })
                continue
              }
            }

            if (!recurso) {
              console.error(`❌ [REVERTIR] No se pudo encontrar recurso: ${itemReceta.recurso_nombre || itemReceta.recurso_id}`)
              continue
            }

            // Validar que sea insumo
            if (recurso.categoria !== 'Insumos') {
              console.log(`⚠️ [REVERTIR] Recurso ${recurso.nombre} no es insumo (categoría: ${recurso.categoria}), omitiendo`)
              continue
            }

            // Calcular cantidad a revertir (mismo cálculo que descuento)
            const cantidadReceta = Number(itemReceta.cantidad) || 0
            const cantidadRevertir = round2(cantidadReceta * consumoReal)

            if (cantidadRevertir <= 0) {
              console.warn(`⚠️ [REVERTIR] Cantidad a revertir inválida para ${recurso.nombre}: ${cantidadRevertir}`)
              continue
            }

            // Aplicar variantes del producto a los insumos SOLO si el insumo tiene variantes
            const variantesInsumo = aplicarVariantesAInsumo(recurso, variantesProducto)

            console.log(`🔄 [REVERTIR]   - Insumo: ${recurso.nombre}`)
            console.log(`🔄 [REVERTIR]   - Cantidad en receta (por m²/unidad): ${cantidadReceta}`)
            console.log(`🔄 [REVERTIR]   - Consumo real (m²/unidades vendidas): ${consumoReal}`)
            console.log(`🔄 [REVERTIR]   - Cantidad a revertir: ${cantidadRevertir}`)
            console.log(`🔄 [REVERTIR]   - Variantes aplicadas: ${JSON.stringify(variantesInsumo)}`)

            // Aumentar stock del insumo con variantes (inverso de descontar)
            await aumentarStockRecurso({
              recursoId: recurso.id,
              cantidad: cantidadRevertir,
              sucursal: sucursal,
              variantes: variantesInsumo,
              usuarioResponsable,
              origen,
              referencia_id: cotizacionId,
              referencia_codigo: cotizacionCodigo,
              tipo_movimiento: 'Reversión venta',
              formato: recurso.formato || null
            })

            // Registrar movimiento (delta positivo para reversión)
            await registrarMovimiento({
              tipo: 'cotizacion',
              recursoId: recurso.id,
              variante: variantesInsumo,
              delta: cantidadRevertir, // Positivo para revertir
              sucursal,
              referencia: cotizacionId
            })

            console.log(`✅ [REVERTIR] Stock revertido: ${recurso.nombre} - ${cantidadRevertir} unidades`)
          } catch (error) {
            console.error(`❌ [REVERTIR] Error procesando insumo ${itemReceta.recurso_nombre || itemReceta.recurso_id}:`, error)
            // Continuar con siguiente insumo
          }
        }
      } catch (error) {
        console.error(`❌ [REVERTIR] Error procesando línea ${linea.nombre_producto || linea.codigo_producto}:`, error)
        // Continuar con siguiente línea
      }
    }

    console.log(`✅ [REVERTIR] Procesamiento completado para cotización ${cotizacionId}`)
  } catch (error) {
    console.error('❌ [REVERTIR] Error general revirtiendo insumos:', error)
    throw error
  }
}





