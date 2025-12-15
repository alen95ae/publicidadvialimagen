import { NextRequest, NextResponse } from 'next/server'
import { 
  crearAlquileresDesdeCotizacion, 
  getSoportesParaAlquiler,
  cancelarAlquileresCotizacion
} from '@/lib/helpersAlquileres'
import { getAlquileresPorCotizacion } from '@/lib/supabaseAlquileres'
import {
  getUsuarioAutenticado,
  verificarAccesoCotizacion,
  verificarSoporteExiste,
  validarYNormalizarLineas
} from '@/lib/cotizacionesBackend'
import { getLineasByCotizacionId } from '@/lib/supabaseCotizacionLineas'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cotizacionId } = await params
    console.log('🔍 [GET /api/cotizaciones/[id]/crear-alquileres] Obteniendo información de soportes para alquiler:', cotizacionId)

    // ============================================================================
    // C3: VALIDACIÓN DE SESIÓN Y AUTENTICACIÓN
    // ============================================================================
    const usuario = await getUsuarioAutenticado(request as NextRequest)
    if (!usuario) {
      return NextResponse.json(
        { success: false, error: 'No autorizado. Debes iniciar sesión.' },
        { status: 401 }
      )
    }

    // ============================================================================
    // C3: VERIFICAR ACCESO A LA COTIZACIÓN
    // ============================================================================
    const tieneAcceso = await verificarAccesoCotizacion(cotizacionId, usuario)
    if (!tieneAcceso) {
      return NextResponse.json(
        { success: false, error: 'No tienes permiso para ver esta cotización.' },
        { status: 403 }
      )
    }

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

    // ============================================================================
    // C3: VALIDACIÓN DE SESIÓN Y AUTENTICACIÓN
    // ============================================================================
    const usuario = await getUsuarioAutenticado(request as NextRequest)
    if (!usuario) {
      return NextResponse.json(
        { success: false, error: 'No autorizado. Debes iniciar sesión.' },
        { status: 401 }
      )
    }

    // ============================================================================
    // C3: VERIFICAR ACCESO A LA COTIZACIÓN
    // ============================================================================
    const tieneAcceso = await verificarAccesoCotizacion(cotizacionId, usuario)
    if (!tieneAcceso) {
      return NextResponse.json(
        { success: false, error: 'No tienes permiso para crear alquileres para esta cotización.' },
        { status: 403 }
      )
    }
    
    // Si es solo para calcular (para el modal), usar las líneas proporcionadas
    if (calcular_solo && lineas) {
      console.log('🔍 [POST /api/cotizaciones/[id]/crear-alquileres] Calculando alquileres para modal (sin crear):', cotizacionId)
      
      // ============================================================================
      // C6: VALIDAR Y NORMALIZAR LÍNEAS
      // ============================================================================
      const lineasNormalizadas = validarYNormalizarLineas(lineas)
      
      // ============================================================================
      // C6: VERIFICAR QUE LOS SOPORTES EXISTAN
      // ============================================================================
      for (const linea of lineasNormalizadas) {
        if (linea.tipo === 'Producto' && linea.es_soporte && linea.codigo_producto) {
          const soporteExiste = await verificarSoporteExiste(linea.codigo_producto)
          if (!soporteExiste) {
            return NextResponse.json(
              { success: false, error: `El soporte con código ${linea.codigo_producto} no existe.` },
              { status: 400 }
            )
          }
        }
      }
      
      // Simular el cálculo usando las líneas proporcionadas
      const { getSoportes } = await import('@/lib/supabaseSoportes')
      const { getCotizacionById } = await import('@/lib/supabaseCotizaciones')
      
      const cotizacion = await getCotizacionById(cotizacionId)
      const { data: todosSoportes } = await getSoportes({ limit: 10000 })
      
      const soportesInfo = []
      
      for (const linea of lineasNormalizadas) {
        if (!linea.codigo_producto || linea.tipo !== 'Producto' || !linea.es_soporte) continue
        
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
            meses = linea.cantidad || 1 // Preservar decimales (0.5 para 15 días)
            if (!linea.cantidad || linea.cantidad === 0) {
              const inicio = new Date(fechaInicio + 'T00:00:00')
              const fin = new Date(fechaFin + 'T00:00:00')
              const diffMs = fin.getTime() - inicio.getTime()
              const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
              
              // Si son exactamente 15 días, es 0.5 meses
              if (diffDias === 15) {
                meses = 0.5
              } else {
                const yearDiff = fin.getFullYear() - inicio.getFullYear()
                const monthDiff = fin.getMonth() - inicio.getMonth()
                meses = Math.max(1, yearDiff * 12 + monthDiff)
              }
            }
          } else {
            meses = linea.cantidad || 1 // Preservar decimales
            const inicio = new Date()
            inicio.setHours(0, 0, 0, 0)
            fechaInicio = inicio.toISOString().split('T')[0]
            const fin = new Date(inicio)
            if (meses === 0.5) {
              fin.setDate(fin.getDate() + 15)
            } else {
              fin.setMonth(fin.getMonth() + meses)
            }
            fechaFin = fin.toISOString().split('T')[0]
          }
        } else {
          meses = linea.cantidad || 1 // Preservar decimales
          const inicio = new Date()
          inicio.setHours(0, 0, 0, 0)
          fechaInicio = inicio.toISOString().split('T')[0]
          const fin = new Date(inicio)
          if (meses === 0.5) {
            fin.setDate(fin.getDate() + 15)
          } else {
            fin.setMonth(fin.getMonth() + meses)
          }
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
      console.log('✅ [POST /api/cotizaciones/[id]/crear-alquileres] Calculando alquileres completado:', soportesInfo.length, 'soportes')
      return NextResponse.json({
        success: true,
        data: {
          soportesInfo: soportesInfo || []
        }
      })
    }
    
    console.log('📝 [POST /api/cotizaciones/[id]/crear-alquileres] Creando alquileres para cotización:', cotizacionId)

    // ============================================================================
    // C5: VALIDAR QUE LAS LÍNEAS EXISTAN Y SEAN SOPORTES
    // ============================================================================
    const lineasCotizacion = await getLineasByCotizacionId(cotizacionId)
    const lineasSoportes = lineasCotizacion.filter(l => l.es_soporte === true)
    
    if (lineasSoportes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Esta cotización no tiene soportes para crear alquileres.' },
        { status: 400 }
      )
    }

    // Verificar que todos los soportes existan
    for (const linea of lineasSoportes) {
      if (linea.codigo_producto) {
        const soporteExiste = await verificarSoporteExiste(linea.codigo_producto)
        if (!soporteExiste) {
          return NextResponse.json(
            { success: false, error: `El soporte con código ${linea.codigo_producto} no existe.` },
            { status: 400 }
          )
        }
      }
    }

    // ============================================================================
    // C5: TRANSACCIÓN - Cancelar alquileres antiguos y crear nuevos
    // ============================================================================
    // Verificar si ya existen alquileres para esta cotización
    const alquileresExistentes = await getAlquileresPorCotizacion(cotizacionId)
    
    if (alquileresExistentes.length > 0) {
      console.log(`🔄 [POST /api/cotizaciones/[id]/crear-alquileres] Cancelando ${alquileresExistentes.length} alquiler(es) existente(s)`)
      await cancelarAlquileresCotizacion(cotizacionId, true) // Registrar historial
      console.log(`✅ [POST /api/cotizaciones/[id]/crear-alquileres] Alquileres antiguos cancelados`)
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

