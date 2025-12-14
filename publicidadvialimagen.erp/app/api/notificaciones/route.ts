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
    console.log('[GET /api/notificaciones] 🔍 ROL DEL USUARIO:', rolUsuario);

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

    console.log('[GET /api/notificaciones] 📊 TOTAL notificaciones en BD:', todasNotificaciones?.length || 0);
    console.log('[GET /api/notificaciones] 🔍 Primeras 3 notificaciones (debug):');
    todasNotificaciones?.slice(0, 3).forEach((n: any, i: number) => {
      console.log(`  [${i}] ID: ${n.id}, roles_destino: ${JSON.stringify(n.roles_destino)}, leida: ${n.leida}`);
    });

    // 3. Filtrar por rol del usuario y estado de lectura (MODELO LEGACY)
    const notificacionesFiltradas = (todasNotificaciones || []).filter((notif: any) => {
      const roles = notif.roles_destino || [];
      
      // Normalizar roles de forma más robusta
      const rolesNormalizados = Array.isArray(roles) 
        ? roles.map((r: any) => String(r).toLowerCase().trim())
        : [];
      
      const tieneRol = rolesNormalizados.includes(rolUsuario);
      const noLeida = notif.leida === false || notif.leida === null;
      
      // Debug detallado
      if (notif.id === '849782d8-32fa-4934-8421-eaafa045d613') {
        console.log('[GET /api/notificaciones] 🎯 NOTIFICACIÓN DE PRUEBA ENCONTRADA:');
        console.log(`  - roles_destino raw: ${JSON.stringify(roles)}`);
        console.log(`  - roles tipo: ${typeof roles}, isArray: ${Array.isArray(roles)}`);
        console.log(`  - roles[0] tipo: ${typeof roles[0]}, valor: "${roles[0]}"`);
        console.log(`  - roles normalizados: ${JSON.stringify(rolesNormalizados)}`);
        console.log(`  - rol usuario: "${rolUsuario}"`);
        console.log(`  - tieneRol: ${tieneRol}`);
        console.log(`  - includes check: ${rolesNormalizados.includes(rolUsuario)}`);
        console.log(`  - leida: ${notif.leida}`);
        console.log(`  - noLeida: ${noLeida}`);
        console.log(`  - PASA FILTRO: ${tieneRol && noLeida}`);
      }
      
      return tieneRol && noLeida;
    });

    console.log('[GET /api/notificaciones] ✅ Notificaciones filtradas:', notificacionesFiltradas.length);

    // 4. Construir respuesta
    const notificaciones = notificacionesFiltradas
      .map((notif: any) => {
        // Construir URL desde entidad_tipo y entidad_id
        let url = null;
        if (notif.entidad_tipo && notif.entidad_id) {
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
