export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import {
  normalizarModulo,
  normalizarAccion,
  obtenerModulosPorDefectoPorRol,
  MODULOS_SIDEBAR
} from "@/lib/permisos-utils";

/**
 * API de Permisos - Gestión centralizada de permisos por usuario
 * 
 * IMPORTANTE - Uso de getSupabaseAdmin():
 * Esta API usa el cliente Admin de Supabase porque:
 * 1. Lee METADATOS del sistema (roles, permisos, rol_permisos)
 * 2. NO lee datos de negocio del usuario (soportes, ventas, contactos, etc.)
 * 3. Evita problemas de RLS en tablas de configuración del sistema
 * 4. El userId está verificado con JWT antes de consultar
 * 
 * NUNCA usar Admin para leer datos de negocio del usuario.
 */

// GET - Obtener permisos del usuario actual
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("session")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const session = await verifySession(token);
    if (!session || !session.sub) {
      return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
    }

    const userId = session.sub;

    // Cliente Admin SOLO para metadatos de permisos (ver comentario arriba)
    const supabaseClient = getSupabaseAdmin();

    // NO hay bypass por email - todos los usuarios (incluido desarrollador) obtienen permisos desde BD
    // Obtener rol_id del usuario
    const { data: userData } = await supabaseClient
      .from('usuarios')
      .select('rol_id')
      .eq('id', userId)
      .single();

    if (!userData || !userData.rol_id) {
      // Usuario sin rol = sin permisos (NO hay fallback)
      return NextResponse.json({ permisos: {} });
    }

    // Obtener todos los permisos disponibles
    const { data: permisosData } = await supabaseClient
      .from('permisos')
      .select('*')
      .order('modulo', { ascending: true })
      .order('accion', { ascending: true });

    // Obtener permisos asignados al rol
    const { data: rolPermisosData, error: rolPermisosError } = await supabaseClient
      .from('rol_permisos')
      .select('permiso_id')
      .eq('rol_id', userData.rol_id);

    // REGLA ABSOLUTA: Un permiso solo existe si está en rol_permisos
    // NO hay fallback - si no hay permisos asignados, el usuario no tiene acceso
    const permisoIds = (rolPermisosData || []).map(rp => rp.permiso_id);

    // Construir matriz de permisos
    // REGLA: Solo incluir permisos que están explícitamente asignados en rol_permisos
    const permisosMatrix: Record<string, Record<string, boolean>> = {};
    
    (permisosData || []).forEach(permiso => {
      // Normalizar módulo y acción antes de usarlas como claves
      const moduloNormalizado = normalizarModulo(permiso.modulo);
      const accionNormalizada = normalizarAccion(permiso.accion);
      const estaAsignado = permisoIds.includes(permiso.id);
      
      // ✅ SOLO agregar si está asignado en rol_permisos
      if (estaAsignado) {
        if (!permisosMatrix[moduloNormalizado]) {
          permisosMatrix[moduloNormalizado] = {};
        }
        permisosMatrix[moduloNormalizado][accionNormalizada] = true;
      }
      // Si no está asignado, NO crear entrada (no existe el permiso para este usuario)
    });

    // Aplicar lógica: si admin=true, forzar ver/editar/eliminar a true (solo para módulos no técnicos)
    // Esto es una conveniencia: admin implica ver/editar/eliminar, pero SOLO si admin está explícitamente asignado
    Object.keys(permisosMatrix).forEach(modulo => {
      const moduloNormalizado = normalizarModulo(modulo);
      if (moduloNormalizado !== 'tecnico' && permisosMatrix[modulo].admin === true) {
        // Admin está asignado explícitamente → otorgar ver/editar/eliminar
        permisosMatrix[modulo].ver = true;
        permisosMatrix[modulo].editar = true;
        permisosMatrix[modulo].eliminar = true;
      }
    });

    // Normalización: Si tiene admin/editar/eliminar pero no "ver", activar "ver"
    // Esto es una conveniencia lógica: no puedes editar/eliminar sin ver
    Object.keys(permisosMatrix).forEach((modulo) => {
      const permisos = permisosMatrix[modulo]
      const tieneAlguno = permisos.admin || permisos.editar || permisos.eliminar

      if (tieneAlguno && !permisos.ver) {
        permisos.ver = true
      }
    })

    // Log para verificar que el permiso de historial está en la matriz (para usuarios no desarrolladores)
    if (permisosMatrix['tecnico']) {
      console.log('🔍 [API Permisos] Matriz de permisos técnicos (no desarrollador):', {
        tieneModuloTecnico: !!permisosMatrix['tecnico'],
        tieneHistorial: permisosMatrix['tecnico']['ver historial soportes'],
        todasLasClaves: Object.keys(permisosMatrix['tecnico'] || {})
      });
    }

    return NextResponse.json({ permisos: permisosMatrix });
  } catch (error) {
    console.error("Error al obtener permisos:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

