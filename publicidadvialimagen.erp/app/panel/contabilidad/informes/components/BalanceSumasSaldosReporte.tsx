"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Play } from "lucide-react"

interface BalanceSumasSaldosFilters {
  // Sección Identificación
  empresa: string
  regional: string
  sucursal: string
  // Sección Filtros Contables
  clasificador: string
  desde_cuenta: string
  hasta_cuenta: string
  // Sección Parámetros
  a_fecha: string
  moneda: string
  estado: string
}

export default function BalanceSumasSaldosReporte() {
  const [filters, setFilters] = useState<BalanceSumasSaldosFilters>({
    empresa: "",
    regional: "",
    sucursal: "",
    clasificador: "",
    desde_cuenta: "",
    hasta_cuenta: "",
    a_fecha: new Date().toISOString().split("T")[0],
    moneda: "BOB",
    estado: "Todos",
  })

  const handleFilterChange = (field: keyof BalanceSumasSaldosFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const handleGenerarReporte = () => {
    // TODO: implementar lógica contable real
    // TODO: generar PDF del balance
    // Aquí irá la generación del PDF
    
    console.log("Balance de Sumas y Saldos", filters)
    alert("Reporte generado (mock)")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>BALANCE DE SUMAS Y SALDOS</CardTitle>
        <CardDescription>
          Configure los filtros para generar el balance de sumas y saldos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sección Identificación */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Sección Identificación</h3>
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

        {/* Sección Filtros Contables */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Sección Filtros Contables</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div>
              <Label htmlFor="desde_cuenta" className="text-xs text-gray-600">
                Desde la Cuenta
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
                Hasta la Cuenta
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

        {/* Sección Parámetros */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Sección Parámetros</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <RadioGroupItem value="Revertido" id="estado-revertido" />
                <Label htmlFor="estado-revertido" className="text-sm font-normal cursor-pointer">
                  Revertido
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
            <Play className="w-4 h-4 mr-2" />
            Generar Reporte
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

