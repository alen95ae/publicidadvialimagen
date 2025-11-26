import { NextRequest, NextResponse } from 'next/server'
import { 
  getCotizaciones, 
  createCotizacion, 
  updateCotizacion,
  generarSiguienteCodigoCotizacion
} from '@/lib/supabaseCotizaciones'
import { createMultipleLineas } from '@/lib/supabaseCotizacionLineas'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const pageSize = parseInt(searchParams.get('pageSize') || '50')
    const page = parseInt(searchParams.get('page') || '1')
    const estado = searchParams.get('estado') || ''
    const cliente = searchParams.get('cliente') || ''
    const vendedor = searchParams.get('vendedor') || ''

    console.log('🔍 Cotizaciones search params:', { pageSize, page, estado, cliente, vendedor })

    // Obtener datos de Supabase
    const result = await getCotizaciones({ 
      estado: estado || undefined,
      cliente: cliente || undefined,
      vendedor: vendedor || undefined,
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
  try {
    const body = await request.json()
    console.log('📝 Creando nueva cotización:', JSON.stringify(body, null, 2))

    // Generar código si no viene en el body
    let codigo = body.codigo
    if (!codigo) {
      codigo = await generarSiguienteCodigoCotizacion()
      console.log('🔢 Código generado:', codigo)
    }

    // Extraer líneas del body
    const lineas = body.lineas || []
    delete body.lineas

    // Calcular totales
    let subtotal = 0
    let totalIVA = 0
    let totalIT = 0

    lineas.forEach((linea: any) => {
      // Si es producto, tiene subtotal_linea
      if (linea.tipo === 'Producto' || linea.tipo === 'producto') {
        const lineaSubtotal = linea.subtotal_linea || 0
        subtotal += lineaSubtotal

        if (linea.con_iva) {
          totalIVA += lineaSubtotal * 0.13
        }
        if (linea.con_it) {
          totalIT += lineaSubtotal * 0.03
        }
      }
    })

    const totalFinal = subtotal + totalIVA + totalIT

    // Limpiar campos que no existen en Supabase antes de crear
    const { vigencia_dias, ...camposLimpios } = body
    
    // Crear la cotización (encabezado) - Solo campos que existen en Supabase
    const nuevaCotizacion = await createCotizacion({
      codigo,
      cliente: camposLimpios.cliente || '',
      vendedor: camposLimpios.vendedor || '',
      sucursal: camposLimpios.sucursal || 'La Paz',
      estado: camposLimpios.estado || 'Pendiente',
      subtotal,
      total_iva: totalIVA,
      total_it: totalIT,
      total_final: totalFinal,
      vigencia: vigencia_dias || 30, // Frontend envía vigencia_dias, mapeamos a vigencia
      cantidad_items: lineas.length,
      lineas_cotizacion: lineas.length
    })

    console.log('✅ Cotización creada correctamente:', nuevaCotizacion.id)

    // Crear las líneas de cotización
    let lineasCreadas = []
    if (lineas.length > 0) {
      try {
        // Mapear líneas al formato de Supabase
        const lineasData = lineas.map((linea: any, index: number) => {
          // Manejar variantes: convertir string a objeto si es necesario
          let variantesParsed = null
          if (linea.variantes) {
            try {
              if (typeof linea.variantes === 'string') {
                variantesParsed = JSON.parse(linea.variantes)
              } else if (typeof linea.variantes === 'object') {
                variantesParsed = linea.variantes
              }
            } catch (parseError) {
              console.warn('⚠️ [POST /api/cotizaciones] Error parseando variantes:', parseError)
              variantesParsed = null
            }
          }

          return {
            cotizacion_id: nuevaCotizacion.id,
            tipo: linea.tipo || 'Producto',
            codigo_producto: linea.codigo_producto || null,
            nombre_producto: linea.nombre_producto || null,
            descripcion: linea.descripcion || null,
            cantidad: linea.cantidad || 0,
            ancho: linea.ancho || null,
            alto: linea.alto || null,
            total_m2: linea.total_m2 || null,
            unidad_medida: linea.unidad_medida || 'm²',
            precio_unitario: linea.precio_unitario || 0,
            comision: linea.comision_porcentaje || linea.comision || 0, // Frontend envía comision_porcentaje, mapeamos a comision
            con_iva: linea.con_iva !== undefined ? linea.con_iva : true,
            con_it: linea.con_it !== undefined ? linea.con_it : true,
            es_soporte: linea.es_soporte || false,
            orden: linea.orden || index + 1,
            imagen: linea.imagen || null,
            variantes: variantesParsed, // JSONB en Supabase
            subtotal_linea: linea.subtotal_linea || 0
          }
        })

        lineasCreadas = await createMultipleLineas(lineasData)
        console.log('✅ Líneas creadas correctamente:', lineasCreadas.length)
        
        // Actualizar lineas_cotizacion en el encabezado con el número real de líneas creadas
        if (lineasCreadas.length > 0) {
          await updateCotizacion(nuevaCotizacion.id, {
            lineas_cotizacion: lineasCreadas.length,
            cantidad_items: lineasCreadas.length
          })
        }
      } catch (lineaError) {
        // Si falla la creación de líneas, eliminar la cotización
        console.error('❌ Error creando líneas, eliminando cotización:', lineaError)
        try {
          const { deleteCotizacion } = await import('@/lib/supabaseCotizaciones')
          await deleteCotizacion(nuevaCotizacion.id)
        } catch (deleteError) {
          console.error('❌ Error eliminando cotización después de fallo:', deleteError)
        }
        throw new Error('Error al crear líneas de cotización: ' + (lineaError instanceof Error ? lineaError.message : 'Error desconocido'))
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        cotizacion: nuevaCotizacion,
        lineas: lineasCreadas
      }
    })

  } catch (error) {
    console.error('❌ Error creando cotización:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error al crear cotización'
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
