import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { airtableList, airtableCreate, airtableUpdate, airtableDelete } from "@/lib/airtable-rest";

const USERS_TABLE = process.env.AIRTABLE_TABLE_USERS || "Users";

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

    // Solo cargar usuarios con rol admin o usuario (no invitados)
    let filterFormula = `OR({Rol} = "admin", {Rol} = "usuario")`;
    const filters = [filterFormula];

    if (search) {
      filters.push(`OR(FIND("${search}", {Nombre}), FIND("${search}", {Email}))`);
    }
    if (role) {
      filters.push(`{Rol} = "${role}"`);
    }
    if (puesto) {
      filters.push(`{Puesto} = "${puesto}"`);
    }

    if (filters.length > 1) {
      filterFormula = `AND(${filters.join(", ")})`;
    }

    const params: Record<string, string> = {
      pageSize: pageSize.toString(),
    };

    if (filterFormula) {
      params.filterByFormula = filterFormula;
    }

    if (page > 1) {
      // Para paginación, necesitaríamos implementar offset
      // Por ahora devolvemos todos los registros
    }

    const data = await airtableList(USERS_TABLE, params);
    
    const users = data.records.map((record: any) => ({
      id: record.id,
      nombre: record.fields.Nombre || "",
      email: record.fields.Email || "",
      rol: record.fields.Rol || "usuario",
      puesto: record.fields.Puesto || "",
      fechaCreacion: record.fields.FechaCreacion || record.createdTime,
      ultimoAcceso: record.fields.UltimoAcceso || null,
    }));

    return NextResponse.json({
      users,
      total: data.records.length,
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
    const { nombre, email, rol, activo = true } = body;

    if (!nombre || !email || !rol) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    // Verificar si el email ya existe
    const existingUser = await airtableList(USERS_TABLE, {
      filterByFormula: `{Email} = "${email}"`,
      maxRecords: "1",
    });

    if (existingUser.records.length > 0) {
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 400 });
    }

    const userData = {
      Nombre: nombre,
      Email: email,
      Rol: rol,
      Activo: activo,
      FechaCreacion: new Date().toISOString(),
    };

    const result = await airtableCreate(USERS_TABLE, [{ fields: userData }]);
    const newUser = result.records[0];

    return NextResponse.json({
      id: newUser.id,
      nombre: newUser.fields.Nombre,
      email: newUser.fields.Email,
      rol: newUser.fields.Rol,
      activo: newUser.fields.Activo,
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
    const { id, nombre, email, rol, activo, puesto } = body;

    if (!id) {
      return NextResponse.json({ error: "ID de usuario requerido" }, { status: 400 });
    }

    const updateData: Record<string, any> = {};
    if (nombre !== undefined) updateData.Nombre = nombre;
    if (email !== undefined) updateData.Email = email;
    if (rol !== undefined) updateData.Rol = rol;
    if (activo !== undefined) updateData.Activo = activo;
    if (puesto !== undefined) updateData.Puesto = puesto;

    await airtableUpdate(USERS_TABLE, id, updateData);

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

    await airtableDelete(USERS_TABLE, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Error al eliminar usuario" }, { status: 500 });
  }
}
