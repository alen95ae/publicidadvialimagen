import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { airtableList, airtableCreate } from "./airtable-rest";
import { sign, verify } from "./auth/jwt";
import { createAuthCookie, clearAuthCookie } from "./auth/cookies";

const USERS = process.env.AIRTABLE_TABLE_USERS || "Users";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "7d";

export type UserRecord = {
  id: string;
  fields: {
    Email: string;
    PasswordHash?: string;
    Name?: string;
    Role?: string; // "admin" | "user"
  };
};

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const lower = email.trim().toLowerCase().replace(/'/g, "\\'");
  const data = await airtableList(USERS, {
    filterByFormula: `LOWER({Email})='${lower}'`,
    maxRecords: "1",
    pageSize: "1",
  });
  const rec = data?.records?.[0];
  return rec ? { id: rec.id, fields: rec.fields } : null;
}

export async function createUser(email: string, password: string, name?: string) {
  const hash = await bcrypt.hash(password, 10);
  const payload = {
    Email: email.trim(),
    PasswordHash: hash,
    Nombre: name || "",
    Rol: "usuario",
    Activo: true,
  };
  const res = await airtableCreate(USERS, [{ fields: payload }]);
  const rec = res?.records?.[0];
  return { id: rec.id, fields: rec.fields };
}

export async function signSession(user: { id: string; email: string; role?: string; name?: string }) {
  return await sign({
    sub: user.id,
    email: user.email,
    role: user.role || "invitado",
    name: user.name || ""
  }, JWT_EXPIRES);
}

export async function verifySession(token: string) {
  return await verify<{ sub: string; email: string; role?: string; name?: string; iat: number; exp: number }>(token);
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  console.log("Setting session cookie with token:", token.substring(0, 20) + "...");
  
  const maxAge = 7 * 24 * 60 * 60; // 7 días
  const cookie = createAuthCookie("session", token, maxAge);
  
  // Parse the cookie string and set it
  const [nameValue, ...options] = cookie.split(';');
  const [name, value] = nameValue.split('=');
  
  cookieStore.set(name.trim(), value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
  console.log("Session cookie set successfully");
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set("session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
