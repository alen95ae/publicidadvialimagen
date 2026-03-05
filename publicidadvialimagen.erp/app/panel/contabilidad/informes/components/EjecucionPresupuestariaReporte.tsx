"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { FileDown, FileSpreadsheet, Play, Loader2, ChevronDown } from "lucide-react"
import { api } from "@/lib/fetcher"
import { toast } from "sonner"
import type { Empresa, Sucursal } from "@/lib/types/contabilidad"

interface EjecucionPresupuestariaFilters {
  empresa_id: string
  sucursal_id: string
  clasificador: string
  mes: string
  gestion: string
  moneda: string
  estado: string
}

interface EjecucionPresupuestariaFila {
  cuenta: string
  descripcion: string
  presupuestado: number
  ejecutado: number
  diferencia: number
  porcentaje_ejecucion: number | null
}

interface EjecucionPresupuestariaTotales {
  presupuestado: number
  ejecutado: number
  diferencia: number
}

const CLASIFICADOR_FIJO = "CON-CEN"

function formatNum(value: number): string {
  return new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatPorcentaje(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "—"
  return `${formatNum(value)}%`
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

export default function EjecucionPresupuestariaReporte() {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [loading, setLoading] = useState(false)
  const [exportingExcel, setExportingExcel] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [openMes, setOpenMes] = useState(false)
  const [reportData, setReportData] = useState<EjecucionPresupuestariaFila[]>([])
  const [reportTotales, setReportTotales] = useState<EjecucionPresupuestariaTotales | null>(null)
  const [filters, setFilters] = useState<EjecucionPresupuestariaFilters>({
    empresa_id: "todos",
    sucursal_id: "todos",
    clasificador: CLASIFICADOR_FIJO,
    mes:
      new Date().getMonth() + 1 < 10
        ? `0${new Date().getMonth() + 1}`
        : `${new Date().getMonth() + 1}`,
    gestion: new Date().getFullYear().toString(),
    moneda: "BOB",
    estado: "Todos",
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

  const handleFilterChange = (field: keyof EjecucionPresupuestariaFilters, value: string) => {
    setFilters((prev) => {
      const next = { ...prev, [field]: value }
      if (field === "empresa_id") next.sucursal_id = "todos"
      return next
    })
  }

  const handleExportarReporte = async () => {
    setLoading(true)
    setReportData([])
    setReportTotales(null)
    try {
      const params = new URLSearchParams()
      if (filters.empresa_id && filters.empresa_id !== "todos") params.set("empresa_id", filters.empresa_id)
      if (filters.sucursal_id && filters.sucursal_id !== "todos") params.set("sucursal_id", filters.sucursal_id)
      if (filters.clasificador) params.set("clasificador", filters.clasificador)
      params.set("mes", filters.mes)
      params.set("gestion", filters.gestion)
      params.set("moneda", filters.moneda)
      params.set("estado", filters.estado)
      const res = await api(`/api/contabilidad/informes/ejecucion-presupuestaria?${params.toString()}`)
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || "Error al generar el reporte")
        return
      }
      const data = json.data ?? []
      const totales = json.totales ?? null
      setReportData(data)
      setReportTotales(totales)
      if (data.length === 0) toast.info(json.message || "No hay datos con los filtros seleccionados")
      else toast.success(`Se encontraron ${data.length} cuenta(s)`)
    } catch (e) {
      console.error("Error generando ejecución presupuestaria:", e)
      toast.error("Error al generar el reporte")
    } finally {
      setLoading(false)
    }
  }

  const buildQueryParams = () => {
    const params = new URLSearchParams()
    if (filters.empresa_id && filters.empresa_id !== "todos") params.set("empresa_id", filters.empresa_id)
    if (filters.sucursal_id && filters.sucursal_id !== "todos") params.set("sucursal_id", filters.sucursal_id)
    if (filters.clasificador) params.set("clasificador", filters.clasificador)
    params.set("mes", filters.mes)
    params.set("gestion", filters.gestion)
    params.set("moneda", filters.moneda)
    params.set("estado", filters.estado)
    return params.toString()
  }

  const handleExportarExcel = async () => {
    if (!filters.gestion?.trim()) {
      toast.error("Indique la gestión (año) para exportar")
      return
    }
    setExportingExcel(true)
    try {
      const qs = buildQueryParams()
      const base = typeof window !== "undefined" ? window.location.origin : ""
      const res = await fetch(`${base}/api/contabilidad/informes/ejecucion-presupuestaria/excel?${qs}`, { credentials: "include" })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        toast.error(json.error || "Error al generar el Excel")
        return
      }
      const blob = await res.blob()
      const disp = res.headers.get("Content-Disposition")
      const name = disp?.match(/filename="?([^";]+)"?/)?.[1] ?? `ejecucion_presupuestaria_${new Date().toISOString().slice(0, 10)}.xlsx`
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
    if (!filters.gestion?.trim()) {
      toast.error("Indique la gestión (año) para exportar")
      return
    }
    setExportingPdf(true)
    try {
      const qs = buildQueryParams()
      const base = typeof window !== "undefined" ? window.location.origin : ""
      const res = await fetch(`${base}/api/contabilidad/informes/ejecucion-presupuestaria/pdf?${qs}`, { credentials: "include" })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        toast.error(json.error || "Error al generar el PDF")
        return
      }
      const blob = await res.blob()
      const disp = res.headers.get("Content-Disposition")
      const name = disp?.match(/filename="?([^";]+)"?/)?.[1] ?? `ejecucion_presupuestaria_${new Date().toISOString().slice(0, 10)}.pdf`
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
              Configure los filtros para generar el reporte de ejecución presupuestaria
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
              onClick={handleExportarReporte}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              {loading ? "Generando..." : "Exportar Reporte"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Datos generales</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <Label htmlFor="clasificador" className="text-xs text-gray-600">
                Clasificador
              </Label>
              <Input
                id="clasificador"
                value={CLASIFICADOR_FIJO}
                readOnly
                className="mt-1 bg-muted font-mono"
              />
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Filtros</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="w-fit">
              <Label htmlFor="mes" className="text-xs text-gray-600">
                Mes
              </Label>
              <Popover open={openMes} onOpenChange={setOpenMes}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[10.5rem] mt-1 justify-between font-normal"
                  >
                    <span className="truncate">
                      {MESES.find((m) => m.value === filters.mes)?.label ?? "Seleccionar mes"}
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <div className="max-h-[300px] overflow-y-auto">
                    {MESES.map((mes) => (
                      <div
                        key={mes.value}
                        className={`px-3 py-2 cursor-pointer hover:bg-accent text-sm ${filters.mes === mes.value ? "bg-accent font-medium" : ""}`}
                        onClick={() => {
                          handleFilterChange("mes", mes.value)
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
              <Label htmlFor="gestion" className="text-xs text-gray-600">
                Gestión
              </Label>
              <input
                id="gestion"
                type="text"
                inputMode="numeric"
                value={filters.gestion}
                onChange={(e) =>
                  handleFilterChange("gestion", e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                placeholder="Ej: 2025"
                className="flex h-9 w-20 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 mt-1"
              />
            </div>
            <div>
              <Label htmlFor="moneda" className="text-xs text-gray-600">
                Moneda
              </Label>
              <Select
                value={filters.moneda}
                onValueChange={(value) => handleFilterChange("moneda", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BOB">Bolivianos</SelectItem>
                  <SelectItem value="USD">USD (tipo cambio 6.96 Bs/USD)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs text-gray-600 mb-2 block">Estado</Label>
            <RadioGroup
              value={filters.estado}
              onValueChange={(value) => handleFilterChange("estado", value)}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Aprobado" id="estado-aprobado" />
                <Label htmlFor="estado-aprobado" className="text-sm font-normal cursor-pointer">
                  Aprobado
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Borrador" id="estado-borrador" />
                <Label htmlFor="estado-borrador" className="text-sm font-normal cursor-pointer">
                  Borrador
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Todos" id="estado-todos" />
                <Label htmlFor="estado-todos" className="text-sm font-normal cursor-pointer">
                  Todos
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        {(reportData.length > 0 || reportTotales !== null) && (
          <>
            <Separator />
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-700">Resultados</h3>
              <div className="border rounded-md overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-2 font-medium">Código</th>
                      <th className="text-left p-2 font-medium">Cuenta</th>
                      <th className="text-right p-2 font-medium">Presupuestado</th>
                      <th className="text-right p-2 font-medium">Ejecutado</th>
                      <th className="text-right p-2 font-medium">Diferencia</th>
                      <th className="text-right p-2 font-medium">% Ejecución</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((r, i) => (
                      <tr key={`${r.cuenta}-${i}`} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-2 font-mono">{r.cuenta}</td>
                        <td className="p-2 text-muted-foreground max-w-[240px] truncate" title={r.descripcion}>
                          {r.descripcion || "—"}
                        </td>
                        <td className="p-2 text-right tabular-nums">{formatNum(r.presupuestado)}</td>
                        <td className="p-2 text-right tabular-nums">{formatNum(r.ejecutado)}</td>
                        <td className="p-2 text-right tabular-nums">{formatNum(r.diferencia)}</td>
                        <td className="p-2 text-right tabular-nums">{formatPorcentaje(r.porcentaje_ejecucion)}</td>
                      </tr>
                    ))}
                    {reportTotales && (
                      <tr className="border-t-2 bg-muted/50 font-semibold">
                        <td className="p-2" colSpan={2}>
                          TOTALES
                        </td>
                        <td className="p-2 text-right tabular-nums">{formatNum(reportTotales.presupuestado)}</td>
                        <td className="p-2 text-right tabular-nums">{formatNum(reportTotales.ejecutado)}</td>
                        <td className="p-2 text-right tabular-nums">{formatNum(reportTotales.diferencia)}</td>
                        <td className="p-2 text-right tabular-nums">—</td>
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
