import { NextResponse } from "next/server";

export async function GET(req: Request) {
  // @ts-ignore
  const cookies = (req as any).cookies || undefined; // no siempre accesible
  // En App Router, usamos headers:
  const headers = new Headers(req.headers);
  const cookieHeader = headers.get("cookie") || "";

  const hasToken = /(?:^|;\s*)session=/.test(cookieHeader);

  return NextResponse.json({
    hasTokenSeenByServer: hasToken,
    cookieHeaderLength: cookieHeader.length,
    nodeEnv: process.env.NODE_ENV,
    cookieDomainEnv: process.env.COOKIE_DOMAIN || null,
    siteUrlEnv: process.env.PUBLIC_SITE_URL || null,
  });
}
