import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { verifySession } from "@/lib/auth/verifySession";

/**
 * GET - Obtener notificaciones del usuario actual
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

    // Usar admin client pero filtrar por user_id manualmente
    const supabase = getSupabaseAdmin();

    // Obtener notificaciones del usuario
    const { data, error } = await supabase
      .from('notificaciones')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      // Si la tabla no existe o hay error de estructura, devolver array vacío
      if (error.code === 'PGRST116' || error.code === '42P01') {
        return NextResponse.json([]);
      }
      // Para otros errores, loguear pero devolver array vacío para no romper el frontend
      console.error("Error obteniendo notificaciones:", error.message);
      return NextResponse.json([]);
    }

    // Log temporal para debugging
    console.log(`[API /api/notificaciones] Encontradas ${data?.length || 0} notificaciones para usuario ${userId}`);
    if (data && data.length > 0) {
      console.log('[API /api/notificaciones] Primera notificación raw:', JSON.stringify(data[0], null, 2));
    }

    // Mapear los datos de la BD al formato esperado por el frontend
    const notificaciones = (data || []).map((notif: any) => {
      // Validar y normalizar el tipo
      let tipo: 'info' | 'success' | 'warning' | 'error' = 'info';
      if (notif.tipo && ['info', 'success', 'warning', 'error'].includes(notif.tipo.toLowerCase())) {
        tipo = notif.tipo.toLowerCase() as 'info' | 'success' | 'warning' | 'error';
      }

      // Generar URL basada en entidad_tipo y entidad_id
      let url: string | undefined = undefined;
      if (notif.entidad_tipo && notif.entidad_id) {
        switch (notif.entidad_tipo.toLowerCase()) {
          case 'formulario':
          case 'mensaje':
            url = `/panel/mensajes/${notif.entidad_id}`;
            break;
          case 'solicitud':
            url = `/panel/ventas/solicitudes/${notif.entidad_id}`;
            break;
          case 'cotizacion':
            url = `/panel/ventas/cotizaciones/${notif.entidad_id}`;
            break;
          case 'soporte':
            url = `/panel/soportes/gestion/${notif.entidad_id}`;
            break;
          default:
            // Si no hay mapeo específico, no generar URL
            url = undefined;
        }
      }

      return {
        id: notif.id,
        titulo: notif.titulo || 'Sin título',
        mensaje: notif.mensaje || '',
        tipo: tipo,
        leida: notif.leida === true || notif.leida === 'true' || notif.leida === 1,
        entidad_tipo: notif.entidad_tipo || undefined,
        entidad_id: notif.entidad_id || undefined,
        url: url,
        created_at: notif.created_at || new Date().toISOString()
      };
    });

    // Log temporal para debugging
    if (notificaciones.length > 0) {
      console.log('[API /api/notificaciones] Primera notificación mapeada:', JSON.stringify(notificaciones[0], null, 2));
    }

    // Siempre devolver array, aunque esté vacío
    return NextResponse.json(notificaciones);
  } catch (error) {
    // En caso de error inesperado, devolver array vacío para no romper el frontend
    console.error("Error en GET /api/notificaciones:", error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json([]);
  }
}
