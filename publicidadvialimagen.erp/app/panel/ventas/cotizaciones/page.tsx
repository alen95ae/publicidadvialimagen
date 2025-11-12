"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Handshake, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2
} from "lucide-react"
import { toast } from "sonner"
import { Toaster } from "sonner"

interface Cotizacion {
  id: string
  codigo: string
  fecha_creacion: string
  cliente: string
  vendedor: string
  sucursal: string
  total_final: number
  estado: "Pendiente" | "En Proceso" | "Aprobada" | "Rechazada"
}

const getEstadoColor = (estado: string) => {
  switch (estado) {
    case "Aprobada":
      return "bg-green-100 text-green-800"
    case "Rechazada":
      return "bg-red-100 text-red-800"
    case "En Proceso":
      return "bg-blue-100 text-blue-800"
    case "Pendiente":
      return "bg-yellow-100 text-yellow-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getEstadoIcon = (estado: string) => {
  switch (estado) {
    case "Aprobada":
      return <CheckCircle className="w-4 h-4" />
    case "Rechazada":
      return <XCircle className="w-4 h-4" />
    case "En Proceso":
      return <Clock className="w-4 h-4" />
    case "Pendiente":
      return <AlertCircle className="w-4 h-4" />
    default:
      return <AlertCircle className="w-4 h-4" />
  }
}

export default function CotizacionesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCotizaciones, setSelectedCotizaciones] = useState<string[]>([])
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Función para obtener iniciales del vendedor
  const getInitials = (nombre: string) => {
    if (!nombre) return "?"
    return nombre
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  // Función para eliminar cotización
  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta cotización?")) return
    
    try {
      const response = await fetch(`/api/cotizaciones/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        toast.success("Cotización eliminada correctamente")
        fetchCotizaciones() // Recargar lista
      } else {
        toast.error("Error al eliminar cotización")
      }
    } catch (error) {
      console.error('Error deleting cotización:', error)
      toast.error("Error al eliminar cotización")
    }
  }

  // Cargar cotizaciones desde la API
  useEffect(() => {
    fetchCotizaciones()
  }, [])

  const fetchCotizaciones = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/cotizaciones?pageSize=100')
      const data = await response.json()
      
      if (data.success) {
        setCotizaciones(data.data)
      } else {
        toast.error('Error al cargar cotizaciones')
      }
    } catch (error) {
      console.error('Error fetching cotizaciones:', error)
      toast.error('Error al cargar cotizaciones')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCotizaciones(cotizaciones.map(c => c.id))
    } else {
      setSelectedCotizaciones([])
    }
  }

  const handleSelectCotizacion = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedCotizaciones([...selectedCotizaciones, id])
    } else {
      setSelectedCotizaciones(selectedCotizaciones.filter(c => c !== id))
    }
  }

  const filteredCotizaciones = cotizaciones.filter(cotizacion =>
    cotizacion.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cotizacion.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cotizacion.vendedor.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <>
      <Toaster position="top-right" />
      <div className="p-6">

        {/* Main Content */}
        <main className="w-full max-w-full px-4 sm:px-6 py-8 overflow-hidden">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Gestión de Cotizaciones</h1>
          <p className="text-gray-600">Administra las cotizaciones y propuestas comerciales</p>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar cotizaciones..."
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
              <Link href="/panel/ventas/nuevo">
                <Button className="bg-[#D54644] hover:bg-[#B03A38] text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Cotización
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Cotizaciones Table */}
        <Card>
          <CardHeader>
            <CardTitle>Listado de Cotizaciones</CardTitle>
            <CardDescription>
              {isLoading ? 'Cargando...' : `${filteredCotizaciones.length} cotizaciones encontradas`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#D54644]" />
              </div>
            ) : filteredCotizaciones.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No se encontraron cotizaciones</p>
                <Link href="/panel/ventas/nuevo">
                  <Button className="mt-4 bg-[#D54644] hover:bg-[#B03A38] text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Crear primera cotización
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4">
                        <Checkbox
                          checked={selectedCotizaciones.length === cotizaciones.length && cotizaciones.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Código</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Fecha Creación</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Cliente</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Vendedor</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Sucursal</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Total</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Estado</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCotizaciones.map((cotizacion) => (
                      <tr key={cotizacion.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <Checkbox
                            checked={selectedCotizaciones.includes(cotizacion.id)}
                            onCheckedChange={(checked) => handleSelectCotizacion(cotizacion.id, checked as boolean)}
                          />
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-1 font-mono text-xs text-gray-800 border border-neutral-200">
                            {cotizacion.codigo}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-600">
                            {new Date(cotizacion.fecha_creacion).toLocaleDateString('es-ES')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-900">{cotizacion.cliente}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src="" alt={cotizacion.vendedor} />
                              <AvatarFallback className="bg-[#D54644] text-white text-[10px] font-medium">
                                {getInitials(cotizacion.vendedor)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-gray-900">{cotizacion.vendedor}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-600">{cotizacion.sucursal}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-green-600">
                            Bs {cotizacion.total_final.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={`${getEstadoColor(cotizacion.estado)} flex items-center gap-1 w-fit`}>
                            {getEstadoIcon(cotizacion.estado)}
                            {cotizacion.estado}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1">
                            <Link href={`/panel/ventas/editar/${cotizacion.id}`}>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                title="Editar"
                                className="text-gray-600 hover:text-gray-800 hover:bg-gray-200"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              title="Eliminar"
                              onClick={() => handleDelete(cotizacion.id)}
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
      </div>
    </>
  )
}
