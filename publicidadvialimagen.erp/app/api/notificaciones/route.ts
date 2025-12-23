export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { verifySession } from "@/lib/auth/verifySession";

/**
 * GET - Obtener notificaciones del usuario actual
 * 
 * MODELO LEGACY:
 * - Obtiene el rol del usuario
 * - Devuelve notificaciones donde rol ∈ roles_destino
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
      console.error("Error obteniendo usuario:", usuarioError);
      return NextResponse.json(
        { error: "Error al obtener datos del usuario" },
        { status: 500 }
      );
    }

    const { data: rolData, error: rolError } = await supabase
      .from('roles')
      .select('nombre')
      .eq('id', usuarioData.rol_id)
      .single();

    if (rolError || !rolData) {
      console.error("Error obteniendo rol:", rolError);
      return NextResponse.json(
        { error: "Error al obtener rol del usuario" },
        { status: 500 }
      );
    }

    const rolUsuario = rolData.nombre.toLowerCase().trim();

    // 2. Obtener notificaciones donde el rol del usuario está en roles_destino
    // Obtener todas y filtrar manualmente (más confiable que contains con arrays)
    const { data: todasNotificaciones, error: notificacionesError } = await supabase
      .from('notificaciones')
      .select('*')
      .order('created_at', { ascending: false });

    if (notificacionesError) {
      console.error("Error obteniendo notificaciones:", notificacionesError.message);
      return NextResponse.json(
        { error: "Error al obtener notificaciones", details: notificacionesError.message },
        { status: 500 }
      );
    }

    // 3. Filtrar por rol del usuario y estado de lectura (MODELO LEGACY)
    const notificacionesFiltradas = (todasNotificaciones || []).filter((notif: any) => {
      const roles = notif.roles_destino || [];
      
      // Normalizar roles de forma más robusta
      const rolesNormalizados = Array.isArray(roles) 
        ? roles.map((r: any) => String(r).toLowerCase().trim())
        : [];
      
      const tieneRol = rolesNormalizados.includes(rolUsuario);
      const noLeida = notif.leida === false || notif.leida === null;
      
      return tieneRol && noLeida;
    });

    // 4. Construir respuesta
    const notificaciones = notificacionesFiltradas
      .map((notif: any) => {
        // Construir URL desde entidad_tipo y entidad_id
        // IMPORTANTE: Usar las mismas rutas que getNotificationUrl() en el frontend
        let url = null;
        if (notif.entidad_tipo && notif.entidad_id) {
          switch (notif.entidad_tipo.toLowerCase()) {
            case 'formulario':
              url = `/panel/mensajes/formularios?id=${notif.entidad_id}`;
              break;
            case 'mensaje':
              url = `/panel/mensajes`;
              break;
            case 'cotizacion':
              // La ruta correcta es /panel/ventas/editar/[id] para ver/editar cotizaciones
              url = `/panel/ventas/editar/${notif.entidad_id}`;
              break;
            case 'alquiler':
              url = `/panel/soportes/alquileres?id=${notif.entidad_id}`;
              break;
            case 'mantenimiento':
              url = `/panel/soportes/mantenimiento?id=${notif.entidad_id}`;
              break;
            case 'solicitud':
              // La ruta correcta es /panel/ventas/solicitudes/[id]
              url = `/panel/ventas/solicitudes/${notif.entidad_id}`;
              break;
            case 'soporte':
              // La ruta correcta es /panel/soportes/[id] para ver un soporte específico
              url = `/panel/soportes/${notif.entidad_id}`;
              break;
            case 'producto':
              url = `/panel/inventario?id=${notif.entidad_id}`;
              break;
            case 'factura':
              // No existe una página de detalle de factura individual, redirigir a la lista
              url = `/panel/contabilidad/facturas/manuales`;
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
          leida: notif.leida || false, // MODELO LEGACY: usar notificaciones.leida
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
