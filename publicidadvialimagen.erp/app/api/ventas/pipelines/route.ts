import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabaseServer'
import { requirePermiso } from '@/lib/permisos'

export const runtime = 'nodejs'

/**
 * GET /api/ventas/pipelines
 * Obtiene todos los pipelines de ventas
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar permiso de ver ventas
    const permiso = await requirePermiso("ventas", "ver")
    if (permiso instanceof Response) {
      return permiso
    }

    const supabase = getSupabaseServer()

    // Obtener pipelines desde la base de datos
    const { data, error } = await supabase
      .from('sales_pipelines')
      .select('*')
      .eq('is_archived', false)
      .order('is_default', { ascending: false })
      .order('nombre', { ascending: true })

    if (error) {
      console.error('❌ Error obteniendo pipelines:', error)
      // Si la tabla no existe, devolver array vacío
      if (error.code === '42P01') {
        return NextResponse.json({
          success: true,
          data: []
        })
      }
      return NextResponse.json(
        { success: false, error: 'Error al obtener pipelines' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('❌ Error en GET /api/ventas/pipelines:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener pipelines' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/ventas/pipelines
 * Crea un nuevo pipeline
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar permiso de crear ventas
    const permiso = await requirePermiso("ventas", "crear")
    if (permiso instanceof Response) {
      return permiso
    }

    const body = await request.json()
    const { nombre, descripcion, is_default } = body

    if (!nombre) {
      return NextResponse.json(
        { success: false, error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseServer()

    // Si se marca como default, quitar el default de los demás
    if (is_default) {
      await supabase
        .from('sales_pipelines')
        .update({ is_default: false })
        .neq('is_default', false)
    }

    // Crear el nuevo pipeline
    const { data, error } = await supabase
      .from('sales_pipelines')
      .insert({
        nombre,
        descripcion: descripcion || null,
        is_default: is_default || false,
        is_archived: false
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error creando pipeline:', error)
      // Si la tabla no existe, devolver error informativo
      if (error.code === '42P01') {
        return NextResponse.json(
          { success: false, error: 'La tabla de pipelines no existe en la base de datos' },
          { status: 500 }
        )
      }
      return NextResponse.json(
        { success: false, error: 'Error al crear pipeline' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('❌ Error en POST /api/ventas/pipelines:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear pipeline' },
      { status: 500 }
    )
  }
}
