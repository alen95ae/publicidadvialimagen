import { getSupabaseServer } from "./supabaseServer";

export interface PermisosMatrix {
  [modulo: string]: {
    ver?: boolean;
    editar?: boolean;
    eliminar?: boolean;
    admin?: boolean;
    [accion: string]: boolean | undefined; // Permite acciones personalizadas (permisos técnicos)
  };
}

/**
 * Obtener permisos de un usuario desde el backend
 * @param userId ID del usuario
 * @returns Matriz de permisos
 * 
 * IMPORTANTE: No hay bypass por email. Todos los usuarios (incluido desarrollador)
 * obtienen permisos desde rol_permisos en la base de datos.
 */
export async function getPermisos(userId: string, userEmail?: string): Promise<PermisosMatrix> {
  const supabase = getSupabaseServer();

  // Obtener rol_id del usuario
  const { data: userData } = await supabase
    .from('usuarios')
    .select('rol_id')
    .eq('id', userId)
    .single();

  if (!userData || !userData.rol_id) {
    // Usuario sin rol = sin permisos
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
      permisosMatrix[permiso.modulo] = {};
    }
    // Para módulos normales, inicializar acciones estándar si no existen
    if (permiso.modulo !== 'tecnico') {
      if (permisosMatrix[permiso.modulo].ver === undefined) permisosMatrix[permiso.modulo].ver = false;
      if (permisosMatrix[permiso.modulo].editar === undefined) permisosMatrix[permiso.modulo].editar = false;
      if (permisosMatrix[permiso.modulo].eliminar === undefined) permisosMatrix[permiso.modulo].eliminar = false;
      if (permisosMatrix[permiso.modulo].admin === undefined) permisosMatrix[permiso.modulo].admin = false;
    }
    // Asignar el permiso (funciona para acciones estándar y personalizadas)
    permisosMatrix[permiso.modulo][permiso.accion] = permisoIds.includes(permiso.id);
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
  accion: "ver" | "editar" | "eliminar" | "admin" | string
): boolean {
  const moduloPermisos = permisos[modulo];
  if (!moduloPermisos) return false;

  // Si tiene admin (solo para módulos no técnicos), tiene todos los permisos estándar
  if (modulo !== 'tecnico' && moduloPermisos.admin) {
    // Para módulos normales, admin da acceso a ver, editar, eliminar
    if (accion === 'ver' || accion === 'editar' || accion === 'eliminar' || accion === 'admin') {
      return true;
    }
  }

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
  
  // Verificar permisos según la acción solicitada
  // NO hay bypass por email - todos los usuarios (incluido desarrollador) usan permisos reales
  let tieneAcceso = false;
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

  if (!tieneAcceso) {
    return NextResponse.json(
      { error: `No tienes permiso para ${accion} en el módulo ${modulo}` },
      { status: 403 }
    );
  }

  return { userId: session.sub, userEmail: session.email, permisos };
}

/**
 * Helper para verificar permisos técnicos en APIs del backend
 * Retorna un objeto con userId y permisos si tiene permiso, o un NextResponse con error si no lo tiene
 * Esta función es específica para permisos técnicos que tienen acciones personalizadas
 */
export async function requirePermisoTecnico(
  accion: string
): Promise<{ userId: string; userEmail?: string; permisos: PermisosMatrix } | Response> {
  const { NextResponse } = await import("next/server");
  const { verifySession } = await import("./auth");
  const { cookies } = await import("next/headers");
  const { getSupabaseServer } = await import("./supabaseServer");
  
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  
  if (!token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const session = await verifySession(token);
  if (!session || !session.sub) {
    return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
  }

  // NO hay bypass por email - todos los usuarios (incluido desarrollador) usan permisos reales
  const supabase = getSupabaseServer();

  // Obtener rol_id del usuario
  const { data: userData } = await supabase
    .from('usuarios')
    .select('rol_id')
    .eq('id', session.sub)
    .single();

  if (!userData || !userData.rol_id) {
    return NextResponse.json(
      { error: `No tienes permiso para ${accion}` },
      { status: 403 }
    );
  }

  // Buscar el permiso técnico específico
  const { data: permisoData } = await supabase
    .from('permisos')
    .select('id')
    .eq('modulo', 'tecnico')
    .eq('accion', accion)
    .single();

  if (!permisoData) {
    return NextResponse.json(
      { error: `Permiso técnico '${accion}' no encontrado` },
      { status: 500 }
    );
  }

  // Verificar si el rol tiene este permiso
  const { data: rolPermisoData } = await supabase
    .from('rol_permisos')
    .select('permiso_id')
    .eq('rol_id', userData.rol_id)
    .eq('permiso_id', permisoData.id)
    .single();

  if (!rolPermisoData) {
    return NextResponse.json(
      { error: `No tienes permiso para ${accion}` },
      { status: 403 }
    );
  }

  const permisos = await getPermisos(session.sub, session.email);
  return { userId: session.sub, userEmail: session.email, permisos };
}

