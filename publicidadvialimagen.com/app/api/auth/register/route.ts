export const runtime = 'nodejs'

import { NextResponse } from "next/server";
import { createUser, findUserByEmail, signSession, setSessionCookie } from "@/lib/auth";
import { updateUserSupabase } from "@/lib/supabaseUsers";
import { registerSchema, sanitizeEmailForLog } from "@/lib/validation-schemas";

function nowISO() { return new Date().toISOString(); }

export async function POST(req: Request) {
  const requestId = crypto.randomUUID().substring(0, 8);
  
  try {
    const body = await req.json();
    
    // Validación robusta con Zod
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      console.warn(`[${requestId}] Register - Validación fallida`);
      return NextResponse.json(
        { 
          error: validationResult.error.errors[0]?.message || "Datos inválidos",
          details: validationResult.error.errors.map(e => e.message)
        },
        { status: 400 }
      );
    }

    const { email, password, name, inviteToken } = validationResult.data;
    const sanitizedEmail = sanitizeEmailForLog(email);
    console.log(`[${requestId}] Register intento: ${sanitizedEmail}`);

    const existing = await findUserByEmail(email);
    if (existing) {
      console.warn(`[${requestId}] Register fallido: email ya registrado`);
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

    console.log(`[${requestId}] Register exitoso: usuario ${user.id}, rol: ${assignedRole}`);
    return NextResponse.json({ success: true, user: { id: user.id, email: user.fields.Email, name: user.fields.Nombre, role: assignedRole }, redirect });
  } catch (e: any) {
    console.error(`[${requestId}] Error en registro:`, e?.message || 'unknown');
    return NextResponse.json({ error: "Error en registro" }, { status: 500 });
  }
}