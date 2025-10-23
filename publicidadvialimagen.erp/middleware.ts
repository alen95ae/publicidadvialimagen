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
  "/panel/empleados",
  "/panel/diseno",
  "/panel/sitio",
  "/panel/ajustes",
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

  // Proteger la página de registro - solo accesible con token válido
  if (pathname === "/register") {
    const token = req.nextUrl.searchParams.get("token");
    const email = req.nextUrl.searchParams.get("email");
    
    if (!token || !email) {
      console.log("🔒 Register access denied - no token or email");
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.search = "";
      return NextResponse.redirect(loginUrl);
    }
    
    // Permitir acceso - la validación se hará en el componente
    console.log("✅ Register access allowed with token");
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
      
      // Verificar que el token no haya expirado
      if (payload.exp && payload.exp < Date.now() / 1000) {
        console.log("🔒 Token expired, redirecting to login");
        const loginUrl = req.nextUrl.clone();
        loginUrl.pathname = "/login";
        loginUrl.search = "";
        return NextResponse.redirect(loginUrl);
      }
      
      // 🔒 Verificación especial para módulo de ajustes - solo administradores
      if (pathname.startsWith("/panel/ajustes") || pathname.startsWith("/api/ajustes")) {
        if (payload.role !== "admin") {
          console.log("🔒 Access denied to ajustes - user role:", payload.role);
          console.log("🔒 Available roles for ajustes: admin");
          console.log("🔒 Current user role:", payload.role);
          
          // Si está intentando acceder a la página principal de ajustes, redirigir a access-denied
          if (pathname === "/panel/ajustes") {
            const deniedUrl = req.nextUrl.clone();
            deniedUrl.pathname = "/panel/ajustes/access-denied";
            deniedUrl.search = "";
            return NextResponse.redirect(deniedUrl);
          }
          
          // Para APIs, devolver error 403
          return NextResponse.json({ error: "Acceso denegado. Se requiere rol de administrador" }, { status: 403 });
        }
        console.log("✅ Admin access granted to ajustes for user:", payload.email);
      }
      
      console.log("✅ Token valid for user:", payload.email);
    } catch (error: any) {
      console.log("🔒 Token verification failed:", error.message);
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
  matcher: ["/panel/:path*", "/api/erp/:path*", "/register", "/api/ajustes/:path*"],
};