import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findUserByEmail, signSession } from "@/lib/auth";
import { createAuthCookie } from "@/lib/auth/cookies";
import { airtableUpdate } from "@/lib/airtable-rest";

const USERS_TABLE = process.env.AIRTABLE_TABLE_USERS || "Users";

export async function POST(req: Request) {
  try {
    const { email, password, rememberMe } = await req.json();
    console.log("Login attempt for email:", email, "rememberMe:", rememberMe);
    
    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña son obligatorios" }, { status: 400 });
    }

    const user = await findUserByEmail(email);
    console.log("User found:", user ? "Yes" : "No");
    console.log("User has password hash:", user?.fields?.PasswordHash ? "Yes" : "No");
    
    if (!user?.fields?.PasswordHash) {
      console.log("No user or password hash found");
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.fields.PasswordHash);
    console.log("Password comparison result:", ok);
    if (!ok) return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });

    // Actualizar último acceso
    try {
      await airtableUpdate(USERS_TABLE, user.id, {
        UltimoAcceso: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error updating last access:", error);
      // No fallar el login si falla la actualización del último acceso
    }

    const token = await signSession({ id: user.id, email: user.fields.Email, role: user.fields.Rol, name: user.fields.Nombre });
    
    const role = user.fields.Rol || "invitado";
    const redirect = (role === "usuario" || role === "admin") ? "/panel" : "/panel";

    // Duración de la cookie basada en "mantener sesión iniciada"
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30 días si rememberMe, 1 día si no
    const cookie = createAuthCookie("session", token, maxAge);
    
    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.fields.Email, name: user.fields.Nombre, role: role },
      redirect
    });
    
    response.headers.append('Set-Cookie', cookie);
    return response;
  } catch (e: any) {
    console.error("login error:", e);
    return NextResponse.json({ error: "Error en login" }, { status: 500 });
  }
}
