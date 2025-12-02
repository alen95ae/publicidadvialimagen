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
  const hostname = req.nextUrl.hostname;

  // PERMITIR DEPLOY PREVIEWS Y LOCALHOST
  if (
    hostname.endsWith(".vercel.app") ||
    hostname === "localhost"
  ) {
    return NextResponse.next();
  }

  // Redirecciones antiguas
  if (pathname.startsWith("/product-page/")) {
    const slug = pathname.replace("/product-page/", "");
    const url = new URL(
      slug
        ? `/vallas-publicitarias/${slug}`
        : "/vallas-publicitarias",
      req.url
    );
    return NextResponse.redirect(url, { status: 301 });
  }

  if (pathname.startsWith("/products/")) {
    const slug = pathname.replace("/products/", "");
    const url = new URL(
      slug
        ? `/vallas-publicitarias/${slug}`
        : "/vallas-publicitarias",
      req.url
    );
    return NextResponse.redirect(url, { status: 301 });
  }

  if (pathname.startsWith("/vallas/")) {
    const slug = pathname.replace("/vallas/", "");
    const url = new URL(
      slug
        ? `/vallas-publicitarias/${slug}`
        : "/vallas-publicitarias",
      req.url
    );
    return NextResponse.redirect(url, { status: 301 });
  }

  // Rutas protegidas
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
    "/vallas/:path*",
  ],
};
