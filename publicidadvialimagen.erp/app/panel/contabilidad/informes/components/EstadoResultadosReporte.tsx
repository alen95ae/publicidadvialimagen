"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Play, Loader2, AlertTriangle, FileSpreadsheet, FileDown } from "lucide-react"
import { api } from "@/lib/fetcher"
import { toast } from "sonner"
import type { Empresa, Sucursal } from "@/lib/types/contabilidad"

interface EstadoResultadosFila {
  cuenta: string
  descripcion: string
  saldo: number
}

interface EstadoResultadosTotales {
  total_ingresos: number
  total_costos: number
  total_gastos: number
  utilidad_neta: number
}

interface EstadoResultadosData {
  ingresos: EstadoResultadosFila[]
  costos: EstadoResultadosFila[]
  gastos: EstadoResultadosFila[]
  totales: EstadoResultadosTotales
}

interface EstadoResultadosFilters {
  empresa_id: string
  sucursal_id: string
  desde_fecha: string
  a_fecha: string
  moneda: string
  nivel: string
  estado: string
}

function formatDateToYYYYMMDD(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

// Igual que contabilización de facturas: al abrir, desde = día 1 del mes, hasta = último día del mes (ej. 1 a 30 de abril)
function getFechasMesActual(): { desde: string; hasta: string } {
  const hoy = new Date()
  const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
  return {
    desde: formatDateToYYYYMMDD(primerDiaMes),
    hasta: formatDateToYYYYMMDD(ultimoDiaMes),
  }
}

export default function EstadoResultadosReporte() {
  const { desde, hasta } = getFechasMesActual()
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [filters, setFilters] = useState<EstadoResultadosFilters>({
    empresa_id: "todos",
    sucursal_id: "todos",
    desde_fecha: desde,
    a_fecha: hasta,
    moneda: "BOB",
    nivel: "5",
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

  const handleFilterChange = (field: keyof EstadoResultadosFilters, value: string) => {
    setFilters((prev) => {
      const next = { ...prev, [field]: value }
      if (field === "empresa_id") next.sucursal_id = "todos"
      return next
    })
  }

  const [loading, setLoading] = useState(false)
  const [exportingExcel, setExportingExcel] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [data, setData] = useState<EstadoResultadosData | null>(null)
  const [hasGenerated, setHasGenerated] = useState(false)

  const buildParams = () => {
    const params = new URLSearchParams()
    params.set("desde_fecha", filters.desde_fecha)
    params.set("a_fecha", filters.a_fecha)
    if (filters.empresa_id && filters.empresa_id !== "todos") params.set("empresa_id", filters.empresa_id)
    if (filters.sucursal_id && filters.sucursal_id !== "todos") params.set("sucursal_id", filters.sucursal_id)
    if (filters.moneda) params.set("moneda", filters.moneda)
    if (filters.nivel) params.set("nivel", filters.nivel)
    if (filters.estado) params.set("estado", filters.estado)
    return params
  }

  const handleGenerarReporte = async () => {
    try {
      setLoading(true)
      setHasGenerated(true)
      const params = buildParams()
      const res = await api(`/api/contabilidad/informes/estado-resultados?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setData(json.data || null)
        if (json.message) toast.info(json.message)
        else if (
          json.data?.ingresos?.length ||
          json.data?.costos?.length ||
          json.data?.gastos?.length
        ) {
          toast.success("Estado de resultados generado")
        }
      } else {
        const err = await res.json()
        toast.error(err.error || "Error al generar el estado de resultados")
        setData(null)
      }
    } catch (e) {
      console.error("Error estado de resultados:", e)
      toast.error("Error de conexión al generar el reporte")
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleExportarExcel = async () => {
    try {
      setExportingExcel(true)
      const params = buildParams()
      const url = `/api/contabilidad/informes/estado-resultados/excel?${params.toString()}`
      const response = await fetch(url, { credentials: "include" })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Error al exportar Excel")
      }
      const blob = await response.blob()
      const u = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = u
      a.download = `estado_resultados_${filters.desde_fecha}_${filters.a_fecha}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(u)
      document.body.removeChild(a)
      toast.success("Excel exportado correctamente")
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al exportar Excel")
    } finally {
      setExportingExcel(false)
    }
  }

  const handleExportarPDF = async () => {
    try {
      setExportingPdf(true)
      const params = buildParams()
      const url = `/api/contabilidad/informes/estado-resultados/pdf?${params.toString()}`
      const response = await fetch(url, { credentials: "include" })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Error al exportar PDF")
      }
      const blob = await response.blob()
      const u = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = u
      a.download = `estado_resultados_${filters.desde_fecha}_${filters.a_fecha}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(u)
      document.body.removeChild(a)
      toast.success("PDF exportado correctamente")
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al exportar PDF")
    } finally {
      setExportingPdf(false)
    }
  }

  const niveles = Array.from({ length: 5 }, (_, i) => (i + 1).toString())
  const tieneDatos =
    data &&
    (data.ingresos?.length || data.costos?.length || data.gastos?.length)
  const monedaSufijo = filters.moneda === "USD" ? "$" : "Bs"

  function formatearNumero(n: number): string {
    const s = Number(n).toFixed(2)
    const [entera, decimal] = s.split(".")
    return `${entera.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${decimal}`
  }

  const renderTabla = (
    titulo: string,
    filas: EstadoResultadosFila[],
    total: number
  ) => (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-gray-700">{titulo}</h4>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">Cuenta</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead className="text-right">Saldo ({monedaSufijo})</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-muted-foreground text-center">
                Sin movimientos
              </TableCell>
            </TableRow>
          ) : (
            filas.map((f) => (
              <TableRow key={f.cuenta}>
                <TableCell className="font-mono text-sm">{f.cuenta}</TableCell>
                <TableCell>{f.descripcion || "-"}</TableCell>
                <TableCell className="text-right font-mono">
                  {formatearNumero(f.saldo)}
                </TableCell>
              </TableRow>
            ))
          )}
          {filas.length > 0 && (
            <TableRow className="bg-muted/50 font-semibold">
              <TableCell colSpan={2}>Total {titulo}</TableCell>
              <TableCell className="text-right">
                {formatearNumero(total)}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle>Filtros y Resultados</CardTitle>
            <CardDescription>
              Configure los filtros y genere el reporte
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportarExcel}
              disabled={exportingExcel || exportingPdf || loading || !tieneDatos}
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
              disabled={exportingPdf || exportingExcel || loading || !tieneDatos}
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
              onClick={handleGenerarReporte}
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
        {/* Empresa y Sucursal */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Identificación</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="empresa" className="text-xs text-gray-600">
                Empresa
              </Label>
              <Select
                value={filters.empresa_id}
                onValueChange={(v) => handleFilterChange("empresa_id", v)}
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
                onValueChange={(v) => handleFilterChange("sucursal_id", v)}
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

        {/* Fechas, Moneda, Nivel */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Filtros</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="desde_fecha" className="text-xs text-gray-600">
                Desde Fecha
              </Label>
              <Input
                id="desde_fecha"
                type="date"
                value={filters.desde_fecha}
                onChange={(e) => handleFilterChange("desde_fecha", e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="a_fecha" className="text-xs text-gray-600">
                A Fecha
              </Label>
              <Input
                id="a_fecha"
                type="date"
                value={filters.a_fecha}
                onChange={(e) => handleFilterChange("a_fecha", e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="moneda" className="text-xs text-gray-600">
                Moneda
              </Label>
              <Select
                value={filters.moneda}
                onValueChange={(v) => handleFilterChange("moneda", v)}
              >
                <SelectTrigger id="moneda" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BOB">Bolivianos</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="nivel" className="text-xs text-gray-600">
                Nivel
              </Label>
              <Select
                value={filters.nivel}
                onValueChange={(v) => handleFilterChange("nivel", v)}
              >
                <SelectTrigger id="nivel" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {niveles.map((n) => (
                    <SelectItem key={n} value={n}>
                      Nivel {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs text-gray-600 mb-2 block">Estado</Label>
            <RadioGroup
              value={filters.estado}
              onValueChange={(v) => handleFilterChange("estado", v)}
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

        <Separator />

        {/* Resultados */}
        {hasGenerated && (
          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-gray-700">Resultados</h3>
            {!tieneDatos ? (
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <p className="text-sm">
                  No se encontraron movimientos de cuentas de resultados con los filtros seleccionados.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {renderTabla(
                  "Ingresos",
                  data!.ingresos,
                  data!.totales.total_ingresos
                )}
                {renderTabla(
                  "Costos",
                  data!.costos,
                  data!.totales.total_costos
                )}
                {renderTabla(
                  "Gastos",
                  data!.gastos,
                  data!.totales.total_gastos
                )}
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Utilidad (Pérdida) Neta</span>
                    <span
                      className={`font-mono text-lg ${
                        (data!.totales.utilidad_neta ?? 0) >= 0
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >
                      {formatearNumero(data!.totales.utilidad_neta ?? 0)} {monedaSufijo}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
