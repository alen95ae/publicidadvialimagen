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
import type { Empresa } from "@/lib/types/contabilidad"
import type { Sucursal } from "@/lib/types/contabilidad"

interface BalanceGeneralData {
  activo: { cuenta: string; descripcion: string; saldo: number }[]
  pasivo: { cuenta: string; descripcion: string; saldo: number }[]
  patrimonio: { cuenta: string; descripcion: string; saldo: number }[]
  totales: { total_activo: number; total_pasivo: number; total_patrimonio: number }
}

const TIPOS_COMPROBANTE = [
  { value: "Todos", label: "Todos" },
  { value: "Diario", label: "Diario" },
  { value: "Ingreso", label: "Ingreso" },
  { value: "Egreso", label: "Egreso" },
  { value: "Traspaso", label: "Traspaso" },
  { value: "Ctas por Pagar", label: "Ctas por Pagar" },
]

interface BalanceGeneralFilters {
  empresa_id: string
  sucursal_id: string
  tipo_comprobante: string
  a_fecha: string
  moneda: string
  estado: string
}

export default function BalanceGeneralReporte() {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [filters, setFilters] = useState<BalanceGeneralFilters>({
    empresa_id: "todos",
    sucursal_id: "todos",
    tipo_comprobante: "Todos",
    a_fecha: new Date().toISOString().split("T")[0],
    moneda: "BOB",
    estado: "Todos",
  })

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

  const [loading, setLoading] = useState(false)
  const [exportingExcel, setExportingExcel] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [data, setData] = useState<BalanceGeneralData | null>(null)
  const [hasGenerated, setHasGenerated] = useState(false)

  const handleFilterChange = (field: keyof BalanceGeneralFilters, value: string) => {
    setFilters((prev) => {
      const next = { ...prev, [field]: value }
      if (field === "empresa_id") next.sucursal_id = "todos"
      return next
    })
  }

  const buildParams = () => {
    const params = new URLSearchParams()
    params.set("a_fecha", filters.a_fecha)
    if (filters.empresa_id && filters.empresa_id !== "todos") params.set("empresa_id", filters.empresa_id)
    if (filters.sucursal_id && filters.sucursal_id !== "todos") params.set("sucursal_id", filters.sucursal_id)
    if (filters.moneda) params.set("moneda", filters.moneda)
    if (filters.estado && filters.estado !== "Todos") params.set("estado", filters.estado)
    return params
  }

  const handleGenerarReporte = async () => {
    try {
      setLoading(true)
      setHasGenerated(true)
      const params = buildParams()
      const res = await api(`/api/contabilidad/informes/balance-general?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setData(json.data || null)
        if (json.message) toast.info(json.message)
        else if (json.data?.activo?.length || json.data?.pasivo?.length || json.data?.patrimonio?.length) {
          toast.success("Balance general generado")
        }
      } else {
        const err = await res.json()
        toast.error(err.error || "Error al generar el balance general")
        setData(null)
      }
    } catch (e) {
      console.error("Error balance general:", e)
      toast.error("Error de conexión al generar el balance general")
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleExportarExcel = async () => {
    try {
      setExportingExcel(true)
      const params = buildParams()
      const url = `/api/contabilidad/informes/balance-general/excel?${params.toString()}`
      const response = await fetch(url, { credentials: "include" })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Error al exportar Excel")
      }
      const blob = await response.blob()
      const u = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = u
      a.download = `balance_general_${filters.a_fecha}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(u)
      document.body.removeChild(a)
      toast.success("Excel exportado correctamente")
    } catch (e: any) {
      toast.error(e?.message || "Error al exportar Excel")
    } finally {
      setExportingExcel(false)
    }
  }

  const handleExportarPDF = async () => {
    try {
      setExportingPdf(true)
      const params = buildParams()
      const url = `/api/contabilidad/informes/balance-general/pdf?${params.toString()}`
      const response = await fetch(url, { credentials: "include" })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Error al exportar PDF")
      }
      const blob = await response.blob()
      const u = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = u
      a.download = `balance_general_${filters.a_fecha}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(u)
      document.body.removeChild(a)
      toast.success("PDF exportado correctamente")
    } catch (e: any) {
      toast.error(e?.message || "Error al exportar PDF")
    } finally {
      setExportingPdf(false)
    }
  }

  const tieneDatos = data && (data.activo?.length || data.pasivo?.length || data.patrimonio?.length)

  const monedaSufijo = filters.moneda === "USD" ? "$" : "Bs"

  function formatearNumero(n: number): string {
    const s = Number(n).toFixed(2)
    const [entera, decimal] = s.split(".")
    return `${entera.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${decimal}`
  }

  const totalActivo = data?.totales?.total_activo ?? 0
  const totalPasivo = data?.totales?.total_pasivo ?? 0
  const totalPatrimonio = data?.totales?.total_patrimonio ?? 0
  const sumaPasivoPatrimonio = totalPasivo + totalPatrimonio
  const diferencia = Math.abs(totalActivo - sumaPasivoPatrimonio)
  const noCuadra = diferencia > 0.02

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle>BALANCE GENERAL</CardTitle>
            <CardDescription>
              Configure los filtros para generar el balance general
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
        {/* Sección Empresa (igual que Libro Mayor) */}
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

        {/* Filtros: Tipo de comprobante + A fecha + Moneda */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Filtros</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="tipo_comprobante" className="text-xs text-gray-600">
                Tipo de comprobante
              </Label>
              <Select
                value={filters.tipo_comprobante}
                onValueChange={(v) => handleFilterChange("tipo_comprobante", v)}
              >
                <SelectTrigger id="tipo_comprobante" className="mt-1">
                  <SelectValue placeholder="Tipo de comprobante" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_COMPROBANTE.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                onValueChange={(value) => handleFilterChange("moneda", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BOB">Bolivianos</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Estado */}
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

        <Separator />

        {/* Resultado: ACTIVO / PASIVO / PATRIMONIO */}
        {hasGenerated && (
          <>
            <Separator />
            {!data || (!data.activo?.length && !data.pasivo?.length && !data.patrimonio?.length) ? (
              <p className="text-gray-500 text-sm py-4">
                No hay movimientos hasta la fecha seleccionada.
              </p>
            ) : (
              <div className="space-y-6">
                {noCuadra && (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>
                      El balance no cuadra: Total Activo ≠ Total Pasivo + Patrimonio (diferencia: {formatearNumero(diferencia)} {monedaSufijo})
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* ACTIVO */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">ACTIVO</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="font-mono">Cuenta</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead className="text-right font-mono">Saldo ({monedaSufijo})</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(data?.activo || []).map((r, i) => (
                            <TableRow key={`activo-${i}`}>
                              <TableCell className="font-mono">{r.cuenta}</TableCell>
                              <TableCell className="max-w-[200px] truncate" title={r.descripcion}>{r.descripcion || "—"}</TableCell>
                              <TableCell className="text-right font-mono">{formatearNumero(r.saldo)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <div className="mt-2 pt-2 border-t font-semibold flex justify-between text-sm">
                        <span>Total Activo</span>
                        <span className="font-mono">{formatearNumero(totalActivo)}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* PASIVO */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">PASIVO</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="font-mono">Cuenta</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead className="text-right font-mono">Saldo ({monedaSufijo})</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(data?.pasivo || []).map((r, i) => (
                            <TableRow key={`pasivo-${i}`}>
                              <TableCell className="font-mono">{r.cuenta}</TableCell>
                              <TableCell className="max-w-[200px] truncate" title={r.descripcion}>{r.descripcion || "—"}</TableCell>
                              <TableCell className="text-right font-mono">{formatearNumero(r.saldo)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <div className="mt-2 pt-2 border-t font-semibold flex justify-between text-sm">
                        <span>Total Pasivo</span>
                        <span className="font-mono">{formatearNumero(totalPasivo)}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* PATRIMONIO */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">PATRIMONIO</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="font-mono">Cuenta</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead className="text-right font-mono">Saldo ({monedaSufijo})</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(data?.patrimonio || []).map((r, i) => (
                            <TableRow key={`patrimonio-${i}`}>
                              <TableCell className="font-mono">{r.cuenta}</TableCell>
                              <TableCell className="max-w-[200px] truncate" title={r.descripcion}>{r.descripcion || "—"}</TableCell>
                              <TableCell className="text-right font-mono">{formatearNumero(r.saldo)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <div className="mt-2 pt-2 border-t font-semibold flex justify-between text-sm">
                        <span>Total Patrimonio</span>
                        <span className="font-mono">{formatearNumero(totalPatrimonio)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* TOTAL GENERAL */}
                <Card className="bg-gray-50 border-gray-200">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <span className="font-bold text-gray-900">TOTAL GENERAL</span>
                      <div className="flex gap-6 text-sm">
                        <span><span className="text-gray-600">Activo:</span> <span className="font-mono font-semibold">{formatearNumero(totalActivo)} {monedaSufijo}</span></span>
                        <span><span className="text-gray-600">Pasivo + Patrimonio:</span> <span className="font-mono font-semibold">{formatearNumero(sumaPasivoPatrimonio)} {monedaSufijo}</span></span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}







