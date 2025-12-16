"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileDown, Play } from "lucide-react"
import { toast } from "sonner"

interface LibroMayorFilters {
  // Sección Empresa
  empresa: string
  regional: string
  sucursal: string
  // Sección Filtros
  clasificador: string
  desde_cuenta: string
  hasta_cuenta: string
  // Sección Fechas
  fecha_inicial: string
  fecha_final: string
  // Sección Moneda
  moneda: string
  // Sección Estado
  estado: string
}

export default function LibroMayorForm() {
  const [filters, setFilters] = useState<LibroMayorFilters>({
    empresa: "001",
    regional: "01",
    sucursal: "001",
    clasificador: "",
    desde_cuenta: "",
    hasta_cuenta: "",
    fecha_inicial: new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0],
    fecha_final: new Date().toISOString().split("T")[0],
    moneda: "BOB",
    estado: "Todos",
  })

  const handleFilterChange = (field: keyof LibroMayorFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const handleGenerarReporte = () => {
    console.log("Generar Reporte - Filtros:", filters)
    toast.info("Funcionalidad de generación de reporte en desarrollo", {
      description: "Los filtros se han registrado correctamente",
    })
  }

  const handleExportarPDF = () => {
    console.log("Exportar PDF - Filtros:", filters)
    toast.info("Funcionalidad de exportación PDF en desarrollo")
  }

  return (
    <div className="space-y-6">
      {/* Formulario de Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración del Reporte</CardTitle>
          <CardDescription>
            Configure los filtros para generar el libro mayor
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sección Empresa */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Sección Empresa</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="empresa" className="text-xs text-gray-600">
                  Empresa
                </Label>
                <Input
                  id="empresa"
                  value={filters.empresa}
                  readOnly
                  className="mt-1 bg-gray-50"
                />
              </div>
              <div>
                <Label htmlFor="regional" className="text-xs text-gray-600">
                  Regional
                </Label>
                <Input
                  id="regional"
                  value={filters.regional}
                  readOnly
                  className="mt-1 bg-gray-50"
                />
              </div>
              <div>
                <Label htmlFor="sucursal" className="text-xs text-gray-600">
                  Sucursal
                </Label>
                <Input
                  id="sucursal"
                  value={filters.sucursal}
                  readOnly
                  className="mt-1 bg-gray-50"
                />
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
                <Input
                  id="clasificador"
                  value={filters.clasificador}
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

          {/* Sección Moneda */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Sección Moneda</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          </div>

          <Separator />

          {/* Sección Estado */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Sección Estado</h3>
            <div>
              <Label className="text-xs text-gray-600 mb-2 block">
                Estado del comprobante
              </Label>
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

          {/* Acciones */}
          <div className="flex justify-end gap-4 pt-4">
            <Button
              onClick={handleExportarPDF}
              variant="outline"
              disabled
              className="opacity-50 cursor-not-allowed"
            >
              <FileDown className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
            <Button onClick={handleGenerarReporte} className="bg-red-600 hover:bg-red-700 text-white">
              <Play className="w-4 h-4 mr-2" />
              Generar Reporte
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Resultados (Placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle>Resultados</CardTitle>
          <CardDescription>
            Los resultados del libro mayor se mostrarán aquí después de generar el reporte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Fecha</TableHead>
                  <TableHead className="w-32">Comprobante</TableHead>
                  <TableHead className="w-32">Cuenta</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="w-32 text-right">Debe</TableHead>
                  <TableHead className="w-32 text-right">Haber</TableHead>
                  <TableHead className="w-32 text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    No hay datos. Configure los filtros y haga clic en "Generar Reporte" para ver los resultados.
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

