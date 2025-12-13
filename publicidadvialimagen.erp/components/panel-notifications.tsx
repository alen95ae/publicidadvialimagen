"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, ChevronRight } from "lucide-react"
import Link from "next/link"

interface Notification {
  id: string
  type: "mensaje" | "solicitud"
  titulo: string
  mensaje: string
  fecha: string
  link: string
}

export default function PanelNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications', {
          cache: 'no-store',
          credentials: 'include'
        })
        if (res.ok) {
          const data = await res.json()
          setNotifications(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        console.error('Error fetching notifications:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [])

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
            {notifications.slice(0, 5).map((notif) => (
              <Link
                key={notif.id}
                href={notif.link}
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
                  {formatDate(notif.fecha)}
                </span>
              </Link>
            ))}
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

