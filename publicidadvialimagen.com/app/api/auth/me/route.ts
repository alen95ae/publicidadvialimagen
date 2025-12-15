export const runtime = 'nodejs'
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";

export async function GET() {
  try {
    const token = cookies().get("session")?.value;
    if (!token) return NextResponse.json({ user: null });
    const payload = verifySession(token);
    return NextResponse.json({ user: { id: payload.sub, email: payload.email, role: payload.role, name: payload.name } });
  } catch {
    return NextResponse.json({ user: null });
  }
}
