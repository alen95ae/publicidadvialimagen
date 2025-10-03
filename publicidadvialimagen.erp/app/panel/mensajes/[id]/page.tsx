"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
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
  Home,
  Send,
  Reply
} from "lucide-react"
import Sidebar from "@/components/sidebar"

// Tipos para los mensajes y respuestas
interface Message {
  id: string
  nombre: string
  email: string
  telefono: string
  empresa: string
  mensaje: string
  fecha_recepcion: string
  estado: "NUEVO" | "EN_PROCESO" | "CONTESTADO"
  origen: "contacto" | "home"
}

interface Respuesta {
  id: string
  mensaje_id: string
  respuesta: string
  fecha_respuesta: string
  admin_responsable: string
}

// Datos de ejemplo
const mensaje: Message = {
  id: "MSG-001",
  nombre: "Juan Pérez",
  email: "juan.perez@empresa.com",
  telefono: "+591 2 1234567",
  empresa: "Empresa ABC S.A.",
  mensaje: "Buenos días, necesito información sobre vallas publicitarias en La Paz. Estoy interesado en espacios con alto tráfico vehicular. ¿Podrían enviarme una cotización con los precios y ubicaciones disponibles? También me gustaría conocer los tiempos de instalación y los materiales que utilizan. Gracias por su atención.",
  fecha_recepcion: "2024-01-15T10:30:00Z",
  estado: "EN_PROCESO",
  origen: "contacto"
}

const respuestas: Respuesta[] = [
  {
    id: "RESP-001",
    mensaje_id: "MSG-001",
    respuesta: "Estimado Juan, gracias por contactarnos. Le hemos enviado por email nuestra propuesta comercial con los espacios disponibles en La Paz. Nuestro equipo comercial se pondrá en contacto con usted en las próximas 24 horas para coordinar una reunión.",
    fecha_respuesta: "2024-01-15T14:30:00Z",
    admin_responsable: "admin@publicidadvialimagen.com"
  }
]

const getEstadoColor = (estado: string) => {
  switch (estado) {
    case "CONTESTADO":
      return "bg-green-100 text-green-800"
    case "EN_PROCESO":
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
    case "EN_PROCESO":
      return <Clock className="w-4 h-4" />
    case "NUEVO":
      return <AlertCircle className="w-4 h-4" />
    default:
      return <AlertCircle className="w-4 h-4" />
  }
}

export default function MensajeDetailPage() {
  const params = useParams()
  const [nuevaRespuesta, setNuevaRespuesta] = useState("")
  const [isEnviando, setIsEnviando] = useState(false)

  const handleEnviarRespuesta = async () => {
    if (!nuevaRespuesta.trim()) return

    setIsEnviando(true)
    
    // Simular envío
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Aquí se guardaría en Supabase
    console.log("Guardando respuesta:", nuevaRespuesta)
    
    setNuevaRespuesta("")
    setIsEnviando(false)
  }

  return (
    <Sidebar>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/panel" 
              className="bg-[#D54644] hover:bg-[#D54644]/90 text-white p-2 rounded-lg transition-colors"
              title="Ir al panel principal"
            >
              <Home className="w-5 h-5" />
            </Link>
            <div className="text-xl font-bold text-slate-800">Mensajes</div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/panel/mensajes">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
            <span className="text-gray-800 font-medium">admin</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-full px-4 sm:px-6 py-8 overflow-hidden">
        <div className="max-w-4xl mx-auto">
          {/* Mensaje Original */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Mensaje #{mensaje.id}
                  </CardTitle>
                  <CardDescription>
                    Recibido el {new Date(mensaje.fecha_recepcion).toLocaleString('es-ES')}
                  </CardDescription>
                </div>
                <Badge className={`${getEstadoColor(mensaje.estado)} flex items-center gap-1`}>
                  {getEstadoIcon(mensaje.estado)}
                  {mensaje.estado.replace('_', ' ')}
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
                    <span>{mensaje.nombre}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">Email:</span>
                    <span>{mensaje.email}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">Teléfono:</span>
                    <span>{mensaje.telefono}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">Empresa:</span>
                    <span>{mensaje.empresa}</span>
                  </div>
                </div>
              </div>

              {/* Mensaje */}
              <div>
                <h4 className="font-medium mb-2">Mensaje:</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-wrap">{mensaje.mensaje}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Historial de Respuestas */}
          {respuestas.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Historial de Respuestas</CardTitle>
                <CardDescription>
                  {respuestas.length} respuesta{respuestas.length !== 1 ? 's' : ''} enviada{respuestas.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {respuestas.map((respuesta) => (
                    <div key={respuesta.id} className="border-l-4 border-blue-500 pl-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-600">
                          {respuesta.admin_responsable}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(respuesta.fecha_respuesta).toLocaleString('es-ES')}
                        </span>
                      </div>
                      <p className="text-gray-700 bg-blue-50 p-3 rounded-lg">
                        {respuesta.respuesta}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Formulario de Respuesta */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Reply className="w-5 h-5" />
                Responder
              </CardTitle>
              <CardDescription>
                Escribe tu respuesta al cliente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="Escribe tu respuesta aquí..."
                  value={nuevaRespuesta}
                  onChange={(e) => setNuevaRespuesta(e.target.value)}
                  className="min-h-[120px]"
                  maxLength={1000}
                />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {nuevaRespuesta.length}/1000 caracteres
                  </span>
                  <Button 
                    onClick={handleEnviarRespuesta}
                    disabled={!nuevaRespuesta.trim() || isEnviando}
                    className="bg-[#D54644] hover:bg-[#B03A38] text-white"
                  >
                    {isEnviando ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Enviar Respuesta
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </Sidebar>
  )
}
