import { getSupabaseServer } from "./supabaseServer";

export interface PermisosMatrix {
  [modulo: string]: {
    ver: boolean;
    editar: boolean;
    eliminar: boolean;
    admin: boolean;
  };
}

/**
 * Obtener permisos de un usuario desde el backend
 * @param userId ID del usuario
 * @returns Matriz de permisos
 */
export async function getPermisos(userId: string, userEmail?: string): Promise<PermisosMatrix> {
  const isDeveloper = userEmail?.toLowerCase() === "alen95ae@gmail.com";
  const supabase = getSupabaseServer();

  // Si es desarrollador, dar todos los permisos
  if (isDeveloper) {
    const { data: permisosData } = await supabase
      .from('permisos')
      .select('*')
      .order('modulo', { ascending: true })
      .order('accion', { ascending: true });

    const permisosMatrix: PermisosMatrix = {};
    (permisosData || []).forEach(permiso => {
      if (!permisosMatrix[permiso.modulo]) {
        permisosMatrix[permiso.modulo] = {
          ver: false,
          editar: false,
          eliminar: false,
          admin: false,
        };
      }
      permisosMatrix[permiso.modulo][permiso.accion as keyof typeof permisosMatrix[string]] = true;
    });

    return permisosMatrix;
  }

  // Obtener rol_id del usuario
  const { data: userData } = await supabase
    .from('usuarios')
    .select('rol_id')
    .eq('id', userId)
    .single();

  if (!userData || !userData.rol_id) {
    return {};
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
  const permisosMatrix: PermisosMatrix = {};
  (permisosData || []).forEach(permiso => {
    if (!permisosMatrix[permiso.modulo]) {
      permisosMatrix[permiso.modulo] = {
        ver: false,
        editar: false,
        eliminar: false,
        admin: false,
      };
    }
    permisosMatrix[permiso.modulo][permiso.accion as keyof typeof permisosMatrix[string]] = permisoIds.includes(permiso.id);
  });

  // Aplicar lógica: si admin=true, forzar todos a true
  Object.keys(permisosMatrix).forEach(modulo => {
    if (permisosMatrix[modulo].admin) {
      permisosMatrix[modulo].ver = true;
      permisosMatrix[modulo].editar = true;
      permisosMatrix[modulo].eliminar = true;
    }
  });

  return permisosMatrix;
}

/**
 * Verificar si un usuario tiene un permiso específico
 */
export function tienePermiso(
  permisos: PermisosMatrix,
  modulo: string,
  accion: "ver" | "editar" | "eliminar" | "admin"
): boolean {
  const moduloPermisos = permisos[modulo];
  if (!moduloPermisos) return false;

  // Si tiene admin, tiene todos los permisos
  if (moduloPermisos.admin) return true;

  return moduloPermisos[accion] || false;
}

/**
 * Verificar si puede ver un módulo
 */
export function puedeVer(permisos: PermisosMatrix, modulo: string): boolean {
  return tienePermiso(permisos, modulo, "ver") || tienePermiso(permisos, modulo, "admin");
}

/**
 * Verificar si puede editar
 */
export function puedeEditar(permisos: PermisosMatrix, modulo: string): boolean {
  return tienePermiso(permisos, modulo, "editar") || tienePermiso(permisos, modulo, "admin");
}

/**
 * Verificar si puede eliminar
 */
export function puedeEliminar(permisos: PermisosMatrix, modulo: string): boolean {
  return tienePermiso(permisos, modulo, "eliminar") || tienePermiso(permisos, modulo, "admin");
}

/**
 * Helper para verificar permisos en APIs del backend
 * Retorna un objeto con userId y permisos si tiene permiso, o un NextResponse con error si no lo tiene
 */
export async function requirePermiso(
  modulo: string,
  accion: "ver" | "editar" | "eliminar" | "admin"
): Promise<{ userId: string; userEmail?: string; permisos: PermisosMatrix } | Response> {
  const { NextResponse } = await import("next/server");
  const { verifySession } = await import("./auth");
  const { cookies } = await import("next/headers");
  
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  
  if (!token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const session = await verifySession(token);
  if (!session || !session.sub) {
    return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
  }

  const permisos = await getPermisos(session.sub, session.email);
  
  const isDeveloper = session.email?.toLowerCase() === "alen95ae@gmail.com";
  let tieneAcceso = false;

  if (isDeveloper) {
    tieneAcceso = true;
  } else {
    switch (accion) {
      case "ver":
        tieneAcceso = puedeVer(permisos, modulo);
        break;
      case "editar":
        tieneAcceso = puedeEditar(permisos, modulo);
        break;
      case "eliminar":
        tieneAcceso = puedeEliminar(permisos, modulo);
        break;
      case "admin":
        tieneAcceso = tienePermiso(permisos, modulo, "admin");
        break;
    }
  }

  if (!tieneAcceso) {
    return NextResponse.json(
      { error: `No tienes permiso para ${accion} en el módulo ${modulo}` },
      { status: 403 }
    );
  }

  return { userId: session.sub, userEmail: session.email, permisos };
}

