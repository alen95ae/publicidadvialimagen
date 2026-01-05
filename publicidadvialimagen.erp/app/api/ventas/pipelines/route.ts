import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseUser } from '@/lib/supabaseServer'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseUser(request)
    
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Primero probar sin filtro is_archived para ver si hay datos
    const { data: allPipelines, error: errorAll } = await supabase
      .from('sales_pipelines')
      .select('*')
      .order('created_at', { ascending: true })

    console.log('🔍 ALL PIPELINES (sin filtro):', { 
      data: allPipelines, 
      error: errorAll, 
      count: allPipelines?.length,
      firstPipeline: allPipelines?.[0]
    })

    // Ahora con el filtro
    const { data: pipelines, error } = await supabase
      .from('sales_pipelines')
      .select('*')
      .eq('is_archived', false)
      .order('created_at', { ascending: true })

    console.log('🔍 PIPELINES (con filtro is_archived=false):', { 
      data: pipelines, 
      error, 
      count: pipelines?.length 
    })

    if (error) {
      console.error('❌ Error obteniendo pipelines:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // Usar pipelines filtrados, o si está vacío, usar todos (puede que is_archived sea NULL)
    const pipelinesToUse = (pipelines && pipelines.length > 0) ? pipelines : (allPipelines || [])

    // Si aún no hay pipelines, devolver array vacío explícitamente
    if (!pipelinesToUse || pipelinesToUse.length === 0) {
      console.warn('⚠️ No pipelines found in database at all')
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    // Filtrar en memoria si es necesario (por si is_archived es NULL en algunos registros)
    const activePipelines = pipelinesToUse.filter(p => p.is_archived !== true)

    console.log('✅ ACTIVE PIPELINES:', { count: activePipelines.length, pipelines: activePipelines })

    // Marcar el pipeline default (el primero o el que tenga nombre "Pipeline Vallas")
    const pipelinesWithDefault = activePipelines.map(p => ({
      ...p,
      is_default: p.nombre === 'Pipeline Vallas' || (activePipelines.length === 1 && p.id === activePipelines[0].id)
    }))

    console.log('✅ PIPELINES WITH DEFAULT:', pipelinesWithDefault)

    return NextResponse.json({
      success: true,
      data: pipelinesWithDefault
    })
  } catch (error) {
    console.error('❌ Error en GET /api/ventas/pipelines:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

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
    const { nombre, descripcion, is_default } = body

    if (!nombre || nombre.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    // Si se marca como default, desmarcar los demás
    if (is_default) {
      await supabase
        .from('sales_pipelines')
        .update({ is_default: false })
        .neq('is_default', false)
    }

    const { data: pipeline, error } = await supabase
      .from('sales_pipelines')
      .insert({
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        is_default: is_default || false,
        is_archived: false
      })
      .select()
      .single()

    if (error) {
      console.error('Error creando pipeline:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: pipeline
    }, { status: 201 })
  } catch (error) {
    console.error('Error en POST /api/ventas/pipelines:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

