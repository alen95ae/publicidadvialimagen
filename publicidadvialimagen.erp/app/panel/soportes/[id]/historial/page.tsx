"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft, 
  FolderClock, 
  HandCoins, 
  Clock, 
  Wrench, 
  Pencil, 
  ImagePlus, 
  Shuffle,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/fetcher"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface HistorialEvento {
  id: string
  soporte_id: number
  tipo_evento: string
  descripcion: string
  fecha: string
  realizado_por: string | null
  usuario_nombre?: string
  datos: Record<string, any> | null
  created_at: string
}

interface SoporteInfo {
  id: string
  code: string
  title: string
}

// Mapeo de iconos por tipo de evento
const getEventIcon = (tipo: string) => {
  switch (tipo) {
    case 'ALQUILER':
      return <HandCoins className="w-5 h-5 text-green-600" />
    case 'RESERVA':
      return <Clock className="w-5 h-5 text-yellow-600" />
    case 'MANTENIMIENTO':
      return <Wrench className="w-5 h-5 text-blue-600" />
    case 'EDICION':
      return <Pencil className="w-5 h-5 text-purple-600" />
    case 'FOTO_SUBIDA':
      return <ImagePlus className="w-5 h-5 text-pink-600" />
    case 'CAMBIO_ESTADO':
      return <Shuffle className="w-5 h-5 text-orange-600" />
    case 'CREACION':
      return <Plus className="w-5 h-5 text-green-600" />
    case 'ELIMINACION':
      return <Trash2 className="w-5 h-5 text-red-600" />
    default:
      return <FolderClock className="w-5 h-5 text-gray-600" />
  }
}

// Mapeo de colores de badge por tipo
const getEventBadgeColor = (tipo: string) => {
  switch (tipo) {
    case 'ALQUILER':
      return 'bg-green-100 text-green-800 border-green-300'
    case 'RESERVA':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    case 'MANTENIMIENTO':
      return 'bg-blue-100 text-blue-800 border-blue-300'
    case 'EDICION':
      return 'bg-purple-100 text-purple-800 border-purple-300'
    case 'FOTO_SUBIDA':
      return 'bg-pink-100 text-pink-800 border-pink-300'
    case 'CAMBIO_ESTADO':
      return 'bg-orange-100 text-orange-800 border-orange-300'
    case 'CREACION':
      return 'bg-green-100 text-green-800 border-green-300'
    case 'ELIMINACION':
      return 'bg-red-100 text-red-800 border-red-300'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300'
  }
}

// Formatear datos del evento para mostrar
const formatEventData = (datos: Record<string, any> | null): string[] => {
  if (!datos) return []
  
  const formatted: string[] = []
  
  if (datos.precio) {
    formatted.push(`Precio: ${datos.precio.toLocaleString('es-ES')} Bs`)
  }
  if (datos.fecha_inicio) {
    formatted.push(`Fecha inicio: ${format(new Date(datos.fecha_inicio), 'dd/MM/yyyy', { locale: es })}`)
  }
  if (datos.fecha_fin) {
    formatted.push(`Fecha fin: ${format(new Date(datos.fecha_fin), 'dd/MM/yyyy', { locale: es })}`)
  }
  if (datos.estado_anterior) {
    formatted.push(`Estado anterior: ${datos.estado_anterior}`)
  }
  if (datos.estado_nuevo) {
    formatted.push(`Estado nuevo: ${datos.estado_nuevo}`)
  }
  if (datos.campo_modificado) {
    formatted.push(`Campo modificado: ${datos.campo_modificado}`)
  }
  if (datos.valor_anterior) {
    formatted.push(`Valor anterior: ${datos.valor_anterior}`)
  }
  if (datos.valor_nuevo) {
    formatted.push(`Valor nuevo: ${datos.valor_nuevo}`)
  }
  
  return formatted
}

export default function HistorialSoportePage() {
  const router = useRouter()
  const params = useParams()
  const soporteId = params.id as string
  
  const [historial, setHistorial] = useState<HistorialEvento[]>([])
  const [soporteInfo, setSoporteInfo] = useState<SoporteInfo | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    if (soporteId) {
      fetchHistorial()
      fetchSoporteInfo()
    }
  }, [soporteId])
  
  const fetchHistorial = async () => {
    try {
      setLoading(true)
      const response = await api(`/api/soportes/${soporteId}/historial`)
      
      if (response.ok) {
        const result = await response.json()
        setHistorial(result.data || [])
      } else {
        toast.error('Error al cargar el historial')
        setHistorial([])
      }
    } catch (error) {
      console.error('Error fetching historial:', error)
      toast.error('Error de conexión')
      setHistorial([])
    } finally {
      setLoading(false)
    }
  }
  
  const fetchSoporteInfo = async () => {
    try {
      const response = await api(`/api/soportes/${soporteId}`)
      if (response.ok) {
        const data = await response.json()
        setSoporteInfo({
          id: data.id,
          code: data.code || '',
          title: data.title || '',
        })
      }
    } catch (error) {
      console.error('Error fetching soporte info:', error)
    }
  }
  
  // Agrupar eventos por día
  const eventosPorDia = historial.reduce((acc, evento) => {
    const fecha = format(new Date(evento.fecha), 'yyyy-MM-dd', { locale: es })
    if (!acc[fecha]) {
      acc[fecha] = []
    }
    acc[fecha].push(evento)
    return acc
  }, {} as Record<string, HistorialEvento[]>)
  
  const diasOrdenados = Object.keys(eventosPorDia).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  )
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/panel/soportes/${soporteId}`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              Historial del Soporte
            </h1>
            {soporteInfo && (
              <p className="text-gray-600">
                {soporteInfo.code} - {soporteInfo.title}
              </p>
            )}
          </div>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderClock className="w-5 h-5" />
            Eventos del Historial
          </CardTitle>
          <CardDescription>
            Cronología de todas las acciones realizadas sobre este soporte
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : historial.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FolderClock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No hay eventos registrados en el historial</p>
            </div>
          ) : (
            <div className="space-y-8">
              {diasOrdenados.map((dia) => (
                <div key={dia}>
                  <div className="flex items-center gap-3 mb-4">
                    <Separator className="flex-1" />
                    <Badge variant="outline" className="text-sm font-medium">
                      {format(new Date(dia), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                    </Badge>
                    <Separator className="flex-1" />
                  </div>
                  
                  <div className="space-y-4">
                    {eventosPorDia[dia].map((evento, index) => (
                      <div
                        key={evento.id}
                        className="flex gap-4 relative pl-8"
                      >
                        {/* Línea vertical del timeline */}
                        {index < eventosPorDia[dia].length - 1 && (
                          <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-gray-200" />
                        )}
                        
                        {/* Icono del evento */}
                        <div className="relative z-10 flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                            {getEventIcon(evento.tipo_evento)}
                          </div>
                        </div>
                        
                        {/* Contenido del evento */}
                        <div className="flex-1 pb-4">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge 
                                  variant="outline" 
                                  className={getEventBadgeColor(evento.tipo_evento)}
                                >
                                  {evento.tipo_evento.replace('_', ' ')}
                                </Badge>
                                <span className="text-sm text-gray-500">
                                  {format(new Date(evento.fecha), 'HH:mm', { locale: es })}
                                </span>
                              </div>
                              <p className="text-gray-900 font-medium mb-1">
                                {evento.descripcion}
                              </p>
                              {evento.usuario_nombre && (
                                <p className="text-sm text-gray-600">
                                  Por: {evento.usuario_nombre}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {/* Datos adicionales del evento */}
                          {evento.datos && Object.keys(evento.datos).length > 0 && (
                            <div className="mt-2 p-3 bg-gray-50 rounded-md border border-gray-200">
                              <div className="space-y-1">
                                {formatEventData(evento.datos).map((linea, idx) => (
                                  <p key={idx} className="text-sm text-gray-700">
                                    {linea}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

