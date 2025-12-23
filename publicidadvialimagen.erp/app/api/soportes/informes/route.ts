export const runtime = "nodejs";

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabaseServer'

// Endpoint para obtener el rango de fechas de los alquileres
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  
  // Si es para obtener el rango de fechas
  if (action === 'rango-fechas') {
    try {
      const supabase = getSupabaseServer()
      
      // Obtener la fecha de inicio más antigua
      const { data: minData, error: minError } = await supabase
        .from('alquileres')
        .select('inicio')
        .order('inicio', { ascending: true })
        .limit(1)
      
      // Obtener la fecha de fin más futura
      const { data: maxData, error: maxError } = await supabase
        .from('alquileres')
        .select('fin')
        .order('fin', { ascending: false })
        .limit(1)
      
      if (minError || maxError) {
        throw minError || maxError
      }
      
      const fechaMinima = minData && minData.length > 0 ? minData[0].inicio : new Date().toISOString().split('T')[0]
      const fechaMaxima = maxData && maxData.length > 0 ? maxData[0].fin : new Date().toISOString().split('T')[0]
      
      return NextResponse.json({
        success: true,
        data: {
          fechaMinima,
          fechaMaxima
        }
      })
    } catch (error) {
      console.error('❌ Error obteniendo rango de fechas:', error)
      return NextResponse.json(
        { success: false, error: 'Error al obtener rango de fechas' },
        { status: 500 }
      )
    }
  }

  // Código existente para obtener estadísticas
  try {
    const { searchParams } = new URL(request.url)
    const fecha_inicio = searchParams.get('fecha_inicio') || undefined
    const fecha_fin = searchParams.get('fecha_fin') || undefined
    const tipo = searchParams.get('tipo') || undefined // 'vendedor', 'cliente', 'soporte', 'ciudad', 'estado'

    const supabase = getSupabaseServer()

    // Construir query base
    let query = supabase
      .from('alquileres')
      .select('id, vendedor, cliente, estado, soporte_id, total, meses, inicio, fin')

    // Aplicar filtros de fecha
    if (fecha_inicio && fecha_fin) {
      // Mostrar alquileres que se solapan con el rango
      query = query.lte('inicio', fecha_fin).gte('fin', fecha_inicio)
    } else if (fecha_inicio) {
      query = query.gte('fin', fecha_inicio)
    } else if (fecha_fin) {
      query = query.lte('inicio', fecha_fin)
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ Error obteniendo datos para informes:', error)
      throw error
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    // Obtener datos de soportes
    const soporteIds = [...new Set(data.map((a: any) => a.soporte_id).filter(Boolean))]
    const codigosSoportes: Record<string | number, string> = {}
    const ciudadesSoportes: Record<string | number, string> = {}
    
    if (soporteIds.length > 0) {
      try {
        const { data: soportesData, error: soportesError } = await supabase
          .from('soportes')
          .select('id, codigo, ciudad')
          .in('id', soporteIds)
        
        if (!soportesError && soportesData) {
          soportesData.forEach((s: any) => {
            codigosSoportes[s.id] = s.codigo || 'Sin código'
            ciudadesSoportes[s.id] = s.ciudad || 'Sin ciudad'
          })
        }
      } catch (error) {
        console.warn('⚠️ Error obteniendo datos de soportes:', error)
      }
    }

    // Calcular fechas del rango del informe
    const fechaInicioInforme = fecha_inicio ? new Date(fecha_inicio) : null
    const fechaFinInforme = fecha_fin ? new Date(fecha_fin) : null

    // Enriquecer datos con información de soportes y calcular monto proporcional
    const datosEnriquecidos = data.map((item: any) => {
      // Calcular precio mensual de venta
      const meses = item.meses || 1
      const totalAlquiler = item.total || 0
      const precioMensualVenta = meses > 0 ? totalAlquiler / meses : 0
      
      // Calcular precio diario (asumiendo 30 días por mes)
      const precioDiario = precioMensualVenta / 30
      
      // Calcular días de solapamiento entre el alquiler y el rango del informe
      let diasSolapamiento = 0
      if (fechaInicioInforme && fechaFinInforme && item.inicio && item.fin) {
        const inicioAlquiler = new Date(item.inicio)
        const finAlquiler = new Date(item.fin)
        
        // Calcular el rango de solapamiento
        const inicioSolapamiento = inicioAlquiler > fechaInicioInforme ? inicioAlquiler : fechaInicioInforme
        const finSolapamiento = finAlquiler < fechaFinInforme ? finAlquiler : fechaFinInforme
        
        // Calcular días de diferencia
        if (inicioSolapamiento <= finSolapamiento) {
          const diffTime = finSolapamiento.getTime() - inicioSolapamiento.getTime()
          diasSolapamiento = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // +1 para incluir ambos días
        }
      } else {
        // Si no hay rango de fechas, usar todos los días del alquiler
        if (item.inicio && item.fin) {
          const inicioAlquiler = new Date(item.inicio)
          const finAlquiler = new Date(item.fin)
          const diffTime = finAlquiler.getTime() - inicioAlquiler.getTime()
          diasSolapamiento = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
        }
      }
      
      // Calcular monto proporcional en Bs
      const montoProporcional = precioDiario * diasSolapamiento
      
      return {
        ...item,
        soporte_codigo: codigosSoportes[item.soporte_id] || 'Sin soporte',
        soporte_ciudad: ciudadesSoportes[item.soporte_id] || 'Sin ciudad',
        monto_proporcional: Math.round(montoProporcional * 100) / 100 // Redondear a 2 decimales
      }
    })

    // Procesar datos según el tipo de estadística solicitado
    let estadisticas: { name: string; value: number }[] = []

    // Si es estado, obtener datos directamente de soportes
    if (tipo === 'estado') {
      try {
        const { data: soportesData, error: soportesError } = await supabase
          .from('soportes')
          .select('id, estado')
        
        if (soportesError) {
          throw soportesError
        }

        // Contar soportes por estado (omitir "No disponible")
        const conteo: Record<string, number> = {}
        if (soportesData) {
          soportesData.forEach((s: any) => {
            const estado = s.estado || 'Sin estado'
            const estadoLabel = mapearEstado(estado)
            // Omitir "No disponible"
            if (estadoLabel.toLowerCase() !== 'no disponible') {
              conteo[estadoLabel] = (conteo[estadoLabel] || 0) + 1
            }
          })
        }

        estadisticas = Object.entries(conteo)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
      } catch (error) {
        console.error('❌ Error obteniendo estados de soportes:', error)
        estadisticas = []
      }
    } else {
      switch (tipo) {
        case 'vendedor':
          estadisticas = procesarPorVendedor(datosEnriquecidos)
          break
        case 'cliente':
          estadisticas = procesarPorCliente(datosEnriquecidos)
          break
        case 'soporte':
          estadisticas = procesarPorSoporte(datosEnriquecidos)
          break
        case 'ciudad':
          estadisticas = procesarPorCiudad(datosEnriquecidos)
          break
        default:
          // Si no se especifica tipo, devolver todos
          return NextResponse.json({
            success: true,
            data: {
              vendedor: procesarPorVendedor(datosEnriquecidos),
              cliente: procesarPorCliente(datosEnriquecidos),
              soporte: procesarPorSoporte(datosEnriquecidos),
              ciudad: procesarPorCiudad(datosEnriquecidos),
              estado: [] // Estado se maneja por separado
            }
          })
      }
    }

    return NextResponse.json({
      success: true,
      data: estadisticas
    })

  } catch (error) {
    console.error('❌ Error en API de informes:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error al obtener estadísticas'
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

// Funciones auxiliares para procesar datos (suman el monto proporcional en Bs)
function procesarPorVendedor(data: any[]) {
  const suma: Record<string, number> = {}
  
  data.forEach((item) => {
    const vendedor = item.vendedor || 'Sin vendedor'
    const monto = item.monto_proporcional || 0
    suma[vendedor] = (suma[vendedor] || 0) + monto
  })

  return Object.entries(suma)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 })) // Redondear a 2 decimales
    .sort((a, b) => b.value - a.value)
}

function procesarPorCliente(data: any[]) {
  const suma: Record<string, number> = {}
  
  data.forEach((item) => {
    const cliente = item.cliente || 'Sin cliente'
    const monto = item.monto_proporcional || 0
    suma[cliente] = (suma[cliente] || 0) + monto
  })

  return Object.entries(suma)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value)
}

function procesarPorSoporte(data: any[]) {
  const suma: Record<string, number> = {}
  
  data.forEach((item) => {
    const soporte = item.soporte_codigo || 'Sin soporte'
    const monto = item.monto_proporcional || 0
    suma[soporte] = (suma[soporte] || 0) + monto
  })

  return Object.entries(suma)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value)
}

function procesarPorCiudad(data: any[]) {
  const suma: Record<string, number> = {}
  
  data.forEach((item) => {
    const ciudad = item.soporte_ciudad || 'Sin ciudad'
    // Omitir "Sin ciudad"
    if (ciudad === 'Sin ciudad') return
    
    const monto = item.monto_proporcional || 0
    suma[ciudad] = (suma[ciudad] || 0) + monto
  })

  return Object.entries(suma)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value)
}

function procesarPorEstado(data: any[]) {
  const suma: Record<string, number> = {}
  
  data.forEach((item) => {
    const estado = item.estado || 'Sin estado'
    // Mapear estados a nombres más legibles
    const estadoLabel = mapearEstado(estado)
    const monto = item.monto_proporcional || 0
    suma[estadoLabel] = (suma[estadoLabel] || 0) + monto
  })

  return Object.entries(suma)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value)
}

function mapearEstado(estado: string): string {
  const estados: Record<string, string> = {
    'activo': 'Activo',
    'reservado': 'Reservado',
    'proximo': 'Próximo',
    'finalizado': 'Finalizado'
  }
  return estados[estado.toLowerCase()] || estado
}

