/**
 * API para obtener el historial de stock
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabaseServer'
import { filterUltimaVersionPorCotizacion } from '@/lib/historialStockUtils'

const supabase = getSupabaseServer()

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const itemTipo = searchParams.get('item_tipo')
    const origen = searchParams.get('origen')
    const sucursal = searchParams.get('sucursal')
    const fechaDesde = searchParams.get('fecha_desde')
    const fechaHasta = searchParams.get('fecha_hasta')
    const itemId = searchParams.get('item_id')
    const referenciaCodigo = searchParams.get('referencia_codigo')
    const search = searchParams.get('search')
    const ultimaVersionCotizacion = searchParams.get('ultima_version_cotizacion') === '1'

    const aplicarUltimaVersion = ultimaVersionCotizacion && origen !== 'registro_manual'

    let query = supabase
      .from('historial_stock')
      .select('*', { count: aplicarUltimaVersion ? undefined : 'exact' })
      .order('fecha', { ascending: false })

    // Aplicar filtros
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

    // Búsqueda en BD (cuando no aplicamos filtro última versión, la paginación se hace después)
    if (search) {
      query = query.or(`item_codigo.ilike.%${search}%,item_nombre.ilike.%${search}%,referencia_codigo.ilike.%${search}%`)
    }

    // Si aplicamos "última versión por cotización", no paginar en BD; traer todo, filtrar y paginar en memoria
    if (!aplicarUltimaVersion && !search) {
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('❌ Error obteniendo historial:', error)
      throw error
    }

    let dataParaEnriquecer = (data || []) as any[]

    if (aplicarUltimaVersion && dataParaEnriquecer.length > 0) {
      dataParaEnriquecer = filterUltimaVersionPorCotizacion(dataParaEnriquecer)
    }

    if (search && dataParaEnriquecer.length > 0) {
      const searchLower = search.toLowerCase()
      dataParaEnriquecer = dataParaEnriquecer.filter((entry: any) => {
        const itemCodigo = (entry.item_codigo || '').toLowerCase()
        const itemNombre = (entry.item_nombre || '').toLowerCase()
        const referenciaCodigo = (entry.referencia_codigo || '').toLowerCase()
        const usuarioNombre = (entry.usuario_nombre || '').toLowerCase()
        return itemCodigo.includes(searchLower) ||
               itemNombre.includes(searchLower) ||
               referenciaCodigo.includes(searchLower) ||
               usuarioNombre.includes(searchLower)
      })
    }

    let totalFinal = count ?? 0
    let dataPaginada = dataParaEnriquecer
    if (aplicarUltimaVersion || search) {
      totalFinal = dataParaEnriquecer.length
      const from = (page - 1) * limit
      const to = from + limit
      dataPaginada = dataParaEnriquecer.slice(from, to)
    }

    // Enriquecer usuario solo para registros antiguos sin usuario_id (compatibilidad). Los nuevos ya traen usuario_id.
    let dataConUsuario = await Promise.all((dataPaginada || []).map(async (entry: any) => {
      if (entry.usuario_id) {
        return entry
      }
      // Solo para orígenes de cotización y sin usuario_id: intentar obtener vendedor desde cotización (registros antiguos)
      if (
        (entry.origen === 'cotizacion_aprobada' ||
         entry.origen === 'cotizacion_rechazada' ||
         entry.origen === 'cotizacion_editada' ||
         entry.origen === 'cotizacion_eliminada') &&
        entry.referencia_id
      ) {
        try {
          let cotizacion: { id: string; vendedor: string | null } | null = null
          const { data: cotizaciones } = await supabase
            .from('cotizaciones')
            .select('id, vendedor')
            .eq('id', entry.referencia_id)
          if (cotizaciones && cotizaciones.length > 0) cotizacion = cotizaciones[0]
          if (!cotizacion && entry.referencia_codigo) {
            const { data: porCodigo } = await supabase
              .from('cotizaciones')
              .select('id, vendedor')
              .eq('codigo', entry.referencia_codigo)
            if (porCodigo && porCodigo.length > 0) cotizacion = porCodigo[0]
          }
          if (!cotizacion?.vendedor) return entry

          let usuarioIdCotizacion: string | null = null
          let usuarioNombreCotizacion: string | null = null
          let usuarioImagen: string | null = null
          const v = cotizacion.vendedor
          const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(v)
          if (isUuid) {
            const { data: userData } = await supabase
              .from('usuarios')
              .select('id, nombre, imagen_usuario')
              .eq('id', v)
              .single()
            if (userData) {
              usuarioIdCotizacion = userData.id
              usuarioNombreCotizacion = userData.nombre
              usuarioImagen = userData.imagen_usuario ?? null
            } else {
              const { data: byName } = await supabase
                .from('usuarios')
                .select('id, nombre, imagen_usuario')
                .eq('nombre', v)
                .maybeSingle()
              if (byName) {
                usuarioIdCotizacion = byName.id
                usuarioNombreCotizacion = byName.nombre
                usuarioImagen = byName.imagen_usuario ?? null
              }
            }
          } else {
            const { data: byName } = await supabase
              .from('usuarios')
              .select('id, nombre, imagen_usuario')
              .ilike('nombre', v)
              .maybeSingle()
            if (byName) {
              usuarioIdCotizacion = byName.id
              usuarioNombreCotizacion = byName.nombre
              usuarioImagen = byName.imagen_usuario ?? null
            }
          }
          if (usuarioIdCotizacion || usuarioNombreCotizacion) {
            return {
              ...entry,
              usuario_id: usuarioIdCotizacion ?? entry.usuario_id,
              usuario_nombre: usuarioNombreCotizacion ?? entry.usuario_nombre,
              usuario_imagen: usuarioImagen ?? entry.usuario_imagen
            }
          }
        } catch (err) {
          console.warn('⚠️ No se pudo enriquecer usuario de cotización (registro antiguo):', err)
        }
      }
      return entry
    }))

    const totalPagesFinal = Math.ceil(totalFinal / limit)

    return NextResponse.json({
      success: true,
      data: dataConUsuario || [],
      pagination: {
        page,
        limit,
        total: totalFinal,
        totalPages: totalPagesFinal
      }
    })

  } catch (error) {
    console.error('❌ Error en GET /api/inventario/historial:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error al obtener historial'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
