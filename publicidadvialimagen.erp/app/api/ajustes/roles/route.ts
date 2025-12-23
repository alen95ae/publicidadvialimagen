export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { requirePermiso } from "@/lib/permisos";

// GET - Obtener roles disponibles con sus permisos
export async function GET(request: NextRequest) {
  try {
    const authResult = await requirePermiso("ajustes", "admin");
    if (authResult instanceof NextResponse) return authResult;

    const supabase = getSupabaseServer();
    
    // 1. Obtener todos los roles
    const { data: rolesData, error: rolesError } = await supabase
      .from('roles')
      .select('*')
      .order('nombre', { ascending: true });

    if (rolesError) {
      console.error("Error al obtener roles de Supabase:", rolesError);
      return NextResponse.json({ error: "Error al obtener roles" }, { status: 500 });
    }

    // 2. Obtener todos los permisos disponibles
    const { data: permisosData, error: permisosError } = await supabase
      .from('permisos')
      .select('*')
      .order('modulo', { ascending: true })
      .order('accion', { ascending: true });

    if (permisosError) {
      console.error("Error al obtener permisos de Supabase:", permisosError);
      return NextResponse.json({ error: "Error al obtener permisos" }, { status: 500 });
    }

    // 3. Obtener todas las asignaciones de permisos a roles
    const { data: rolPermisosData, error: rolPermisosError } = await supabase
      .from('rol_permisos')
      .select('*');

    if (rolPermisosError) {
      console.error("Error al obtener rol_permisos de Supabase:", rolPermisosError);
      return NextResponse.json({ error: "Error al obtener asignaciones de permisos" }, { status: 500 });
    }

    // 4. Construir estructura de permisos por rol
    const roles = (rolesData || []).map(role => {
      // Obtener los permiso_id asignados a este rol
      const permisoIds = (rolPermisosData || [])
        .filter(rp => rp.rol_id === role.id)
        .map(rp => rp.permiso_id);

      // Construir estructura: { modulo: { accion: true/false } }
      const permisosMatrix: Record<string, Record<string, boolean>> = {};
      
      // Función auxiliar para normalizar módulos (elimina acentos, espacios, mayúsculas, etc.)
      const normalizarModulo = (modulo: string | undefined | null): string => {
        if (!modulo) return '';
        return modulo
          .normalize("NFD")      // elimina acentos
          .replace(/[\u0300-\u036f]/g, "")  // elimina diacríticos
          .trim()                 // elimina espacios al inicio/final
          .toLowerCase();         // convierte a minúsculas
      };

      // Separar permisos técnicos (módulo "tecnico" normalizado)
      const permisosTecnicos: Array<{ id: string; accion: string; asignado: boolean }> = [];
      
      (permisosData || []).forEach(permiso => {
        // Normalizar módulo para evitar errores por espacios, acentos o mayúsculas
        const moduloNormalizado = normalizarModulo(permiso.modulo);
        
        // Incluir en Funciones Técnicas: todos los permisos del módulo "tecnico" (normalizado)
        if (moduloNormalizado === 'tecnico') {
          permisosTecnicos.push({
            id: permiso.id,
            accion: permiso.accion,
            asignado: permisoIds.includes(permiso.id),
          });
        } else {
          // Usar módulo normalizado como clave
          if (!permisosMatrix[moduloNormalizado]) {
            permisosMatrix[moduloNormalizado] = {};
          }
          permisosMatrix[moduloNormalizado][permiso.accion] = permisoIds.includes(permiso.id);
        }
      });

      return {
        id: role.id,
        nombre: role.nombre,
        descripcion: role.descripcion || "",
        permisos: permisosMatrix,
        permisosTecnicos: permisosTecnicos,
      };
    });

    return NextResponse.json({ 
      roles,
      permisos: permisosData || [] // También devolver la lista de permisos disponibles
    });
  } catch (error) {
    console.error("Error al obtener roles:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// POST - Crear nuevo rol
export async function POST(request: NextRequest) {
  try {
    const authResult = await requirePermiso("ajustes", "admin");
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { nombre, descripcion, permisos, permisosTecnicos } = body; // permisos es un array de permiso_id, permisosTecnicos también

    console.log("📝 POST /api/ajustes/roles - Datos recibidos:", { nombre, descripcion, permisos, permisosTecnicos });

    if (!nombre || !descripcion) {
      return NextResponse.json({ error: "Nombre y descripción son obligatorios" }, { status: 400 });
    }

    const supabase = getSupabaseServer();

    // 1. Crear el rol
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .insert([{ nombre, descripcion }])
      .select()
      .single();

    if (roleError) {
      console.error("❌ Error al crear rol en Supabase:", roleError);
      return NextResponse.json({ error: `Error al crear rol: ${roleError.message}` }, { status: 500 });
    }

    // 2. Insertar permisos si se proporcionaron
    const todosLosPermisos = [
      ...(permisos && Array.isArray(permisos) ? permisos : []),
      ...(permisosTecnicos && Array.isArray(permisosTecnicos) ? permisosTecnicos : []),
    ];

    if (todosLosPermisos.length > 0) {
      const rolPermisosToInsert = todosLosPermisos.map((permisoId: string) => ({
        rol_id: roleData.id,
        permiso_id: permisoId,
      }));

      const { error: insertError } = await supabase
        .from('rol_permisos')
        .insert(rolPermisosToInsert);

      if (insertError) {
        console.error("❌ Error al insertar permisos:", insertError);
        // No fallar, solo loguear el error
      }
    }

    // 3. Obtener permisos para la respuesta
    const { data: permisosData } = await supabase
      .from('permisos')
      .select('*')
      .order('modulo', { ascending: true })
      .order('accion', { ascending: true });

    const { data: rolPermisosData } = await supabase
      .from('rol_permisos')
      .select('permiso_id')
      .eq('rol_id', roleData.id);

    const permisoIds = (rolPermisosData || []).map(rp => rp.permiso_id);
    const permisosMatrix: Record<string, Record<string, boolean>> = {};
    
    (permisosData || []).forEach(permiso => {
      if (!permisosMatrix[permiso.modulo]) {
        permisosMatrix[permiso.modulo] = {};
      }
      permisosMatrix[permiso.modulo][permiso.accion] = permisoIds.includes(permiso.id);
    });

    console.log("✅ Rol creado correctamente");

    return NextResponse.json({ 
      role: {
        id: roleData.id,
        nombre: roleData.nombre,
        descripcion: roleData.descripcion,
        permisos: permisosMatrix,
      }
    });
  } catch (error) {
    console.error("Error al crear rol:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// PUT - Actualizar rol y sus permisos
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requirePermiso("ajustes", "admin");
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { id, nombre, descripcion, permisos, permisosTecnicos: permisosTecnicosIds } = body; // permisos es un array de permiso_id, permisosTecnicos también

    console.log("📝 PUT /api/ajustes/roles - Datos recibidos:", { id, nombre, descripcion, permisos, permisosTecnicos: permisosTecnicosIds });

    if (!id || !nombre || !descripcion) {
      return NextResponse.json({ error: "ID, nombre y descripción son obligatorios" }, { status: 400 });
    }

    const supabase = getSupabaseServer();

    // 1. Actualizar nombre y descripción del rol
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .update({ nombre, descripcion })
      .eq('id', id)
      .select()
      .single();

    if (roleError) {
      console.error("❌ Error al actualizar rol en Supabase:", roleError);
      return NextResponse.json({ error: `Error al actualizar rol: ${roleError.message}` }, { status: 500 });
    }

    // 2. Borrar todos los permisos previos del rol
    const { error: deleteError } = await supabase
      .from('rol_permisos')
      .delete()
      .eq('rol_id', id);

    if (deleteError) {
      console.error("❌ Error al eliminar permisos previos:", deleteError);
      return NextResponse.json({ error: `Error al eliminar permisos previos: ${deleteError.message}` }, { status: 500 });
    }

    // 3. Insertar nuevos permisos (módulos + técnicos) si se proporcionaron
    const todosLosPermisos = [
      ...(permisos && Array.isArray(permisos) ? permisos : []),
      ...(permisosTecnicosIds && Array.isArray(permisosTecnicosIds) ? permisosTecnicosIds : []),
    ];

    if (todosLosPermisos.length > 0) {
      const rolPermisosToInsert = todosLosPermisos.map((permisoId: string) => ({
        rol_id: id,
        permiso_id: permisoId,
      }));

      const { error: insertError } = await supabase
        .from('rol_permisos')
        .insert(rolPermisosToInsert);

      if (insertError) {
        console.error("❌ Error al insertar nuevos permisos:", insertError);
        return NextResponse.json({ error: `Error al insertar permisos: ${insertError.message}` }, { status: 500 });
      }
    }

    // 4. Obtener permisos actualizados para la respuesta
    const { data: permisosData } = await supabase
      .from('permisos')
      .select('*')
      .order('modulo', { ascending: true })
      .order('accion', { ascending: true });

    const { data: rolPermisosData } = await supabase
      .from('rol_permisos')
      .select('permiso_id')
      .eq('rol_id', id);

    const permisoIds = (rolPermisosData || []).map(rp => rp.permiso_id);
    // Función auxiliar para normalizar módulos (elimina acentos, espacios, mayúsculas, etc.)
    const normalizarModulo = (modulo: string | undefined | null): string => {
      if (!modulo) return '';
      return modulo
        .normalize("NFD")      // elimina acentos
        .replace(/[\u0300-\u036f]/g, "")  // elimina diacríticos
        .trim()                 // elimina espacios al inicio/final
        .toLowerCase();         // convierte a minúsculas
    };

    const permisosMatrix: Record<string, Record<string, boolean>> = {};
    const permisosTecnicos: Array<{ id: string; accion: string; asignado: boolean }> = [];
    
    (permisosData || []).forEach(permiso => {
      // Normalizar módulo para evitar errores por espacios, acentos o mayúsculas
      const moduloNormalizado = normalizarModulo(permiso.modulo);
      
      // Incluir en Funciones Técnicas: todos los permisos del módulo "tecnico" (normalizado)
      if (moduloNormalizado === 'tecnico') {
        permisosTecnicos.push({
          id: permiso.id,
          accion: permiso.accion,
          asignado: permisoIds.includes(permiso.id),
        });
      } else {
        // Usar módulo normalizado como clave
        if (!permisosMatrix[moduloNormalizado]) {
          permisosMatrix[moduloNormalizado] = {};
        }
        permisosMatrix[moduloNormalizado][permiso.accion] = permisoIds.includes(permiso.id);
      }
    });

    console.log("✅ Rol actualizado correctamente");

    return NextResponse.json({ 
      role: {
        id: roleData.id,
        nombre: roleData.nombre,
        descripcion: roleData.descripcion,
        permisos: permisosMatrix,
        permisosTecnicos: permisosTecnicos,
      }
    });
  } catch (error) {
    console.error("Error al actualizar rol:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// DELETE - Eliminar rol
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requirePermiso("ajustes", "admin");
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "ID del rol es obligatorio" }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error al eliminar rol de Supabase:", error);
      return NextResponse.json({ error: "Error al eliminar rol" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar rol:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}