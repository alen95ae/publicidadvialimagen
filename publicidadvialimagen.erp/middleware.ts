import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verify } from "./lib/auth/jwt";

const PROTECTED_PREFIX = "/panel";

// 🔹 Lista blanca de módulos que sí existen hoy.
//    Añade aquí los que tienes operativos.
const KNOWN_MODULES = [
  "/panel",
  "/panel/soportes",
  "/panel/contactos",
  "/panel/mensajes",
  "/panel/inventario",
  "/panel/calendario",
  "/panel/produccion",
  "/panel/ventas",
  "/panel/contabilidad",
  "/panel/reservas",
  "/panel/clientes",
  "/panel/perfil",
  "/panel/__wip",
];

function startsWithAny(pathname: string, list: string[]) {
  return list.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rutas públicas (no forzar auth ni tocar)
  if (
    pathname === "/login" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Solo protegemos /panel/*
  if (pathname.startsWith(PROTECTED_PREFIX)) {
    const token = req.cookies.get("session")?.value;

    // Si NO hay cookie, entonces sí → login
    if (!token) {
      console.log("🔒 No token found, redirecting to login");
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.search = "";
      return NextResponse.redirect(loginUrl);
    }

    // Verificar que el token sea válido
    try {
      const payload = await verify(token);
      if (!payload) {
        console.log("🔒 Invalid token, redirecting to login");
        const loginUrl = req.nextUrl.clone();
        loginUrl.pathname = "/login";
        loginUrl.search = "";
        return NextResponse.redirect(loginUrl);
      }
    } catch (error) {
      console.log("🔒 Token verification failed:", error);
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.search = "";
      return NextResponse.redirect(loginUrl);
    }

    // 🔒 Hay cookie: NO mandes al login por rutas inexistentes.
    // Si la ruta no es conocida, reescribimos a una página WIP
    if (!startsWithAny(pathname, KNOWN_MODULES)) {
      const wipUrl = req.nextUrl.clone();
      wipUrl.pathname = "/panel/__wip";
      wipUrl.search = "";
      return NextResponse.rewrite(wipUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/panel/:path*", "/api/erp/:path*"],
};