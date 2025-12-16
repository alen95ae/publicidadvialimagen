"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileDown, Search } from "lucide-react"
import { api } from "@/lib/fetcher"
import { toast } from "sonner"

interface PlanCuentasFilters {
  empresa?: string
  regional?: string
  sucursal?: string
  clasificador?: string
  desde_cuenta?: string
  hasta_cuenta?: string
}

interface CuentaInforme {
  cuenta: string
  descripcion: string
  nivel: number
  tipo: string
  cuenta_padre?: string | null
}

export default function PlanCuentasInforme() {
  const [loading, setLoading] = useState(false)
  const [cuentas, setCuentas] = useState<CuentaInforme[]>([])
  const [filters, setFilters] = useState<PlanCuentasFilters>({
    empresa: "",
    regional: "",
    sucursal: "",
    clasificador: "",
    desde_cuenta: "",
    hasta_cuenta: "",
  })

  useEffect(() => {
    fetchPlanCuentas()
  }, [])

  const fetchPlanCuentas = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.empresa) params.append("empresa", filters.empresa)
      if (filters.regional) params.append("regional", filters.regional)
      if (filters.sucursal) params.append("sucursal", filters.sucursal)
      if (filters.clasificador) params.append("clasificador", filters.clasificador)
      if (filters.desde_cuenta) params.append("desde_cuenta", filters.desde_cuenta)
      if (filters.hasta_cuenta) params.append("hasta_cuenta", filters.hasta_cuenta)

      const response = await api(`/api/contabilidad/informes/plan-cuentas?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setCuentas(data.data || [])
      } else {
        setCuentas([])
        toast.error("Error al cargar el plan de cuentas")
      }
    } catch (error) {
      console.error("Error fetching plan de cuentas:", error)
      setCuentas([])
      toast.error("Error al cargar el plan de cuentas")
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (field: keyof PlanCuentasFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const handleBuscar = () => {
    fetchPlanCuentas()
  }

  const handleExportarPDF = () => {
    // Placeholder para exportación PDF
    toast.info("Funcionalidad de exportación PDF en desarrollo")
  }

  // Función para calcular indentación según nivel
  const getIndentStyle = (nivel: number) => {
    return { paddingLeft: `${(nivel - 1) * 24}px` }
  }

  // Ordenar cuentas jerárquicamente
  const cuentasOrdenadas = [...cuentas].sort((a, b) => {
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
          <Button onClick={handleExportarPDF} variant="outline" size="sm">
            <FileDown className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
              <Label htmlFor="desde_cuenta" className="text-xs text-gray-600">
                Desde Cuenta
              </Label>
              <Input
                id="desde_cuenta"
                value={filters.desde_cuenta || ""}
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
                value={filters.hasta_cuenta || ""}
                onChange={(e) => handleFilterChange("hasta_cuenta", e.target.value)}
                placeholder="Ej: 1.1.1.999"
                className="mt-1 font-mono"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleBuscar} size="sm">
              <Search className="w-4 h-4 mr-2" />
              Buscar
            </Button>
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

