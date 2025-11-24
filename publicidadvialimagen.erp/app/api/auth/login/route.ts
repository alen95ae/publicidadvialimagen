import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findUserByEmail, signSession, updateUserLastAccess } from "@/lib/auth";
import { createAuthCookie } from "@/lib/auth/cookies";
import { getSupabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const { email, password, rememberMe } = await req.json();
    console.log('🔐 [Login ERP] Intento de login para:', email, "rememberMe:", rememberMe);
    
    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña son obligatorios" }, { status: 400 });
    }

    const user = await findUserByEmail(email);
    console.log('👤 [Login ERP] Usuario encontrado:', user ? 'Sí' : 'No');
    console.log('🔑 [Login ERP] Tiene password hash:', user?.fields?.PasswordHash ? 'Sí' : 'No');
    console.log('📋 [Login ERP] Campos del usuario:', user?.fields ? Object.keys(user.fields) : 'N/A');
    
    if (!user?.fields?.PasswordHash) {
      console.log('❌ [Login ERP] Credenciales inválidas: usuario no encontrado o sin password');
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.fields.PasswordHash);
    console.log('🔐 [Login ERP] Comparación de contraseña:', ok ? 'Correcta' : 'Incorrecta');
    if (!ok) {
      console.log('❌ [Login ERP] Credenciales inválidas: contraseña incorrecta');
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    // Actualizar último acceso en Supabase
    try {
      await updateUserLastAccess(user.id);
    } catch (error) {
      console.error("Error updating last access:", error);
      // No fallar el login si falla la actualización del último acceso
    }

    // Obtener el nombre del rol desde la tabla roles usando rol_id
    let roleName = user.fields.Rol || "invitado";
    if (user.fields.RolId) {
      try {
        const supabase = getSupabaseServer();
        const { data: roleData } = await supabase
          .from('roles')
          .select('nombre')
          .eq('id', user.fields.RolId)
          .single();
        
        if (roleData?.nombre) {
          roleName = roleData.nombre;
        }
      } catch (error) {
        console.error("Error obteniendo nombre del rol:", error);
        // Usar el rol por defecto si falla
      }
    }

    // El desarrollador siempre tiene acceso de admin
    const isDeveloper = user.fields.Email?.toLowerCase() === "alen95ae@gmail.com";
    if (isDeveloper) {
      roleName = "admin";
    }

    const token = await signSession({ id: user.id, email: user.fields.Email, role: roleName, name: user.fields.Nombre });
    
    const role = roleName;
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
