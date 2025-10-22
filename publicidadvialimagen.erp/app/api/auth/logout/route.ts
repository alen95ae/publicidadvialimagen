import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth/cookies";

export async function POST() {
  console.log("LOGOUT triggered:", new Date().toISOString());
  const response = NextResponse.json({ success: true });
  response.headers.append('Set-Cookie', clearAuthCookie("session"));
  return response;
}

// ❌ NO permitir GET: evita logout por prefetch / _rsc
export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
