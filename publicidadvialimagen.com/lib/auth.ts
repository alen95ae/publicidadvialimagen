import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { airtableList, airtableCreate } from "./airtable-rest";

const USERS = process.env.AIRTABLE_TABLE_USERS || "Users";
const JWT_SECRET = process.env.JWT_SECRET!;
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
    Rol: "invitado",
    Activo: true,
  };
  const res = await airtableCreate(USERS, [{ fields: payload }]);
  const rec = res?.records?.[0];
  return { id: rec.id, fields: rec.fields };
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
