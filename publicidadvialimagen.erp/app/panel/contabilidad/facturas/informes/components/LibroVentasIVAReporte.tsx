"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { FileDown, FileSpreadsheet, Play, Loader2, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/fetcher"
import type { Empresa, Sucursal } from "@/lib/types/contabilidad"

interface LibroVentasFilters {
  empresa_id: string
  sucursal_id: string
  periodo: string
  año: string
}

interface LibroVentasFila {
  fecha: string
  nro_factura: string
  nro_autorizacion: string
  estado_factura: string
  nit: string
  cliente: string
  importe_total: number
  importe_ice: number
  iehd: number
  ipj: number
  tasas: number
  exportaciones_exentos: number
  tasa_cero: number
  subtotal: number
  descuentos: number
  base_debito_fiscal: number
  debito_fiscal: number
}

interface LibroVentasTotales {
  importe_total: number
  importe_ice: number
  iehd: number
  ipj: number
  tasas: number
  exportaciones_exentos: number
  tasa_cero: number
  subtotal: number
  descuentos: number
  base_debito_fiscal: number
  debito_fiscal: number
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

const MESES = [
  { value: "1", label: "Enero" },
  { value: "2", label: "Febrero" },
  { value: "3", label: "Marzo" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Mayo" },
  { value: "6", label: "Junio" },
  { value: "7", label: "Julio" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
]

export default function LibroVentasIVAReporte() {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [openMes, setOpenMes] = useState(false)
  const [loading, setLoading] = useState(false)
  const [exportingExcel, setExportingExcel] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [reportData, setReportData] = useState<LibroVentasFila[]>([])
  const [reportTotales, setReportTotales] = useState<LibroVentasTotales | null>(null)
  const [filters, setFilters] = useState<LibroVentasFilters>({
    empresa_id: "todos",
    sucursal_id: "todos",
    periodo: (new Date().getMonth() + 1).toString(),
    año: new Date().getFullYear().toString(),
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

  const handleFilterChange = (field: keyof LibroVentasFilters, value: string) => {
    setFilters((prev) => {
      const next = { ...prev, [field]: value }
      if (field === "empresa_id") next.sucursal_id = "todos"
      return next
    })
  }

  const handleGenerarReporte = async () => {
    if (!filters.periodo || !filters.año?.trim()) {
      toast.error("Seleccione mes y año")
      return
    }
    setLoading(true)
    setReportData([])
    setReportTotales(null)
    try {
      const params = new URLSearchParams()
      if (filters.empresa_id && filters.empresa_id !== "todos") params.set("empresa_id", filters.empresa_id)
      if (filters.sucursal_id && filters.sucursal_id !== "todos") params.set("sucursal_id", filters.sucursal_id)
      params.set("periodo_mes", filters.periodo)
      params.set("periodo_anio", filters.año)
      const res = await api(`/api/contabilidad/informes/libro-ventas?${params.toString()}`)
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || "Error al generar el reporte")
        return
      }
      const data = json.data ?? []
      const totales = json.totales ?? null
      setReportData(data)
      setReportTotales(totales)
      if (data.length === 0) toast.info(json.message || "No hay registros en el periodo seleccionado")
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
    params.set("periodo_mes", filters.periodo)
    params.set("periodo_anio", filters.año)
    return params.toString()
  }

  const handleExportarExcel = async () => {
    if (!filters.periodo || !filters.año?.trim()) {
      toast.error("Seleccione mes y año")
      return
    }
    setExportingExcel(true)
    try {
      const qs = buildQueryParams()
      const base = typeof window !== "undefined" ? window.location.origin : ""
      const res = await fetch(`${base}/api/contabilidad/informes/libro-ventas/excel?${qs}`, { credentials: "include" })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        toast.error(json.error || "Error al generar el Excel")
        return
      }
      const blob = await res.blob()
      const disp = res.headers.get("Content-Disposition")
      const name = disp?.match(/filename="?([^";]+)"?/)?.[1] ?? `libro_ventas_iva_${new Date().toISOString().slice(0, 10)}.xlsx`
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
    if (!filters.periodo || !filters.año?.trim()) {
      toast.error("Seleccione mes y año")
      return
    }
    setExportingPdf(true)
    try {
      const qs = buildQueryParams()
      const base = typeof window !== "undefined" ? window.location.origin : ""
      const res = await fetch(`${base}/api/contabilidad/informes/libro-ventas/pdf?${qs}`, { credentials: "include" })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        toast.error(json.error || "Error al generar el PDF")
        return
      }
      const blob = await res.blob()
      const disp = res.headers.get("Content-Disposition")
      const name = disp?.match(/filename="?([^";]+)"?/)?.[1] ?? `libro_ventas_iva_${new Date().toISOString().slice(0, 10)}.pdf`
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
              Configure los filtros para generar el libro de ventas con I.V.A.
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
            <div className="w-fit">
              <Label htmlFor="periodo" className="text-xs text-gray-600">
                Periodo (Mes)
              </Label>
              <Popover open={openMes} onOpenChange={setOpenMes}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[10.5rem] mt-1 justify-between font-normal"
                  >
                    <span className="truncate">
                      {MESES.find((m) => m.value === filters.periodo)?.label ?? "Seleccionar mes"}
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <div className="max-h-[300px] overflow-y-auto">
                    {MESES.map((mes) => (
                      <div
                        key={mes.value}
                        className={`px-3 py-2 cursor-pointer hover:bg-accent text-sm ${filters.periodo === mes.value ? "bg-accent font-medium" : ""}`}
                        onClick={() => {
                          handleFilterChange("periodo", mes.value)
                          setOpenMes(false)
                        }}
                      >
                        {mes.label}
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="w-fit">
              <Label htmlFor="año" className="text-xs text-gray-600">
                Año
              </Label>
              <Input
                id="año"
                type="text"
                inputMode="numeric"
                value={filters.año}
                onChange={(e) => handleFilterChange("año", e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="Ej: 2025"
                className="h-9 w-20 mt-1"
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
                      <th className="text-center p-2 font-medium w-10">Nro</th>
                      <th className="text-left p-2 font-medium">Fecha</th>
                      <th className="text-left p-2 font-medium">Nro Factura</th>
                      <th className="text-left p-2 font-medium">Nro Autorización</th>
                      <th className="text-center p-2 font-medium w-12">Estado</th>
                      <th className="text-left p-2 font-medium">NIT Cliente</th>
                      <th className="text-left p-2 font-medium">Razón Social</th>
                      <th className="text-right p-2 font-medium">Importe Total</th>
                      <th className="text-right p-2 font-medium">ICE/IEHD/Tasas</th>
                      <th className="text-right p-2 font-medium">Export./Exentos</th>
                      <th className="text-right p-2 font-medium">Tasa Cero</th>
                      <th className="text-right p-2 font-medium">Subtotal</th>
                      <th className="text-right p-2 font-medium">Descuentos</th>
                      <th className="text-right p-2 font-medium">Base D.F.</th>
                      <th className="text-right p-2 font-medium">Débito Fiscal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((r, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-2 text-center tabular-nums">{i + 1}</td>
                        <td className="p-2 whitespace-nowrap">{formatFecha(r.fecha)}</td>
                        <td className="p-2 font-mono">{r.nro_factura}</td>
                        <td className="p-2 font-mono">{r.nro_autorizacion}</td>
                        <td className="p-2 text-center">{r.estado_factura}</td>
                        <td className="p-2 font-mono">{r.nit}</td>
                        <td className="p-2 max-w-[180px] truncate" title={r.cliente}>{r.cliente}</td>
                        <td className="p-2 text-right tabular-nums">{formatNum(r.importe_total)}</td>
                        <td className="p-2 text-right tabular-nums">{formatNum(r.importe_ice + r.iehd + r.ipj + r.tasas)}</td>
                        <td className="p-2 text-right tabular-nums">{formatNum(r.exportaciones_exentos)}</td>
                        <td className="p-2 text-right tabular-nums">{formatNum(r.tasa_cero)}</td>
                        <td className="p-2 text-right tabular-nums">{formatNum(r.subtotal)}</td>
                        <td className="p-2 text-right tabular-nums">{formatNum(r.descuentos)}</td>
                        <td className="p-2 text-right tabular-nums">{formatNum(r.base_debito_fiscal)}</td>
                        <td className="p-2 text-right tabular-nums font-medium">{formatNum(r.debito_fiscal)}</td>
                      </tr>
                    ))}
                    {reportTotales && (
                      <tr className="border-t-2 bg-muted/50 font-semibold">
                        <td className="p-2" colSpan={7}>TOTALES</td>
                        <td className="p-2 text-right tabular-nums">{formatNum(reportTotales.importe_total)}</td>
                        <td className="p-2 text-right tabular-nums">{formatNum(reportTotales.importe_ice + reportTotales.iehd + reportTotales.ipj + reportTotales.tasas)}</td>
                        <td className="p-2 text-right tabular-nums">{formatNum(reportTotales.exportaciones_exentos)}</td>
                        <td className="p-2 text-right tabular-nums">{formatNum(reportTotales.tasa_cero)}</td>
                        <td className="p-2 text-right tabular-nums">{formatNum(reportTotales.subtotal)}</td>
                        <td className="p-2 text-right tabular-nums">{formatNum(reportTotales.descuentos)}</td>
                        <td className="p-2 text-right tabular-nums">{formatNum(reportTotales.base_debito_fiscal)}</td>
                        <td className="p-2 text-right tabular-nums">{formatNum(reportTotales.debito_fiscal)}</td>
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
