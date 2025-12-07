"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { usePermisosContext } from "@/hooks/permisos-provider"
import { 
  DollarSign, 
  Search, 
  Filter, 
  Download, 
  TrendingUp,
  TrendingDown
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
  // Nuevos campos de costes
  duenoCasa: string | null
  temporalidadPago: string | null
  metodoPago: string | null
  estructura: string | null
  costeAlquiler: number | null
  patentes: number | null
  usoSuelos: number | null
  luz: string | null
  gastosAdministrativos: number | null
  comisionEjecutiva: number | null
  mantenimiento: number | null
  notas: string | null
}

// Interface para los costes calculados
interface SupportCosts {
  id: string
  codigo: string
  titulo: string
  propietario: string
  duenoCasa: string
  temporalidadPago: string
  metodoPago: string
  notas: string
  estructura: string
  costeAlquiler: number
  patentes: number
  usoSuelos: number
  luz: string
  gastosAdministrativos: number
  comisionEjec: number
  mantenimiento: number
  impuestos18: number
  costoTotal: number
  precioVenta: number
  porcentajeBeneficio: number
  utilidadMensual: number
  utilidadAnual: number
  ultimoPrecio: number | null
  porcentajeUtilidadReal: number | null
  estadoAlquiler: 'activo' | 'reservado' | 'proximo' | 'finalizado' | null
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
  const { puedeEditar, loading: permisosLoading } = usePermisosContext()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSoportes, setSelectedSoportes] = useState<string[]>([])
  const [supports, setSupports] = useState<Support[]>([])
  const [allSupports, setAllSupports] = useState<Support[]>([]) // Todos los soportes para el dashboard
  const [filteredSupports, setFilteredSupports] = useState<Support[]>([]) // Soportes filtrados para la tabla
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50
  
  // Estados para edición en línea
  const [editedSupports, setEditedSupports] = useState<Record<string, Partial<Support>>>({})
  const [savingChanges, setSavingChanges] = useState(false)
  
  // Estados para filtros
  const [filtroCiudad, setFiltroCiudad] = useState<string>("all")
  const [filtroMetodoPago, setFiltroMetodoPago] = useState<string>("all")
  const [filtroPropietario, setFiltroPropietario] = useState<string>("all")
  const [filtroEstado, setFiltroEstado] = useState<string>("all")
  const [ciudadesUnicas, setCiudadesUnicas] = useState<string[]>([])
  
  // Estados para datos de alquileres
  const [alquileresData, setAlquileresData] = useState<Record<string, { ultimoPrecio: number | null, estado: 'activo' | 'reservado' | 'proximo' | 'finalizado' | null }>>({})

  // Opciones de método de pago
  const METODO_PAGO_OPTIONS = [
    "FIJO",
    "CUANDO SE ALQUILA",
    "NO SE PAGA"
  ] as const

  // Función auxiliar para redondear a 2 decimales
  const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

  // Función para obtener datos de alquileres para un soporte
  const fetchAlquileresForSupport = async (supportId: string) => {
    try {
      const response = await fetch(`/api/alquileres?soporte_id=${supportId}&pageSize=1000`)
      if (response.ok) {
        const result = await response.json()
        const alquileres = result.data || []
        
        if (alquileres.length > 0) {
          // Ordenar por fecha de inicio descendente para obtener el más reciente (fecha más avanzada)
          const sortedAlquileres = alquileres.sort((a: any, b: any) => {
            const dateA = a.inicio ? new Date(a.inicio).getTime() : 0
            const dateB = b.inicio ? new Date(b.inicio).getTime() : 0
            return dateB - dateA
          })
          
          const ultimoAlquiler = sortedAlquileres[0]
          // Calcular precio mensual: total / meses
          const precioMensual = ultimoAlquiler.meses && ultimoAlquiler.meses > 0 
            ? (ultimoAlquiler.total || 0) / ultimoAlquiler.meses 
            : null
          
          return {
            ultimoPrecio: precioMensual,
            estado: ultimoAlquiler.estado || null
          }
        }
      }
    } catch (error) {
      console.error(`Error obteniendo alquileres para soporte ${supportId}:`, error)
    }
    return { ultimoPrecio: null, estado: null }
  }

  // Cargar datos de alquileres para todos los soportes
  const loadAlquileresData = async (supports: Support[]) => {
    const alquileresMap: Record<string, { ultimoPrecio: number | null, estado: 'activo' | 'reservado' | 'proximo' | 'finalizado' | null }> = {}
    
    // Cargar en paralelo con límite de concurrencia
    const batchSize = 10
    for (let i = 0; i < supports.length; i += batchSize) {
      const batch = supports.slice(i, i + batchSize)
      await Promise.all(
        batch.map(async (support) => {
          const data = await fetchAlquileresForSupport(support.id)
          alquileresMap[support.id] = data
        })
      )
    }
    
    setAlquileresData(alquileresMap)
  }

  // Función para calcular costes basados en datos reales (siguiendo lógica de calculadora de precios)
  const calculateCosts = (support: Support): SupportCosts => {
    const precioVenta = support.priceMonth || 0
    
    // Obtener valores de la base de datos
    const costeAlquiler = support.costeAlquiler || 0
    const patentes = support.patentes || 0
    const usoSuelos = support.usoSuelos || 0
    const luzTexto = support.luz || "0"
    const luz = parseFloat(luzTexto) || 0
    const gastosAdministrativos = support.gastosAdministrativos || 0
    const comisionEjec = support.comisionEjecutiva || 0
    const mantenimiento = support.mantenimiento || 0
    
    // COSTE = Suma de todos los costes (equivalente a "coste" en calculadora de precios)
    const coste = round2(costeAlquiler + patentes + usoSuelos + luz + gastosAdministrativos + comisionEjec + mantenimiento)
    
    // IMPUESTOS 18% = equivalente a factura + IUE en calculadora, se extrae del PRECIO (no del coste)
    // En la calculadora: factura = precio * 16%, iue = precio * 2% (total 18%)
    const impuestos18 = round2(precioVenta * 0.18)
    
    // COSTE TOTAL = coste + impuestos 18% (equivalente a costosTotales = coste + factura + iue en calculadora)
    const costoTotal = round2(coste + impuestos18)
    
    // UTILIDAD BRUTA = precio - coste total (equivalente a utilidadBruta en calculadora)
    const utilidadBruta = round2(precioVenta - costoTotal)
    
    // UTILIDAD NETA = utilidad bruta (la comisión ejecutiva ya está incluida en el coste, no se resta)
    // En la calculadora: utilidadNeta = utilidadBruta - comision
    // Aquí: como comisionEjec ya está en el coste, la utilidad neta es igual a la utilidad bruta
    const utilidadMensual = utilidadBruta
    
    // % UTILIDAD NETA = (utilidadNeta / precio) * 100 (equivalente a % utilidad neta en calculadora)
    // Caso especial: si coste total es 0 y precio de venta > 1, mostrar 100%
    let porcentajeBeneficio = 0
    if (costoTotal === 0 && precioVenta > 1) {
      porcentajeBeneficio = 100
    } else if (precioVenta > 0) {
      porcentajeBeneficio = round2((utilidadMensual / precioVenta) * 100)
    }
    
    // Utilidad anual = utilidad mensual * 12
    const utilidadAnual = round2(utilidadMensual * 12)

    return {
      id: support.id,
      codigo: support.code,
      titulo: support.title,
      propietario: support.owner || "Imagen",
      duenoCasa: support.duenoCasa || "",
      temporalidadPago: support.temporalidadPago || "-",
      metodoPago: support.metodoPago || "-",
      notas: support.notas || "",
      estructura: support.estructura || "",
      costeAlquiler,
      patentes,
      usoSuelos,
      luz: luzTexto,
      gastosAdministrativos,
      comisionEjec,
      mantenimiento,
      impuestos18,
      costoTotal,
      precioVenta,
      porcentajeBeneficio,
      utilidadMensual,
      utilidadAnual,
      ultimoPrecio: alquileresData[support.id]?.ultimoPrecio || null,
      porcentajeUtilidadReal: (() => {
        const ultimoPrecio = alquileresData[support.id]?.ultimoPrecio || null
        if (ultimoPrecio === null || ultimoPrecio === 0) return null
        // Calcular % utilidad real = (utilidad mensual / último precio) * 100
        // Pero necesitamos recalcular la utilidad mensual con el último precio
        const utilidadMensualReal = round2(ultimoPrecio - costoTotal)
        return round2((utilidadMensualReal / ultimoPrecio) * 100)
      })(),
      estadoAlquiler: alquileresData[support.id]?.estado || null
    }
  }

  // Cargar todos los soportes para el dashboard (sin paginación)
  const fetchAllSupports = async () => {
    try {
      const params = new URLSearchParams()
      params.set('page', '1')
      params.set('limit', '10000') // Límite alto para obtener todos
      if (filtroCiudad !== 'all') params.set('city', filtroCiudad)
      
      const response = await fetch(`/api/soportes?${params}`)
      
      if (response.ok) {
        const result = await response.json()
        const supportsData = result.data || result
        setAllSupports(Array.isArray(supportsData) ? supportsData : [])
      }
    } catch (error) {
      console.error('Error cargando todos los soportes:', error)
    }
  }

  // Cargar todos los soportes desde la API (sin paginación para aplicar filtros)
  const fetchSupports = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('page', '1')
      params.set('limit', '10000') // Cargar todos para filtrar en frontend
      if (filtroCiudad !== 'all') params.set('city', filtroCiudad)
      
      const response = await fetch(`/api/soportes?${params}`)
      
      if (response.ok) {
        const result = await response.json()
        const supportsData = result.data || result
        const allData = Array.isArray(supportsData) ? supportsData : []
        setSupports(allData)
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

  // Cargar ciudades únicas al inicio
  useEffect(() => {
    const loadCiudades = async () => {
      try {
        const params = new URLSearchParams()
        params.set('page', '1')
        params.set('limit', '10000')
        const response = await fetch(`/api/soportes?${params}`)
        if (response.ok) {
          const result = await response.json()
          const supportsData = result.data || result
          const allData = Array.isArray(supportsData) ? supportsData : []
          const ciudades = Array.from(new Set(allData.map((s: Support) => s.city).filter(Boolean))) as string[]
          setCiudadesUnicas(ciudades.sort())
        }
      } catch (error) {
        console.error('Error cargando ciudades:', error)
      }
    }
    loadCiudades()
  }, [])

  // Actualizar cuando cambian los filtros que requieren recarga del servidor
  useEffect(() => {
    fetchAllSupports() // Cargar todos para el dashboard
    fetchSupports() // Cargar todos para aplicar filtros
  }, [filtroCiudad])

  // Cargar datos de alquileres cuando se cargan los soportes
  useEffect(() => {
    if (supports.length > 0) {
      loadAlquileresData(supports)
    }
  }, [supports])

  // Aplicar filtros a todos los soportes cargados
  useEffect(() => {
    // Aplicar ediciones antes de filtrar
    const supportsWithEdits = supports.map(support => {
      if (editedSupports[support.id]) {
        return { ...support, ...editedSupports[support.id] }
      }
      return support
    })

    // Aplicar todos los filtros
    let filtered = supportsWithEdits.filter(support => {
      // Filtro de búsqueda
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const matchesSearch = 
          (support.code || '').toLowerCase().includes(searchLower) ||
          (support.title || '').toLowerCase().includes(searchLower) ||
          (support.owner || '').toLowerCase().includes(searchLower)
        if (!matchesSearch) return false
      }

      // Filtro por método de pago
      if (filtroMetodoPago !== 'all') {
        const metodoPago = support.metodoPago || "-"
        if (metodoPago !== filtroMetodoPago) return false
      }

      // Filtro por propietario
      if (filtroPropietario !== 'all') {
        const propietario = (support.owner || "").trim().toLowerCase()
        if (filtroPropietario === 'imagen') {
          if (propietario !== 'imagen') return false
        } else if (filtroPropietario === 'otros') {
          if (propietario === 'imagen' || !propietario) return false
        }
      }

      return true
    })

    // Aplicar filtro de estado después de calcular costes (necesitamos el estado del alquiler)
    let filteredWithEstado = filtered
    if (filtroEstado !== 'all') {
      filteredWithEstado = filtered.filter(support => {
        const estado = alquileresData[support.id]?.estado || null
        return estado === filtroEstado
      })
    }

    setFilteredSupports(filteredWithEstado)
    setCurrentPage(1) // Resetear a primera página cuando cambian los filtros
  }, [supports, searchTerm, filtroMetodoPago, filtroPropietario, filtroEstado, editedSupports, alquileresData])

  // Paginación en frontend
  const totalPages = Math.ceil(filteredSupports.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedSupports = filteredSupports.slice(startIndex, endIndex)

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSoportes(paginatedSupports.map(s => s.id))
    } else {
      setSelectedSoportes([])
    }
  }

  const handleSelectSoporte = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedSoportes([...selectedSoportes, id])
    } else {
      setSelectedSoportes(selectedSoportes.filter(s => s !== id))
      // Limpiar ediciones si se deselecciona
      if (editedSupports[id]) {
        const newEdited = { ...editedSupports }
        delete newEdited[id]
        setEditedSupports(newEdited)
      }
    }
  }

  // Función para manejar cambios en campos editables
  const handleFieldChange = (supportId: string, field: keyof Support, value: any) => {
    setEditedSupports(prev => ({
      ...prev,
      [supportId]: {
        ...prev[supportId],
        [field]: value
      }
    }))
  }

  // Guardar cambios editados
  const handleSaveChanges = async () => {
    if (Object.keys(editedSupports).length === 0) return

    setSavingChanges(true)
    try {
      const count = Object.keys(editedSupports).length
      const promises = Object.entries(editedSupports).map(async ([id, changes]) => {
        // Obtener el soporte completo
        const support = supports.find(s => s.id === id)
        if (!support) {
          throw new Error(`Soporte ${id} no encontrado`)
        }
        
        // Combinar datos existentes con cambios
        const updatedData = { ...support, ...changes }
        
        const response = await fetch(`/api/soportes/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedData)
        })

        if (!response.ok) {
          throw new Error(`Error al actualizar soporte ${id}`)
        }

        return response.json()
      })

      await Promise.all(promises)
      setEditedSupports({})
      setSelectedSoportes([])
      fetchSupports(1)
      fetchAllSupports() // Recargar todos para el dashboard
      toast.success(`${count} soporte(s) actualizado(s)`)
    } catch (error) {
      console.error('Error al guardar cambios:', error)
      toast.error("Error al guardar cambios")
    } finally {
      setSavingChanges(false)
    }
  }

  // Descartar cambios
  const handleDiscardChanges = () => {
    setEditedSupports({})
    toast.info("Cambios descartados")
  }

  // Aplicar cambio masivo a seleccionados
  const handleBulkFieldChange = (field: keyof Support, value: any) => {
    const updates: Record<string, Partial<Support>> = {}
    selectedSoportes.forEach(id => {
      updates[id] = {
        ...(editedSupports[id] || {}),
        [field]: value
      }
    })
    setEditedSupports(prev => ({ ...prev, ...updates }))
    toast.info(`Campo ${field} actualizado para ${selectedSoportes.length} soporte(s)`)
  }

  // Función para exportar a CSV
  const exportToCSV = (data: SupportCosts[]) => {
    if (data.length === 0) {
      toast.error("No hay datos para exportar")
      return
    }

    // Definir las columnas en el orden correcto
    const headers = [
      "Código",
      "Título",
      "Propietario",
      "Dueño de casa",
      "Temporalidad de pago",
      "Método de pago",
      "Notas",
      "Estructura",
      "Coste Alquiler",
      "Patentes",
      "Uso de suelos",
      "Luz",
      "Gastos administrativos",
      "Comisión ejec.",
      "Mantenimiento",
      "Impuestos 18%",
      "Coste Total",
      "Precio Venta",
      "% Utilidad",
      "Utilidad mensual",
      "Utilidad anual",
      "Último precio",
      "% Utilidad real",
      "Estado"
    ]

    // Función para escapar valores CSV
    const escapeCSV = (value: any): string => {
      if (value === null || value === undefined) return ""
      const str = String(value)
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    // Crear las filas de datos
    const rows = data.map(soporte => [
      escapeCSV(soporte.codigo),
      escapeCSV(soporte.titulo),
      escapeCSV(soporte.propietario),
      escapeCSV(soporte.duenoCasa),
      escapeCSV(soporte.temporalidadPago),
      escapeCSV(soporte.metodoPago),
      escapeCSV(soporte.notas),
      escapeCSV(soporte.estructura),
      escapeCSV(soporte.costeAlquiler.toFixed(2)),
      escapeCSV(soporte.patentes.toFixed(2)),
      escapeCSV(soporte.usoSuelos.toFixed(2)),
      escapeCSV(soporte.luz && parseFloat(soporte.luz) > 0 ? parseFloat(soporte.luz).toFixed(2) : ""),
      escapeCSV(soporte.gastosAdministrativos.toFixed(2)),
      escapeCSV(soporte.comisionEjec.toFixed(2)),
      escapeCSV(soporte.mantenimiento.toFixed(2)),
      escapeCSV(soporte.impuestos18.toFixed(2)),
      escapeCSV(soporte.costoTotal.toFixed(2)),
      escapeCSV(soporte.precioVenta.toFixed(2)),
      escapeCSV(soporte.porcentajeBeneficio.toFixed(1) + "%"),
      escapeCSV(soporte.utilidadMensual.toFixed(2)),
      escapeCSV(soporte.utilidadAnual.toFixed(2)),
      escapeCSV(soporte.ultimoPrecio !== null ? soporte.ultimoPrecio.toFixed(2) : ""),
      escapeCSV(soporte.porcentajeUtilidadReal !== null ? soporte.porcentajeUtilidadReal.toFixed(1) + "%" : ""),
      escapeCSV(
        soporte.estadoAlquiler === 'activo' ? 'Activo' :
        soporte.estadoAlquiler === 'reservado' ? 'Reservado' :
        soporte.estadoAlquiler === 'proximo' ? 'Próximo' :
        soporte.estadoAlquiler === 'finalizado' ? 'Finalizado' : ""
      )
    ])

    // Crear el contenido CSV
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n")

    // Crear el BOM para UTF-8 (ayuda con Excel)
    const BOM = "\uFEFF"
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    
    link.setAttribute("href", url)
    link.setAttribute("download", `costes_soportes_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success(`${data.length} registro(s) exportado(s)`)
  }

  // Funciones de paginación
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1)
    }
  }

  // Convertir soportes paginados a costes (ya están filtrados)
  const soportesCostes = paginatedSupports.map(calculateCosts)

  // Cálculos del panel superior usando TODOS los soportes (no solo los de la página)
  const allSoportesCostes = allSupports.map(calculateCosts)
  const totalCostos = allSoportesCostes.reduce((sum, soporte) => sum + soporte.costoTotal, 0)
  const potencialVentas = allSoportesCostes.reduce((sum, soporte) => sum + soporte.precioVenta, 0)
  
  // Ingresos solo de soportes ocupados (de todos los soportes)
  const soportesOcupados = allSupports.filter(s => s.status === 'Ocupado')
  const ingresoTotal = soportesOcupados.reduce((sum, s) => sum + (s.priceMonth || 0), 0)
  
  // % Beneficio = (Ingresos Ocupados - Costes Totales) / Costes Totales * 100
  const beneficioReal = ingresoTotal - totalCostos
  const porcentajeBeneficioTotal = totalCostos > 0 ? (beneficioReal / totalCostos) * 100 : 0

  return (
    <div className="p-6">
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
              {/* Filtro por Ciudad */}
              <Select value={filtroCiudad} onValueChange={setFiltroCiudad}>
                <SelectTrigger className="w-44 [&>span]:text-black !pl-9 !pr-3 relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none z-10" />
                  <SelectValue placeholder="Ciudad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Ciudad</SelectItem>
                  {ciudadesUnicas.map((ciudad) => (
                    <SelectItem key={ciudad} value={ciudad}>{ciudad}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Filtro por Método de pago */}
              <Select value={filtroMetodoPago} onValueChange={setFiltroMetodoPago}>
                <SelectTrigger className="w-52 [&>span]:text-black !pl-9 !pr-3 relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none z-10" />
                  <SelectValue placeholder="Método de pago" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Método de pago</SelectItem>
                  {METODO_PAGO_OPTIONS.map((metodo) => (
                    <SelectItem key={metodo} value={metodo}>{metodo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Filtro por Propietario */}
              <Select value={filtroPropietario} onValueChange={setFiltroPropietario}>
                <SelectTrigger className="w-44 [&>span]:text-black !pl-9 !pr-3 relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none z-10" />
                  <SelectValue placeholder="Propietario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Propietario</SelectItem>
                  <SelectItem value="imagen">Imagen</SelectItem>
                  <SelectItem value="otros">Otros</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Filtro por Estado */}
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger className="w-52 [&>span]:text-black !pl-9 !pr-3 relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none z-10" />
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Estado</SelectItem>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="reservado">Reservado</SelectItem>
                  <SelectItem value="proximo">Próximo</SelectItem>
                  <SelectItem value="finalizado">Finalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => exportToCSV(allSoportesCostes)}>
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </div>

        {/* Barra azul de acciones masivas */}
        {!permisosLoading && puedeEditar("soportes") && (selectedSoportes.length > 0 || Object.keys(editedSupports).length > 0) && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex flex-col gap-3">
              {/* Primera fila: Botones siempre arriba a la izquierda */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-blue-800 mr-2">
                  {selectedSoportes.length} seleccionados
                </span>
                <Button variant="outline" size="sm" onClick={() => {
                  const selectedCostes = soportesCostes.filter(s => selectedSoportes.includes(s.id))
                  exportToCSV(selectedCostes)
                }}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar selección
                </Button>
                
                {Object.keys(editedSupports).length > 0 && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleDiscardChanges}
                      disabled={savingChanges}
                    >
                      Descartar
                    </Button>
                    <Button 
                      className="bg-[#D54644] hover:bg-[#B03A38] text-white"
                      size="sm"
                      onClick={handleSaveChanges}
                      disabled={savingChanges}
                    >
                      {savingChanges ? "Guardando..." : `Guardar cambios (${Object.keys(editedSupports).length})`}
                    </Button>
                  </>
                )}
              </div>
              
              {/* Segunda fila: Opciones de edición masiva (saltan de línea si no caben) */}
              {selectedSoportes.length > 1 && (
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Cambiar Propietario */}
                  <Input
                    placeholder="Cambiar propietario"
                    onChange={(e) => handleBulkFieldChange('owner', e.target.value)}
                    className="h-8 w-40 text-xs"
                  />
                  
                  {/* Cambiar Método de pago */}
                  <Select onValueChange={(value) => handleBulkFieldChange('metodoPago', value)}>
                    <SelectTrigger className="h-8 w-48 text-xs">
                      <SelectValue placeholder="Cambiar método de pago" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {METODO_PAGO_OPTIONS.map((metodo) => (
                        <SelectItem key={metodo} value={metodo}>{metodo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Cambiar Coste Alquiler */}
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Cambiar coste alquiler"
                    onChange={(e) => handleBulkFieldChange('costeAlquiler', parseFloat(e.target.value) || null)}
                    className="h-8 w-40 text-xs"
                  />
                  
                  {/* Cambiar Patentes */}
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Cambiar patentes"
                    onChange={(e) => handleBulkFieldChange('patentes', parseFloat(e.target.value) || null)}
                    className="h-8 w-40 text-xs"
                  />
                  
                  {/* Cambiar Mantenimiento */}
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Cambiar mantenimiento"
                    onChange={(e) => handleBulkFieldChange('mantenimiento', parseFloat(e.target.value) || null)}
                    className="h-8 w-40 text-xs"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tabla de Costes */}
        <Card>
          <CardHeader>
            <CardTitle>Costes por Soporte</CardTitle>
            <CardDescription>
              {loading ? 'Cargando...' : `${filteredSupports.length} soportes encontrados`}
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
                      <th className="text-left py-2 px-3 font-medium text-gray-900">Dueño de casa</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-900">Temporalidad de pago</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-900">Método de pago</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-900">Notas</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-900">Estructura</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-900">Coste Alquiler</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-900">Patentes</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-900">Uso de suelos</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-900">Luz</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-900">Gastos administrativos</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-900">Comisión ejec.</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-900">Mantenimiento</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-900">Impuestos 18%</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-900">Coste Total</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-900">Precio Venta</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-900">% Utilidad</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-900">Utilidad mensual</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-900">Utilidad anual</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-900">Último precio</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-900">% Utilidad real</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-900">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {soportesCostes.length === 0 ? (
                      <tr>
                        <td colSpan={22} className="text-center py-8 text-gray-500">
                          {searchTerm ? 'No se encontraron soportes con ese criterio de búsqueda' : 'No hay soportes disponibles'}
                        </td>
                      </tr>
                    ) : (
                      soportesCostes.map((soporte) => {
                        const isSelected = selectedSoportes.includes(soporte.id)
                        const support = paginatedSupports.find(s => s.id === soporte.id)
                        const edited = editedSupports[soporte.id] || {}
                        const canEdit = !permisosLoading && puedeEditar("soportes")
                        
                        return (
                        <tr key={soporte.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-3">
                            <Checkbox
                              checked={isSelected}
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
                            ) : (soporte.titulo || '-')}
                          </td>
                          <td className="py-2 px-3">
                            {isSelected && canEdit ? (
                              <Input
                                value={edited.owner ?? support?.owner ?? ""}
                                onChange={(e) => handleFieldChange(soporte.id, 'owner', e.target.value)}
                                className="h-8 text-xs w-32"
                                placeholder="Propietario"
                              />
                            ) : soporte.propietario ? (
                              <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ${
                                soporte.propietario.trim().toLowerCase() === 'imagen' ? 'bg-pink-100 text-pink-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {soporte.propietario}
                              </span>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            {isSelected && canEdit ? (
                              <Input
                                value={edited.duenoCasa ?? support?.duenoCasa ?? ""}
                                onChange={(e) => handleFieldChange(soporte.id, 'duenoCasa', e.target.value)}
                                className="h-8 text-xs w-32"
                                placeholder="Dueño de casa"
                              />
                            ) : soporte.duenoCasa ? (
                              soporte.duenoCasa.length > 20 ? (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger className="text-left">
                                      <span className="text-sm">{soporte.duenoCasa.slice(0, 20) + '…'}</span>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-sm">{soporte.duenoCasa}</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ) : (
                                <span className="text-sm">{soporte.duenoCasa}</span>
                              )
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            {isSelected && canEdit ? (
                              <Input
                                value={edited.temporalidadPago ?? support?.temporalidadPago ?? ""}
                                onChange={(e) => handleFieldChange(soporte.id, 'temporalidadPago', e.target.value)}
                                className="h-8 text-xs w-32"
                                placeholder="Temporalidad"
                              />
                            ) : (
                              <span className="text-sm">{soporte.temporalidadPago}</span>
                            )}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            {isSelected && canEdit ? (
                              <Select
                                value={edited.metodoPago ?? support?.metodoPago ?? ""}
                                onValueChange={(value) => handleFieldChange(soporte.id, 'metodoPago', value)}
                              >
                                <SelectTrigger className="h-8 w-48 text-xs">
                                  <SelectValue placeholder="Método de pago" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px]">
                                  {METODO_PAGO_OPTIONS.map((metodo) => (
                                    <SelectItem key={metodo} value={metodo}>{metodo}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : soporte.metodoPago && soporte.metodoPago !== "-" ? (
                              <Badge variant="secondary">{soporte.metodoPago}</Badge>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            {isSelected && canEdit ? (
                              <Input
                                value={edited.notas ?? support?.notas ?? ""}
                                onChange={(e) => handleFieldChange(soporte.id, 'notas', e.target.value)}
                                className="h-8 text-xs w-40"
                                placeholder="Notas"
                              />
                            ) : soporte.notas ? (
                              <span className="text-sm">{soporte.notas}</span>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            {isSelected && canEdit ? (
                              <Input
                                value={edited.estructura ?? support?.estructura ?? ""}
                                onChange={(e) => handleFieldChange(soporte.id, 'estructura', e.target.value)}
                                className="h-8 text-xs w-32"
                                placeholder="Estructura"
                              />
                            ) : (
                              <span className="text-sm">{soporte.estructura || '-'}</span>
                            )}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            {isSelected && canEdit ? (
                              <Input
                                type="number"
                                step="0.01"
                                value={edited.costeAlquiler ?? support?.costeAlquiler ?? ""}
                                onChange={(e) => handleFieldChange(soporte.id, 'costeAlquiler', parseFloat(e.target.value) || null)}
                                className="h-8 text-xs w-28"
                                placeholder="0.00"
                              />
                            ) : (
                              <span className="font-medium">Bs {soporte.costeAlquiler.toFixed(2)}</span>
                            )}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            {isSelected && canEdit ? (
                              <Input
                                type="number"
                                step="0.01"
                                value={edited.patentes ?? support?.patentes ?? ""}
                                onChange={(e) => handleFieldChange(soporte.id, 'patentes', parseFloat(e.target.value) || null)}
                                className="h-8 text-xs w-28"
                                placeholder="0.00"
                              />
                            ) : (
                              <span>Bs {soporte.patentes.toFixed(2)}</span>
                            )}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            {isSelected && canEdit ? (
                              <Input
                                type="number"
                                step="0.01"
                                value={edited.usoSuelos ?? support?.usoSuelos ?? ""}
                                onChange={(e) => handleFieldChange(soporte.id, 'usoSuelos', parseFloat(e.target.value) || null)}
                                className="h-8 text-xs w-28"
                                placeholder="0.00"
                              />
                            ) : (
                              <span>Bs {soporte.usoSuelos.toFixed(2)}</span>
                            )}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            {isSelected && canEdit ? (
                              <Input
                                value={edited.luz ?? support?.luz ?? ""}
                                onChange={(e) => handleFieldChange(soporte.id, 'luz', e.target.value)}
                                className="h-8 text-xs w-28"
                                placeholder="0"
                              />
                            ) : soporte.luz && parseFloat(soporte.luz) > 0 ? (
                              <span>Bs {parseFloat(soporte.luz).toFixed(2)}</span>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            {isSelected && canEdit ? (
                              <Input
                                type="number"
                                step="0.01"
                                value={edited.gastosAdministrativos ?? support?.gastosAdministrativos ?? ""}
                                onChange={(e) => handleFieldChange(soporte.id, 'gastosAdministrativos', parseFloat(e.target.value) || null)}
                                className="h-8 text-xs w-28"
                                placeholder="0.00"
                              />
                            ) : (
                              <span>Bs {soporte.gastosAdministrativos.toFixed(2)}</span>
                            )}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            {isSelected && canEdit ? (
                              <Input
                                type="number"
                                step="0.01"
                                value={edited.comisionEjecutiva ?? support?.comisionEjecutiva ?? ""}
                                onChange={(e) => handleFieldChange(soporte.id, 'comisionEjecutiva', parseFloat(e.target.value) || null)}
                                className="h-8 text-xs w-28"
                                placeholder="0.00"
                              />
                            ) : (
                              <span>Bs {soporte.comisionEjec.toFixed(2)}</span>
                            )}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            {isSelected && canEdit ? (
                              <Input
                                type="number"
                                step="0.01"
                                value={edited.mantenimiento ?? support?.mantenimiento ?? ""}
                                onChange={(e) => handleFieldChange(soporte.id, 'mantenimiento', parseFloat(e.target.value) || null)}
                                className="h-8 text-xs w-28"
                                placeholder="0.00"
                              />
                            ) : (
                              <span>Bs {soporte.mantenimiento.toFixed(2)}</span>
                            )}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span className="font-medium text-orange-600">Bs {soporte.impuestos18.toFixed(2)}</span>
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
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span className={`font-medium ${soporte.utilidadMensual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              Bs {soporte.utilidadMensual.toFixed(2)}
                            </span>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span className={`font-medium ${soporte.utilidadAnual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              Bs {soporte.utilidadAnual.toFixed(2)}
                            </span>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            {soporte.ultimoPrecio !== null ? (
                              <span className="font-medium text-blue-600">
                                Bs {soporte.ultimoPrecio.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            {soporte.porcentajeUtilidadReal !== null ? (
                              <div className={`flex items-center gap-1 ${getBeneficioColor(soporte.porcentajeUtilidadReal)}`}>
                                {getBeneficioIcon(soporte.porcentajeUtilidadReal)}
                                <span className="font-medium">{soporte.porcentajeUtilidadReal.toFixed(1)}%</span>
                              </div>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            {soporte.estadoAlquiler ? (
                              <span className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${
                                soporte.estadoAlquiler === 'activo' ? 'bg-green-100 text-green-800' :
                                soporte.estadoAlquiler === 'reservado' ? 'bg-yellow-100 text-yellow-800' :
                                soporte.estadoAlquiler === 'proximo' ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {soporte.estadoAlquiler === 'activo' ? 'Activo' :
                                 soporte.estadoAlquiler === 'reservado' ? 'Reservado' :
                                 soporte.estadoAlquiler === 'proximo' ? 'Próximo' :
                                 'Finalizado'}
                              </span>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                        </tr>
                      )})
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handlePrevPage}
                disabled={currentPage === 1 || loading}
              >
                Anterior
              </Button>
              
              {/* Mostrar páginas */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
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
                disabled={currentPage >= totalPages || loading}
              >
                Siguiente
              </Button>
            </div>
            
            {/* Información de paginación */}
            <div className="ml-4 text-sm text-gray-600">
              Mostrando {startIndex + 1} - {Math.min(endIndex, filteredSupports.length)} de {filteredSupports.length} items
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
