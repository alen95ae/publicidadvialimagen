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
    const isDeveloper = session.email?.toLowerCase() === "alen95ae@gmail.com";

    // Cliente Admin SOLO para metadatos de permisos (ver comentario arriba)
    const supabaseClient = getSupabaseAdmin();

    // Si es desarrollador, dar todos los permisos
    if (isDeveloper) {
      // Obtener todos los permisos disponibles
      const { data: permisosData } = await supabaseClient
        .from('permisos')
        .select('*')
        .order('modulo', { ascending: true })
        .order('accion', { ascending: true });

      // Construir matriz con todos los permisos en true (normalizados)
      const permisosMatrix: Record<string, Record<string, boolean>> = {};
      (permisosData || []).forEach(permiso => {
        const moduloNormalizado = normalizarModulo(permiso.modulo);
        const accionNormalizada = normalizarAccion(permiso.accion);
        
        if (!permisosMatrix[moduloNormalizado]) {
          permisosMatrix[moduloNormalizado] = {};
        }
        permisosMatrix[moduloNormalizado][accionNormalizada] = true;
      });

      // 🔒 Desarrollador = acceso total implícito a todos los módulos del sidebar
      MODULOS_SIDEBAR.forEach((modulo) => {
        if (!permisosMatrix[modulo]) {
          permisosMatrix[modulo] = {
            ver: true,
            editar: true,
            eliminar: true,
            admin: true
          }
        }
      })

      return NextResponse.json({ permisos: permisosMatrix });
    }

    // Obtener rol_id del usuario
    const { data: userData } = await supabaseClient
      .from('usuarios')
      .select('rol_id')
      .eq('id', userId)
      .single();

    if (!userData || !userData.rol_id) {
      // Usuario sin rol, sin permisos
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


    let permisoIds = (rolPermisosData || []).map(rp => rp.permiso_id);

    // 🛡️ FALLBACK DE SEGURIDAD: Si no hay permisos asignados, aplicar permisos por defecto
    // Esto previene que usuarios con roles válidos queden sin acceso al sistema
    // PRIORIDAD: 1) rol_permisos (BD) → 2) permisos por defecto del rol
    if (permisoIds.length === 0) {
      const { data: rolData } = await supabaseClient
        .from('roles')
        .select('nombre')
        .eq('id', userData.rol_id)
        .single();
      
      const rolNombre = rolData?.nombre || '';
      const modulosPermitidos = obtenerModulosPorDefectoPorRol(rolNombre);
      
      // Filtrar permisosData para obtener solo los IDs de "ver" de esos módulos
      const permisosDefecto = (permisosData || []).filter(p => {
        const modulo = normalizarModulo(p.modulo);
        const accion = normalizarAccion(p.accion);
        return modulosPermitidos.includes(modulo) && accion === 'ver';
      });
      
      permisoIds = permisosDefecto.map(p => p.id);
    }

    // Construir matriz de permisos
    const permisosMatrix: Record<string, Record<string, boolean>> = {};
    
    // Inicializar módulo técnico SIEMPRE
    permisosMatrix['tecnico'] = {};
    
    (permisosData || []).forEach(permiso => {
      // Normalizar módulo y acción antes de usarlas como claves
      const moduloNormalizado = normalizarModulo(permiso.modulo);
      const accionNormalizada = normalizarAccion(permiso.accion);
      const estaAsignado = permisoIds.includes(permiso.id);
      
      // ✅ Solo agregar si está asignado O si el módulo ya existe
      if (estaAsignado) {
        if (!permisosMatrix[moduloNormalizado]) {
          permisosMatrix[moduloNormalizado] = {};
        }
        permisosMatrix[moduloNormalizado][accionNormalizada] = true;
      } else if (permisosMatrix[moduloNormalizado]) {
        // Si el módulo ya existe (tiene otros permisos), marcar este como false
        permisosMatrix[moduloNormalizado][accionNormalizada] = false;
      }
      // ✅ Si no está asignado Y el módulo no existe, NO crear entrada
    });

    // Aplicar lógica: si admin=true en cualquier módulo, dar todos los permisos técnicos
    const tieneAdminEnAlgunModulo = Object.keys(permisosMatrix).some(modulo => 
      modulo !== 'tecnico' && permisosMatrix[modulo].admin === true
    );

    // Si tiene admin en algún módulo, dar todos los permisos técnicos EXCEPTO "ver dueño de casa"
    // "ver dueño de casa" solo se otorga si está explícitamente seleccionado en el rol
    if (tieneAdminEnAlgunModulo) {
      const permisosTecnicos = permisosData?.filter(p => normalizarModulo(p.modulo) === 'tecnico') || [];
      permisosTecnicos.forEach(permiso => {
        const moduloNormalizado = normalizarModulo(permiso.modulo);
        const accionNormalizada = normalizarAccion(permiso.accion);
        
        if (!permisosMatrix[moduloNormalizado]) {
          permisosMatrix[moduloNormalizado] = {};
        }
        // "ver dueño de casa" solo se otorga si está explícitamente asignado al rol
        if (accionNormalizada === 'ver dueño de casa') {
          // Asegurar que el valor se establezca correctamente según si está en el rol
          const estaEnRol = permisoIds.includes(permiso.id);
          permisosMatrix[moduloNormalizado][accionNormalizada] = estaEnRol;
        } else {
          // Otros permisos técnicos se otorgan automáticamente por admin
          permisosMatrix[moduloNormalizado][accionNormalizada] = true;
        }
      });
    }

    // Aplicar lógica: si admin=true, forzar todos a true (solo para módulos no técnicos)
    Object.keys(permisosMatrix).forEach(modulo => {
      const moduloNormalizado = normalizarModulo(modulo);
      if (moduloNormalizado !== 'tecnico' && permisosMatrix[modulo].admin) {
        permisosMatrix[modulo].ver = true;
        permisosMatrix[modulo].editar = true;
        permisosMatrix[modulo].eliminar = true;
      }
    });

    // SOLUCIÓN QUIRÚRGICA: Asegurar que "ver dueño de casa" SIEMPRE sea boolean (nunca undefined)
    // Esto evita problemas de normalización o claves que no coinciden
    if (permisosMatrix['tecnico']) {
      const accionVerDuenoCasa = 'ver dueño de casa';
      if (permisosMatrix['tecnico'][accionVerDuenoCasa] === undefined) {
        // Si no existe la clave, verificar si el permiso está en el rol
        const permisoVerDuenoCasa = permisosData?.find(
          p => normalizarModulo(p.modulo) === 'tecnico' && normalizarAccion(p.accion) === accionVerDuenoCasa
        );
        if (permisoVerDuenoCasa) {
          permisosMatrix['tecnico'][accionVerDuenoCasa] = permisoIds.includes(permisoVerDuenoCasa.id);
        } else {
          permisosMatrix['tecnico'][accionVerDuenoCasa] = false;
        }
      }
      // Asegurar que el valor sea explícitamente boolean
      permisosMatrix['tecnico'][accionVerDuenoCasa] = Boolean(permisosMatrix['tecnico'][accionVerDuenoCasa]);
    }



    // 🔐 Normalización: Si tiene admin/editar/eliminar pero no "ver", activar "ver"
    Object.keys(permisosMatrix).forEach((modulo) => {
      const permisos = permisosMatrix[modulo]
      const tieneAlguno = permisos.admin || permisos.editar || permisos.eliminar || permisos.ver

      if (tieneAlguno && !permisos.ver) {
        permisos.ver = true
      }
    })

    // 🛡️ PROTECCIÓN FINAL: Garantizar que siempre hay al menos módulo técnico
    // Esto previene completamente el escenario de menú vacío
    if (Object.keys(permisosMatrix).length === 0) {
      permisosMatrix['tecnico'] = {};
    }

    return NextResponse.json({ permisos: permisosMatrix });
  } catch (error) {
    console.error("Error al obtener permisos:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

