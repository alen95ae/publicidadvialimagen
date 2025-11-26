import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { 
  findUserByEmailSupabase, 
  createUserSupabase,
  updateLastAccessSupabase,
  type Usuario 
} from "./supabaseUsers";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES = process.env.JWT_EXPIRES || "7d";

export type UserRecord = {
  id: string;
  fields: {
    Email: string;
    PasswordHash?: string;
    Nombre?: string;
    Rol?: string;
    Activo?: boolean;
    UltimoAcceso?: string;
  };
};

// Convertir Usuario (Supabase) a UserRecord (compatible con código existente)
function usuarioToUserRecord(usuario: Usuario): UserRecord {
  return {
    id: usuario.id,
    fields: {
      Email: usuario.fields.Email,
      PasswordHash: usuario.fields.PasswordHash,
      Nombre: usuario.fields.Nombre,
      Rol: usuario.fields.Rol,
      Activo: usuario.fields.Activo,
      UltimoAcceso: usuario.fields.UltimoAcceso,
    }
  };
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  try {
    console.log('🔍 [Auth] Buscando usuario con email:', email);
    
    // Primero intentar en Supabase
    const usuario = await findUserByEmailSupabase(email);
    if (usuario) {
      console.log('✅ [Auth] Usuario encontrado en Supabase:', usuario.id, usuario.fields.Email);
      return usuarioToUserRecord(usuario);
    }
    
    console.log('❌ [Auth] Usuario no encontrado en Supabase');
    return null;
  } catch (error) {
    console.error("❌ [Auth] Error finding user by email:", error);
    return null;
  }
}

export async function createUser(email: string, password: string, name?: string) {
  const hash = await bcrypt.hash(password, 10);
  const usuario = await createUserSupabase(email, hash, name, "invitado");
  return usuarioToUserRecord(usuario);
}

export async function updateUserLastAccess(userId: string) {
  await updateLastAccessSupabase(userId);
}

export function signSession(user: { id: string; email: string; role?: string; name?: string }) {
  const token = jwt.sign(
    { sub: user.id, email: user.email, role: user.role || "invitado", name: user.name || "" },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
  return token;
}

export function verifySession(token: string) {
  return jwt.verify(token, JWT_SECRET) as { sub: string; email: string; role?: string; name?: string; iat: number; exp: number };
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // 7 días
    maxAge: 7 * 24 * 60 * 60,
  });
}

export function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.set("session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
