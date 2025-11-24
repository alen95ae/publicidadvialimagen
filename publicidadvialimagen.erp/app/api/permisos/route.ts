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

    // Si es desarrollador, dar todos los permisos
    if (isDeveloper) {
      // Obtener todos los permisos disponibles
      const { data: permisosData } = await supabase
        .from('permisos')
        .select('*')
        .order('modulo', { ascending: true })
        .order('accion', { ascending: true });

      // Construir matriz con todos los permisos en true
      const permisosMatrix: Record<string, Record<string, boolean>> = {};
      (permisosData || []).forEach(permiso => {
        if (!permisosMatrix[permiso.modulo]) {
          permisosMatrix[permiso.modulo] = {};
        }
        permisosMatrix[permiso.modulo][permiso.accion] = true;
      });

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
    (permisosData || []).forEach(permiso => {
      if (!permisosMatrix[permiso.modulo]) {
        permisosMatrix[permiso.modulo] = {};
      }
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

    return NextResponse.json({ permisos: permisosMatrix });
  } catch (error) {
    console.error("Error al obtener permisos:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

