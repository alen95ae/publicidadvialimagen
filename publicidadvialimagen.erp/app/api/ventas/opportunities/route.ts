import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseUser } from '@/lib/supabaseServer'
import { verifySession } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseUser(request)
    
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      pipeline_id,
      stage_id,
      titulo,
      descripcion,
      valor_estimado,
      moneda,
      probabilidad,
      ciudad,
      origen,
      interes,
      estado,
      lead_id,
      contacto_id,
      cotizacion_id,
      vendedor_id: vendedor_id_explicito
    } = body

    // Obtener usuario actual para asignar como vendedor por defecto
    const token = request.cookies.get('session')?.value
    let vendedor_id = null
    if (token) {
      try {
        const payload = await verifySession(token)
        if (payload?.sub) {
          vendedor_id = payload.sub
        }
      } catch (error) {
        console.error('Error verificando sesión:', error)
      }
    }

    // Si se envía vendedor_id explícito, validarlo
    if (vendedor_id_explicito) {
      // Validar que el usuario existe y es vendedor
      const { data: usuarioVendedor, error: errorVendedor } = await supabase
        .from('usuarios')
        .select('id, vendedor')
        .eq('id', vendedor_id_explicito)
        .single()

      if (errorVendedor || !usuarioVendedor) {
        return NextResponse.json(
          { success: false, error: 'El vendedor especificado no existe' },
          { status: 400 }
        )
      }

      if (!usuarioVendedor.vendedor) {
        return NextResponse.json(
          { success: false, error: 'El usuario especificado no es un vendedor' },
          { status: 400 }
        )
      }

      vendedor_id = vendedor_id_explicito
    }

    // Asegurar que siempre hay un vendedor_id (usuario actual)
    if (!vendedor_id) {
      return NextResponse.json(
        { success: false, error: 'No se pudo determinar el vendedor. Sesión inválida.' },
        { status: 401 }
      )
    }

    if (!titulo || titulo.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'El título es requerido' },
        { status: 400 }
      )
    }

    if (!pipeline_id) {
      return NextResponse.json(
        { success: false, error: 'pipeline_id es requerido' },
        { status: 400 }
      )
    }

    if (!stage_id) {
      return NextResponse.json(
        { success: false, error: 'stage_id es requerido' },
        { status: 400 }
      )
    }

    // Obtener la máxima posición en la etapa
    const { data: maxOpp, error: maxError } = await supabase
      .from('sales_opportunities')
      .select('posicion_en_etapa')
      .eq('stage_id', stage_id)
      .order('posicion_en_etapa', { ascending: false })
      .limit(1)
      .single()

    const nuevaPosicion = maxOpp?.posicion_en_etapa ? maxOpp.posicion_en_etapa + 1 : 1

    const { data: opportunity, error } = await supabase
      .from('sales_opportunities')
      .insert({
        pipeline_id,
        stage_id,
        titulo: titulo.trim(),
        descripcion: descripcion?.trim() || null,
        valor_estimado: valor_estimado || null,
        moneda: moneda || 'BOB',
        probabilidad: probabilidad || 0,
        ciudad: ciudad?.trim() || null,
        origen: origen?.trim() || null,
        interes: interes?.trim() || null,
        estado: estado || 'abierta',
        lead_id: lead_id || null,
        contacto_id: contacto_id || null,
        cotizacion_id: cotizacion_id || null,
        vendedor_id: vendedor_id,
        posicion_en_etapa: nuevaPosicion
      })
      .select(`
        *,
        lead:leads(id, nombre, empresa),
        contacto:contactos(id, nombre, empresa),
        vendedor:usuarios!sales_opportunities_vendedor_id_fkey(id, nombre, imagen_usuario, email)
      `)
      .single()

    if (error) {
      console.error('Error creando opportunity:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: opportunity
    }, { status: 201 })
  } catch (error) {
    console.error('Error en POST /api/ventas/opportunities:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

