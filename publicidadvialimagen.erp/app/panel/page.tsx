import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Handshake, ChevronRight, Monitor, Users } from "lucide-react";
import Link from "next/link";
import ERPModulesGrid from "@/components/erp-modules-grid";
import PanelMetrics from "@/components/panel-metrics";
import PanelNotifications from "@/components/panel-notifications";

export default async function PanelPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  
  let user;
  try {
    user = await verifySession(token);
  } catch {
    redirect("/login");
  }


  return (
      <div className="p-6 space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">Panel Principal</h1>
            {user.role && (
              <span className="px-3 py-1 text-sm font-medium bg-red-100 text-red-800 rounded-full">
                {user.role === 'vendedor' ? 'Vendedor' : user.role === 'admin' ? 'Administrador' : 'Ventas'}
              </span>
            )}
          </div>
          <p className="text-gray-600 mt-2">
            Bienvenido al panel de control de PublicidadVialImagen
          </p>
        </div>

        {/* Métricas principales */}
        <PanelMetrics userName={user.name || user.email || ""} />

        {/* Sección de Notificaciones y Acciones Rápidas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Notificaciones */}
          <PanelNotifications />

          {/* Acciones Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
              <CardDescription>
                Accede a las funciones más utilizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Link
                  href="/panel/ventas/nuevo"
                  className="flex items-center justify-between p-4 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Handshake className="w-5 h-5" />
                    <span className="font-medium">Nueva Venta</span>
                  </div>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/panel/soportes/gestion"
                  className="flex items-center justify-between p-4 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Monitor className="w-5 h-5 text-gray-700" />
                    <span className="font-medium text-gray-700">Descargar Catálogo</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/panel/contactos"
                  className="flex items-center justify-between p-4 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-gray-700" />
                    <span className="font-medium text-gray-700">Agregar Cliente</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Módulos ERP */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Módulos ERP</CardTitle>
            <CardDescription>
              Accede rápidamente a cualquier módulo del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ERPModulesGrid />
          </CardContent>
        </Card>
      </div>
  );
}
