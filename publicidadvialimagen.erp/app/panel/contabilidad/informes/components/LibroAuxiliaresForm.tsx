"use client"

import { useState, useEffect, Fragment } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { FileDown, FileSpreadsheet, Play, Loader2, ChevronsUpDown, Check } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/fetcher"
import { cn } from "@/lib/utils"
import type { Auxiliar } from "@/lib/types/contabilidad"
import type { Cuenta } from "@/lib/types/contabilidad"

interface LibroAuxiliaresFilters {
  clasificador: string
  desde_cuenta: string
  hasta_cuenta: string
  tipo_auxiliar: string
  desde_auxiliar: string
  hasta_auxiliar: string
  fecha_inicial: string
  fecha_final: string
  moneda: string
  estado: string
  tipo_reporte: string
}

const TIPOS_COMPROBANTE = [
  { value: "todos", label: "Todas" },
  { value: "Activo", label: "Activo" },
  { value: "Pasivo", label: "Pasivo" },
  { value: "Patrimonio", label: "Patrimonio" },
  { value: "Ingreso", label: "Ingreso" },
  { value: "Gasto", label: "Gasto" },
]

function formatearNumero(n: number): string {
  const s = Number(n).toFixed(2)
  const [entera, decimal] = s.split(".")
  const conMiles = entera.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  return `${conMiles},${decimal}`
}

export default function LibroAuxiliaresForm() {
  const [tiposAuxiliar, setTiposAuxiliar] = useState<string[]>([])
  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  const [loadingCuentas, setLoadingCuentas] = useState(false)
  const [auxiliaresTodos, setAuxiliaresTodos] = useState<Auxiliar[]>([])
  const [loadingAuxiliares, setLoadingAuxiliares] = useState(false)
  const [openDesdeCuenta, setOpenDesdeCuenta] = useState(false)
  const [openHastaCuenta, setOpenHastaCuenta] = useState(false)
  const [openDesdeAuxiliar, setOpenDesdeAuxiliar] = useState(false)
  const [openHastaAuxiliar, setOpenHastaAuxiliar] = useState(false)
  const [filteredCuentasDesde, setFilteredCuentasDesde] = useState<Cuenta[]>([])
  const [filteredCuentasHasta, setFilteredCuentasHasta] = useState<Cuenta[]>([])
  const [filteredAuxiliaresDesde, setFilteredAuxiliaresDesde] = useState<Auxiliar[]>([])
  const [filteredAuxiliaresHasta, setFilteredAuxiliaresHasta] = useState<Auxiliar[]>([])
  const [filters, setFilters] = useState<LibroAuxiliaresFilters>({
    clasificador: "todos",
    desde_cuenta: "",
    hasta_cuenta: "",
    tipo_auxiliar: "",
    desde_auxiliar: "",
    hasta_auxiliar: "",
    fecha_inicial: new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0],
    fecha_final: new Date().toISOString().split("T")[0],
    moneda: "BOB",
    estado: "Todos",
    tipo_reporte: "Detalle",
  })
  const [loading, setLoading] = useState(false)
  const [exportingExcel, setExportingExcel] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [data, setData] = useState<any>(null)
  const [debug, setDebug] = useState<any>(null)
  const [tipoReporteActual, setTipoReporteActual] = useState<"Resumen" | "Detalle">("Detalle")
  const [hasGenerated, setHasGenerated] = useState(false)

  const monedaSufijo = filters.moneda === "USD" ? "$" : "Bs"

  useEffect(() => {
    const loadTipos = async () => {
      try {
        const res = await api("/api/contabilidad/auxiliares/tipos")
        if (res.ok) {
          const d = await res.json()
          setTiposAuxiliar(d.data || [])
        }
      } catch (e) {
        console.error("Error loading tipos auxiliar:", e)
      }
    }
    loadTipos()
  }, [])

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
    const loadAuxiliares = async () => {
      try {
        setLoadingAuxiliares(true)
        const res = await api("/api/contabilidad/auxiliares?limit=10000")
        if (res.ok) {
          const d = await res.json()
          const list = d.data || []
          setAuxiliaresTodos(list)
          setFilteredAuxiliaresDesde(list.slice(0, 20))
          setFilteredAuxiliaresHasta(list.slice(0, 20))
        }
      } catch (e) {
        console.error("Error loading auxiliares:", e)
      } finally {
        setLoadingAuxiliares(false)
      }
    }
    loadAuxiliares()
  }, [])

  const handleFilterChange = (field: keyof LibroAuxiliaresFilters, value: string) => {
    setFilters((prev) => {
      const next = { ...prev, [field]: value }
      if (field === "tipo_auxiliar") {
        next.desde_auxiliar = ""
        next.hasta_auxiliar = ""
      }
      return next
    })
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
  const filtrarAuxiliaresDesde = (searchValue: string) => {
    if (!searchValue?.trim()) {
      setFilteredAuxiliaresDesde(auxiliaresTodos.slice(0, 20))
      return
    }
    const search = searchValue.toLowerCase().trim()
    const filtered = auxiliaresTodos
      .filter((a) => {
        const nombre = (a.contactos?.nombre ?? a.nombre ?? "").toLowerCase()
        const codigo = (a.codigo || "").toLowerCase()
        return nombre.includes(search) || codigo.includes(search)
      })
      .slice(0, 20)
    setFilteredAuxiliaresDesde(filtered)
  }
  const filtrarAuxiliaresHasta = (searchValue: string) => {
    if (!searchValue?.trim()) {
      setFilteredAuxiliaresHasta(auxiliaresTodos.slice(0, 20))
      return
    }
    const search = searchValue.toLowerCase().trim()
    const filtered = auxiliaresTodos
      .filter((a) => {
        const nombre = (a.contactos?.nombre ?? a.nombre ?? "").toLowerCase()
        const codigo = (a.codigo || "").toLowerCase()
        return nombre.includes(search) || codigo.includes(search)
      })
      .slice(0, 20)
    setFilteredAuxiliaresHasta(filtered)
  }

  const getCuentaDisplayText = (cuentaCodigo: string) => {
    if (!cuentaCodigo) return "Seleccionar cuenta..."
    const c = cuentas.find((x) => String(x.cuenta || "").trim() === String(cuentaCodigo).trim())
    if (c) return `${c.cuenta} - ${c.descripcion || ""}`
    return cuentaCodigo
  }
  const getAuxiliarDisplayText = (valor: string) => {
    if (!valor) return "Seleccionar auxiliar..."
    const a = auxiliaresTodos.find(
      (x) => x.codigo === valor || (x.contactos?.nombre ?? x.nombre) === valor
    )
    if (a) return `${a.codigo} - ${a.contactos?.nombre ?? a.nombre ?? ""}`
    return valor
  }

  const buildParams = () => {
    const params = new URLSearchParams()
    if (filters.clasificador && filters.clasificador !== "todos") params.set("clasificador", filters.clasificador)
    if (filters.tipo_auxiliar) params.set("tipo_auxiliar", filters.tipo_auxiliar)
    if (filters.desde_auxiliar) params.set("desde_auxiliar", filters.desde_auxiliar)
    if (filters.hasta_auxiliar) params.set("hasta_auxiliar", filters.hasta_auxiliar)
    if (filters.desde_cuenta) params.set("desde_cuenta", filters.desde_cuenta)
    if (filters.hasta_cuenta) params.set("hasta_cuenta", filters.hasta_cuenta)
    if (filters.fecha_inicial) params.set("fecha_inicial", filters.fecha_inicial)
    if (filters.fecha_final) params.set("fecha_final", filters.fecha_final)
    if (filters.moneda) params.set("moneda", filters.moneda)
    if (filters.estado && filters.estado !== "Todos") params.set("estado", filters.estado)
    if (filters.tipo_reporte) params.set("tipo_reporte", filters.tipo_reporte)
    return params
  }

  const handleGenerarReporte = async () => {
    console.log("Generar Reporte (Libro Auxiliares) clicked")
    if (filters.desde_auxiliar && filters.hasta_auxiliar && filters.desde_auxiliar > filters.hasta_auxiliar) {
      toast.error("Desde Auxiliar debe ser menor o igual que Hasta Auxiliar")
      return
    }
    try {
      setLoading(true)
      setHasGenerated(true)
      const params = buildParams()
      const res = await api(`/api/contabilidad/informes/libro-auxiliares?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setData(json.data ?? null)
        setDebug(json.debug ?? null)
        setTipoReporteActual(json.tipo_reporte === "Resumen" ? "Resumen" : "Detalle")
        const isResumen = json.tipo_reporte === "Resumen"
        const isEmpty = isResumen
          ? !Array.isArray(json.data) || json.data.length === 0
          : !json.data?.auxiliares || json.data.auxiliares.length === 0
        if (isEmpty) {
          toast.info("No hay movimientos con auxiliar en el periodo seleccionado")
        } else {
          const count = isResumen ? (json.data?.length ?? 0) : (json.data?.auxiliares?.length ?? 0)
          toast.success(isResumen ? `Se encontraron ${count} registro(s)` : `Se encontraron ${count} auxiliar(es)`)
        }
      } else {
        const err = await res.json()
        toast.error(err.error || "Error al generar el reporte")
        setData(null)
        setDebug(null)
      }
    } catch (e) {
      console.error("Error fetching libro auxiliares:", e)
      toast.error("Error de conexión al generar el reporte")
      setData(null)
      setDebug(null)
    } finally {
      setLoading(false)
    }
  }

  const handleExportarExcel = async () => {
    try {
      setExportingExcel(true)
      const params = buildParams()
      const url = `/api/contabilidad/informes/libro-auxiliares/excel?${params.toString()}`
      const response = await fetch(url, { credentials: "include" })
      if (!response.ok) {
        const err = await response.json()
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
      a.download = `libro_auxiliares_${d}-${m}-${y}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(blobUrl)
      document.body.removeChild(a)
      toast.success("Excel exportado correctamente")
    } catch (e) {
      console.error("Error exporting Excel:", e)
      toast.error("Error al exportar el Excel")
    } finally {
      setExportingExcel(false)
    }
  }

  const handleExportarPDF = async () => {
    try {
      setExportingPdf(true)
      const params = buildParams()
      const url = `/api/contabilidad/informes/libro-auxiliares/pdf?${params.toString()}`
      const response = await fetch(url, { credentials: "include" })
      if (!response.ok) {
        const err = await response.json()
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
      a.download = `libro_auxiliares_${d}-${m}-${y}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(blobUrl)
      document.body.removeChild(a)
      toast.success("PDF exportado correctamente")
    } catch (e) {
      console.error("Error exporting PDF:", e)
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
                Configure los filtros para generar el libro de auxiliares
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleExportarExcel}
                variant="outline"
                size="sm"
                disabled={exportingExcel || exportingPdf || loading || (tipoReporteActual === "Detalle" ? !data?.auxiliares?.length : !Array.isArray(data) || data.length === 0)}
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
                disabled={exportingPdf || exportingExcel || loading || (tipoReporteActual === "Detalle" ? !data?.auxiliares?.length : !Array.isArray(data) || data.length === 0)}
              >
                {exportingPdf ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileDown className="w-4 h-4 mr-2" />
                )}
                {exportingPdf ? "Exportando..." : "Exportar PDF"}
              </Button>
              <Button
                type="button"
                onClick={handleGenerarReporte}
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
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Filtros</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="clasificador" className="text-xs text-gray-600">Tipo de comprobante</Label>
                <Select
                  value={filters.clasificador}
                  onValueChange={(v) => handleFilterChange("clasificador", v)}
                >
                  <SelectTrigger id="clasificador" className="mt-1">
                    <SelectValue placeholder="Tipo de comprobante" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_COMPROBANTE.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
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
                <Label htmlFor="tipo_auxiliar" className="text-xs text-gray-600">Tipo de Auxiliar</Label>
                <Select
                  value={filters.tipo_auxiliar || "todos"}
                  onValueChange={(v) => handleFilterChange("tipo_auxiliar", v === "todos" ? "" : v)}
                >
                  <SelectTrigger id="tipo_auxiliar" className="mt-1">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {tiposAuxiliar.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-gray-600">Desde Auxiliar</Label>
                <Popover open={openDesdeAuxiliar} onOpenChange={setOpenDesdeAuxiliar}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full mt-1 h-9 justify-between text-sm overflow-hidden",
                        !filters.desde_auxiliar && "text-muted-foreground"
                      )}
                    >
                      <span className="truncate text-left flex-1">{getAuxiliarDisplayText(filters.desde_auxiliar)}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Buscar por nombre o código..."
                        className="h-9 border-0 focus:ring-0"
                        onValueChange={filtrarAuxiliaresDesde}
                      />
                      <CommandList>
                        <CommandEmpty>{loadingAuxiliares ? "Cargando..." : "No se encontraron auxiliares."}</CommandEmpty>
                        <CommandGroup>
                          {filteredAuxiliaresDesde.map((a) => {
                            const nombre = a.contactos?.nombre ?? a.nombre ?? ""
                            return (
                              <CommandItem
                                key={a.id}
                                value={`${a.codigo} ${nombre}`}
                                onSelect={() => {
                                  handleFilterChange("desde_auxiliar", a.codigo)
                                  setOpenDesdeAuxiliar(false)
                                }}
                                className="cursor-pointer"
                              >
                                <Check className={cn("mr-2 h-4 w-4", filters.desde_auxiliar === a.codigo ? "opacity-100" : "opacity-0")} />
                                <span className="truncate">{nombre}</span>
                                <span className="text-gray-400 text-xs font-mono ml-auto">{a.codigo}</span>
                              </CommandItem>
                            )
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label className="text-xs text-gray-600">Hasta Auxiliar</Label>
                <Popover
                  open={openHastaAuxiliar}
                  onOpenChange={(open) => {
                    setOpenHastaAuxiliar(open)
                    if (open) setFilteredAuxiliaresHasta(auxiliaresTodos.slice(0, 20))
                  }}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full mt-1 h-9 justify-between text-sm overflow-hidden",
                        !filters.hasta_auxiliar && "text-muted-foreground"
                      )}
                    >
                      <span className="truncate text-left flex-1">{getAuxiliarDisplayText(filters.hasta_auxiliar)}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Buscar por nombre o código..."
                        className="h-9 border-0 focus:ring-0"
                        onValueChange={filtrarAuxiliaresHasta}
                      />
                      <CommandList>
                        <CommandEmpty>{loadingAuxiliares ? "Cargando..." : "No se encontraron auxiliares."}</CommandEmpty>
                        <CommandGroup>
                          {filteredAuxiliaresHasta.map((a) => {
                            const nombre = a.contactos?.nombre ?? a.nombre ?? ""
                            return (
                              <CommandItem
                                key={a.id}
                                value={`${a.codigo} ${nombre}`}
                                onSelect={() => {
                                  handleFilterChange("hasta_auxiliar", a.codigo)
                                  setOpenHastaAuxiliar(false)
                                }}
                                className="cursor-pointer"
                              >
                                <Check className={cn("mr-2 h-4 w-4", filters.hasta_auxiliar === a.codigo ? "opacity-100" : "opacity-0")} />
                                <span className="truncate">{nombre}</span>
                                <span className="text-gray-400 text-xs font-mono ml-auto">{a.codigo}</span>
                              </CommandItem>
                            )
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Sección Fechas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fecha_inicial" className="text-xs text-gray-600">Fecha Inicial</Label>
                <Input
                  id="fecha_inicial"
                  type="date"
                  value={filters.fecha_inicial}
                  onChange={(e) => handleFilterChange("fecha_inicial", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="fecha_final" className="text-xs text-gray-600">Fecha Final</Label>
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

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Sección Moneda</h3>
            <Select
              value={filters.moneda}
              onValueChange={(v) => handleFilterChange("moneda", v)}
            >
              <SelectTrigger className="w-full max-w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BOB">Bolivianos (Bs)</SelectItem>
                <SelectItem value="USD">USD ($)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Estado del comprobante</h3>
            <RadioGroup
              value={filters.estado}
              onValueChange={(v) => handleFilterChange("estado", v)}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Aprobado" id="estado-aprobado" />
                <Label htmlFor="estado-aprobado" className="text-sm font-normal cursor-pointer">Aprobado</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Borrador" id="estado-borrador" />
                <Label htmlFor="estado-borrador" className="text-sm font-normal cursor-pointer">Borrador</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Todos" id="estado-todos" />
                <Label htmlFor="estado-todos" className="text-sm font-normal cursor-pointer">Todos</Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Tipo de Reporte</h3>
            <RadioGroup
              value={filters.tipo_reporte}
              onValueChange={(v) => handleFilterChange("tipo_reporte", v)}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Resumen" id="reporte-resumen" />
                <Label htmlFor="reporte-resumen" className="text-sm font-normal cursor-pointer">Resumen</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Detalle" id="reporte-detalle" />
                <Label htmlFor="reporte-detalle" className="text-sm font-normal cursor-pointer">Detalle</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      <Card>
        <CardHeader>
          <CardTitle>Resultados</CardTitle>
          <CardDescription>
            {tipoReporteActual === "Resumen"
              ? "Resumen por auxiliar y cuenta"
              : "Detalle de movimientos con saldo acumulado"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          )}
          {!loading && !hasGenerated && (
            <p className="text-muted-foreground text-center py-8">
              Configure los filtros y haga clic en &quot;Generar Reporte&quot; para ver los resultados.
            </p>
          )}
          {!loading && hasGenerated && (tipoReporteActual === "Detalle" ? !data?.auxiliares?.length : !Array.isArray(data) || data.length === 0) && !debug && (
            <p className="text-muted-foreground text-center py-8">
              No hay movimientos con auxiliar para los filtros seleccionados.
            </p>
          )}
          {!loading && hasGenerated && (tipoReporteActual === "Detalle" ? !data?.auxiliares?.length : !Array.isArray(data) || data.length === 0) && debug && (
            <Card className="mt-4 border-amber-200 bg-amber-50/50">
              <CardHeader>
                <CardTitle className="text-sm">Diagnóstico (desarrollo)</CardTitle>
                <CardDescription>
                  El reporte no devolvió filas. Revisa los contadores para identificar en qué paso se vacía el resultado.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-xs overflow-auto max-h-[400px] p-4 rounded bg-white border">
                  {JSON.stringify(debug, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
          {!loading && Array.isArray(data) && data.length > 0 && tipoReporteActual === "Resumen" && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Auxiliar</TableHead>
                    <TableHead>Cuenta</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Saldo Inicial ({monedaSufijo})</TableHead>
                    <TableHead className="text-right">Total Debe ({monedaSufijo})</TableHead>
                    <TableHead className="text-right">Total Haber ({monedaSufijo})</TableHead>
                    <TableHead className="text-right">Saldo Final ({monedaSufijo})</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono">
                        {row.auxiliar_codigo != null
                          ? `${row.auxiliar_codigo} - ${row.auxiliar_nombre ?? ""}`
                          : (row.auxiliar_nombre ?? "-")}
                        {row.auxiliar_resuelto === false && (
                          <span className="ml-1 text-amber-600 text-[10px]">(no resuelto)</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono">{row.cuenta}</TableCell>
                      <TableCell>{row.descripcion_cuenta}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatearNumero(row.saldo_inicial ?? 0)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatearNumero(row.total_debe ?? 0)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatearNumero(row.total_haber ?? 0)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatearNumero(row.saldo_final ?? 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {!loading && data?.auxiliares?.length > 0 && tipoReporteActual === "Detalle" && (
            <div className="space-y-8 overflow-x-auto">
              {data.auxiliares.map((aux: any, idxAux: number) => (
                <div key={idxAux} className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-100 px-4 py-2 font-semibold text-gray-800">
                    {aux.auxiliar_codigo != null ? `${aux.auxiliar_codigo} - ${aux.auxiliar_nombre ?? ""}` : (aux.auxiliar_nombre ?? "-")}
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Nº Comprobante</TableHead>
                        <TableHead>Tipo comprobante</TableHead>
                        <TableHead>Glosa / Concepto</TableHead>
                        <TableHead className="text-right">Debe ({monedaSufijo})</TableHead>
                        <TableHead className="text-right">Haber ({monedaSufijo})</TableHead>
                        <TableHead className="text-right">Saldo ({monedaSufijo})</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {aux.cuentas.map((cta: any, idxCta: number) => (
                        <Fragment key={idxCta}>
                          <TableRow className="bg-gray-50 hover:bg-gray-50">
                            <TableCell colSpan={7} className="py-1.5 text-sm font-medium text-gray-700">
                              {cta.cuenta} — {cta.descripcion_cuenta || "Sin descripción"}
                            </TableCell>
                          </TableRow>
                          {cta.movimientos.map((mov: any, idxMov: number) => (
                            <TableRow
                              key={`${idxCta}-${idxMov}`}
                              className={mov.es_saldo_inicial ? "bg-white" : ""}
                            >
                              <TableCell className={mov.es_saldo_inicial ? "italic text-gray-700" : ""}>
                                {mov.es_saldo_inicial ? (mov.fecha ? new Date(mov.fecha).toLocaleDateString("es-ES") : "") : (mov.fecha ? new Date(mov.fecha).toLocaleDateString("es-ES") : "-")}
                              </TableCell>
                              <TableCell className={mov.es_saldo_inicial ? "italic text-gray-700" : ""}>
                                {mov.es_saldo_inicial ? "" : (mov.numero_comprobante ?? "-")}
                              </TableCell>
                              <TableCell className={mov.es_saldo_inicial ? "italic text-gray-700" : ""}>
                                {mov.es_saldo_inicial ? "" : (mov.tipo_comprobante || "-")}
                              </TableCell>
                              <TableCell className={cn("max-w-[200px] truncate", mov.es_saldo_inicial && "italic text-gray-700")} title={mov.glosa}>
                                {mov.glosa || "-"}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {mov.debe !== 0 ? formatearNumero(mov.debe) : "0,00"}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {mov.haber !== 0 ? formatearNumero(mov.haber) : "0,00"}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {formatearNumero(mov.saldo ?? 0)}
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-[#f5f5f5] font-semibold border-t-2 border-gray-300">
                            <TableCell colSpan={4} className="text-right uppercase">TOTALES CUENTA</TableCell>
                            <TableCell className="text-right font-mono">{formatearNumero(cta.total_debe ?? 0)}</TableCell>
                            <TableCell className="text-right font-mono">{formatearNumero(cta.total_haber ?? 0)}</TableCell>
                            <TableCell className="text-right font-mono">{formatearNumero(cta.saldo_final ?? 0)}</TableCell>
                          </TableRow>
                        </Fragment>
                      ))}
                      <TableRow className="bg-[#f5f5f5] font-semibold border-t-2 border-gray-300">
                        <TableCell colSpan={4} className="text-right uppercase">TOTAL AUXILIAR</TableCell>
                        <TableCell className="text-right font-mono">{formatearNumero(aux.total_debe ?? 0)}</TableCell>
                        <TableCell className="text-right font-mono">{formatearNumero(aux.total_haber ?? 0)}</TableCell>
                        <TableCell className="text-right font-mono">{formatearNumero(aux.total_saldo ?? 0)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              ))}
              {!loading && data?.auxiliares?.length > 0 && data?.total_general && tipoReporteActual === "Detalle" && (
                <div className="mt-6 border rounded-lg overflow-hidden border-gray-400">
                  <Table>
                    <TableBody>
                      <TableRow className="bg-[#e5e5e5] font-bold border-t-2 border-gray-400">
                        <TableCell colSpan={4} className="text-right uppercase">TOTAL GENERAL</TableCell>
                        <TableCell className="text-right font-mono">{formatearNumero(data.total_general.total_debe ?? 0)}</TableCell>
                        <TableCell className="text-right font-mono">{formatearNumero(data.total_general.total_haber ?? 0)}</TableCell>
                        <TableCell className="text-right font-mono">{formatearNumero(data.total_general.total_saldo ?? 0)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
