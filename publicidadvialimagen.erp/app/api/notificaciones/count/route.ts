import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { verifySession } from "@/lib/auth/verifySession";

/**
 * GET - Obtener contador de notificaciones no leídas
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar sesión del usuario
    const token = request.cookies.get('session')?.value;
    if (!token) {
      return NextResponse.json({ count: 0 });
    }

    let userId: string;
    try {
      const payload = await verifySession(token);
      if (!payload || !payload.sub) {
        return NextResponse.json({ count: 0 });
      }
      userId = payload.sub;
    } catch (error) {
      // Si la sesión no es válida, devolver 0 en lugar de error
      return NextResponse.json({ count: 0 });
    }

    // Usar admin client pero filtrar por user_id manualmente
    const supabase = getSupabaseAdmin();

    // Contar notificaciones no leídas para este usuario
    const { count, error } = await supabase
      .from('notificaciones')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('leida', false);

    if (error) {
      // Si hay error (tabla no existe, etc.), devolver 0
      if (error.code === 'PGRST116' || error.code === '42P01') {
        return NextResponse.json({ count: 0 });
      }
      // Para otros errores, loguear pero devolver 0
      console.error("Error contando notificaciones:", error.message);
      return NextResponse.json({ count: 0 });
    }

    // Siempre devolver un número válido
    return NextResponse.json({ count: count || 0 });
  } catch (error) {
    // En caso de error inesperado, devolver 0 para no romper el header
    console.error("Error en GET /api/notificaciones/count:", error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ count: 0 });
  }
}
