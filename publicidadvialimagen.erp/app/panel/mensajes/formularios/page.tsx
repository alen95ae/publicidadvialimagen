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
  Eye,
  Trash2,
  RefreshCw
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Toaster } from "sonner"

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

export default function FormulariosPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMensajes, setSelectedMensajes] = useState<string[]>([])
  const [mensajesList, setMensajesList] = useState<Message[]>([])
  const [estadoFilter, setEstadoFilter] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [editedMessages, setEditedMessages] = useState<Record<string, Partial<Message>>>({})
  const [savingChanges, setSavingChanges] = useState(false)

  // Cargar mensajes desde Supabase
  const loadMensajes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/messages', {
        credentials: 'include',
        cache: 'no-store',
        next: { revalidate: 0 }
      })
      if (response.ok) {
        const data = await response.json()
        setMensajesList(data)
        console.log(`✅ Cargados ${data.length} mensajes desde Supabase`)
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
    if (confirm('¿Estás seguro de que quieres eliminar este formulario?')) {
      try {
        const response = await fetch(`/api/messages/${id}`, {
          method: 'DELETE',
          credentials: 'include',
          cache: 'no-store'
        })
        if (response.ok) {
          await loadMensajes()
          setSelectedMensajes(selectedMensajes.filter(m => m !== id))
        } else {
          alert('Error al eliminar el formulario')
        }
      } catch (error) {
        console.error('Error deleting message:', error)
        alert('Error al eliminar el formulario')
      }
    }
  }

  const handleEstadoChange = (id: string, newEstado: "NUEVO" | "LEÍDO" | "CONTESTADO") => {
    setEditedMessages(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        estado: newEstado
      }
    }))
  }

  const handleBulkEstadoChange = (newEstado: "NUEVO" | "LEÍDO" | "CONTESTADO") => {
    const updates: Record<string, Partial<Message>> = {}
    selectedMensajes.forEach(id => {
      updates[id] = {
        ...(editedMessages[id] || {}),
        estado: newEstado
      }
    })
    setEditedMessages(prev => ({ ...prev, ...updates }))
    toast.info(`Estado actualizado para ${selectedMensajes.length} formulario(s)`)
  }

  const handleSaveChanges = async () => {
    if (Object.keys(editedMessages).length === 0) return

    try {
      setSavingChanges(true)
      const count = Object.keys(editedMessages).length

      if (count === 1) {
        const [id] = Object.keys(editedMessages)
        const changes = editedMessages[id]
        
        if (changes.estado) {
          const response = await fetch(`/api/messages/${id}`, {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: changes.estado }),
            cache: 'no-store'
          })
          
          if (!response.ok) {
            throw new Error('Error al actualizar mensaje')
          }
        }
      } else {
        const ids = Object.keys(editedMessages)
        const estados = ids.map(id => editedMessages[id].estado)
        const estadosUnicos = [...new Set(estados.filter(Boolean))]
        
        for (const estado of estadosUnicos) {
          const idsConEsteEstado = ids.filter(id => editedMessages[id].estado === estado)
          
          if (idsConEsteEstado.length > 0 && estado) {
            const response = await fetch('/api/messages/bulk', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ids: idsConEsteEstado,
                action: 'update',
                data: { estado }
              })
            })
            
            if (!response.ok) {
              const errorData = await response.json()
              throw new Error(errorData.error || 'Error al actualizar mensajes')
            }
          }
        }
      }

      setEditedMessages({})
      setSelectedMensajes([])
      await loadMensajes()
      toast.success(`${count} formulario(s) actualizado(s)`)
    } catch (error) {
      console.error('Error al guardar cambios:', error)
      toast.error("Error al guardar cambios")
    } finally {
      setSavingChanges(false)
    }
  }

  const handleDiscardChanges = () => {
    setEditedMessages({})
    toast.info("Cambios descartados")
  }

  const handleExport = async () => {
    try {
      const estadoParam = estadoFilter.length > 0 ? estadoFilter.join(',') : 'all'
      const url = `/api/messages/export?estado=${estadoParam}`
      
      const response = await fetch(url, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Error al exportar mensajes')
      }
      
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `formularios_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
      
      toast.success(`Formularios exportados correctamente`)
    } catch (error) {
      console.error('Error exportando mensajes:', error)
      toast.error('Error al exportar formularios')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedMensajes.length === 0) {
      toast.error("Selecciona al menos un formulario para eliminar")
      return
    }

    if (!confirm(`¿Estás seguro de que quieres eliminar ${selectedMensajes.length} formulario(s)?`)) {
      return
    }

    try {
      const response = await fetch('/api/messages/bulk', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: selectedMensajes,
          action: 'delete'
        })
      })

      if (response.ok) {
        await loadMensajes()
        setSelectedMensajes([])
        toast.success(`${selectedMensajes.length} formulario(s) eliminado(s)`)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Error al eliminar los formularios')
      }
    } catch (error) {
      console.error('Error eliminando mensajes:', error)
      toast.error('Error de conexión')
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

  const sortedMensajes = filteredMensajes.sort((a, b) => 
    new Date(b.fecha_recepcion).getTime() - new Date(a.fecha_recepcion).getTime()
  )

  return (
    <div className="p-6">
      <main className="w-full max-w-full px-4 sm:px-6 py-8 overflow-hidden">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Formularios</h1>
            <p className="text-gray-600">Administra los formularios recibidos desde la web</p>
          </div>
          <Button
            onClick={loadMensajes}
            variant="outline"
            size="sm"
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar formularios..."
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
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Listado de Formularios</CardTitle>
            <CardDescription>
              {sortedMensajes.length} formularios encontrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(selectedMensajes.length > 0 || Object.keys(editedMessages).length > 0) && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {selectedMensajes.length > 0 && (
                      <span className="text-sm font-medium text-blue-800">
                        {selectedMensajes.length} seleccionado{selectedMensajes.length > 1 ? 's' : ''}
                      </span>
                    )}
                    {selectedMensajes.length > 1 && (
                      <Select
                        value=""
                        onValueChange={(value: "NUEVO" | "LEÍDO" | "CONTESTADO") => {
                          handleBulkEstadoChange(value)
                        }}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Cambiar estado..." />
                        </SelectTrigger>
                        <SelectContent>
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
                    )}
                  </div>
                  <div className="flex gap-2">
                    {Object.keys(editedMessages).length > 0 && (
                      <>
                        <Button 
                          size="sm" 
                          onClick={handleSaveChanges}
                          disabled={savingChanges}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          {savingChanges ? "Guardando..." : `Guardar cambios (${Object.keys(editedMessages).length})`}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleDiscardChanges}
                        >
                          Descartar
                        </Button>
                      </>
                    )}
                    {selectedMensajes.length > 0 && (
                      <Button 
                        size="sm" 
                        onClick={handleBulkDelete}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar{selectedMensajes.length > 1 ? ` (${selectedMensajes.length})` : ''}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D54644] mx-auto mb-4"></div>
                  <p className="text-gray-600">Cargando formularios...</p>
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
                        <span className="font-medium line-clamp-2">{mensaje.nombre}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="max-w-xs truncate" title={mensaje.email}>
                          {mensaje.email.length > 25 ? `${mensaje.email.substring(0, 25)}...` : mensaje.email}
                        </span>
                      </td>
                      <td className="py-3 px-4 w-40">
                        <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                          {mensaje.telefono}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="max-w-xs truncate">{mensaje.empresa}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="max-w-xs">
                          <span className="text-sm text-gray-600 line-clamp-2">{mensaje.mensaje}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm">
                          {new Date(mensaje.fecha_recepcion).toLocaleDateString('es-ES')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {selectedMensajes.length === 1 && selectedMensajes.includes(mensaje.id) ? (
                          <Select
                            value={editedMessages[mensaje.id]?.estado || mensaje.estado}
                            onValueChange={(value: "NUEVO" | "LEÍDO" | "CONTESTADO") => {
                              handleEstadoChange(mensaje.id, value)
                            }}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
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
                        ) : (
                          <Badge className={`${getEstadoColor(editedMessages[mensaje.id]?.estado || mensaje.estado)} flex items-center gap-1 w-fit`}>
                            {getEstadoIcon(editedMessages[mensaje.id]?.estado || mensaje.estado)}
                            {(editedMessages[mensaje.id]?.estado || mensaje.estado).replace('_', ' ')}
                          </Badge>
                        )}
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
      <Toaster />
    </div>
  )
}



