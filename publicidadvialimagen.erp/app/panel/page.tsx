"use client"

import type React from "react"

import Link from "next/link"
import {
  Gauge,
  PanelsTopLeft,
  CalendarCheck,
  Calendar,
  Users,
  Building2,
  UserCog,
  Globe,
  Wrench,
  LineChart,
  Receipt,
  Handshake,
  MessageSquare,
  ShieldCheck,
  Map,
  Palette,
  Settings,
  Power,
  Monitor,
  Hammer,
} from "lucide-react"

const modules = [
  { key: "tablero", title: "Tablero", href: "/panel/tablero", icon: Gauge },
  { key: "soportes", title: "Soportes", href: "/panel/soportes", icon: Monitor },
  { key: "reservas", title: "Reservas", href: "/panel/reservas", icon: CalendarCheck },
  { key: "calendario", title: "Calendario", href: "/panel/calendario", icon: Calendar },
  { key: "clientes", title: "Clientes", href: "/panel/clientes", icon: Users },
  { key: "ventas", title: "Ventas", href: "/panel/ventas", icon: Handshake },
  { key: "empleados", title: "Empleados", href: "/panel/empleados", icon: UserCog },
  { key: "sitio", title: "Sitio Web", href: "/panel/sitio", icon: Globe },
  { key: "mantenimiento", title: "Mantenimiento", href: "/panel/mantenimiento", icon: Wrench },
  { key: "metricas", title: "Métricas", href: "/panel/metricas", icon: LineChart },
  { key: "facturacion", title: "Facturación", href: "/panel/facturacion", icon: Receipt },
  { key: "crm", title: "CRM", href: "/panel/crm", icon: Handshake },
  { key: "mensajeria", title: "Mensajería", href: "/panel/mensajeria", icon: MessageSquare },
  { key: "produccion", title: "Producción", href: "/panel/produccion", icon: Hammer },
  { key: "mapas", title: "Mapas", href: "/panel/mapas", icon: Map },
  { key: "diseno", title: "Diseño Gráfico", href: "/panel/diseno", icon: Palette },
  { key: "ajustes", title: "Ajustes", href: "/panel/ajustes", icon: Settings },
  { key: "salir", title: "Salir", href: "/api/auth/signout", icon: Power },
]

interface ModuleCardProps {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

function ModuleCard({ title, href, icon: Icon }: ModuleCardProps) {
  return (
    <Link
      href={href}
      className="group rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 p-6 flex flex-col items-center text-center focus:outline-none focus:ring-2 focus:ring-[#D54644] focus:ring-offset-2"
      aria-label={`Abrir módulo ${title}`}
    >
      <div className="w-16 h-16 bg-[#D54644] rounded-full flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-200">
        <Icon className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-slate-800 font-medium text-sm">{title}</h3>
    </Link>
  )
}

export default function PanelPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="text-xl font-bold text-slate-800">
              StellarMotion<sup className="text-sm">®</sup>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-gray-600">Buscar</span>
            <span className="text-gray-800 font-medium">alen93ae</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-slate-800 text-center mb-12">Panel de control</h1>

        {/* Modules Grid */}
        <nav
          role="navigation"
          aria-label="Módulos del panel de control"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 max-w-7xl mx-auto"
        >
          {modules.map((module) => (
            <ModuleCard key={module.key} title={module.title} href={module.href} icon={module.icon} />
          ))}
        </nav>
      </main>
    </div>
  )
}
