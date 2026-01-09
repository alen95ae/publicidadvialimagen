"use client"

import { useEffect, useState, useRef, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, ChevronRight } from "lucide-react"
import Link from "next/link"
import { usePermisosContext } from "@/hooks/permisos-provider"
import { normalizarAccion } from "@/lib/permisos-utils"

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

export default function PanelNotifications() {
  const { permisos, loading: permisosLoading } = usePermisosContext()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const fetchingRef = useRef(false)
  const channelRef = useRef<any>(null)
  const initializedRef = useRef(false)

  // Memoizar el resultado de la verificación de permisos para evitar re-renders
  // Usar el objeto permisos directamente en lugar de la función para evitar bucles
  const puedeVerSolicitudes = useMemo(() => {
    if (permisosLoading) return false
    const permisosTecnico = permisos["tecnico"]
    if (!permisosTecnico) return false
    // Normalizar la acción igual que en el hook
    const accionNormalizada = normalizarAccion("ver solicitudes cotizacion")
    return permisosTecnico[accionNormalizada] === true
  }, [permisos, permisosLoading])

  useEffect(() => {
    // Esperar a que los permisos terminen de cargar antes de inicializar
    if (permisosLoading) {
      return
    }

    // Prevenir múltiples ejecuciones simultáneas o si ya se inicializó
    if (fetchingRef.current || initializedRef.current) {
      return
    }

    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notificaciones', {
          cache: 'no-store',
          credentials: 'include'
        })
        if (res.ok) {
          const data = await res.json()
          // Filtrar solo las no leídas y por permisos
          const unreadNotifications = (Array.isArray(data) ? data : []).filter(
            (n: Notification) => {
              // Solo no leídas
              if (n.leida) return false
              // Formularios y solicitudes solo para usuarios con función técnica
              if (n.entidad_tipo === "formulario" || n.entidad_tipo === "mensaje" || n.entidad_tipo === "solicitud") {
                return puedeVerSolicitudes
              }
              // Otras notificaciones se muestran normalmente
              return true
            }
          )
          setNotifications(unreadNotifications)
        }
      } catch (error) {
        console.error('Error fetching notifications:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchingRef.current = true
    fetchNotifications()

    // Configurar Realtime después de carga inicial
    const setupRealtime = async () => {
      try {
        // Limpiar canal anterior si existe
        if (channelRef.current) {
          const { getSupabaseBrowserClient } = await import('@/lib/supabase/client')
          const supabase = getSupabaseBrowserClient()
          supabase.removeChannel(channelRef.current)
          channelRef.current = null
        }

        // Obtener usuario para saber su rol
        const userRes = await fetch('/api/auth/me', {
          credentials: 'include'
        })
        if (!userRes.ok) return
        
        const userData = await userRes.json()
        const userRol = userData.user?.role || userData.user?.rol
        if (!userRol) return

        const rolNormalizado = userRol.toLowerCase()
        
        // Usar el cliente Supabase singleton del browser
        const { getSupabaseBrowserClient } = await import('@/lib/supabase/client')
        
        const supabase = getSupabaseBrowserClient()
        
        // Guardar el valor de puedeVerSolicitudes en el closure
        const puedeVer = puedeVerSolicitudes
        
        // Suscribirse a cambios
        // Nota: No podemos filtrar por array directamente en Realtime,
        // así que recibimos todos los INSERTs y filtramos en el handler
        const channel = supabase
          .channel(`notificaciones-widget:${rolNormalizado}`)
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
              
              const notification = newNotification as Notification
              
              // Filtrar formularios y solicitudes: solo para usuarios con función técnica
              if ((notification.entidad_tipo === "formulario" || notification.entidad_tipo === "mensaje" || notification.entidad_tipo === "solicitud") && !puedeVer) {
                return // No tiene permiso, ignorar
              }
              
              setNotifications((prev) => {
                const exists = prev.some(n => n.id === notification.id)
                if (exists) return prev
                // Solo añadir si no está leída
                if (notification.leida) return prev
                return [notification, ...prev]
              })
            }
          )
          .subscribe()
        
        channelRef.current = channel
        initializedRef.current = true
      } catch (error) {
        console.error('[Realtime] Error configurando suscripción:', error)
      } finally {
        fetchingRef.current = false
      }
    }

    setupRealtime()

    // Cleanup: remover canal al desmontar
    return () => {
      if (channelRef.current) {
        import('@/lib/supabase/client').then(({ getSupabaseBrowserClient }) => {
          const supabase = getSupabaseBrowserClient()
          supabase.removeChannel(channelRef.current)
          channelRef.current = null
        })
      }
      initializedRef.current = false
    }
  }, [puedeVerSolicitudes, permisosLoading])

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
      
      return date.toLocaleDateString('es-BO', { 
        day: 'numeric', 
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Bell className="mr-2 h-5 w-5" />
          Notificaciones
        </CardTitle>
        <CardDescription>
          Mensajes y solicitudes recientes
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-gray-500">Cargando...</div>
        ) : notifications.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-8">
            No hay notificaciones
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.slice(0, 5).map((notif) => {
              const getUrl = () => {
                // Usar url si existe, sino construir desde entidad_tipo y entidad_id
                if (notif.url) return notif.url;
                if (!notif.entidad_tipo || !notif.entidad_id) return '#';
                switch (notif.entidad_tipo.toLowerCase()) {
                  case 'formulario': return `/panel/mensajes/formularios?id=${notif.entidad_id}`;
                  case 'cotizacion': return `/panel/ventas/cotizaciones/${notif.entidad_id}`;
                  case 'alquiler': return `/panel/soportes/alquileres?id=${notif.entidad_id}`;
                  case 'mantenimiento': return `/panel/soportes/mantenimiento?id=${notif.entidad_id}`;
                  case 'solicitud': return `/panel/ventas/solicitudes/${notif.entidad_id}`;
                  case 'soporte': return `/panel/soportes/gestion/${notif.entidad_id}`;
                  case 'producto': return `/panel/inventario?id=${notif.entidad_id}`;
                  case 'factura': return `/panel/contabilidad/facturas/${notif.entidad_id}`;
                  case 'evento': return `/panel/calendario?evento=${notif.entidad_id}`;
                  default: return '#';
                }
              };
              return (
              <Link
                key={notif.id}
                  href={getUrl()}
                className="flex items-start justify-between pb-3 border-b hover:bg-gray-50 p-2 rounded transition-colors"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">{notif.titulo}</p>
                  {notif.mensaje && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {notif.mensaje}
                    </p>
                  )}
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                    {formatDate(notif.created_at)}
                </span>
              </Link>
              );
            })}
            {notifications.length > 5 && (
              <Link 
                href="/panel/mensajes"
                className="flex items-center justify-center text-sm text-red-600 hover:text-red-700 font-medium pt-2"
              >
                Ver todas las notificaciones
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

