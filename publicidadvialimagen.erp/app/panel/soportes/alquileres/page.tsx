"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Home, 
  Search, 
  Filter, 
  Download, 
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  User,
  DollarSign
} from "lucide-react"
import { toast } from "sonner"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Sidebar from "@/components/sidebar"

// Interface para los datos de alquileres
interface Alquiler {
  id: string
  codigo: string
  inicio: string
  cliente: string
  vendedor: string
  total: number
  estado: 'Activo' | 'Finalizado' | 'Cancelado' | 'Pendiente'
}

// Estados válidos para alquileres
const ESTADOS_ALQUILER = {
  'Activo': { label: 'Activo', className: 'bg-green-100 text-green-800' },
  'Finalizado': { label: 'Finalizado', className: 'bg-blue-100 text-blue-800' },
  'Cancelado': { label: 'Cancelado', className: 'bg-red-100 text-red-800' },
  'Pendiente': { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800' },
} as const

export default function AlquileresPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAlquileres, setSelectedAlquileres] = useState<string[]>([])
  const [alquileres, setAlquileres] = useState<Alquiler[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })

  // Datos de ejemplo (simulando API)
  useEffect(() => {
    const mockAlquileres: Alquiler[] = [
      {
        id: "1",
        codigo: "ALQ-001",
        inicio: "2024-01-15",
        cliente: "Empresa ABC",
        vendedor: "Juan Pérez",
        total: 2500,
        estado: "Activo"
      },
      {
        id: "2",
        codigo: "ALQ-002",
        inicio: "2024-02-01",
        cliente: "Comercial XYZ",
        vendedor: "María García",
        total: 1800,
        estado: "Finalizado"
      },
      {
        id: "3",
        codigo: "ALQ-003",
        inicio: "2024-02-15",
        cliente: "Tienda 123",
        vendedor: "Carlos López",
        total: 3200,
        estado: "Pendiente"
      }
    ]
    
    setAlquileres(mockAlquileres)
    setLoading(false)
  }, [])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAlquileres(alquileres.map(a => a.id))
    } else {
      setSelectedAlquileres([])
    }
  }

  const handleSelectAlquiler = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedAlquileres([...selectedAlquileres, id])
    } else {
      setSelectedAlquileres(selectedAlquileres.filter(a => a !== id))
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este alquiler?")) return
    
    try {
      // Simular eliminación
      setAlquileres(alquileres.filter(a => a.id !== id))
      toast.success("Alquiler eliminado correctamente")
    } catch (error) {
      toast.error("Error al eliminar el alquiler")
    }
  }

  // Filtrar alquileres
  const filteredAlquileres = alquileres.filter(alquiler =>
    alquiler.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alquiler.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alquiler.vendedor.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES')
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-ES", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price)
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
              title="Volver al panel de control"
            >
              <Home className="w-5 h-5" />
            </Link>
            <div className="text-xl font-bold text-slate-800">Soportes</div>
            <div className="flex items-center gap-6 ml-4">
              <Link 
                href="/panel/soportes/gestion" 
                className="text-sm font-medium text-gray-600 hover:text-[#D54644] transition-colors"
              >
                Soportes
              </Link>
              <Link 
                href="/panel/soportes/alquileres" 
                className="text-sm font-medium text-[#D54644] hover:text-[#D54644]/80 transition-colors"
              >
                Alquileres
              </Link>
              <Link 
                href="/panel/soportes/planificacion" 
                className="text-sm font-medium text-gray-600 hover:text-[#D54644] transition-colors"
              >
                Planificación
              </Link>
              <Link 
                href="/panel/soportes/costes" 
                className="text-sm font-medium text-gray-600 hover:text-[#D54644] transition-colors"
              >
                Costes
              </Link>
              <Link 
                href="/panel/soportes/mantenimiento" 
                className="text-sm font-medium text-gray-600 hover:text-[#D54644] transition-colors"
              >
                Mantenimiento
              </Link>
            </div>
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
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Gestión de Alquileres</h1>
          <p className="text-gray-600">Administra los alquileres de soportes publicitarios</p>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-wrap gap-2 items-center">
            {/* Buscador */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar alquileres..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>

            <div className="flex-1" />
            
            {/* Botones de acción */}
            <Button
              variant="outline"
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            
            <Link href="/panel/soportes/alquileres/nuevo">
              <Button size="sm" className="bg-[#D54644] hover:bg-[#B03A38]">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Alquiler
              </Button>
            </Link>
          </div>
        </div>

        {/* Tabla de Alquileres */}
        <Card>
          <CardHeader>
            <CardTitle>Alquileres ({filteredAlquileres.length})</CardTitle>
            <CardDescription>
              Lista de todos los alquileres de soportes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D54644] mx-auto mb-4"></div>
                  <p className="text-gray-600">Cargando alquileres...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <p className="text-red-600 mb-4">Error al cargar los alquileres</p>
                  <Button onClick={() => window.location.reload()} variant="outline">
                    Reintentar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3">
                        <Checkbox
                          checked={selectedAlquileres.length === filteredAlquileres.length && filteredAlquileres.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                      <th className="text-left py-2 px-3 font-medium text-gray-900">Código</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-900">Inicio</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-900">Cliente</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-900">Vendedor</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-900">Total</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-900">Estado</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-900">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAlquileres.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-gray-500">
                          {searchTerm ? 'No se encontraron alquileres con ese criterio de búsqueda' : 'No hay alquileres disponibles'}
                        </td>
                      </tr>
                    ) : (
                      filteredAlquileres.map((alquiler) => (
                        <tr key={alquiler.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-3">
                            <Checkbox
                              checked={selectedAlquileres.includes(alquiler.id)}
                              onCheckedChange={(checked) => handleSelectAlquiler(alquiler.id, checked as boolean)}
                            />
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-1 font-mono text-xs text-gray-800 border border-neutral-200">
                              {alquiler.codigo}
                            </span>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="w-3 h-3" />
                              {formatDate(alquiler.inicio)}
                            </div>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-1 text-sm">
                              <User className="w-3 h-3" />
                              {alquiler.cliente}
                            </div>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span className="text-sm">{alquiler.vendedor}</span>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              <span className="font-medium">Bs {formatPrice(alquiler.total)}</span>
                            </div>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${ESTADOS_ALQUILER[alquiler.estado]?.className || 'bg-gray-100 text-gray-800'}`}>
                              {ESTADOS_ALQUILER[alquiler.estado]?.label || alquiler.estado}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" title="Ver alquiler">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" title="Editar alquiler">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDelete(alquiler.id)}
                                className="text-red-600 hover:text-red-700"
                                title="Eliminar alquiler"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
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
    </Sidebar>
  )
}

