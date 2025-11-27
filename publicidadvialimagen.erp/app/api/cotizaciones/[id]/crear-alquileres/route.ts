import { NextRequest, NextResponse } from 'next/server'
import { 
  crearAlquileresDesdeCotizacion, 
  getSoportesParaAlquiler,
  cancelarAlquileresCotizacion
} from '@/lib/helpersAlquileres'
import { getAlquileresPorCotizacion } from '@/lib/supabaseAlquileres'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cotizacionId = params.id
    console.log('🔍 Obteniendo información de soportes para alquiler:', cotizacionId)

    const { cotizacion, soportesInfo } = await getSoportesParaAlquiler(cotizacionId)

    return NextResponse.json({
      success: true,
      data: {
        cotizacion,
        soportesInfo: soportesInfo.map(info => ({
          soporte: {
            codigo: info.soporte.codigo,
            titulo: info.soporte.titulo
          },
          fechaInicio: info.fechaInicio,
          fechaFin: info.fechaFin,
          meses: info.meses,
          importe: info.importe
        }))
      }
    })

  } catch (error) {
    console.error('❌ Error obteniendo información de soportes:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error al obtener información de soportes'
    
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
    console.log('📝 Creando alquileres para cotización:', cotizacionId)

    // Verificar si ya existen alquileres para esta cotización
    const alquileresExistentes = await getAlquileresPorCotizacion(cotizacionId)
    
    if (alquileresExistentes.length > 0) {
      await cancelarAlquileresCotizacion(cotizacionId)
    }

    // Crear nuevos alquileres
    const result = await crearAlquileresDesdeCotizacion(cotizacionId)

    return NextResponse.json({
      success: true,
      data: result,
      alquileresAntiguosCancelados: alquileresExistentes.length
    })

  } catch (error) {
    console.error('❌ Error creando alquileres:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error al crear alquileres'
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

