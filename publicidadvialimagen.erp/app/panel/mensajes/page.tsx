"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Bell, 
  CheckCircle, 
  Info, 
  AlertTriangle, 
  XCircle,
  Trash2,
  ExternalLink,
  RefreshCw
} from "lucide-react"
import { toast } from "sonner"
import { Toaster } from "sonner"
import { useRouter } from "next/navigation"
import { usePermisosContext } from "@/hooks/permisos-provider"

interface Notificacion {
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

const getTipoIcon = (tipo: string) => {
  switch (tipo.toLowerCase()) {
    case 'success':
      return <CheckCircle className="w-5 h-5 text-green-600" />
    case 'warning':
      return <AlertTriangle className="w-5 h-5 text-yellow-600" />
    case 'error':
      return <XCircle className="w-5 h-5 text-red-600" />
    default:
      return <Info className="w-5 h-5 text-blue-600" />
  }
}

const getTipoBadge = (tipo: string) => {
  switch (tipo.toLowerCase()) {
    case 'success':
      return 'bg-green-100 text-green-800'
    case 'warning':
      return 'bg-yellow-100 text-yellow-800'
    case 'error':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-blue-100 text-blue-800'
  }
}

const getPrioridadBadge = (prioridad: string) => {
  switch (prioridad.toLowerCase()) {
    case 'alta':
      return 'bg-red-100 text-red-800 border-red-300'
    case 'media':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    case 'baja':
      return 'bg-gray-100 text-gray-800 border-gray-300'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300'
  }
}

const getNotificationUrl = (entidadTipo?: string | null, entidadId?: string | null): string | null => {
  if (!entidadTipo || !entidadId) return null;
  
  switch (entidadTipo.toLowerCase()) {
    case 'formulario':
      // La página de formularios usa query param para filtrar
      return `/panel/mensajes/formularios?id=${entidadId}`;
    case 'cotizacion':
      // La ruta correcta es /panel/ventas/editar/[id] para ver/editar cotizaciones
      return `/panel/ventas/editar/${entidadId}`;
    case 'alquiler':
      // La página de alquileres usa query param
      return `/panel/soportes/alquileres?id=${entidadId}`;
    case 'mantenimiento':
      // La página de mantenimiento usa query param
      return `/panel/soportes/mantenimiento?id=${entidadId}`;
    case 'solicitud':
      // La ruta correcta es /panel/ventas/solicitudes/[id]
      return `/panel/ventas/solicitudes/${entidadId}`;
    case 'soporte':
      // La ruta correcta es /panel/soportes/[id] para ver un soporte específico
      return `/panel/soportes/${entidadId}`;
    case 'producto':
      // La página de inventario usa query param
      return `/panel/inventario?id=${entidadId}`;
    case 'factura':
      // No existe una página de detalle de factura individual, redirigir a la lista
      return `/panel/contabilidad/facturas/manuales`;
    case 'evento':
      // La página de calendario usa query param
      return `/panel/calendario?evento=${entidadId}`;
    default:
      return null;
  }
}

export default function MensajesPage() {
  const { tieneFuncionTecnica } = usePermisosContext()
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const loadNotificaciones = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/notificaciones', {
        credentials: 'include',
        cache: 'no-store',
        next: { revalidate: 0 }
      })
      
      if (response.ok) {
        const data = await response.json()
        // Log temporal para debugging
        console.log('[Frontend] Notificaciones recibidas:', data)
        // Filtrar notificaciones: formularios y solicitudes solo para usuarios con función técnica
        const notificacionesFiltradas = (Array.isArray(data) ? data : []).filter((n: Notificacion) => {
          // Si es formulario, mensaje o solicitud, verificar función técnica
          if (n.entidad_tipo === "formulario" || n.entidad_tipo === "mensaje" || n.entidad_tipo === "solicitud") {
            return tieneFuncionTecnica("ver solicitudes cotizacion")
          }
          // Otras notificaciones se muestran normalmente
          return true
        })
        setNotificaciones(notificacionesFiltradas)
      } else {
        // Si hay error, establecer array vacío en lugar de mostrar error
        setNotificaciones([])
      }
    } catch (error) {
      // En caso de error, establecer array vacío
      setNotificaciones([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotificaciones()

    // Configurar Realtime después de carga inicial
    const setupRealtime = async () => {
      try {
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
        
        // Suscribirse a cambios
        // Nota: No podemos filtrar por array directamente en Realtime,
        // así que recibimos todos los INSERTs y filtramos en el handler
        const channel = supabase
          .channel(`notificaciones-page:${rolNormalizado}`)
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
              
              // Recargar todas las notificaciones para mantener consistencia
              loadNotificaciones()
            }
          )
          .subscribe()
        
        return () => {
          supabase.removeChannel(channel)
        }
      } catch (error) {
        console.error('[Realtime] Error configurando suscripción:', error)
      }
    }

    setupRealtime()
  }, [tieneFuncionTecnica])

  const marcarComoLeida = async (id: string) => {
    try {
      const response = await fetch(`/api/notificaciones/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        cache: 'no-store'
      })
      
      if (response.ok) {
        setNotificaciones(prev => 
          prev.map(n => n.id === id ? { ...n, leida: true } : n)
        )
        // No mostrar toast para no ser ruidoso
      } else {
        // Solo mostrar error si es un error real (no 404)
        if (response.status !== 404) {
          const errorData = await response.json().catch(() => ({}))
          console.error('Error al marcar como leída:', errorData)
        }
      }
    } catch (error) {
      // Error silencioso - no romper la UI
      console.error('Error marking as read:', error)
    }
  }

  const eliminarNotificacion = async (id: string) => {
    try {
      const response = await fetch(`/api/notificaciones/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        cache: 'no-store'
      })
      
      if (response.ok) {
        setNotificaciones(prev => prev.filter(n => n.id !== id))
        // No mostrar toast para no ser ruidoso
      } else {
        // Solo mostrar error si es un error real (no 404)
        if (response.status !== 404) {
          const errorData = await response.json().catch(() => ({}))
          console.error('Error al eliminar:', errorData)
        }
      }
    } catch (error) {
      // Error silencioso - no romper la UI
      console.error('Error deleting notification:', error)
    }
  }

  const handleNavegar = (notificacion: Notificacion) => {
    // Priorizar getNotificationUrl() sobre notificacion.url para evitar URLs incorrectas almacenadas
    // Solo usar notificacion.url como fallback si getNotificationUrl() no devuelve nada
    const urlGenerada = getNotificationUrl(notificacion.entidad_tipo, notificacion.entidad_id)
    const url = urlGenerada || notificacion.url
    
    if (url) {
      try {
        router.push(url)
        // Marcar como leída después de navegar
        if (!notificacion.leida) {
          marcarComoLeida(notificacion.id)
        }
      } catch (error) {
        console.error('Error navegando a:', url, error)
        toast.error('Error al navegar a la notificación')
      }
    } else {
      toast.warning('No se puede navegar a esta notificación: URL no disponible')
    }
  }

  const notificacionesNoLeidas = notificaciones.filter(n => !n.leida)
  const notificacionesLeidas = notificaciones.filter(n => n.leida)

  return (
    <div className="p-6">
      <main className="w-full max-w-full px-4 sm:px-6 py-8 overflow-hidden">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Notificaciones</h1>
            <p className="text-gray-600">Gestiona tus notificaciones del sistema</p>
          </div>
          <Button
            onClick={loadNotificaciones}
            variant="outline"
            size="sm"
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>

        {/* Notificaciones */}
        <div className="space-y-6">

            {loading ? (
              <Card>
                <CardContent className="py-8">
                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D54644] mx-auto mb-4"></div>
                      <p className="text-gray-600">Cargando notificaciones...</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : notificaciones.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No tienes notificaciones</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Notificaciones no leídas */}
                {notificacionesNoLeidas.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">No leídas ({notificacionesNoLeidas.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {notificacionesNoLeidas.map((notificacion) => (
                          <div
                            key={notificacion.id}
                            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-1">
                                {getTipoIcon(notificacion.tipo)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 mb-1">
                                      {notificacion.titulo}
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-2">
                                      {notificacion.mensaje}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                                      <span>
                                        {new Date(notificacion.created_at).toLocaleString('es-ES')}
                                      </span>
                                      {notificacion.entidad_tipo && (
                                        <>
                                          <span>•</span>
                                          <Badge className={getTipoBadge(notificacion.tipo)}>
                                            {notificacion.entidad_tipo}
                                          </Badge>
                                        </>
                                      )}
                                      <span>•</span>
                                      <Badge variant="outline" className={getPrioridadBadge(notificacion.prioridad)}>
                                        {notificacion.prioridad.toUpperCase()}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    {/* Botón Ver - SIEMPRE activo si hay URL (leída o no) */}
                                    {(notificacion.url || getNotificationUrl(notificacion.entidad_tipo, notificacion.entidad_id)) && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleNavegar(notificacion)}
                                        className="flex items-center gap-1"
                                        title="Ver notificación"
                                      >
                                        <ExternalLink className="w-4 h-4" />
                                        Ver
                                      </Button>
                                    )}
                                    {!notificacion.leida && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => marcarComoLeida(notificacion.id)}
                                        title="Marcar como leída"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                    </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => eliminarNotificacion(notificacion.id)}
                                      className="text-red-600 hover:text-red-700"
                                      title="Eliminar notificación"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Notificaciones leídas */}
                {notificacionesLeidas.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Leídas ({notificacionesLeidas.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {notificacionesLeidas.map((notificacion) => (
                          <div
                            key={notificacion.id}
                            className="p-4 border border-gray-200 rounded-lg bg-gray-50 opacity-75"
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-1 opacity-50">
                                {getTipoIcon(notificacion.tipo)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <h3 className="font-semibold text-gray-700 mb-1">
                                      {notificacion.titulo}
                                    </h3>
                                    <p className="text-sm text-gray-500 mb-2">
                                      {notificacion.mensaje}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                                      <span>
                                        {new Date(notificacion.created_at).toLocaleString('es-ES')}
                                      </span>
                                      {notificacion.entidad_tipo && (
                                        <>
                                          <span>•</span>
                                          <Badge variant="outline" className="opacity-50">
                                            {notificacion.entidad_tipo}
                                          </Badge>
                                        </>
                                      )}
                                      <span>•</span>
                                      <Badge variant="outline" className={`opacity-50 ${getPrioridadBadge(notificacion.prioridad)}`}>
                                        {notificacion.prioridad.toUpperCase()}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    {/* Botón Ver - SIEMPRE activo si hay URL (leída o no) */}
                                    {(notificacion.url || getNotificationUrl(notificacion.entidad_tipo, notificacion.entidad_id)) && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleNavegar(notificacion)}
                                        className="flex items-center gap-1"
                                        title="Ver notificación"
                                      >
                                        <ExternalLink className="w-4 h-4" />
                                        Ver
                                      </Button>
                                    )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => eliminarNotificacion(notificacion.id)}
                                    className="text-red-600 hover:text-red-700"
                                      title="Eliminar notificación"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

              </>
            )}
        </div>
      </main>
      <Toaster />
    </div>
  )
}
