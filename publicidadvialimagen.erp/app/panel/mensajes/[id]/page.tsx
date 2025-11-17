"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  MessageSquare, 
  ArrowLeft,
  Calendar,
  User,
  Building,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Tipos para los mensajes y respuestas
interface Message {
  id: string
  nombre: string
  email: string
  telefono: string
  empresa: string
  mensaje: string
  fecha_recepcion: string
  estado: "NUEVO" | "LEÍDO" | "CONTESTADO"
}

interface Respuesta {
  id: string
  mensaje_id: string
  respuesta: string
  fecha_respuesta: string
  admin_responsable: string
}

// Función para cargar mensaje desde la API
const loadMensaje = async (id: string): Promise<Message | null> => {
  try {
    const response = await fetch(`/api/messages/${id}`, {
      cache: 'no-store',
      next: { revalidate: 0 }
    })
    if (!response.ok) return null
    
    const data = await response.json()
    return {
      id: data.id,
      nombre: data.nombre || "",
      email: data.email || "",
      telefono: data.telefono || "",
      empresa: data.empresa || "",
      mensaje: data.mensaje || "",
      fecha_recepcion: data.fecha_recepcion || "",
      estado: data.estado || "NUEVO"
    }
  } catch (error) {
    console.error('Error loading message:', error)
    return null
  }
}

const getEstadoColor = (estado: string) => {
  switch (estado) {
    case "CONTESTADO":
      return "bg-green-100 text-green-800"
    case "LEÍDO":
      return "bg-blue-100 text-blue-800"
    case "NUEVO":
      return "bg-yellow-100 text-yellow-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getEstadoIcon = (estado: string) => {
  switch (estado) {
    case "CONTESTADO":
      return <CheckCircle className="w-4 h-4" />
    case "LEÍDO":
      return <Clock className="w-4 h-4" />
    case "NUEVO":
      return <AlertCircle className="w-4 h-4" />
    default:
      return <AlertCircle className="w-4 h-4" />
  }
}

export default function MensajeDetailPage() {
  const params = useParams()
  const [mensajeData, setMensajeData] = useState<Message | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isActualizando, setIsActualizando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar mensaje al montar el componente
  useEffect(() => {
    const loadData = async () => {
      if (params.id) {
        setIsLoading(true)
        setError(null)
        
        const mensaje = await loadMensaje(params.id as string)
        if (mensaje) {
          setMensajeData(mensaje)
        } else {
          setError('No se pudo cargar el mensaje')
        }
        
        setIsLoading(false)
      }
    }
    
    loadData()
  }, [params.id])

  // Función para recargar el mensaje
  const reloadMensaje = async () => {
    if (params.id) {
      setIsLoading(true)
      setError(null)
      
      const mensaje = await loadMensaje(params.id as string)
      if (mensaje) {
        setMensajeData(mensaje)
      } else {
        setError('No se pudo cargar el mensaje')
      }
      
      setIsLoading(false)
    }
  }

  const handleCambiarEstado = async (nuevoEstado: string) => {
    if (!mensajeData) return
    
    setIsActualizando(true)
    
    try {
      console.log('🔄 [Frontend] Cambiando estado a:', nuevoEstado, 'para mensaje:', mensajeData.id);
      
      const response = await fetch(`/api/messages/${mensajeData.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ estado: nuevoEstado }),
        cache: 'no-store'
      })
      
      console.log('📡 [Frontend] Response status:', response.status);
      console.log('📡 [Frontend] Response ok:', response.ok);
      
      if (response.ok) {
        const responseData = await response.json()
        console.log('✅ [Frontend] Estado actualizado correctamente:', responseData);
        // Recargar el mensaje desde Supabase para obtener datos actualizados
        await reloadMensaje()
      } else {
        let errorData;
        try {
          errorData = await response.json()
        } catch (e) {
          errorData = { error: `Error ${response.status}: ${response.statusText}` }
        }
        console.error('❌ [Frontend] Error updating status - Status:', response.status);
        console.error('❌ [Frontend] Error updating status - Data:', errorData);
        alert(`Error al actualizar el estado: ${errorData.error || errorData.details || 'Error desconocido'}`)
      }
    } catch (error) {
      console.error('❌ [Frontend] Excepción al actualizar estado:', error);
      console.error('❌ [Frontend] Error type:', typeof error);
      console.error('❌ [Frontend] Error message:', error instanceof Error ? error.message : String(error));
      console.error('❌ [Frontend] Error stack:', error instanceof Error ? error.stack : 'No stack');
      alert(`Error de conexión al actualizar el estado: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsActualizando(false)
    }
  }

  // Mostrar loading
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D54644] mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando mensaje...</p>
          </div>
        </div>
      </div>
    )
  }

  // Mostrar error
  if (error || !mensajeData) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error || 'No se pudo cargar el mensaje'}</p>
            <Link href="/panel/mensajes">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Mensajes
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Main Content */}
      <main className="w-full max-w-full px-4 sm:px-6 py-8 overflow-hidden">
        <div className="max-w-4xl mx-auto">
          {/* Botón Volver */}
          <div className="mb-4 flex justify-end">
            <Link href="/panel/mensajes">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Mensajes
              </Button>
            </Link>
          </div>
          {/* Mensaje Original */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Mensaje #{mensajeData.id}
                  </CardTitle>
                  <CardDescription>
                    Recibido el {new Date(mensajeData.fecha_recepcion).toLocaleString('es-ES')}
                  </CardDescription>
                </div>
                <Badge className={`${getEstadoColor(mensajeData.estado)} flex items-center gap-1`}>
                  {getEstadoIcon(mensajeData.estado)}
                  {mensajeData.estado.replace('_', ' ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Información del Cliente */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">Nombre:</span>
                    <span>{mensajeData.nombre}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">Email:</span>
                    <span>{mensajeData.email}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">Teléfono:</span>
                    <span>{mensajeData.telefono}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">Empresa:</span>
                    <span>{mensajeData.empresa}</span>
                  </div>
                </div>
              </div>

              {/* Mensaje */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Mensaje:</h4>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {new Date(mensajeData.fecha_recepcion).toLocaleString('es-ES')}
                    </span>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{mensajeData.mensaje}</p>
                </div>
                
                {/* Selector de Estado */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-600">Estado:</span>
                  <Select 
                    value={mensajeData.estado} 
                    onValueChange={handleCambiarEstado}
                    disabled={isActualizando}
                  >
                    <SelectTrigger className="w-48">
                      <div className="flex items-center gap-2">
                        {getEstadoIcon(mensajeData.estado)}
                        <span>{mensajeData.estado}</span>
                        <ChevronDown className="w-4 h-4 ml-auto" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NUEVO">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-yellow-600" />
                          <span>NUEVO</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="LEÍDO">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <span>LEÍDO</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="CONTESTADO">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>CONTESTADO</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {isActualizando && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>Actualizando...</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  )
}
