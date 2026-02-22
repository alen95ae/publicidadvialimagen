import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import Sidebar from "@/components/sidebar";
import { PermisosProvider } from "@/hooks/permisos-provider";
import SessionProtection from "@/components/session-protection";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  console.log("🕵️ [Layout] Cookie recibida en carga fría:", token ? "SÍ (" + token.substring(0, 20) + "...)" : "NO");

  if (!token) {
    console.log("🔴 [Layout] Redirigiendo a /login por falta de token");
    redirect("/login");
  }

  try {
    const payload = await verifySession(token);
    console.log("🕵️ [Layout] Payload de sesión verificado:", payload ? "SÍ" : "NO (null)");
    if (!payload) {
      console.log("🔴 [Layout] Token inválido o expirado. Redirigiendo a /login");
      redirect("/login");
    }
  } catch (error) {
    console.log("🔴 [Layout] Excepción al verificar token. Redirigiendo a /login", error);
    redirect("/login");
  }

  return (
    <PermisosProvider>
      <SessionProtection />
      <Sidebar>
        {children}
      </Sidebar>
    </PermisosProvider>
  );
}
