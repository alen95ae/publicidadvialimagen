export const runtime = "nodejs";

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseUser, getSupabaseAdmin } from '@/lib/supabaseServer'
import { supabaseToRecurso } from '@/lib/supabaseRecursos'

/**
 * FASE 0: Migrado a usar cliente de usuario (bajo riesgo - búsqueda pública de recursos)
 */
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

    // FASE 0: Usar cliente de usuario (bajo riesgo - búsqueda pública de recursos)
    const supabase = await getSupabaseUser(request);
    // ⚠️ TEMPORAL: Fallback a admin si no hay sesión (solo para FASE 0)
    // ANTES DE ACTIVAR RLS: Eliminar este fallback y manejar el error correctamente
    // Nota: Esta ruta podría ser pública, considerar permitir acceso anónimo
    const supabaseClient = supabase || getSupabaseAdmin();

    // Buscar recursos directamente en Supabase
    let queryBuilder = supabaseClient
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
