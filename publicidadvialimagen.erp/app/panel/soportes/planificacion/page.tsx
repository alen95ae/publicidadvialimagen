"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { 
  Search, 
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { toast } from "sonner"
import { Toaster } from "sonner"

const meses = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
]

// Estados válidos para alquileres con colores
const ESTADOS_ALQUILER = {
  'activo': { label: 'Activo', className: 'bg-green-100 text-green-800' },
  'reservado': { label: 'Reservado', className: 'bg-yellow-100 text-yellow-800' },
  'proximo': { label: 'Próximo', className: 'bg-purple-100 text-purple-800' },
  'finalizado': { label: 'Finalizado', className: 'bg-gray-100 text-gray-800' },
} as const

const getMesIndex = (mes: string) => meses.indexOf(mes)

// Función para obtener el mes de inicio de un alquiler en un año específico
// Si el alquiler empieza antes del año, devuelve enero. Si empieza durante el año, devuelve el mes correspondiente.
const getMesInicioAlquiler = (inicio: string, fin: string, año: number): string | null => {
  try {
    const inicioDate = new Date(inicio)
    const finDate = new Date(fin)
    const añoInicio = `${año}-01-01`
    const añoFin = `${año}-12-31`
    const añoInicioDate = new Date(añoInicio)
    const añoFinDate = new Date(añoFin)
    
    // Si el alquiler no se solapa con el año, retornar null
    if (inicioDate > añoFinDate || finDate < añoInicioDate) {
      return null
    }
    
    // Si el alquiler empieza antes del año, el mes de inicio es enero
    if (inicioDate < añoInicioDate) {
      return meses[0] // enero
    }
    
    // Si el alquiler empieza durante el año, devolver el mes correspondiente
    const fechaAño = inicioDate.getFullYear()
    const fechaMes = inicioDate.getMonth() // 0-11
    
    if (fechaAño === año) {
      return meses[fechaMes]
    }
    
    return null
  } catch {
    return null
  }
}

// Función para calcular duración en meses entre dos fechas
const calcularDuracionMeses = (inicio: string, fin: string): number => {
  try {
    const inicioDate = new Date(inicio)
    const finDate = new Date(fin)
    
    const yearDiff = finDate.getFullYear() - inicioDate.getFullYear()
    const monthDiff = finDate.getMonth() - inicioDate.getMonth()
    
    return yearDiff * 12 + monthDiff + 1 // +1 porque incluye ambos meses
  } catch {
    return 1
  }
}

// Función para calcular la duración de un alquiler dentro de un año específico
const calcularDuracionEnAño = (inicio: string, fin: string, año: number): number => {
  try {
    const inicioDate = new Date(inicio)
    const finDate = new Date(fin)
    const añoInicio = `${año}-01-01`
    const añoFin = `${año}-12-31`
    const añoInicioDate = new Date(añoInicio)
    const añoFinDate = new Date(añoFin)
    
    // Fecha de inicio efectiva: máximo entre inicio del alquiler e inicio del año
    const inicioEfectivo = inicioDate < añoInicioDate ? añoInicioDate : inicioDate
    
    // Fecha de fin efectiva: mínimo entre fin del alquiler y fin del año
    const finEfectivo = finDate > añoFinDate ? añoFinDate : finDate
    
    // Calcular meses entre fechas efectivas
    const yearDiff = finEfectivo.getFullYear() - inicioEfectivo.getFullYear()
    const monthDiff = finEfectivo.getMonth() - inicioEfectivo.getMonth()
    
    return Math.max(1, yearDiff * 12 + monthDiff + 1)
  } catch {
    return 1
  }
}

interface Alquiler {
  id: string
  codigo: string
  cotizacion_id: string
  cliente: string | null
  vendedor: string | null
  soporte_id: string | number
  soporte_codigo?: string | null
  soporte_titulo?: string | null
  soporte_ciudad?: string | null
  inicio: string
  fin: string
  meses: number | null
  total: number | null
  estado: string | null
}

interface SoportePlanificacion {
  id: string | number
  codigo: string
  titulo: string
  ciudad?: string | null
  alquileres: Array<{
    id: string
    codigo: string
    cotizacion_id: string
    cliente: string | null
    vendedor: string | null
    soporte_codigo: string | null
    inicio: string
    fin: string
    meses: number | null
    total: number | null
    estado: string | null
    mes: string
    duracion: number
  }>
}

export default function PlanificacionPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [año, setAño] = useState(new Date().getFullYear())
  const [filtroVendedor, setFiltroVendedor] = useState("all")
  const [filtroEstado, setFiltroEstado] = useState("all")
  const [agrupador, setAgrupador] = useState<"ninguno" | "vendedor" | "cliente" | "soporte" | "estado" | "ciudad">("ninguno")
  const [soportesPlanificacion, setSoportesPlanificacion] = useState<SoportePlanificacion[]>([])
  const [vendedoresUnicos, setVendedoresUnicos] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })

  // Cargar alquileres desde la API
  const loadAlquileres = async () => {
    try {
      setLoading(true)
      
      // Obtener todos los alquileres del año haciendo múltiples llamadas si es necesario
      const fechaInicio = `${año}-01-01`
      const fechaFin = `${año}-12-31`
      
      let allAlquileres: Alquiler[] = []
      let page = 1
      const pageSize = 1000
      let hasMore = true
      
      while (hasMore) {
        const params = new URLSearchParams()
        params.set('page', page.toString())
        params.set('pageSize', pageSize.toString())
        params.set('fecha_inicio', fechaInicio)
        params.set('fecha_fin', fechaFin)
        
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
        
        const response = await fetch(`/api/alquileres?${params.toString()}`)
        const data = await response.json()
        
        if (data.success) {
          const alquileres: Alquiler[] = data.data || []
          allAlquileres = [...allAlquileres, ...alquileres]
          
          // Si recibimos menos items que el pageSize, no hay más páginas
          hasMore = alquileres.length === pageSize && data.pagination?.hasNext
          page++
        } else {
          hasMore = false
        }
      }
      
      if (allAlquileres.length > 0) {
        const alquileres: Alquiler[] = allAlquileres
        
        // Agrupar alquileres por soporte
        const soportesMap = new Map<string | number, SoportePlanificacion>()
        
        alquileres.forEach((alquiler) => {
          const soporteId = alquiler.soporte_id
          const mesInicio = getMesInicioAlquiler(alquiler.inicio, alquiler.fin, año)
          
          if (!mesInicio) return // Si no se solapa con el año, saltar
          
          if (!soportesMap.has(soporteId)) {
            soportesMap.set(soporteId, {
              id: soporteId,
              codigo: alquiler.soporte_codigo || `SOP-${soporteId}`,
              titulo: alquiler.soporte_titulo || 'Sin título',
              ciudad: alquiler.soporte_ciudad || null,
              alquileres: []
            })
          }
          
          const soporte = soportesMap.get(soporteId)!
          // Calcular duración solo para los meses dentro del año
          const duracion = calcularDuracionEnAño(alquiler.inicio, alquiler.fin, año)
          
          soporte.alquileres.push({
            id: alquiler.id,
            codigo: alquiler.codigo,
            cotizacion_id: alquiler.cotizacion_id,
            cliente: alquiler.cliente,
            vendedor: alquiler.vendedor,
            soporte_codigo: alquiler.soporte_codigo,
            inicio: alquiler.inicio,
            fin: alquiler.fin,
            meses: alquiler.meses,
            total: alquiler.total,
            estado: alquiler.estado,
            mes: mesInicio,
            duracion: duracion
          })
        })
        
        const soportesArray = Array.from(soportesMap.values())
        
        // Actualizar listas únicas para los filtros
        const nuevosVendedores = Array.from(new Set(alquileres.map(a => a.vendedor).filter(Boolean))) as string[]
        setVendedoresUnicos(prev => {
          const combined = [...new Set([...prev, ...nuevosVendedores])]
          return combined.sort()
        })
        
        // Aplicar paginación
        const total = soportesArray.length
        const totalPages = Math.ceil(total / 100)
        const from = (currentPage - 1) * 100
        const to = from + 100
        const paginatedSoportes = soportesArray.slice(from, to)
        
        setSoportesPlanificacion(paginatedSoportes)
        setPagination({
          page: currentPage,
          limit: 100,
          total,
          totalPages,
          hasNext: currentPage < totalPages,
          hasPrev: currentPage > 1
        })
      } else {
        toast.error('Error al cargar los alquileres')
      }
    } catch (error) {
      console.error('Error loading alquileres:', error)
      toast.error('Error al cargar los alquileres')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [año, searchTerm, filtroVendedor, filtroEstado, agrupador])

  useEffect(() => {
    loadAlquileres()
  }, [año, searchTerm, filtroVendedor, filtroEstado, currentPage])

  const filteredSoportes = soportesPlanificacion.filter(soporte => {
    const matchesSearch = soporte.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      soporte.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      soporte.alquileres.some(a => 
        (a.cliente && a.cliente.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (a.vendedor && a.vendedor.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (a.codigo && a.codigo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (a.soporte_codigo && a.soporte_codigo.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    
    return matchesSearch
  })

  // Función para agrupar soportes
  const agruparSoportes = (soportes: SoportePlanificacion[]) => {
    if (agrupador === "ninguno") {
      return [{ grupo: null, soportes }]
    }

    const gruposMap = new Map<string, SoportePlanificacion[]>()
    
    soportes.forEach(soporte => {
      let grupoKey: string
      
      switch (agrupador) {
        case "vendedor":
          // Agrupar por vendedor del primer alquiler (o todos los vendedores únicos)
          const vendedores = [...new Set(soporte.alquileres.map(a => a.vendedor).filter(Boolean))]
          grupoKey = vendedores.length > 0 ? vendedores.join(", ") : "Sin vendedor"
          break
        case "cliente":
          // Agrupar por cliente del primer alquiler (o todos los clientes únicos)
          const clientes = [...new Set(soporte.alquileres.map(a => a.cliente).filter(Boolean))]
          grupoKey = clientes.length > 0 ? clientes.join(", ") : "Sin cliente"
          break
        case "soporte":
          grupoKey = soporte.codigo
          break
        case "estado":
          // Agrupar por estado del primer alquiler (o todos los estados únicos)
          const estados = [...new Set(soporte.alquileres.map(a => a.estado).filter(Boolean))]
          grupoKey = estados.length > 0 ? estados.join(", ") : "Sin estado"
          break
        case "ciudad":
          grupoKey = soporte.ciudad || "Sin ciudad"
          break
        default:
          grupoKey = "Otros"
      }
      
      if (!gruposMap.has(grupoKey)) {
        gruposMap.set(grupoKey, [])
      }
      gruposMap.get(grupoKey)!.push(soporte)
    })
    
    // Convertir a array y ordenar
    const grupos = Array.from(gruposMap.entries()).map(([grupo, soportes]) => ({
      grupo,
      soportes
    }))
    
    // Ordenar grupos alfabéticamente
    grupos.sort((a, b) => a.grupo.localeCompare(b.grupo))
    
    return grupos
  }

  const gruposSoportes = agruparSoportes(filteredSoportes)

  // Función para detectar si dos alquileres se solapan
  const seSolapan = (alq1: { mes: string; duracion: number }, alq2: { mes: string; duracion: number }): boolean => {
    const inicio1 = getMesIndex(alq1.mes)
    const fin1 = inicio1 + alq1.duracion - 1
    const inicio2 = getMesIndex(alq2.mes)
    const fin2 = inicio2 + alq2.duracion - 1
    
    // Se solapan si: inicio1 <= fin2 && inicio2 <= fin1
    return inicio1 <= fin2 && inicio2 <= fin1
  }

  // Función para agrupar alquileres en filas según solapamientos
  const agruparEnFilas = (alquileres: SoportePlanificacion['alquileres']) => {
    const filas: Array<Array<SoportePlanificacion['alquileres'][0] & { fila: number }>> = []
    
    alquileres.forEach((alq) => {
      // Buscar la primera fila donde no se solape con ningún alquiler existente
      let filaEncontrada = false
      for (let i = 0; i < filas.length; i++) {
        const noSeSolapaConNinguno = filas[i].every((alqExistente) => !seSolapan(alq, alqExistente))
        if (noSeSolapaConNinguno) {
          filas[i].push({ ...alq, fila: i })
          filaEncontrada = true
          break
        }
      }
      
      // Si no se encontró una fila, crear una nueva
      if (!filaEncontrada) {
        filas.push([{ ...alq, fila: filas.length }])
      }
    })
    
    return filas.flat() // Aplanar para tener todos los alquileres con su número de fila
  }

  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES')
  }

  // Función para formatear precio
  const formatPrice = (price: number | null) => {
    if (price === null) return '0.00 Bs'
    return new Intl.NumberFormat("es-ES", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price) + ' Bs'
  }

  // Funciones de paginación
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
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

  return (
    <div className="p-6">
      <Toaster />
      {/* Main Content */}
      <main className="w-full max-w-full px-4 sm:px-6 py-8 overflow-hidden">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Planificación Anual</h1>
          <p className="text-gray-600">Visualiza la ocupación de soportes publicitarios a lo largo del año</p>
        </div>

        {/* Controls */}
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
                  className="pl-10 w-64"
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

              {/* Agrupador */}
              <Select value={agrupador} onValueChange={(value) => setAgrupador(value as typeof agrupador)}>
                <SelectTrigger className="w-48 [&>span]:text-black">
                  <SelectValue placeholder="Agrupar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ninguno">Sin agrupación</SelectItem>
                  <SelectItem value="vendedor">Vendedor</SelectItem>
                  <SelectItem value="cliente">Cliente</SelectItem>
                  <SelectItem value="soporte">Soporte</SelectItem>
                  <SelectItem value="estado">Estado</SelectItem>
                  <SelectItem value="ciudad">Ciudad</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setAño(año - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-lg font-semibold min-w-[80px] text-center">{año}</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setAño(año + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Línea de Tiempo - {año} ({filteredSoportes.length})</CardTitle>
            <CardDescription>
              Ocupación de soportes publicitarios por mes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D54644] mx-auto mb-4"></div>
                  <p className="text-gray-600">Cargando planificación...</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-0 w-full">
                  {/* Header con meses */}
                  <div className="flex border-b border-gray-200 mb-4">
                    <div className="flex-shrink-0 w-48 p-3 font-medium text-gray-900 border-r border-gray-200">
                      Soporte
                    </div>
                    <div className="flex-1 flex">
                      {meses.map((mes) => (
                        <div key={mes} className="flex-1 p-2 text-center font-medium text-gray-900 border-r border-gray-200 text-xs">
                          {mes.charAt(0).toUpperCase() + mes.slice(1)}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Filas de soportes */}
                  {filteredSoportes.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      {searchTerm ? 'No se encontraron soportes con ese criterio de búsqueda' : 'No hay alquileres para este año'}
                    </div>
                  ) : (
                    gruposSoportes.map((grupoData, grupoIndex) => (
                      <div key={grupoIndex}>
                        {grupoData.grupo && (
                          <div className="bg-gray-100 border-b-2 border-gray-300 py-2 px-3 font-semibold text-gray-700 sticky top-0 z-10">
                            {agrupador === "estado" && grupoData.grupo !== "Sin estado" ? (
                              <div className="flex items-center gap-2">
                                <span className={`inline-block w-3 h-3 rounded-full ${ESTADOS_ALQUILER[grupoData.grupo as keyof typeof ESTADOS_ALQUILER]?.className || 'bg-gray-100'}`}></span>
                                {ESTADOS_ALQUILER[grupoData.grupo as keyof typeof ESTADOS_ALQUILER]?.label || grupoData.grupo}
                                <span className="text-sm font-normal text-gray-500">({grupoData.soportes.length})</span>
                              </div>
                            ) : (
                              <span>
                                {grupoData.grupo}
                                <span className="text-sm font-normal text-gray-500 ml-2">({grupoData.soportes.length})</span>
                              </span>
                            )}
                          </div>
                        )}
                        {grupoData.soportes.map((soporte) => (
                      <div key={soporte.id} className="flex border-b border-gray-100 hover:bg-gray-50">
                        {/* Información del soporte */}
                        <div className="flex-shrink-0 w-48 p-3 border-r border-gray-200">
                          <div className="space-y-1">
                            <div>
                              {soporte.titulo ? (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger className="text-left">
                                      <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-1 font-mono text-xs text-gray-800 border border-neutral-200">
                                        {soporte.codigo}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-sm">{soporte.titulo}</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ) : (
                                <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-1 font-mono text-xs text-gray-800 border border-neutral-200">
                                  {soporte.codigo}
                                </span>
                              )}
                            </div>
                            <div>
                              {soporte.titulo && soporte.titulo.length > 15 ? (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger className="text-left">
                                      <span className="text-sm text-gray-600">{soporte.titulo.slice(0, 15) + '…'}</span>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-sm">{soporte.titulo}</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ) : (
                                <span className="text-sm text-gray-600">{soporte.titulo || 'Sin título'}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Reservas por mes - Contenedor relativo para posicionamiento absoluto */}
                        {(() => {
                          // Agrupar alquileres en filas según solapamientos
                          const alquileresConFila = agruparEnFilas(soporte.alquileres)
                          const numFilas = Math.max(...alquileresConFila.map(a => a.fila), -1) + 1
                          const alturaFila = 56 // Altura de cada fila (aumentada para que no se corte)
                          const alturaTotal = Math.max(60, numFilas * alturaFila + 8)
                          
                          return (
                            <div className="flex-1 relative" style={{ minHeight: `${alturaTotal}px` }}>
                              {/* Celdas de meses como grid para mantener el ancho uniforme */}
                              <div className="absolute inset-0 flex">
                                {meses.map((mes) => (
                                  <div key={mes} className="flex-shrink-0 flex-1 border-r border-gray-200"></div>
                                ))}
                              </div>
                              
                              {/* Alquileres posicionados absolutamente para que se estiren sin interrupción */}
                              <div className="relative h-full p-1">
                                {alquileresConFila.map((reserva) => {
                                  const mesInicioIndex = getMesIndex(reserva.mes)
                                  const anchoMes = 100 / 12 // Porcentaje de ancho por mes
                                  const left = mesInicioIndex * anchoMes
                                  const width = reserva.duracion * anchoMes
                                  
                                  return (
                                    <TooltipProvider key={reserva.id}>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div
                                            className="absolute bg-blue-500 text-white text-xs p-2 rounded cursor-pointer hover:bg-blue-600 transition-colors"
                                            style={{
                                              left: `${left}%`,
                                              width: `${width}%`,
                                              top: `${reserva.fila * alturaFila + 4}px`, // Posición según la fila asignada
                                              height: `${alturaFila - 8}px`, // Altura de la barra (con padding)
                                              zIndex: 10
                                            }}
                                          >
                                            <div className="font-medium truncate leading-tight">
                                              {reserva.cliente && reserva.cliente.length > 8 ? reserva.cliente.substring(0, 8) + '...' : (reserva.cliente || 'Sin cliente')}
                                            </div>
                                            <div className="text-xs opacity-75 leading-tight mt-0.5">
                                              {reserva.duracion} mes{reserva.duracion > 1 ? 'es' : ''}
                                            </div>
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent className="w-80 bg-white p-4 shadow-lg" side="top" align="start">
                                          <div className="space-y-2">
                                            <div className="font-semibold text-sm border-b pb-2 text-gray-900">Detalles del Alquiler</div>
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                              <div>
                                                <span className="font-medium text-gray-600">Código:</span>
                                                <div className="text-gray-900">{reserva.codigo}</div>
                                              </div>
                                              <div>
                                                <span className="font-medium text-gray-600">Estado:</span>
                                                <div className="text-gray-900">{reserva.estado || '-'}</div>
                                              </div>
                                              <div>
                                                <span className="font-medium text-gray-600">Inicio:</span>
                                                <div className="text-gray-900">{formatDate(reserva.inicio)}</div>
                                              </div>
                                              <div>
                                                <span className="font-medium text-gray-600">Fin:</span>
                                                <div className="text-gray-900">{formatDate(reserva.fin)}</div>
                                              </div>
                                              <div>
                                                <span className="font-medium text-gray-600">Meses:</span>
                                                <div className="text-gray-900">{reserva.meses || reserva.duracion}</div>
                                              </div>
                                              <div>
                                                <span className="font-medium text-gray-600">Soporte:</span>
                                                <div className="text-gray-900">{reserva.soporte_codigo || '-'}</div>
                                              </div>
                                              <div className="col-span-2">
                                                <span className="font-medium text-gray-600">Cliente:</span>
                                                <div className="text-gray-900">{reserva.cliente || '-'}</div>
                                              </div>
                                              <div className="col-span-2">
                                                <span className="font-medium text-gray-600">Vendedor:</span>
                                                <div className="text-gray-900">{reserva.vendedor || '-'}</div>
                                              </div>
                                              <div className="col-span-2">
                                                <span className="font-medium text-gray-600">Total:</span>
                                                <div className="text-gray-900 font-semibold">{formatPrice(reserva.total)}</div>
                                              </div>
                                            </div>
                                          </div>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                        ))}
                      </div>
                    ))
                  )}
                </div>
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
                  Mostrando {((currentPage - 1) * 100) + 1} - {Math.min(currentPage * 100, pagination.total)} de {pagination.total} items
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
