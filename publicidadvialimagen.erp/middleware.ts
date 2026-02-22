import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verify } from "./lib/auth/jwt";
import { getPermisos, tienePermiso } from "./lib/permisos";

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
      console.log("🕵️ [Middleware]", pathname, "→ Cookie session:", token ? "SÍ (" + token.substring(0, 20) + "...)" : "NO");

      // Si NO hay cookie, entonces sí → login
      if (!token) {
        console.log("🔒 No token found, redirecting to login");
        const loginUrl = req.nextUrl.clone();
        loginUrl.pathname = "/login";
        loginUrl.search = "";
        return NextResponse.redirect(loginUrl);
      }

      // Headers anti-cache para rutas del panel
      const response = NextResponse.next();
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');

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
      
      // 🔒 Verificación especial para módulo de ajustes - verificar permiso ver o admin en ajustes
      // NOTA: ajustes-inventario NO es parte de ajustes, es parte de inventario
      if ((pathname.startsWith("/panel/ajustes") && !pathname.startsWith("/panel/ajustes-inventario")) || pathname.startsWith("/api/ajustes")) {
        // NO hay bypass por email - todos los usuarios (incluido desarrollador) usan permisos reales
        if (payload.sub) {
          try {
            const permisos = await getPermisos(payload.sub, payload.email);
            const tieneVerAjustes = tienePermiso(permisos, "ajustes", "ver");
            const tieneAdminAjustes = tienePermiso(permisos, "ajustes", "admin");
            
            if (!tieneVerAjustes && !tieneAdminAjustes) {
              console.log("🔒 Access denied to ajustes - no ver or admin permission");
              console.log("🔒 Current user email:", payload.email);
              
              // Si está intentando acceder a la página principal de ajustes, redirigir a access-denied
              if (pathname === "/panel/ajustes" || pathname.startsWith("/panel/ajustes/")) {
                const deniedUrl = req.nextUrl.clone();
                deniedUrl.pathname = "/panel/ajustes/access-denied";
                deniedUrl.search = "";
                return NextResponse.redirect(deniedUrl);
              }
              
              // Para APIs, devolver error 403
              return NextResponse.json({ error: "Acceso denegado. Se requiere permiso de ver o administrador en ajustes" }, { status: 403 });
            }
            console.log("✅ Ver/Admin permission granted to ajustes for user:", payload.email);
          } catch (error) {
            console.error("Error checking ajustes permissions:", error);
            return NextResponse.json({ error: "Error al verificar permisos" }, { status: 500 });
          }
        }
      }
      
      console.log("✅ Token valid for user:", payload.email);
      
      // 🔒 Hay cookie: NO mandes al login por rutas inexistentes.
      // Si la ruta no es conocida, reescribimos a una página WIP
      if (!startsWithAny(pathname, KNOWN_MODULES)) {
        const wipUrl = req.nextUrl.clone();
        wipUrl.pathname = "/panel/__wip";
        wipUrl.search = "";
        const wipResponse = NextResponse.rewrite(wipUrl);
        // Headers anti-cache también para rewrite
        wipResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        wipResponse.headers.set('Pragma', 'no-cache');
        wipResponse.headers.set('Expires', '0');
        return wipResponse;
      }

      // Retornar response con headers anti-cache
      return response;
    } catch (error: any) {
      // Solo redirigir si es un error de verificación del token, no errores de red
      if (error.message && (
        error.message.includes('invalid') || 
        error.message.includes('expired') ||
        error.message.includes('malformed') ||
        error.message.includes('signature')
      )) {
        console.log("🔒 Token verification failed:", error.message);
        const loginUrl = req.nextUrl.clone();
        loginUrl.pathname = "/login";
        loginUrl.search = "";
        return NextResponse.redirect(loginUrl);
      } else {
        // Error de red o temporal - permitir continuar pero loguear
        console.warn("⚠️ Error temporal verificando token:", error.message);
        // Continuar con la request - puede ser un error temporal
        // Retornar response con headers anti-cache incluso en caso de error temporal
        return response;
      }
    }
  }

  // Headers anti-cache para rutas /api/* del ERP
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth")) {
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/panel/:path*", "/api/erp/:path*", "/register", "/api/ajustes/:path*"],
};