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
import { FileDown, FileSpreadsheet, Play, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/fetcher"
import type { Empresa } from "@/lib/types/contabilidad"
import type { Sucursal } from "@/lib/types/contabilidad"

interface LibroMayorFilters {
  empresa_id: string
  sucursal_id: string
  clasificador: string
  desde_cuenta: string
  hasta_cuenta: string
  fecha_inicial: string
  fecha_final: string
  moneda: string
  estado: string
}

interface MovimientoConSaldo {
  cuenta: string
  descripcion_cuenta: string
  fecha: string
  numero_comprobante: string
  tipo_asiento: string
  glosa_comprobante: string
  glosa_detalle: string
  debe: number
  haber: number
  saldo: number
  orden?: number
}

const CLASIFICADORES = [
  { value: "todos", label: "Todas" },
  { value: "Activo", label: "Activo" },
  { value: "Pasivo", label: "Pasivo" },
  { value: "Patrimonio", label: "Patrimonio" },
  { value: "Ingreso", label: "Ingreso" },
  { value: "Gasto", label: "Gasto" },
]

export default function LibroMayorForm() {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [filters, setFilters] = useState<LibroMayorFilters>({
    empresa_id: "todos",
    sucursal_id: "todos",
    clasificador: "todos",
    desde_cuenta: "",
    hasta_cuenta: "",
    fecha_inicial: new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0],
    fecha_final: new Date().toISOString().split("T")[0],
    moneda: "BOB",
    estado: "Aprobado",
  })

  const [loading, setLoading] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [exportingExcel, setExportingExcel] = useState(false)
  const [movimientos, setMovimientos] = useState<MovimientoConSaldo[]>([])
  const [hasGenerated, setHasGenerated] = useState(false)

  const monedaSufijo = filters.moneda === "USD" ? "$" : "Bs"

  useEffect(() => {
    const loadEmpresas = async () => {
      try {
        const res = await api("/api/contabilidad/empresas?limit=1000")
        if (res.ok) {
          const data = await res.json()
          setEmpresas(data.data || [])
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
          setSucursales(data.data || [])
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

  const handleFilterChange = (field: keyof LibroMayorFilters, value: string) => {
    setFilters((prev) => {
      const next = { ...prev, [field]: value }
      if (field === "empresa_id") next.sucursal_id = "todos"
      return next
    })
  }

  const buildParams = () => {
    const params = new URLSearchParams()
    if (filters.empresa_id && filters.empresa_id !== "todos") {
      params.set("empresa_id", filters.empresa_id)
    }
    if (filters.sucursal_id && filters.sucursal_id !== "todos") {
      params.set("sucursal_id", filters.sucursal_id)
    }
    if (filters.clasificador && filters.clasificador !== "todos") {
      params.set("clasificador", filters.clasificador)
    }
    if (filters.desde_cuenta) params.set("desde_cuenta", filters.desde_cuenta)
    if (filters.hasta_cuenta) params.set("hasta_cuenta", filters.hasta_cuenta)
    if (filters.fecha_inicial) params.set("fecha_inicial", filters.fecha_inicial)
    if (filters.fecha_final) params.set("fecha_final", filters.fecha_final)
    if (filters.moneda) params.set("moneda", filters.moneda)
    if (filters.estado && filters.estado !== "Todos") {
      params.set("estado", filters.estado)
    }
    return params
  }

  const fetchLibroMayor = async () => {
    try {
      setLoading(true)
      setHasGenerated(true)
      const params = buildParams()
      const response = await api(`/api/contabilidad/informes/libro-mayor?${params.toString()}`)

      if (response.ok) {
        const data = await response.json()
        const list: MovimientoConSaldo[] = data.data || []
        setMovimientos(list)
        if (list.length === 0) {
          toast.info("No existen movimientos en el periodo seleccionado")
        } else {
          toast.success(`Se encontraron ${list.length} movimientos`)
        }
      } else {
        const err = await response.json()
        toast.error(err.error || "Error al cargar el libro mayor")
        setMovimientos([])
      }
    } catch (error) {
      console.error("Error fetching libro mayor:", error)
      toast.error("Error de conexión al cargar el libro mayor")
      setMovimientos([])
    } finally {
      setLoading(false)
    }
  }

  const handleExportarExcel = async () => {
    try {
      setExportingExcel(true)
      const params = buildParams()
      const url = `/api/contabilidad/informes/libro-mayor/excel?${params.toString()}`
      const response = await fetch(url, { credentials: "include" })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        toast.error(err.error || "Error al exportar el Excel")
        return
      }

      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = blobUrl
      const hoy = new Date()
      const d = String(hoy.getDate()).padStart(2, "0")
      const m = String(hoy.getMonth() + 1).padStart(2, "0")
      const y = hoy.getFullYear()
      a.download = `libro_mayor_${d}-${m}-${y}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(blobUrl)
      document.body.removeChild(a)
      toast.success("Excel exportado correctamente")
    } catch (error) {
      console.error("Error exporting Excel:", error)
      toast.error("Error al exportar el Excel")
    } finally {
      setExportingExcel(false)
    }
  }

  const handleExportarPDF = async () => {
    try {
      setExportingPdf(true)
      const params = buildParams()
      const url = `/api/contabilidad/informes/libro-mayor/pdf?${params.toString()}`
      const response = await fetch(url, { credentials: "include" })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        toast.error(err.error || "Error al exportar el PDF")
        return
      }

      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = blobUrl
      const hoy = new Date()
      const d = String(hoy.getDate()).padStart(2, "0")
      const m = String(hoy.getMonth() + 1).padStart(2, "0")
      const y = hoy.getFullYear()
      a.download = `libro_mayor_${d}-${m}-${y}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(blobUrl)
      document.body.removeChild(a)
      toast.success("PDF exportado correctamente")
    } catch (error) {
      console.error("Error exporting PDF:", error)
      toast.error("Error al exportar el PDF")
    } finally {
      setExportingPdf(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Configuración del Reporte</CardTitle>
              <CardDescription>
                Configure los filtros para generar el libro mayor
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleExportarExcel}
                variant="outline"
                size="sm"
                disabled={exportingExcel || exportingPdf || loading || movimientos.length === 0}
              >
                {exportingExcel ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                )}
                {exportingExcel ? "Exportando..." : "Exportar Excel"}
              </Button>
              <Button
                onClick={handleExportarPDF}
                variant="outline"
                size="sm"
                disabled={exportingPdf || exportingExcel || loading || movimientos.length === 0}
              >
                {exportingPdf ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileDown className="w-4 h-4 mr-2" />
                )}
                {exportingPdf ? "Exportando..." : "Exportar PDF"}
              </Button>
              <Button
                onClick={fetchLibroMayor}
                size="sm"
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
          {/* Sección Empresa */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Sección Empresa</h3>
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
                        {s.codigo} - {s.sucursal || s.nombre || ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Sección Filtros */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Sección Filtros</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="clasificador" className="text-xs text-gray-600">
                  Clasificador
                </Label>
                <Select
                  value={filters.clasificador}
                  onValueChange={(v) => handleFilterChange("clasificador", v)}
                >
                  <SelectTrigger id="clasificador" className="mt-1">
                    <SelectValue placeholder="Clasificador" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASIFICADORES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="desde_cuenta" className="text-xs text-gray-600">
                  Desde Cuenta
                </Label>
                <Input
                  id="desde_cuenta"
                  value={filters.desde_cuenta}
                  onChange={(e) => handleFilterChange("desde_cuenta", e.target.value)}
                  placeholder="Ej: 1.1.1.001"
                  className="mt-1 font-mono"
                />
              </div>
              <div>
                <Label htmlFor="hasta_cuenta" className="text-xs text-gray-600">
                  Hasta Cuenta
                </Label>
                <Input
                  id="hasta_cuenta"
                  value={filters.hasta_cuenta}
                  onChange={(e) => handleFilterChange("hasta_cuenta", e.target.value)}
                  placeholder="Ej: 1.1.1.999"
                  className="mt-1 font-mono"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Sección Fechas */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Sección Fechas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fecha_inicial" className="text-xs text-gray-600">
                  Fecha Inicial
                </Label>
                <Input
                  id="fecha_inicial"
                  type="date"
                  value={filters.fecha_inicial}
                  onChange={(e) => handleFilterChange("fecha_inicial", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="fecha_final" className="text-xs text-gray-600">
                  Fecha Final
                </Label>
                <Input
                  id="fecha_final"
                  type="date"
                  value={filters.fecha_final}
                  onChange={(e) => handleFilterChange("fecha_final", e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Sección Moneda y Estado */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Moneda y Estado</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Label className="text-xs text-gray-600 mb-2 block">Estado del comprobante</Label>
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
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Resultados */}
      <Card>
        <CardHeader>
          <CardTitle>Resultados</CardTitle>
          <CardDescription>
            {movimientos.length > 0
              ? `${movimientos.length} movimientos encontrados`
              : hasGenerated
                ? "No existen movimientos en el periodo seleccionado"
                : "Configure los filtros y haga clic en Generar Reporte para ver los resultados"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">Fecha</TableHead>
                    <TableHead className="w-32">Nº Comprobante</TableHead>
                    <TableHead className="w-28">Cuenta</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Glosa</TableHead>
                    <TableHead className="w-28 text-right">Debe ({monedaSufijo})</TableHead>
                    <TableHead className="w-28 text-right">Haber ({monedaSufijo})</TableHead>
                    <TableHead className="w-28 text-right">Saldo ({monedaSufijo})</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-gray-500 py-12">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                        Generando reporte...
                      </TableCell>
                    </TableRow>
                  ) : movimientos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-gray-500 py-12">
                        {hasGenerated
                          ? "No existen movimientos en el periodo seleccionado"
                          : "Configure los filtros y haga clic en Generar Reporte para ver los resultados"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    movimientos.map((mov, index) => (
                      <TableRow key={`${mov.cuenta}-${mov.fecha}-${mov.numero_comprobante}-${index}`}>
                        <TableCell className="font-mono text-sm">
                          {mov.fecha ? new Date(mov.fecha).toLocaleDateString("es-BO") : "-"}
                        </TableCell>
                        <TableCell className="font-mono font-semibold">
                          {mov.numero_comprobante || "-"}
                        </TableCell>
                        <TableCell className="font-mono font-medium">
                          {mov.cuenta}
                        </TableCell>
                        <TableCell>
                          {mov.descripcion_cuenta ? (
                            <span className="text-sm">{mov.descripcion_cuenta}</span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {mov.glosa_comprobante ? (
                            <span className="text-sm">{mov.glosa_comprobante}</span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {mov.debe !== 0
                            ? mov.debe.toLocaleString("es-ES", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {mov.haber !== 0
                            ? mov.haber.toLocaleString("es-ES", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          {mov.saldo.toLocaleString("es-ES", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
