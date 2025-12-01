import { NextRequest, NextResponse } from 'next/server'
import { 
  crearAlquileresDesdeCotizacion, 
  getSoportesParaAlquiler,
  cancelarAlquileresCotizacion
} from '@/lib/helpersAlquileres'
import { getAlquileresPorCotizacion } from '@/lib/supabaseAlquileres'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cotizacionId } = await params
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
    const errorStack = error instanceof Error ? error.stack : undefined
    
    // 🔥 GARANTIZAR JSON VÁLIDO SIEMPRE
    return NextResponse.json({
      success: false,
      error: "ERROR_OBTENIENDO_SOPORTES",
      message: errorMessage,
      ...(errorStack && { stack: errorStack })
    }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cotizacionId } = await params
    const body = await request.json().catch(() => ({}))
    const { calcular_solo, lineas } = body
    
    // Si es solo para calcular (para el modal), usar las líneas proporcionadas
    if (calcular_solo && lineas) {
      console.log('🔍 Calculando alquileres para modal (sin crear):', cotizacionId)
      
      // Simular el cálculo usando las líneas proporcionadas
      const { getSoportes } = await import('@/lib/supabaseSoportes')
      const { getCotizacionById } = await import('@/lib/supabaseCotizaciones')
      
      const cotizacion = await getCotizacionById(cotizacionId)
      const { data: todosSoportes } = await getSoportes({ limit: 10000 })
      
      const soportesInfo = []
      
      for (const linea of lineas) {
        if (!linea.codigo_producto) continue
        
        const soporte = todosSoportes.find((s: any) => s.codigo === linea.codigo_producto)
        if (!soporte) continue
        
        let fechaInicio = new Date().toISOString().split('T')[0]
        let fechaFin = new Date().toISOString().split('T')[0]
        let meses = 1
        
        if (linea.descripcion) {
          const fechaMatch = linea.descripcion.match(/Del (\d{4}-\d{2}-\d{2}) al (\d{4}-\d{2}-\d{2})/)
          if (fechaMatch) {
            fechaInicio = fechaMatch[1]
            fechaFin = fechaMatch[2]
            meses = Math.ceil(linea.cantidad || 1)
            if (!linea.cantidad || linea.cantidad === 0) {
              const inicio = new Date(fechaInicio + 'T00:00:00')
              const fin = new Date(fechaFin + 'T00:00:00')
              const yearDiff = fin.getFullYear() - inicio.getFullYear()
              const monthDiff = fin.getMonth() - inicio.getMonth()
              meses = Math.max(1, yearDiff * 12 + monthDiff)
            }
          } else {
            meses = Math.ceil(linea.cantidad || 1)
            const inicio = new Date()
            inicio.setHours(0, 0, 0, 0)
            fechaInicio = inicio.toISOString().split('T')[0]
            const fin = new Date(inicio)
            fin.setMonth(fin.getMonth() + meses)
            fechaFin = fin.toISOString().split('T')[0]
          }
        } else {
          meses = Math.ceil(linea.cantidad || 1)
          const inicio = new Date()
          inicio.setHours(0, 0, 0, 0)
          fechaInicio = inicio.toISOString().split('T')[0]
          const fin = new Date(inicio)
          fin.setMonth(fin.getMonth() + meses)
          fechaFin = fin.toISOString().split('T')[0]
        }
        
        soportesInfo.push({
          soporte: {
            codigo: soporte.codigo,
            titulo: soporte.titulo
          },
          fechaInicio,
          fechaFin,
          meses,
          importe: linea.subtotal_linea || 0
        })
      }
      
      // 🔥 GARANTIZAR JSON VÁLIDO SIEMPRE
      console.log('✅ Calculando alquileres completado:', soportesInfo.length, 'soportes')
      return NextResponse.json({
        success: true,
        data: {
          soportesInfo: soportesInfo || []
        }
      })
    }
    
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
    const errorStack = error instanceof Error ? error.stack : undefined
    
    // 🔥 GARANTIZAR JSON VÁLIDO SIEMPRE
    return NextResponse.json({
      success: false,
      error: "ERROR_CREANDO_ALQUILERES",
      message: errorMessage,
      ...(errorStack && { stack: errorStack })
    }, { status: 500 })
  }
}

