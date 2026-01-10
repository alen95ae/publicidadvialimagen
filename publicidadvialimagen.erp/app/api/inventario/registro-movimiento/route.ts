/**
 * API para registro manual de movimientos de stock
 * Registra movimientos y actualiza stock + historial
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabaseServer'
import { insertarHistorialStock, obtenerUsuarioActual } from '@/lib/supabaseHistorialStock'
import { generarClaveVariante } from '@/lib/variantes/generarCombinaciones'

const supabase = getSupabaseServer()

function round2(num: number): number {
  return Math.round(num * 100) / 100
}

interface MovimientoLinea {
  tipoItem: "insumo" | "consumible"
  itemId: string
  itemNombre: string
  itemCodigo: string
  opcion: "UdM" | "formato"
  formatoId: string | null
  formatoTexto: string | null
  cantidadFormato: number | null
  cantidadUdM: number
  unidadMedida: string
  impacto: "+" | "-"
}

interface MovimientoPayload {
  tipoMovimiento: string
  fecha: string
  referencia: string | null
  observaciones: string | null
  sucursal: string
  lineas: MovimientoLinea[]
}

export async function POST(request: NextRequest) {
  try {
    const body: MovimientoPayload = await request.json()

    // Validaciones básicas
    if (!body.tipoMovimiento) {
      return NextResponse.json(
        { success: false, error: 'Tipo de movimiento es requerido' },
        { status: 400 }
      )
    }

    if (!body.lineas || body.lineas.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Debe haber al menos una línea de movimiento' },
        { status: 400 }
      )
    }

    if (!body.sucursal) {
      return NextResponse.json(
        { success: false, error: 'Sucursal es requerida' },
        { status: 400 }
      )
    }

    const usuario = await obtenerUsuarioActual(request)
    // Si la fecha viene sin zona horaria, usar la hora exacta del momento de guardar (ISO format)
    const ahora = new Date()
    const fechaMovimiento = body.fecha 
      ? (body.fecha.includes('T') ? body.fecha : `${body.fecha}T${ahora.toISOString().split('T')[1]}`)
      : ahora.toISOString()

    // Generar código de referencia si no existe (formato MOV-0000)
    let referenciaCodigo = body.referencia
    if (!referenciaCodigo) {
      // Buscar el último código MOV-XXXX para generar el siguiente
      const { data: ultimosMovimientos } = await supabase
        .from('historial_stock')
        .select('referencia_codigo')
        .like('referencia_codigo', 'MOV-%')
        .order('created_at', { ascending: false })
        .limit(100)
      
      // Extraer números de los códigos MOV-XXXX
      const numeros = (ultimosMovimientos || [])
        .map((record: any) => {
          const match = record.referencia_codigo?.match(/^MOV-(\d+)$/)
          return match ? parseInt(match[1], 10) : 0
        })
        .filter((n: number) => !isNaN(n) && n > 0)
      
      const siguienteNumero = numeros.length > 0 ? Math.max(...numeros) + 1 : 1
      referenciaCodigo = `MOV-${siguienteNumero.toString().padStart(4, '0')}`
    }

    // Procesar cada línea
    for (const linea of body.lineas) {
      try {
        const cantidad = linea.cantidadUdM
        const impacto = linea.impacto === '+' ? 1 : -1
        const cantidadConSigno = cantidad * impacto

        if (linea.tipoItem === 'insumo') {
          // Procesar recurso
          const { data: recurso, error: recursoError } = await supabase
            .from('recursos')
            .select('id, codigo, nombre, control_stock, unidad_medida, formato')
            .eq('id', linea.itemId)
            .single()

          if (recursoError || !recurso) {
            console.error(`❌ Recurso no encontrado: ${linea.itemId}`, recursoError)
            continue
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

          // Obtener stock actual (sin variantes para registro manual)
          const claveVariante = generarClaveVariante({ Sucursal: body.sucursal })
          const datosVariante = controlStock[claveVariante] || {}
          const stockActual = Number(datosVariante.stock) || 0

          // Calcular nuevo stock
          const nuevoStock = round2(stockActual + cantidadConSigno)

          // Actualizar control_stock
          controlStock[claveVariante] = {
            ...datosVariante,
            stock: nuevoStock
          }

          // Guardar en Supabase
          const { error: updateError } = await supabase
            .from('recursos')
            .update({ control_stock: controlStock })
            .eq('id', linea.itemId)

          if (updateError) {
            console.error(`❌ Error actualizando stock de recurso ${linea.itemId}:`, updateError)
            continue
          }

          // Registrar en historial
          const impactoNumerico = linea.impacto === '+' ? cantidad : -cantidad
          
          // Si se usó formato, guardar información adicional
          let formatoHistorial: any = null
          if (linea.opcion === 'formato' && linea.formatoId && linea.formatoTexto && linea.cantidadFormato) {
            formatoHistorial = {
              formato_completo: recurso.formato || null,
              formato_seleccionado: linea.formatoTexto,
              cantidad_formato: linea.cantidadFormato,
              formato_id: linea.formatoId
            }
          } else if (linea.formatoId) {
            formatoHistorial = recurso.formato || null
          }
          
          await insertarHistorialStock({
            fecha: fechaMovimiento,
            origen: 'registro_manual',
            referencia_id: null,
            referencia_codigo: referenciaCodigo,
            item_tipo: 'Recurso',
            item_id: recurso.id,
            item_codigo: recurso.codigo || '',
            item_nombre: recurso.nombre || '',
            sucursal: body.sucursal,
            formato: formatoHistorial,
            cantidad_udm: cantidad,
            unidad_medida: recurso.unidad_medida || '',
            impacto: impactoNumerico,
            stock_anterior: stockActual,
            stock_nuevo: nuevoStock,
            tipo_movimiento: body.tipoMovimiento || 'Movimiento inventario',
            observaciones: body.observaciones || null,
            usuario_id: usuario.id,
            usuario_nombre: usuario.nombre
          })
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/0c38a0dd-0488-46f2-9e99-19064c1193dd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'registro-movimiento/route.ts:154',message:'API registro-movimiento DESPUÉS de insertarHistorialStock (Recurso)',data:{itemId:recurso.id,success:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
          // #endregion

        } else if (linea.tipoItem === 'consumible') {
          // Procesar consumible
          const { data: consumible, error: consumibleError } = await supabase
            .from('consumibles')
            .select('id, codigo, nombre, stock, unidad_medida, formato')
            .eq('id', linea.itemId)
            .single()

          if (consumibleError || !consumible) {
            console.error(`❌ Consumible no encontrado: ${linea.itemId}`, consumibleError)
            continue
          }

          // Obtener stock actual
          const stockActual = Number(consumible.stock) || 0

          // Calcular nuevo stock
          const nuevoStock = round2(stockActual + cantidadConSigno)

          // Actualizar stock
          const { error: updateError } = await supabase
            .from('consumibles')
            .update({ stock: nuevoStock })
            .eq('id', linea.itemId)

          if (updateError) {
            console.error(`❌ Error actualizando stock de consumible ${linea.itemId}:`, updateError)
            continue
          }

          // Registrar en historial
          const impactoNumerico = linea.impacto === '+' ? cantidad : -cantidad
          
          // Si se usó formato, guardar información adicional
          let formatoHistorial: any = null
          if (linea.opcion === 'formato' && linea.formatoId && linea.formatoTexto && linea.cantidadFormato) {
            formatoHistorial = {
              formato_completo: consumible.formato || null,
              formato_seleccionado: linea.formatoTexto,
              cantidad_formato: linea.cantidadFormato,
              formato_id: linea.formatoId
            }
          } else if (linea.formatoId) {
            formatoHistorial = consumible.formato || null
          }
          
          await insertarHistorialStock({
            fecha: fechaMovimiento,
            origen: 'registro_manual',
            referencia_id: null,
            referencia_codigo: referenciaCodigo,
            item_tipo: 'Consumible',
            item_id: consumible.id,
            item_codigo: consumible.codigo || '',
            item_nombre: consumible.nombre || '',
            sucursal: body.sucursal,
            formato: formatoHistorial,
            cantidad_udm: cantidad,
            unidad_medida: consumible.unidad_medida || '',
            impacto: impactoNumerico,
            stock_anterior: stockActual,
            stock_nuevo: nuevoStock,
            tipo_movimiento: body.tipoMovimiento || 'Movimiento inventario',
            observaciones: body.observaciones || null,
            usuario_id: usuario.id,
            usuario_nombre: usuario.nombre
          })
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/0c38a0dd-0488-46f2-9e99-19064c1193dd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'registro-movimiento/route.ts:206',message:'API registro-movimiento DESPUÉS de insertarHistorialStock (Consumible)',data:{itemId:consumible.id,success:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
          // #endregion
        }
      } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/0c38a0dd-0488-46f2-9e99-19064c1193dd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'registro-movimiento/route.ts:209',message:'API registro-movimiento CATCH ERROR',data:{error:error instanceof Error?error.message:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        console.error(`❌ Error procesando línea:`, error)
        // Continuar con siguiente línea
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Movimiento registrado correctamente',
      referencia_codigo: referenciaCodigo
    })

  } catch (error) {
    console.error('❌ Error en registro de movimiento:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error al registrar movimiento'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
