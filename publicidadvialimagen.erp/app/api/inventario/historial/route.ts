/**
 * API para obtener el historial de stock
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabaseServer'

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

    let query = supabase
      .from('historial_stock')
      .select('*', { count: 'exact' })
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

    // Paginación
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('❌ Error obteniendo historial:', error)
      throw error
    }

    // Para registros de cotizaciones, obtener el usuario que aprobó desde la cotización
    const dataConUsuario = await Promise.all((data || []).map(async (entry: any) => {
      // Si el origen es una cotizacion y hay referencia_id, buscar el usuario que aprobó
      if (
        (entry.origen === 'cotizacion_aprobada' || 
         entry.origen === 'cotizacion_rechazada' || 
         entry.origen === 'cotizacion_editada' || 
         entry.origen === 'cotizacion_eliminada') &&
        entry.referencia_id
      ) {
        try {
          // Buscar la cotización para obtener el vendedor (que es quien aprobó)
          // Intentar primero por ID, luego por código si falla
          let cotizacion = null
          
          if (entry.referencia_id) {
            const { data: cotizaciones } = await supabase
              .from('cotizaciones')
              .select('id, vendedor')
              .eq('id', entry.referencia_id)
            
            if (cotizaciones && cotizaciones.length > 0) {
              cotizacion = cotizaciones[0]
            }
          }
          
          // Si no se encontró por ID, intentar por código
          if (!cotizacion && entry.referencia_codigo) {
            const { data: cotizacionesPorCodigo } = await supabase
              .from('cotizaciones')
              .select('id, vendedor')
              .eq('codigo', entry.referencia_codigo)
            
            if (cotizacionesPorCodigo && cotizacionesPorCodigo.length > 0) {
              cotizacion = cotizacionesPorCodigo[0]
            }
          }
          
          if (cotizacionError) {
            console.warn(`⚠️ Error obteniendo cotización ${entry.referencia_id}:`, cotizacionError)
          }
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/0c38a0dd-0488-46f2-9e99-19064c1193dd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'historial/route.ts:91',message:'ANTES condición vendedor',data:{cotizacion_exists:!!cotizacion,vendedor:cotizacion?.vendedor,vendedor_type:typeof cotizacion?.vendedor,vendedor_empty:!cotizacion?.vendedor},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
          // #endregion
          
          if (cotizacion?.vendedor) {
            let usuarioNombreCotizacion = cotizacion.vendedor
            let usuarioIdCotizacion = null
            let usuarioImagen = null

            // Si el vendedor es un UUID, buscar el nombre del usuario
            if (cotizacion.vendedor.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)) {
              const { data: userData, error: userError } = await supabase
                .from('usuarios')
                .select('id, nombre, imagen_usuario')
                .eq('id', cotizacion.vendedor)
                .single()
              
              if (userData && !userError) {
                usuarioNombreCotizacion = userData.nombre
                usuarioIdCotizacion = userData.id
                usuarioImagen = userData.imagen_usuario
              } else if (userError) {
                console.warn(`⚠️ Error obteniendo usuario por ID ${cotizacion.vendedor}:`, userError)
                // Intentar buscar por nombre como fallback
                const { data: userDataByName } = await supabase
                  .from('usuarios')
                  .select('id, nombre, imagen_usuario')
                  .eq('nombre', cotizacion.vendedor)
                  .single()
                
                if (userDataByName) {
                  usuarioNombreCotizacion = userDataByName.nombre
                  usuarioIdCotizacion = userDataByName.id
                  usuarioImagen = userDataByName.imagen_usuario
                }
              }
            } else {
              // Si el vendedor es un nombre, intentar obtener el ID del usuario
              const { data: userDataByName } = await supabase
                .from('usuarios')
                .select('id, nombre, imagen_usuario')
                .eq('nombre', cotizacion.vendedor)
                .single()
              
              if (userDataByName) {
                usuarioIdCotizacion = userDataByName.id
                usuarioImagen = userDataByName.imagen_usuario
              }
            }

            return {
              ...entry,
              usuario_id: usuarioIdCotizacion || entry.usuario_id,
              usuario_nombre: usuarioNombreCotizacion || entry.usuario_nombre,
              usuario_imagen: usuarioImagen || entry.usuario_imagen
            }
          }
        } catch (err) {
          // Si falla, mantener los datos originales
          console.warn('⚠️ No se pudo obtener usuario de cotización:', err)
        }
      }
      return entry
    }))

    return NextResponse.json({
      success: true,
      data: dataConUsuario || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
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
