import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { getAllUsersSupabase, createUserSupabase, updateUserSupabase, getUserByIdSupabase, findUserByEmailSupabase } from "@/lib/supabaseUsers";
import { getSupabaseServer } from "@/lib/supabaseServer";
import bcrypt from "bcryptjs";

const supabase = getSupabaseServer();

// Middleware para verificar que el usuario es administrador
async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get("session")?.value;
  if (!token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const payload = await verifySession(token);
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Acceso denegado. Se requiere rol de administrador" }, { status: 403 });
    }
    return payload;
  } catch (error) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }
}

// GET /api/ajustes/usuarios - Listar usuarios
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "50");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";
    const puesto = searchParams.get("puesto") || "";

    // Obtener todos los usuarios desde Supabase
    let query = supabase
      .from('usuarios')
      .select('*')
      .in('rol', ['admin', 'usuario']); // Solo admin y usuario, no invitados

    // Aplicar filtros
    if (search) {
      query = query.or(`nombre.ilike.%${search}%,email.ilike.%${search}%`);
    }
    if (role) {
      query = query.eq('rol', role);
    }
    if (status === 'activo') {
      query = query.eq('activo', true);
    } else if (status === 'inactivo') {
      query = query.eq('activo', false);
    }
    if (puesto) {
      query = query.eq('puesto', puesto);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching users from Supabase:", error);
      return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 });
    }

    // Aplicar paginación manualmente
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedUsers = data?.slice(start, end) || [];
    
    const users = paginatedUsers.map((record: any) => ({
      id: record.id,
      nombre: record.nombre || "",
      email: record.email || "",
      rol: record.rol || "usuario",
      puesto: record.puesto || "",
      fechaCreacion: record.fecha_creacion || record.created_at,
      ultimoAcceso: record.ultimo_acceso || null,
      activo: record.activo ?? true,
    }));

    return NextResponse.json({
      users,
      total: data?.length || 0,
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
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { nombre, email, rol, activo = true, password } = body;

    if (!nombre || !email || !rol) {
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

    const usuario = await createUserSupabase(email, passwordHash, nombre, rol);
    
    // Si se especifica activo=false, actualizar
    if (activo === false) {
      await updateUserSupabase(usuario.id, { activo: false });
    }

    return NextResponse.json({
      id: usuario.id,
      nombre: usuario.fields.Nombre,
      email: usuario.fields.Email,
      rol: usuario.fields.Rol,
      activo: usuario.fields.Activo,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Error al crear usuario" }, { status: 500 });
  }
}

// PUT /api/ajustes/usuarios - Actualizar usuario
export async function PUT(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { id, nombre, email, rol, activo, puesto, password } = body;

    if (!id) {
      return NextResponse.json({ error: "ID de usuario requerido" }, { status: 400 });
    }

    const updateData: {
      nombre?: string;
      email?: string;
      rol?: string;
      activo?: boolean;
      puesto?: string;
      password_hash?: string;
    } = {};

    if (nombre !== undefined) updateData.nombre = nombre;
    if (email !== undefined) updateData.email = email;
    if (rol !== undefined) updateData.rol = rol;
    if (activo !== undefined) updateData.activo = activo;
    if (puesto !== undefined) updateData.puesto = puesto;
    if (password) {
      updateData.password_hash = await bcrypt.hash(password, 10);
    }

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
  const authResult = await requireAdmin(request);
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






