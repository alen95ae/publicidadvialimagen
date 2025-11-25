import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import Sidebar from "@/components/sidebar";
import { PermisosProvider } from "@/hooks/permisos-provider";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  
  if (!token) {
    redirect("/login");
  }

  try {
    await verifySession(token);
  } catch {
    redirect("/login");
  }

  return (
    <PermisosProvider>
      <Sidebar>
        {children}
      </Sidebar>
    </PermisosProvider>
  );
}
