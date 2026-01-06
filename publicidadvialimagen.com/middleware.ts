import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { botProtectionMiddleware } from "./middleware-bot-protection";

const JWT_SECRET = process.env.JWT_SECRET!;

// ============================================================================
// CONFIGURACIÓN DE RUTAS PROTEGIDAS
// ============================================================================

const protectedRoutes = [
  { path: "/panel", roles: ["usuario", "admin"] },
  { path: "/erp", roles: ["usuario", "admin"] },
  { path: "/dashboard", roles: ["admin"] },
  { path: "/admin", roles: ["admin"] },
];

// ============================================================================
// FUNCIÓN: DETECTAR RUTAS PÚBLICAS
// ============================================================================

/**
 * Determina si una ruta es pública y no debe pasar por el middleware.
 * Estas rutas deben ser accesibles sin autenticación y sin redirecciones.
 * 
 * @param pathname - La ruta a verificar
 * @returns true si es una ruta pública, false en caso contrario
 */
function isPublicRoute(pathname: string): boolean {
  // Home y recursos estáticos esenciales
  if (
    pathname === "/" ||
    pathname === "/favicon.ico" ||
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt"
  ) {
    return true;
  }

  // Rutas de API - nunca deben pasar por middleware de autenticación
  if (pathname.startsWith("/api/")) {
    return true;
  }

  // Recursos estáticos (imágenes, assets, etc.)
  if (pathname.startsWith("/images/") || pathname.startsWith("/_next/")) {
    return true;
  }

  // Rutas públicas de vallas publicitarias (sin protección)
  if (pathname === "/vallas-publicitarias" || pathname.startsWith("/vallas-publicitarias/")) {
    return true;
  }

  // Otras rutas públicas comunes
  const publicRoutes = [
    "/about",
    "/contact",
    "/shop",
    "/cart",
    "/checkout",
    "/login",
    "/register",
    "/forgot-password",
    "/campaigns",
    "/captacion",
    "/print-shop",
    "/solicitar-cotizacion",
    "/privacy-policy",
    "/terms-of-service",
    "/cookie-policy",
  ];

  if (publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return true;
  }

  return false;
}

// ============================================================================
// MIDDLEWARE PRINCIPAL
// ============================================================================

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ✅ 0. PROTECCIÓN CONTRA BOTS (PRIMERO)
  // Aplicar antes de cualquier otra lógica
  // El botProtectionMiddleware ya maneja rutas esenciales (robots.txt, sitemap, etc.)
  const botProtectionResult = await botProtectionMiddleware(req);
  if (botProtectionResult) {
    return botProtectionResult; // Bloqueo o rate limit
  }

  // ✅ 1. RUTAS PÚBLICAS: Permitir acceso inmediato sin procesamiento
  // Esto asegura que bots de Vercel, Googlebot, etc. puedan acceder sin problemas
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // ✅ 2. REDIRECCIONES LEGACY: Mantener compatibilidad con URLs antiguas
  // Estas redirecciones deben ejecutarse ANTES de la lógica de protección

  // /product-page/[slug] → /vallas-publicitarias/[slug]
  if (pathname.startsWith("/product-page/")) {
    const slug = pathname.replace("/product-page/", "");
    const url = new URL(
      slug ? `/vallas-publicitarias/${slug}` : "/vallas-publicitarias",
      req.url
    );
    return NextResponse.redirect(url, { status: 301 });
  }

  // /products/[slug] → /vallas-publicitarias/[slug]
  if (pathname.startsWith("/products/")) {
    const slug = pathname.replace("/products/", "");
    const url = new URL(
      slug ? `/vallas-publicitarias/${slug}` : "/vallas-publicitarias",
      req.url
    );
    return NextResponse.redirect(url, { status: 301 });
  }

  // /vallas/[slug] → /vallas-publicitarias/[slug]
  if (pathname.startsWith("/vallas/")) {
    const slug = pathname.replace("/vallas/", "");
    const url = new URL(
      slug ? `/vallas-publicitarias/${slug}` : "/vallas-publicitarias",
      req.url
    );
    return NextResponse.redirect(url, { status: 301 });
  }

  // ✅ 3. RUTAS PROTEGIDAS: Verificar autenticación y autorización
  const matchedRoute = protectedRoutes.find((route) => pathname.startsWith(route.path));

  // Si no es una ruta protegida, permitir acceso
  if (!matchedRoute) {
    return NextResponse.next();
  }

  // Obtener token de sesión desde cookies
  const token = req.cookies.get("session")?.value;

  // Si no hay token, redirigir a login con parámetro next
  if (!token) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Verificar y decodificar JWT
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { role?: string };
    const userRole = payload.role || "invitado";

    // Verificar si el rol del usuario tiene acceso a esta ruta
    if (!matchedRoute.roles.includes(userRole)) {
      // Rol incorrecto: redirigir a home
      const url = new URL("/", req.url);
      return NextResponse.redirect(url);
    }

    // Usuario autenticado y autorizado: permitir acceso
    return NextResponse.next();
  } catch (error) {
    // Token inválido o expirado: redirigir a login
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
}

// ============================================================================
// CONFIGURACIÓN DEL MATCHER
// ============================================================================

/**
 * El matcher define qué rutas deben pasar por el middleware.
 * 
 * IMPORTANTE: Solo incluimos rutas que:
 * 1. Necesitan redirección legacy (product-page, products, vallas)
 * 2. Necesitan protección (panel, erp, dashboard, admin)
 * 
 * NO incluimos rutas públicas como /, /vallas-publicitarias, /api, etc.
 * Esto asegura que bots y previews de Vercel puedan acceder sin problemas.
 */
export const config = {
  matcher: [
    // Rutas protegidas que requieren autenticación/autorización
    "/panel/:path*",
    "/erp/:path*",
    "/dashboard/:path*",
    "/admin/:path*",
    // Rutas legacy que necesitan redirección
    "/product-page/:path*",
    "/products/:path*",
    "/vallas/:path*",
    // Rutas de API (para protección de bots)
    "/api/:path*",
    // Rutas públicas (para protección de bots y rate limiting)
    "/((?!_next/static|_next/image|favicon.ico|_next/webpack-hmr).*)",
  ],
};
