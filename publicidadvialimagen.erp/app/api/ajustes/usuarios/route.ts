export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { getAllUsersSupabase, createUserSupabase, updateUserSupabase, getUserByIdSupabase, findUserByEmailSupabase } from "@/lib/supabaseUsers";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { requirePermiso } from "@/lib/permisos";
import bcrypt from "bcryptjs";

const supabase = getSupabaseServer();

// GET /api/ajustes/usuarios - Listar usuarios
export async function GET(request: NextRequest) {
  const authResult = await requirePermiso("ajustes", "admin");
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "50");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";

    // Obtener todos los usuarios desde Supabase
    let query = supabase
      .from('usuarios')
      .select('*');

    // Aplicar filtros
    if (search) {
      query = query.or(`nombre.ilike.%${search}%,email.ilike.%${search}%`);
    }
    if (status === 'activo') {
      query = query.eq('activo', true);
    } else if (status === 'inactivo') {
      query = query.eq('activo', false);
    }

    const { data: usersData, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching users from Supabase:", error);
      return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 });
    }

    // Obtener todos los roles para hacer el join
    const { data: rolesData } = await supabase
      .from('roles')
      .select('id, nombre, descripcion');

    // Crear un mapa de roles por ID
    const rolesMap = new Map();
    (rolesData || []).forEach((role: any) => {
      rolesMap.set(role.id, role);
    });

    // Aplicar filtro de rol si existe
    let filteredUsers = usersData || [];
    if (role) {
      // Filtrar por nombre del rol
      filteredUsers = filteredUsers.filter((user: any) => {
        if (!user.rol_id) return false;
        const userRole = rolesMap.get(user.rol_id);
        return userRole && userRole.nombre === role;
      });
    }

    // Aplicar paginación manualmente
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedUsers = filteredUsers.slice(start, end);
    
    const users = paginatedUsers.map((record: any) => {
      const roleData = record.rol_id ? rolesMap.get(record.rol_id) : null;
      return {
        id: record.id,
        nombre: record.nombre || "",
        email: record.email || "",
        rol: roleData?.nombre || "Sin rol",
        rol_id: record.rol_id || null,
        fechaCreacion: record.fecha_creacion || record.created_at,
        imagen_usuario: record.imagen_usuario || null,
        vendedor: record.vendedor ?? false,
        ultimoAcceso: record.ultimo_acceso || null,
        activo: record.activo ?? true,
      };
    });

    return NextResponse.json({
      users,
      total: filteredUsers.length,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 });
  }
}

// POST /api/ajustes/usuarios - Crear usuario
export async function POST(request: NextRequest) {
  const authResult = await requirePermiso("ajustes", "admin");
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { nombre, email, rol_id, activo = true, password } = body;

    if (!nombre || !email || !rol_id) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    // Verificar si el email ya existe
    const existingUser = await findUserByEmailSupabase(email);
    if (existingUser) {
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 400 });
    }

    // Generar password hash si se proporciona una contraseña
    let passwordHash = "";
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    } else {
      // Si no se proporciona contraseña, generar una temporal
      passwordHash = await bcrypt.hash(Math.random().toString(36).slice(-12), 10);
    }

    const usuario = await createUserSupabase(email, passwordHash, nombre, rol_id);
    
    // Si se especifica activo=false, actualizar
    if (activo === false) {
      await updateUserSupabase(usuario.id, { activo: false });
    }

    // Obtener el nombre del rol para la respuesta
    const { data: roleData } = await supabase
      .from('roles')
      .select('nombre')
      .eq('id', rol_id)
      .single();

    return NextResponse.json({
      id: usuario.id,
      nombre: usuario.fields.Nombre,
      email: usuario.fields.Email,
      rol: roleData?.nombre || "Sin rol",
      rol_id: rol_id,
      activo: usuario.fields.Activo,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Error al crear usuario" }, { status: 500 });
  }
}

// PUT /api/ajustes/usuarios - Actualizar usuario
export async function PUT(request: NextRequest) {
  const authResult = await requirePermiso("ajustes", "admin");
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { id, nombre, email, rol_id, activo, password, imagen_usuario, vendedor } = body;

    if (!id) {
      return NextResponse.json({ error: "ID de usuario requerido" }, { status: 400 });
    }

    const updateData: {
      nombre?: string;
      email?: string;
      rol_id?: string;
      activo?: boolean;
      password_hash?: string;
      imagen_usuario?: any;
      vendedor?: boolean;
    } = {};

    if (nombre !== undefined) updateData.nombre = nombre;
    if (email !== undefined) updateData.email = email;
    if (rol_id !== undefined) updateData.rol_id = rol_id;
    if (activo !== undefined) updateData.activo = activo;
    if (password) {
      updateData.password_hash = await bcrypt.hash(password, 10);
    }
    if (imagen_usuario !== undefined) updateData.imagen_usuario = imagen_usuario;
    if (vendedor !== undefined) updateData.vendedor = vendedor;

    const updatedUser = await updateUserSupabase(id, updateData);
    if (!updatedUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Error al actualizar usuario" }, { status: 500 });
  }
}

// DELETE /api/ajustes/usuarios - Eliminar usuario
export async function DELETE(request: NextRequest) {
  const authResult = await requirePermiso("ajustes", "admin");
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID de usuario requerido" }, { status: 400 });
    }

    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting user:", error);
      return NextResponse.json({ error: "Error al eliminar usuario" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Error al eliminar usuario" }, { status: 500 });
  }
}






