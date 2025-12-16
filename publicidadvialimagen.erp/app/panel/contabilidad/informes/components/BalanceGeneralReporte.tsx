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

interface BalanceGeneralFilters {
  // Datos generales
  empresa: string
  regional: string
  sucursal: string
  clasificador: string
  // Filtros
  a_fecha: string
  moneda: string
  estado: string
}

export default function BalanceGeneralReporte() {
  const [filters, setFilters] = useState<BalanceGeneralFilters>({
    empresa: "",
    regional: "",
    sucursal: "",
    clasificador: "",
    a_fecha: new Date().toISOString().split("T")[0],
    moneda: "BOB",
    estado: "Todos",
  })

  const handleFilterChange = (field: keyof BalanceGeneralFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const handleGenerarReporte = () => {
    // TODO: implementar lógica contable real
    // TODO: generar PDF del balance general
    
    console.log("Balance General", filters)
    alert("Balance General generado (mock)")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>BALANCE GENERAL</CardTitle>
        <CardDescription>
          Configure los filtros para generar el balance general
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

        {/* Filtros */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Filtros</h3>
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


