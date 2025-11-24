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
    
    // Mapear al formato esperado por el frontend
    const invitationsFormatted = invitations.map(inv => ({
      id: inv.id,
      email: inv.email,
      rol: inv.rol,
      token: inv.token,
      estado: inv.estado,
      fechaCreacion: inv.fechaCreacion,
      fechaExpiracion: inv.fechaExpiracion,
      fechaUso: inv.fechaUso || null,
      enlace: inv.enlace
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

    const { email, rol, horasValidez } = await request.json();

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