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

interface EstadoAuxiliaresFilters {
  // Datos generales
  empresa: string
  regional: string
  sucursal: string
  clasificador: string
  // Filtros
  desde_cuenta: string
  hasta_cuenta: string
  desde_auxiliar: string
  hasta_auxiliar: string
  fecha_inicial: string
  fecha_final: string
  moneda: string
  estado: string
}

export default function EstadoAuxiliaresReporte() {
  const [filters, setFilters] = useState<EstadoAuxiliaresFilters>({
    empresa: "",
    regional: "",
    sucursal: "",
    clasificador: "",
    desde_cuenta: "",
    hasta_cuenta: "",
    desde_auxiliar: "",
    hasta_auxiliar: "",
    fecha_inicial: new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0],
    fecha_final: new Date().toISOString().split("T")[0],
    moneda: "BOB",
    estado: "Todos",
  })

  const handleFilterChange = (field: keyof EstadoAuxiliaresFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const handleGenerarReporte = () => {
    // TODO: implementar lógica contable real
    // TODO: generar PDF del estado de auxiliares
    
    console.log("Estado de Auxiliares", filters)
    alert("Estado de Auxiliares generado (mock)")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>ESTADO DE AUXILIARES</CardTitle>
        <CardDescription>
          Configure los filtros para generar el estado de auxiliares
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Datos generales */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Datos generales</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <div>
              <Label htmlFor="clasificador" className="text-xs text-gray-600">
                Clasificador
              </Label>
              <Select
                value={filters.clasificador}
                onValueChange={(value) => handleFilterChange("clasificador", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Seleccionar clasificador" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONTABILIDAD">CONTABILIDAD</SelectItem>
                  <SelectItem value="VENTAS">VENTAS</SelectItem>
                  <SelectItem value="TESORERIA">TESORERIA</SelectItem>
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

        {/* Filtros de Auxiliares */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Filtros de Auxiliares</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="desde_auxiliar" className="text-xs text-gray-600">
                Desde Auxiliar
              </Label>
              <Input
                id="desde_auxiliar"
                value={filters.desde_auxiliar}
                onChange={(e) => handleFilterChange("desde_auxiliar", e.target.value)}
                placeholder="Desde"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="hasta_auxiliar" className="text-xs text-gray-600">
                Hasta Auxiliar
              </Label>
              <Input
                id="hasta_auxiliar"
                value={filters.hasta_auxiliar}
                onChange={(e) => handleFilterChange("hasta_auxiliar", e.target.value)}
                placeholder="Hasta"
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Filtros de Fechas */}
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

        {/* Parámetros */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Parámetros</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        {/* Acciones */}
        <div className="flex justify-end gap-4 pt-4">
          <Button
            onClick={handleGenerarReporte}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Generar Reporte
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

