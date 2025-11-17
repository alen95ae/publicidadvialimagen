"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { 
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
import { Toaster } from "sonner"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Interface para los datos de alquileres
interface Alquiler {
  id: string
  codigo: string
  cotizacion_id: string
  inicio: string
  fin: string
  meses: number | null
  cliente: string | null
  vendedor: string | null
  total: number | null
  estado: 'activo' | 'reservado' | 'proximo' | 'finalizado'
}

// Estados válidos para alquileres con colores
const ESTADOS_ALQUILER = {
  'activo': { label: 'Activo', className: 'bg-green-100 text-green-800' },
  'reservado': { label: 'Reservado', className: 'bg-yellow-100 text-yellow-800' },
  'proximo': { label: 'Próximo', className: 'bg-purple-100 text-purple-800' },
  'finalizado': { label: 'Finalizado', className: 'bg-gray-100 text-gray-800' },
} as const

export default function AlquileresPage() {
  const router = useRouter()
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

  // Cargar alquileres desde la API
  const loadAlquileres = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/alquileres', {
        cache: 'no-store',
        next: { revalidate: 0 }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAlquileres(data.data || [])
          setPagination(prev => ({
            ...prev,
            total: data.count || 0,
            totalPages: Math.ceil((data.count || 0) / prev.limit)
          }))
          console.log(`✅ Cargados ${data.data?.length || 0} alquileres`)
        } else {
          throw new Error(data.error || 'Error al cargar alquileres')
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al cargar alquileres')
      }
    } catch (error) {
      console.error('Error loading alquileres:', error)
      setError(error instanceof Error ? error.message : 'Error de conexión al cargar alquileres')
      toast.error('Error al cargar los alquileres')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAlquileres()
  }, [])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAlquileres(filteredAlquileres.map(a => a.id))
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

  const handleEdit = (cotizacionId: string) => {
    router.push(`/panel/ventas/editar/${cotizacionId}`)
  }

  // Filtrar alquileres
  const filteredAlquileres = alquileres.filter(alquiler =>
    alquiler.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (alquiler.cliente && alquiler.cliente.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (alquiler.vendedor && alquiler.vendedor.toLowerCase().includes(searchTerm.toLowerCase()))
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
    <div className="p-6">
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
            
            <Link href="/panel/ventas/nuevo">
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
                      <th className="text-left py-2 px-3 font-medium text-gray-900">Fin</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-900">Meses</th>
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
                        <td colSpan={9} className="text-center py-8 text-gray-500">
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
                              <Calendar className="w-3 h-3" />
                              {formatDate(alquiler.fin)}
                            </div>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span className="text-sm">{alquiler.meses || '-'}</span>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-1 text-sm">
                              <User className="w-3 h-3" />
                              {alquiler.cliente || '-'}
                            </div>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span className="text-sm">{alquiler.vendedor || '-'}</span>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              <span className="font-medium">Bs {alquiler.total ? formatPrice(alquiler.total) : '0.00'}</span>
                            </div>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${ESTADOS_ALQUILER[alquiler.estado]?.className || 'bg-gray-100 text-gray-800'}`}>
                              {ESTADOS_ALQUILER[alquiler.estado]?.label || alquiler.estado}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                title="Editar cotización"
                                onClick={() => handleEdit(alquiler.cotizacion_id)}
                                className="text-gray-600 hover:text-gray-800 hover:bg-gray-200"
                              >
                                <Edit className="w-4 h-4" />
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
      <Toaster />
    </div>
  )
}

