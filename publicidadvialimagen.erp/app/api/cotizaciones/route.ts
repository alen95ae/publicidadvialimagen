import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs' // Asegurar runtime Node.js para notificaciones
import {
  getCotizaciones,
  createCotizacion,
  updateCotizacion,
  deleteCotizacion,
  generarSiguienteCodigoCotizacion
} from '@/lib/supabaseCotizaciones'
import { createMultipleLineas } from '@/lib/supabaseCotizacionLineas'
import {
  getUsuarioAutenticado,
  verificarClienteExiste,
  verificarVendedorExiste,
  validarYNormalizarLineas,
  validarTotalFinal,
  calcularTotalFinalDesdeLineas,
  calcularDesgloseImpuestos,
  type CotizacionPayload
} from '@/lib/cotizacionesBackend'

export async function GET(request: NextRequest) {
  try {
    // Verificar permiso de ver cotizaciones
    const { requirePermiso } = await import('@/lib/permisos');
    const authResult = await requirePermiso("ventas", "ver");
    if (authResult instanceof Response) {
      return authResult;
    }

    const { searchParams } = new URL(request.url)
    const pageSize = parseInt(searchParams.get('pageSize') || '50')
    const page = parseInt(searchParams.get('page') || '1')
    const estado = searchParams.get('estado') || ''
    const cliente = searchParams.get('cliente') || ''
    const vendedor = searchParams.get('vendedor') || ''
    const search = searchParams.get('search') || ''


    // Obtener datos de Supabase
    const result = await getCotizaciones({
      estado: estado || undefined,
      cliente: cliente || undefined,
      vendedor: vendedor || undefined,
      search: search || undefined,
      page,
      limit: pageSize
    })

    console.log('📊 Cotizaciones data length:', result.data.length)
    console.log('📊 Cotizaciones count:', result.count)

    const total = result.count || 0
    const totalPages = Math.ceil(total / pageSize)

    const pagination = {
      page,
      limit: pageSize,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination
    })

  } catch (error) {
    console.error('❌ Error en API cotizaciones:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    const errorDetails = error instanceof Error ? error.stack : String(error)
    console.error('❌ Error details:', errorDetails)
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // ============================================================================
  // C1, C3: VALIDACIÓN DE SESIÓN Y AUTENTICACIÓN
  // ============================================================================
  // Verificar permiso de editar cotizaciones (permite crear nuevas)
  const { requirePermiso } = await import('@/lib/permisos');
  const authResult = await requirePermiso("ventas", "editar");
  if (authResult instanceof Response) {
    return authResult;
  }

  const usuario = await getUsuarioAutenticado(request)
  if (!usuario) {
    return NextResponse.json(
      { success: false, error: 'No autorizado. Debes iniciar sesión.' },
      { status: 401 }
    )
  }

  try {
    // ERROR #1: Manejar error en request.json() de forma robusta
    let body: CotizacionPayload
    try {
      body = await request.json() as CotizacionPayload
    } catch (jsonError) {
      console.error('❌ [POST /api/cotizaciones] Error parseando JSON:', jsonError)
      return NextResponse.json(
        {
          success: false,
          error: 'El cuerpo de la solicitud no es un JSON válido'
        },
        { status: 400 }
      )
    }

    // ============================================================================
    // C6: VALIDACIÓN Y NORMALIZACIÓN DE LÍNEAS
    // ============================================================================
    const lineasRaw = body.lineas || []
    const lineasNormalizadas = validarYNormalizarLineas(lineasRaw)

    if (lineasNormalizadas.length === 0 && lineasRaw.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Todas las líneas son inválidas. Verifica los datos enviados.' },
        { status: 400 }
      )
    }

    // ============================================================================
    // C1: VALIDACIÓN DE TOTAL_FINAL
    // ============================================================================
    const totalFinalManual = body.total_final
    if (totalFinalManual !== null && totalFinalManual !== undefined) {
      if (!validarTotalFinal(totalFinalManual, lineasNormalizadas)) {
        return NextResponse.json(
          { success: false, error: 'El total_final no coincide con la suma de las líneas. Verifica los cálculos.' },
          { status: 400 }
        )
      }
    }

    // ============================================================================
    // VALIDACIÓN DE CLIENTE Y VENDEDOR
    // ============================================================================
    if (body.cliente) {
      const clienteExiste = await verificarClienteExiste(body.cliente)
      if (!clienteExiste) {
        console.warn('⚠️ [POST /api/cotizaciones] Cliente no encontrado, pero continuando (puede ser nombre)')
      }
    }

    if (body.vendedor) {
      const vendedorExiste = await verificarVendedorExiste(body.vendedor)
      if (!vendedorExiste) {
        console.warn('⚠️ [POST /api/cotizaciones] Vendedor no encontrado, pero continuando (puede ser nombre)')
      }
    }

    // Generar código si no viene en el body
    let codigo = body.codigo
    if (!codigo) {
      codigo = await generarSiguienteCodigoCotizacion()
      console.log('🔢 [POST /api/cotizaciones] Código generado:', codigo)
    }

    // ============================================================================
    // CÁLCULO DE TOTALES (misma lógica que antes)
    // ============================================================================
    const { subtotal, totalIVA, totalIT } = calcularDesgloseImpuestos(lineasNormalizadas)
    
    // REGLA 10: Si hay total_final manual, usarlo DIRECTAMENTE
    // Si no, usar la suma de subtotal_linea (que ya son totales finales)
    const totalFinal = totalFinalManual !== undefined && totalFinalManual !== null
      ? totalFinalManual
      : calcularTotalFinalDesdeLineas(lineasNormalizadas)

    if (totalFinalManual !== undefined && totalFinalManual !== null) {
      console.log('💰 [POST /api/cotizaciones] Usando total_final manual (NO recalcula):', totalFinalManual)
    } else {
      console.log('💰 [POST /api/cotizaciones] Calculando total_final desde subtotales:', totalFinal)
      console.log('💰 [POST /api/cotizaciones] Subtotal:', subtotal, 'IVA:', totalIVA, 'IT:', totalIT)
    }

    // Validar comprobante obligatorio (factura | nota de remision)
    const comprobanteValido = body.comprobante === 'factura' || body.comprobante === 'nota de remision'
    if (!comprobanteValido) {
      return NextResponse.json(
        { success: false, error: 'El campo Comprobante es obligatorio. Debe ser "factura" o "nota de remision".' },
        { status: 400 }
      )
    }

    // Limpiar campos que no existen en Supabase antes de crear
    const { vigencia_dias, ...camposLimpios } = body

    // ============================================================================
    // C4: TRANSACCIÓN - Crear cotización y líneas juntos
    // ============================================================================
    let nuevaCotizacion: any = null
    let lineasCreadas: any[] = []

    try {
      // Paso 1: Crear la cotización (encabezado)
      nuevaCotizacion = await createCotizacion({
        codigo,
        cliente: camposLimpios.cliente || '',
        vendedor: camposLimpios.vendedor || '',
        sucursal: camposLimpios.sucursal || 'La Paz',
        estado: camposLimpios.estado || 'Pendiente',
        subtotal,
        total_iva: totalIVA,
        total_it: totalIT,
        total_final: totalFinal,
        vigencia: vigencia_dias || 30,
        plazo: camposLimpios.plazo || null,
        comprobante: body.comprobante,
        cantidad_items: lineasNormalizadas.length,
        lineas_cotizacion: lineasNormalizadas.length
      })


      // Notificación de cotización creada ELIMINADA según requerimientos

      // Paso 2: Crear las líneas de cotización
      if (lineasNormalizadas.length > 0) {
        const lineasData = lineasNormalizadas.map((linea) => ({
          cotizacion_id: nuevaCotizacion.id,
          tipo: linea.tipo,
          codigo_producto: linea.codigo_producto || null,
          nombre_producto: linea.nombre_producto || null,
          descripcion: linea.descripcion || null,
          cantidad: linea.cantidad,
          ancho: linea.ancho || null,
          alto: linea.alto || null,
          total_m2: linea.total_m2 || null,
          unidad_medida: linea.unidad_medida || 'm²',
          precio_unitario: linea.precio_unitario,
          comision: linea.comision_porcentaje || linea.comision || 0,
          con_iva: linea.con_iva,
          con_it: linea.con_it,
          es_soporte: linea.es_soporte || false,
          orden: linea.orden || 0,
          imagen: linea.imagen || null,
          variantes: linea.variantes || null,
          subtotal_linea: linea.subtotal_linea
        }))

        lineasCreadas = await createMultipleLineas(lineasData)

        // Actualizar lineas_cotizacion en el encabezado con el número real de líneas creadas
        if (lineasCreadas.length > 0) {
          await updateCotizacion(nuevaCotizacion.id, {
            lineas_cotizacion: lineasCreadas.length,
            cantidad_items: lineasCreadas.length
          })
        }
      }

      // Éxito: retornar respuesta
      return NextResponse.json({
        success: true,
        data: {
          cotizacion: nuevaCotizacion,
          lineas: lineasCreadas
        }
      })

    } catch (errorCrear) {
      // C4: ROLLBACK - Si falla la creación de líneas, eliminar la cotización
      if (nuevaCotizacion) {
        console.error('❌ [POST /api/cotizaciones] Error creando líneas, eliminando cotización:', errorCrear)
        try {
          await deleteCotizacion(nuevaCotizacion.id)
        } catch (deleteError) {
          console.error('❌ [POST /api/cotizaciones] Error eliminando cotización después de fallo:', deleteError)
        }
      }
      throw errorCrear
    }

  } catch (error) {
    console.error('❌ [POST /api/cotizaciones] Error creando cotización:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error al crear cotización'
    const errorDetails = error instanceof Error ? error.stack : String(error)
    console.error('❌ [POST /api/cotizaciones] Error details:', errorDetails)
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      { status: 500 }
    )
  }
}
