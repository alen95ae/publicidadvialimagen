"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import {
  Calendar,
  Users,
  UserCog,
  Globe,
  Wrench,
  LineChart,
  Receipt,
  Handshake,
  MessageSquare,
  Palette,
  Settings,
  Power,
  Monitor,
  Hammer,
  Package,
  ChevronLeft,
  ChevronRight,
  Home,
} from "lucide-react"

const modules = [
  { key: "mensajeria", title: "Mensajería", href: "/panel/mensajeria", icon: MessageSquare },
  { key: "calendario", title: "Calendario", href: "/panel/calendario", icon: Calendar },
  { key: "clientes", title: "Clientes", href: "/panel/clientes", icon: Users },
  { key: "ventas", title: "Ventas", href: "/panel/ventas", icon: Handshake },
  { key: "soportes", title: "Soportes", href: "/panel/soportes/gestion", icon: Monitor },
  { key: "metricas", title: "Métricas", href: "/panel/metricas", icon: LineChart },
  { key: "inventario", title: "Inventario", href: "/panel/inventario", icon: Package },
  { key: "produccion", title: "Producción", href: "/panel/produccion", icon: Hammer },
  { key: "mantenimiento", title: "Mantenimiento", href: "/panel/mantenimiento", icon: Wrench },
  { key: "diseno", title: "Diseño Gráfico", href: "/panel/diseno", icon: Palette },
  { key: "sitio", title: "Sitio Web", href: "/panel/sitio", icon: Globe },
  { key: "contabilidad", title: "Contabilidad", href: "/panel/contabilidad", icon: Receipt },
  { key: "empleados", title: "Empleados", href: "/panel/empleados", icon: UserCog },
  { key: "ajustes", title: "Ajustes", href: "/panel/ajustes", icon: Settings },
  { key: "salir", title: "Salir", href: "/api/auth/signout", icon: Power },
]

interface SidebarProps {
  children: React.ReactNode
}

export default function Sidebar({ children }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()

  // Persistir el estado del sidebar en localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar-collapsed')
    if (savedState !== null) {
      setIsCollapsed(JSON.parse(savedState))
    }
  }, [])

  // Evitar animaciones en el primer render
  const [isInitialized, setIsInitialized] = useState(false)
  useEffect(() => {
    setIsInitialized(true)
  }, [])

  const toggleSidebar = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newState))
  }

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Sidebar */}
      <div className={`bg-white border-r border-gray-200 sticky top-0 self-start z-50 ${
        isCollapsed ? 'w-16' : 'w-64'
      } ${isInitialized ? '' : 'transition-none'}`} style={{ minHeight: '100vh' }}>
        {/* Toggle Button */}
        <div className="flex justify-end p-4 border-b border-gray-200">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label={isCollapsed ? "Expandir sidebar" : "Contraer sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4">
          <ul className="space-y-2">
            {modules.map((module) => {
              const Icon = module.icon
              const isActive = pathname === module.href
              
              return (
                <li key={module.key}>
                  <Link
                    href={module.href}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors group ${
                      isActive
                        ? 'bg-[#D54644] text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    } ${isCollapsed ? 'justify-center' : ''}`}
                    title={isCollapsed ? module.title : undefined}
                  >
                    <Icon className={`w-6 h-6 flex-shrink-0 ${
                      isActive ? 'text-white' : 'text-gray-600 group-hover:text-gray-900'
                    }`} />
                    {!isCollapsed && (
                      <span className="text-sm font-medium truncate">
                        {module.title}
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>
    </div>
  )
}
