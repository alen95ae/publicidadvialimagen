"use client";

import Link from "next/link";
import { Users, Package, MessageSquare, Calendar, Handshake, Monitor, LineChart, Hammer, Wrench, Palette, Globe, Receipt, UserCog, Settings } from "lucide-react";
import { usePermisosContext } from "@/hooks/permisos-provider";

const modules = [
  { name: "Mensajes", icon: MessageSquare, href: "/panel/mensajes", key: "mensajes" },
  { name: "Calendario", icon: Calendar, href: "/panel/calendario", key: "calendario" },
  { name: "Contactos", icon: Users, href: "/panel/contactos", key: "contactos" },
  { name: "Ventas", icon: Handshake, href: "/panel/ventas/cotizaciones", key: "ventas" },
  { name: "Soportes", icon: Monitor, href: "/panel/soportes/gestion", key: "soportes" },
  { name: "Inventario", icon: Package, href: "/panel/inventario", key: "inventario" },
  { name: "Producción", icon: Hammer, href: "/panel/produccion", key: "produccion" },
  { name: "Mantenimiento", icon: Wrench, href: "/panel/mantenimiento", key: "mantenimiento" },
  { name: "Contabilidad", icon: Receipt, href: "/panel/contabilidad", key: "contabilidad" },
  { name: "Métricas", icon: LineChart, href: "/panel/metricas", key: "metricas" },
  { name: "Sitio Web", icon: Globe, href: "/panel/sitio", key: "sitio" },
  { name: "Diseño", icon: Palette, href: "/panel/diseno", key: "diseno" },
  { name: "Empleados", icon: UserCog, href: "/panel/empleados", key: "empleados" },
  { name: "Ajustes", icon: Settings, href: "/panel/ajustes/usuarios", key: "ajustes" },
];

export default function ERPModulesGrid() {
  const { puedeVer, puedeEditar, esAdmin, loading } = usePermisosContext();

  // Filtrar módulos según permisos (igual que en sidebar)
  const filteredModules = modules.filter((module) => {
    if (loading) return false;
    
    // Ajustes: solo mostrar si tiene permiso ver, editar o admin
    if (module.key === 'ajustes') {
      return puedeVer(module.key) || puedeEditar(module.key) || esAdmin(module.key);
    }
    
    // Filtrar módulos sin permiso ver
    return puedeVer(module.key);
  });

  return (
    <div className="grid grid-cols-4 md:grid-cols-7 xl:grid-cols-14 gap-4">
      {filteredModules.map((action) => {
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
  );
}

