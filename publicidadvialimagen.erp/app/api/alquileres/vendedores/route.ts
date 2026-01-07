import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabaseServer'
import { requirePermiso } from '@/lib/permisos'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = "nodejs";

/**
 * Endpoint para obtener todos los vendedores únicos de la tabla alquileres
 * Útil para poblar filtros sin necesidad de cargar todos los alquileres
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar permiso de ver alquileres
    const authResult = await requirePermiso("soportes", "ver");
    if (authResult instanceof Response) {
      return authResult;
    }

    const supabase = getSupabaseServer();
    
    // Obtener todos los vendedores únicos de la tabla alquileres
    const { data, error } = await supabase
      .from('alquileres')
      .select('vendedor')
      .not('vendedor', 'is', null)
      .neq('vendedor', '');

    if (error) {
      console.error('❌ Error obteniendo vendedores de alquileres:', error);
      return NextResponse.json(
        { success: false, error: 'Error al obtener vendedores' },
        { status: 500 }
      );
    }

    // Extraer vendedores únicos, normalizar (trim) y ordenarlos
    const vendedoresUnicos = Array.from(
      new Set(
        (data || [])
          .map((a: any) => (a.vendedor || '').trim())
          .filter((v: string) => v.length > 0) // Filtrar strings vacíos después del trim
      )
    ).sort();

    return NextResponse.json({
      success: true,
      vendedores: vendedoresUnicos
    });
  } catch (error) {
    console.error('❌ Error en GET /api/alquileres/vendedores:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

