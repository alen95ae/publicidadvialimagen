import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { createHash, randomBytes } from "crypto";
import { getBaseUrl } from "@/lib/url";
import {
  getAllInvitaciones,
  findInvitacionPendienteByEmail,
  createInvitacion,
  updateInvitacion
} from "@/lib/supabaseInvitaciones";
import { findUserByEmailSupabase } from "@/lib/supabaseUsers";
import { getSupabaseServer } from "@/lib/supabaseServer";

// GET - Obtener invitaciones
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación y permisos de administrador
    const token = request.cookies.get("session")?.value;
    if (!token) {
      return NextResponse.json({ error: "Token de sesión no encontrado" }, { status: 401 });
    }
    
    const session = await verifySession(token);
    const isDeveloper = session?.email?.toLowerCase() === "alen95ae@gmail.com";
    const isAdmin = session?.role === "admin";
    
    if (!session || (!isAdmin && !isDeveloper)) {
      return NextResponse.json({ error: "Acceso denegado. Se requiere rol de administrador" }, { status: 403 });
    }

    const statusFilter = request.nextUrl.searchParams.get("status");
    
    // Obtener invitaciones de Supabase
    const invitations = await getAllInvitaciones(statusFilter || undefined);
    
    // Obtener todos los roles para mapear IDs a nombres (igual que en usuarios)
    const supabase = getSupabaseServer();
    const { data: rolesData, error: rolesError } = await supabase
      .from('roles')
      .select('id, nombre');
    
    if (rolesError) {
      console.error('❌ Error obteniendo roles:', rolesError);
      return NextResponse.json({ error: "Error al obtener roles" }, { status: 500 });
    }
    
    if (!rolesData || rolesData.length === 0) {
      console.error('❌ No se encontraron roles en la base de datos');
      return NextResponse.json({ error: "No se encontraron roles" }, { status: 500 });
    }
    
    // Crear un mapa de roles por ID (igual que en usuarios)
    const rolesMap = new Map<string, string>();
    rolesData.forEach((role: any) => {
      rolesMap.set(role.id, role.nombre);
    });
    
    // Obtener mapeo de permiso_id a rol_id por si el valor guardado es un permiso_id
    const { data: rolPermisosData, error: rolPermisosError } = await supabase
      .from('rol_permisos')
      .select('rol_id, permiso_id');
    
    if (rolPermisosError) {
      console.error('❌ Error obteniendo rol_permisos:', rolPermisosError);
      // No retornar error aquí, solo continuar sin el mapeo de permisos
    }
    
    // Crear un mapa de permiso_id -> array de rol_id
    const permisoToRolIdsMap = new Map<string, string[]>();
    if (rolPermisosData) {
      rolPermisosData.forEach((rp: any) => {
        if (!permisoToRolIdsMap.has(rp.permiso_id)) {
          permisoToRolIdsMap.set(rp.permiso_id, []);
        }
        permisoToRolIdsMap.get(rp.permiso_id)!.push(rp.rol_id);
      });
    }
    
    // Mapear al formato esperado por el frontend (igual que en usuarios)
    const invitationsFormatted = await Promise.all(invitations.map(async (inv) => {
      const rolValue = inv.rol?.trim(); // Limpiar espacios en blanco
      let rolNombre: string = "Sin rol";
      
      if (!rolValue) {
        return {
          id: inv.id,
          email: inv.email,
          rol: inv.rol,
          rolNombre: "Sin rol",
          token: inv.token,
          estado: inv.estado,
          fechaCreacion: inv.fechaCreacion,
          fechaExpiracion: inv.fechaExpiracion,
          fechaUso: inv.fechaUso || null,
          enlace: inv.enlace
        };
      }
      
      // Intentar obtener el nombre del rol
      // Primero intentar si el valor es un rol_id directo (caso más común cuando se crea desde el formulario)
      if (rolesMap.has(rolValue)) {
        rolNombre = rolesMap.get(rolValue)!;
      } else {
        // Si no se encuentra como rol_id, puede ser un permiso_id, buscar el rol que tiene ese permiso
        const rolIdsFromPermiso = permisoToRolIdsMap.get(rolValue);
        if (rolIdsFromPermiso && rolIdsFromPermiso.length > 0) {
          // Tomar el primer rol que tiene ese permiso
          const firstRolId = rolIdsFromPermiso[0];
          if (rolesMap.has(firstRolId)) {
            rolNombre = rolesMap.get(firstRolId)!;
          }
        } else {
          // Si no se encuentra en los mapas, hacer consulta directa a la BD (como en usuarios)
          try {
            const { data: roleData } = await supabase
              .from('roles')
              .select('nombre')
              .eq('id', rolValue)
              .single();
            
            if (roleData?.nombre) {
              rolNombre = roleData.nombre;
            }
          } catch (error) {
            // Si falla, intentar buscar como permiso_id y obtener el rol asociado
            const { data: permisoData } = await supabase
              .from('rol_permisos')
              .select('rol_id')
              .eq('permiso_id', rolValue)
              .limit(1)
              .single();
            
            if (permisoData?.rol_id) {
              const { data: roleDataFromPermiso } = await supabase
                .from('roles')
                .select('nombre')
                .eq('id', permisoData.rol_id)
                .single();
              
              if (roleDataFromPermiso?.nombre) {
                rolNombre = roleDataFromPermiso.nombre;
              }
            }
          }
        }
      }
      
      return {
        id: inv.id,
        email: inv.email,
        rol: inv.rol, // Mantener el ID original para compatibilidad
        rolNombre: rolNombre, // SIEMPRE devolver el nombre del rol
        token: inv.token,
        estado: inv.estado,
        fechaCreacion: inv.fechaCreacion,
        fechaExpiracion: inv.fechaExpiracion,
        fechaUso: inv.fechaUso || null,
        enlace: inv.enlace
      };
    }));

    return NextResponse.json({ invitations: invitationsFormatted });
  } catch (error) {
    console.error("Error al obtener invitaciones:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// POST - Crear nueva invitación
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación y permisos de administrador
    const token = request.cookies.get("session")?.value;
    if (!token) {
      return NextResponse.json({ error: "Token de sesión no encontrado" }, { status: 401 });
    }
    
    const session = await verifySession(token);
    const isDeveloper = session?.email?.toLowerCase() === "alen95ae@gmail.com";
    const isAdmin = session?.role === "admin";
    
    if (!session || (!isAdmin && !isDeveloper)) {
      return NextResponse.json({ error: "Acceso denegado. Se requiere rol de administrador" }, { status: 403 });
    }

    const { email, rol, horasValidez, cambioPassword } = await request.json();

    // Validaciones según el tipo de invitación
    if (cambioPassword) {
      // Para cambio de contraseña, solo necesitamos email y horasValidez
      if (!email || !horasValidez) {
        return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
      }

      // Verificar que el usuario existe
      const existingUser = await findUserByEmailSupabase(email);
      if (!existingUser) {
        return NextResponse.json({ error: "No se encontró un usuario con ese email" }, { status: 404 });
      }

      // Usar el rol_id del usuario existente (necesario para crear la invitación)
      const userRolId = existingUser.fields.RolId || existingUser.fields.Rol || "usuario";
      
      // Verificar si ya existe una invitación pendiente para este email
      const existingInvitation = await findInvitacionPendienteByEmail(email);
      
      if (existingInvitation) {
        return NextResponse.json({ error: "Ya existe una invitación pendiente para este email" }, { status: 400 });
      }

      // Generar token único para la invitación
      const invitationToken = randomBytes(32).toString('hex');
      
      // Calcular fechas
      const fechaCreacion = new Date().toISOString();
      const fechaExpiracion = new Date(Date.now() + horasValidez * 60 * 60 * 1000).toISOString();
      
      // Generar enlace para cambio de contraseña
      const baseUrl = getBaseUrl().replace(/\/$/, '');
      const enlace = `${baseUrl}/reset-password?token=${invitationToken}&email=${encodeURIComponent(email)}`;

      // Crear invitación en Supabase
      const newInvitation = await createInvitacion(
        email,
        userRolId,
        invitationToken,
        fechaCreacion,
        fechaExpiracion,
        enlace
      );

      return NextResponse.json({ 
        message: "Invitación para cambiar contraseña creada correctamente",
        invitation: {
          id: newInvitation.id,
          email: newInvitation.email,
          rol: newInvitation.rol,
          token: newInvitation.token,
          estado: newInvitation.estado,
          fechaCreacion: newInvitation.fechaCreacion,
          fechaExpiracion: newInvitation.fechaExpiracion,
          enlace: newInvitation.enlace
        }
      });
    } else {
      // Para invitación normal, necesitamos email, rol y horasValidez
    if (!email || !rol || !horasValidez) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    // Verificar si ya existe una invitación pendiente para este email
    const existingInvitation = await findInvitacionPendienteByEmail(email);
    
    if (existingInvitation) {
      return NextResponse.json({ error: "Ya existe una invitación pendiente para este email" }, { status: 400 });
    }

    // Generar token único para la invitación
    const invitationToken = randomBytes(32).toString('hex');
    
    // Calcular fechas
    const fechaCreacion = new Date().toISOString();
    const fechaExpiracion = new Date(Date.now() + horasValidez * 60 * 60 * 1000).toISOString();
    
    // Generar enlace de invitación
    // Usar la función helper que maneja correctamente localhost vs producción
    const baseUrl = getBaseUrl().replace(/\/$/, ''); // Remover barra final si existe
    const enlace = `${baseUrl}/register?token=${invitationToken}&email=${encodeURIComponent(email)}`;

    // Crear invitación en Supabase
    const newInvitation = await createInvitacion(
      email,
      rol,
      invitationToken,
      fechaCreacion,
      fechaExpiracion,
      enlace
    );

    return NextResponse.json({ 
      message: "Invitación creada correctamente",
      invitation: {
        id: newInvitation.id,
        email: newInvitation.email,
        rol: newInvitation.rol,
        token: newInvitation.token,
        estado: newInvitation.estado,
        fechaCreacion: newInvitation.fechaCreacion,
        fechaExpiracion: newInvitation.fechaExpiracion,
        enlace: newInvitation.enlace
      }
    });
    }
  } catch (error) {
    console.error("Error al crear invitación:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// PUT - Actualizar invitación (revocar)
export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticación y permisos de administrador
    const token = request.cookies.get("session")?.value;
    if (!token) {
      return NextResponse.json({ error: "Token de sesión no encontrado" }, { status: 401 });
    }
    
    const session = await verifySession(token);
    const isDeveloper = session?.email?.toLowerCase() === "alen95ae@gmail.com";
    const isAdmin = session?.role === "admin";
    
    if (!session || (!isAdmin && !isDeveloper)) {
      return NextResponse.json({ error: "Acceso denegado. Se requiere rol de administrador" }, { status: 403 });
    }

    const { id, estado } = await request.json();

    const updateData: any = { estado };
    if (estado === "usado") {
      updateData.fecha_uso = new Date().toISOString();
    }

    await updateInvitacion(id, updateData);

    return NextResponse.json({ message: "Invitación actualizada correctamente" });
  } catch (error) {
    console.error("Error al actualizar invitación:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// DELETE - Eliminar invitación
export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticación y permisos de administrador
    const token = request.cookies.get("session")?.value;
    if (!token) {
      return NextResponse.json({ error: "Token de sesión no encontrado" }, { status: 401 });
    }
    
    const session = await verifySession(token);
    const isDeveloper = session?.email?.toLowerCase() === "alen95ae@gmail.com";
    const isAdmin = session?.role === "admin";
    
    if (!session || (!isAdmin && !isDeveloper)) {
      return NextResponse.json({ error: "Acceso denegado. Se requiere rol de administrador" }, { status: 403 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "ID de invitación requerido" }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const { error } = await supabase
      .from('invitaciones')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error al eliminar invitación:", error);
      return NextResponse.json({ error: "Error al eliminar invitación" }, { status: 500 });
    }

    return NextResponse.json({ message: "Invitación eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar invitación:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}