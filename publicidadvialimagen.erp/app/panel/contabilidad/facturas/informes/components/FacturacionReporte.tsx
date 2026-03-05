"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { FileDown, FileSpreadsheet, Play, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/fetcher"
import type { Empresa, Sucursal } from "@/lib/types/contabilidad"

interface FacturacionFilters {
  empresa_id: string
  sucursal_id: string
  desde_fecha: string
  hasta_fecha: string
  tipo_documento: string
}

interface FacturacionItem {
  nro_documento: string
  fecha: string
  cliente: string
  tipo_documento: string
  subtotal: number
  iva: number
  total: number
  estado: string
}

interface FacturacionTotales {
  subtotal: number
  iva: number
  total: number
}

function formatNum(value: number): string {
  return new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatFecha(fecha: string): string {
  if (!fecha) return ""
  const d = new Date(fecha + "T00:00:00")
  if (Number.isNaN(d.getTime())) return fecha
  const day = String(d.getDate()).padStart(2, "0")
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

function formatDateToYYYYMMDD(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

// Primer día del mes actual y último día del mes actual (como contabilización de facturas)
function getFechasMesActual(): { desde: string; hasta: string } {
  const hoy = new Date()
  const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
  return {
    desde: formatDateToYYYYMMDD(primerDiaMes),
    hasta: formatDateToYYYYMMDD(ultimoDiaMes),
  }
}

export default function FacturacionReporte() {
  const { desde, hasta } = getFechasMesActual()
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [loading, setLoading] = useState(false)
  const [exportingExcel, setExportingExcel] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [reportData, setReportData] = useState<FacturacionItem[]>([])
  const [reportTotales, setReportTotales] = useState<FacturacionTotales | null>(null)
  const [filters, setFilters] = useState<FacturacionFilters>({
    empresa_id: "todos",
    sucursal_id: "todos",
    desde_fecha: desde,
    hasta_fecha: hasta,
    tipo_documento: "TODAS",
  })

  useEffect(() => {
    const loadEmpresas = async () => {
      try {
        const res = await api("/api/contabilidad/empresas?limit=1000")
        if (res.ok) {
          const data = await res.json()
          const list = data.data || []
          setEmpresas(list)
          setFilters((prev) => {
            if (prev.empresa_id !== "todos") return prev
            const defaultEmpresa = list.find((e: Empresa) => e.codigo === "001")
            return { ...prev, empresa_id: defaultEmpresa?.id ?? "todos" }
          })
        }
      } catch (e) {
        console.error("Error loading empresas:", e)
      }
    }
    loadEmpresas()
  }, [])

  useEffect(() => {
    const loadSucursales = async () => {
      try {
        const params = new URLSearchParams()
        params.set("limit", "1000")
        if (filters.empresa_id && filters.empresa_id !== "todos") {
          params.set("empresa_id", filters.empresa_id)
        }
        const res = await api(`/api/contabilidad/sucursales?${params.toString()}`)
        if (res.ok) {
          const data = await res.json()
          const list = data.data || []
          setSucursales(list)
          setFilters((prev) => {
            if (prev.sucursal_id !== "todos") return prev
            const defaultSucursal = list.find((s: Sucursal) => s.codigo === "001.1")
            return { ...prev, sucursal_id: defaultSucursal?.id ?? "todos" }
          })
        } else {
          setSucursales([])
        }
      } catch (e) {
        console.error("Error loading sucursales:", e)
        setSucursales([])
      }
    }
    loadSucursales()
  }, [filters.empresa_id])

  const handleFilterChange = (field: keyof FacturacionFilters, value: string) => {
    setFilters((prev) => {
      const next = { ...prev, [field]: value }
      if (field === "empresa_id") next.sucursal_id = "todos"
      return next
    })
  }

  const handleGenerarReporte = async () => {
    if (!filters.desde_fecha?.trim() || !filters.hasta_fecha?.trim()) {
      toast.error("Indique desde y hasta fecha")
      return
    }
    setLoading(true)
    setReportData([])
    setReportTotales(null)
    try {
      const params = new URLSearchParams()
      if (filters.empresa_id && filters.empresa_id !== "todos") params.set("empresa_id", filters.empresa_id)
      if (filters.sucursal_id && filters.sucursal_id !== "todos") params.set("sucursal_id", filters.sucursal_id)
      params.set("tipo_documento", filters.tipo_documento)
      params.set("desde_fecha", filters.desde_fecha)
      params.set("hasta_fecha", filters.hasta_fecha)
      const res = await api(`/api/contabilidad/informes/reporte-facturacion?${params.toString()}`)
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || "Error al generar el reporte")
        return
      }
      const data = json.data ?? []
      const totales = json.totales ?? null
      setReportData(data)
      setReportTotales(totales)
      if (data.length === 0) toast.info(json.message || "No hay registros con los filtros seleccionados")
      else toast.success(`Se encontraron ${data.length} registro(s)`)
    } catch (e) {
      console.error(e)
      toast.error("Error de conexión al generar el reporte")
    } finally {
      setLoading(false)
    }
  }

  const buildQueryParams = () => {
    const params = new URLSearchParams()
    if (filters.empresa_id && filters.empresa_id !== "todos") params.set("empresa_id", filters.empresa_id)
    if (filters.sucursal_id && filters.sucursal_id !== "todos") params.set("sucursal_id", filters.sucursal_id)
    params.set("tipo_documento", filters.tipo_documento)
    params.set("desde_fecha", filters.desde_fecha)
    params.set("hasta_fecha", filters.hasta_fecha)
    return params.toString()
  }

  const handleExportarExcel = async () => {
    if (!filters.desde_fecha?.trim() || !filters.hasta_fecha?.trim()) {
      toast.error("Indique desde y hasta fecha")
      return
    }
    setExportingExcel(true)
    try {
      const qs = buildQueryParams()
      const base = typeof window !== "undefined" ? window.location.origin : ""
      const res = await fetch(`${base}/api/contabilidad/informes/reporte-facturacion/excel?${qs}`, { credentials: "include" })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        toast.error(json.error || "Error al generar el Excel")
        return
      }
      const blob = await res.blob()
      const disp = res.headers.get("Content-Disposition")
      const name = disp?.match(/filename="?([^";]+)"?/)?.[1] ?? `reporte_facturacion_${new Date().toISOString().slice(0, 10)}.xlsx`
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = name
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Excel descargado")
    } catch (e) {
      console.error(e)
      toast.error("Error al exportar Excel")
    } finally {
      setExportingExcel(false)
    }
  }

  const handleExportarPDF = async () => {
    if (!filters.desde_fecha?.trim() || !filters.hasta_fecha?.trim()) {
      toast.error("Indique desde y hasta fecha")
      return
    }
    setExportingPdf(true)
    try {
      const qs = buildQueryParams()
      const base = typeof window !== "undefined" ? window.location.origin : ""
      const res = await fetch(`${base}/api/contabilidad/informes/reporte-facturacion/pdf?${qs}`, { credentials: "include" })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        toast.error(json.error || "Error al generar el PDF")
        return
      }
      const blob = await res.blob()
      const disp = res.headers.get("Content-Disposition")
      const name = disp?.match(/filename="?([^";]+)"?/)?.[1] ?? `reporte_facturacion_${new Date().toISOString().slice(0, 10)}.pdf`
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = name
      a.click()
      URL.revokeObjectURL(url)
      toast.success("PDF descargado")
    } catch (e) {
      console.error(e)
      toast.error("Error al exportar PDF")
    } finally {
      setExportingPdf(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle>Filtros y Resultados</CardTitle>
            <CardDescription>
              Configure los filtros para generar el reporte de facturación
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportarExcel}
              disabled={exportingExcel || exportingPdf || loading}
            >
              {exportingExcel ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4 mr-2" />
              )}
              {exportingExcel ? "Exportando..." : "Exportar Excel"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportarPDF}
              disabled={exportingPdf || exportingExcel || loading}
            >
              {exportingPdf ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4 mr-2" />
              )}
              {exportingPdf ? "Exportando..." : "Exportar PDF"}
            </Button>
            <Button
              size="sm"
              onClick={() => handleGenerarReporte()}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              {loading ? "Generando..." : "Generar Reporte"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Datos generales</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="empresa" className="text-xs text-gray-600">
                Empresa
              </Label>
              <Select
                value={filters.empresa_id}
                onValueChange={(value) => handleFilterChange("empresa_id", value)}
              >
                <SelectTrigger id="empresa" className="mt-1">
                  <SelectValue placeholder="Seleccionar empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  {empresas.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.codigo} - {e.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sucursal" className="text-xs text-gray-600">
                Sucursal
              </Label>
              <Select
                value={filters.sucursal_id}
                onValueChange={(value) => handleFilterChange("sucursal_id", value)}
              >
                <SelectTrigger id="sucursal" className="mt-1">
                  <SelectValue placeholder="Seleccionar sucursal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  {sucursales.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.codigo} - {s.sucursal ?? "—"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tipo_documento" className="text-xs text-gray-600">
                Tipo de Documento
              </Label>
              <Select
                value={filters.tipo_documento}
                onValueChange={(value) => handleFilterChange("tipo_documento", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODAS">Todas</SelectItem>
                  <SelectItem value="FACTURAS_MANUALES">Facturas Manuales</SelectItem>
                  <SelectItem value="NOTAS_REMISION">Notas de Remisión</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Período</h3>
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-fit">
              <Label htmlFor="desde_fecha" className="text-xs text-gray-600">
                Desde Fecha
              </Label>
              <Input
                id="desde_fecha"
                type="date"
                value={filters.desde_fecha}
                onChange={(e) => handleFilterChange("desde_fecha", e.target.value)}
                className="mt-1 w-[10.5rem]"
              />
            </div>
            <div className="w-fit">
              <Label htmlFor="hasta_fecha" className="text-xs text-gray-600">
                Hasta Fecha
              </Label>
              <Input
                id="hasta_fecha"
                type="date"
                value={filters.hasta_fecha}
                onChange={(e) => handleFilterChange("hasta_fecha", e.target.value)}
                className="mt-1 w-[10.5rem]"
              />
            </div>
          </div>
        </div>

        {reportData.length > 0 && (
          <>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-700">Resultados</h3>
              <div className="border rounded-md overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-2 font-medium">Nº Documento</th>
                      <th className="text-left p-2 font-medium">Fecha</th>
                      <th className="text-left p-2 font-medium">Cliente</th>
                      <th className="text-left p-2 font-medium">Tipo Documento</th>
                      <th className="text-right p-2 font-medium">Subtotal</th>
                      <th className="text-right p-2 font-medium">IVA</th>
                      <th className="text-right p-2 font-medium">Total</th>
                      <th className="text-left p-2 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((item, index) => (
                      <tr key={index} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-2 font-mono">{item.nro_documento}</td>
                        <td className="p-2 whitespace-nowrap">{formatFecha(item.fecha)}</td>
                        <td className="p-2 max-w-[180px] truncate" title={item.cliente}>{item.cliente}</td>
                        <td className="p-2">{item.tipo_documento}</td>
                        <td className="p-2 text-right tabular-nums">{formatNum(item.subtotal)}</td>
                        <td className="p-2 text-right tabular-nums">{formatNum(item.iva)}</td>
                        <td className="p-2 text-right tabular-nums font-medium">{formatNum(item.total)}</td>
                        <td className="p-2">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              item.estado === "Aprobada"
                                ? "bg-green-100 text-green-800"
                                : item.estado === "Anulada"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {item.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {reportTotales && (
                      <tr className="border-t-2 bg-muted/50 font-semibold">
                        <td className="p-2" colSpan={4}>TOTALES</td>
                        <td className="p-2 text-right tabular-nums">{formatNum(reportTotales.subtotal)}</td>
                        <td className="p-2 text-right tabular-nums">{formatNum(reportTotales.iva)}</td>
                        <td className="p-2 text-right tabular-nums">{formatNum(reportTotales.total)}</td>
                        <td className="p-2" />
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
