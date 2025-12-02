import { NextRequest, NextResponse } from 'next/server'
import { getLineasByCotizacionId, createLinea, createMultipleLineas } from '@/lib/supabaseCotizacionLineas'
import { getCotizacionById } from '@/lib/supabaseCotizaciones'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cotizacionId = params.id
    console.log('🔍 Obteniendo líneas para cotización:', cotizacionId)

    // Verificar que la cotización existe
    await getCotizacionById(cotizacionId)

    // Obtener las líneas
    const lineas = await getLineasByCotizacionId(cotizacionId)

    return NextResponse.json({
      success: true,
      data: lineas
    })

  } catch (error) {
    console.error('❌ Error obteniendo líneas:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error al obtener líneas'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cotizacionId = params.id
    // ERROR #6: Manejar error en request.json() de forma robusta
    let body: any
    try {
      body = await request.json()
    } catch (jsonError) {
      console.error('❌ [POST /api/cotizaciones/[id]/lineas] Error parseando JSON:', jsonError)
      return NextResponse.json(
        {
          success: false,
          error: 'El cuerpo de la solicitud no es un JSON válido'
        },
        { status: 400 }
      )
    }
    console.log('📝 Creando línea para cotización:', cotizacionId)

    // Verificar que la cotización existe
    await getCotizacionById(cotizacionId)

    // Si es un array, crear múltiples líneas
    if (Array.isArray(body)) {
      const lineasData = body.map((linea: any, index: number) => {
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
            console.warn('⚠️ [POST /api/cotizaciones/[id]/lineas] Error parseando variantes:', parseError)
            variantesParsed = null
          }
        }

        return {
          cotizacion_id: cotizacionId,
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

      const lineasCreadas = await createMultipleLineas(lineasData)
      return NextResponse.json({
        success: true,
        data: lineasCreadas
      })
    } else {
      // Manejar variantes: convertir string a objeto si es necesario
      let variantesParsed = null
      if (body.variantes) {
        try {
          if (typeof body.variantes === 'string') {
            variantesParsed = JSON.parse(body.variantes)
          } else if (typeof body.variantes === 'object') {
            variantesParsed = body.variantes
          }
        } catch (parseError) {
          console.warn('⚠️ [POST /api/cotizaciones/[id]/lineas] Error parseando variantes:', parseError)
          variantesParsed = null
        }
      }

      // Crear una sola línea
      const lineaData = {
        cotizacion_id: cotizacionId,
        tipo: body.tipo || 'Producto',
        codigo_producto: body.codigo_producto || null,
        nombre_producto: body.nombre_producto || null,
        descripcion: body.descripcion || null,
        cantidad: body.cantidad || 0,
        ancho: body.ancho || null,
        alto: body.alto || null,
        total_m2: body.total_m2 || null,
        unidad_medida: body.unidad_medida || 'm²',
        precio_unitario: body.precio_unitario || 0,
        comision: body.comision_porcentaje || body.comision || 0, // Frontend envía comision_porcentaje, mapeamos a comision
        con_iva: body.con_iva !== undefined ? body.con_iva : true,
        con_it: body.con_it !== undefined ? body.con_it : true,
        es_soporte: body.es_soporte || false,
        orden: body.orden || 0,
        imagen: body.imagen || null,
        variantes: variantesParsed, // JSONB en Supabase
        subtotal_linea: body.subtotal_linea || 0
      }

      const lineaCreada = await createLinea(lineaData)
      return NextResponse.json({
        success: true,
        data: lineaCreada
      })
    }

  } catch (error) {
    console.error('❌ Error creando línea:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error al crear línea'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

