/**
 * API para exportar historial de stock a Excel
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabaseServer'
import * as XLSX from 'xlsx'

const supabase = getSupabaseServer()

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const itemTipo = searchParams.get('item_tipo')
    const origen = searchParams.get('origen')
    const sucursal = searchParams.get('sucursal')
    const fechaDesde = searchParams.get('fecha_desde')
    const fechaHasta = searchParams.get('fecha_hasta')
    const itemId = searchParams.get('item_id')
    const referenciaCodigo = searchParams.get('referencia_codigo')

    let query = supabase
      .from('historial_stock')
      .select('*')
      .order('fecha', { ascending: false })

    // Aplicar filtros (igual que en GET)
    if (itemTipo) {
      query = query.eq('item_tipo', itemTipo)
    }

    if (origen) {
      query = query.eq('origen', origen)
    }

    if (sucursal) {
      query = query.eq('sucursal', sucursal)
    }

    if (fechaDesde) {
      query = query.gte('fecha', fechaDesde)
    }

    if (fechaHasta) {
      query = query.lte('fecha', fechaHasta)
    }

    if (itemId) {
      query = query.eq('item_id', itemId)
    }

    if (referenciaCodigo) {
      query = query.ilike('referencia_codigo', `%${referenciaCodigo}%`)
    }

    // Obtener todos los registros (sin paginación)
    const { data, error } = await query

    if (error) {
      console.error('❌ Error obteniendo historial para Excel:', error)
      return NextResponse.json(
        { error: 'Error al obtener datos del historial' },
        { status: 500 }
      )
    }

    // Para registros de cotizaciones, obtener el usuario que aprobó desde la cotización
    const dataConUsuario = await Promise.all((data || []).map(async (entry: any) => {
      if (
        (entry.origen === 'cotizacion_aprobada' || 
         entry.origen === 'cotizacion_rechazada' || 
         entry.origen === 'cotizacion_editada' || 
         entry.origen === 'cotizacion_eliminada') &&
        entry.referencia_id
      ) {
        try {
          const { data: cotizacion } = await supabase
            .from('cotizaciones')
            .select('vendedor')
            .eq('id', entry.referencia_id)
            .single()
          
          if (cotizacion?.vendedor) {
            const { data: usuarioData } = await supabase
              .from('usuarios')
              .select('id, nombre, imagen_usuario')
              .eq('nombre', cotizacion.vendedor)
              .single()
            
            if (usuarioData) {
              return {
                ...entry,
                usuario_id: usuarioData.id,
                usuario_nombre: usuarioData.nombre
              }
            }
          }
        } catch (err) {
          console.warn('⚠️ No se pudo obtener usuario de cotización:', err)
        }
      }
      return entry
    }))

    // Mapear datos para Excel
    const excelData = (dataConUsuario || []).map((entry: any) => {
      // Formatear fecha
      let fechaFormateada = entry.fecha
      try {
        const date = new Date(entry.fecha)
        fechaFormateada = date.toLocaleString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      } catch {}

      // Formatear origen
      const origenLabels: Record<string, string> = {
        'registro_manual': 'Manual',
        'cotizacion_aprobada': 'Cot. Aprobada',
        'cotizacion_rechazada': 'Cot. Rechazada',
        'cotizacion_editada': 'Cot. Editada',
        'cotizacion_eliminada': 'Cot. Eliminada'
      }
      const origenLabel = origenLabels[entry.origen] || entry.origen

      // Formatear cantidad
      let cantidadTexto = `${entry.cantidad_udm} ${entry.unidad_medida}`
      if (
        entry.origen === 'registro_manual' && 
        entry.formato && 
        typeof entry.formato === 'object' && 
        entry.formato.cantidad_formato && 
        entry.formato.formato_seleccionado
      ) {
        cantidadTexto = `${entry.formato.cantidad_formato} ${entry.formato.formato_seleccionado}`
      }

      // Formatear impacto
      const impactoTexto = entry.impacto >= 0 ? `+${entry.impacto}` : `${entry.impacto}`

      return {
        'Fecha': fechaFormateada,
        'Origen': origenLabel,
        'Tipo': entry.item_tipo,
        'Código': entry.item_codigo,
        'Ítem': entry.item_nombre,
        'Sucursal': entry.sucursal || '',
        'Cantidad': cantidadTexto,
        'Impacto': impactoTexto,
        'Stock Anterior': entry.stock_anterior,
        'Stock Nuevo': entry.stock_nuevo,
        'Tipo Movimiento': entry.tipo_movimiento || '',
        'Referencia': entry.referencia_codigo || '',
        'Usuario': entry.usuario_nombre || '',
        'Observaciones': entry.observaciones || ''
      }
    })

    // Crear workbook y worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)

    // Ajustar anchos de columna
    const colWidths = [
      { wch: 20 }, // Fecha
      { wch: 18 }, // Origen
      { wch: 12 }, // Tipo
      { wch: 15 }, // Código
      { wch: 40 }, // Ítem
      { wch: 15 }, // Sucursal
      { wch: 20 }, // Cantidad
      { wch: 10 }, // Impacto
      { wch: 15 }, // Stock Anterior
      { wch: 15 }, // Stock Nuevo
      { wch: 20 }, // Tipo Movimiento
      { wch: 20 }, // Referencia
      { wch: 25 }, // Usuario
      { wch: 40 }, // Observaciones
    ]
    ws['!cols'] = colWidths

    // Agregar worksheet al workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Historial Stock')

    // Generar buffer
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    // Generar nombre del archivo
    const hoy = new Date()
    const dia = String(hoy.getDate()).padStart(2, '0')
    const mes = String(hoy.getMonth() + 1).padStart(2, '0')
    const año = hoy.getFullYear()
    const nombreArchivo = `historial_stock_${dia}-${mes}-${año}.xlsx`

    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
      },
    })
  } catch (error) {
    console.error('❌ Error en GET /api/inventario/historial/export/excel:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error al exportar Excel'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
