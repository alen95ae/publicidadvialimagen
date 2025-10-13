import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

const protectedRoutes = [
  { path: "/panel", roles: ["usuario", "admin", "invitado"] },
  { path: "/erp", roles: ["usuario", "admin"] },
  { path: "/dashboard", roles: ["admin"] },
  { path: "/admin", roles: ["admin"] },
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const match = protectedRoutes.find((r) => pathname.startsWith(r.path));
  if (!match) return NextResponse.next();

  const token = req.cookies.get("session")?.value;
  console.log("Middleware - Path:", pathname);
  console.log("Middleware - Token exists:", !!token);
  console.log("Middleware - Token value:", token ? "present" : "missing");
  
  if (!token) {
    console.log("Middleware - No token, redirecting to login");
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = payload.role as string || "invitado";
    console.log("Middleware - Token verified, role:", role);
    console.log("Middleware - Required roles:", match.roles);
    console.log("Middleware - Role allowed:", match.roles.includes(role));
    
    if (!match.roles.includes(role)) {
      console.log("Middleware - Role not allowed, redirecting to home");
      const url = new URL("/", req.url);
      return NextResponse.redirect(url);
    }
    console.log("Middleware - Access granted");
    return NextResponse.next();
  } catch (error) {
    console.log("Middleware - Token verification failed:", error);
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ["/panel/:path*", "/erp/:path*", "/dashboard/:path*", "/admin/:path*"],
};