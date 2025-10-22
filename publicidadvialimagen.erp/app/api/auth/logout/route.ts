import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth/cookies";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.headers.append('Set-Cookie', clearAuthCookie("session"));
  return response;
}

export async function GET() {
  const response = NextResponse.redirect(new URL("/login", process.env.PUBLIC_SITE_URL || "http://localhost:3000"));
  response.headers.append('Set-Cookie', clearAuthCookie("session"));
  return response;
}
