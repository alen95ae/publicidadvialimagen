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
  Trash2
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  estado: "NUEVO" | "LEÍDO" | "CONTESTADO"
}

// Los mensajes se cargan desde la API de Airtable

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


// Estados para filtros
const ESTADOS_META = {
  NUEVO: { label: "Nuevo", className: "bg-yellow-100 text-yellow-800" },
  LEÍDO: { label: "Leído", className: "bg-blue-100 text-blue-800" },
  CONTESTADO: { label: "Contestado", className: "bg-green-100 text-green-800" }
}

export default function MensajesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMensajes, setSelectedMensajes] = useState<string[]>([])
  const [mensajesList, setMensajesList] = useState<Message[]>([])
  const [estadoFilter, setEstadoFilter] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Cargar mensajes desde Airtable
  const loadMensajes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/messages')
      if (response.ok) {
        const data = await response.json()
        setMensajesList(data)
      } else {
        const errorData = await response.json()
        console.error('Error loading messages:', errorData)
        alert(`Error al cargar mensajes: ${errorData.error || 'Error desconocido'}`)
      }
    } catch (error) {
      console.error('Error loading messages:', error)
      alert('Error de conexión al cargar mensajes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMensajes()
  }, [])

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

  const handleEliminarMensaje = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este mensaje?')) {
      try {
        const response = await fetch(`/api/messages/${id}`, {
          method: 'DELETE'
        })
        if (response.ok) {
          setMensajesList(mensajesList.filter(m => m.id !== id))
          setSelectedMensajes(selectedMensajes.filter(m => m !== id))
        } else {
          alert('Error al eliminar el mensaje')
        }
      } catch (error) {
        console.error('Error deleting message:', error)
        alert('Error al eliminar el mensaje')
      }
    }
  }

  const handleMarcarComoLeido = async (id: string) => {
    try {
      const response = await fetch(`/api/messages/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ estado: 'LEÍDO' })
      })
      if (response.ok) {
        setMensajesList(mensajesList.map(m => 
          m.id === id ? { ...m, estado: "LEÍDO" as const } : m
        ))
      } else {
        alert('Error al actualizar el estado')
      }
    } catch (error) {
      console.error('Error updating message:', error)
      alert('Error al actualizar el estado')
    }
  }


  const filteredMensajes = mensajesList.filter(mensaje => {
    const matchesSearch = mensaje.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mensaje.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mensaje.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mensaje.mensaje.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesEstado = estadoFilter.length === 0 || estadoFilter.includes(mensaje.estado)
    
    return matchesSearch && matchesEstado
  })

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
              <Select
                value={estadoFilter.length ? estadoFilter.join(',') : 'all'}
                onValueChange={(value) => setEstadoFilter(value === 'all' ? [] : (value ? value.split(',') : []))}
              >
                <SelectTrigger className="max-w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Object.entries(ESTADOS_META).map(([key, meta]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <span className={`inline-block w-3 h-3 rounded-full ${meta.className}`}></span>
                        {meta.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D54644] mx-auto mb-4"></div>
                  <p className="text-gray-600">Cargando mensajes...</p>
                </div>
              </div>
            ) : (
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
                    <th className="text-left py-3 px-4 font-medium text-gray-900 w-40">Teléfono</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Empresa</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Mensaje</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Fecha</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Estado</th>
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
                      <td className="py-3 px-4 w-40">
                        <div className="flex items-center gap-2 min-w-0">
                          <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                            {mensaje.telefono}
                          </span>
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
                        <div className="flex gap-1">
                          <Link href={`/panel/mensajes/${mensaje.id}`}>
                            <Button variant="ghost" size="sm" title="Ver detalles">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="Eliminar"
                            onClick={() => handleEliminarMensaje(mensaje.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </Sidebar>
  )
}
