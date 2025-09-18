"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Hammer, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  MoreHorizontal,
  Calendar,
  User,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  Timer
} from "lucide-react"
import { toast } from "sonner"

interface ProductionOrder {
  id: string
  codigo: string
  fecha: string
  lugarInstalacion: string
  equipoTrabajo: string
  responsable: string
  tiempoEjecucion: string
  fechaLimite: string
  estado: "PENDIENTE" | "EN_PROCESO" | "COMPLETADA" | "ATRASADA"
  notas?: string
  createdAt: string
  updatedAt: string
}

const getEstadoColor = (estado: string) => {
  switch (estado) {
    case "COMPLETADA":
      return "bg-green-100 text-green-800"
    case "ATRASADA":
      return "bg-red-100 text-red-800"
    case "EN_PROCESO":
      return "bg-blue-100 text-blue-800"
    case "PENDIENTE":
      return "bg-yellow-100 text-yellow-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getEstadoIcon = (estado: string) => {
  switch (estado) {
    case "COMPLETADA":
      return <CheckCircle className="w-4 h-4" />
    case "ATRASADA":
      return <XCircle className="w-4 h-4" />
    case "EN_PROCESO":
      return <Clock className="w-4 h-4" />
    case "PENDIENTE":
      return <AlertCircle className="w-4 h-4" />
    default:
      return <AlertCircle className="w-4 h-4" />
  }
}

const getEstadoLabel = (estado: string) => {
  switch (estado) {
    case "COMPLETADA":
      return "Completada"
    case "ATRASADA":
      return "Atrasada"
    case "EN_PROCESO":
      return "En Proceso"
    case "PENDIENTE":
      return "Pendiente"
    default:
      return estado
  }
}

export default function ProduccionPage() {
  const [ordenesProduccion, setOrdenesProduccion] = useState<ProductionOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedOrdenes, setSelectedOrdenes] = useState<string[]>([])

  useEffect(() => {
    fetchOrdenesProduccion()
  }, [searchTerm])

  const fetchOrdenesProduccion = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append("q", searchTerm)

      const response = await fetch(`/api/produccion?${params}`)
      if (response.ok) {
        const data = await response.json()
        setOrdenesProduccion(data.items)
      } else {
        toast.error("Error al cargar las órdenes de producción")
      }
    } catch (error) {
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrdenes(ordenesProduccion.map(o => o.id))
    } else {
      setSelectedOrdenes([])
    }
  }

  const handleSelectOrden = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedOrdenes([...selectedOrdenes, id])
    } else {
      setSelectedOrdenes(selectedOrdenes.filter(o => o !== id))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/panel" className="text-gray-600 hover:text-gray-800 mr-4">
              ← Panel
            </Link>
            <div className="flex items-center gap-2">
              <Hammer className="w-6 h-6 text-[#D54644]" />
              <div className="text-xl font-bold text-slate-800">Producción</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Buscar</span>
            <span className="text-gray-800 font-medium">admin</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Gestión de Producción</h1>
          <p className="text-gray-600">Administra las órdenes de producción e instalación</p>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar órdenes de producción..."
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
              <Link href="/panel/produccion/nuevo">
                <Button className="bg-[#D54644] hover:bg-[#B03A38] text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Orden
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Órdenes de Producción Table */}
        <Card>
          <CardHeader>
            <CardTitle>Listado de Órdenes de Producción</CardTitle>
            <CardDescription>
              {ordenesProduccion.length} órdenes encontradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Cargando órdenes de producción...</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4">
                        <Checkbox
                          checked={selectedOrdenes.length === ordenesProduccion.length && ordenesProduccion.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Código</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Fecha</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Lugar de Instalación</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Equipo de Trabajo</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Responsable</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Tiempo de Ejecución</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Fecha Límite</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Estado</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordenesProduccion.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="text-center py-8 text-gray-500">
                          No se encontraron órdenes de producción
                        </td>
                      </tr>
                    ) : (
                      ordenesProduccion.map((orden) => (
                    <tr key={orden.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <Checkbox
                          checked={selectedOrdenes.includes(orden.id)}
                          onCheckedChange={(checked) => handleSelectOrden(orden.id, checked as boolean)}
                        />
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-[#D54644]">{orden.codigo}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(orden.fecha).toLocaleDateString('es-ES')}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="max-w-xs truncate">{orden.lugarInstalacion}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          {orden.equipoTrabajo}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          {orden.responsable}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Timer className="w-4 h-4 text-gray-400" />
                          {orden.tiempoEjecucion}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(orden.fechaLimite).toLocaleDateString('es-ES')}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={`${getEstadoColor(orden.estado)} flex items-center gap-1 w-fit`}>
                          {getEstadoIcon(orden.estado)}
                          {getEstadoLabel(orden.estado)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
