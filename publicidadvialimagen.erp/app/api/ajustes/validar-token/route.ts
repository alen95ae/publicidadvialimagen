import { NextRequest, NextResponse } from "next/server";
import { verify } from "@/lib/auth/jwt";
import {
  findInvitacionByToken,
  marcarInvitacionComoExpirada,
  marcarInvitacionComoUsada
} from "@/lib/supabaseInvitaciones";

// GET /api/ajustes/validar-token - Validar token de invitación
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 400 });
    }

    // Verificar el JWT
    let payload;
    try {
      payload = await verify(token);
    } catch (error) {
      return NextResponse.json({ error: "Token inválido o expirado" }, { status: 400 });
    }

    // Verificar que el token no haya expirado
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return NextResponse.json({ error: "Token expirado" }, { status: 400 });
    }

    // Buscar la invitación en Supabase
    const invitation = await findInvitacionByToken(token);

    if (!invitation) {
      return NextResponse.json({ error: "Invitación no encontrada" }, { status: 404 });
    }

    if (invitation.estado === "usado") {
      return NextResponse.json({ error: "Esta invitación ya ha sido utilizada" }, { status: 400 });
    }

    if (invitation.estado === "expirado") {
      return NextResponse.json({ error: "Esta invitación ha expirado" }, { status: 400 });
    }

    // Verificar fecha de expiración
    const fechaExpiracion = new Date(invitation.fechaExpiracion);
    if (fechaExpiracion < new Date()) {
      // Marcar como expirado
      await marcarInvitacionComoExpirada(invitation.id);
      return NextResponse.json({ error: "Esta invitación ha expirado" }, { status: 400 });
    }

    return NextResponse.json({
      valido: true,
      email: invitation.email,
      rol: invitation.rol,
      fechaExpiracion: invitation.fechaExpiracion,
    });
  } catch (error) {
    console.error("Error validating token:", error);
    return NextResponse.json({ error: "Error al validar token" }, { status: 500 });
  }
}

// POST /api/ajustes/validar-token - Usar token (marcar como usado)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 400 });
    }

    // Buscar la invitación en Supabase
    const invitation = await findInvitacionByToken(token);

    if (!invitation) {
      return NextResponse.json({ error: "Invitación no encontrada" }, { status: 404 });
    }

    // Marcar como usado
    await marcarInvitacionComoUsada(invitation.id);

    return NextResponse.json({
      success: true,
      email: invitation.email,
      rol: invitation.rol,
    });
  } catch (error) {
    console.error("Error using token:", error);
    return NextResponse.json({ error: "Error al usar token" }, { status: 500 });
  }
}
