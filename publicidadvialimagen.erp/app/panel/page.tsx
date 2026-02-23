import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Handshake, ChevronRight, Monitor, Users, FileText, Send, Clock, Download, Wrench, Package, Receipt, Calendar, TriangleAlert, TimerReset } from "lucide-react";
import Link from "next/link";
import PanelMetrics from "@/components/panel-metrics";
import PanelNotifications from "@/components/panel-notifications";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getAlquileres } from "@/lib/supabaseAlquileres";
import { getUrgeAlquilarList } from "@/lib/urgeAlquilar";

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

  // Alquileres en estado "próximo" (próximos a finalizar) para el panel
  let alquileresProximos: { id: string; codigo: string; fin: string; cliente: string | null; estado: string }[] = [];
  try {
    const { data } = await getAlquileres({ estado: 'proximo', limit: 50 });
    alquileresProximos = (data || []).map((a: { id: string; codigo: string; fin: string; cliente: string | null; estado: string }) => ({
      id: a.id,
      codigo: a.codigo,
      fin: a.fin,
      cliente: a.cliente,
      estado: a.estado,
    }));
  } catch (error) {
    console.error('Error obteniendo alquileres próximos:', error);
  }

  let urgeAlquilar: { id: number; codigo: string; ciudad: string; precio: number; estado: string }[] = [];
  try {
    urgeAlquilar = await getUrgeAlquilarList(10);
  } catch (error) {
    console.error('Error obteniendo urge alquilar:', error);
  }

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('es-ES');
  const STATUS_META: Record<string, { label: string; className: string }> = {
    'Disponible': { label: 'Disponible', className: 'bg-green-100 text-green-800' },
    'Reservado': { label: 'Reservado', className: 'bg-yellow-100 text-yellow-800' },
    'Ocupado': { label: 'Ocupado', className: 'bg-red-100 text-red-800' },
    'No disponible': { label: 'No disponible', className: 'bg-gray-100 text-gray-800' },
    'A Consultar': { label: 'A Consultar', className: 'bg-blue-100 text-blue-800' },
  };
  const formatPrecio = (n: number) => `${n.toFixed(2)} Bs`;

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
                  // VENTAS: Nueva cotización, Descargar catálogo, Agregar cliente
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

        {/* Alquileres próximos a finalizar y segundo apartado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Alquileres próximos a finalizar (mismo ancho que Notificaciones) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TimerReset className="w-5 h-5" />
                Alquileres próximos a finalizar
              </CardTitle>
              <CardDescription>
                Alquileres en estado Próximo (últimos 5 días antes del fin)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-center py-2 px-3 font-medium text-gray-900">Código</th>
                      <th className="text-center py-2 px-3 font-medium text-gray-900">Fin</th>
                      <th className="text-center py-2 px-3 font-medium text-gray-900">Cliente</th>
                      <th className="text-center py-2 px-3 font-medium text-gray-900">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alquileresProximos.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-6 text-gray-500 text-sm">
                          No hay alquileres próximos a finalizar
                        </td>
                      </tr>
                    ) : (
                      alquileresProximos.map((alquiler) => (
                        <tr key={alquiler.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-3 whitespace-nowrap text-center">
                            <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-1 font-mono text-xs text-gray-800 border border-neutral-200">
                              {alquiler.codigo}
                            </span>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-1 text-sm">
                              <Calendar className="w-3 h-3" />
                              {formatDate(alquiler.fin)}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className="text-sm">{alquiler.cliente || '-'}</span>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap text-center">
                            <span className="inline-flex items-center rounded px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800">
                              Próximo
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Urge alquilar: 10 soportes más caros (FIJO, finalizado) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TriangleAlert className="w-5 h-5" />
                Urge alquilar
              </CardTitle>
              <CardDescription>
                Soportes con pago fijo, sin alquiler activo, ordenados por coste de mayor a menor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-center py-2 px-3 font-medium text-gray-900">Código</th>
                      <th className="text-center py-2 px-3 font-medium text-gray-900">Ciudad</th>
                      <th className="text-center py-2 px-3 font-medium text-gray-900">Precio</th>
                      <th className="text-center py-2 px-3 font-medium text-gray-900">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {urgeAlquilar.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-6 text-gray-500 text-sm">
                          No hay soportes que cumplan los criterios
                        </td>
                      </tr>
                    ) : (
                      urgeAlquilar.map((item) => (
                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-3 whitespace-nowrap text-center">
                            <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-1 font-mono text-xs text-gray-800 border border-neutral-200">
                              {item.codigo}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className="text-sm">{item.ciudad}</span>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap text-center text-sm">
                            {formatPrecio(item.precio)}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap text-center">
                            <span className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${STATUS_META[item.estado]?.className ?? 'bg-gray-100 text-gray-800'}`}>
                              {STATUS_META[item.estado]?.label ?? item.estado}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
  );
}
