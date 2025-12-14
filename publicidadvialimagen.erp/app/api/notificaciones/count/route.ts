import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { verifySession } from "@/lib/auth/verifySession";

/**
 * GET - Contar notificaciones no leídas del usuario actual
 * 
 * MODELO LEGACY:
 * - Obtiene el rol del usuario
 * - Cuenta notificaciones donde rol ∈ roles_destino
 * - Filtra por notificaciones.leida === false || null
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar sesión del usuario
    const token = request.cookies.get('session')?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    let userId: string;
    try {
      const payload = await verifySession(token);
      if (!payload || !payload.sub) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }
      userId = payload.sub;
    } catch (error) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // 1. Obtener el rol del usuario
    const { data: usuarioData, error: usuarioError } = await supabase
      .from('usuarios')
      .select('rol_id')
      .eq('id', userId)
      .single();

    if (usuarioError || !usuarioData) {
      return NextResponse.json({ count: 0 });
    }

    const { data: rolData, error: rolError } = await supabase
      .from('roles')
      .select('nombre')
      .eq('id', usuarioData.rol_id)
      .single();

    if (rolError || !rolData) {
      return NextResponse.json({ count: 0 });
    }

    const rolUsuario = rolData.nombre.toLowerCase().trim();

    // 2. Contar notificaciones donde el rol está en roles_destino y no están leídas (MODELO LEGACY)
    // Obtener todas y filtrar manualmente (más confiable que contains)
    const { data: todasNotificaciones, error: notificacionesError } = await supabase
      .from('notificaciones')
      .select('id, roles_destino, leida');

    if (notificacionesError) {
      console.error("Error contando notificaciones:", notificacionesError);
      return NextResponse.json({ count: 0 });
    }

    // Filtrar por rol y estado de lectura (MODELO LEGACY)
    const count = (todasNotificaciones || []).filter((notif: any) => {
      const roles = notif.roles_destino || [];
      
      // Normalizar roles de forma más robusta
      const rolesNormalizados = Array.isArray(roles) 
        ? roles.map((r: any) => String(r).toLowerCase().trim())
        : [];
      
      const tieneRol = rolesNormalizados.includes(rolUsuario);
      const noLeida = notif.leida === false || notif.leida === null;
      return tieneRol && noLeida;
    }).length;

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error en GET /api/notificaciones/count:", error);
    return NextResponse.json({ count: 0 });
  }
}
