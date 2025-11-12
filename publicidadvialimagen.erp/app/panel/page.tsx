import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Package, MessageSquare, Calendar, Handshake, Monitor, LineChart, Hammer, Wrench, Palette, Globe, Receipt, UserCog, Settings, Home, ShoppingCart, TrendingUp, Building2, BarChart3, ChevronRight } from "lucide-react";
import Link from "next/link";
import DashboardCharts from "@/components/dashboard-charts";

export default async function PanelPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  
  let user;
  try {
    user = await verifySession(token);
  } catch {
    redirect("/login");
  }

  // Módulos para acciones rápidas
  const quickActions = [
    { name: "Mensajes", icon: MessageSquare, href: "/panel/mensajes" },
    { name: "Calendario", icon: Calendar, href: "/panel/calendario" },
    { name: "Contactos", icon: Users, href: "/panel/contactos" },
    { name: "Ventas", icon: Handshake, href: "/panel/ventas/cotizaciones" },
    { name: "Soportes", icon: Monitor, href: "/panel/soportes/gestion" },
    { name: "Inventario", icon: Package, href: "/panel/inventario" },
    { name: "Producción", icon: Hammer, href: "/panel/produccion" },
    { name: "Mantenimiento", icon: Wrench, href: "/panel/mantenimiento" },
    { name: "Contabilidad", icon: Receipt, href: "/panel/contabilidad" },
    { name: "Métricas", icon: LineChart, href: "/panel/metricas" },
    { name: "Sitio Web", icon: Globe, href: "/panel/sitio" },
    { name: "Diseño", icon: Palette, href: "/panel/diseno" },
    { name: "Empleados", icon: UserCog, href: "/panel/empleados" },
    { name: "Ajustes", icon: Settings, href: "/panel/ajustes/usuarios" },
  ];

  return (
      <div className="p-6 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Bienvenido al panel de control de PublicidadVialImagen
          </p>
        </div>

        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mensajes</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">+2 nuevos hoy</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Soportes Activos</CardTitle>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">45</div>
              <p className="text-xs text-muted-foreground">+3 esta semana</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ventas</CardTitle>
              <Handshake className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$45,231</div>
              <p className="text-xs text-muted-foreground">+20.1% este mes</p>
            </CardContent>
          </Card>
        </div>

        {/* Sección de Próximas Actividades y Acciones Rápidas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Próximas Actividades */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Calendar className="mr-2 h-5 w-5" />
                Próximas Actividades
              </CardTitle>
              <CardDescription>
                Eventos y tareas programadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start justify-between pb-3 border-b">
                  <div>
                    <p className="text-sm font-medium">Reunión con cliente ABC</p>
                    <p className="text-xs text-gray-500 mt-1">Presentación de propuesta comercial</p>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap ml-2">Hoy 14:00</span>
                </div>
                <div className="flex items-start justify-between pb-3 border-b">
                  <div>
                    <p className="text-sm font-medium">Entrega de soporte #123</p>
                    <p className="text-xs text-gray-500 mt-1">Instalación en Av. Cristo Redentor</p>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap ml-2">Mañana 10:00</span>
                </div>
                <div className="flex items-start justify-between pb-3 border-b">
                  <div>
                    <p className="text-sm font-medium">Revisión de inventario</p>
                    <p className="text-xs text-gray-500 mt-1">Control mensual de stock</p>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap ml-2">Viernes 16:00</span>
                </div>
                <Link 
                  href="/panel/calendario"
                  className="flex items-center justify-center text-sm text-red-600 hover:text-red-700 font-medium pt-2"
                >
                  Ver todas las actividades
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </CardContent>
          </Card>

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
                  href="/panel/ventas/cotizaciones"
                  className="flex items-center justify-between p-4 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="w-5 h-5" />
                    <span className="font-medium">Nueva Venta</span>
                  </div>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/panel/inventario"
                  className="flex items-center justify-between p-4 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-gray-700" />
                    <span className="font-medium text-gray-700">Registrar Compra</span>
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

                <Link
                  href="/panel/contabilidad"
                  className="flex items-center justify-between p-4 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Receipt className="w-5 h-5 text-gray-700" />
                    <span className="font-medium text-gray-700">Emitir Factura</span>
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
            <div className="grid grid-cols-4 md:grid-cols-7 xl:grid-cols-14 gap-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.name}
                    href={action.href}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-lg bg-red-500 flex items-center justify-center text-white group-hover:bg-red-600 transition-colors">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs text-center text-gray-700 font-medium">
                      {action.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Gráficos y Métricas */}
        <DashboardCharts />
      </div>
  );
}
