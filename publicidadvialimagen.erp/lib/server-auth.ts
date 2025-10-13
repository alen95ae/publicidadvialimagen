import { cookies } from "next/headers";
import { verifySession } from "./auth";

export function requireRole(roles: string[]) {
  const token = cookies().get("session")?.value;
  if (!token) throw new Error("UNAUTHORIZED");
  const payload = verifySession(token);
  const role = payload.role || "invitado";
  if (!roles.includes(role)) {
    const err: any = new Error("FORBIDDEN");
    err.code = "FORBIDDEN";
    throw err;
  }
  return payload; // { sub, email, role, name, ... }
}
