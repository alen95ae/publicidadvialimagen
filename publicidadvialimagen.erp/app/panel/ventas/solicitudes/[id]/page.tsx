"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Handshake, 
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
  ChevronDown,
  Monitor,
  FileText,
  Settings
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Sidebar from "@/components/sidebar"

// Tipos para las solicitudes de cotización
interface Solicitud {
  id: string
  codigo: string
  fechaCreacion: string
  empresa: string
  contacto: string
  telefono: string
  email: string
  comentarios: string
  estado: "Nueva" | "Pendiente" | "Cotizada"
  fechaInicio: string
  mesesAlquiler: number
  soporte: string
  serviciosAdicionales: string[]
}

// Función para cargar solicitud desde la API
const loadSolicitud = async (id: string): Promise<Solicitud | null> => {
  try {
    const response = await fetch(`/api/solicitudes/${id}`)
    if (response.ok) {
      const solicitud = await response.json()
      return solicitud
    } else {
      console.error('Error loading solicitud:', await response.text())
      return null
    }
  } catch (error) {
    console.error('Error loading solicitud:', error)
    return null
  }
}

const getEstadoColor = (estado: string) => {
  switch (estado) {
    case "Cotizada":
      return "bg-green-100 text-green-800"
    case "Nueva":
      return "bg-blue-100 text-blue-800"
    case "Pendiente":
      return "bg-yellow-100 text-yellow-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getEstadoIcon = (estado: string) => {
  switch (estado) {
    case "Cotizada":
      return <CheckCircle className="w-4 h-4" />
    case "Nueva":
      return <AlertCircle className="w-4 h-4" />
    case "Pendiente":
      return <Clock className="w-4 h-4" />
    default:
      return <AlertCircle className="w-4 h-4" />
  }
}

export default function SolicitudDetailPage() {
  const params = useParams()
  const [solicitudData, setSolicitudData] = useState<Solicitud | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isActualizando, setIsActualizando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar solicitud al montar el componente
  useEffect(() => {
    const loadData = async () => {
      if (params.id) {
        setIsLoading(true)
        setError(null)
        
        const solicitud = await loadSolicitud(params.id as string)
        if (solicitud) {
          setSolicitudData(solicitud)
        } else {
          setError('No se pudo cargar la solicitud')
        }
        
        setIsLoading(false)
      }
    }
    
    loadData()
  }, [params.id])

  const handleCambiarEstado = async (nuevoEstado: string) => {
    if (!solicitudData) return
    
    setIsActualizando(true)
    
    try {
      const response = await fetch(`/api/solicitudes/${solicitudData.codigo}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          estado: nuevoEstado
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        setSolicitudData({ ...solicitudData, estado: nuevoEstado as "Nueva" | "Pendiente" | "Cotizada" })
        console.log('Estado actualizado exitosamente:', result)
      } else {
        const errorData = await response.json()
        console.error('Error actualizando estado:', errorData)
        alert('Error al actualizar el estado')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Error al actualizar el estado')
    } finally {
      setIsActualizando(false)
    }
  }

  // Mostrar loading
  if (isLoading) {
    return (
      <Sidebar>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D54644] mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando solicitud...</p>
          </div>
        </div>
      </Sidebar>
    )
  }

  // Mostrar error
  if (error || !solicitudData) {
    return (
      <Sidebar>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error || 'No se pudo cargar la solicitud'}</p>
            <Link href="/panel/ventas/solicitudes">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Solicitudes
              </Button>
            </Link>
          </div>
        </div>
      </Sidebar>
    )
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
            <div className="text-xl font-bold text-slate-800">Ventas</div>
            <div className="flex items-center gap-6 ml-4">
              <Link 
                href="/panel/ventas/cotizaciones" 
                className="text-sm font-medium text-gray-600 hover:text-[#D54644] transition-colors"
              >
                Cotizaciones
              </Link>
              <Link 
                href="/panel/ventas/solicitudes" 
                className="text-sm font-medium text-[#D54644] hover:text-[#D54644]/80 transition-colors"
              >
                Solicitudes de cotización
              </Link>
              <Link 
                href="/panel/ventas/crm" 
                className="text-sm font-medium text-gray-600 hover:text-[#D54644] transition-colors"
              >
                CRM
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/panel/ventas/solicitudes">
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
          {/* Solicitud Original */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Handshake className="w-5 h-5" />
                    Solicitud {solicitudData.codigo}
                  </CardTitle>
                  <CardDescription>
                    Creada el {solicitudData.fechaCreacion}
                  </CardDescription>
                </div>
                <Badge className={`${getEstadoColor(solicitudData.estado)} flex items-center gap-1`}>
                  {getEstadoIcon(solicitudData.estado)}
                  {solicitudData.estado}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Información del Cliente */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">Empresa:</span>
                    <span>{solicitudData.empresa}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">Contacto:</span>
                    <span>{solicitudData.contacto}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">Teléfono:</span>
                    <span>{solicitudData.telefono}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">Email:</span>
                    <span>{solicitudData.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">Soporte:</span>
                    <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-1 font-mono text-xs text-gray-800 border border-neutral-200">
                      {solicitudData.soporte}
                    </span>
                  </div>
                </div>
              </div>

              {/* Detalles de la Solicitud */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">Fecha Inicio:</span>
                    <span>{solicitudData.fechaInicio}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">Meses de Alquiler:</span>
                    <span>{solicitudData.mesesAlquiler} meses</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">Fecha Creación:</span>
                    <span>{solicitudData.fechaCreacion}</span>
                  </div>
                </div>
              </div>

              {/* Servicios Adicionales */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Settings className="w-4 h-4 text-gray-400" />
                  <h4 className="font-medium">Servicios Adicionales:</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {solicitudData.serviciosAdicionales.length > 0 ? (
                    solicitudData.serviciosAdicionales.map((servicio, index) => (
                      <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                        {servicio}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-gray-500 italic">No se han seleccionado servicios adicionales</span>
                  )}
                </div>
              </div>

              {/* Comentarios */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Comentarios:</h4>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {solicitudData.fechaCreacion}
                    </span>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{solicitudData.comentarios}</p>
                </div>
                
                {/* Selector de Estado */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-600">Estado:</span>
                  <Select 
                    value={solicitudData.estado} 
                    onValueChange={handleCambiarEstado}
                    disabled={isActualizando}
                  >
                    <SelectTrigger className="w-48">
                      <div className="flex items-center gap-2">
                        {getEstadoIcon(solicitudData.estado)}
                        <span>{solicitudData.estado}</span>
                        <ChevronDown className="w-4 h-4 ml-auto" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Nueva">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-blue-600" />
                          <span>Nueva</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Pendiente">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-yellow-600" />
                          <span>Pendiente</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Cotizada">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>Cotizada</span>
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
    </Sidebar>
  )
}
