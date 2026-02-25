"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { usePermisosContext } from "@/hooks/permisos-provider"
import { 
  DollarSign, 
  Search, 
  Filter, 
  ChevronDown,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  X,
  Info,
  FileSpreadsheet
} from "lucide-react"
import * as XLSX from "xlsx"
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
  costeAlquilerActual: number | null // Coste de alquiler actual (null si no se aplica)
  patentes: number
  usoSuelos: number
  luz: string
  gastosAdministrativos: number
  comisionEjec: number
  mantenimiento: number
  impuestos18: number
  costoTotal: number
  costeActual: number // Coste actual según método de pago y estado de alquiler
  precioVenta: number
  porcentajeBeneficio: number
  utilidadMensual: number
  utilidadAnual: number
  utilidadEstimadaValor: number // precio - costeActual (para cifra pequeña bajo % estimada)
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

// Formato: punto cada 3 cifras, coma decimales (ej. 975.706,98)
const formatearBs = (n: number): string => {
  const [parteEntera, parteDecimal] = n.toFixed(2).split('.')
  const conMiles = parteEntera.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${conMiles},${parteDecimal}`
}

export default function CostesPage() {
  const { puedeEditar, loading: permisosLoading, tieneFuncionTecnica } = usePermisosContext()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSoportes, setSelectedSoportes] = useState<string[]>([])
  const [selectAllMode, setSelectAllMode] = useState<'none' | 'page' | 'all'>('none')
  const [allSoporteIds, setAllSoporteIds] = useState<string[]>([])
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
  const [openCiudadCostes, setOpenCiudadCostes] = useState(false)
  const [filtroMetodoPago, setFiltroMetodoPago] = useState<string>("all")
  const [filtroPropietario, setFiltroPropietario] = useState<string>("all")
  const [filtroEstado, setFiltroEstado] = useState<string>("all")
  const [ciudadesUnicas, setCiudadesUnicas] = useState<string[]>([])
  
  // Estados para ordenamiento (por defecto: título A–Z)
  const [sortColumn, setSortColumn] = useState<"codigo" | "titulo" | "costeAlquiler" | "impuestos" | "costeTotal" | "precioVenta" | "porcentajeUtilidad" | "utilidadAnual" | "costeActual" | "ultimoPrecio" | "utilidadReal" | null>("titulo")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  
  // Estado para controlar cuándo los filtros están cargados
  const [filtersLoaded, setFiltersLoaded] = useState(false)
  
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

  // Cargar datos de alquileres para todos los soportes (optimizado: una sola llamada)
  const loadAlquileresData = async (supports: Support[]) => {
    try {
      // Obtener todos los alquileres de una vez
      const response = await fetch(`/api/alquileres?pageSize=10000`, {
        cache: 'no-store',
        credentials: 'include'
      })
      if (response.ok) {
        const result = await response.json()
        const allAlquileres = result.data || []
        
        // Crear un mapa de soporte_id -> alquileres
        const alquileresPorSoporte: Record<string, any[]> = {}
        allAlquileres.forEach((alquiler: any) => {
          if (alquiler.soporte_id) {
            const soporteId = String(alquiler.soporte_id)
            if (!alquileresPorSoporte[soporteId]) {
              alquileresPorSoporte[soporteId] = []
            }
            alquileresPorSoporte[soporteId].push(alquiler)
          }
        })
        
        // Procesar cada soporte para obtener el último alquiler
        const alquileresMap: Record<string, { ultimoPrecio: number | null, estado: 'activo' | 'reservado' | 'proximo' | 'finalizado' | null }> = {}
        
        supports.forEach((support) => {
          const alquileres = alquileresPorSoporte[support.id] || []
          
          if (alquileres.length > 0) {
            // Ordenar por fecha de inicio descendente para obtener el más reciente (fecha más avanzada)
            const sortedAlquileres = alquileres.sort((a: any, b: any) => {
              const dateA = a.inicio ? new Date(a.inicio).getTime() : 0
              const dateB = b.inicio ? new Date(b.inicio).getTime() : 0
              return dateB - dateA
            })
            
            const ultimoAlquiler = sortedAlquileres[0]
            const total = ultimoAlquiler.total != null ? Number(ultimoAlquiler.total) : null

            // Último precio = precio mensual contractual real (total / meses). Sin prorrateo por días.
            let precioMensual: number | null = null
            if (total != null && total >= 0) {
              let mesesContratados: number
              if (ultimoAlquiler.meses != null && ultimoAlquiler.meses > 0) {
                mesesContratados = Number(ultimoAlquiler.meses)
              } else if (ultimoAlquiler.inicio && ultimoAlquiler.fin) {
                const fechaInicio = new Date(ultimoAlquiler.inicio)
                const fechaFin = new Date(ultimoAlquiler.fin)
                const diferenciaMs = fechaFin.getTime() - fechaInicio.getTime()
                const dias = Math.max(1, Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24)))
                // Meses contractuales = diferencia en meses redondeada hacia arriba (sin prorratear precio por días)
                mesesContratados = Math.max(1, Math.ceil(dias / 30))
              } else {
                mesesContratados = 1
              }
              precioMensual = mesesContratados <= 0 ? round2(total) : round2(total / mesesContratados)
            }

            alquileresMap[support.id] = {
              ultimoPrecio: precioMensual,
              estado: ultimoAlquiler.estado || null
            }
          } else {
            alquileresMap[support.id] = { ultimoPrecio: null, estado: null }
          }
        })
        
        setAlquileresData(alquileresMap)
      }
    } catch (error) {
      console.error('Error obteniendo alquileres:', error)
      // En caso de error, inicializar con valores null
      const alquileresMap: Record<string, { ultimoPrecio: number | null, estado: 'activo' | 'reservado' | 'proximo' | 'finalizado' | null }> = {}
      supports.forEach((support) => {
        alquileresMap[support.id] = { ultimoPrecio: null, estado: null }
      })
      setAlquileresData(alquileresMap)
    }
  }

  // Función para calcular costes. Dos bloques independientes (sin cruce de bases):
  // — BLOQUE PROYECCIÓN: Coste Total, Precio Venta, % Utilidad estimada (solo priceMonth + costeTotal).
  // — BLOQUE REAL: Coste Actual, Último Precio, % Utilidad real (solo costeActualTotal + ultimoPrecio).
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

    // Obtener método de pago y estado de alquiler (solo para BLOQUE REAL)
    const metodoPago = (support.metodoPago || "").toUpperCase()
    const estadoAlquiler = alquileresData[support.id]?.estado || null
    const alquilerActivo = estadoAlquiler === 'activo'

    // ─── BLOQUE REAL: Coste Actual (no usa costeTotal ni impuestos de proyección) ───
    // Calcular COSTE ACTUAL según las reglas:
    // - Coste de alquiler: FIJO → siempre; CUANDO SE ALQUILA → solo si activo; NO SE PAGA → 0
    // - Patentes, uso suelos, luz, gastos admin, mantenimiento: solo si método = "FIJO"
    // - Comisión ejec.: solo cuando alquiler activo

    let costeAlquilerActual = 0
    if (metodoPago === "FIJO") {
      costeAlquilerActual = costeAlquiler
    } else if (metodoPago === "CUANDO SE ALQUILA") {
      if (alquilerActivo) {
        costeAlquilerActual = costeAlquiler
      }
    } else if (metodoPago === "NO SE PAGA") {
      costeAlquilerActual = 0
    } else {
      costeAlquilerActual = costeAlquiler
    }

    const costePatentes = metodoPago === "FIJO" ? patentes : 0
    const costeUsoSuelos = metodoPago === "FIJO" ? usoSuelos : 0
    const costeLuz = metodoPago === "FIJO" ? luz : 0
    const costeGastosAdmin = metodoPago === "FIJO" ? gastosAdministrativos : 0
    const costeMantenimiento = metodoPago === "FIJO" ? mantenimiento : 0
    const costeComisionEjec = alquilerActivo ? comisionEjec : 0

    const costeActual = round2(costeAlquilerActual + costePatentes + costeUsoSuelos + costeLuz + costeGastosAdmin + costeComisionEjec + costeMantenimiento)

    const ultimoPrecio = alquileresData[support.id]?.ultimoPrecio ?? null
    let costeActualTotal: number
    if (!alquilerActivo) {
      costeActualTotal = costeActual
    } else if (ultimoPrecio != null && ultimoPrecio > 0) {
      const impuestosActual = round2(ultimoPrecio * 0.18)
      costeActualTotal = round2(costeActual + impuestosActual)
    } else {
      costeActualTotal = costeActual
    }

    // ─── BLOQUE PROYECCIÓN: Coste Total + Precio Venta + % Utilidad estimada (solo priceMonth + costeTotal) ───
    // costeBase = suma fija de todos los costes estructurales (no depende de método de pago ni estado alquiler)
    const costeBase = round2(costeAlquiler + patentes + usoSuelos + luz + gastosAdministrativos + comisionEjec + mantenimiento)
    const impuestos18 = round2(precioVenta * 0.18)
    const costoTotal = round2(costeBase + impuestos18)

    const utilidadEstimadaValor = round2(precioVenta - costoTotal)
    const porcentajeBeneficio = precioVenta > 0 ? round2(((precioVenta - costoTotal) / precioVenta) * 100) : 0

    const utilidadMensual = utilidadEstimadaValor
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
      costeAlquilerActual: metodoPago === "NO SE PAGA" ? null : (metodoPago === "CUANDO SE ALQUILA" && !alquilerActivo ? null : costeAlquilerActual),
      patentes,
      usoSuelos,
      luz: luzTexto,
      gastosAdministrativos,
      comisionEjec,
      mantenimiento,
      impuestos18,
      costoTotal,
      costeActual: costeActualTotal, // Coste actual total (incluye impuestos)
      precioVenta,
      porcentajeBeneficio,
      utilidadMensual,
      utilidadAnual,
      utilidadEstimadaValor,
      ultimoPrecio: alquileresData[support.id]?.ultimoPrecio || null,
      porcentajeUtilidadReal: (() => {
        const up = alquileresData[support.id]?.ultimoPrecio ?? null
        if (up === null || up <= 0) return null
        // % utilidad real = margen sobre precio: ((ultimoPrecio - costeActualTotal) / ultimoPrecio) * 100
        return round2(((up - costeActualTotal) / up) * 100)
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

  // 1) Cargar los filtros una sola vez al montar
  useEffect(() => {
    const saved = sessionStorage.getItem("costes_filtros")
    
    if (saved) {
      try {
        const f = JSON.parse(saved)
        setSearchTerm(f.searchTerm ?? "")
        setFiltroCiudad(f.filtroCiudad ?? "all")
        setFiltroMetodoPago(f.filtroMetodoPago ?? "all")
        setFiltroPropietario(f.filtroPropietario ?? "all")
        setFiltroEstado(f.filtroEstado ?? "all")
        setSortColumn(f.sortColumn ?? "titulo")
        setSortDirection(f.sortDirection ?? "asc")
      } catch (error) {
        console.error('❌ Error parseando filtros guardados:', error)
      }
    }
    
    // Garantizamos que SOLO ahora los filtros están listos
    setFiltersLoaded(true)
  }, [])

  // 2) Guardar los filtros cuando cambien
  useEffect(() => {
    if (!filtersLoaded) return
    
    sessionStorage.setItem("costes_filtros", JSON.stringify({
      searchTerm,
      filtroCiudad,
      filtroMetodoPago,
      filtroPropietario,
      filtroEstado,
      sortColumn,
      sortDirection
    }))
  }, [searchTerm, filtroCiudad, filtroMetodoPago, filtroPropietario, filtroEstado, sortColumn, sortDirection, filtersLoaded])

  // Función para limpiar todos los filtros
  const limpiarTodosFiltros = () => {
    console.log('🧹 Limpiando todos los filtros')
    setSearchTerm("")
    setFiltroCiudad("all")
    setFiltroMetodoPago("all")
    setFiltroPropietario("all")
    setFiltroEstado("all")
    setSortColumn(null)
    setSortDirection("asc")
    sessionStorage.removeItem('costes_filtros')
  }

  // Función para eliminar un filtro específico
  const eliminarFiltro = (tipo: 'busqueda' | 'ciudad' | 'metodoPago' | 'propietario' | 'estado' | 'orden') => {
    console.log('🗑️ Eliminando filtro:', tipo)
    switch (tipo) {
      case 'busqueda':
        setSearchTerm("")
        break
      case 'ciudad':
        setFiltroCiudad("all")
        break
      case 'metodoPago':
        setFiltroMetodoPago("all")
        break
      case 'propietario':
        setFiltroPropietario("all")
        break
      case 'estado':
        setFiltroEstado("all")
        break
      case 'orden':
        setSortColumn(null)
        setSortDirection("asc")
        break
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
          
          // Normalizar ciudades: capitalizar primera letra, resto minúsculas; excepciones "El Alto", "La Paz"
          const normalizeCity = (city: string): string => {
            if (!city) return ''
            const normalized = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase()
            if (normalized === 'El alto') return 'El Alto'
            if (normalized === 'La paz') return 'La Paz'
            return normalized
          }
          
          // Obtener ciudades únicas normalizadas
          const ciudadesMap = new Map<string, string>()
          allData.forEach((s: Support) => {
            if (s.city) {
              const normalized = normalizeCity(s.city)
              // Evitar duplicados: si ya existe una versión normalizada, usar esa
              if (!ciudadesMap.has(normalized)) {
                ciudadesMap.set(normalized, normalized)
              }
            }
          })
          
          const ciudades = Array.from(ciudadesMap.values())
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
      // Excluir soportes con estado "No disponible"
      if (support.status === 'No disponible' || support.status === 'no disponible' || support.status === 'NO DISPONIBLE') {
        return false
      }

      // Filtro de búsqueda (solo código y nombre, NO dueño de casa)
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const matchesSearch = 
          (support.code || '').toLowerCase().includes(searchLower) ||
          (support.title || '').toLowerCase().includes(searchLower)
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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Esto se actualizará después de que se calculen los soportes paginados
      setSelectedSoportes([])
    } else {
      setSelectedSoportes([])
    }
  }
  
  // Obtener los soportes originales para los paginados
  const getSupportById = (id: string) => {
    return filteredSupports.find(s => s.id === id)
  }

  const handleSelectSoporte = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedSoportes([...selectedSoportes, id])
    } else {
      setSelectedSoportes(selectedSoportes.filter(s => s !== id))
      if (selectAllMode === 'all') setSelectAllMode('page')
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

  // Exportar a xlsx (NUNCA incluir columna dueno_casa / Dueño de casa)
  const HEADERS_COSTES = [
    "Código",
    "Título",
    "Propietario",
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
    "Coste Actual",
    "Precio Venta",
    "% Utilidad estimada",
    "Utilidad anual estimada",
    "Último precio",
    "% Utilidad real",
    "Estado"
  ]

  const rowFromCoste = (s: SupportCosts): (string | number)[] => [
    s.codigo ?? "",
    s.titulo ?? "",
    s.propietario ?? "",
    s.temporalidadPago ?? "",
    s.metodoPago ?? "",
    s.notas ?? "",
    s.estructura ?? "",
    s.costeAlquiler != null ? Number(s.costeAlquiler.toFixed(2)) : "",
    s.patentes != null ? Number(s.patentes.toFixed(2)) : "",
    s.usoSuelos != null ? Number(s.usoSuelos.toFixed(2)) : "",
    s.luz && parseFloat(s.luz) > 0 ? parseFloat(s.luz).toFixed(2) : "",
    s.gastosAdministrativos != null ? Number(s.gastosAdministrativos.toFixed(2)) : "",
    s.comisionEjec != null ? Number(s.comisionEjec.toFixed(2)) : "",
    s.mantenimiento != null ? Number(s.mantenimiento.toFixed(2)) : "",
    s.impuestos18 != null ? Number(s.impuestos18.toFixed(2)) : "",
    s.costoTotal != null ? Number(s.costoTotal.toFixed(2)) : "",
    s.costeActual != null ? Number(s.costeActual.toFixed(2)) : "",
    s.precioVenta != null ? Number(s.precioVenta.toFixed(2)) : "",
    s.porcentajeBeneficio != null ? s.porcentajeBeneficio.toFixed(1) + "%" : "",
    s.utilidadAnual != null ? Number(s.utilidadAnual.toFixed(2)) : "",
    s.ultimoPrecio != null ? Number(s.ultimoPrecio.toFixed(2)) : "",
    s.porcentajeUtilidadReal != null ? s.porcentajeUtilidadReal.toFixed(1) + "%" : "",
    s.estadoAlquiler === "activo" ? "Activo" : s.estadoAlquiler === "reservado" ? "Reservado" : s.estadoAlquiler === "proximo" ? "Próximo" : s.estadoAlquiler === "finalizado" ? "Finalizado" : ""
  ]

  const exportToXlsx = (data: SupportCosts[], filename: string) => {
    if (data.length === 0) {
      toast.error("No hay datos para exportar")
      return
    }
    const wsData = [HEADERS_COSTES, ...data.map(rowFromCoste)]
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    XLSX.utils.book_append_sheet(wb, ws, "Costes")
    const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" })
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success(`${data.length} registro(s) exportado(s)`)
  }

  const fetchAllSoporteIds = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm?.trim()) params.set('q', searchTerm.trim())
      if (filtroEstado !== 'all') params.set('status', filtroEstado)
      if (filtroCiudad !== 'all') params.set('city', filtroCiudad)
      const res = await fetch(`/api/soportes/all-ids?${params}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setAllSoporteIds(data.ids || [])
        return data.ids || []
      }
      return []
    } catch (e) {
      console.error('Error fetching all soporte IDs (costes):', e)
      return []
    }
  }

  // Funciones de paginación (se definirán después de calcular totalPages)
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    setSelectAllMode('none')
    setSelectedSoportes([])
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Función para manejar el ordenamiento
  const handleSort = (column: "codigo" | "titulo" | "costeAlquiler" | "impuestos" | "costeTotal" | "precioVenta" | "porcentajeUtilidad" | "utilidadAnual" | "costeActual" | "ultimoPrecio" | "utilidadReal") => {
    if (sortColumn === column) {
      // Si ya está ordenando por esta columna, cambiar dirección o desactivar
      if (sortDirection === "asc") {
        setSortDirection("desc")
      } else {
        // Si estaba en desc, desactivar el ordenamiento (ciclo: asc -> desc -> sin orden -> asc)
        setSortColumn(null)
        setSortDirection("asc")
      }
    } else {
      // Si es una nueva columna, empezar con asc
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  // Convertir soportes filtrados a costes
  const soportesCostesBase = filteredSupports.map(calculateCosts)

  // Aplicar ordenamiento si está activo
  const soportesCostes = [...soportesCostesBase].sort((a, b) => {
    if (!sortColumn) return 0
    
    let aValue: any
    let bValue: any
    
    switch (sortColumn) {
      case "codigo":
        // Parsear código formato "123-SCZ" -> número y letras
        const parseCode = (code: string) => {
          const parts = (code || "").split("-")
          const numberPart = parts[0] ? parseInt(parts[0], 10) : 0
          const letterPart = parts[1] ? parts[1].toLowerCase() : ""
          return { number: isNaN(numberPart) ? 0 : numberPart, letters: letterPart }
        }
        
        const aParsed = parseCode(a.codigo || "")
        const bParsed = parseCode(b.codigo || "")
        
        // Primero comparar por número (orden numérico)
        if (aParsed.number !== bParsed.number) {
          return sortDirection === "asc" 
            ? aParsed.number - bParsed.number 
            : bParsed.number - aParsed.number
        }
        
        // Si los números son iguales, comparar por letras (orden alfabético)
        if (aParsed.letters < bParsed.letters) return sortDirection === "asc" ? -1 : 1
        if (aParsed.letters > bParsed.letters) return sortDirection === "asc" ? 1 : -1
        return 0
        
      case "titulo":
        aValue = (a.titulo || "").toLowerCase()
        bValue = (b.titulo || "").toLowerCase()
        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
        return 0
        
      case "costeAlquiler":
        aValue = a.costeAlquilerActual ?? a.costeAlquiler
        bValue = b.costeAlquilerActual ?? b.costeAlquiler
        if (aValue === null) aValue = 0
        if (bValue === null) bValue = 0
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue
        
      case "impuestos":
        aValue = a.impuestos18
        bValue = b.impuestos18
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue
        
      case "costeTotal":
        aValue = a.costoTotal
        bValue = b.costoTotal
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue
        
      case "precioVenta":
        aValue = a.precioVenta
        bValue = b.precioVenta
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue
        
      case "porcentajeUtilidad":
        aValue = a.porcentajeBeneficio
        bValue = b.porcentajeBeneficio
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue
        
      case "utilidadAnual":
        aValue = a.utilidadAnual
        bValue = b.utilidadAnual
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue
        
      case "costeActual":
        aValue = a.costeActual
        bValue = b.costeActual
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue
        
      case "ultimoPrecio":
        aValue = a.ultimoPrecio ?? 0
        bValue = b.ultimoPrecio ?? 0
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue
        
      case "utilidadReal":
        aValue = a.porcentajeUtilidadReal ?? 0
        bValue = b.porcentajeUtilidadReal ?? 0
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue
        
      default:
        return 0
    }
  })

  // Aplicar paginación después del ordenamiento
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const soportesCostesPaginated = soportesCostes.slice(startIndex, endIndex)
  
  // Paginación en frontend (ahora basada en soportesCostes ordenados)
  const totalPages = Math.ceil(soportesCostes.length / itemsPerPage)
  
  // Obtener los soportes originales para los costes paginados
  const paginatedSupports = soportesCostesPaginated.map(coste => {
    return filteredSupports.find(s => s.id === coste.id)
  }).filter(Boolean) as Support[]
  
  // Actualizar handleSelectAll para usar los soportes paginados correctos
  const handleSelectAllUpdated = async (checked: boolean) => {
    if (checked) {
      setSelectedSoportes(soportesCostesPaginated.map(s => s.id))
      setSelectAllMode('page')
      await fetchAllSoporteIds()
    } else {
      setSelectedSoportes([])
      setSelectAllMode('none')
    }
  }
  
  // Funciones de paginación (después de calcular totalPages)
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

  // Cálculos del panel superior usando TODOS los soportes (no solo los de la página)
  const allSoportesCostes = allSupports.map(calculateCosts)
  // TOTAL COSTES: usar coste actual en lugar de costo total
  const totalCostos = allSoportesCostes.reduce((sum, soporte) => sum + soporte.costeActual, 0)
  
  // Potencial de ventas: suma de todos los precios de venta de todos los soportes excepto "No disponible"
  const potencialVentas = round2(
    allSupports
      .filter(s => (s.status || '').toLowerCase() !== 'no disponible')
      .reduce((sum, s) => sum + (s.priceMonth || 0), 0)
  )
  
  // Ingreso Total: suma de todos los "último precio" de soportes con estado de alquiler activo
  const ingresoTotal = allSoportesCostes
    .filter(soporte => soporte.estadoAlquiler === 'activo' && soporte.ultimoPrecio !== null)
    .reduce((sum, soporte) => sum + (soporte.ultimoPrecio || 0), 0)
  
  // % Beneficio total = margen sobre precio: ((ingresoTotal - totalCostos) / ingresoTotal) * 100
  const porcentajeBeneficioTotal = (ingresoTotal == null || ingresoTotal <= 0) ? 0 : round2(((ingresoTotal - totalCostos) / ingresoTotal) * 100)
  const beneficioTotal = round2(ingresoTotal - totalCostos)

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
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-600">Potencial de ventas</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Cifra que facturaría mensualmente la empresa si todos los soportes estuvieran alquilados con su precio de venta</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-2xl font-bold text-gray-800 mt-2">
                    Bs {formatearBs(potencialVentas)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-600">Total Costes</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Suma del coste actual que están generando todos los soportes, tanto si está alquilado como si no</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-2xl font-bold text-gray-800 mt-2">
                    Bs {formatearBs(totalCostos)}
                  </p>
                </div>
                <TrendingDown className="w-8 h-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-600">Ingreso Total</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Suma del precio actual de venta de los soportes activos</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-2xl font-bold text-gray-800 mt-2">
                    Bs {formatearBs(ingresoTotal)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-600">% Beneficio</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Utilidad neta de los soportes activos actualmente menos el total de costes</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className={`text-2xl font-bold ${getBeneficioColor(porcentajeBeneficioTotal)} mt-2`}>
                    {porcentajeBeneficioTotal.toFixed(1)}%
                  </p>
                  <p className={`text-xs mt-0.5 ${getBeneficioColor(porcentajeBeneficioTotal)}`}>
                    Bs {formatearBs(beneficioTotal)}
                  </p>
                </div>
                {(() => {
                  const color = getBeneficioColor(porcentajeBeneficioTotal)
                  const isRedOrBlack = color === "text-red-600" || color === "text-black"
                  // El color del icono siempre coincide con el color de la cifra
                  if (isRedOrBlack) {
                    return <TrendingDown className={`w-8 h-8 ${color}`} />
                  } else {
                    return <TrendingUp className={`w-8 h-8 ${color}`} />
                  }
                })()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          {/* Etiquetas de filtros activos */}
          {(searchTerm || filtroCiudad !== "all" || filtroMetodoPago !== "all" || filtroPropietario !== "all" || filtroEstado !== "all" || (sortColumn && !(sortColumn === "titulo" && sortDirection === "asc"))) && (
            <div className="flex flex-wrap gap-2 items-center mb-4 pb-4 border-b">
              {searchTerm && (
                <div className="flex items-center gap-1 bg-blue-100 hover:bg-blue-200 rounded-full px-3 py-1 text-sm">
                  <span className="font-medium">Búsqueda:</span>
                  <span className="text-gray-700">{searchTerm}</span>
                  <button
                    type="button"
                    onClick={() => eliminarFiltro('busqueda')}
                    className="ml-1 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              
              {filtroCiudad !== "all" && (
                <div className="flex items-center gap-1 bg-purple-100 hover:bg-purple-200 rounded-full px-3 py-1 text-sm">
                  <span className="font-medium">Ciudad:</span>
                  <span className="text-gray-700">{filtroCiudad}</span>
                  <button
                    type="button"
                    onClick={() => eliminarFiltro('ciudad')}
                    className="ml-1 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              
              {filtroMetodoPago !== "all" && (
                <div className="flex items-center gap-1 bg-indigo-100 hover:bg-indigo-200 rounded-full px-3 py-1 text-sm">
                  <span className="font-medium">Método de pago:</span>
                  <span className="text-gray-700">{filtroMetodoPago}</span>
                  <button
                    type="button"
                    onClick={() => eliminarFiltro('metodoPago')}
                    className="ml-1 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              
              {filtroPropietario !== "all" && (
                <div className="flex items-center gap-1 bg-pink-100 hover:bg-pink-200 rounded-full px-3 py-1 text-sm">
                  <span className="font-medium">Propietario:</span>
                  <span className="text-gray-700">{filtroPropietario === 'imagen' ? 'Imagen' : 'Otros'}</span>
                  <button
                    type="button"
                    onClick={() => eliminarFiltro('propietario')}
                    className="ml-1 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              
              {filtroEstado !== "all" && (
                <div className="flex items-center gap-1 bg-green-100 hover:bg-green-200 rounded-full px-3 py-1 text-sm">
                  <span className="font-medium">Estado:</span>
                  <span className="text-gray-700">
                    {filtroEstado === 'activo' ? 'Activo' :
                     filtroEstado === 'reservado' ? 'Reservado' :
                     filtroEstado === 'proximo' ? 'Próximo' :
                     filtroEstado === 'finalizado' ? 'Finalizado' : filtroEstado}
                  </span>
                  <button
                    type="button"
                    onClick={() => eliminarFiltro('estado')}
                    className="ml-1 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              
              {sortColumn && !(sortColumn === "titulo" && sortDirection === "asc") && (
                <div className="flex items-center gap-1 bg-amber-100 hover:bg-amber-200 rounded-full px-3 py-1 text-sm">
                  <span className="font-medium">Orden:</span>
                  <span className="text-gray-700">
                    {(() => {
                      const columnName = sortColumn === 'codigo' ? 'Código' :
                                       sortColumn === 'titulo' ? 'Título' :
                                       sortColumn === 'costeAlquiler' ? 'Coste Alquiler' :
                                       sortColumn === 'impuestos' ? 'Impuestos' :
                                       sortColumn === 'costeTotal' ? 'Coste Total' :
                                       sortColumn === 'precioVenta' ? 'Precio Venta' :
                                       sortColumn === 'porcentajeUtilidad' ? 'Utilidad estimada' :
                                       sortColumn === 'utilidadAnual' ? 'Utilidad anual estimada' :
                                       sortColumn === 'costeActual' ? 'Coste Actual' :
                                       sortColumn === 'ultimoPrecio' ? 'Último Precio' :
                                       sortColumn === 'utilidadReal' ? 'Utilidad Real' : sortColumn || ''
                      
                      const isNumericColumn = ['impuestos', 'costeTotal', 'precioVenta', 'porcentajeUtilidad', 'utilidadAnual', 'costeActual', 'ultimoPrecio', 'utilidadReal', 'costeAlquiler'].includes(sortColumn || '')
                      const directionText = isNumericColumn 
                        ? (sortDirection === 'asc' ? '(Menor a Mayor)' : '(Mayor a Menor)')
                        : (sortDirection === 'asc' ? '(A-Z)' : '(Z-A)')
                      
                      return `${columnName} ${directionText}`
                    })()}
                  </span>
                  <button
                    type="button"
                    onClick={() => eliminarFiltro('orden')}
                    className="ml-1 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              
              {/* Botón para limpiar todos */}
              <button
                type="button"
                onClick={limpiarTodosFiltros}
                className="text-sm text-gray-500 hover:text-gray-700 underline ml-2"
              >
                Limpiar todo
              </button>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por código o nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 max-w-64"
                />
              </div>
              {/* Filtro por Ciudad (mismo scroll que ciudad en editar soporte) */}
              <Popover open={openCiudadCostes} onOpenChange={setOpenCiudadCostes}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCiudadCostes}
                    className="relative w-44 justify-between !pl-9"
                  >
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none z-10 shrink-0" />
                    <span className="truncate">{filtroCiudad === "all" ? "Ciudad" : filtroCiudad}</span>
                    <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-44 p-0" align="start">
                  <div className="max-h-[300px] overflow-y-auto">
                    <div
                      className={`px-3 py-2 cursor-pointer hover:bg-accent text-sm ${filtroCiudad === "all" ? "bg-accent font-medium" : ""}`}
                      onClick={() => { setFiltroCiudad("all"); setOpenCiudadCostes(false); }}
                    >
                      Ciudad
                    </div>
                    {ciudadesUnicas.map((ciudad) => (
                      <div
                        key={ciudad}
                        className={`px-3 py-2 cursor-pointer hover:bg-accent text-sm ${filtroCiudad === ciudad ? "bg-accent font-medium" : ""}`}
                        onClick={() => { setFiltroCiudad(ciudad); setOpenCiudadCostes(false); }}
                      >
                        {ciudad}
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              
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
              {tieneFuncionTecnica("ver boton exportar") && (
                <Button variant="outline" size="sm" onClick={() => exportToXlsx(allSoportesCostes, `costes_soportes_${new Date().toISOString().split("T")[0]}.xlsx`)}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Banner de selección total (cyan) */}
        {tieneFuncionTecnica("ver boton exportar") && !permisosLoading && soportesCostesPaginated.length > 0 &&
         soportesCostesPaginated.every(s => selectedSoportes.includes(s.id)) &&
         selectAllMode !== 'all' &&
         allSoporteIds.length > soportesCostesPaginated.length && (
          <div className="mb-4 p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-cyan-900">
                Los {soportesCostesPaginated.length} soportes de esta página están seleccionados.
              </span>
              <Button
                variant="link"
                size="sm"
                className="text-cyan-700 hover:text-cyan-900 underline font-semibold"
                onClick={() => {
                  setSelectedSoportes([...allSoporteIds])
                  setSelectAllMode('all')
                  toast.success(`${allSoporteIds.length} soportes seleccionados`)
                }}
              >
                Seleccionar los {allSoporteIds.length} soportes
              </Button>
            </div>
          </div>
        )}

        {tieneFuncionTecnica("ver boton exportar") && selectAllMode === 'all' && (
          <div className="mb-4 p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-cyan-900">
                Los {allSoporteIds.length} soportes están seleccionados.
              </span>
              <Button
                variant="link"
                size="sm"
                className="text-cyan-700 hover:text-cyan-900 underline"
                onClick={() => {
                  setSelectedSoportes([])
                  setSelectAllMode('none')
                }}
              >
                Limpiar selección
              </Button>
            </div>
          </div>
        )}

        {/* Barra azul de acciones masivas */}
        {!permisosLoading && puedeEditar("soportes") && (selectedSoportes.length > 0 || Object.keys(editedSupports).length > 0) && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex flex-col gap-3">
              {/* Primera fila: Botones siempre arriba a la izquierda */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-blue-800 mr-2">
                  {selectAllMode === 'all' ? `${allSoporteIds.length} seleccionados (todos)` : `${selectedSoportes.length} seleccionados`}
                </span>
                {tieneFuncionTecnica("ver boton exportar") && (
                  <Button variant="outline" size="sm" onClick={() => {
                    const selectedCostes = soportesCostes.filter(s => selectedSoportes.includes(s.id))
                    exportToXlsx(selectedCostes, `costes_soportes_seleccionados_${new Date().toISOString().split("T")[0]}.xlsx`)
                  }}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Exportar selección
                  </Button>
                )}
                
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
              {(selectAllMode === 'all' ? allSoporteIds.length : selectedSoportes.length) > 1 && (
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
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left h-10 px-2 align-middle font-medium text-gray-900 sticky left-0 z-20 bg-white border-r border-gray-200" style={{ width: '40px', minWidth: '40px', maxWidth: '40px' }}>
                        <Checkbox
                          checked={selectedSoportes.length === soportesCostesPaginated.length && soportesCostesPaginated.length > 0}
                          onCheckedChange={handleSelectAllUpdated}
                        />
                      </th>
                      <th className="text-left h-10 px-2 align-middle font-medium text-gray-900 sticky left-[40px] z-20 bg-white border-r border-gray-200" style={{ width: '120px', minWidth: '120px' }}>
                        <button
                          onClick={() => handleSort("codigo")}
                          className="flex items-center gap-1 hover:text-[#D54644] transition-colors"
                        >
                          Código
                          <ArrowUpDown className={`h-3 w-3 ${sortColumn === "codigo" ? "text-[#D54644]" : "text-gray-400"}`} />
                        </button>
                      </th>
                      <th className="text-left h-10 px-2 align-middle font-medium text-gray-900">
                        <button
                          onClick={() => handleSort("titulo")}
                          className="flex items-center gap-1 hover:text-[#D54644] transition-colors"
                        >
                          Título
                          <ArrowUpDown className={`h-3 w-3 ${sortColumn === "titulo" && sortDirection !== "asc" ? "text-[#D54644]" : "text-gray-400"}`} />
                        </button>
                      </th>
                      <th className="text-left h-10 px-2 align-middle font-medium text-gray-900">Propietario</th>
                      <th className="text-left h-10 px-2 align-middle font-medium text-gray-900">Temporalidad de pago</th>
                      <th className="text-left h-10 px-2 align-middle font-medium text-gray-900">Método de pago</th>
                      <th className="text-left h-10 px-2 align-middle font-medium text-gray-900">Notas</th>
                      <th className="text-left h-10 px-2 align-middle font-medium text-gray-900">Estructura</th>
                      <th className="text-left h-10 px-2 align-middle font-medium text-gray-900">
                        <button
                          onClick={() => handleSort("costeAlquiler")}
                          className="flex items-center gap-1 hover:text-[#D54644] transition-colors"
                        >
                          Coste Alquiler
                          <ArrowUpDown className={`h-3 w-3 ${sortColumn === "costeAlquiler" ? "text-[#D54644]" : "text-gray-400"}`} />
                        </button>
                      </th>
                      <th className="text-left h-10 px-2 align-middle font-medium text-gray-900">Patentes</th>
                      <th className="text-left h-10 px-2 align-middle font-medium text-gray-900">Uso de suelos</th>
                      <th className="text-left h-10 px-2 align-middle font-medium text-gray-900">Luz</th>
                      <th className="text-left h-10 px-2 align-middle font-medium text-gray-900">Gastos administrativos</th>
                      <th className="text-left h-10 px-2 align-middle font-medium text-gray-900">Comisión ejec.</th>
                      <th className="text-left h-10 px-2 align-middle font-medium text-gray-900">Mantenimiento</th>
                      <th className="text-left h-10 px-2 align-middle font-medium text-gray-900">
                        <button
                          onClick={() => handleSort("impuestos")}
                          className="flex items-center gap-1 hover:text-[#D54644] transition-colors"
                        >
                          Impuestos 18%
                          <ArrowUpDown className={`h-3 w-3 ${sortColumn === "impuestos" ? "text-[#D54644]" : "text-gray-400"}`} />
                        </button>
                      </th>
                      <th className="text-left h-10 px-2 align-middle font-medium text-gray-900">
                        <button
                          onClick={() => handleSort("costeTotal")}
                          className="flex items-center gap-1 hover:text-[#D54644] transition-colors"
                        >
                          Coste Total
                          <ArrowUpDown className={`h-3 w-3 ${sortColumn === "costeTotal" ? "text-[#D54644]" : "text-gray-400"}`} />
                        </button>
                      </th>
                      <th className="text-left h-10 px-2 align-middle font-medium text-gray-900">
                        <button
                          onClick={() => handleSort("precioVenta")}
                          className="flex items-center gap-1 hover:text-[#D54644] transition-colors"
                        >
                          Precio Venta
                          <ArrowUpDown className={`h-3 w-3 ${sortColumn === "precioVenta" ? "text-[#D54644]" : "text-gray-400"}`} />
                        </button>
                      </th>
                      <th className="text-left h-10 px-2 align-middle font-medium text-gray-900">
                        <button
                          onClick={() => handleSort("porcentajeUtilidad")}
                          className="flex items-center gap-1 hover:text-[#D54644] transition-colors"
                        >
                          % Utilidad estimada
                          <ArrowUpDown className={`h-3 w-3 ${sortColumn === "porcentajeUtilidad" ? "text-[#D54644]" : "text-gray-400"}`} />
                        </button>
                      </th>
                      <th className="text-left h-10 px-2 align-middle font-medium text-gray-900">
                        <button
                          onClick={() => handleSort("utilidadAnual")}
                          className="flex items-center gap-1 hover:text-[#D54644] transition-colors"
                        >
                          Utilidad anual estimada
                          <ArrowUpDown className={`h-3 w-3 ${sortColumn === "utilidadAnual" ? "text-[#D54644]" : "text-gray-400"}`} />
                        </button>
                      </th>
                      <th className="text-left h-10 px-2 align-middle font-medium text-gray-900">
                        <button
                          onClick={() => handleSort("costeActual")}
                          className="flex items-center gap-1 hover:text-[#D54644] transition-colors"
                        >
                          Coste Actual
                          <ArrowUpDown className={`h-3 w-3 ${sortColumn === "costeActual" ? "text-[#D54644]" : "text-gray-400"}`} />
                        </button>
                      </th>
                      <th className="text-left h-10 px-2 align-middle font-medium text-gray-900">
                        <button
                          onClick={() => handleSort("ultimoPrecio")}
                          className="flex items-center gap-1 hover:text-[#D54644] transition-colors"
                        >
                          Último precio
                          <ArrowUpDown className={`h-3 w-3 ${sortColumn === "ultimoPrecio" ? "text-[#D54644]" : "text-gray-400"}`} />
                        </button>
                      </th>
                      <th className="text-left h-10 px-2 align-middle font-medium text-gray-900">
                        <button
                          onClick={() => handleSort("utilidadReal")}
                          className="flex items-center gap-1 hover:text-[#D54644] transition-colors"
                        >
                          % Utilidad real
                          <ArrowUpDown className={`h-3 w-3 ${sortColumn === "utilidadReal" ? "text-[#D54644]" : "text-gray-400"}`} />
                        </button>
                      </th>
                      <th className="text-left h-10 px-2 align-middle font-medium text-gray-900">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {soportesCostesPaginated.length === 0 ? (
                      <tr>
                        <td colSpan={24} className="text-center py-8 text-gray-500">
                          {searchTerm ? 'No se encontraron soportes con ese criterio de búsqueda' : 'No hay soportes disponibles'}
                        </td>
                      </tr>
                    ) : (
                      soportesCostesPaginated.map((soporte) => {
                        const isSelected = selectedSoportes.includes(soporte.id)
                        const support = getSupportById(soporte.id)
                        const edited = editedSupports[soporte.id] || {}
                        const canEdit = !permisosLoading && puedeEditar("soportes")
                        
                        return (
                        <tr key={soporte.id} className={`border-b border-gray-200 transition-colors hover:bg-muted/50 ${isSelected ? 'bg-gray-100' : ''}`}>
                          <td className={`p-2 align-middle sticky left-0 z-10 ${isSelected ? 'bg-gray-100' : 'bg-white'} border-r border-gray-200`} style={{ width: '40px', minWidth: '40px', maxWidth: '40px' }}>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => handleSelectSoporte(soporte.id, checked as boolean)}
                            />
                          </td>
                          <td className={`p-2 align-middle whitespace-nowrap sticky left-[40px] z-10 ${isSelected ? 'bg-gray-100' : 'bg-white'} border-r border-gray-200`} style={{ width: '120px', minWidth: '120px', maxWidth: '120px' }}>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-1 font-mono text-xs text-gray-800 border border-neutral-200">
                                    {soporte.codigo}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-sm">
                                  {soporte.titulo || '-'}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </td>
                          <td className="p-2 align-middle whitespace-nowrap">
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
                          <td className="p-2 align-middle">
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
                          <td className="p-2 align-middle whitespace-nowrap">
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
                          <td className="p-2 align-middle whitespace-nowrap">
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
                          <td className="p-2 align-middle whitespace-nowrap">
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
                          <td className="p-2 align-middle whitespace-nowrap">
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
                          <td className="p-2 align-middle text-right tabular-nums whitespace-nowrap">
                            {isSelected && canEdit ? (
                              <Input
                                type="number"
                                step="0.01"
                                value={edited.costeAlquiler ?? support?.costeAlquiler ?? ""}
                                onChange={(e) => handleFieldChange(soporte.id, 'costeAlquiler', parseFloat(e.target.value) || null)}
                                className="h-8 text-xs w-28"
                                placeholder="0.00"
                              />
                            ) : soporte.costeAlquilerActual !== null ? (
                              <span className="font-medium">Bs {formatearBs(soporte.costeAlquilerActual)}</span>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                          <td className="p-2 align-middle text-right tabular-nums whitespace-nowrap">
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
                              <span>Bs {formatearBs(soporte.patentes)}</span>
                            )}
                          </td>
                          <td className="p-2 align-middle text-right tabular-nums whitespace-nowrap">
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
                              <span>Bs {formatearBs(soporte.usoSuelos)}</span>
                            )}
                          </td>
                          <td className="p-2 align-middle text-right tabular-nums whitespace-nowrap">
                            {isSelected && canEdit ? (
                              <Input
                                value={edited.luz ?? support?.luz ?? ""}
                                onChange={(e) => handleFieldChange(soporte.id, 'luz', e.target.value)}
                                className="h-8 text-xs w-28"
                                placeholder="0"
                              />
                            ) : (() => {
                              // Obtener el valor de iluminacion del soporte
                              // El campo lighting viene como 'Sí' o 'No' (string) desde la API
                              // También puede estar como boolean en iluminacion
                              const lightingValue = support?.lighting; // 'Sí' o 'No'
                              const iluminacionValue = (support as any)?.iluminacion; // boolean (si existe)
                              const luzValue = soporte.luz;
                              
                              // Verificar si iluminacion es false
                              // lighting puede ser 'No', null, undefined, string vacío, o false
                              // iluminacion puede ser false (boolean)
                              // Si lighting no es explícitamente 'Sí' o 'Si', consideramos que es false
                              const iluminacionEsFalse = 
                                lightingValue === 'No' ||
                                lightingValue === 'no' ||
                                lightingValue === 'NO' ||
                                lightingValue === '' ||
                                iluminacionValue === false ||
                                (lightingValue === null || lightingValue === undefined) ||
                                (iluminacionValue === null || iluminacionValue === undefined) ||
                                (lightingValue !== 'Sí' && lightingValue !== 'sí' && lightingValue !== 'SÍ' && lightingValue !== 'Si' && lightingValue !== 'si' && lightingValue !== 'SI' && iluminacionValue !== true);
                              
                              // Si iluminacion es false → mostrar "SIN LUZ" en gris (estilo como "No disponible" en soportes)
                              if (iluminacionEsFalse) {
                                return (
                                  <span className="inline-flex items-center rounded px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800">
                                    SIN LUZ
                                  </span>
                                );
                              }
                              
                              // Si iluminacion es true (lighting === 'Sí' o iluminacion === true)
                              const iluminacionEsTrue = 
                                lightingValue === 'Sí' ||
                                lightingValue === 'sí' ||
                                lightingValue === 'SÍ' ||
                                lightingValue === 'Si' ||
                                lightingValue === 'si' ||
                                lightingValue === 'SI' ||
                                iluminacionValue === true;
                              
                              if (iluminacionEsTrue && luzValue) {
                                // Si es "SOLAR" → mostrar en amarillo (estilo como reservas)
                                if (luzValue.toUpperCase() === "SOLAR") {
                                  return (
                                    <span className="inline-flex items-center rounded px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800">
                                      SOLAR
                                    </span>
                                  );
                                }
                                
                                // Si es un número → mostrarlo como está (sin estilo especial)
                                const luzNumero = parseFloat(luzValue);
                                if (!isNaN(luzNumero) && luzNumero > 0) {
                                  return <span>Bs {formatearBs(luzNumero)}</span>;
                                }
                              }
                              
                              // Si hay valor en luz pero iluminacion no está definida claramente, mostrar el valor
                              if (luzValue) {
                                // Si es "SOLAR"
                                if (luzValue.toUpperCase() === "SOLAR") {
                                  return (
                                    <span className="inline-flex items-center rounded px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800">
                                      SOLAR
                                    </span>
                                  );
                                }
                                
                                // Si es un número
                                const luzNumero = parseFloat(luzValue);
                                if (!isNaN(luzNumero) && luzNumero > 0) {
                                  return <span>Bs {formatearBs(luzNumero)}</span>;
                                }
                              }
                              
                              // Por defecto, mostrar "SIN LUZ" con el mismo estilo (badge gris)
                              return (
                                <span className="inline-flex items-center rounded px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800">
                                  SIN LUZ
                                </span>
                              );
                            })()}
                          </td>
                          <td className="p-2 align-middle text-right tabular-nums whitespace-nowrap">
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
                              <span>Bs {formatearBs(soporte.gastosAdministrativos)}</span>
                            )}
                          </td>
                          <td className="p-2 align-middle text-right tabular-nums whitespace-nowrap">
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
                              <span>Bs {formatearBs(soporte.comisionEjec)}</span>
                            )}
                          </td>
                          <td className="p-2 align-middle text-right tabular-nums whitespace-nowrap">
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
                              <span>Bs {formatearBs(soporte.mantenimiento)}</span>
                            )}
                          </td>
                          <td className="p-2 align-middle text-right tabular-nums whitespace-nowrap">
                            <span className="font-medium text-orange-600">Bs {formatearBs(soporte.impuestos18)}</span>
                          </td>
                          <td className="p-2 align-middle text-right tabular-nums whitespace-nowrap">
                            <span className="font-medium text-red-600">Bs {formatearBs(soporte.costoTotal)}</span>
                          </td>
                          <td className="p-2 align-middle text-right tabular-nums whitespace-nowrap">
                            <span className="font-medium text-green-600">Bs {formatearBs(soporte.precioVenta)}</span>
                          </td>
                          <td className="p-2 align-middle text-right tabular-nums whitespace-nowrap">
                            <div className={`flex flex-col justify-end ${getBeneficioColor(soporte.porcentajeBeneficio)}`}>
                              <div className="flex items-center gap-1">
                                {getBeneficioIcon(soporte.porcentajeBeneficio)}
                                <span className="font-medium">{soporte.porcentajeBeneficio.toFixed(1)}%</span>
                              </div>
                              <span className="text-xs mt-0.5">Bs {formatearBs(soporte.utilidadEstimadaValor)}</span>
                            </div>
                          </td>
                          <td className="p-2 align-middle text-right tabular-nums whitespace-nowrap">
                            <span className={`font-medium ${soporte.utilidadAnual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              Bs {formatearBs(soporte.utilidadAnual)}
                            </span>
                          </td>
                          <td className="p-2 align-middle text-right tabular-nums whitespace-nowrap">
                            <span className="font-medium text-purple-600">Bs {formatearBs(soporte.costeActual)}</span>
                          </td>
                          <td className="p-2 align-middle text-right tabular-nums whitespace-nowrap">
                            {soporte.ultimoPrecio !== null ? (
                              <span className="font-medium text-blue-600">
                                Bs {formatearBs(soporte.ultimoPrecio)}
                              </span>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                          <td className="p-2 align-middle text-right tabular-nums whitespace-nowrap">
                            {soporte.porcentajeUtilidadReal !== null ? (
                              <div className={`flex items-center gap-1 ${getBeneficioColor(soporte.porcentajeUtilidadReal)}`}>
                                {getBeneficioIcon(soporte.porcentajeUtilidadReal)}
                                <span className="font-medium">{soporte.porcentajeUtilidadReal.toFixed(1)}%</span>
                              </div>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                          <td className="p-2 align-middle whitespace-nowrap">
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
