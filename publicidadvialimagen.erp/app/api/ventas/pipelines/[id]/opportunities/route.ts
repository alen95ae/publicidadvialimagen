import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabaseServer'
import { requirePermiso } from '@/lib/permisos'

export const runtime = 'nodejs'

/**
 * GET /api/ventas/pipelines/[id]/opportunities
 * Obtiene todas las oportunidades de un pipeline con filtros
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permiso = await requirePermiso("ventas", "ver")
    if (permiso instanceof Response) {
      return permiso
    }

    const { id: pipelineId } = await params
    const { searchParams } = new URL(request.url)
    
    const q = searchParams.get('q') || ''
    const origen = searchParams.get('origen') || ''
    const interes = searchParams.get('interes') || ''
    const ciudad = searchParams.get('ciudad') || ''
    const estado = searchParams.get('estado') || ''

    const supabase = getSupabaseServer()

    let query = supabase
      .from('sales_opportunities')
      .select(`
        *,
        lead:leads(id, nombre, empresa, email),
        contacto:contactos(id, nombre, empresa, email),
        vendedor:usuarios(id, nombre, imagen_usuario, email)
      `)
      .eq('pipeline_id', pipelineId)

    // Aplicar filtros
    if (q) {
      query = query.or(`titulo.ilike.%${q}%,descripcion.ilike.%${q}%`)
    }
    if (origen && origen !== 'all') {
      query = query.eq('origen', origen)
    }
    if (interes && interes !== 'all') {
      query = query.eq('interes', interes)
    }
    if (ciudad && ciudad !== 'all') {
      query = query.eq('ciudad', ciudad)
    }
    if (estado && estado !== 'all') {
      query = query.eq('estado', estado)
    }

    query = query.order('posicion_en_etapa', { ascending: true })

    const { data, error } = await query

    if (error) {
      console.error('❌ Error obteniendo opportunities:', error)
      if (error.code === '42P01') {
        return NextResponse.json({
          success: true,
          data: []
        })
      }
      return NextResponse.json(
        { success: false, error: 'Error al obtener oportunidades' },
        { status: 500 }
      )
    }

    // Transformar los datos para el formato esperado
    const opportunities = (data || []).map((opp: any) => ({
      id: opp.id,
      pipeline_id: opp.pipeline_id,
      stage_id: opp.stage_id,
      titulo: opp.titulo,
      descripcion: opp.descripcion,
      valor_estimado: opp.valor_estimado,
      moneda: opp.moneda,
      probabilidad: opp.probabilidad,
      ciudad: opp.ciudad,
      origen: opp.origen,
      interes: opp.interes,
      estado: opp.estado,
      motivo_perdida: opp.motivo_perdida,
      fecha_cierre_estimada: opp.fecha_cierre_estimada,
      posicion_en_etapa: opp.posicion_en_etapa,
      lead: opp.lead || null,
      contacto: opp.contacto || null,
      vendedor: opp.vendedor || null
    }))

    return NextResponse.json({
      success: true,
      data: opportunities
    })
  } catch (error) {
    console.error('❌ Error en GET /api/ventas/pipelines/[id]/opportunities:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener oportunidades' },
      { status: 500 }
    )
  }
}
