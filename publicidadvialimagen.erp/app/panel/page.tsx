import { redirect } from "next/navigation";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, Package, MessageSquare, Calendar, Handshake, Monitor, LineChart, Hammer, Wrench, Palette, Globe, Receipt, UserCog, Settings } from "lucide-react";

export default async function PanelPage() {
  const { isAuthenticated, getUser } = getKindeServerSession();
  const authed = await isAuthenticated();
  if (!authed) redirect("/login");

  const user = await getUser();

  return (
    <Sidebar>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Panel de Control</h1>
          <p className="text-gray-600 mt-2">
            Bienvenido, {user?.given_name || user?.email} - Gestiona tu empresa desde aquí
          </p>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mensajes</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">+2 nuevos hoy</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-muted-foreground">+12 este mes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Soportes Activos</CardTitle>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">45</div>
              <p className="text-xs text-muted-foreground">+3 esta semana</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ventas</CardTitle>
              <Handshake className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$45,231</div>
              <p className="text-xs text-muted-foreground">+20.1% este mes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inventario</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2,340</div>
              <p className="text-xs text-muted-foreground">+180 unidades</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Producción</CardTitle>
              <Hammer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">89</div>
              <p className="text-xs text-muted-foreground">Órdenes activas</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Próximas Actividades
              </CardTitle>
              <CardDescription>
                Eventos y tareas programadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Reunión con cliente ABC</span>
                  <span className="text-xs text-gray-500">Hoy 14:00</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Entrega de soporte #123</span>
                  <span className="text-xs text-gray-500">Mañana 10:00</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Revisión de inventario</span>
                  <span className="text-xs text-gray-500">Viernes 16:00</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <LineChart className="mr-2 h-5 w-5" />
                Métricas Rápidas
              </CardTitle>
              <CardDescription>
                Resumen de rendimiento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Tasa de conversión</span>
                  <span className="text-sm font-medium text-green-600">+12.5%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Satisfacción cliente</span>
                  <span className="text-sm font-medium text-green-600">4.8/5</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Tiempo de respuesta</span>
                  <span className="text-sm font-medium text-blue-600">2.3h</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Success Message */}
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                ✅ Sistema ERP funcionando correctamente
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>Autenticación con Kinde activa. Todos los módulos están disponibles en el menú lateral.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
