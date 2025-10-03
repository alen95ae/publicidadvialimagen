"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  MoreHorizontal,
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
  Eye,
  Reply
} from "lucide-react"
import Sidebar from "@/components/sidebar"

// Tipos para los mensajes
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

// Datos de ejemplo para los mensajes
const mensajes: Message[] = [
  {
    id: "MSG-001",
    nombre: "Juan Pérez",
    email: "juan.perez@empresa.com",
    telefono: "+591 2 1234567",
    empresa: "Empresa ABC S.A.",
    mensaje: "Necesito información sobre vallas publicitarias en La Paz. ¿Podrían enviarme una cotización?",
    fecha_recepcion: "2024-01-15T10:30:00Z",
    estado: "NUEVO",
    origen: "contacto"
  },
  {
    id: "MSG-002",
    nombre: "María García",
    email: "maria.garcia@comercial.com",
    telefono: "+591 2 2345678",
    empresa: "Comercial XYZ Ltda.",
    mensaje: "Estoy interesada en pantallas digitales para mi negocio. ¿Cuáles son las opciones disponibles?",
    fecha_recepcion: "2024-01-14T15:45:00Z",
    estado: "EN_PROCESO",
    origen: "home"
  },
  {
    id: "MSG-003",
    nombre: "Carlos López",
    email: "carlos.lopez@industrias.com",
    telefono: "+591 2 3456789",
    empresa: "Industrias DEF S.A.S.",
    mensaje: "Necesitamos publicidad para nuestro nuevo producto. ¿Tienen espacios disponibles en Santa Cruz?",
    fecha_recepcion: "2024-01-13T09:15:00Z",
    estado: "CONTESTADO",
    origen: "contacto"
  },
  {
    id: "MSG-004",
    nombre: "Ana Martínez",
    email: "ana.martinez@servicios.com",
    telefono: "+591 2 4567890",
    empresa: "Servicios GHI S.A.",
    mensaje: "Buenos días, me interesa conocer los precios de murales publicitarios. Gracias.",
    fecha_recepcion: "2024-01-12T14:20:00Z",
    estado: "NUEVO",
    origen: "home"
  },
  {
    id: "MSG-005",
    nombre: "Pedro Rodríguez",
    email: "pedro.rodriguez@distribuidora.com",
    telefono: "+591 2 5678901",
    empresa: "Distribuidora JKL Ltda.",
    mensaje: "¿Ofrecen servicios de impresión digital? Necesito lonas para un evento.",
    fecha_recepcion: "2024-01-11T11:30:00Z",
    estado: "EN_PROCESO",
    origen: "contacto"
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

const getOrigenColor = (origen: string) => {
  switch (origen) {
    case "contacto":
      return "bg-purple-100 text-purple-800"
    case "home":
      return "bg-indigo-100 text-indigo-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export default function MensajesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMensajes, setSelectedMensajes] = useState<string[]>([])
  const [mensajesList, setMensajesList] = useState<Message[]>(mensajes)

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMensajes(mensajesList.map(m => m.id))
    } else {
      setSelectedMensajes([])
    }
  }

  const handleSelectMensaje = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedMensajes([...selectedMensajes, id])
    } else {
      setSelectedMensajes(selectedMensajes.filter(m => m !== id))
    }
  }

  const filteredMensajes = mensajesList.filter(mensaje =>
    mensaje.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mensaje.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mensaje.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mensaje.mensaje.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Ordenar del más reciente al más antiguo
  const sortedMensajes = filteredMensajes.sort((a, b) => 
    new Date(b.fecha_recepcion).getTime() - new Date(a.fecha_recepcion).getTime()
  )

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
            <span className="text-gray-600">Buscar</span>
            <span className="text-gray-800 font-medium">admin</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-full px-4 sm:px-6 py-8 overflow-hidden">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Gestión de Mensajes</h1>
          <p className="text-gray-600">Administra los mensajes recibidos desde los formularios de la web</p>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar mensajes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </div>

        {/* Mensajes Table */}
        <Card>
          <CardHeader>
            <CardTitle>Listado de Mensajes</CardTitle>
            <CardDescription>
              {sortedMensajes.length} mensajes encontrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4">
                      <Checkbox
                        checked={selectedMensajes.length === mensajesList.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Nombre</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Teléfono</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Empresa</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Mensaje</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Fecha</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Estado</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Origen</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedMensajes.map((mensaje) => (
                    <tr key={mensaje.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <Checkbox
                          checked={selectedMensajes.includes(mensaje.id)}
                          onCheckedChange={(checked) => handleSelectMensaje(mensaje.id, checked as boolean)}
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{mensaje.nombre}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="max-w-xs truncate">{mensaje.email}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {mensaje.telefono}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          <span className="max-w-xs truncate">{mensaje.empresa}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="max-w-xs">
                          <span className="text-sm text-gray-600 line-clamp-2">{mensaje.mensaje}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">
                            {new Date(mensaje.fecha_recepcion).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={`${getEstadoColor(mensaje.estado)} flex items-center gap-1 w-fit`}>
                          {getEstadoIcon(mensaje.estado)}
                          {mensaje.estado.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={`${getOrigenColor(mensaje.origen)} w-fit`}>
                          {mensaje.origen === 'contacto' ? 'Contacto' : 'Home'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <Link href={`/panel/mensajes/${mensaje.id}`}>
                            <Button variant="ghost" size="sm" title="Ver detalles">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="sm" title="Responder">
                            <Reply className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </Sidebar>
  )
}
