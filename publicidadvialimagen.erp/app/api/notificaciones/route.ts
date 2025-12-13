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
      console.error("Error obteniendo notificaciones:", error.message);
      return NextResponse.json(
        { error: "Error al obtener notificaciones", details: error.message },
        { status: 500 }
      );
    }

    // Devolver formato EXACTO de la tabla + url construida desde entidad_tipo
    const notificaciones = (data || []).map((notif: any) => {
      // Construir URL desde entidad_tipo y entidad_id si no existe
      let url = notif.url;
      if (!url && notif.entidad_tipo && notif.entidad_id) {
        switch (notif.entidad_tipo.toLowerCase()) {
          case 'formulario':
            url = `/panel/mensajes/formularios?id=${notif.entidad_id}`;
            break;
          case 'cotizacion':
            url = `/panel/ventas/cotizaciones/${notif.entidad_id}`;
            break;
          case 'alquiler':
            url = `/panel/soportes/alquileres?id=${notif.entidad_id}`;
            break;
          case 'mantenimiento':
            url = `/panel/soportes/mantenimiento?id=${notif.entidad_id}`;
            break;
          case 'solicitud':
            url = `/panel/ventas/solicitudes/${notif.entidad_id}`;
            break;
          case 'soporte':
            url = `/panel/soportes/gestion/${notif.entidad_id}`;
            break;
          case 'producto':
            url = `/panel/inventario?id=${notif.entidad_id}`;
            break;
          case 'factura':
            url = `/panel/contabilidad/facturas/${notif.entidad_id}`;
            break;
          case 'evento':
            url = `/panel/calendario?evento=${notif.entidad_id}`;
            break;
          default:
            url = null;
        }
      }

      return {
        id: notif.id,
        tipo: notif.tipo || 'info',
        titulo: notif.titulo || 'Sin título',
        mensaje: notif.mensaje || '',
        prioridad: notif.prioridad || 'media',
        leida: notif.leida === true || notif.leida === 'true' || notif.leida === 1,
        entidad_tipo: notif.entidad_tipo || null,
        entidad_id: notif.entidad_id || null,
        url: url || null,
        created_at: notif.created_at || new Date().toISOString()
      };
    });

    return NextResponse.json(notificaciones);
  } catch (error) {
    console.error("Error en GET /api/notificaciones:", error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
