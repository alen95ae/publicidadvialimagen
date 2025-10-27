import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

const protectedRoutes = [
  { path: "/panel", roles: ["usuario", "admin"] },
  { path: "/erp", roles: ["usuario", "admin"] },
  { path: "/dashboard", roles: ["admin"] },
  { path: "/admin", roles: ["admin"] },
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Redirección 301 desde URLs antiguas /product-page/ hacia /vallas-publicitarias/
  if (pathname.startsWith("/product-page/")) {
    const slug = pathname.replace("/product-page/", "");
    // Si hay un slug específico, intentar redirigir a la página individual
    if (slug) {
      const url = new URL(`/vallas-publicitarias/${slug}`, req.url);
      return NextResponse.redirect(url, { status: 301 });
    } else {
      // Si no hay slug, redirigir a la página principal de vallas
      const url = new URL("/vallas-publicitarias", req.url);
      return NextResponse.redirect(url, { status: 301 });
    }
  }
  
  // Redirección 301 desde URLs antiguas de Wix /products/ hacia /vallas-publicitarias/
  if (pathname.startsWith("/products/")) {
    const slug = pathname.replace("/products/", "");
    if (slug) {
      const url = new URL(`/vallas-publicitarias/${slug}`, req.url);
      return NextResponse.redirect(url, { status: 301 });
    } else {
      const url = new URL("/vallas-publicitarias", req.url);
      return NextResponse.redirect(url, { status: 301 });
    }
  }
  
  // Redirección 301 desde URLs antiguas de Wix /vallas/ hacia /vallas-publicitarias/
  if (pathname.startsWith("/vallas/")) {
    const slug = pathname.replace("/vallas/", "");
    if (slug) {
      const url = new URL(`/vallas-publicitarias/${slug}`, req.url);
      return NextResponse.redirect(url, { status: 301 });
    } else {
      const url = new URL("/vallas-publicitarias", req.url);
      return NextResponse.redirect(url, { status: 301 });
    }
  }
  
  const match = protectedRoutes.find((r) => pathname.startsWith(r.path));
  if (!match) return NextResponse.next();

  const token = req.cookies.get("session")?.value;
  if (!token) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { role?: string };
    const role = payload.role || "invitado";
    if (!match.roles.includes(role)) {
      const url = new URL("/", req.url);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  } catch {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: [
    "/panel/:path*", 
    "/erp/:path*", 
    "/dashboard/:path*", 
    "/admin/:path*",
    "/product-page/:path*",
    "/products/:path*",
    "/vallas/:path*"
  ],
};