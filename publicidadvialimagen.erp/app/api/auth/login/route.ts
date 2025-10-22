import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findUserByEmail, signSession } from "@/lib/auth";
import { createAuthCookie } from "@/lib/auth/cookies";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    console.log("Login attempt for email:", email);
    
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

    const token = await signSession({ id: user.id, email: user.fields.Email, role: user.fields.Rol, name: user.fields.Nombre });
    
    const role = user.fields.Rol || "invitado";
    const redirect = (role === "usuario" || role === "admin") ? "/panel" : "/panel";

    const maxAge = 7 * 24 * 60 * 60; // 7 días
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
