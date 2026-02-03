"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  Filter,
  Edit,
  Trash2,
  FileText,
  Loader2,
  X,
  Copy,
  Plus,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/fetcher"
import { usePermisosContext } from "@/hooks/permisos-provider"

const ESTADO_META: Record<string, { label: string; className: string }> = {
  BORRADOR: { label: "Borrador", className: "bg-gray-100 text-gray-800" },
  FACTURADA: { label: "Facturada", className: "bg-green-100 text-green-800" },
  ANULADA: { label: "Anulada", className: "bg-red-100 text-red-800" },
}

const getEstadoColor = (estado: string) => {
  return ESTADO_META[estado]?.className ?? "bg-gray-100 text-gray-800"
}

const getEstadoIcon = (estado: string) => {
  switch (estado) {
    case "FACTURADA":
      return <CheckCircle className="w-4 h-4" />
    case "ANULADA":
      return <XCircle className="w-4 h-4" />
    case "BORRADOR":
    default:
      return <AlertCircle className="w-4 h-4" />
  }
}

interface FacturaManual {
  id: string
  numero: string | null
  fecha: string
  vendedor_id: string | null
  cliente_nombre: string
  cliente_nit: string
  moneda: string
  total: number
  estado: string
  created_at: string
}

interface Vendedor {
  id: string
  nombre: string
}

export default function FacturasManualesListPage() {
  const { tieneFuncionTecnica, puedeEliminar, esAdmin } = usePermisosContext()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [facturas, setFacturas] = useState<FacturaManual[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [filtroVendedor, setFiltroVendedor] = useState("all")
  const [filtroEstado, setFiltroEstado] = useState("all")
  const [exporting, setExporting] = useState(false)
  const [descargandoPDF, setDescargandoPDF] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })
  const [filtersLoaded, setFiltersLoaded] = useState(false)

  useEffect(() => {
    const saved = sessionStorage.getItem("facturas_manuales_filtros")
    if (saved) {
      try {
        const f = JSON.parse(saved)
        setSearchTerm(f.searchTerm ?? "")
        setFiltroVendedor(f.filtroVendedor ?? "all")
        setFiltroEstado(f.filtroEstado ?? "all")
      } catch (_) {}
    }
    setFiltersLoaded(true)
  }, [])

  useEffect(() => {
    if (!filtersLoaded) return
    sessionStorage.setItem(
      "facturas_manuales_filtros",
      JSON.stringify({ searchTerm, filtroVendedor, filtroEstado })
    )
  }, [searchTerm, filtroVendedor, filtroEstado, filtersLoaded])

  useEffect(() => {
    if (!filtersLoaded) return
    setCurrentPage(1)
  }, [filtroVendedor, filtroEstado, searchTerm, filtersLoaded])

  useEffect(() => {
    if (!filtersLoaded) return
    fetchFacturas(currentPage)
  }, [currentPage, filtroVendedor, filtroEstado, searchTerm, filtersLoaded])

  useEffect(() => {
    fetchVendedores()
  }, [facturas])

  const fetchVendedores = async () => {
    try {
      const res = await fetch("/api/public/comerciales")
      const data = await res.json()
      setVendedores(data.users || [])
    } catch (_) {}
  }

  const fetchFacturas = async (page: number) => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      params.set("page", page.toString())
      params.set("limit", "50")
      if (filtroEstado !== "all") params.set("estado", filtroEstado)
      if (searchTerm.trim()) params.set("search", searchTerm.trim())
      if (filtroVendedor !== "all") params.set("vendedor", filtroVendedor)

      const res = await api(`/api/contabilidad/facturas-manuales?${params.toString()}`)
      const data = await res.json().catch(() => ({}))
      if (data.success) {
        setFacturas(data.data || [])
        setPagination(data.pagination || pagination)
        setCurrentPage(page)
      } else {
        toast.error("Error al cargar facturas")
      }
    } catch (_) {
      toast.error("Error al cargar facturas")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredFacturas = facturas.filter((f) => {
    const matchSearch =
      !searchTerm.trim() ||
      (f.numero || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.cliente_nombre || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.cliente_nit || "").toLowerCase().includes(searchTerm.toLowerCase())
    const matchVendedor = filtroVendedor === "all" || f.vendedor_id === filtroVendedor
    const matchEstado = filtroEstado === "all" || f.estado === filtroEstado
    return matchSearch && matchVendedor && matchEstado
  })

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta factura?")) return
    try {
      const res = await api(`/api/contabilidad/facturas-manuales/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Factura eliminada")
        setCurrentPage(1)
        fetchFacturas(1)
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || "Error al eliminar")
      }
    } catch (_) {
      toast.error("Error al eliminar")
    }
  }

  const handleDuplicate = async (id: string) => {
    try {
      const [resFactura, resNumero] = await Promise.all([
        api(`/api/contabilidad/facturas-manuales/${id}`),
        api("/api/contabilidad/facturas-manuales/generar-numero"),
      ])
      const json = await resFactura.json().catch(() => ({}))
      if (!resFactura.ok || !json.success) {
        toast.error(json.error || "Error al cargar factura")
        return
      }
      const numeroJson = await resNumero.json().catch(() => ({}))
      const siguienteCodigo = numeroJson.success && numeroJson.codigo ? numeroJson.codigo : null
      const { data } = json
      const payload = {
        numero: siguienteCodigo,
        fecha: data.fecha,
        vendedor_id: data.vendedor_id,
        cliente_nombre: data.cliente_nombre,
        cliente_nit: data.cliente_nit,
        glosa: data.glosa,
        moneda: data.moneda,
        tipo_cambio: data.tipo_cambio,
        cotizacion: data.cotizacion,
        items: (data.items || []).map((it: any) => ({
          codigo_producto: it.codigo_producto,
          descripcion: it.descripcion,
          cantidad: it.cantidad,
          unidad_medida: it.unidad_medida,
          precio_unitario: it.precio_unitario,
          descuento: it.descuento,
          importe: it.importe,
        })),
      }
      const createRes = await api("/api/contabilidad/facturas-manuales", {
        method: "POST",
        body: JSON.stringify(payload),
      })
      const createJson = await createRes.json().catch(() => ({}))
      if (createRes.ok && createJson.success) {
        toast.success("Factura duplicada")
        setSelectedIds([])
        fetchFacturas(currentPage)
      } else {
        toast.error(createJson.error || "Error al duplicar")
      }
    } catch (_) {
      toast.error("Error al duplicar")
    }
  }

  const handleExportCSV = async () => {
    try {
      setExporting(true)
      const params = new URLSearchParams()
      params.set("format", "csv")
      if (filtroEstado !== "all") params.set("estado", filtroEstado)
      if (filtroVendedor !== "all") params.set("vendedor", filtroVendedor)
      if (searchTerm.trim()) params.set("search", searchTerm.trim())
      const res = await fetch(`/api/contabilidad/facturas-manuales?${params.toString()}`, { credentials: "include" })
      if (!res.ok) throw new Error("Error al exportar")
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `facturas_manuales_${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success("CSV exportado correctamente")
    } catch (_) {
      toast.error("Error al exportar CSV")
    } finally {
      setExporting(false)
    }
  }

  const handleDescargarPDF = (id: string, numero?: string | null) => {
    setDescargandoPDF(id)
    const url = `/api/contabilidad/facturas-manuales/${id}/pdf`
    fetch(url, { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error("Error al descargar")
        return r.blob()
      })
      .then((blob) => {
        const u = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = u
        const codigo = (numero || "").trim() || id.slice(0, 8)
        a.download = `${codigo.replace(/[/\\?%*:|"<>]/g, "-")}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(u)
        document.body.removeChild(a)
        toast.success("PDF descargado")
      })
      .catch(() => toast.error("Error al descargar PDF"))
      .finally(() => setDescargandoPDF(null))
  }

  const eliminarFiltro = (tipo: "busqueda" | "vendedor" | "estado") => {
    if (tipo === "busqueda") setSearchTerm("")
    if (tipo === "vendedor") setFiltroVendedor("all")
    if (tipo === "estado") setFiltroEstado("all")
  }

  const limpiarTodosFiltros = () => {
    setSearchTerm("")
    setFiltroVendedor("all")
    setFiltroEstado("all")
    sessionStorage.removeItem("facturas_manuales_filtros")
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? filteredFacturas.map((f) => f.id) : [])
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds(checked ? [...selectedIds, id] : selectedIds.filter((x) => x !== id))
  }

  const puedeEliminarFactura = puedeEliminar("contabilidad") || esAdmin("contabilidad")

  return (
    <div className="p-6">
      <main className="w-full max-w-full overflow-hidden">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Facturas Manuales</h1>
          <p className="text-gray-600">Listado y gestión de facturas manuales</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-wrap gap-2 items-center flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por número, cliente o NIT..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Select value={filtroVendedor} onValueChange={setFiltroVendedor}>
                  <SelectTrigger className="w-44 [&>span]:text-black relative pl-9 pr-3">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none z-10" />
                    <SelectValue placeholder="Vendedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Vendedor</SelectItem>
                    {vendedores.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                  <SelectTrigger className="w-44 [&>span]:text-black relative pl-9 pr-3">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none z-10" />
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Estado</SelectItem>
                    {Object.entries(ESTADO_META).map(([key, meta]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <span className={`inline-block w-3 h-3 rounded-full ${meta.className}`} />
                          {meta.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 items-center">
                {tieneFuncionTecnica("ver boton exportar") && (
                  <Button
                    variant="outline"
                    onClick={handleExportCSV}
                    disabled={exporting || filteredFacturas.length === 0}
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    {exporting ? "Exportando..." : "Exportar CSV"}
                  </Button>
                )}
                <Link href="/panel/contabilidad/facturas/manuales/nueva">
                  <Button className="bg-red-600 hover:bg-red-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva factura
                  </Button>
                </Link>
              </div>
            </div>

            {(searchTerm || filtroVendedor !== "all" || filtroEstado !== "all") && (
              <div className="flex flex-wrap gap-2 items-center pt-2 border-t">
                {searchTerm && (
                  <div className="flex items-center gap-1 bg-blue-100 hover:bg-blue-200 rounded-full px-3 py-1 text-sm">
                    <span className="font-medium">Búsqueda:</span>
                    <span className="text-gray-700">{searchTerm}</span>
                    <button type="button" onClick={() => eliminarFiltro("busqueda")} className="ml-1 hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                {filtroVendedor !== "all" && (
                  <div className="flex items-center gap-1 bg-green-100 hover:bg-green-200 rounded-full px-3 py-1 text-sm">
                    <span className="font-medium">Vendedor:</span>
                    <span className="text-gray-700">{vendedores.find((v) => v.id === filtroVendedor)?.nombre || filtroVendedor}</span>
                    <button type="button" onClick={() => eliminarFiltro("vendedor")} className="ml-1 hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                {filtroEstado !== "all" && (
                  <div className="flex items-center gap-1 bg-green-100 hover:bg-green-200 rounded-full px-3 py-1 text-sm">
                    <span className="font-medium">Estado:</span>
                    <span className="text-gray-700">{ESTADO_META[filtroEstado]?.label || filtroEstado}</span>
                    <button type="button" onClick={() => eliminarFiltro("estado")} className="ml-1 hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <button type="button" onClick={limpiarTodosFiltros} className="text-sm text-gray-500 hover:text-gray-700 underline ml-2">
                  Limpiar todo
                </button>
              </div>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Listado de Facturas</CardTitle>
            <CardDescription>
              {isLoading ? "Cargando..." : `${pagination.total} facturas encontradas`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedIds.length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-blue-800">
                    {selectedIds.length} factura{selectedIds.length > 1 ? "s" : ""} seleccionada{selectedIds.length > 1 ? "s" : ""}
                  </span>
                  {selectedIds.length === 1 && (
                    <Button variant="outline" size="sm" onClick={() => handleDuplicate(selectedIds[0])}>
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicar factura
                    </Button>
                  )}
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-red-600" />
              </div>
            ) : filteredFacturas.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No se encontraron facturas</p>
                <Link href="/panel/contabilidad/facturas/manuales/nueva">
                  <Button className="mt-4 bg-red-600 hover:bg-red-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Crear primera factura
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 w-12">
                        <Checkbox
                          checked={selectedIds.length === filteredFacturas.length && filteredFacturas.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Número</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Fecha</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Cliente</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">NIT</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Total</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Estado</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFacturas.map((f) => (
                      <tr key={f.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 w-12 align-middle">
                          <Checkbox
                            checked={selectedIds.includes(f.id)}
                            onCheckedChange={(c) => handleSelectOne(f.id, c as boolean)}
                          />
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-1 font-mono text-xs text-gray-800 border border-neutral-200 whitespace-nowrap">
                            {f.numero || "—"}
                          </span>
                        </td>
                        <td className="py-3 px-4 align-middle text-sm text-gray-600">
                          {new Date(f.fecha).toLocaleDateString("es-ES")}
                        </td>
                        <td className="py-3 px-4 align-middle text-sm text-gray-900">{f.cliente_nombre}</td>
                        <td className="py-3 px-4 align-middle text-sm font-mono text-gray-600">{f.cliente_nit || "—"}</td>
                        <td className="py-3 px-4 align-middle font-semibold text-green-600">
                          {f.moneda === "USD" ? "$" : "Bs"} {Number(f.total || 0).toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <Badge className={`${getEstadoColor(f.estado)} flex items-center gap-1 w-fit`}>
                            {getEstadoIcon(f.estado)}
                            {ESTADO_META[f.estado]?.label ?? f.estado}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 align-middle text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Descargar factura"
                              onClick={() => handleDescargarPDF(f.id, f.numero)}
                              disabled={descargandoPDF === f.id}
                              className="text-gray-600 hover:text-gray-800 hover:bg-gray-200"
                            >
                              {descargandoPDF === f.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <FileText className="w-4 h-4" />
                              )}
                            </Button>
                            <Link href={`/panel/contabilidad/facturas/manuales/${f.id}`}>
                              <Button variant="ghost" size="sm" title="Editar" className="text-gray-600 hover:text-gray-800 hover:bg-gray-200">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                            {puedeEliminarFactura && (
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Eliminar"
                                onClick={() => handleDelete(f.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {pagination.totalPages > 1 && !isLoading && filteredFacturas.length > 0 && (
              <div className="flex justify-center mt-8 gap-2 items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchFacturas(currentPage - 1)}
                  disabled={!pagination.hasPrev || currentPage <= 1}
                >
                  Anterior
                </Button>
                <span className="text-sm text-gray-600">
                  Página {currentPage} de {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchFacturas(currentPage + 1)}
                  disabled={!pagination.hasNext}
                >
                  Siguiente
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}