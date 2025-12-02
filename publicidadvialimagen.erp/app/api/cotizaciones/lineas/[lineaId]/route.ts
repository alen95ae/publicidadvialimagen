import { NextRequest, NextResponse } from 'next/server'
import { getLineaById, updateLinea, deleteLinea } from '@/lib/supabaseCotizacionLineas'

export async function GET(
  request: NextRequest,
  { params }: { params: { lineaId: string } }
) {
  try {
    const lineaId = params.lineaId
    console.log('🔍 Obteniendo línea con ID:', lineaId)

    const linea = await getLineaById(lineaId)

    return NextResponse.json({
      success: true,
      data: linea
    })

  } catch (error) {
    console.error('❌ Error obteniendo línea:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error al obtener línea'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { lineaId: string } }
) {
  try {
    const lineaId = params.lineaId
    // ERROR #6: Manejar error en request.json() de forma robusta
    let body: any
    try {
      body = await request.json()
    } catch (jsonError) {
      console.error('❌ [PUT /api/cotizaciones/lineas/[lineaId]] Error parseando JSON:', jsonError)
      return NextResponse.json(
        {
          success: false,
          error: 'El cuerpo de la solicitud no es un JSON válido'
        },
        { status: 400 }
      )
    }
    console.log('📝 Actualizando línea:', lineaId)

    const lineaData: any = {}
    if (body.tipo !== undefined) lineaData.tipo = body.tipo
    if (body.codigo_producto !== undefined) lineaData.codigo_producto = body.codigo_producto
    if (body.nombre_producto !== undefined) lineaData.nombre_producto = body.nombre_producto
    if (body.descripcion !== undefined) lineaData.descripcion = body.descripcion
    if (body.cantidad !== undefined) lineaData.cantidad = body.cantidad
    if (body.ancho !== undefined) lineaData.ancho = body.ancho
    if (body.alto !== undefined) lineaData.alto = body.alto
    if (body.total_m2 !== undefined) lineaData.total_m2 = body.total_m2
    if (body.unidad_medida !== undefined) lineaData.unidad_medida = body.unidad_medida
    if (body.precio_unitario !== undefined) lineaData.precio_unitario = body.precio_unitario
    if (body.comision !== undefined || body.comision_porcentaje !== undefined) {
      lineaData.comision = body.comision || body.comision_porcentaje
    }
    if (body.con_iva !== undefined) lineaData.con_iva = body.con_iva
    if (body.con_it !== undefined) lineaData.con_it = body.con_it
    if (body.es_soporte !== undefined) lineaData.es_soporte = body.es_soporte
    if (body.orden !== undefined) lineaData.orden = body.orden
    if (body.imagen !== undefined) lineaData.imagen = body.imagen
    if (body.variantes !== undefined) {
      try {
        if (typeof body.variantes === 'string') {
          lineaData.variantes = JSON.parse(body.variantes)
        } else if (typeof body.variantes === 'object') {
          lineaData.variantes = body.variantes
        } else {
          lineaData.variantes = null
        }
      } catch (parseError) {
        console.warn('⚠️ [PUT /api/cotizaciones/lineas/[lineaId]] Error parseando variantes:', parseError)
        lineaData.variantes = null
      }
    }
    if (body.subtotal_linea !== undefined) lineaData.subtotal_linea = body.subtotal_linea

    const lineaActualizada = await updateLinea(lineaId, lineaData)

    return NextResponse.json({
      success: true,
      data: lineaActualizada
    })

  } catch (error) {
    console.error('❌ Error actualizando línea:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error al actualizar línea'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { lineaId: string } }
) {
  try {
    const lineaId = params.lineaId
    console.log('🗑️ Eliminando línea:', lineaId)

    await deleteLinea(lineaId)

    return NextResponse.json({
      success: true,
      message: 'Línea eliminada correctamente'
    })

  } catch (error) {
    console.error('❌ Error eliminando línea:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar línea' },
      { status: 500 }
    )
  }
}

