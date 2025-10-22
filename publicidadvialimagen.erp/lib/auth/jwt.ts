import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export function sign(payload: object, expiresIn: string | number) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET);
}

export async function verify<T = any>(token: string): Promise<T | null> {
  try { 
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as T; 
  } catch { 
    return null; 
  }
}
