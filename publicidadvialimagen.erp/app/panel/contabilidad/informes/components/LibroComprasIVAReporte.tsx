"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { FileDown, FileSpreadsheet, Play, Loader2, ChevronDown } from "lucide-react"
import { api } from "@/lib/fetcher"
import { toast } from "sonner"
import type { Empresa, Sucursal } from "@/lib/types/contabilidad"

interface LibroComprasIVAFilters {
  empresa_id: string
  sucursal_id: string
  periodo_mes: string
  periodo_anio: string
  tipo_reporte: string
}

interface LibroComprasFila {
  fecha: string
  nit: string
  proveedor: string
  nro_factura: string
  nro_autorizacion: string
  codigo_control: string
  importe_total: number
  importe_no_sujeto_cf: number
  subtotal: number
  descuentos: number
  base_credito_fiscal: number
  credito_fiscal: number
}

interface LibroComprasTotales {
  importe_total: number
  importe_no_sujeto_cf: number
  subtotal: number
  descuentos: number
  base_credito_fiscal: number
  credito_fiscal: number
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
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
]

export default function LibroComprasIVAReporte() {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [loading, setLoading] = useState(false)
  const [exportingExcel, setExportingExcel] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [reportData, setReportData] = useState<LibroComprasFila[]>([])
  const [reportTotales, setReportTotales] = useState<LibroComprasTotales | null>(null)
  const [openMes, setOpenMes] = useState(false)
  const [filters, setFilters] = useState<LibroComprasIVAFilters>({
    empresa_id: "todos",
    sucursal_id: "todos",
    periodo_mes: new Date().getMonth() + 1 < 10
      ? `0${new Date().getMonth() + 1}`
      : `${new Date().getMonth() + 1}`,
    periodo_anio: new Date().getFullYear().toString(),
    tipo_reporte: "Impuestos",
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

  const handleFilterChange = (field: keyof LibroComprasIVAFilters, value: string) => {
    setFilters((prev) => {
      const next = { ...prev, [field]: value }
      if (field === "empresa_id") next.sucursal_id = "todos"
      return next
    })
  }

  const handleGenerarArchivo = async () => {
    setLoading(true)
    setReportData([])
    setReportTotales(null)
    try {
      const params = new URLSearchParams()
      if (filters.empresa_id && filters.empresa_id !== "todos") params.set("empresa_id", filters.empresa_id)
      if (filters.sucursal_id && filters.sucursal_id !== "todos") params.set("sucursal_id", filters.sucursal_id)
      params.set("periodo_mes", filters.periodo_mes)
      params.set("periodo_anio", filters.periodo_anio)
      params.set("tipo_reporte", filters.tipo_reporte)
      const res = await api(`/api/contabilidad/informes/libro-compras?${params.toString()}`)
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
    params.set("periodo_mes", filters.periodo_mes)
    params.set("periodo_anio", filters.periodo_anio)
    params.set("tipo_reporte", filters.tipo_reporte)
    return params.toString()
  }

  const handleExportarExcel = async () => {
    setExportingExcel(true)
    try {
      const qs = buildQueryParams()
      const base = typeof window !== "undefined" ? window.location.origin : ""
      const res = await fetch(`${base}/api/contabilidad/informes/libro-compras/excel?${qs}`, { credentials: "include" })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        toast.error(json.error || "Error al generar el Excel")
        return
      }
      const blob = await res.blob()
      const disp = res.headers.get("Content-Disposition")
      const name = disp?.match(/filename="?([^";]+)"?/)?.[1] ?? `libro_compras_iva_${new Date().toISOString().slice(0, 10)}.xlsx`
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
    setExportingPdf(true)
    try {
      const qs = buildQueryParams()
      const base = typeof window !== "undefined" ? window.location.origin : ""
      const res = await fetch(`${base}/api/contabilidad/informes/libro-compras/pdf?${qs}`, { credentials: "include" })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        toast.error(json.error || "Error al generar el PDF")
        return
      }
      const blob = await res.blob()
      const disp = res.headers.get("Content-Disposition")
      const name = disp?.match(/filename="?([^";]+)"?/)?.[1] ?? `libro_compras_iva_${new Date().toISOString().slice(0, 10)}.pdf`
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
              Configure los filtros para generar el libro de compras con I.V.A.
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
              onClick={handleGenerarArchivo}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              {loading ? "Generando..." : "Generar Archivo"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Datos generales */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Datos generales</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        </div>

        <Separator />

        {/* Periodo */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Periodo</h3>
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-fit">
              <Label htmlFor="periodo_mes" className="text-xs text-gray-600">
                Periodo (Mes)
              </Label>
              <Popover open={openMes} onOpenChange={setOpenMes}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[10.5rem] mt-1 justify-between font-normal"
                  >
                    <span className="truncate">{MESES.find((m) => m.value === filters.periodo_mes)?.label ?? "Seleccionar mes"}</span>
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <div className="max-h-[300px] overflow-y-auto">
                    {MESES.map((mes) => (
                      <div
                        key={mes.value}
                        className={`px-3 py-2 cursor-pointer hover:bg-accent text-sm ${filters.periodo_mes === mes.value ? "bg-accent font-medium" : ""}`}
                        onClick={() => {
                          handleFilterChange("periodo_mes", mes.value)
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
              <Label htmlFor="periodo_anio" className="text-xs text-gray-600">
                Año
              </Label>
              <input
                id="periodo_anio"
                type="text"
                inputMode="numeric"
                value={filters.periodo_anio}
                onChange={(e) => handleFilterChange("periodo_anio", e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="Ej: 2025"
                className="flex h-9 w-20 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 mt-1"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Tipo de Reporte */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Tipo de Reporte</h3>
          <div>
            <Label className="text-xs text-gray-600 mb-2 block">Tipo de Reporte</Label>
            <RadioGroup
              value={filters.tipo_reporte}
              onValueChange={(value) => handleFilterChange("tipo_reporte", value)}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Impuestos" id="reporte-impuestos" />
                <Label htmlFor="reporte-impuestos" className="text-sm font-normal cursor-pointer">
                  Reporte para Impuestos
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Control" id="reporte-control" />
                <Label htmlFor="reporte-control" className="text-sm font-normal cursor-pointer">
                  Reporte de Control
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        {reportData.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-700">Resultados</h3>
              <div className="border rounded-md overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-center p-2 font-medium w-10">Nro</th>
                      <th className="text-left p-2 font-medium">Fecha</th>
                      <th className="text-left p-2 font-medium">NIT Proveedor</th>
                      <th className="text-left p-2 font-medium">Razón Social</th>
                      <th className="text-left p-2 font-medium">Nro Factura</th>
                      <th className="text-left p-2 font-medium">Nro Autorización</th>
                      <th className="text-left p-2 font-medium">Cód. Control</th>
                      <th className="text-right p-2 font-medium">Importe Total</th>
                      <th className="text-right p-2 font-medium">No Sujeto a CF</th>
                      <th className="text-right p-2 font-medium">Subtotal</th>
                      <th className="text-right p-2 font-medium">Descuentos</th>
                      <th className="text-right p-2 font-medium">Base Créd. Fiscal</th>
                      <th className="text-right p-2 font-medium">Crédito Fiscal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((r, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-2 text-center tabular-nums">{i + 1}</td>
                        <td className="p-2 whitespace-nowrap">{formatFecha(r.fecha)}</td>
                        <td className="p-2 font-mono">{r.nit}</td>
                        <td className="p-2 max-w-[180px] truncate" title={r.proveedor}>{r.proveedor}</td>
                        <td className="p-2 font-mono">{r.nro_factura}</td>
                        <td className="p-2 font-mono">{r.nro_autorizacion}</td>
                        <td className="p-2 font-mono">{r.codigo_control}</td>
                        <td className="p-2 text-right tabular-nums">{formatNum(r.importe_total)}</td>
                        <td className="p-2 text-right tabular-nums">{formatNum(r.importe_no_sujeto_cf)}</td>
                        <td className="p-2 text-right tabular-nums">{formatNum(r.subtotal)}</td>
                        <td className="p-2 text-right tabular-nums">{formatNum(r.descuentos)}</td>
                        <td className="p-2 text-right tabular-nums">{formatNum(r.base_credito_fiscal)}</td>
                        <td className="p-2 text-right tabular-nums font-medium">{formatNum(r.credito_fiscal)}</td>
                      </tr>
                    ))}
                    {reportTotales && (
                      <tr className="border-t-2 bg-muted/50 font-semibold">
                        <td className="p-2" colSpan={7}>TOTALES</td>
                        <td className="p-2 text-right tabular-nums">{formatNum(reportTotales.importe_total)}</td>
                        <td className="p-2 text-right tabular-nums">{formatNum(reportTotales.importe_no_sujeto_cf)}</td>
                        <td className="p-2 text-right tabular-nums">{formatNum(reportTotales.subtotal)}</td>
                        <td className="p-2 text-right tabular-nums">{formatNum(reportTotales.descuentos)}</td>
                        <td className="p-2 text-right tabular-nums">{formatNum(reportTotales.base_credito_fiscal)}</td>
                        <td className="p-2 text-right tabular-nums">{formatNum(reportTotales.credito_fiscal)}</td>
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







