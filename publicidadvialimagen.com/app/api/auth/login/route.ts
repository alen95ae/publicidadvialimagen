export const runtime = 'nodejs'

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findUserByEmail, signSession, setSessionCookie, updateUserLastAccess } from "@/lib/auth";
import { loginSchema, sanitizeEmailForLog } from "@/lib/validation-schemas";
import { checkLoginRateLimit } from "@/lib/login-rate-limiter";

export async function POST(req: Request) {
  const requestId = crypto.randomUUID().substring(0, 8);
  
  try {
    // 1. Rate limiting específico para login (ANTES de validar credenciales)
    // Protege contra fuerza bruta: 5 intentos por IP cada 15 minutos
    const rateLimitResult = await checkLoginRateLimit(req);
    
    if (!rateLimitResult.allowed) {
      console.warn(`[${requestId}] Login bloqueado por rate limit`);
      return NextResponse.json(
        { 
          error: "Too many login attempts. Try again later.",
          retryAfter: rateLimitResult.retryAfter
        },
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter.toString(),
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetAt.toString(),
          }
        }
      );
    }

    const body = await req.json();
    
    // 2. Validación robusta con Zod
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      console.warn(`[${requestId}] Login - Validación fallida`);
      return NextResponse.json(
        { 
          error: validationResult.error.errors[0]?.message || "Datos inválidos",
          details: validationResult.error.errors.map(e => e.message)
        },
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;
    const sanitizedEmail = sanitizeEmailForLog(email);
    console.log(`[${requestId}] Login intento: ${sanitizedEmail} (intentos restantes: ${rateLimitResult.remaining})`);

    // 3. Validar credenciales
    const user = await findUserByEmail(email);
    
    if (!user?.fields?.PasswordHash) {
      // Siempre ejecutar bcrypt.compare para mitigar timing attack
      await bcrypt.compare(password, '$2a$10$dummyhashfordummycomparison');
      // El rate limit ya se incrementó antes, así que este intento fallido ya cuenta
      console.warn(`[${requestId}] Login fallido: credenciales inválidas`);
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.fields.PasswordHash);
    if (!ok) {
      // El rate limit ya se incrementó antes, así que este intento fallido ya cuenta
      console.warn(`[${requestId}] Login fallido: contraseña incorrecta`);
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    // 4. Login exitoso - NO resetear el contador (solo expira con TTL)
    // Esto permite que si alguien hace login exitoso, los intentos fallidos previos
    // sigan contando hacia el límite (protección adicional)

    // Actualizar último acceso en Supabase
    try {
      await updateUserLastAccess(user.id);
    } catch (error) {
      console.warn(`[${requestId}] Error actualizando último acceso (no crítico)`);
      // No fallar el login si falla la actualización del último acceso
    }

    const token = signSession({ id: user.id, email: user.fields.Email, role: user.fields.Rol, name: user.fields.Nombre });
    await setSessionCookie(token);

    const role = user.fields.Rol || "invitado";
    const redirect = (role === "usuario" || role === "admin") ? "/erp" : "/";

    console.log(`[${requestId}] Login exitoso: usuario ${user.id}, rol: ${role}`);
    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.fields.Email, name: user.fields.Nombre, role: role },
      redirect
    });
  } catch (e: any) {
    console.error(`[${requestId}] Error en login:`, e?.message || 'unknown');
    return NextResponse.json({ error: "Error en login" }, { status: 500 });
  }
}
