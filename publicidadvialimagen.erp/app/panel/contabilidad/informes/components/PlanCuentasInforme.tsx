"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { FileDown, FileSpreadsheet, Search, ChevronsUpDown, Check, Loader2 } from "lucide-react"
import { api } from "@/lib/fetcher"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { Cuenta } from "@/lib/types/contabilidad"

interface PlanCuentasFilters {
  aitb: string
  transaccional: string
  nivel: string
  tipo: string
  desde_cuenta?: string
  hasta_cuenta?: string
}

interface CuentaInforme {
  cuenta: string
  descripcion: string
  nivel: number
  tipo: string
  cuenta_padre?: string | null
  aitb: boolean
  transaccional: boolean
}

export default function PlanCuentasInforme() {
  const [loading, setLoading] = useState(false)
  const [cuentasInforme, setCuentasInforme] = useState<CuentaInforme[]>([])
  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  const [loadingCuentas, setLoadingCuentas] = useState(false)
  const [openDesdeCuenta, setOpenDesdeCuenta] = useState(false)
  const [openHastaCuenta, setOpenHastaCuenta] = useState(false)
  const [filteredCuentasDesde, setFilteredCuentasDesde] = useState<Cuenta[]>([])
  const [filteredCuentasHasta, setFilteredCuentasHasta] = useState<Cuenta[]>([])
  const [filters, setFilters] = useState<PlanCuentasFilters>({
    aitb: "todos",
    transaccional: "todos",
    nivel: "todos",
    tipo: "todos",
    desde_cuenta: "",
    hasta_cuenta: "",
  })
  const [exportingExcel, setExportingExcel] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)

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

  useEffect(() => {
    fetchPlanCuentas()
  }, [])

  const fetchPlanCuentas = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.aitb && filters.aitb !== "todos") params.append("aitb", filters.aitb)
      if (filters.transaccional && filters.transaccional !== "todos") params.append("transaccional", filters.transaccional)
      if (filters.nivel && filters.nivel !== "todos") params.append("nivel", filters.nivel)
      if (filters.tipo && filters.tipo !== "todos") params.append("tipo_cuenta", filters.tipo)
      if (filters.desde_cuenta) params.append("desde_cuenta", filters.desde_cuenta)
      if (filters.hasta_cuenta) params.append("hasta_cuenta", filters.hasta_cuenta)

      const response = await api(`/api/contabilidad/informes/plan-cuentas?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setCuentasInforme(data.data || [])
      } else {
        setCuentasInforme([])
        toast.error("Error al cargar el plan de cuentas")
      }
    } catch (error) {
      console.error("Error fetching plan de cuentas:", error)
      setCuentasInforme([])
      toast.error("Error al cargar el plan de cuentas")
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (field: keyof PlanCuentasFilters, value: string) => {
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

  const handleBuscar = () => {
    fetchPlanCuentas()
  }

  const buildParams = () => {
    const params = new URLSearchParams()
    if (filters.aitb && filters.aitb !== "todos") params.append("aitb", filters.aitb)
    if (filters.transaccional && filters.transaccional !== "todos") params.append("transaccional", filters.transaccional)
    if (filters.nivel && filters.nivel !== "todos") params.append("nivel", filters.nivel)
    if (filters.tipo && filters.tipo !== "todos") params.append("tipo_cuenta", filters.tipo)
    if (filters.desde_cuenta) params.append("desde_cuenta", filters.desde_cuenta)
    if (filters.hasta_cuenta) params.append("hasta_cuenta", filters.hasta_cuenta)
    return params
  }

  const handleExportarExcel = async () => {
    if (exportingExcel || exportingPdf) return
    try {
      setExportingExcel(true)
      const params = buildParams()
      const url = `/api/contabilidad/informes/plan-cuentas/excel?${params.toString()}`
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
      a.download = `plan_cuentas_${d}-${m}-${y}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(blobUrl)
      document.body.removeChild(a)
      toast.success("Excel exportado correctamente")
    } catch (e: any) {
      toast.error(e?.message || "Error al exportar el Excel")
    } finally {
      setExportingExcel(false)
    }
  }

  const handleExportarPDF = async () => {
    if (exportingExcel || exportingPdf) return
    try {
      setExportingPdf(true)
      const params = buildParams()
      const url = `/api/contabilidad/informes/plan-cuentas/pdf?${params.toString()}`
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
      a.download = `plan_cuentas_${d}-${m}-${y}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(blobUrl)
      document.body.removeChild(a)
      toast.success("PDF exportado correctamente")
    } catch (e: any) {
      toast.error(e?.message || "Error al exportar el PDF")
    } finally {
      setExportingPdf(false)
    }
  }

  // Función para calcular indentación según nivel
  const getIndentStyle = (nivel: number) => {
    return { paddingLeft: `${(nivel - 1) * 24}px` }
  }

  // Ordenar cuentas jerárquicamente
  const cuentasOrdenadas = [...cuentasInforme].sort((a, b) => {
    // Ordenar por código de cuenta (jerárquico)
    return a.cuenta.localeCompare(b.cuenta)
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Filtros y Resultados</CardTitle>
            <CardDescription>
              Configure los filtros y visualice el plan de cuentas
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleExportarExcel}
              variant="outline"
              size="sm"
              disabled={exportingExcel || exportingPdf}
            >
              {exportingExcel ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4 mr-2" />
              )}
              Exportar Excel
            </Button>
            <Button
              onClick={handleExportarPDF}
              variant="outline"
              size="sm"
              disabled={exportingExcel || exportingPdf}
            >
              {exportingPdf ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4 mr-2" />
              )}
              Exportar PDF
            </Button>
            <Button onClick={handleBuscar} size="sm" className="bg-red-600 hover:bg-red-700 text-white">
              <Search className="w-4 h-4 mr-2" />
              Buscar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div>
              <Label className="text-xs text-gray-600">AITB</Label>
              <Select
                value={filters.aitb}
                onValueChange={(v) => handleFilterChange("aitb", v)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="true">Sí</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-600">Transaccional</Label>
              <Select
                value={filters.transaccional}
                onValueChange={(v) => handleFilterChange("transaccional", v)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="true">Sí</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-600">Nivel</Label>
              <Select
                value={filters.nivel}
                onValueChange={(v) => handleFilterChange("nivel", v)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-600">Tipo</Label>
              <Select
                value={filters.tipo}
                onValueChange={(v) => handleFilterChange("tipo", v)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="Activo">Activo</SelectItem>
                  <SelectItem value="Pasivo">Pasivo</SelectItem>
                  <SelectItem value="Patrimonio">Patrimonio</SelectItem>
                  <SelectItem value="Ingreso">Ingreso</SelectItem>
                  <SelectItem value="Gasto">Gasto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-600">Desde Cuenta</Label>
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
                    <span className="truncate text-left flex-1">{getCuentaDisplayText(filters.desde_cuenta || "")}</span>
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
              <Label className="text-xs text-gray-600">Hasta Cuenta</Label>
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
                    <span className="truncate text-left flex-1">{getCuentaDisplayText(filters.hasta_cuenta || "")}</span>
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
        </div>

        {/* Tabla de resultados */}
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Cargando plan de cuentas...</div>
            ) : cuentasOrdenadas.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No se encontraron cuentas con los filtros seleccionados
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">Cuenta</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="w-24 text-center">Nivel</TableHead>
                    <TableHead className="w-32">Tipo</TableHead>
                    <TableHead className="w-20 text-center">AITB</TableHead>
                    <TableHead className="w-24 text-center">Transaccional</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cuentasOrdenadas.map((cuenta, index) => (
                    <TableRow key={`${cuenta.cuenta}-${index}`}>
                      <TableCell
                        className="font-mono font-semibold"
                        style={getIndentStyle(cuenta.nivel)}
                      >
                        {cuenta.cuenta}
                      </TableCell>
                      <TableCell style={getIndentStyle(cuenta.nivel)}>
                        {cuenta.descripcion}
                      </TableCell>
                      <TableCell className="text-center">{cuenta.nivel}</TableCell>
                      <TableCell>{cuenta.tipo || "-"}</TableCell>
                      <TableCell className="text-center">{cuenta.aitb ? "Sí" : "No"}</TableCell>
                      <TableCell className="text-center">{cuenta.transaccional ? "Sí" : "No"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

