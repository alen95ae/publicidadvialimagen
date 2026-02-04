"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Play, Loader2, FileDown, FileSpreadsheet, ChevronsUpDown, Check } from "lucide-react"
import { api } from "@/lib/fetcher"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { Cuenta } from "@/lib/types/contabilidad"

interface BalanceSumasSaldosFilters {
  gestion: number
  periodo: number
  estado: string
  desde_cuenta: string
  hasta_cuenta: string
  incluir_sin_movimiento: boolean
  nivel: string
  tipo_cuenta: string
}

interface BalanceSumasSaldosRow {
  cuenta: string
  descripcion: string
  nivel: number
  tipo_cuenta: string
  debe_bs: number
  haber_bs: number
  debe_usd: number
  haber_usd: number
  saldo_bs: number
  saldo_usd: number
}

const MESES = [
  { value: 1, label: "Enero" },
  { value: 2, label: "Febrero" },
  { value: 3, label: "Marzo" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Mayo" },
  { value: 6, label: "Junio" },
  { value: 7, label: "Julio" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Septiembre" },
  { value: 10, label: "Octubre" },
  { value: 11, label: "Noviembre" },
  { value: 12, label: "Diciembre" },
]

export default function BalanceSumasSaldosReporte() {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  const [loadingCuentas, setLoadingCuentas] = useState(false)
  const [openDesdeCuenta, setOpenDesdeCuenta] = useState(false)
  const [openHastaCuenta, setOpenHastaCuenta] = useState(false)
  const [filteredCuentasDesde, setFilteredCuentasDesde] = useState<Cuenta[]>([])
  const [filteredCuentasHasta, setFilteredCuentasHasta] = useState<Cuenta[]>([])
  const [loading, setLoading] = useState(false)
  const [exportingPDF, setExportingPDF] = useState(false)
  const [exportingExcel, setExportingExcel] = useState(false)
  const [data, setData] = useState<BalanceSumasSaldosRow[]>([])
  const [filters, setFilters] = useState<BalanceSumasSaldosFilters>({
    gestion: currentYear,
    periodo: currentMonth,
    estado: "Todos",
    desde_cuenta: "",
    hasta_cuenta: "",
    incluir_sin_movimiento: false,
    nivel: "",
    tipo_cuenta: "",
  })

  useEffect(() => {
    const loadCuentas = async () => {
      try {
        setLoadingCuentas(true)
        const res = await api("/api/contabilidad/cuentas?limit=10000")
        if (res.ok) {
          const d = await res.json()
          const list = d.data || []
          setCuentas(list)
          setFilteredCuentasDesde(list.slice(0, 20))
          setFilteredCuentasHasta(list.slice(0, 20))
        }
      } catch (e) {
        console.error("Error loading cuentas:", e)
      } finally {
        setLoadingCuentas(false)
      }
    }
    loadCuentas()
  }, [])

  const handleFilterChange = (field: keyof BalanceSumasSaldosFilters, value: string | number | boolean) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const filtrarCuentasDesde = (searchValue: string) => {
    if (!searchValue?.trim()) {
      setFilteredCuentasDesde(cuentas.slice(0, 20))
      return
    }
    const search = searchValue.toLowerCase().trim()
    const filtered = cuentas
      .filter((c) => {
        const codigo = (c.cuenta || "").toLowerCase()
        const desc = (c.descripcion || "").toLowerCase()
        return codigo.startsWith(search) || desc.includes(search)
      })
      .slice(0, 20)
    setFilteredCuentasDesde(filtered)
  }
  const filtrarCuentasHasta = (searchValue: string) => {
    if (!searchValue?.trim()) {
      setFilteredCuentasHasta(cuentas.slice(0, 20))
      return
    }
    const search = searchValue.toLowerCase().trim()
    const filtered = cuentas
      .filter((c) => {
        const codigo = (c.cuenta || "").toLowerCase()
        const desc = (c.descripcion || "").toLowerCase()
        return codigo.startsWith(search) || desc.includes(search)
      })
      .slice(0, 20)
    setFilteredCuentasHasta(filtered)
  }
  const getCuentaDisplayText = (cuentaCodigo: string) => {
    if (!cuentaCodigo) return "Seleccionar cuenta..."
    const c = cuentas.find((x) => String(x.cuenta || "").trim() === String(cuentaCodigo).trim())
    if (c) return `${c.cuenta} - ${c.descripcion || ""}`
    return cuentaCodigo
  }

  const handleGenerarReporte = async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams()
      params.append("empresa_id", "1") // Hardcoded según especificación
      params.append("gestion", filters.gestion.toString())
      params.append("periodo", filters.periodo.toString())
      
      // Estado: solo enviar si no es "Todos"
      if (filters.estado !== "Todos") {
        params.append("estado", filters.estado)
      }
      
      if (filters.desde_cuenta) {
        params.append("desde_cuenta", filters.desde_cuenta)
      }
      if (filters.hasta_cuenta) {
        params.append("hasta_cuenta", filters.hasta_cuenta)
      }
      if (!filters.incluir_sin_movimiento) {
        params.append("incluir_sin_movimiento", "false")
      }
      if (filters.nivel) {
        params.append("nivel", filters.nivel)
      }
      if (filters.tipo_cuenta) {
        params.append("tipo_cuenta", filters.tipo_cuenta)
      }

      const response = await api(`/api/contabilidad/balance-sumas-saldos?${params.toString()}`)
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setData(result.data || [])
          toast.success(`Balance generado: ${result.data?.length || 0} cuentas`)
        } else {
          toast.error(result.error || "Error al generar el balance")
          setData([])
        }
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al generar el balance")
        setData([])
      }
    } catch (error) {
      console.error("Error generating balance:", error)
      toast.error("Error de conexión al generar el balance")
      setData([])
    } finally {
      setLoading(false)
    }
  }

  const construirParams = () => {
    const params = new URLSearchParams()
    params.append("empresa_id", "1")
    params.append("gestion", filters.gestion.toString())
    params.append("periodo", filters.periodo.toString())
    
    if (filters.estado !== "Todos") {
      params.append("estado", filters.estado)
    }
    
    if (filters.desde_cuenta) {
      params.append("desde_cuenta", filters.desde_cuenta)
    }
    if (filters.hasta_cuenta) {
      params.append("hasta_cuenta", filters.hasta_cuenta)
    }
    if (!filters.incluir_sin_movimiento) {
      params.append("incluir_sin_movimiento", "false")
    }
    if (filters.nivel) {
      params.append("nivel", filters.nivel)
    }
    if (filters.tipo_cuenta) {
      params.append("tipo_cuenta", filters.tipo_cuenta)
    }
    
    return params
  }

  const handleExportarPDF = async () => {
    if (exportingPDF || exportingExcel) return
    
    try {
      setExportingPDF(true)
      
      const params = construirParams()
      const url = `/api/contabilidad/informes/balance-sumas-saldos/pdf?${params.toString()}`
      console.log("📄 Exportando PDF desde:", url)

      const response = await fetch(url)
      
      if (!response.ok) {
        let errorMessage = "Error al exportar el PDF"
        try {
          // Verificar si la respuesta es JSON antes de parsear
          const contentType = response.headers.get("content-type")
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json()
            errorMessage = errorData.error || errorData.details || errorMessage
            console.error("❌ Error del servidor:", errorData)
          } else {
            // Si no es JSON, intentar leer como texto
            const errorText = await response.text()
            console.error("❌ Error del servidor (texto):", errorText)
            errorMessage = errorText || errorMessage
          }
        } catch (e) {
          console.error("❌ Error al parsear respuesta:", e)
          errorMessage = `Error ${response.status}: ${response.statusText}`
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
      a.download = `balance_sumas_saldos_${dia}-${mes}-${año}.pdf`
      
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
      
      const params = construirParams()
      const url = `/api/contabilidad/informes/balance-sumas-saldos/excel?${params.toString()}`
      console.log("📊 Exportando Excel desde:", url)

      const response = await fetch(url)
      
      if (!response.ok) {
        let errorMessage = "Error al exportar el Excel"
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
          console.error("❌ Error del servidor:", errorData)
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
      a.download = `balance_sumas_saldos_${dia}-${mes}-${año}.xlsx`
      
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>BALANCE DE SUMAS Y SALDOS</CardTitle>
            <CardDescription>
              Configure los filtros para generar el balance de sumas y saldos
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleExportarExcel}
              disabled={exportingPDF || exportingExcel}
              variant="outline"
              size="sm"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              {exportingExcel ? "Exportando..." : "Exportar Excel"}
            </Button>
            <Button
              onClick={handleExportarPDF}
              disabled={exportingPDF || exportingExcel}
              variant="outline"
              size="sm"
            >
              <FileDown className="w-4 h-4 mr-2" />
              {exportingPDF ? "Exportando..." : "Exportar PDF"}
            </Button>
            <Button
              onClick={handleGenerarReporte}
              disabled={loading || exportingPDF || exportingExcel}
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Generar Reporte
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filtros Principales */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Filtros Principales</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="gestion" className="text-xs text-gray-600">
                Gestión
              </Label>
              <Input
                id="gestion"
                type="number"
                value={filters.gestion}
                onChange={(e) => handleFilterChange("gestion", parseInt(e.target.value) || currentYear)}
                className="mt-1"
                min="2000"
                max="2100"
              />
            </div>
            <div>
              <Label htmlFor="periodo" className="text-xs text-gray-600">
                Período
              </Label>
              <Select
                value={filters.periodo.toString()}
                onValueChange={(value) => handleFilterChange("periodo", parseInt(value))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MESES.map((mes) => (
                    <SelectItem key={mes.value} value={mes.value.toString()}>
                      {mes.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="estado" className="text-xs text-gray-600">
                Estado
              </Label>
              <Select
                value={filters.estado}
                onValueChange={(value) => handleFilterChange("estado", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aprobado">Aprobado</SelectItem>
                  <SelectItem value="Borrador">Borrador</SelectItem>
                  <SelectItem value="Revertido">Revertido</SelectItem>
                  <SelectItem value="Todos">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        {/* Filtros de Cuentas */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Filtros de Cuentas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-gray-600">Desde la Cuenta</Label>
              <Popover
                open={openDesdeCuenta}
                onOpenChange={(open) => {
                  setOpenDesdeCuenta(open)
                  if (open) setFilteredCuentasDesde(cuentas.slice(0, 20))
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-full mt-1 h-9 justify-between text-sm overflow-hidden",
                      !filters.desde_cuenta && "text-muted-foreground"
                    )}
                  >
                    <span className="truncate text-left flex-1">{getCuentaDisplayText(filters.desde_cuenta)}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Buscar por código o descripción..."
                      className="h-9 border-0 focus:ring-0"
                      onValueChange={filtrarCuentasDesde}
                    />
                    <CommandList>
                      <CommandEmpty>{loadingCuentas ? "Cargando..." : "No se encontraron cuentas."}</CommandEmpty>
                      <CommandGroup>
                        {filteredCuentasDesde.map((c) => (
                          <CommandItem
                            key={c.id}
                            value={`${c.cuenta} ${c.descripcion || ""}`}
                            onSelect={() => {
                              handleFilterChange("desde_cuenta", c.cuenta)
                              setOpenDesdeCuenta(false)
                            }}
                            className="cursor-pointer"
                          >
                            <Check className={cn("mr-2 h-4 w-4", filters.desde_cuenta === c.cuenta ? "opacity-100" : "opacity-0")} />
                            <span className="font-mono font-medium">{c.cuenta}</span>
                            <span className="text-gray-600 truncate ml-2">{c.descripcion}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label className="text-xs text-gray-600">Hasta la Cuenta</Label>
              <Popover
                open={openHastaCuenta}
                onOpenChange={(open) => {
                  setOpenHastaCuenta(open)
                  if (open) setFilteredCuentasHasta(cuentas.slice(0, 20))
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-full mt-1 h-9 justify-between text-sm overflow-hidden",
                      !filters.hasta_cuenta && "text-muted-foreground"
                    )}
                  >
                    <span className="truncate text-left flex-1">{getCuentaDisplayText(filters.hasta_cuenta)}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Buscar por código o descripción..."
                      className="h-9 border-0 focus:ring-0"
                      onValueChange={filtrarCuentasHasta}
                    />
                    <CommandList>
                      <CommandEmpty>{loadingCuentas ? "Cargando..." : "No se encontraron cuentas."}</CommandEmpty>
                      <CommandGroup>
                        {filteredCuentasHasta.map((c) => (
                          <CommandItem
                            key={c.id}
                            value={`${c.cuenta} ${c.descripcion || ""}`}
                            onSelect={() => {
                              handleFilterChange("hasta_cuenta", c.cuenta)
                              setOpenHastaCuenta(false)
                            }}
                            className="cursor-pointer"
                          >
                            <Check className={cn("mr-2 h-4 w-4", filters.hasta_cuenta === c.cuenta ? "opacity-100" : "opacity-0")} />
                            <span className="font-mono font-medium">{c.cuenta}</span>
                            <span className="text-gray-600 truncate ml-2">{c.descripcion}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="nivel" className="text-xs text-gray-600">
                Nivel de Cuenta
              </Label>
              <Select
                value={filters.nivel || undefined}
                onValueChange={(value) => handleFilterChange("nivel", value === "all" ? "" : value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Todos los niveles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los niveles</SelectItem>
                  <SelectItem value="1">Nivel 1</SelectItem>
                  <SelectItem value="2">Nivel 2</SelectItem>
                  <SelectItem value="3">Nivel 3</SelectItem>
                  <SelectItem value="4">Nivel 4</SelectItem>
                  <SelectItem value="5">Nivel 5</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tipo_cuenta" className="text-xs text-gray-600">
                Tipo de Cuenta
              </Label>
              <Select
                value={filters.tipo_cuenta || undefined}
                onValueChange={(value) => handleFilterChange("tipo_cuenta", value === "all" ? "" : value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="Activo">Activo</SelectItem>
                  <SelectItem value="Pasivo">Pasivo</SelectItem>
                  <SelectItem value="Patrimonio">Patrimonio</SelectItem>
                  <SelectItem value="Ingreso">Ingreso</SelectItem>
                  <SelectItem value="Gasto">Gasto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 pt-8">
              <Checkbox
                id="incluir_sin_movimiento"
                checked={filters.incluir_sin_movimiento}
                onCheckedChange={(checked) => handleFilterChange("incluir_sin_movimiento", checked === true)}
              />
              <Label htmlFor="incluir_sin_movimiento" className="text-sm font-normal cursor-pointer">
                Incluir cuentas sin movimiento
              </Label>
            </div>
          </div>
        </div>

        <Separator />

        {/* Tabla de Resultados */}
        {data.length > 0 && (
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Resultados del Balance de Sumas y Saldos</CardTitle>
                <CardDescription>
                  {data.length} cuentas encontradas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-mono">Cuenta</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead className="text-right">Debe BS</TableHead>
                        <TableHead className="text-right">Haber BS</TableHead>
                        <TableHead className="text-right">Saldo BS</TableHead>
                        <TableHead className="text-right">Debe USD</TableHead>
                        <TableHead className="text-right">Haber USD</TableHead>
                        <TableHead className="text-right">Saldo USD</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.map((row, index) => (
                        <TableRow key={`${row.cuenta}-${index}`}>
                          <TableCell className="font-mono">{row.cuenta}</TableCell>
                          <TableCell>{row.descripcion}</TableCell>
                          <TableCell className="text-right">
                            {row.debe_bs.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right">
                            {row.haber_bs.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {row.saldo_bs.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right">
                            {row.debe_usd.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right">
                            {row.haber_usd.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {row.saldo_usd.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
