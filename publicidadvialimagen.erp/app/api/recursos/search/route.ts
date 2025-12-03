import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabaseServer'
import { supabaseToRecurso } from '@/lib/supabaseRecursos'

const supabase = getSupabaseServer()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query') || ''
    const limit = 20 // Máximo 20 resultados para búsqueda asíncrona

    console.log('🔍 Búsqueda de recursos:', { query, limit })

    // Si no hay query, devolver array vacío
    if (!query || query.trim() === '') {
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    // Buscar recursos directamente en Supabase
    let queryBuilder = supabase
      .from('recursos')
      .select('*')
      .limit(limit)
    
    // Búsqueda en código, nombre y categoría
    const searchTerm = `%${query}%`
    queryBuilder = queryBuilder.or(
      `codigo.ilike.${searchTerm},nombre.ilike.${searchTerm},categoria.ilike.${searchTerm}`
    )
    
    queryBuilder = queryBuilder.order('fecha_creacion', { ascending: false })
    
    const { data, error } = await queryBuilder
    
    if (error) {
      console.error('❌ Error de Supabase en búsqueda:', error)
      throw new Error(`Error buscando recursos: ${error.message}`)
    }
    
    const recursos = (data || []).map(supabaseToRecurso)
    
    console.log('📊 Resultados de búsqueda:', recursos.length, 'recursos encontrados')

    return NextResponse.json({
      success: true,
      data: recursos
    })

  } catch (error) {
    console.error('❌ Error en API recursos/search:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
