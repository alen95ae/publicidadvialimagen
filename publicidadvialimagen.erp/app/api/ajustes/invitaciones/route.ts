import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { createHash, randomBytes } from "crypto";
import { airtableList, airtableCreate, airtableUpdate } from "@/lib/airtable-rest";
import { getBaseUrl } from "@/lib/url";

const INVITATIONS_TABLE = process.env.AIRTABLE_TABLE_INVITATIONS || "Invitaciones";
const INVITATIONS_TABLE_FALLBACK = "Invitations";

// GET - Obtener invitaciones
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación y permisos de administrador
    const token = request.cookies.get("session")?.value;
    if (!token) {
      return NextResponse.json({ error: "Token de sesión no encontrado" }, { status: 401 });
    }
    
    const session = await verifySession(token);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Acceso denegado. Se requiere rol de administrador" }, { status: 403 });
    }

    const statusFilter = request.nextUrl.searchParams.get("status");
    
    let filterFormula = "";
    if (statusFilter && statusFilter !== "all") {
      filterFormula = `{Estado} = "${statusFilter}"`;
    }

    const params: Record<string, string> = {
      // Airtable no acepta sort como string plano; usar vistas o traer y ordenar en app
      pageSize: "50"
    };

    if (filterFormula) {
      params.filterByFormula = filterFormula;
    }

    let data;
    try {
      data = await airtableList(INVITATIONS_TABLE, params);
    } catch (e: any) {
      // Fallback automático si la tabla en español no existe o sin permisos
      if (String(e.message || "").includes("INVALID_PERMISSIONS_OR_MODEL_NOT_FOUND")) {
        data = await airtableList(INVITATIONS_TABLE_FALLBACK, params);
      } else {
        throw e;
      }
    }
    
    const invitations = data.records.map((record: any) => ({
      id: record.id,
      email: record.fields.Email || "",
      rol: record.fields.Rol || "",
      token: record.fields.Token || "",
      estado: record.fields.Estado || "pendiente",
      fechaCreacion: record.fields.FechaCreacion || record.createdTime,
      fechaExpiracion: record.fields.FechaExpiracion || "",
      fechaUso: record.fields.FechaUso || null,
      enlace: record.fields.Enlace || ""
    }));

    return NextResponse.json({ invitations });
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
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Acceso denegado. Se requiere rol de administrador" }, { status: 403 });
    }

    const { email, rol, horasValidez } = await request.json();

    if (!email || !rol || !horasValidez) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    // Verificar si ya existe una invitación pendiente para este email
    let existingData;
    try {
      existingData = await airtableList(INVITATIONS_TABLE, {
      filterByFormula: `AND({Email} = "${email}", {Estado} = "pendiente")`,
      maxRecords: "1"
      });
    } catch (e: any) {
      if (String(e.message || "").includes("INVALID_PERMISSIONS_OR_MODEL_NOT_FOUND")) {
        existingData = await airtableList(INVITATIONS_TABLE_FALLBACK, {
          filterByFormula: `AND({Email} = "${email}", {Estado} = "pendiente")`,
          maxRecords: "1"
        });
      } else {
        throw e;
      }
    }

    if (existingData.records && existingData.records.length > 0) {
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

    const invitationData = {
      Email: email,
      Rol: rol,
      Token: invitationToken,
      Estado: "pendiente",
      FechaCreacion: new Date(fechaCreacion).toISOString().split('T')[0], // Formato YYYY-MM-DD para Airtable
      FechaExpiracion: new Date(fechaExpiracion).toISOString().split('T')[0], // Formato YYYY-MM-DD para Airtable
      Enlace: enlace
    };

    let result;
    try {
      result = await airtableCreate(INVITATIONS_TABLE, [{ fields: invitationData }]);
    } catch (e: any) {
      if (String(e.message || "").includes("INVALID_PERMISSIONS_OR_MODEL_NOT_FOUND")) {
        result = await airtableCreate(INVITATIONS_TABLE_FALLBACK, [{ fields: invitationData }]);
      } else {
        throw e;
      }
    }
    const newInvitation = result.records[0];

    return NextResponse.json({ 
      message: "Invitación creada correctamente",
      invitation: {
        id: newInvitation.id,
        email: newInvitation.fields.Email,
        rol: newInvitation.fields.Rol,
        token: newInvitation.fields.Token,
        estado: newInvitation.fields.Estado,
        fechaCreacion: newInvitation.fields.FechaCreacion,
        fechaExpiracion: newInvitation.fields.FechaExpiracion,
        enlace: newInvitation.fields.Enlace
      }
    });
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
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Acceso denegado. Se requiere rol de administrador" }, { status: 403 });
    }

    const { id, estado } = await request.json();

    const updateData: Record<string, any> = { Estado: estado };
    if (estado === "usado") {
      updateData.FechaUso = new Date().toISOString();
    }

    await airtableUpdate(INVITATIONS_TABLE, id, updateData);

    return NextResponse.json({ message: "Invitación actualizada correctamente" });
  } catch (error) {
    console.error("Error al actualizar invitación:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}