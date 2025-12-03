import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {
  findInvitacionByTokenAndEmail,
  marcarInvitacionComoUsada
} from "@/lib/supabaseInvitaciones";
import { findUserByEmailSupabase, updateUserSupabase } from "@/lib/supabaseUsers";

export async function POST(request: NextRequest) {
  try {
    const { token, email, password } = await request.json();

    if (!token || !email || !password) {
      return NextResponse.json({ error: "Token, email y contraseña son requeridos" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres" }, { status: 400 });
    }

    // Verificar la invitación
    const invitation = await findInvitacionByTokenAndEmail(token, email, 'pendiente');

    if (!invitation) {
      return NextResponse.json({ error: "Invitación no encontrada o ya utilizada" }, { status: 404 });
    }

    // Verificar si la invitación ha expirado
    const now = new Date();
    const expirationDate = new Date(invitation.fechaExpiracion);
    
    if (now > expirationDate) {
      return NextResponse.json({ error: "La invitación ha expirado" }, { status: 410 });
    }

    // Verificar que el usuario existe
    const user = await findUserByEmailSupabase(email);
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Hashear la nueva contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Actualizar la contraseña del usuario en Supabase
    const userId = user.id;
    const updateResult = await updateUserSupabase(userId, {
      password_hash: hashedPassword,
    });

    if (!updateResult) {
      return NextResponse.json({ error: "Error al actualizar la contraseña" }, { status: 500 });
    }

    // Marcar la invitación como usada
    await marcarInvitacionComoUsada(invitation.id);

    return NextResponse.json({ 
      message: "Contraseña actualizada correctamente" 
    });
  } catch (error) {
    console.error("Error al resetear contraseña:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}


