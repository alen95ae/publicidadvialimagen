import { NextResponse } from "next/server";
import { createUser, findUserByEmail, signSession, setSessionCookie } from "@/lib/auth";
import { updateUserSupabase } from "@/lib/supabaseUsers";

function nowISO() { return new Date().toISOString(); }

export async function POST(req: Request) {
  try {
    const { email, password, name, inviteToken } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña son obligatorios" }, { status: 400 });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 });
    }

    let assignedRole = "invitado";

    // TODO: Verificar invitación en Supabase si se implementa
    // Por ahora, todos los usuarios se crean como "invitado"

    // Crear usuario (por defecto con rol "invitado")
    const user = await createUser(email, password, name);

    const token = signSession({ id: user.id, email: user.fields.Email, role: assignedRole, name: user.fields.Nombre });
    await setSessionCookie(token);

    // Redirección por rol
    const redirect = (assignedRole === "usuario" || assignedRole === "admin") ? "/erp" : "/";

    return NextResponse.json({ success: true, user: { id: user.id, email: user.fields.Email, name: user.fields.Nombre, role: assignedRole }, redirect });
  } catch (e: any) {
    console.error("register error:", e);
    return NextResponse.json({ error: "Error en registro" }, { status: 500 });
  }
}