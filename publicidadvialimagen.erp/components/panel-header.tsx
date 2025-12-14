"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { User, Bell, Mail, FileText } from "lucide-react"
import { usePermisosContext } from "@/hooks/permisos-provider"
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
  imagen_usuario?: any
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
      { label: "Informes", href: "/panel/soportes/informes" },
    ],
  },
  ventas: {
    title: "Ventas",
    navItems: [
      { label: "Cotizaciones", href: "/panel/ventas/cotizaciones" },
      { label: "Solicitudes de cotización", href: "/panel/ventas/solicitudes" },
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
      { label: "Notificaciones", href: "/panel/mensajes" },
      { label: "Formularios", href: "/panel/mensajes/formularios" },
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
  tipo: string
  titulo: string
  mensaje: string
  prioridad: 'baja' | 'media' | 'alta'
  leida: boolean
  entidad_tipo?: string | null
  entidad_id?: string | null
  url?: string | null
  created_at: string
}

export default function PanelHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const { tieneFuncionTecnica, puedeVer } = usePermisosContext()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])
  // CONTADOR ÚNICO: Solo usar sistemaNotificacionesCount de /api/notificaciones/count
  // Eliminado notificationCount para evitar duplicados
  const [sistemaNotificacionesCount, setSistemaNotificacionesCount] = useState(0)
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set())

  const moduleConfig = getModuleConfig(pathname)

  useEffect(() => {
    fetchUser()
    fetchNotifications()
    fetchSistemaNotificaciones()
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

  // Setup Realtime en un useEffect separado después de obtener el usuario
  useEffect(() => {
    if (!user?.role && !user?.rol) return

    const userRol = user.role || user.rol
    const rolNormalizado = userRol.toLowerCase()
    let cleanup: (() => void) | undefined

    const setupRealtime = async () => {
      try {
        // Importar Supabase client dinámicamente
        const { createClient } = await import('@supabase/supabase-js')
        
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        
        if (!supabaseUrl || !supabaseAnonKey) {
          console.warn('[Realtime] Variables de entorno faltantes, usando polling como fallback')
          // Fallback a polling si no hay variables de entorno
          const interval = setInterval(() => {
            fetchNotifications()
            fetchSistemaNotificaciones()
          }, 15000)
          cleanup = () => clearInterval(interval)
          return
        }
        
        const supabase = createClient(supabaseUrl, supabaseAnonKey)
        
        // Suscribirse a cambios en notificaciones
        // Nota: No podemos filtrar por array directamente en Realtime, 
        // así que recibimos todos los INSERTs y filtramos en el handler
        const channel = supabase
          .channel(`notificaciones:${rolNormalizado}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notificaciones'
            },
            (payload) => {
              const newNotification = payload.new as any
              
              // Filtrar por rol: verificar si el rol del usuario está en roles_destino
              const rolesDestino = newNotification.roles_destino || []
              if (!Array.isArray(rolesDestino) || !rolesDestino.includes(rolNormalizado)) {
                return // No es para este rol, ignorar
              }
              
              // Verificar que no es duplicado
              setNotifications((prev) => {
                const exists = prev.some(n => n.id === newNotification.id)
                if (exists) return prev
                
                // Filtrar por permisos antes de añadir (usar hooks del contexto)
                const notification = newNotification as Notification
                if ((notification.entidad_tipo === "formulario" || notification.entidad_tipo === "mensaje") && !puedeVer("mensajes")) {
                  return prev
                }
                
                if (notification.entidad_tipo === "solicitud" && !tieneFuncionTecnica("ver solicitudes cotizacion")) {
                  return prev
                }
                
                return [notification, ...prev]
              })
              
              // Actualizar contador
              setSistemaNotificacionesCount(prev => prev + 1)
              
              // Opcional: mostrar toast/sonido
              console.log('[Realtime] Nueva notificación recibida:', newNotification.titulo)
            }
          )
          .subscribe()
        
        cleanup = () => {
          supabase.removeChannel(channel)
        }
      } catch (error) {
        console.error('[Realtime] Error configurando suscripción:', error)
        // Fallback a polling si Realtime falla
        const interval = setInterval(() => {
          fetchNotifications()
          fetchSistemaNotificaciones()
        }, 15000)
        cleanup = () => clearInterval(interval)
      }
    }

    setupRealtime()

    return () => {
      if (cleanup) cleanup()
    }
  }, [user?.role, user?.rol, puedeVer, tieneFuncionTecnica])

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

  const getUserImage = () => {
    if (user?.imagen_usuario) {
      const imagenData = typeof user.imagen_usuario === 'string' 
        ? JSON.parse(user.imagen_usuario) 
        : user.imagen_usuario;
      return imagenData?.url || null;
    }
    return null;
  }

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true)
      const response = await fetch("/api/notificaciones", {
        credentials: "include",
        cache: "no-store",
      })
      if (response.ok) {
        const data = await response.json()
        // Asegurar que siempre sea un array
        const allNotifications: Notification[] = Array.isArray(data) ? data : []
        
        // Filtrar las notificaciones ya leídas y por permisos
        setReadNotifications((currentRead) => {
          const unreadNotifications = allNotifications.filter(
            (n: Notification) => {
              // Filtrar notificaciones ya leídas
              if (n.leida || currentRead.has(n.id)) return false
              
              // Filtrar notificaciones de formularios/mensajes si no tiene permiso ver mensajes
              if ((n.entidad_tipo === "formulario" || n.entidad_tipo === "mensaje") && !puedeVer("mensajes")) {
                return false
              }
              
              // Filtrar notificaciones de solicitudes si no tiene función técnica ver solicitudes cotizacion
              if (n.entidad_tipo === "solicitud" && !tieneFuncionTecnica("ver solicitudes cotizacion")) {
                return false
              }
              
              return true
            }
          )
          setNotifications(unreadNotifications)
          // NO actualizar notificationCount - el contador viene solo de sistemaNotificacionesCount
          return currentRead
        })
      } else {
        // Si la respuesta no es OK, simplemente no mostrar notificaciones
        console.warn("Notificaciones API returned non-OK status:", response.status)
        setNotifications([])
      }
    } catch (error) {
      // Error silencioso - no mostrar notificaciones si falla
      console.error("Error fetching notifications:", error)
      setNotifications([])
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
      // NO actualizar notificationCount - el contador viene solo de sistemaNotificacionesCount
      // El contador se actualizará automáticamente en el próximo fetchSistemaNotificaciones()

      // Actualizar el estado en el backend usando el endpoint de notificaciones
      await fetch(`/api/notificaciones/${notification.id}`, {
          method: "PATCH",
        credentials: "include",
          cache: 'no-store'
        })
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const fetchSistemaNotificaciones = async () => {
    try {
      const response = await fetch("/api/notificaciones/count", {
        credentials: "include",
        cache: "no-store",
      })
      if (response.ok) {
        const data = await response.json()
        setSistemaNotificacionesCount(data.count || 0)
      } else {
        // Si hay error, asumir 0 para no romper el header
        setSistemaNotificacionesCount(0)
      }
    } catch (error) {
      // Error silencioso - asumir 0
      setSistemaNotificacionesCount(0)
    }
  }

  const getNotificationUrl = (entidadTipo?: string | null, entidadId?: string | null): string | null => {
    if (!entidadTipo || !entidadId) return null;
    
    // Mapeo OBLIGATORIO a rutas REALES (no placeholders)
    switch (entidadTipo.toLowerCase()) {
      case 'formulario':
        return `/panel/mensajes/formularios?id=${entidadId}`;
      case 'cotizacion':
        return `/panel/ventas/cotizaciones/${entidadId}`;
      case 'alquiler':
        return `/panel/soportes/alquileres?id=${entidadId}`;
      case 'mantenimiento':
        return `/panel/soportes/mantenimiento?id=${entidadId}`;
      case 'solicitud':
        return `/panel/ventas/solicitudes/${entidadId}`;
      case 'soporte':
        return `/panel/soportes/gestion/${entidadId}`;
      case 'producto':
        return `/panel/inventario?id=${entidadId}`;
      case 'factura':
        return `/panel/contabilidad/facturas/${entidadId}`;
      case 'evento':
        return `/panel/calendario?evento=${entidadId}`;
      default:
        // Si no hay mapeo, ir a la página de notificaciones en vez de catchall
        return `/panel/mensajes`;
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    // Marcar como leída si no lo está (pero no bloquear navegación)
    if (!notification.leida) {
    markNotificationAsRead(notification)
    }
    
    // Construir URL desde entidad_tipo y entidad_id (si no viene en notification.url)
    const url = notification.url || getNotificationUrl(notification.entidad_tipo, notification.entidad_id)
    if (url) {
      router.push(url)
    }
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

  const getNotificationIcon = (entidadTipo?: string) => {
    if (entidadTipo === "formulario" || entidadTipo === "mensaje") {
      return <Mail className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
    }
    return <FileText className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
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
    
    // Caso especial para mensajes: /panel/mensajes solo debe estar activo si es exactamente esa ruta
    // No debe activarse cuando estás en /panel/mensajes/formularios o /panel/mensajes/[id]
    if (href === "/panel/mensajes") {
      return pathname === "/panel/mensajes" && !pathname.startsWith("/panel/mensajes/")
    }
    
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
                  {moduleConfig.navItems
                    .filter((item) => {
                      // Filtrar según permisos técnicos
                      if (item.href === "/panel/soportes/informes" && !tieneFuncionTecnica("ver informes soportes")) {
                        return false;
                      }
                      if (item.href === "/panel/soportes/mantenimiento" && !tieneFuncionTecnica("ver mantenimiento soportes")) {
                        return false;
                      }
                      if (item.href === "/panel/soportes/costes" && !tieneFuncionTecnica("ver costes soportes")) {
                        return false;
                      }
                      if (item.href === "/panel/ventas/solicitudes" && !tieneFuncionTecnica("ver solicitudes cotizacion")) {
                        return false;
                      }
                      return true;
                    })
                    .map((item) => (
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
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative"
              >
                <Bell className="h-5 w-5" />
                {sistemaNotificacionesCount > 0 && (
                  <Badge
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-[#D54644] hover:bg-[#D54644]"
                  >
                    {sistemaNotificacionesCount > 9 ? "9+" : sistemaNotificacionesCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto" onCloseAutoFocus={(e) => e.preventDefault()}>
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notificaciones</span>
                {sistemaNotificacionesCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {sistemaNotificacionesCount}
                  </Badge>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/panel/mensajes" className="cursor-pointer">
                  Ver todas las notificaciones
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {loadingNotifications ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  Cargando...
                </div>
              ) : (notifications.length === 0 && sistemaNotificacionesCount === 0) ? (
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
                      {getNotificationIcon(notification.entidad_tipo)}
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
                          {formatDate(notification.created_at)}
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
                  <Button 
                    variant="ghost" 
                    className="flex items-center gap-2 h-auto p-2 hover:bg-gray-100"
                    onClick={(e) => e.preventDefault()}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={getUserImage() || ""} alt={getUserName()} />
                      <AvatarFallback className="bg-[#D54644] text-white text-sm font-medium">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium text-gray-800">
                        {getUserName()}
                      </span>
                      {user.role && (
                        <Badge className="bg-red-100 text-red-800 text-[10px] px-1.5 py-0 mt-0.5 h-4 rounded-full">
                          {user.role.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56" onCloseAutoFocus={(e) => e.preventDefault()}>
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{getUserName()}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      {user.role && (
                        <Badge className="bg-red-100 text-red-800 text-[10px] px-2 py-0.5 w-fit mt-1 rounded-full">
                          {user.role.toUpperCase()}
                        </Badge>
                      )}
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
