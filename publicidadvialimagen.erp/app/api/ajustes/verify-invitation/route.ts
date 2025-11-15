import { NextRequest, NextResponse } from "next/server";
import {
  findInvitacionByTokenAndEmail,
  marcarInvitacionComoExpirada,
  marcarInvitacionComoUsada
} from "@/lib/supabaseInvitaciones";

// GET - Verificar invitación
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");
    const email = request.nextUrl.searchParams.get("email");

    if (!token || !email) {
      return NextResponse.json({ error: "Token y email son requeridos" }, { status: 400 });
    }

    // Buscar la invitación en Supabase
    const invitation = await findInvitacionByTokenAndEmail(token, email, 'pendiente');

    if (!invitation) {
      return NextResponse.json({ error: "Invitación no encontrada o ya utilizada" }, { status: 404 });
    }

    // Verificar si la invitación ha expirado
    const now = new Date();
    const expirationDate = new Date(invitation.fechaExpiracion);
    
    if (now > expirationDate) {
      // Marcar como expirada en Supabase
      await marcarInvitacionComoExpirada(invitation.id);
      return NextResponse.json({ error: "La invitación ha expirado" }, { status: 410 });
    }

    return NextResponse.json({ 
      valid: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        rol: invitation.rol,
        fechaExpiracion: invitation.fechaExpiracion
      }
    });
  } catch (error) {
    console.error("Error al verificar invitación:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// POST - Marcar invitación como usada
export async function POST(request: NextRequest) {
  try {
    const { token, email } = await request.json();

    if (!token || !email) {
      return NextResponse.json({ error: "Token y email son requeridos" }, { status: 400 });
    }

    // Buscar la invitación en Supabase
    const invitation = await findInvitacionByTokenAndEmail(token, email, 'pendiente');

    if (!invitation) {
      return NextResponse.json({ error: "Invitación no encontrada" }, { status: 404 });
    }

    // Marcar como usada en Supabase
    await marcarInvitacionComoUsada(invitation.id);

    return NextResponse.json({ message: "Invitación marcada como usada" });
  } catch (error) {
    console.error("Error al marcar invitación como usada:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}