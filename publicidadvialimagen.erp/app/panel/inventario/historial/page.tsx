"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Filter, Download, X, Info, FileDown, FileSpreadsheet, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface HistorialEntry {
  id: string
  fecha: string
  origen: 'registro_manual' | 'cotizacion_aprobada' | 'cotizacion_rechazada' | 'cotizacion_editada' | 'cotizacion_eliminada'
  referencia_id: string | null
  referencia_codigo: string | null
  item_tipo: 'Recurso' | 'Consumible'
  item_id: string
  item_codigo: string
  item_nombre: string
  sucursal: string
  formato: any | null
  cantidad_udm: number
  unidad_medida: string
  impacto: number
  stock_anterior: number
  stock_nuevo: number
  tipo_movimiento: string | null
  observaciones: string | null
  usuario_id: string | null
  usuario_nombre: string | null
  created_at: string
}

interface Usuario {
  id: string
  nombre: string
  email?: string
  imagen_usuario?: any
}

export default function HistorialPage() {
  const router = useRouter()
  const fechaHoy = new Date().toISOString().split('T')[0]
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const fechaManana = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const [historial, setHistorial] = useState<HistorialEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroItemTipo, setFiltroItemTipo] = useState<string>("all")
  const [filtroOrigen, setFiltroOrigen] = useState<string>("all")
  const [filtroSucursal, setFiltroSucursal] = useState<string>("all")
  const [filtroFechaDesde, setFiltroFechaDesde] = useState<string>("")
  const [filtroFechaHasta, setFiltroFechaHasta] = useState<string>(fechaManana)
  const [busqueda, setBusqueda] = useState<string>("")
  const [filtersLoaded, setFiltersLoaded] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 50
  const [exportingPDF, setExportingPDF] = useState(false)
  const [exportingExcel, setExportingExcel] = useState(false)

  // Función para obtener iniciales del usuario
  const getInitials = (nombre: string | null) => {
    if (!nombre) return "?"
    return nombre
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  // Función para obtener imagen del usuario
  const getUsuarioImage = (usuarioId: string | null) => {
    if (!usuarioId) return null
    const usuario = usuarios.find(u => u.id === usuarioId)
    if (usuario?.imagen_usuario) {
      const imagenData = typeof usuario.imagen_usuario === 'string' 
        ? JSON.parse(usuario.imagen_usuario) 
        : usuario.imagen_usuario
      return imagenData?.url || null
    }
    return null
  }

  const cargarHistorial = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('limit', limit.toString())
      
      if (filtroItemTipo !== "all") {
        params.append('item_tipo', filtroItemTipo)
      }
      
      if (filtroOrigen !== "all") {
        params.append('origen', filtroOrigen)
      }
      
      if (filtroSucursal !== "all") {
        params.append('sucursal', filtroSucursal)
      }
      
      if (filtroFechaDesde) {
        params.append('fecha_desde', filtroFechaDesde)
      }
      
      if (filtroFechaHasta) {
        params.append('fecha_hasta', filtroFechaHasta)
      }
      
      if (busqueda) {
        params.append('referencia_codigo', busqueda)
      }

      const response = await fetch(`/api/inventario/historial?${params.toString()}`)
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al cargar historial')
      }

      setHistorial(data.data || [])
      setTotalPages(data.pagination?.totalPages || 1)
      setTotal(data.pagination?.total || 0)
    } catch (error) {
      console.error('Error cargando historial:', error)
      toast.error(error instanceof Error ? error.message : 'Error al cargar historial')
    } finally {
      setLoading(false)
    }
  }

  // 1) Cargar los filtros una sola vez al montar
  useEffect(() => {
    const saved = sessionStorage.getItem("historial_filtros")
    
    if (saved) {
      try {
        const f = JSON.parse(saved)
        setFiltroItemTipo(f.filtroItemTipo ?? "all")
        setFiltroOrigen(f.filtroOrigen ?? "all")
        setFiltroSucursal(f.filtroSucursal ?? "all")
        setFiltroFechaDesde(f.filtroFechaDesde ?? "")
        setFiltroFechaHasta(f.filtroFechaHasta ?? fechaManana)
        setBusqueda(f.busqueda ?? "")
      } catch (error) {
        console.error('❌ Error parseando filtros guardados:', error)
      }
    }
    
    setFiltersLoaded(true)
  }, [])

  // 2) Guardar los filtros cuando cambien
  useEffect(() => {
    if (!filtersLoaded) return
    
    sessionStorage.setItem("historial_filtros", JSON.stringify({
      filtroItemTipo,
      filtroOrigen,
      filtroSucursal,
      filtroFechaDesde,
      filtroFechaHasta,
      busqueda
    }))
  }, [filtroItemTipo, filtroOrigen, filtroSucursal, filtroFechaDesde, filtroFechaHasta, busqueda, filtersLoaded])

  // Cargar usuarios para avatares
  useEffect(() => {
    const cargarUsuarios = async () => {
      try {
        const response = await fetch('/api/ajustes/usuarios?page=1&pageSize=1000')
        if (response.ok) {
          const data = await response.json()
          setUsuarios(data.users || [])
        }
      } catch (error) {
        console.error('Error cargando usuarios:', error)
      }
    }
    cargarUsuarios()
  }, [])

  // 3) Cargar historial cuando cambien los filtros
  useEffect(() => {
    if (!filtersLoaded) return
    cargarHistorial()
  }, [page, filtroItemTipo, filtroOrigen, filtroSucursal, filtroFechaDesde, filtroFechaHasta, busqueda, filtersLoaded])

  const handleBuscar = () => {
    setPage(1)
    cargarHistorial()
  }

  // Función para limpiar todos los filtros
  const limpiarTodosFiltros = () => {
    setFiltroItemTipo("all")
    setFiltroOrigen("all")
    setFiltroSucursal("all")
    setFiltroFechaDesde("")
    setFiltroFechaHasta(fechaManana)
    setBusqueda("")
    setPage(1)
    sessionStorage.removeItem('historial_filtros')
  }

  // Función para eliminar un filtro específico
  const eliminarFiltro = (tipo: 'itemTipo' | 'origen' | 'sucursal' | 'fechaDesde' | 'fechaHasta' | 'busqueda') => {
    switch (tipo) {
      case 'itemTipo':
        setFiltroItemTipo("all")
        break
      case 'origen':
        setFiltroOrigen("all")
        break
      case 'sucursal':
        setFiltroSucursal("all")
        break
      case 'fechaDesde':
        setFiltroFechaDesde("")
        break
      case 'fechaHasta':
        setFiltroFechaHasta(fechaManana)
        break
      case 'busqueda':
        setBusqueda("")
        break
    }
    setPage(1)
  }

  const getOrigenBadge = (origen: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      'registro_manual': { label: 'Manual', className: 'bg-blue-100 text-blue-800' },
      'cotizacion_aprobada': { label: 'Cot. Aprobada', className: 'bg-green-100 text-green-800' },
      'cotizacion_rechazada': { label: 'Cot. Rechazada', className: 'bg-purple-100 text-purple-800' },
      'cotizacion_editada': { label: 'Cot. Editada', className: 'bg-yellow-100 text-yellow-800' },
      'cotizacion_eliminada': { label: 'Cot. Eliminada', className: 'bg-red-100 text-red-800' }
    }
    const badge = badges[origen] || { label: origen, className: 'bg-gray-100 text-gray-800' }
    return <Badge className={badge.className}>{badge.label}</Badge>
  }

  const getImpactoBadge = (impacto: number) => {
    const esPositivo = impacto >= 0
    return (
      <Badge className={esPositivo ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}>
        {esPositivo ? '+' : ''}{impacto}
      </Badge>
    )
  }

  const construirParamsExportacion = () => {
    const params = new URLSearchParams()
    
    if (filtroItemTipo !== "all") {
      params.append('item_tipo', filtroItemTipo)
    }
    
    if (filtroOrigen !== "all") {
      params.append('origen', filtroOrigen)
    }
    
    if (filtroSucursal !== "all") {
      params.append('sucursal', filtroSucursal)
    }
    
    if (filtroFechaDesde) {
      params.append('fecha_desde', filtroFechaDesde)
    }
    
    if (filtroFechaHasta) {
      params.append('fecha_hasta', filtroFechaHasta)
    }
    
    if (busqueda) {
      params.append('referencia_codigo', busqueda)
    }
    
    return params
  }

  const handleExportarPDF = async () => {
    if (exportingPDF || exportingExcel) return
    
    try {
      setExportingPDF(true)
      
      const params = construirParamsExportacion()
      const url = `/api/inventario/historial/export/pdf?${params.toString()}`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        let errorMessage = "Error al exportar el PDF"
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (e) {
          console.error("❌ Error al parsear respuesta:", e)
        }
        toast.error(errorMessage)
        return
      }

      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = blobUrl
      
      const hoy = new Date()
      const dia = String(hoy.getDate()).padStart(2, '0')
      const mes = String(hoy.getMonth() + 1).padStart(2, '0')
      const año = hoy.getFullYear()
      a.download = `historial_stock_${dia}-${mes}-${año}.pdf`
      
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(blobUrl)
      document.body.removeChild(a)
      
      toast.success("PDF exportado correctamente")
    } catch (error: any) {
      console.error("❌ Error exporting PDF:", error)
      toast.error(error?.message || "Error al exportar el PDF")
    } finally {
      setExportingPDF(false)
    }
  }

  const handleExportarExcel = async () => {
    if (exportingPDF || exportingExcel) return
    
    try {
      setExportingExcel(true)
      
      const params = construirParamsExportacion()
      const url = `/api/inventario/historial/export/excel?${params.toString()}`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        let errorMessage = "Error al exportar el Excel"
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (e) {
          console.error("❌ Error al parsear respuesta:", e)
        }
        toast.error(errorMessage)
        return
      }

      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = blobUrl
      
      const hoy = new Date()
      const dia = String(hoy.getDate()).padStart(2, '0')
      const mes = String(hoy.getMonth() + 1).padStart(2, '0')
      const año = hoy.getFullYear()
      a.download = `historial_stock_${dia}-${mes}-${año}.xlsx`
      
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(blobUrl)
      document.body.removeChild(a)
      
      toast.success("Excel exportado correctamente")
    } catch (error: any) {
      console.error("❌ Error exporting Excel:", error)
      toast.error(error?.message || "Error al exportar el Excel")
    } finally {
      setExportingExcel(false)
    }
  }

  const formatearFecha = (fecha: string) => {
    try {
      const date = new Date(fecha)
      return date.toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return fecha
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Historial de Stock</h1>
        <p className="text-gray-600 mt-2">Registro inmutable de todos los movimientos de stock</p>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Filtros</CardTitle>
            <div className="flex gap-2">
              <Button 
                onClick={handleExportarExcel} 
                variant="outline" 
                size="sm"
                disabled={exportingPDF || exportingExcel || loading || historial.length === 0}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                {exportingExcel ? "Exportando..." : "Exportar Excel"}
              </Button>
              <Button 
                onClick={handleExportarPDF} 
                variant="outline" 
                size="sm"
                disabled={exportingPDF || exportingExcel || loading || historial.length === 0}
              >
                <FileDown className="w-4 h-4 mr-2" />
                {exportingPDF ? "Exportando..." : "Exportar PDF"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-6">
            <div className="space-y-2">
              <Label>Buscar</Label>
              <Input
                placeholder="Código de referencia..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleBuscar()
                  }
                }}
                className="w-80"
              />
            </div>

            <div className="flex flex-wrap items-end justify-evenly gap-6 flex-1">
              <div className="space-y-2">
                <Label>Tipo de ítem</Label>
                <Select value={filtroItemTipo} onValueChange={setFiltroItemTipo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Recurso">Recurso</SelectItem>
                    <SelectItem value="Consumible">Consumible</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Origen</Label>
                <Select value={filtroOrigen} onValueChange={setFiltroOrigen}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="registro_manual">Manual</SelectItem>
                    <SelectItem value="cotizacion_aprobada">Cot. Aprobada</SelectItem>
                    <SelectItem value="cotizacion_rechazada">Cot. Rechazada</SelectItem>
                    <SelectItem value="cotizacion_editada">Cot. Editada</SelectItem>
                    <SelectItem value="cotizacion_eliminada">Cot. Eliminada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sucursal</Label>
                <Select value={filtroSucursal} onValueChange={setFiltroSucursal}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="La Paz">La Paz</SelectItem>
                    <SelectItem value="Santa Cruz">Santa Cruz</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 w-auto">
                <Label>Fecha desde</Label>
                <Input
                  type="date"
                  value={filtroFechaDesde}
                  onChange={(e) => setFiltroFechaDesde(e.target.value)}
                  className="w-auto"
                />
              </div>

              <div className="space-y-2 w-auto">
                <Label>Fecha hasta</Label>
                <Input
                  type="date"
                  value={filtroFechaHasta}
                  onChange={(e) => setFiltroFechaHasta(e.target.value)}
                  className="w-auto"
                />
              </div>
            </div>
          </div>

          {/* Etiquetas de filtros activos */}
          {(filtroItemTipo !== "all" || filtroOrigen !== "all" || filtroSucursal !== "all" || filtroFechaDesde || filtroFechaHasta !== fechaManana || busqueda) && (
            <div className="flex flex-wrap gap-2 items-center mt-4 pt-4 border-t">
              {filtroItemTipo !== "all" && (
                <div className="flex items-center gap-1 bg-blue-100 hover:bg-blue-200 rounded-full px-3 py-1 text-sm">
                  <span className="font-medium">Tipo:</span>
                  <span className="text-gray-700">{filtroItemTipo}</span>
                  <button
                    type="button"
                    onClick={() => eliminarFiltro('itemTipo')}
                    className="ml-1 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              
              {filtroOrigen !== "all" && (
                <div className="flex items-center gap-1 bg-green-100 hover:bg-green-200 rounded-full px-3 py-1 text-sm">
                  <span className="font-medium">Origen:</span>
                  <span className="text-gray-700">
                    {filtroOrigen === 'registro_manual' ? 'Manual' :
                     filtroOrigen === 'cotizacion_aprobada' ? 'Cot. Aprobada' :
                     filtroOrigen === 'cotizacion_rechazada' ? 'Cot. Rechazada' :
                     filtroOrigen === 'cotizacion_editada' ? 'Cot. Editada' :
                     filtroOrigen === 'cotizacion_eliminada' ? 'Cot. Eliminada' :
                     filtroOrigen}
                  </span>
                  <button
                    type="button"
                    onClick={() => eliminarFiltro('origen')}
                    className="ml-1 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              
              {filtroSucursal !== "all" && (
                <div className="flex items-center gap-1 bg-purple-100 hover:bg-purple-200 rounded-full px-3 py-1 text-sm">
                  <span className="font-medium">Sucursal:</span>
                  <span className="text-gray-700">{filtroSucursal}</span>
                  <button
                    type="button"
                    onClick={() => eliminarFiltro('sucursal')}
                    className="ml-1 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              
              {filtroFechaDesde && (
                <div className="flex items-center gap-1 bg-amber-100 hover:bg-amber-200 rounded-full px-3 py-1 text-sm">
                  <span className="font-medium">Desde:</span>
                  <span className="text-gray-700">{filtroFechaDesde}</span>
                  <button
                    type="button"
                    onClick={() => eliminarFiltro('fechaDesde')}
                    className="ml-1 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              
              {filtroFechaHasta !== fechaManana && (
                <div className="flex items-center gap-1 bg-amber-100 hover:bg-amber-200 rounded-full px-3 py-1 text-sm">
                  <span className="font-medium">Hasta:</span>
                  <span className="text-gray-700">{filtroFechaHasta}</span>
                  <button
                    type="button"
                    onClick={() => eliminarFiltro('fechaHasta')}
                    className="ml-1 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              
              {busqueda && (
                <div className="flex items-center gap-1 bg-pink-100 hover:bg-pink-200 rounded-full px-3 py-1 text-sm">
                  <span className="font-medium">Código:</span>
                  <span className="text-gray-700">{busqueda}</span>
                  <button
                    type="button"
                    onClick={() => eliminarFiltro('busqueda')}
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
        </CardContent>
      </Card>

      {/* Tabla de historial */}
      <Card>
        <CardHeader>
          <CardTitle>Registros ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Cargando historial...</div>
          ) : historial.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No hay registros de historial</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Origen</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Ítem</TableHead>
                    <TableHead>Sucursal</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Impacto</TableHead>
                    <TableHead>Stock Anterior</TableHead>
                    <TableHead>Stock Nuevo</TableHead>
                    <TableHead>Tipo Movimiento</TableHead>
                    <TableHead>Referencia</TableHead>
                    <TableHead>Usuario</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historial.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {entry.observaciones && entry.observaciones.trim() !== '' ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 hover:bg-blue-200 cursor-help">
                                    <Info className="w-3 h-3 text-blue-600" />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-sm">
                                  <p className="font-medium mb-1">Observaciones:</p>
                                  <p className="text-sm whitespace-pre-wrap">{entry.observaciones}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <div className="w-5" />
                          )}
                          <span>{formatearFecha(entry.fecha)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getOrigenBadge(entry.origen)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{entry.item_tipo}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {entry.item_nombre.length > 25 ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger className="text-left">
                                    [{entry.item_codigo}] {entry.item_nombre.slice(0, 25) + '…'}
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-sm">
                                    [{entry.item_codigo}] {entry.item_nombre}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              <span>[{entry.item_codigo}] {entry.item_nombre}</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{entry.sucursal}</TableCell>
                      <TableCell>
                        {entry.origen === 'registro_manual' && 
                         entry.formato && 
                         typeof entry.formato === 'object' && 
                         entry.formato.cantidad_formato && 
                         entry.formato.formato_seleccionado ? (
                          <Badge variant="secondary" className="bg-gray-200 text-gray-800 hover:bg-gray-200">
                            {entry.formato.cantidad_formato} {entry.formato.formato_seleccionado}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            {entry.cantidad_udm} {entry.unidad_medida}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{getImpactoBadge(entry.impacto)}</TableCell>
                      <TableCell>{entry.stock_anterior}</TableCell>
                      <TableCell className="font-medium">{entry.stock_nuevo}</TableCell>
                      <TableCell>{entry.tipo_movimiento || '-'}</TableCell>
                      <TableCell>
                        {entry.referencia_codigo ? (
                          <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-1 font-mono text-xs text-gray-800 border border-neutral-200 whitespace-nowrap">
                            {entry.referencia_codigo}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {entry.usuario_nombre ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={getUsuarioImage(entry.usuario_id) || ""} alt={entry.usuario_nombre} />
                              <AvatarFallback className="bg-[#D54644] text-white text-[10px] font-medium">
                                {getInitials(entry.usuario_nombre)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-gray-900">{entry.usuario_nombre}</span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Paginación con estilo de cotizaciones */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1 || loading}
                >
                  Anterior
                </Button>
                
                {/* Mostrar páginas */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(pageNum)}
                      disabled={loading}
                      className={page === pageNum ? "bg-[#D54644] text-white hover:bg-[#B73E3A]" : ""}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages || loading}
                >
                  Siguiente
                </Button>
              </div>
              
              {/* Información de paginación */}
              <div className="ml-4 text-sm text-gray-600">
                {total > 0 ? (
                  <>Mostrando {((page - 1) * limit) + 1} - {Math.min(page * limit, total)} de {total} items</>
                ) : (
                  <>No hay items para mostrar</>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
