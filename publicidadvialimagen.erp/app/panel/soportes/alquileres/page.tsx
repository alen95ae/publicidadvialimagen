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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { usePermisosContext } from "@/hooks/permisos-provider"

// Interface para los datos de alquileres
interface Alquiler {
  id: string
  codigo: string
  cotizacion_id: string
  inicio: string
  fin: string
  meses: number | null
  soporte_codigo?: string | null
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
  const { tieneFuncionTecnica, puedeEditar, puedeEliminar } = usePermisosContext()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAlquileres, setSelectedAlquileres] = useState<string[]>([])
  const [alquileres, setAlquileres] = useState<Alquiler[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtroVendedor, setFiltroVendedor] = useState<string>("all")
  const [filtroEstado, setFiltroEstado] = useState<string>("all")
  const [vendedoresUnicos, setVendedoresUnicos] = useState<string[]>([])
  const [exporting, setExporting] = useState(false)
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
  const loadAlquileres = async (page: number = currentPage) => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('pageSize', '50')
      
      // Búsqueda general en múltiples campos
      if (searchTerm) {
        params.set('search', searchTerm)
      }
      if (filtroVendedor !== 'all') {
        params.set('vendedor', filtroVendedor)
      }
      if (filtroEstado !== 'all') {
        params.set('estado', filtroEstado)
      }
      
      const response = await fetch(`/api/alquileres?${params.toString()}`, {
        cache: 'no-store',
        next: { revalidate: 0 }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAlquileres(data.data || [])
          setPagination(data.pagination || pagination)
          setCurrentPage(page)
          
          // Actualizar lista única de vendedores para el filtro (de los alquileres)
          const nuevosVendedores = Array.from(new Set((data.data || []).map((a: Alquiler) => a.vendedor).filter(Boolean))) as string[]
          
          setVendedoresUnicos(prev => {
            const combined = [...new Set([...prev, ...nuevosVendedores])]
            return combined.sort()
          })
          
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

  // Cargar vendedores del sistema
  const fetchVendedoresSistema = async () => {
    try {
      const response = await fetch('/api/ajustes/usuarios?pageSize=100')
      const data = await response.json()
      if (data.users) {
        const vendedoresSistema = data.users.map((u: any) => u.nombre).filter(Boolean) as string[]
        setVendedoresUnicos(prev => {
          const combined = [...new Set([...prev, ...vendedoresSistema])]
          return combined.sort()
        })
      }
    } catch (error) {
      console.error('Error fetching vendedores del sistema:', error)
    }
  }

  useEffect(() => {
    fetchVendedoresSistema()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filtroVendedor, filtroEstado])

  useEffect(() => {
    loadAlquileres(currentPage)
  }, [currentPage, searchTerm, filtroVendedor, filtroEstado])

  // Funciones de paginación
  const handlePageChange = (page: number) => {
    loadAlquileres(page)
  }

  const handlePrevPage = () => {
    if (pagination.hasPrev) {
      handlePageChange(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (pagination.hasNext) {
      handlePageChange(currentPage + 1)
    }
  }

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

  const handleEdit = (cotizacionId: string) => {
    router.push(`/panel/ventas/editar/${cotizacionId}`)
  }

  const handleDelete = async (alquilerId: string, codigo: string) => {
    if (!confirm(`¿Estás seguro de eliminar el alquiler ${codigo}? Esta acción no se puede deshacer.`)) {
      return
    }

    try {
      const response = await fetch(`/api/alquileres/${alquilerId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Alquiler eliminado correctamente')
        loadAlquileres(currentPage)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al eliminar el alquiler')
      }
    } catch (error) {
      console.error('Error eliminando alquiler:', error)
      toast.error(error instanceof Error ? error.message : 'Error al eliminar el alquiler')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES')
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-ES", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price)
  }

  // Función para exportar a CSV
  const handleExport = async () => {
    try {
      setExporting(true)
      const response = await fetch('/api/alquileres/export')
      
      if (!response.ok) {
        throw new Error('Error al exportar alquileres')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `alquileres_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Alquileres exportados correctamente')
    } catch (error) {
      console.error('Error exporting:', error)
      toast.error('Error al exportar alquileres')
    } finally {
      setExporting(false)
    }
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
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-2 items-center flex-1">
              {/* Buscador */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por cliente, vendedor, código o soporte..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>

              {/* Filtro por Vendedor */}
              <Select value={filtroVendedor} onValueChange={setFiltroVendedor}>
                <SelectTrigger className="w-52 [&>span]:text-black !pl-9 !pr-3 relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none z-10" />
                  <SelectValue placeholder="Vendedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los vendedores</SelectItem>
                  {vendedoresUnicos.map((vendedor) => (
                    <SelectItem key={vendedor} value={vendedor}>
                      {vendedor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Filtro por Estado */}
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger className="w-52 [&>span]:text-black !pl-9 !pr-3 relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none z-10" />
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {Object.entries(ESTADOS_ALQUILER).map(([key, meta]) => (
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
              {tieneFuncionTecnica("ver boton exportar") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  disabled={exporting || alquileres.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {exporting ? 'Exportando...' : 'Exportar'}
                </Button>
              )}
              
              <Link href="/panel/ventas/nuevo">
                <Button size="sm" className="bg-[#D54644] hover:bg-[#B03A38]">
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Alquiler
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Tabla de Alquileres */}
        <Card>
          <CardHeader>
            <CardTitle>Alquileres ({pagination.total})</CardTitle>
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
                      {puedeEditar("soportes") && (
                      <th className="text-center py-2 px-3">
                        <Checkbox
                          checked={selectedAlquileres.length === alquileres.length && alquileres.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                      )}
                      <th className="text-center py-2 px-3 font-medium text-gray-900">Código</th>
                      <th className="text-center py-2 px-3 font-medium text-gray-900">Inicio</th>
                      <th className="text-center py-2 px-3 font-medium text-gray-900">Fin</th>
                      <th className="text-center py-2 px-3 font-medium text-gray-900">Meses</th>
                      <th className="text-center py-2 px-3 font-medium text-gray-900">Soporte</th>
                      <th className="text-center py-2 px-3 font-medium text-gray-900">Cliente</th>
                      <th className="text-center py-2 px-3 font-medium text-gray-900">Vendedor</th>
                      <th className="text-center py-2 px-3 font-medium text-gray-900">Total</th>
                      <th className="text-center py-2 px-3 font-medium text-gray-900">Estado</th>
                      <th className="text-center py-2 px-3 font-medium text-gray-900">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alquileres.length === 0 ? (
                      <tr>
                        <td colSpan={puedeEditar("soportes") ? 11 : 10} className="text-center py-8 text-gray-500">
                          {searchTerm ? 'No se encontraron alquileres con ese criterio de búsqueda' : 'No hay alquileres disponibles'}
                        </td>
                      </tr>
                    ) : (
                      alquileres.map((alquiler) => (
                        <tr key={alquiler.id} className="border-b border-gray-100 hover:bg-gray-50">
                          {puedeEditar("soportes") && (
                          <td className="py-2 px-3 text-center">
                            <Checkbox
                              checked={selectedAlquileres.includes(alquiler.id)}
                              onCheckedChange={(checked) => handleSelectAlquiler(alquiler.id, checked as boolean)}
                            />
                          </td>
                          )}
                          <td className="py-2 px-3 whitespace-nowrap text-center">
                            <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-1 font-mono text-xs text-gray-800 border border-neutral-200">
                              {alquiler.codigo}
                            </span>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-1 text-sm">
                              <Calendar className="w-3 h-3" />
                              {formatDate(alquiler.inicio)}
                            </div>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-1 text-sm">
                              <Calendar className="w-3 h-3" />
                              {formatDate(alquiler.fin)}
                            </div>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap text-center">
                            <span className="text-sm">{alquiler.meses || '-'}</span>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap text-center">
                            {alquiler.soporte_codigo ? (
                              <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-1 font-mono text-xs text-gray-800 border border-neutral-200">
                                {alquiler.soporte_codigo}
                              </span>
                            ) : (
                              <span className="text-sm">-</span>
                            )}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap text-center">
                            {alquiler.cliente && alquiler.cliente.length > 25 ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger className="text-left">
                                    <span className="text-sm">{alquiler.cliente.slice(0, 25) + '…'}</span>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-sm">{alquiler.cliente}</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              <span className="text-sm">{alquiler.cliente || '-'}</span>
                            )}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap text-center">
                            <span className="text-sm">{alquiler.vendedor || '-'}</span>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap text-center">
                            <span className="font-medium text-green-600">
                              {alquiler.total ? `${formatPrice(alquiler.total)} Bs` : '0.00 Bs'}
                            </span>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap text-center">
                            <span className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${ESTADOS_ALQUILER[alquiler.estado]?.className || 'bg-gray-100 text-gray-800'}`}>
                              {ESTADOS_ALQUILER[alquiler.estado]?.label || alquiler.estado}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <div className="flex gap-2 justify-center">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                title="Editar cotización"
                                onClick={() => handleEdit(alquiler.cotizacion_id)}
                                className="text-gray-600 hover:text-gray-800 hover:bg-gray-200"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              {puedeEliminar("soportes") && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  title="Eliminar alquiler"
                                  onClick={() => handleDelete(alquiler.id, alquiler.codigo)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Paginación */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handlePrevPage}
                    disabled={!pagination.hasPrev || loading}
                  >
                    Anterior
                  </Button>
                  
                  {/* Mostrar páginas */}
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        disabled={loading}
                        className={currentPage === pageNum ? "bg-[#D54644] text-white hover:bg-[#B73E3A]" : ""}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleNextPage}
                    disabled={!pagination.hasNext || loading}
                  >
                    Siguiente
                  </Button>
                </div>
                
                {/* Información de paginación */}
                <div className="ml-4 text-sm text-gray-600">
                  Mostrando {((currentPage - 1) * 50) + 1} - {Math.min(currentPage * 50, pagination.total)} de {pagination.total} items
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Toaster />
    </div>
  )
}

