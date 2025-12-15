export const runtime = 'nodejs'

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findUserByEmail, signSession, setSessionCookie, updateUserLastAccess } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    console.log('🔐 [Login] Intento de login para:', email);
    
    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña son obligatorios" }, { status: 400 });
    }

    const user = await findUserByEmail(email);
    console.log('👤 [Login] Usuario encontrado:', user ? 'Sí' : 'No');
    console.log('🔑 [Login] Tiene password hash:', user?.fields?.PasswordHash ? 'Sí' : 'No');
    
    if (!user?.fields?.PasswordHash) {
      console.log('❌ [Login] Credenciales inválidas: usuario no encontrado o sin password');
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.fields.PasswordHash);
    console.log('🔐 [Login] Comparación de contraseña:', ok ? 'Correcta' : 'Incorrecta');
    if (!ok) {
      console.log('❌ [Login] Credenciales inválidas: contraseña incorrecta');
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    // Actualizar último acceso en Supabase
    try {
      await updateUserLastAccess(user.id);
    } catch (error) {
      console.error("Error updating last access:", error);
      // No fallar el login si falla la actualización del último acceso
    }

    const token = signSession({ id: user.id, email: user.fields.Email, role: user.fields.Rol, name: user.fields.Nombre });
    await setSessionCookie(token);

    const role = user.fields.Rol || "invitado";
    const redirect = (role === "usuario" || role === "admin") ? "/erp" : "/";

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.fields.Email, name: user.fields.Nombre, role: role },
      redirect
    });
  } catch (e: any) {
    console.error("login error:", e);
    return NextResponse.json({ error: "Error en login" }, { status: 500 });
  }
}
