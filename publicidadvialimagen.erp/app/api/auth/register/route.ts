import { NextResponse } from "next/server";
import { createUser, createUserWithRole, findUserByEmail, signSession, setSessionCookie } from "@/lib/auth";
import { verify } from "@/lib/auth/jwt";
import { getBaseUrl } from "@/lib/url";

function nowISO() { return new Date().toISOString(); }

export async function POST(req: Request) {
  try {
    const { email, password, nombre, token } = await req.json();
    if (!email || !password || !nombre) {
      return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 });
    }

    // Verificar que hay un token de invitación
    if (!token) {
      return NextResponse.json({ error: "Se requiere un token de invitación válido" }, { status: 400 });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 });
    }

    // Verificar la invitación usando getBaseUrl() para manejar correctamente el entorno
    const baseUrl = getBaseUrl().replace(/\/$/, ''); // Remover barra final si existe
    const invitationResponse = await fetch(`${baseUrl}/api/ajustes/verify-invitation?token=${token}&email=${email}`);
    const invitationData = await invitationResponse.json();

    if (!invitationResponse.ok || !invitationData.valid) {
      return NextResponse.json({ error: invitationData.error || "Invitación no válida" }, { status: 400 });
    }

    const assignedRole = invitationData.invitation.rol || "usuario";

    // Crear usuario con el rol asignado desde la invitación
    const user = await createUserWithRole(email, password, nombre, assignedRole);
    console.log("User created:", user);

    // Marcar la invitación como usada
    await fetch(`${baseUrl}/api/ajustes/verify-invitation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, email }),
    });

    const sessionToken = await signSession({ 
      id: user.id, 
      email: user.fields.Email, 
      role: assignedRole, 
      name: user.fields.Nombre 
    });
    await setSessionCookie(sessionToken);

    // Redirección por rol
    const redirect = "/panel";

    return NextResponse.json({ 
      success: true, 
      user: { 
        id: user.id, 
        email: user.fields.Email, 
        name: user.fields.Nombre, 
        role: assignedRole 
      }, 
      redirect 
    });
  } catch (e: any) {
    console.error("register error:", e);
    return NextResponse.json({ error: "Error en registro" }, { status: 500 });
  }
}