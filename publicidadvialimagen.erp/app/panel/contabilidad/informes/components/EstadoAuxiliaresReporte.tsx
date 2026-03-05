"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { FileDown, FileSpreadsheet, Play, Loader2, ChevronsUpDown, Check } from "lucide-react"
import { api } from "@/lib/fetcher"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { Empresa, Sucursal, Cuenta, Auxiliar } from "@/lib/types/contabilidad"

interface EstadoAuxiliaresFila {
  auxiliar_codigo: string | null
  auxiliar_nombre: string
  cuenta_codigo: string
  cuenta_descripcion: string
  saldo_anterior: number
  total_debe: number
  total_haber: number
  saldo_actual: number
}

function formatNum(value: number): string {
  return new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

interface EstadoAuxiliaresFilters {
  empresa_id: string
  sucursal_id: string
  clasificador: string
  desde_cuenta: string
  hasta_cuenta: string
  desde_auxiliar: string
  hasta_auxiliar: string
  fecha_inicial: string
  fecha_final: string
  moneda: string
  estado: string
}

function formatDateToYYYYMMDD(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

// Igual que contabilización de facturas: primer día del mes y último día del mes
function getFechasMesActual(): { desde: string; hasta: string } {
  const hoy = new Date()
  const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
  return {
    desde: formatDateToYYYYMMDD(primerDiaMes),
    hasta: formatDateToYYYYMMDD(ultimoDiaMes),
  }
}

const CLASIFICADOR_FIJO = "CON-CEN"

export default function EstadoAuxiliaresReporte() {
  const { desde, hasta } = getFechasMesActual()
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
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
  const [filters, setFilters] = useState<EstadoAuxiliaresFilters>({
    empresa_id: "todos",
    sucursal_id: "todos",
    clasificador: CLASIFICADOR_FIJO,
    desde_cuenta: "",
    hasta_cuenta: "",
    desde_auxiliar: "",
    hasta_auxiliar: "",
    fecha_inicial: desde,
    fecha_final: hasta,
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

  const handleFilterChange = (field: keyof EstadoAuxiliaresFilters, value: string) => {
    setFilters((prev) => {
      const next = { ...prev, [field]: value }
      if (field === "empresa_id") next.sucursal_id = "todos"
      return next
    })
  }

  const [loading, setLoading] = useState(false)
  const [exportingExcel, setExportingExcel] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [resultados, setResultados] = useState<EstadoAuxiliaresFila[]>([])

  const handleGenerarReporte = async () => {
    setLoading(true)
    setResultados([])
    try {
      const params = new URLSearchParams()
      if (filters.empresa_id && filters.empresa_id !== "todos") params.set("empresa_id", filters.empresa_id)
      if (filters.sucursal_id && filters.sucursal_id !== "todos") params.set("sucursal_id", filters.sucursal_id)
      if (filters.clasificador) params.set("clasificador", filters.clasificador)
      if (filters.desde_cuenta) params.set("desde_cuenta", filters.desde_cuenta)
      if (filters.hasta_cuenta) params.set("hasta_cuenta", filters.hasta_cuenta)
      if (filters.desde_auxiliar) params.set("desde_auxiliar", filters.desde_auxiliar)
      if (filters.hasta_auxiliar) params.set("hasta_auxiliar", filters.hasta_auxiliar)
      params.set("fecha_inicial", filters.fecha_inicial)
      params.set("fecha_final", filters.fecha_final)
      params.set("moneda", filters.moneda)
      params.set("estado", filters.estado)
      const res = await api(`/api/contabilidad/informes/estado-auxiliares?${params.toString()}`)
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || "Error al generar el reporte")
        return
      }
      const list = json.data?.resultados ?? []
      setResultados(list)
      if (list.length === 0) toast.info(json.message || "No hay datos para el rango seleccionado")
      else toast.success(`Se encontraron ${list.length} registros`)
    } catch (e) {
      console.error(e)
      toast.error("Error de conexión al generar el reporte")
    } finally {
      setLoading(false)
    }
  }

  function buildQueryParams(): URLSearchParams {
    const params = new URLSearchParams()
    if (filters.empresa_id && filters.empresa_id !== "todos") params.set("empresa_id", filters.empresa_id)
    if (filters.sucursal_id && filters.sucursal_id !== "todos") params.set("sucursal_id", filters.sucursal_id)
    if (filters.clasificador) params.set("clasificador", filters.clasificador)
    if (filters.desde_cuenta) params.set("desde_cuenta", filters.desde_cuenta)
    if (filters.hasta_cuenta) params.set("hasta_cuenta", filters.hasta_cuenta)
    if (filters.desde_auxiliar) params.set("desde_auxiliar", filters.desde_auxiliar)
    if (filters.hasta_auxiliar) params.set("hasta_auxiliar", filters.hasta_auxiliar)
    params.set("fecha_inicial", filters.fecha_inicial)
    params.set("fecha_final", filters.fecha_final)
    params.set("moneda", filters.moneda)
    params.set("estado", filters.estado)
    return params
  }

  const handleExportarExcel = async () => {
    if (exportingExcel || exportingPdf) return
    if (!filters.fecha_inicial || !filters.fecha_final) {
      toast.error("Indique fecha inicial y final")
      return
    }
    setExportingExcel(true)
    try {
      const params = buildQueryParams()
      const url = `/api/contabilidad/informes/estado-auxiliares/excel?${params.toString()}`
      const response = await fetch(url, { credentials: "include" })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        toast.error(err.error || "Error al exportar Excel")
        return
      }
      const blob = await response.blob()
      const d = new Date()
      const dia = String(d.getDate()).padStart(2, "0")
      const mes = String(d.getMonth() + 1).padStart(2, "0")
      const año = d.getFullYear()
      const a = document.createElement("a")
      a.href = URL.createObjectURL(blob)
      a.download = `estado_auxiliares_${dia}-${mes}-${año}.xlsx`
      document.body.appendChild(a)
      a.click()
      URL.revokeObjectURL(a.href)
      document.body.removeChild(a)
      toast.success("Excel descargado")
    } catch (e) {
      console.error(e)
      toast.error("Error al exportar Excel")
    } finally {
      setExportingExcel(false)
    }
  }

  const handleExportarPDF = async () => {
    if (exportingPdf || exportingExcel) return
    if (!filters.fecha_inicial || !filters.fecha_final) {
      toast.error("Indique fecha inicial y final")
      return
    }
    setExportingPdf(true)
    try {
      const params = buildQueryParams()
      const url = `/api/contabilidad/informes/estado-auxiliares/pdf?${params.toString()}`
      const response = await fetch(url, { credentials: "include" })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        toast.error(err.error || "Error al exportar PDF")
        return
      }
      const blob = await response.blob()
      const d = new Date()
      const dia = String(d.getDate()).padStart(2, "0")
      const mes = String(d.getMonth() + 1).padStart(2, "0")
      const año = d.getFullYear()
      const a = document.createElement("a")
      a.href = URL.createObjectURL(blob)
      a.download = `estado_auxiliares_${dia}-${mes}-${año}.pdf`
      document.body.appendChild(a)
      a.click()
      URL.revokeObjectURL(a.href)
      document.body.removeChild(a)
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
              Configure los filtros para generar el estado de auxiliares
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
        {/* Datos generales: Empresa, Sucursal, Clasificador (fijo CON-CEN) */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Datos generales</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        {/* Filtros de Cuentas */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Filtros de Cuentas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>

        <Separator />

        {/* Filtros de Auxiliares */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Filtros de Auxiliares</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        {/* Filtros de Fechas (primer y último día del mes, como contabilización de facturas) */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Filtros de Fechas</h3>
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

        {/* Parámetros: Moneda (USD/BS con tipo de cambio 6.96 en backend) y Estado */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Parámetros</h3>
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
                  <SelectItem value="USD">USD (tipo cambio 6.96 Bs/USD)</SelectItem>
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

        {resultados.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-700">Resultados</h3>
              <div className="border rounded-md overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-2 font-medium">Auxiliar</th>
                      <th className="text-left p-2 font-medium">Cuenta</th>
                      <th className="text-left p-2 font-medium">Descripción</th>
                      <th className="text-right p-2 font-medium">Saldo Anterior</th>
                      <th className="text-right p-2 font-medium">Debe</th>
                      <th className="text-right p-2 font-medium">Haber</th>
                      <th className="text-right p-2 font-medium">Saldo Actual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultados.map((r, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-2">{r.auxiliar_codigo ?? r.auxiliar_nombre}</td>
                        <td className="p-2 font-mono">{r.cuenta_codigo}</td>
                        <td className="p-2 text-muted-foreground">{r.cuenta_descripcion}</td>
                        <td className="p-2 text-right tabular-nums">{formatNum(r.saldo_anterior)}</td>
                        <td className="p-2 text-right tabular-nums">{formatNum(r.total_debe)}</td>
                        <td className="p-2 text-right tabular-nums">{formatNum(r.total_haber)}</td>
                        <td className="p-2 text-right tabular-nums font-medium">{formatNum(r.saldo_actual)}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 bg-muted/50 font-semibold">
                      <td className="p-2" colSpan={3}>TOTALES</td>
                      <td className="p-2 text-right tabular-nums">
                        {formatNum(resultados.reduce((s, r) => s + r.saldo_anterior, 0))}
                      </td>
                      <td className="p-2 text-right tabular-nums">
                        {formatNum(resultados.reduce((s, r) => s + r.total_debe, 0))}
                      </td>
                      <td className="p-2 text-right tabular-nums">
                        {formatNum(resultados.reduce((s, r) => s + r.total_haber, 0))}
                      </td>
                      <td className="p-2 text-right tabular-nums">
                        {formatNum(resultados.reduce((s, r) => s + r.saldo_actual, 0))}
                      </td>
                    </tr>
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
