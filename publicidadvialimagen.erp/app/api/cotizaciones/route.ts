import { NextRequest, NextResponse } from 'next/server'
import { 
  getCotizaciones, 
  createCotizacion, 
  generarSiguienteCodigoCotizacion
} from '@/lib/airtableCotizaciones'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const pageSize = parseInt(searchParams.get('pageSize') || '50')
    const offset = searchParams.get('offset') || undefined
    const estado = searchParams.get('estado') || ''
    const cliente = searchParams.get('cliente') || ''

    console.log('🔍 Cotizaciones search params:', { pageSize, offset, estado, cliente })

    // Construir filtro de Airtable
    let filterByFormula = ''
    const filters: string[] = []

    if (estado) {
      filters.push(`{Estado} = '${estado}'`)
    }
    if (cliente) {
      filters.push(`SEARCH(LOWER('${cliente}'), LOWER({Cliente})) > 0`)
    }

    if (filters.length > 0) {
      filterByFormula = filters.length > 1 
        ? `AND(${filters.join(', ')})`
        : filters[0]
    }

    // Obtener datos de Airtable
    const result = await getCotizaciones({ 
      pageSize, 
      offset,
      filterByFormula: filterByFormula || undefined
    })

    console.log('📊 Cotizaciones data length:', result.cotizaciones.length)
    console.log('📊 Cotizaciones offset:', result.offset)

    return NextResponse.json({
      success: true,
      data: result.cotizaciones,
      offset: result.offset,
      hasMore: !!result.offset
    })

  } catch (error) {
    console.error('❌ Error en API cotizaciones:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
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

    // Extraer líneas del body (ya vienen en formato ItemLista)
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

    // Crear la cotización con líneas en JSON
    const nuevaCotizacion = await createCotizacion({
      codigo,
      cliente: body.cliente || '',
      vendedor: body.vendedor || '',
      sucursal: body.sucursal || 'La Paz',
      estado: body.estado || 'Pendiente',
      subtotal,
      total_iva: totalIVA,
      total_it: totalIT,
      total_final: totalFinal,
      notas_generales: body.notas_generales || '',
      terminos_condiciones: body.terminos_condiciones || '',
      vigencia_dias: body.vigencia_dias || 30,
      lineas_json: lineas // Guardar directamente como JSON
    })

    console.log('✅ Cotización creada correctamente:', nuevaCotizacion.id)

    return NextResponse.json({
      success: true,
      data: {
        cotizacion: nuevaCotizacion,
        lineas: nuevaCotizacion.lineas_json || []
      }
    })

  } catch (error) {
    console.error('❌ Error creando cotización:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error al crear cotización'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

