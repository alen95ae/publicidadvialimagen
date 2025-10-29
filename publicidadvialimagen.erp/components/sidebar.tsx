"use client"

import type React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
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
  { key: "panel", title: "Panel Principal", href: "/panel", icon: Home },
  { key: "mensajes", title: "Mensajes", href: "/panel/mensajes", icon: MessageSquare },
  { key: "calendario", title: "Calendario", href: "/panel/calendario", icon: Calendar },
  { key: "contactos", title: "Contactos", href: "/panel/contactos", icon: Users },
  { key: "ventas", title: "Ventas", href: "/panel/ventas/cotizaciones", icon: Handshake },
  { key: "soportes", title: "Soportes", href: "/panel/soportes/gestion", icon: Monitor },
  { key: "inventario", title: "Inventario", href: "/panel/inventario", icon: Package },
  { key: "produccion", title: "Producción", href: "/panel/produccion", icon: Hammer },
  { key: "mantenimiento", title: "Mantenimiento", href: "/panel/mantenimiento", icon: Wrench },
  { key: "contabilidad", title: "Contabilidad", href: "/panel/contabilidad", icon: Receipt },
  { key: "metricas", title: "Métricas", href: "/panel/metricas", icon: LineChart },
  { key: "sitio", title: "Sitio Web", href: "/panel/sitio", icon: Globe },
  { key: "diseno", title: "Diseño Gráfico", href: "/panel/diseno", icon: Palette },
  { key: "empleados", title: "Empleados", href: "/panel/empleados", icon: UserCog },
  { key: "ajustes", title: "Ajustes", href: "/panel/ajustes", icon: Settings },
  { key: "salir", title: "Salir", href: null, icon: Power, isLogout: true },
]

interface SidebarProps {
  children: React.ReactNode
}

export default function Sidebar({ children }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

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

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      router.replace('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      router.replace('/login');
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Sidebar */}
      <div className={`bg-white border-r border-gray-200 sticky top-0 self-start z-50 ${
        isCollapsed ? 'w-16' : 'w-64'
      } ${isInitialized ? '' : 'transition-none'}`} style={{ minHeight: '100vh' }}>
        {/* Logo y Toggle Button */}
        {!isCollapsed ? (
          <div className="flex justify-between items-center py-6 px-4 border-b border-gray-200">
            <div className="w-32 h-8">
              <svg id="Capa_1" data-name="Capa 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 580.82 132.56" className="w-full h-full">
                <defs>
                  <style>
                    {`.cls-1,.cls-2{fill:#be0811;}.cls-1{fill-rule:evenodd;}.cls-3{fill:gray;}.cls-4{fill:#6e6e6e;}.cls-5{fill:#848483;}.cls-6{fill:#999;}`}
                  </style>
                </defs>
                <path className="cls-1" d="M677.59,370.43c-1.34,0-2.59,0-3.84,0a.87.87,0,0,1-1-.78q-.56-2.16-1.14-4.32c-.62-2.34-1.5-3-3.87-2.95-.68,0-.91.18-.9.88,0,2,0,4.05,0,6.08,0,.81-.15,1.18-1,1.09-1.08-.09-2.5.33-3.16-.21s-.2-2.05-.2-3.13c0-5.23,0-10.45,0-15.68,0-.57,0-1,.74-1.11a32.71,32.71,0,0,1,9,0c2.75.53,4.31,2.07,4.69,4.41.43,2.72-.49,4.43-3.36,6.12a5.9,5.9,0,0,1,2.66,4c.44,1.83,1,3.64,1.47,5.54m-10.74-14.06c0,3.16.24,3.36,3.27,2.63a2.69,2.69,0,0,0,.45-.16,2.81,2.81,0,0,0,1.78-3.41c-.42-1.6-2.27-2.43-4.79-2-1.42.27-.44,1.53-.7,2.3a1.72,1.72,0,0,0,0,.6" transform="translate(-127.06 -239.72)"/>
                <path className="cls-1" d="M645.71,350a15.06,15.06,0,0,1,4.3.63c.69.2.93.48.71,1.19s-.24,1.95-.79,2.48-1.48-.35-2.28-.46a7.31,7.31,0,0,0-3.48.07,1.87,1.87,0,0,0-1.41,1.51,1.77,1.77,0,0,0,1,1.8,24.14,24.14,0,0,0,3.54,1.54c1.86.81,3.54,1.82,4.18,3.91,1.09,3.53-.93,6.68-4.88,7.64a14,14,0,0,1-7.75-.49c-.61-.2-1.09-.42-.73-1.27s.21-2,.76-2.48,1.56.39,2.4.55a8.71,8.71,0,0,0,4.18.14,2.08,2.08,0,0,0,1.67-1.72,2,2,0,0,0-1.05-2,13,13,0,0,0-2.53-1.12c-2.12-.8-4.12-1.77-5-4-1.32-3.27.93-6.79,4.82-7.58a7.35,7.35,0,0,1,2.4-.27" transform="translate(-127.06 -239.72)"/>
                <path className="cls-1" d="M687.81,360.34c0-3,0-6.08,0-9.11,0-.74.17-1,.94-1a18.3,18.3,0,0,0,2.67,0c.78-.07.94.22.93,1,0,4.73,0,9.47,0,14.21,0,1.05.3,1.28,1.28,1.24,2-.08,4,0,6,0,.63,0,.8.19.82.82.11,3,.13,3-2.78,3s-5.75,0-8.63,0c-.88,0-1.18-.17-1.16-1.12.07-3,0-6,0-9" transform="translate(-127.06 -239.72)"/>
                <path className="cls-1" d="M659.5,368a2.66,2.66,0,1,1-5.31-.12,2.66,2.66,0,1,1,5.31.12" transform="translate(-127.06 -239.72)"/>
                <path className="cls-1" d="M684.78,367.94a2.66,2.66,0,1,1-2.71-2.75,2.62,2.62,0,0,1,2.71,2.75" transform="translate(-127.06 -239.72)"/>
                <path className="cls-1" d="M707.87,368a2.66,2.66,0,1,1-2.67-2.79,2.63,2.63,0,0,1,2.67,2.79" transform="translate(-127.06 -239.72)"/>
                <rect className="cls-2" y="27.4" width="20.58" height="102.41"/>
                <polygon className="cls-3" points="80.8 91.47 79.39 89.57 79.08 90.42 80.8 91.47"/>
                <path className="cls-4" d="M171.77,293.08,160.54,296v6.41l24.38,14.81c-5.22-9.77-10.41-19.38-13.15-24.17" transform="translate(-127.06 -239.72)"/>
                <polygon className="cls-4" points="33.49 130.59 54.07 130.59 54.07 100.75 33.49 69.43 33.49 130.59"/>
                <polygon className="cls-5" points="113.21 130.59 133.8 130.59 133.8 126.3 113.21 112.02 113.21 130.59"/>
                <path className="cls-5" d="M200.28,346.24h0s-7.7-14.64-15.36-29l-24.38-14.81v6.71l20.58,31.32v-11.7l22.56,30.41-2.13-16.43Z" transform="translate(-127.06 -239.72)"/>
                <polygon className="cls-4" points="125.99 49.35 120.14 55.69 106.31 70.68 104.22 67.71 89.89 86.97 84.75 93.87 83.67 95.33 80.8 91.47 79.39 89.57 74.49 103.03 76.62 119.46 83.67 128.97 101.93 104.3 102.3 103.8 104.96 100.19 113.21 89.05 113.21 103.74 126.12 101.94 133.8 78.82 133.8 64.1 125.99 49.35"/>
                <polygon className="cls-6" points="126.12 101.94 113.21 103.74 113.21 112.02 133.8 126.3 133.8 100.86 133.8 93.59 133.8 78.82 126.12 101.94"/>
                <path className="cls-5" d="M175,287.1l-5.39-7.23-9.07-12.18V296l11.23-2.95c2.07-1.7,3.23-6,3.23-6" transform="translate(-127.06 -239.72)"/>
                <polygon className="cls-6" points="126.08 38.34 104.22 67.71 106.31 70.68 120.14 55.69 125.99 49.35 133.8 64.1 133.8 40.89 133.8 37.83 133.8 27.97 126.08 38.34"/>
                <path className="cls-6" d="M184.92,317.25c7.66,14.36,15.36,29,15.36,29l2.13,3.17,1.27-5.9,2.45-13.38.31-.85L175,287.1l-3.23,6c.12,0,7.93,14.4,13.15,24.17" transform="translate(-127.06 -239.72)"/>
                <path className="cls-2" d="M316.24,265,363,369.53H340.7L333.77,354H298.7l-6.92,15.57H269.54Zm9.4,70.77-9.34-21.66-9.47,21.66Z" transform="translate(-127.06 -239.72)"/>
                <path className="cls-2" d="M410.51,266.49a52.29,52.29,0,0,1,36.78,15.18l-14.67,14.67a30.28,30.28,0,0,0-22-9.21,29.72,29.72,0,0,0-22,9.21,31.13,31.13,0,0,0,0,44.09,29.69,29.69,0,0,0,22,9.15,31.07,31.07,0,0,0,28.08-17.92H409.49V312h52.6c1.47,19.14-4.81,33-14.93,43.08a50.27,50.27,0,0,1-36.71,15.18,51.95,51.95,0,0,1-51.91-51.9,50.42,50.42,0,0,1,15.25-36.79,49.64,49.64,0,0,1,36.66-15.31Z" transform="translate(-127.06 -239.72)"/>
                <polygon className="cls-2" points="405.87 27.14 405.87 47.66 364.7 47.66 364.7 68.31 395.58 68.31 395.58 88.83 364.7 88.83 364.7 109.47 405.87 109.47 405.87 129.93 344.12 129.93 344.12 27.14 405.87 27.14"/>
                <polygon className="cls-2" points="482.39 84.66 482.39 27.8 503.04 27.8 503.04 132.56 441.29 73.73 441.29 130.59 420.71 130.59 420.71 25.9 482.39 84.66"/>
                <path className="cls-4" d="M412.3,260.14h-2.51v-20h7.1a6.19,6.19,0,0,1,4.91,1.81,6.12,6.12,0,0,1,1.58,4.13,5.69,5.69,0,0,1-1.72,4.26,6.15,6.15,0,0,1-4.51,1.69H412.3Zm0-10.2h4.6a3.94,3.94,0,0,0,2.86-1.06,3.78,3.78,0,0,0,1.08-2.81,4.09,4.09,0,0,0-1-2.67,3.43,3.43,0,0,0-2.8-1.17H412.3Z" transform="translate(-127.06 -239.72)"/>
                <path className="cls-4" d="M438,240.13h2.08V253.2q0,3.93-1.93,5.64a7.3,7.3,0,0,1-5.05,1.71c-2.31,0-4-.59-5.14-1.76s-1.67-3-1.67-5.59V240.13h2.5V253.2a7,7,0,0,0,.55,3.29A3.22,3.22,0,0,0,431,257.9a6,6,0,0,0,2.3.45,4.71,4.71,0,0,0,3.52-1.22,5.44,5.44,0,0,0,1.2-3.93Z" transform="translate(-127.06 -239.72)"/>
                <path className="cls-4" d="M444.77,260.14v-20h7.91a6,6,0,0,1,4.44,1.47,4.67,4.67,0,0,1,1.44,3.39c0,2.27-1.18,3.77-3.55,4.52a5.36,5.36,0,0,1,3.14,1.93,5.16,5.16,0,0,1,1,3.16,5.37,5.37,0,0,1-1.59,4,6.7,6.7,0,0,1-4.91,1.59Zm2.42-11.43h4.35c1.81,0,3-.35,3.62-1a3.52,3.52,0,0,0,.91-2.42,2.82,2.82,0,0,0-1-2.23,4.32,4.32,0,0,0-2.91-.85h-5Zm0,9.23h5.36a4.46,4.46,0,0,0,3-.95,3.18,3.18,0,0,0,1.07-2.48,4.16,4.16,0,0,0-.49-2,3.36,3.36,0,0,0-1.36-1.41,5.48,5.48,0,0,0-2.62-.5h-5Z" transform="translate(-127.06 -239.72)"/>
                <polygon className="cls-4" points="347.68 18.22 347.68 20.42 335.86 20.42 335.86 0.41 338.43 0.41 338.43 18.22 347.68 18.22"/>
                <rect className="cls-4" x="350.56" y="0.41" width="2.51" height="20.01"/>
                <path className="cls-4" d="M497.12,253.41l2.28.52q-1.63,6.61-7.42,6.62a6.87,6.87,0,0,1-6-3.07,12.67,12.67,0,0,1-2.17-7.54,11.5,11.5,0,0,1,2.26-7.42,7.37,7.37,0,0,1,6.06-2.8q5.63,0,7.22,6.44l-2.36.46q-1.29-4.77-4.88-4.77a4.64,4.64,0,0,0-4.11,2.22,11.32,11.32,0,0,0-1.46,6.23,10.36,10.36,0,0,0,1.5,5.9,4.54,4.54,0,0,0,4,2.23c2.55,0,4.25-1.68,5.08-5" transform="translate(-127.06 -239.72)"/>
                <rect className="cls-4" x="375.45" y="0.41" width="2.51" height="20.01"/>
                <path className="cls-4" d="M510,260.14v-20h6.71a8.05,8.05,0,0,1,6.6,2.89,10.81,10.81,0,0,1,2.36,7.06,11.13,11.13,0,0,1-2.31,7.15,7.11,7.11,0,0,1-5.83,2.91Zm2.5-2.12h4.06a5.77,5.77,0,0,0,4.9-2.23,9.6,9.6,0,0,0,1.67-5.88,9.28,9.28,0,0,0-1.59-5.32,5.56,5.56,0,0,0-5-2.36h-4.06Z" transform="translate(-127.06 -239.72)"/>
                <path className="cls-4" d="M542.31,260.14h-2.55l-2-5.85h-7.42l-1.79,5.85h-2.1l6.5-20h2.84Zm-5.1-7.72-3.1-9.62-3.1,9.62Z" transform="translate(-127.06 -239.72)"/>
                <path className="cls-4" d="M544.92,260.14v-20h6.71a8,8,0,0,1,6.6,2.89,10.81,10.81,0,0,1,2.36,7.06,11.19,11.19,0,0,1-2.3,7.15,7.14,7.14,0,0,1-5.84,2.91Zm2.51-2.12h4.06a5.74,5.74,0,0,0,4.89-2.23,9.54,9.54,0,0,0,1.67-5.88,9.28,9.28,0,0,0-1.59-5.32,5.56,5.56,0,0,0-5-2.36h-4.06Z" transform="translate(-127.06 -239.72)"/>
                <polygon className="cls-4" points="464.45 0.41 457.71 20.42 455.28 20.42 448.54 0.41 451.17 0.41 456.75 16.92 462.27 0.41 464.45 0.41"/>
                <rect className="cls-4" x="467.06" y="0.41" width="2.51" height="20.01"/>
                <path className="cls-4" d="M615.09,260.14h-2.56l-2-5.85H603.1l-1.79,5.85h-2.1l6.5-20h2.84Zm-5.1-7.72-3.1-9.62-3.1,9.62Z" transform="translate(-127.06 -239.72)"/>
                <polygon className="cls-4" points="502.46 18.22 502.46 20.42 490.64 20.42 490.64 0.41 493.21 0.41 493.21 18.22 502.46 18.22"/>
              </svg>
            </div>
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Contraer sidebar"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center p-4 border-b border-gray-200">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Expandir sidebar"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="p-4">
          <ul className="space-y-2">
            {modules.map((module) => {
              const Icon = module.icon
              // Para el módulo inventario, también considerar activo cuando estamos en insumos
              const isActive = module.key === 'inventario' 
                ? (pathname === module.href || pathname === '/panel/insumos')
                : pathname === module.href
              
              // Manejar logout como botón especial
              if (module.isLogout) {
                return (
                  <li key={module.key}>
                    <button
                      onClick={handleLogout}
                      className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors group w-full text-left ${
                        'text-gray-700 hover:bg-red-50 hover:text-red-600'
                      } ${isCollapsed ? 'justify-center' : ''}`}
                      title={isCollapsed ? module.title : undefined}
                    >
                      <Icon className={`w-6 h-6 flex-shrink-0 ${
                        'text-gray-600 group-hover:text-red-600'
                      }`} />
                      {!isCollapsed && (
                        <span className="text-sm font-medium truncate">
                          {module.title}
                        </span>
                      )}
                    </button>
                  </li>
                )
              }
              
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
