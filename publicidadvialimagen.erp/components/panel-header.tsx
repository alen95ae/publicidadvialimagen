"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { User, Bell, Mail, FileText } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface User {
  id: string
  email: string
  name: string
  role: string
}

interface NavItem {
  label: string
  href: string
}

interface ModuleConfig {
  title: string
  navItems: NavItem[]
}

// Configuración de navegación por módulo
const moduleConfigs: Record<string, ModuleConfig> = {
  soportes: {
    title: "Soportes",
    navItems: [
      { label: "Soportes", href: "/panel/soportes/gestion" },
      { label: "Alquileres", href: "/panel/soportes/alquileres" },
      { label: "Planificación", href: "/panel/soportes/planificacion" },
      { label: "Costes", href: "/panel/soportes/costes" },
      { label: "Mantenimiento", href: "/panel/soportes/mantenimiento" },
    ],
  },
  ventas: {
    title: "Ventas",
    navItems: [
      { label: "Cotizaciones", href: "/panel/ventas/cotizaciones" },
      { label: "Solicitudes de cotización", href: "/panel/ventas/solicitudes" },
      { label: "CRM", href: "/panel/ventas/crm" },
    ],
  },
  inventario: {
    title: "Inventario",
    navItems: [
      { label: "Productos", href: "/panel/inventario" },
      { label: "Recursos", href: "/panel/recursos" },
      { label: "Control de Stock", href: "/panel/ajustes-inventario" },
    ],
  },
  ajustes: {
    title: "Ajustes",
    navItems: [
      { label: "Usuarios", href: "/panel/ajustes/usuarios" },
      { label: "Roles y Permisos", href: "/panel/ajustes/roles" },
      { label: "Invitaciones", href: "/panel/ajustes/invitaciones" },
    ],
  },
  contactos: {
    title: "Contactos",
    navItems: [
      { label: "Contactos", href: "/panel/contactos" },
    ],
  },
  calendario: {
    title: "Calendario",
    navItems: [
      { label: "Calendario", href: "/panel/calendario" },
    ],
  },
  mensajes: {
    title: "Mensajes",
    navItems: [
      { label: "Mensajes", href: "/panel/mensajes" },
    ],
  },
}

// Función para detectar el módulo actual basado en el pathname
function getModuleConfig(pathname: string): ModuleConfig | null {
  if (pathname.startsWith("/panel/soportes")) {
    return moduleConfigs.soportes
  }
  if (pathname.startsWith("/panel/ventas")) {
    return moduleConfigs.ventas
  }
  // Inventario incluye inventario, recursos, ajustes-inventario, insumos, mano-de-obra
  if (
    pathname.startsWith("/panel/inventario") ||
    pathname.startsWith("/panel/recursos") ||
    pathname.startsWith("/panel/ajustes-inventario") ||
    pathname.startsWith("/panel/insumos") ||
    pathname.startsWith("/panel/mano-de-obra")
  ) {
    return moduleConfigs.inventario
  }
  if (pathname.startsWith("/panel/ajustes")) {
    return moduleConfigs.ajustes
  }
  if (pathname.startsWith("/panel/contactos")) {
    return moduleConfigs.contactos
  }
  if (pathname.startsWith("/panel/calendario")) {
    return moduleConfigs.calendario
  }
  if (pathname.startsWith("/panel/mensajes")) {
    return moduleConfigs.mensajes
  }
  return null
}

interface Notification {
  id: string
  codigo?: string // Para solicitudes
  type: "mensaje" | "solicitud"
  titulo: string
  mensaje: string
  fecha: string
  link: string
}

export default function PanelHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notificationCount, setNotificationCount] = useState(0)
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set())

  const moduleConfig = getModuleConfig(pathname)

  useEffect(() => {
    fetchUser()
    fetchNotifications()
    // Actualizar notificaciones cada 30 segundos
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      }
    } catch (error) {
      console.error("Error fetching user:", error)
    } finally {
      setLoading(false)
    }
  }

  const getInitials = () => {
    if (user?.name) {
      return user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    return user?.email?.[0]?.toUpperCase() || "U"
  }

  const getUserName = () => {
    return user?.name || user?.email || "Usuario"
  }

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true)
      const response = await fetch("/api/notifications", {
        credentials: "include",
        cache: "no-store",
      })
      if (response.ok) {
        const data = await response.json()
        const allNotifications = data.notificaciones || []
        // Filtrar las notificaciones ya leídas usando el estado actual
        setReadNotifications((currentRead) => {
          const unreadNotifications = allNotifications.filter(
            (n: Notification) => !currentRead.has(n.id)
          )
          setNotifications(unreadNotifications)
          setNotificationCount(unreadNotifications.length)
          return currentRead
        })
      } else {
        // Si la respuesta no es OK, simplemente no mostrar notificaciones
        console.warn("Notifications API returned non-OK status:", response.status)
        setNotifications([])
        setNotificationCount(0)
      }
    } catch (error) {
      // Error silencioso - no mostrar notificaciones si falla
      console.error("Error fetching notifications:", error)
      setNotifications([])
      setNotificationCount(0)
    } finally {
      setLoadingNotifications(false)
    }
  }

  const markNotificationAsRead = async (notification: Notification) => {
    try {
      // Marcar como leída en el estado local
      setReadNotifications((prev) => new Set(prev).add(notification.id))
      
      // Remover de la lista de notificaciones
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id))
      setNotificationCount((prev) => Math.max(0, prev - 1))

      // Actualizar el estado en el backend
      if (notification.type === "mensaje") {
        await fetch(`/api/messages/${notification.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ estado: "LEÍDO" }),
          cache: 'no-store'
        })
      } else if (notification.type === "solicitud") {
        // Para solicitudes, usar el código si está disponible, sino extraerlo del link
        const codigo = notification.codigo || notification.link.split("/").pop()
        if (codigo) {
          await fetch(`/api/solicitudes/${codigo}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ estado: "Pendiente" }),
          })
        }
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    markNotificationAsRead(notification)
    router.push(notification.link)
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      if (diffMins < 1) return "Ahora"
      if (diffMins < 60) return `Hace ${diffMins} min`
      if (diffHours < 24) return `Hace ${diffHours} h`
      if (diffDays < 7) return `Hace ${diffDays} días`
      return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" })
    } catch {
      return dateString
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
      router.replace("/login")
    } catch (error) {
      console.error("Error during logout:", error)
      router.replace("/login")
    }
  }

  const isActive = (href: string) => {
    // Coincidencia exacta
    if (href === pathname) return true
    // Para rutas dinámicas o subrutas, verificar que empiece con el href
    // pero evitar falsos positivos (ej: /panel/ajustes no debería activar /panel/ajustes/roles)
    if (pathname.startsWith(href + "/") && href !== "/panel") return true
    return false
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-40">
      <div className="flex items-center justify-between gap-4">
        {/* Título del módulo y navegación */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {moduleConfig && (
            <>
              <div className="text-xl font-bold text-slate-800 whitespace-nowrap">
                {moduleConfig.title}
              </div>
              {moduleConfig.navItems.length > 0 && (
                <div className="flex items-center gap-6 ml-4 overflow-x-auto">
                  {moduleConfig.navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`text-sm font-medium whitespace-nowrap transition-colors ${
                        isActive(item.href)
                          ? "text-[#D54644] hover:text-[#D54644]/80"
                          : "text-gray-600 hover:text-[#D54644]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Notificaciones y Usuario */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {/* Notificaciones */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <Badge
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-[#D54644] hover:bg-[#D54644]"
                  >
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notificaciones</span>
                {notificationCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {notificationCount}
                  </Badge>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {loadingNotifications ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  Cargando...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  No hay notificaciones nuevas
                </div>
              ) : (
                notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className="flex flex-col items-start p-3 cursor-pointer"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-2 w-full">
                      {notification.type === "mensaje" ? (
                        <Mail className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <FileText className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {notification.titulo}
                        </p>
                        {notification.mensaje && (
                          <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                            {notification.mensaje}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(notification.fecha)}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Usuario */}
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 h-auto p-2 hover:bg-gray-100">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" alt={getUserName()} />
                      <AvatarFallback className="bg-[#D54644] text-white text-sm font-medium">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-gray-800">
                      {getUserName()}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{getUserName()}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/panel/perfil")}>
                    <User className="mr-2 h-4 w-4" />
                    Perfil
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="icon" asChild>
                <a href="/login">
                  <User className="h-5 w-5" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
