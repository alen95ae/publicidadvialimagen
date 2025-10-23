"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Monitor, 
  ArrowLeft, 
  DollarSign, 
  Search, 
  Filter, 
  Download, 
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  Calendar
} from "lucide-react"
import { toast } from "sonner"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Interface para los datos de soportes desde la API
interface Support {
  id: string
  code: string
  title: string
  type: string
  status: string
  widthM: number | null
  heightM: number | null
  city: string
  country: string
  priceMonth: number | null
  available: boolean
  areaM2: number | null
  pricePerM2: number | null
  productionCost: number | null
  owner: string | null
  imageUrl: string | null
  coordinates: string | null
  description: string | null
  features: string | null
  traffic: string | null
  visibility: string | null
  lighting: string | null
  material: string | null
  installationDate: string | null
  lastMaintenance: string | null
  nextMaintenance: string | null
  notes: string | null
}

// Interface para los costes calculados
interface SupportCosts {
  id: string
  codigo: string
  titulo: string
  propietario: string
  costeMensual: number
  luz: number
  patentes: number
  comision: number
  otros: number
  costoTotal: number
  precioVenta: number
  porcentajeBeneficio: number
  tieneIluminacion: boolean
}

const getBeneficioColor = (porcentaje: number) => {
  if (porcentaje < 0) return "text-black"
  if (porcentaje >= 0 && porcentaje < 15) return "text-red-600"
  if (porcentaje >= 15 && porcentaje < 30) return "text-orange-600"
  if (porcentaje >= 30 && porcentaje < 50) return "text-yellow-600"
  return "text-green-600" // >= 50%
}

const getBeneficioIcon = (porcentaje: number) => {
  if (porcentaje < 0) return <TrendingDown className="w-4 h-4" />
  if (porcentaje < 30) return <TrendingDown className="w-4 h-4" />
  return <TrendingUp className="w-4 h-4" />
}

export default function CostesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSoportes, setSelectedSoportes] = useState<string[]>([])
  const [supports, setSupports] = useState<Support[]>([])
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

  // Función para calcular costes basados en datos reales
  const calculateCosts = (support: Support): SupportCosts => {
    const precioVenta = support.priceMonth || 0
    const costeMensual = support.productionCost || (precioVenta * 0.4) // 40% del precio de venta como coste base
    
    // Debug: verificar qué valor tiene el campo lighting
    console.log(`🔍 Soporte ${support.code}: lighting = "${support.lighting}" (tipo: ${typeof support.lighting})`)
    console.log(`🔍 Soporte ${support.code}: todos los campos:`, support)
    
    const tieneIluminacion = support.lighting === 'Sí'
    const luz = tieneIluminacion ? (precioVenta * 0.1) : 0 // 10% para luz solo si tiene iluminación
    const patentes = precioVenta * 0.05 // 5% para patentes
    const comision = precioVenta * 0.08 // 8% para comisión
    const otros = precioVenta * 0.02 // 2% para otros gastos
    const costoTotal = costeMensual + luz + patentes + comision + otros
    
    // Cálculo del % de beneficio: (Precio Venta - Coste Total) / Coste Total * 100
    const beneficio = precioVenta - costoTotal
    const porcentajeBeneficio = costoTotal > 0 ? (beneficio / costoTotal) * 100 : 0

    console.log(`💰 Soporte ${support.code}: tieneIluminacion = ${tieneIluminacion}, luz = ${luz}`)

    return {
      id: support.id,
      codigo: support.code,
      titulo: support.title,
      propietario: support.owner || "Imagen",
      costeMensual,
      luz,
      patentes,
      comision,
      otros,
      costoTotal,
      precioVenta,
      porcentajeBeneficio,
      tieneIluminacion // Agregar campo para saber si tiene iluminación
    }
  }

  // Cargar soportes desde la API
  const fetchSupports = async (page: number = currentPage) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '50')
      if (searchTerm) params.set('q', searchTerm)
      
      const response = await fetch(`/api/soportes?${params}`)
      
      if (response.ok) {
        const result = await response.json()
        const supportsData = result.data || result
        setSupports(Array.isArray(supportsData) ? supportsData : [])
        setPagination(result.pagination || pagination)
        setCurrentPage(page)
        setError(null)
      } else {
        setError('Error al cargar los soportes')
        toast.error('Error al cargar los soportes')
      }
    } catch (error) {
      setError('Error de conexión')
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSupports(1)
  }, [searchTerm])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSoportes(supports.map(s => s.id))
    } else {
      setSelectedSoportes([])
    }
  }

  const handleSelectSoporte = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedSoportes([...selectedSoportes, id])
    } else {
      setSelectedSoportes(selectedSoportes.filter(s => s !== id))
    }
  }

  // Funciones de paginación
  const handlePageChange = (page: number) => {
    fetchSupports(page)
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

  // Convertir soportes a costes y filtrar
  const soportesCostes = supports.map(calculateCosts)
  const filteredSoportes = soportesCostes.filter(soporte =>
    soporte.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    soporte.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    soporte.propietario.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Cálculos del panel superior
  const totalCostos = soportesCostes.reduce((sum, soporte) => sum + soporte.costoTotal, 0)
  const potencialVentas = soportesCostes.reduce((sum, soporte) => sum + soporte.precioVenta, 0)
  
  // Ingresos solo de soportes ocupados
  const soportesOcupados = supports.filter(s => s.status === 'Ocupado')
  const ingresoTotal = soportesOcupados.reduce((sum, s) => sum + (s.priceMonth || 0), 0)
  
  // % Beneficio = (Ingresos Ocupados - Costes Totales) / Costes Totales * 100
  const beneficioReal = ingresoTotal - totalCostos
  const porcentajeBeneficioTotal = totalCostos > 0 ? (beneficioReal / totalCostos) * 100 : 0

  return (
    <div className="p-6">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
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
                className="text-sm font-medium text-gray-600 hover:text-[#D54644] transition-colors"
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
                className="text-sm font-medium text-[#D54644] hover:text-[#D54644]/80 transition-colors"
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
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Gestión de Costes</h1>
          <p className="text-gray-600">Controla los costes y rentabilidad de los soportes publicitarios</p>
        </div>

        {/* Resumen de Costes */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Costes</p>
                  <p className="text-2xl font-bold text-red-600">
                    Bs {totalCostos.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Potencial de Ventas</p>
                  <p className="text-2xl font-bold text-blue-600">
                    Bs {potencialVentas.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ingreso Total</p>
                  <p className="text-2xl font-bold text-green-600">
                    Bs {ingresoTotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">% Beneficio</p>
                  <p className={`text-2xl font-bold ${getBeneficioColor(porcentajeBeneficioTotal)}`}>
                    {porcentajeBeneficioTotal.toFixed(1)}%
                  </p>
                </div>
                {getBeneficioIcon(porcentajeBeneficioTotal)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar soportes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 max-w-64"
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
              <Button className="bg-[#D54644] hover:bg-[#B03A38] text-white">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Coste
              </Button>
            </div>
          </div>
        </div>

        {/* Tabla de Costes */}
        <Card>
          <CardHeader>
            <CardTitle>Costes por Soporte</CardTitle>
            <CardDescription>
              {loading ? 'Cargando...' : `${filteredSoportes.length} soportes encontrados`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D54644] mx-auto mb-4"></div>
                  <p className="text-gray-600">Cargando soportes...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <p className="text-red-600 mb-4">Error al cargar los soportes</p>
                  <Button onClick={fetchSupports} variant="outline">
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
                          checked={selectedSoportes.length === soportesCostes.length && soportesCostes.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                      <th className="text-left py-2 px-3 font-medium text-gray-900">Código</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-900">Título</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-900">Propietario</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-900">Coste Mensual</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-900">Luz</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-900">Patentes</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-900">Comisión</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-900">Otros</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-900">Coste Total</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-900">Precio Venta</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-900">% Beneficio</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-900">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSoportes.length === 0 ? (
                      <tr>
                        <td colSpan={13} className="text-center py-8 text-gray-500">
                          {searchTerm ? 'No se encontraron soportes con ese criterio de búsqueda' : 'No hay soportes disponibles'}
                        </td>
                      </tr>
                    ) : (
                      filteredSoportes.map((soporte) => (
                        <tr key={soporte.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-3">
                            <Checkbox
                              checked={selectedSoportes.includes(soporte.id)}
                              onCheckedChange={(checked) => handleSelectSoporte(soporte.id, checked as boolean)}
                            />
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-1 font-mono text-xs text-gray-800 border border-neutral-200">
                              {soporte.codigo}
                            </span>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            {soporte.titulo?.length > 40 ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger className="text-left">
                                    {soporte.titulo.slice(0, 40) + '…'}
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-sm">{soporte.titulo}</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (soporte.titulo || '—')}
                          </td>
                          <td className="py-2 px-3">
                            {soporte.propietario ? (
                              <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ${
                                soporte.propietario.trim().toLowerCase() === 'imagen' ? 'bg-pink-100 text-pink-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {soporte.propietario}
                              </span>
                            ) : (
                              <span className="text-gray-500">—</span>
                            )}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span className="font-medium">Bs {soporte.costeMensual.toFixed(2)}</span>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            {soporte.tieneIluminacion ? (
                              <span>Bs {soporte.luz.toFixed(2)}</span>
                            ) : (
                              <span className="text-gray-500">—</span>
                            )}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span>Bs {soporte.patentes.toFixed(2)}</span>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span>Bs {soporte.comision.toFixed(2)}</span>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span>Bs {soporte.otros.toFixed(2)}</span>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span className="font-medium text-red-600">Bs {soporte.costoTotal.toFixed(2)}</span>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span className="font-medium text-green-600">Bs {soporte.precioVenta.toFixed(2)}</span>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <div className={`flex items-center gap-1 ${getBeneficioColor(soporte.porcentajeBeneficio)}`}>
                              {getBeneficioIcon(soporte.porcentajeBeneficio)}
                              <span className="font-medium">{soporte.porcentajeBeneficio.toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
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
      </main>
    </div>
  )
}
