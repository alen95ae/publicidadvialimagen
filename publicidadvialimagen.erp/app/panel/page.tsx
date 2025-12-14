import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Handshake, ChevronRight, Monitor, Users, FileText, Send, Clock, Download, Wrench, Package, Receipt } from "lucide-react";
import Link from "next/link";
import ERPModulesGrid from "@/components/erp-modules-grid";
import PanelMetrics from "@/components/panel-metrics";
import PanelNotifications from "@/components/panel-notifications";
import { getSupabaseServer } from "@/lib/supabaseServer";

export default async function PanelPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  
  let user;
  try {
    user = await verifySession(token);
  } catch {
    redirect("/login");
  }

  // Obtener el nombre del rol desde la base de datos
  let roleName = user.role || 'invitado';
  if (user.sub) {
    try {
      const supabase = getSupabaseServer();
      const { data: userData } = await supabase
        .from('usuarios')
        .select('rol_id')
        .eq('id', user.sub)
        .single();
      
      if (userData?.rol_id) {
        const { data: roleData } = await supabase
          .from('roles')
          .select('nombre')
          .eq('id', userData.rol_id)
          .single();
        
        if (roleData?.nombre) {
          roleName = roleData.nombre;
        }
      }
    } catch (error) {
      console.error('Error obteniendo nombre del rol:', error);
    }
  }

  return (
      <div className="p-6 space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Panel Principal</h1>
            <Badge className="bg-red-100 text-red-800 text-sm font-semibold px-3 py-1 rounded-full">
              {roleName.toUpperCase()}
            </Badge>
          </div>
          <p className="text-gray-600 mt-2">
            Bienvenido al panel de control de PublicidadVialImagen
          </p>
        </div>

        {/* Métricas principales */}
        <PanelMetrics userName={user.name || user.email || ""} userRole={roleName} />

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
                {roleName.toLowerCase().trim() === 'ventas' ? (
                  // VENTAS: Nueva cotización
                  <Link
                    href="/panel/ventas/nuevo"
                    className="flex items-center justify-between p-4 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <Handshake className="w-5 h-5" />
                      <span className="font-medium">Nueva Cotización</span>
                    </div>
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ) : roleName.toLowerCase().trim() === 'produccion' ? (
                  // PRODUCCIÓN: Crear OT, Registrar mantenimiento, Registrar stock
                  <>
                    <Link
                      href="/panel/produccion/ot/nueva"
                      className="flex items-center justify-between p-4 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <Wrench className="w-5 h-5" />
                        <span className="font-medium">Crear OT</span>
                      </div>
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                      href="/panel/soportes/mantenimiento"
                      className="flex items-center justify-between p-4 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <Wrench className="w-5 h-5 text-gray-700" />
                        <span className="font-medium text-gray-700">Registrar Mantenimiento</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                      href="/panel/inventario"
                      className="flex items-center justify-between p-4 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <Package className="w-5 h-5 text-gray-700" />
                        <span className="font-medium text-gray-700">Registrar Stock</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </>
                ) : roleName.toLowerCase().trim() === 'contabilidad' ? (
                  // CONTABILIDAD: Crear factura, Enviar factura, Ver facturas vencidas
                  <>
                    <Link
                      href="/panel/contabilidad/facturas/nueva"
                      className="flex items-center justify-between p-4 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <Receipt className="w-5 h-5" />
                        <span className="font-medium">Crear Factura</span>
                      </div>
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                      href="/panel/contabilidad/facturas?enviar=true"
                      className="flex items-center justify-between p-4 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <Send className="w-5 h-5 text-gray-700" />
                        <span className="font-medium text-gray-700">Enviar Factura</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                      href="/panel/contabilidad/facturas?vencidas=true"
                      className="flex items-center justify-between p-4 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-gray-700" />
                        <span className="font-medium text-gray-700">Ver Facturas Vencidas</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </>
                ) : roleName.toLowerCase().trim() === 'admin' || roleName.toLowerCase().trim() === 'administrador' || roleName.toLowerCase().trim() === 'desarrollador' ? (
                  // ADMINISTRACIÓN: Nueva cotización, Descargar catálogo, Crear factura
                  <>
                    <Link
                      href="/panel/ventas/nuevo"
                      className="flex items-center justify-between p-4 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <Handshake className="w-5 h-5" />
                        <span className="font-medium">Nueva Cotización</span>
                      </div>
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                      href="/panel/soportes/gestion"
                      className="flex items-center justify-between p-4 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <Download className="w-5 h-5 text-gray-700" />
                        <span className="font-medium text-gray-700">Descargar Catálogo</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                      href="/panel/contabilidad/facturas/nueva"
                      className="flex items-center justify-between p-4 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <Receipt className="w-5 h-5 text-gray-700" />
                        <span className="font-medium text-gray-700">Crear Factura</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </>
                ) : (
                  // Por defecto: acciones generales
                  <>
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
                  </>
                )}
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
