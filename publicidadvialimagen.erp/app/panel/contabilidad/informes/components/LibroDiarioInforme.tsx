"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { FileDown, Search } from "lucide-react"
import { api } from "@/lib/fetcher"
import { toast } from "sonner"

interface LibroDiarioFilters {
  empresa?: string
  regional?: string
  sucursal?: string
  clasificador?: string
  fecha_inicial?: string
  fecha_final?: string
  tipo_comprobante?: string
  estado?: string
}

interface DetalleComprobante {
  cuenta: string
  descripcion: string
  debe_bs: number
  haber_bs: number
  debe_usd: number
  haber_usd: number
  glosa?: string
}

interface ComprobanteInforme {
  id: number
  numero: string
  fecha: string
  tipo_comprobante: string
  tipo_asiento: string
  glosa: string
  moneda: string
  tipo_cambio: number
  estado: string
  detalles: DetalleComprobante[]
  total_debe_bs: number
  total_haber_bs: number
  total_debe_usd: number
  total_haber_usd: number
}

const TIPOS_COMPROBANTE = [
  "Todos",
  "Diario",
  "Ingreso",
  "Egreso",
  "Traspaso",
  "Ctas por Pagar",
  "Ajuste",
  "Apertura",
  "Cierre",
]

const ESTADOS = ["Todos", "Aprobado", "Borrador", "Revertido"]

export default function LibroDiarioInforme() {
  const [loading, setLoading] = useState(false)
  const [comprobantes, setComprobantes] = useState<ComprobanteInforme[]>([])
  const [filters, setFilters] = useState<LibroDiarioFilters>({
    empresa: "",
    regional: "",
    sucursal: "",
    clasificador: "",
    fecha_inicial: new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0],
    fecha_final: new Date().toISOString().split("T")[0],
    tipo_comprobante: "Todos",
    estado: "Todos",
  })

  useEffect(() => {
    fetchLibroDiario()
  }, [])

  const fetchLibroDiario = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.empresa) params.append("empresa", filters.empresa)
      if (filters.regional) params.append("regional", filters.regional)
      if (filters.sucursal) params.append("sucursal", filters.sucursal)
      if (filters.fecha_inicial) params.append("fecha_inicial", filters.fecha_inicial)
      if (filters.fecha_final) params.append("fecha_final", filters.fecha_final)
      if (filters.tipo_comprobante && filters.tipo_comprobante !== "Todos") {
        params.append("tipo_comprobante", filters.tipo_comprobante)
      }
      if (filters.estado && filters.estado !== "Todos") {
        params.append("estado", filters.estado.toUpperCase())
      }

      const response = await api(`/api/contabilidad/informes/libro-diario?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setComprobantes(data.data || [])
      } else {
        setComprobantes([])
        toast.error("Error al cargar el libro diario")
      }
    } catch (error) {
      console.error("Error fetching libro diario:", error)
      setComprobantes([])
      toast.error("Error al cargar el libro diario")
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (field: keyof LibroDiarioFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const handleBuscar = () => {
    fetchLibroDiario()
  }

  const handleExportarPDF = () => {
    // Placeholder para exportación PDF
    toast.info("Funcionalidad de exportación PDF en desarrollo")
  }

  const getEstadoBadge = (estado: string) => {
    const estadoUpper = estado.toUpperCase()
    if (estadoUpper === "APROBADO") {
      return (
        <span className="inline-flex items-center rounded px-2 py-1 text-xs font-medium bg-green-100 text-green-800">
          {estado}
        </span>
      )
    }
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      BORRADOR: "secondary",
      REVERTIDO: "destructive",
    }
    return (
      <Badge variant={variants[estadoUpper] || "outline"}>
        {estado}
      </Badge>
    )
  }

  // Calcular totales generales
  const totalesGenerales = comprobantes.reduce(
    (acc, comp) => ({
      debe_bs: acc.debe_bs + comp.total_debe_bs,
      haber_bs: acc.haber_bs + comp.total_haber_bs,
      debe_usd: acc.debe_usd + comp.total_debe_usd,
      haber_usd: acc.haber_usd + comp.total_haber_usd,
    }),
    { debe_bs: 0, haber_bs: 0, debe_usd: 0, haber_usd: 0 }
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Filtros y Resultados</CardTitle>
            <CardDescription>
              Configure los filtros y visualice el libro diario
            </CardDescription>
          </div>
          <Button onClick={handleExportarPDF} variant="outline" size="sm">
            <FileDown className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <div>
              <Label htmlFor="empresa" className="text-xs text-gray-600">
                Empresa
              </Label>
              <Input
                id="empresa"
                value={filters.empresa || ""}
                onChange={(e) => handleFilterChange("empresa", e.target.value)}
                placeholder="Empresa"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="regional" className="text-xs text-gray-600">
                Regional
              </Label>
              <Input
                id="regional"
                value={filters.regional || ""}
                onChange={(e) => handleFilterChange("regional", e.target.value)}
                placeholder="Regional"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="sucursal" className="text-xs text-gray-600">
                Sucursal
              </Label>
              <Input
                id="sucursal"
                value={filters.sucursal || ""}
                onChange={(e) => handleFilterChange("sucursal", e.target.value)}
                placeholder="Sucursal"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="clasificador" className="text-xs text-gray-600">
                Clasificador
              </Label>
              <Input
                id="clasificador"
                value={filters.clasificador || ""}
                onChange={(e) => handleFilterChange("clasificador", e.target.value)}
                placeholder="Clasificador"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="fecha_inicial" className="text-xs text-gray-600">
                Fecha Inicial
              </Label>
              <Input
                id="fecha_inicial"
                type="date"
                value={filters.fecha_inicial || ""}
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
                value={filters.fecha_final || ""}
                onChange={(e) => handleFilterChange("fecha_final", e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="tipo_comprobante" className="text-xs text-gray-600">
                Tipo Comprobante
              </Label>
              <Select
                value={filters.tipo_comprobante || "Todos"}
                onValueChange={(value) => handleFilterChange("tipo_comprobante", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_COMPROBANTE.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo}
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
                value={filters.estado || "Todos"}
                onValueChange={(value) => handleFilterChange("estado", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS.map((estado) => (
                    <SelectItem key={estado} value={estado}>
                      {estado}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleBuscar} size="sm" className="bg-red-600 hover:bg-red-700 text-white">
              <Search className="w-4 h-4 mr-2" />
              Buscar
            </Button>
          </div>
        </div>

        {/* Tabla de resultados */}
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Cargando libro diario...</div>
            ) : comprobantes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No se encontraron comprobantes con los filtros seleccionados
              </div>
            ) : (
              <div className="space-y-6">
                {comprobantes.map((comprobante) => (
                  <div key={comprobante.id} className="border-b pb-4 last:border-b-0">
                    {/* Cabecera del comprobante */}
                    <div className="bg-gray-50 p-3 mb-2 rounded">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Número:</span>
                          <span className="ml-2 font-semibold font-mono">
                            {comprobante.numero}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Fecha:</span>
                          <span className="ml-2">
                            {new Date(comprobante.fecha).toLocaleDateString("es-ES")}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Tipo:</span>
                          <span className="ml-2">{comprobante.tipo_comprobante}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Estado:</span>
                          <span className="ml-2">{getEstadoBadge(comprobante.estado)}</span>
                        </div>
                        <div className="col-span-2 md:col-span-4">
                          <span className="text-gray-600">Glosa:</span>
                          <span className="ml-2">{comprobante.glosa}</span>
                        </div>
                      </div>
                    </div>

                    {/* Detalle del comprobante */}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-32">Cuenta</TableHead>
                          <TableHead>Descripción</TableHead>
                          <TableHead className="w-32 text-right">Debe Bs</TableHead>
                          <TableHead className="w-32 text-right">Haber Bs</TableHead>
                          <TableHead className="w-32 text-right">Debe USD</TableHead>
                          <TableHead className="w-32 text-right">Haber USD</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {comprobante.detalles.map((detalle, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-mono">{detalle.cuenta}</TableCell>
                            <TableCell>{detalle.descripcion || detalle.glosa || "-"}</TableCell>
                            <TableCell className="text-right font-mono">
                              {detalle.debe_bs.toLocaleString("es-ES", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {detalle.haber_bs.toLocaleString("es-ES", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {detalle.debe_usd.toLocaleString("es-ES", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {detalle.haber_usd.toLocaleString("es-ES", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </TableCell>
                          </TableRow>
                        ))}
                        {/* Totales del comprobante */}
                        <TableRow className="bg-gray-50 font-semibold">
                          <TableCell colSpan={2} className="text-right">
                            TOTALES:
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {comprobante.total_debe_bs.toLocaleString("es-ES", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {comprobante.total_haber_bs.toLocaleString("es-ES", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {comprobante.total_debe_usd.toLocaleString("es-ES", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {comprobante.total_haber_usd.toLocaleString("es-ES", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                ))}

                {/* Totales generales */}
                {comprobantes.length > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 rounded border-2 border-blue-200">
                    <Table>
                      <TableBody>
                        <TableRow className="font-bold text-lg">
                          <TableCell colSpan={2} className="text-right">
                            TOTALES GENERALES:
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {totalesGenerales.debe_bs.toLocaleString("es-ES", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {totalesGenerales.haber_bs.toLocaleString("es-ES", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {totalesGenerales.debe_usd.toLocaleString("es-ES", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {totalesGenerales.haber_usd.toLocaleString("es-ES", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

