import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabaseServer";

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

    const supabase = getSupabaseServer();

    // Función para normalizar módulos y acciones (elimina espacios, normaliza encoding)
    const normalizarModulo = (modulo: string | undefined | null): string => {
      if (!modulo) return '';
      return modulo
        .normalize("NFD")      // elimina acentos
        .replace(/[\u0300-\u036f]/g, "")  // elimina diacríticos
        .trim()                 // elimina espacios al inicio/final
        .replace(/\s+/g, " ")   // colapsa espacios múltiples a uno solo
        .toLowerCase();         // convierte a minúsculas
    };

    const normalizarAccion = (accion: string | undefined | null): string => {
      if (!accion) return '';
      return accion
        .trim()                 // elimina espacios al inicio/final
        .replace(/\s+/g, " ");  // colapsa espacios múltiples a uno solo
      // NO eliminar acentos ni convertir a minúsculas para mantener "ver dueño de casa"
    };

    // Si es desarrollador, dar todos los permisos
    if (isDeveloper) {
      // Obtener todos los permisos disponibles
      const { data: permisosData } = await supabase
        .from('permisos')
        .select('*')
        .order('modulo', { ascending: true })
        .order('accion', { ascending: true });

      console.log('🔍 [Permisos API] Desarrollador - Permisos encontrados:', permisosData?.length || 0);
      console.log('🔍 [Permisos API] Módulos únicos:', [...new Set(permisosData?.map(p => p.modulo) || [])]);
      
      // Verificar si existe sitio_web
      const sitioWebPermisos = permisosData?.filter(p => p.modulo === 'sitio_web' || p.modulo === 'sitio' || p.modulo === 'web') || [];
      console.log('🔍 [Permisos API] Permisos sitio/sitio_web/web:', sitioWebPermisos);

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
      
      // Log para depuración de permisos técnicos
      const permisosTecnicos = permisosMatrix['tecnico'] || {};
      console.log('🔍 [Permisos API] Desarrollador - Permisos técnicos:', {
        total: Object.keys(permisosTecnicos).length,
        permisos: permisosTecnicos,
        'ver historial soportes': permisosTecnicos['ver historial soportes']
      });

      // Asegurar que sitio_web tenga todos los permisos si no existe
      if (!permisosMatrix['sitio_web'] && !permisosMatrix['sitio'] && !permisosMatrix['web']) {
        console.log('⚠️ [Permisos API] No se encontraron permisos para sitio/sitio_web/web, creando permisos por defecto');
        permisosMatrix['sitio_web'] = {
          ver: true,
          editar: true,
          eliminar: true,
          admin: true
        };
      }

      return NextResponse.json({ permisos: permisosMatrix });
    }

    // Obtener rol_id del usuario
    const { data: userData } = await supabase
      .from('usuarios')
      .select('rol_id')
      .eq('id', userId)
      .single();

    if (!userData || !userData.rol_id) {
      // Usuario sin rol, sin permisos
      return NextResponse.json({ permisos: {} });
    }

    // Obtener todos los permisos disponibles
    const { data: permisosData } = await supabase
      .from('permisos')
      .select('*')
      .order('modulo', { ascending: true })
      .order('accion', { ascending: true });

    // Obtener permisos asignados al rol
    const { data: rolPermisosData } = await supabase
      .from('rol_permisos')
      .select('permiso_id')
      .eq('rol_id', userData.rol_id);

    const permisoIds = (rolPermisosData || []).map(rp => rp.permiso_id);

    // Construir matriz de permisos
    const permisosMatrix: Record<string, Record<string, boolean>> = {};
    
    // Inicializar módulo técnico SIEMPRE
    permisosMatrix['tecnico'] = {};
    
    (permisosData || []).forEach(permiso => {
      // Normalizar módulo y acción antes de usarlas como claves
      const moduloNormalizado = normalizarModulo(permiso.modulo);
      const accionNormalizada = normalizarAccion(permiso.accion);
      
      if (!permisosMatrix[moduloNormalizado]) {
        permisosMatrix[moduloNormalizado] = {};
      }
      const estaAsignado = permisoIds.includes(permiso.id);
      permisosMatrix[moduloNormalizado][accionNormalizada] = estaAsignado;
      
      // Log específico para "ver dueño de casa"
      if (moduloNormalizado === 'tecnico' && accionNormalizada === 'ver dueño de casa') {
        console.log('🔍 [Permisos API] Permiso "ver dueño de casa":', {
          permisoId: permiso.id,
          estaEnRol: estaAsignado,
          permisoIds: permisoIds,
          moduloOriginal: permiso.modulo,
          moduloNormalizado: moduloNormalizado,
          accionOriginal: permiso.accion,
          accionNormalizada: accionNormalizada,
          claveUsada: `${moduloNormalizado}.${accionNormalizada}`
        });
      }
    });

    // Aplicar lógica: si admin=true, forzar todos a true (solo para módulos no técnicos)
    Object.keys(permisosMatrix).forEach(modulo => {
      const moduloNormalizado = normalizarModulo(modulo);
      if (moduloNormalizado !== 'tecnico' && permisosMatrix[modulo].admin) {
        permisosMatrix[modulo].ver = true;
        permisosMatrix[modulo].editar = true;
        permisosMatrix[modulo].eliminar = true;
      }
    });

    // Log para depuración de permisos técnicos
    const permisosTecnicosFinal = permisosMatrix['tecnico'] || {};
    console.log('🔍 [Permisos API] Permisos técnicos para usuario:', {
      userId,
      permisosTecnicos: permisosTecnicosFinal,
      'ver dueño de casa': permisosTecnicosFinal['ver dueño de casa'],
      'todasLasClaves': Object.keys(permisosTecnicosFinal),
      'permisoIds del rol': permisoIds,
      'tipoVerDuenoCasa': typeof permisosTecnicosFinal['ver dueño de casa']
    });

    // Log para depuración del módulo sitio
    const sitioPermisos = permisosMatrix['sitio'] || permisosMatrix['sitio_web'] || permisosMatrix['web'] || {};
    console.log('🔍 [Permisos API] Permisos sitio para usuario:', { 
      userId, 
      sitio: permisosMatrix['sitio'], 
      sitio_web: permisosMatrix['sitio_web'], 
      web: permisosMatrix['web'],
      sitioPermisos 
    });

    return NextResponse.json({ permisos: permisosMatrix });
  } catch (error) {
    console.error("Error al obtener permisos:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

