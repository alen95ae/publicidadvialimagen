"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  Loader2,
  FileText
} from "lucide-react"
import { toast } from "sonner"
import { Toaster } from "sonner"
import { generarPDFCotizacion } from "@/lib/pdfCotizacion"
import { usePermisosContext } from "@/hooks/permisos-provider"
import { normalizeText } from "@/lib/utils"

interface Cotizacion {
  id: string
  codigo: string
  fecha_creacion: string
  cliente: string
  vendedor: string
  sucursal: string
  total_final: number | null
  estado: "Pendiente" | "Aprobada" | "Rechazada" | "Vencida"
  subtotal?: number | null
  total_iva?: number | null
  total_it?: number | null
  vigencia?: number | null
  cantidad_items?: number | null
  lineas_cotizacion?: number | null
}

interface Vendedor {
  id: string
  nombre: string
  email?: string
  imagen_usuario?: any
  vendedor?: boolean
}

// Constantes para colores de estado (similar a soportes)
const ESTADO_META = {
  'Aprobada': { label: 'Aprobada', className: 'bg-green-100 text-green-800' },
  'Rechazada': { label: 'Rechazada', className: 'bg-red-100 text-red-800' },
  'Pendiente': { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800' },
  'Vencida': { label: 'Vencida', className: 'bg-gray-100 text-gray-800' },
} as const

const getEstadoColor = (estado: string) => {
  switch (estado) {
    case "Aprobada":
      return "bg-green-100 text-green-800"
    case "Rechazada":
      return "bg-red-100 text-red-800"
    case "Pendiente":
      return "bg-yellow-100 text-yellow-800"
    case "Vencida":
      return "bg-gray-100 text-gray-800"
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
    case "Pendiente":
      return <AlertCircle className="w-4 h-4" />
    case "Vencida":
      return <Clock className="w-4 h-4" />
    default:
      return <AlertCircle className="w-4 h-4" />
  }
}

export default function CotizacionesPage() {
  const { tieneFuncionTecnica, loading } = usePermisosContext()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCotizaciones, setSelectedCotizaciones] = useState<string[]>([])
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [filtroVendedor, setFiltroVendedor] = useState<string>("all")
  const [filtroSucursal, setFiltroSucursal] = useState<string>("all")
  const [filtroEstado, setFiltroEstado] = useState<string>("all")
  const [exporting, setExporting] = useState(false)
  const [descargandoPDF, setDescargandoPDF] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })

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

  // Función para obtener imagen del vendedor
  const getVendedorImage = (vendedorNombre: string) => {
    const vendedor = vendedores.find(v => v.nombre === vendedorNombre || v.id === vendedorNombre);
    if (vendedor?.imagen_usuario) {
      const imagenData = typeof vendedor.imagen_usuario === 'string' 
        ? JSON.parse(vendedor.imagen_usuario) 
        : vendedor.imagen_usuario;
      return imagenData?.url || null;
    }
    return null;
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

  // Cargar cotizaciones y vendedores desde la API
  useEffect(() => {
    fetchVendedores()
  }, [])

  // Recargar cotizaciones cuando cambien los filtros (resetear a página 1)
  useEffect(() => {
    setCurrentPage(1)
  }, [filtroVendedor, filtroSucursal, filtroEstado, searchTerm])

  // Recargar cotizaciones cuando cambie la página o los filtros
  useEffect(() => {
    fetchCotizaciones(currentPage)
  }, [currentPage, filtroVendedor, filtroSucursal, filtroEstado, searchTerm])

  // Cargar vendedores para el filtro
  const fetchVendedores = async () => {
    try {
      // Obtener comerciales desde el endpoint público
      const response = await fetch('/api/public/comerciales')
      const data = await response.json()
      const comerciales = data.users || []
      
      // Obtener todos los vendedores únicos de las cotizaciones
      const cotizacionesResponse = await fetch('/api/cotizaciones?pageSize=10000')
      const cotizacionesData = await cotizacionesResponse.json()
      const vendedoresDeCotizaciones = new Set<string>()
      
      if (cotizacionesData.success && cotizacionesData.data) {
        cotizacionesData.data.forEach((cot: Cotizacion) => {
          if (cot.vendedor) {
            vendedoresDeCotizaciones.add(cot.vendedor)
          }
        })
      }
      
      // Combinar comerciales con vendedores que tienen cotizaciones pero no están marcados como vendedor
      // El endpoint ya filtra por vendedor=true, pero incluimos también los que tienen cotizaciones
      const vendedoresList = [...comerciales]
      
      // Agregar vendedores que tienen cotizaciones pero no están en la lista de comerciales
      if (cotizacionesData.success && cotizacionesData.data) {
        const comercialesIds = new Set(comerciales.map((c: Vendedor) => c.id))
        const comercialesNombres = new Set(comerciales.map((c: Vendedor) => c.nombre))
        
        Array.from(vendedoresDeCotizaciones).forEach(vendedorNombre => {
          // Si no está en la lista de comerciales, agregarlo como vendedor temporal
          if (!comercialesIds.has(vendedorNombre) && !comercialesNombres.has(vendedorNombre)) {
            vendedoresList.push({
              id: vendedorNombre,
              nombre: vendedorNombre,
              email: '',
              imagen_usuario: null
            } as Vendedor)
          }
        })
      }
      
      setVendedores(vendedoresList)
    } catch (error) {
      console.error('Error fetching vendedores:', error)
    }
  }

  const fetchCotizaciones = async (page: number = currentPage) => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('pageSize', '100')
      
      if (filtroEstado !== 'all') {
        params.set('estado', filtroEstado)
      }
      if (searchTerm) {
        params.set('cliente', searchTerm)
      }
      
      const response = await fetch(`/api/cotizaciones?${params.toString()}`)
      const data = await response.json()
      
      if (data.success) {
        setCotizaciones(data.data)
        setPagination(data.pagination || pagination)
        setCurrentPage(page)
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

  // Funciones de paginación
  const handlePageChange = (page: number) => {
    fetchCotizaciones(page)
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

  // Obtener sucursales únicas para el filtro
  const sucursalesUnicas = Array.from(new Set(cotizaciones.map(c => c.sucursal).filter(Boolean)))

  // Filtrar cotizaciones (solo filtros del frontend, la paginación se hace en el backend)
  const filteredCotizaciones = cotizaciones.filter(cotizacion => {
    // Filtro de búsqueda flexible (código, cliente, vendedor) con normalización
    let matchesSearch = true
    if (searchTerm && searchTerm.trim() !== '') {
      const normalizedSearch = normalizeText(searchTerm.trim())
      const normalizedCode = normalizeText(cotizacion.codigo || '')
      const normalizedCliente = normalizeText(cotizacion.cliente || '')
      const normalizedVendedor = normalizeText(cotizacion.vendedor || '')
      
      matchesSearch = normalizedCode.includes(normalizedSearch) ||
        normalizedCliente.includes(normalizedSearch) ||
        normalizedVendedor.includes(normalizedSearch)
    }
    
    // Filtro por vendedor
    const matchesVendedor = filtroVendedor === "all" || cotizacion.vendedor === filtroVendedor
    
    // Filtro por sucursal
    const matchesSucursal = filtroSucursal === "all" || cotizacion.sucursal === filtroSucursal
    
    // Filtro por estado (ya se aplica en el backend)
    const matchesEstado = filtroEstado === "all" || cotizacion.estado === filtroEstado
    
    return matchesSearch && matchesVendedor && matchesSucursal && matchesEstado
  })

  // Función para exportar a CSV
  const handleExport = async () => {
    try {
      setExporting(true)
      const response = await fetch('/api/cotizaciones/export')
      
      if (!response.ok) {
        throw new Error('Error al exportar cotizaciones')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cotizaciones_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Cotizaciones exportadas correctamente')
    } catch (error) {
      console.error('Error exporting:', error)
      toast.error('Error al exportar cotizaciones')
    } finally {
      setExporting(false)
    }
  }

  // Función para descargar PDF de una cotización
  const handleDescargarPDF = async (cotizacionId: string, codigo: string) => {
    try {
      setDescargandoPDF(cotizacionId)
      
      // Obtener los datos completos de la cotización
      const response = await fetch(`/api/cotizaciones/${cotizacionId}`)
      
      if (!response.ok) {
        throw new Error('Error al cargar la cotización')
      }
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Error al cargar cotización')
      }
      
      const cotizacion = data.data.cotizacion
      const lineas = data.data.lineas || []
      
      // Función para calcular el subtotal sin impuestos
      // REGLA: El frontend NUNCA aplica IVA ni IT. Solo calcula subtotal sin impuestos.
      const calcularSubtotalSinImpuestos = (cantidad: number, totalM2: number, precio: number, comision: number, esSoporte: boolean = false, udm?: string) => {
        let subtotal: number
        if (esSoporte) {
          subtotal = cantidad * precio
        } else {
          const udmLower = (udm || '').toLowerCase().trim()
          if (udmLower === 'unidad' || udmLower === 'unidades' || udmLower === 'unidade') {
            subtotal = cantidad * precio
          } else {
            subtotal = cantidad * totalM2 * precio
          }
        }
        
        const comisionTotal = subtotal * (comision / 100)
        
        // NUNCA aplicar IVA/IT aquí - eso lo hace el backend
        return subtotal + comisionTotal
      }
      
      // Validar cada producto individualmente
      const lineasProductos = lineas.filter((linea: any) => 
        linea.tipo === 'Producto' || linea.tipo === 'producto' || (linea.nombre_producto || linea.codigo_producto)
      )
      
      for (const linea of lineasProductos) {
        const esUnidades = (linea.unidad_medida || '').toLowerCase().trim() === 'unidad' || 
                          (linea.unidad_medida || '').toLowerCase().trim() === 'unidades' || 
                          (linea.unidad_medida || '').toLowerCase().trim() === 'unidade'
        
        const subtotalCalculado = calcularSubtotalSinImpuestos(
          linea.cantidad || 1,
          linea.total_m2 || 0,
          linea.precio_unitario || 0,
          linea.comision_porcentaje || linea.comision || 0,
          linea.es_soporte || esUnidades,
          linea.unidad_medida
        )
        
        const subtotalLinea = linea.subtotal_linea || 0
        
        if (subtotalLinea < subtotalCalculado * 0.99) { // Tolerancia del 1% para redondeos
          const nombreProducto = linea.nombre_producto || linea.codigo_producto || 'Producto'
          toast.error(`El producto "${nombreProducto}" tiene un subtotal (${subtotalLinea.toFixed(2)}) menor al calculado (${subtotalCalculado.toFixed(2)}). Por favor corrige antes de descargar.`)
          setDescargandoPDF(null)
          return
        }
      }
      
      // Calcular el subtotal general (sin impuestos) sumando todos los productos
      let subtotalGeneral = 0
      lineasProductos.forEach((linea: any) => {
        subtotalGeneral += linea.subtotal_linea || 0
      })
      
      const totalFinal = cotizacion.total_final || 0
      
      // El total_final del backend ya incluye IVA/IT, no necesitamos validar aquí
      // La validación de precios mínimos ya se hizo arriba para cada línea
      
      // Obtener el email y número del comercial asignado a la cotización
      let vendedorEmail: string | undefined = undefined
      let vendedorNumero: string | null = null
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      
      try {
        // Primero intentar con el endpoint de comerciales (accesible para todos)
        const comercialesResponse = await fetch(`/api/public/comerciales`)
        if (comercialesResponse.ok) {
          const comercialesData = await comercialesResponse.json()
          let vendedor
          
          // Buscar por ID (UUID) o por nombre
          if (cotizacion.vendedor && uuidRegex.test(cotizacion.vendedor)) {
            vendedor = comercialesData.users?.find((u: any) => u.id === cotizacion.vendedor)
          } else if (cotizacion.vendedor) {
            // Buscar por nombre
            vendedor = comercialesData.users?.find((u: any) => 
              u.nombre?.toLowerCase().includes(cotizacion.vendedor.toLowerCase())
            )
          }
          
          if (vendedor) {
            vendedorEmail = vendedor.email
            vendedorNumero = vendedor.numero || null
            console.log('✅ Email del comercial asignado encontrado:', vendedorEmail)
            console.log('✅ Número del comercial asignado encontrado:', vendedorNumero)
          } else {
            console.log('⚠️ No se encontró comercial asignado en comerciales')
          }
        }
      } catch (error) {
        console.error('Error obteniendo datos del comercial asignado:', error)
      }
      
      // Convertir líneas al formato esperado por el generador de PDF
      // DETECCIÓN MEJORADA: Si tiene campos de producto, es un PRODUCTO (compatibilidad con Odoo)
      const productos = lineas.map((linea: any, index: number) => {
        const tieneCamposProducto = (linea.nombre_producto || linea.codigo_producto) && 
                                    (linea.cantidad > 0 || linea.ancho || linea.alto || 
                                     (linea.subtotal_linea && linea.subtotal_linea > 0) || 
                                     (linea.precio_unitario && linea.precio_unitario > 0))
        
        if (tieneCamposProducto || linea.tipo === 'Producto' || linea.tipo === 'producto') {
          return {
            id: linea.id || `${index + 1}`,
            tipo: 'producto' as const,
            producto: linea.codigo_producto && linea.nombre_producto
              ? `${linea.codigo_producto} - ${linea.nombre_producto}`
              : linea.nombre_producto || linea.producto || '',
            descripcion: linea.descripcion || '',
            cantidad: linea.cantidad || 1,
            ancho: linea.ancho || 0,
            alto: linea.alto || 0,
            totalM2: linea.total_m2 || 0,
            udm: linea.unidad_medida || 'm²',
            precio: linea.precio_unitario || 0,
            comision: linea.comision_porcentaje || linea.comision || 0,
            conIVA: linea.con_iva !== undefined ? linea.con_iva : true,
            conIT: linea.con_it !== undefined ? linea.con_it : true,
            total: linea.subtotal_linea || 0,
            esSoporte: linea.es_soporte || false,
            dimensionesBloqueadas: linea.es_soporte || false,
            imagen: linea.imagen_url || linea.imagen || undefined
          }
        } else if (linea.tipo === 'Nota' || linea.tipo === 'nota') {
          return {
            id: linea.id || `${index + 1}`,
            tipo: 'nota' as const,
            texto: linea.texto || linea.descripcion || ''
          }
        } else if (linea.tipo === 'Sección' || linea.tipo === 'Seccion' || linea.tipo === 'seccion') {
          return {
            id: linea.id || `${index + 1}`,
            tipo: 'seccion' as const,
            texto: linea.texto || linea.nombre_producto || ''
          }
        } else {
          // Fallback: Si tiene nombre_producto, tratar como producto
          if (linea.nombre_producto) {
            return {
              id: linea.id || `${index + 1}`,
              tipo: 'producto' as const,
              producto: linea.nombre_producto,
              descripcion: linea.descripcion || '',
              cantidad: linea.cantidad || 1,
              ancho: linea.ancho || 0,
              alto: linea.alto || 0,
              totalM2: linea.total_m2 || 0,
              udm: linea.unidad_medida || 'm²',
              precio: linea.precio_unitario || 0,
              comision: linea.comision_porcentaje || linea.comision || 0,
              conIVA: linea.con_iva !== undefined ? linea.con_iva : true,
              conIT: linea.con_it !== undefined ? linea.con_it : true,
              total: linea.subtotal_linea || 0,
              esSoporte: linea.es_soporte || false,
              dimensionesBloqueadas: linea.es_soporte || false,
              imagen: linea.imagen_url || linea.imagen || undefined
            }
          }
          // Último recurso: sección
          return {
            id: linea.id || `${index + 1}`,
            tipo: 'seccion' as const,
            texto: linea.texto || linea.nombre_producto || ''
          }
        }
      })
      
      // Generar el PDF
      await generarPDFCotizacion({
        codigo: cotizacion.codigo || codigo,
        cliente: cotizacion.cliente || '',
        sucursal: cotizacion.sucursal || '',
        vendedor: cotizacion.vendedor || '',
        vendedorEmail: vendedorEmail,
        vendedorNumero: vendedorNumero, // Usar el número del comercial asignado, no del usuario que descarga
        productos: productos,
        totalGeneral: cotizacion.total_final || 0,
        vigencia: cotizacion.vigencia || 30,
        plazo: cotizacion.plazo || null
      })
      
      toast.success('PDF descargado correctamente')
    } catch (error) {
      console.error('Error descargando PDF:', error)
      toast.error('Error al descargar el PDF')
    } finally {
      setDescargandoPDF(null)
    }
  }

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
          <div className="flex flex-col gap-4">
            {/* Primera fila: Buscador y botones */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por código, cliente o vendedor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <div className="flex gap-2">
                {!loading && tieneFuncionTecnica("ver boton exportar") && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleExport}
                    disabled={exporting || cotizaciones.length === 0}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {exporting ? 'Exportando...' : 'Exportar'}
                  </Button>
                )}
                <Link href="/panel/ventas/nuevo">
                  <Button className="bg-[#D54644] hover:bg-[#B03A38] text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Cotización
                  </Button>
                </Link>
              </div>
            </div>
            {/* Segunda fila: Filtros */}
            <div className="flex flex-wrap gap-2 items-center">
              {/* Filtro por Vendedor */}
              <Select value={filtroVendedor} onValueChange={setFiltroVendedor}>
                <SelectTrigger className="w-48 [&>span]:text-black">
                  <SelectValue placeholder="Vendedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los vendedores</SelectItem>
                  {vendedores.map((v) => (
                    <SelectItem key={v.id} value={v.nombre}>
                      {v.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Filtro por Sucursal */}
              <Select value={filtroSucursal} onValueChange={setFiltroSucursal}>
                <SelectTrigger className="w-48 [&>span]:text-black">
                  <SelectValue placeholder="Sucursal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las sucursales</SelectItem>
                  {sucursalesUnicas.map((suc) => (
                    <SelectItem key={suc} value={suc}>
                      {suc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Filtro por Estado */}
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger className="w-48 [&>span]:text-black">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {Object.entries(ESTADO_META).map(([key, meta]) => (
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
          </div>
        </div>

        {/* Cotizaciones Table */}
        <Card>
          <CardHeader>
            <CardTitle>Listado de Cotizaciones</CardTitle>
            <CardDescription>
              {isLoading ? 'Cargando...' : `${pagination.total} cotizaciones encontradas`}
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
                      <th className="text-left py-3 px-4 w-12">
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
                      <th className="text-center py-3 px-4 font-medium text-gray-900">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCotizaciones.map((cotizacion) => (
                      <tr key={cotizacion.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 w-12 align-middle">
                          <Checkbox
                            checked={selectedCotizaciones.includes(cotizacion.id)}
                            onCheckedChange={(checked) => handleSelectCotizacion(cotizacion.id, checked as boolean)}
                          />
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-1 font-mono text-xs text-gray-800 border border-neutral-200">
                            {cotizacion.codigo}
                          </span>
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <span className="text-sm text-gray-600">
                            {new Date(cotizacion.fecha_creacion).toLocaleDateString('es-ES')}
                          </span>
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <span className="text-sm text-gray-900">{cotizacion.cliente}</span>
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={getVendedorImage(cotizacion.vendedor) || ""} alt={cotizacion.vendedor} />
                              <AvatarFallback className="bg-[#D54644] text-white text-[10px] font-medium">
                                {getInitials(cotizacion.vendedor)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-gray-900">{cotizacion.vendedor}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <span className="text-sm text-gray-600">{cotizacion.sucursal}</span>
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <span className="font-semibold text-green-600">
                            Bs {Number(cotizacion.total_final || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <Badge className={`${getEstadoColor(cotizacion.estado)} flex items-center gap-1 w-fit`}>
                            {getEstadoIcon(cotizacion.estado)}
                            {cotizacion.estado}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 align-middle text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              title="Descargar Cotización"
                              onClick={() => handleDescargarPDF(cotizacion.id, cotizacion.codigo)}
                              disabled={descargandoPDF === cotizacion.id}
                              className="text-gray-600 hover:text-gray-800 hover:bg-gray-200"
                            >
                              {descargandoPDF === cotizacion.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <FileText className="w-4 h-4" />
                              )}
                            </Button>
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

            {/* Paginación */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handlePrevPage}
                    disabled={!pagination.hasPrev || isLoading}
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
                        disabled={isLoading}
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
                    disabled={!pagination.hasNext || isLoading}
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
    </>
  )
}
