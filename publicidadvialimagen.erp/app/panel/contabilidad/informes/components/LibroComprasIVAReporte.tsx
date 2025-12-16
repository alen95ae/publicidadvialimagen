"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { FileDown } from "lucide-react"

interface LibroComprasIVAFilters {
  // Datos generales
  empresa: string
  regional: string
  sucursal: string
  // Periodo
  periodo_mes: string
  periodo_anio: string
  // Tipo de Reporte
  tipo_reporte: string
  // Exportación
  nombre_archivo: string
}

const MESES = [
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
]

// Generar años (últimos 5 años y próximos 2)
const generarAnios = () => {
  const anioActual = new Date().getFullYear()
  const anios = []
  for (let i = anioActual - 5; i <= anioActual + 2; i++) {
    anios.push(i.toString())
  }
  return anios
}

export default function LibroComprasIVAReporte() {
  const [filters, setFilters] = useState<LibroComprasIVAFilters>({
    empresa: "",
    regional: "",
    sucursal: "",
    periodo_mes: new Date().getMonth() + 1 < 10 
      ? `0${new Date().getMonth() + 1}` 
      : `${new Date().getMonth() + 1}`,
    periodo_anio: new Date().getFullYear().toString(),
    tipo_reporte: "Impuestos",
    nombre_archivo: "lib_compras_iva.txt",
  })

  const handleFilterChange = (field: keyof LibroComprasIVAFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const handleGenerarArchivo = () => {
    // TODO: exportar a PDF / TXT
    
    console.log("Libro de Compras IVA", filters)
    alert("Libro de Compras IVA generado (mock)")
  }

  const anios = generarAnios()

  return (
    <Card>
      <CardHeader>
        <CardTitle>LIBRO DE COMPRAS I.V.A.</CardTitle>
        <CardDescription>
          Configure los filtros para generar el libro de compras con I.V.A.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Datos generales */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Datos generales</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="empresa" className="text-xs text-gray-600">
                Empresa
              </Label>
              <Select
                value={filters.empresa}
                onValueChange={(value) => handleFilterChange("empresa", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Seleccionar empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="001">Empresa 001</SelectItem>
                  <SelectItem value="002">Empresa 002</SelectItem>
                  <SelectItem value="003">Empresa 003</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="regional" className="text-xs text-gray-600">
                Regional
              </Label>
              <Select
                value={filters.regional}
                onValueChange={(value) => handleFilterChange("regional", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Seleccionar regional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="01">Regional 01</SelectItem>
                  <SelectItem value="02">Regional 02</SelectItem>
                  <SelectItem value="03">Regional 03</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sucursal" className="text-xs text-gray-600">
                Sucursal
              </Label>
              <Select
                value={filters.sucursal}
                onValueChange={(value) => handleFilterChange("sucursal", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Seleccionar sucursal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="001">Sucursal 001</SelectItem>
                  <SelectItem value="002">Sucursal 002</SelectItem>
                  <SelectItem value="003">Sucursal 003</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        {/* Periodo */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Periodo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="periodo_mes" className="text-xs text-gray-600">
                Periodo (Mes)
              </Label>
              <Select
                value={filters.periodo_mes}
                onValueChange={(value) => handleFilterChange("periodo_mes", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Seleccionar mes" />
                </SelectTrigger>
                <SelectContent>
                  {MESES.map((mes) => (
                    <SelectItem key={mes.value} value={mes.value}>
                      {mes.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="periodo_anio" className="text-xs text-gray-600">
                Año
              </Label>
              <Select
                value={filters.periodo_anio}
                onValueChange={(value) => handleFilterChange("periodo_anio", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Seleccionar año" />
                </SelectTrigger>
                <SelectContent>
                  {anios.map((anio) => (
                    <SelectItem key={anio} value={anio}>
                      {anio}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        {/* Tipo de Reporte */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Tipo de Reporte</h3>
          <div>
            <Label className="text-xs text-gray-600 mb-2 block">Tipo de Reporte</Label>
            <RadioGroup
              value={filters.tipo_reporte}
              onValueChange={(value) => handleFilterChange("tipo_reporte", value)}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Impuestos" id="reporte-impuestos" />
                <Label htmlFor="reporte-impuestos" className="text-sm font-normal cursor-pointer">
                  Reporte para Impuestos
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Control" id="reporte-control" />
                <Label htmlFor="reporte-control" className="text-sm font-normal cursor-pointer">
                  Reporte de Control
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <Separator />

        {/* Exportación */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Exportación</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nombre_archivo" className="text-xs text-gray-600">
                Nombre del archivo
              </Label>
              <Input
                id="nombre_archivo"
                value={filters.nombre_archivo}
                onChange={(e) => handleFilterChange("nombre_archivo", e.target.value)}
                placeholder="lib_compras_iva.txt"
                className="mt-1 font-mono"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Acciones */}
        <div className="flex justify-end gap-4 pt-4">
          <Button
            onClick={handleGenerarArchivo}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Generar Archivo
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

