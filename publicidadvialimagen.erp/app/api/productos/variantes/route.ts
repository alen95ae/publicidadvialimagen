import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabaseServer'
import { generarCombinacionesVariantes, convertirVariantesAFormato } from '@/lib/variantes/generarCombinaciones'
import { calcularCosteVariante } from '@/lib/variantes/calcularCosteVariante'
import { calcularPrecioVariante } from '@/lib/variantes/calcularPrecioVariante'
import { parseCalculadora } from '@/lib/models/productoModel'

const supabase = getSupabaseServer()

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
    // IMPORTANTE: select('*') debe incluir precio_variante (JSONB)
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

    // Log para verificar que precio_variante se está retornando
    console.log(`📡 API GET /api/productos/variantes - Variantes encontradas: ${(variantes || []).length}`)
    if (variantes && variantes.length > 0) {
      variantes.forEach((v: any, index: number) => {
        console.log(`  Variante ${index + 1}:`)
        console.log(`    - combinacion: ${v.combinacion}`)
        console.log(`    - precio_override: ${v.precio_override} (tipo: ${typeof v.precio_override})`)
        console.log(`    - precio_calculado: ${v.precio_calculado} (tipo: ${typeof v.precio_calculado})`)
        console.log(`    - precio_variante existe?: ${v.precio_variante ? 'SÍ' : 'NO'}`)
        console.log(`    - precio_variante tipo: ${typeof v.precio_variante}`)
        if (v.precio_variante) {
          if (typeof v.precio_variante === 'string') {
            console.log(`    - precio_variante (string, primeros 200 chars): ${v.precio_variante.substring(0, 200)}`)
          } else {
            console.log(`    - precio_variante (objeto): ${JSON.stringify(v.precio_variante).substring(0, 200)}`)
          }
        }
      })
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
    const { variante_id, producto_id, coste_override, precio_override, margen_override, precio_variante } = body

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
      // Guardar como JSONB
      updateData.precio_variante = precio_variante === null || precio_variante === '' 
        ? null 
        : precio_variante
    }

    console.log('📤 Actualizando variante con datos:', {
      variante_id,
      producto_id,
      updateData,
      precio_variante: precio_variante ? 'presente' : 'ausente'
    })

    const { data, error } = await supabase
      .from('producto_variantes')
      .update(updateData)
      .eq('id', variante_id)
      .eq('producto_id', producto_id)
      .select()
      .single()

    if (error) {
      console.error('❌ Error actualizando variante:', error)
      console.error('❌ Detalles del error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      return NextResponse.json(
        { 
          success: false,
          error: 'Error al actualizar variante',
          details: error.message,
          code: error.code
        },
        { status: 500 }
      )
    }

    console.log('✅ Variante actualizada correctamente:', data)

    return NextResponse.json({
      success: true,
      variante: data
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
    const { producto_id, action, variantes_definicion } = body

    if (!producto_id) {
      return NextResponse.json(
        { error: 'producto_id es requerido' },
        { status: 400 }
      )
    }

    if (action === 'recalcular') {
      // Recalcular costes y precios de todas las variantes existentes
      return await recalcularVariantes(producto_id)
    } else if (action === 'regenerar') {
      // Regenerar variantes desde las definiciones del producto
      if (!variantes_definicion) {
        return NextResponse.json(
          { error: 'variantes_definicion es requerido para regenerar' },
          { status: 400 }
        )
      }
      return await regenerarVariantes(producto_id, variantes_definicion)
    } else {
      return NextResponse.json(
        { error: 'action debe ser "recalcular" o "regenerar"' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('❌ Error en PUT /api/productos/variantes:', {
      message: error?.message,
      stack: error?.stack,
      error: error
    })
    return NextResponse.json(
      { 
        error: error?.message || 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * Recalcular costes y precios de todas las variantes existentes
 */
async function recalcularVariantes(productoId: string) {
  try {
    // Obtener producto completo
    const { data: producto, error: productoError } = await supabase
      .from('productos')
      .select('*')
      .eq('id', productoId)
      .single()

    if (productoError || !producto) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    // Obtener todas las variantes del producto
    const { data: variantes, error: variantesError } = await supabase
      .from('producto_variantes')
      .select('*')
      .eq('producto_id', productoId)

    if (variantesError) {
      return NextResponse.json(
        { error: 'Error al obtener variantes' },
        { status: 500 }
      )
    }

    // Obtener recursos para calcular costes
    const { data: recursos } = await supabase
      .from('recursos')
      .select('*')

    const receta = producto.receta || []
    // Debe leer ambos nombres para compatibilidad
    const rawCalc =
      producto.calculadora_precios ??
      producto.calculadora_de_precios ??
      null
    const calculadora =
      typeof rawCalc === "string" ? JSON.parse(rawCalc) : rawCalc

    // Recalcular cada variante
    const variantesActualizadas = await Promise.all(
      (variantes || []).map(async (variante) => {
        // Parsear combinación
        const combinacionObj: Record<string, string> = {}
        const partes = variante.combinacion.split('|')
        partes.forEach((parte: string) => {
          const [nombre, valor] = parte.split(':')
          if (nombre && valor) {
            combinacionObj[nombre.trim()] = valor.trim()
          }
        })

        // Calcular coste
        const costeCalculado = calcularCosteVariante(
          receta,
          recursos || [],
          combinacionObj
        )

        // Calcular precio
        const precioCalculado = calcularPrecioVariante(
          costeCalculado,
          calculadora
        )

        // Actualizar en BD
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

/**
 * Regenerar variantes desde las definiciones del producto
 * 
 * IMPORTANTE: Esta función SIEMPRE borra todas las variantes existentes antes de generar nuevas.
 * Esto asegura que no se mezclen variantes de recursos eliminados con las nuevas.
 */
async function regenerarVariantes(productoId: string, variantesDefinicion: any[]) {
  try {
    console.log("🔄 [REGENERAR VARIANTES] Iniciando regeneración para producto:", productoId)
    console.log("🔎 [REGENERAR VARIANTES] VariantesDefinicion recibidas:", JSON.stringify(variantesDefinicion, null, 2))

    // PASO 1: Validar que hay variantes definidas
    if (!variantesDefinicion || variantesDefinicion.length === 0) {
      console.log("⚠️ [REGENERAR VARIANTES] No hay variantes definidas, eliminando todas las variantes existentes")
      // Borrar todas las variantes si no hay definiciones
      const { error: deleteError } = await supabase
        .from('producto_variantes')
        .delete()
        .eq('producto_id', productoId)
      
      if (deleteError) {
        console.error("❌ [REGENERAR VARIANTES] Error eliminando variantes:", deleteError)
        return NextResponse.json(
          { 
            success: false,
            error: 'Error al eliminar variantes existentes',
            detalles: deleteError.message
          },
          { status: 500 }
        )
      }
      
      return NextResponse.json({ success: true, variantes: [] })
    }

    // PASO 2: Obtener producto completo
    const { data: producto, error: productoError } = await supabase
      .from('productos')
      .select('*')
      .eq('id', productoId)
      .single()

    if (productoError || !producto) {
      console.error("❌ [REGENERAR VARIANTES] Error obteniendo producto:", productoError)
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    // PASO 3: Validar y normalizar receta (debe ser array)
    // FIX 3: Mejorar validación para aceptar múltiples formatos y normalizar silenciosamente
    let receta = producto.receta || []
    
    // Manejar todos los casos edge: null, undefined, objetos vacíos, formatos antiguos
    if (!receta || (typeof receta === 'object' && !Array.isArray(receta))) {
      if (typeof receta === 'object' && receta !== null && receta.items && Array.isArray(receta.items)) {
        console.warn('⚠️ [REGENERAR VARIANTES] Receta en formato antiguo (objeto con items), convirtiendo a array')
        receta = receta.items
      } else {
        console.warn('⚠️ [REGENERAR VARIANTES] Receta inválida, normalizando a []:', typeof receta, receta)
        receta = []
      }
    }
    
    // Asegurar que receta es siempre un array
    if (!Array.isArray(receta)) {
      console.warn('⚠️ [REGENERAR VARIANTES] Receta no es array después de normalización, forzando a []')
      receta = []
    }

    // PASO 4: Validar que hay receta (si no hay receta, no se pueden generar variantes)
    if (!Array.isArray(receta) || receta.length === 0) {
      console.warn("⚠️ [REGENERAR VARIANTES] No hay receta, eliminando todas las variantes existentes")
      const { error: deleteError } = await supabase
        .from('producto_variantes')
        .delete()
        .eq('producto_id', productoId)
      
      if (deleteError) {
        console.error("❌ [REGENERAR VARIANTES] Error eliminando variantes:", deleteError)
      }
      
      return NextResponse.json({ 
        success: true, 
        variantes: [],
        mensaje: 'No hay receta definida, se eliminaron todas las variantes'
      })
    }

    // PASO 5: Obtener recursos para calcular costes
    const { data: recursos, error: recursosError } = await supabase
      .from('recursos')
      .select('*')

    if (recursosError) {
      console.error("❌ [REGENERAR VARIANTES] Error obteniendo recursos:", recursosError)
      return NextResponse.json(
        { 
          success: false,
          error: 'Error al cargar recursos',
          detalles: recursosError.message
        },
        { status: 500 }
      )
    }

    if (!recursos || recursos.length === 0) {
      console.error("❌ [REGENERAR VARIANTES] Recursos no cargados")
      return NextResponse.json(
        { 
          success: false,
          error: 'Recursos no cargados',
          detalles: 'No se pudieron cargar los recursos desde la base de datos'
        },
        { status: 500 }
      )
    }

    // PASO 6: Usar modelo unificado para parsear calculadora
    const calculadora = parseCalculadora(
      producto.calculadora_precios ?? producto.calculadora_de_precios
    )

    if (!calculadora) {
      console.warn("⚠️ [REGENERAR VARIANTES] Calculadora de precios faltante, se usará precio base")
    }

    console.log("🔎 [REGENERAR VARIANTES] Receta del producto:", JSON.stringify(receta, null, 2))
    console.log("🔎 [REGENERAR VARIANTES] Recursos cargados:", recursos.length)
    console.log("🔎 [REGENERAR VARIANTES] Calculadora de precios:", calculadora ? "existe" : "null")

    // PASO 7: Convertir definiciones a formato
    const variantesFormato = convertirVariantesAFormato(variantesDefinicion)
    console.log("🔎 [REGENERAR VARIANTES] Variantes convertidas a formato:", JSON.stringify(variantesFormato, null, 2))
    
    // PASO 8: Agregar sucursales como variante adicional
    const SUCURSALES_DEFAULT = ["La Paz", "Santa Cruz"]
    const variantesConSucursales = [
      ...variantesFormato,
      {
        nombre: "Sucursal",
        valores: SUCURSALES_DEFAULT
      }
    ]
    console.log("🔎 [REGENERAR VARIANTES] Variantes con sucursales:", JSON.stringify(variantesConSucursales, null, 2))
    
    // PASO 9: Generar combinaciones (ahora incluyen sucursales)
    const combinaciones = generarCombinacionesVariantes(variantesConSucursales)
    console.log("🔎 [REGENERAR VARIANTES] Combinaciones generadas (con sucursales):", combinaciones.length)
    if (combinaciones.length > 0) {
      console.log("🔎 [REGENERAR VARIANTES] Primera combinación ejemplo:", JSON.stringify(combinaciones[0], null, 2))
    }

    // PASO 10: 🔥 CRÍTICO - BORRAR TODAS LAS VARIANTES EXISTENTES ANTES DE GENERAR NUEVAS
    console.log("🗑️ [REGENERAR VARIANTES] BORRANDO TODAS LAS VARIANTES EXISTENTES DEL PRODUCTO")
    
    // Primero obtener el count de variantes existentes
    const { count: deletedCount } = await supabase
      .from('producto_variantes')
      .select('*', { count: 'exact', head: true })
      .eq('producto_id', productoId)
    
    // Luego borrar todas las variantes
    const { error: deleteError } = await supabase
      .from('producto_variantes')
      .delete()
      .eq('producto_id', productoId)

    if (deleteError) {
      console.error("❌ [REGENERAR VARIANTES] Error eliminando variantes existentes:", deleteError)
      return NextResponse.json(
        { 
          success: false,
          error: 'Error al eliminar variantes existentes',
          detalles: deleteError.message
        },
        { status: 500 }
      )
    }

    console.log(`✅ [REGENERAR VARIANTES] Variantes antiguas eliminadas (${deletedCount || 0} variantes)`)

    // PASO 11: Si no hay combinaciones, terminar aquí
    if (combinaciones.length === 0) {
      console.log("⚠️ [REGENERAR VARIANTES] No hay combinaciones para generar")
      return NextResponse.json({
        success: true,
        variantes: [],
        mensaje: 'No hay combinaciones para generar'
      })
    }

    // PASO 12: Crear SOLO las nuevas variantes (sin merge, sin upsert)
    const variantesCreadas: any[] = []
    const errores: any[] = []

    for (const combinacion of combinaciones) {
      try {
        if (!combinacion.combinacion || combinacion.combinacion.trim() === '') {
          console.error("❌ [REGENERAR VARIANTES] ERROR: Combinación vacía detectada!")
          errores.push({
            message: 'Combinación vacía',
            combinacion: combinacion
          })
          continue
        }

        // Extraer sucursal de la combinación si existe
        const sucursal = combinacion.valores?.Sucursal || combinacion.valores?.sucursal
        
        // Calcular coste (con validación de datos y sucursal)
        let costeCalculado = 0
        try {
          if (!Array.isArray(receta)) {
            throw new Error("Receta inválida para calcular coste")
          }
          if (!recursos || !Array.isArray(recursos)) {
            throw new Error("Recursos no disponibles para calcular coste")
          }
          // Pasar la sucursal al cálculo para obtener coste desde control de stock
          costeCalculado = calcularCosteVariante(
            receta,
            recursos,
            combinacion.valores,
            sucursal
          )
        } catch (costeError: any) {
          console.error("❌ [REGENERAR VARIANTES] Error calculando coste:", costeError)
          errores.push({
            message: `Error calculando coste: ${costeError?.message || 'Error desconocido'}`,
            combinacion: combinacion.combinacion,
            error: costeError
          })
          continue // Continuar con la siguiente variante
        }

        // Calcular precio (con validación de calculadora)
        let precioCalculado = 0
        try {
          precioCalculado = calcularPrecioVariante(
            costeCalculado,
            calculadora
          )
        } catch (precioError: any) {
          console.error("❌ [REGENERAR VARIANTES] Error calculando precio:", precioError)
          // Si falla el cálculo de precio, usar el coste como precio base
          precioCalculado = costeCalculado
          console.warn("⚠️ [REGENERAR VARIANTES] Usando coste como precio base debido a error en calculadora")
        }

        // Crear nueva variante (INSERT directo, no UPSERT)
        const payload = {
          producto_id: productoId,
          combinacion: combinacion.combinacion,
          coste_override: null,
          precio_override: null,
          margen_override: null,
          coste_calculado: costeCalculado,
          precio_calculado: precioCalculado
        }
        
        const { data: created, error: insertError } = await supabase
          .from('producto_variantes')
          .insert(payload)
          .select()
          .single()

        if (insertError) {
          console.error("❌ [REGENERAR VARIANTES] Error al crear variante:", {
            message: insertError.message,
            code: insertError.code,
            details: insertError.details,
            hint: insertError.hint,
            combinacion: combinacion.combinacion
          })
          
          errores.push({
            combinacion: combinacion.combinacion,
            error: {
              message: insertError.message,
              code: insertError.code,
              details: insertError.details,
              hint: insertError.hint
            }
          })
          continue
        }

        if (created) {
          variantesCreadas.push(created)
        } else {
          errores.push({
            message: 'INSERT no devolvió data pero tampoco error',
            combinacion: combinacion.combinacion
          })
        }
      } catch (error: any) {
        const errorMsg = {
          message: error?.message || 'Error procesando variante',
          stack: error?.stack,
          combinacion: combinacion.combinacion
        }
        console.error("❌ [REGENERAR VARIANTES] Error en catch procesando variante:", errorMsg)
        errores.push(errorMsg)
      }
    }

    // PASO 13: Validar resultado
    if (errores.length > 0 && variantesCreadas.length > 0) {
      console.warn(`⚠️ [REGENERAR VARIANTES] Se crearon ${variantesCreadas.length} variantes pero hubo ${errores.length} errores`)
    }

    if (variantesCreadas.length === 0 && combinaciones.length > 0) {
      console.error("❌ [REGENERAR VARIANTES] CRÍTICO: No se creó ninguna variante de", combinaciones.length, "combinaciones")
      console.error("❌ [REGENERAR VARIANTES] Errores capturados:", JSON.stringify(errores, null, 2))
      return NextResponse.json(
        { 
          success: false,
          error: 'No se pudieron crear las variantes',
          detalles: errores,
          combinaciones_intentadas: combinaciones.length,
          variantes_creadas: variantesCreadas.length,
          variantes: []
        },
        { status: 500 }
      )
    }

    console.log(`✅ [REGENERAR VARIANTES] Variantes regeneradas exitosamente: ${variantesCreadas.length} de ${combinaciones.length} combinaciones`)
    if (errores.length > 0) {
      console.warn(`⚠️ [REGENERAR VARIANTES] Hubo ${errores.length} errores al procesar variantes`)
    }
    
    // Respuesta detallada
    const respuesta = {
      success: variantesCreadas.length > 0 || errores.length === 0,
      variantes: variantesCreadas,
      combinaciones_intentadas: combinaciones.length,
      variantes_creadas: variantesCreadas.length,
      variantes_eliminadas: deletedCount || 0,
      errores: errores.length > 0 ? errores : undefined
    }
    
    console.log("📊 [REGENERAR VARIANTES] Respuesta final:", JSON.stringify(respuesta, null, 2))
    
    return NextResponse.json(respuesta, {
      status: variantesCreadas.length > 0 ? 200 : 500
    })
  } catch (error: any) {
    console.error('❌ [REGENERAR VARIANTES] Error regenerando variantes:', {
      message: error?.message,
      stack: error?.stack,
      error: error
    })
    return NextResponse.json(
      { 
        error: error?.message || 'Error al regenerar variantes',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    )
  }
}

