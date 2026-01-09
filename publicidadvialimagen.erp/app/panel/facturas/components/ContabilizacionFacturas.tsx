"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Calculator } from "lucide-react"

interface ContabilizacionFilters {
  empresa: string
  regional: string
  sucursal: string
  clasificador: string
  desde_fecha: string
  a_fecha: string
  cotizacion: string
  ventas: boolean
  notas_remision: boolean
  cobranzas: boolean
}

export default function ContabilizacionFacturas() {
  const [filters, setFilters] = useState<ContabilizacionFilters>({
    empresa: "",
    regional: "",
    sucursal: "",
    clasificador: "",
    desde_fecha: new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0],
    a_fecha: new Date().toISOString().split("T")[0],
    cotizacion: "1.00",
    ventas: true,
    notas_remision: false,
    cobranzas: false,
  })

  const [info, setInfo] = useState({
    nro_comp_factura_iva: "0",
    nro_comp_notas_remision: "0",
    nro_comp_cobranzas: "0",
  })

  const handleFilterChange = (field: keyof ContabilizacionFilters, value: string | boolean) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const handleContabilizar = () => {
    // TODO: implementar contabilidad real
    // TODO: generar comprobantes contables
    
    console.log("Contabilizar Facturas", filters)
    alert("Contabilización realizada (mock)")
    
    // Simular actualización de números de comprobantes
    setInfo({
      nro_comp_factura_iva: "5",
      nro_comp_notas_remision: "2",
      nro_comp_cobranzas: "3",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contabilización de Facturas</CardTitle>
        <CardDescription>
          Contabilizar facturas, notas de remisión y cobranzas. Preparado para futura integración contable.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filtros */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Filtros</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
            <div>
              <Label htmlFor="desde_fecha" className="text-xs text-gray-600">
                Desde Fecha
              </Label>
              <Input
                id="desde_fecha"
                type="date"
                value={filters.desde_fecha}
                onChange={(e) => handleFilterChange("desde_fecha", e.target.value)}
                className="mt-1"
              />
            </div>
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
              <Label htmlFor="cotizacion" className="text-xs text-gray-600">
                Cotización
              </Label>
              <Input
                id="cotizacion"
                type="number"
                step="0.01"
                value={filters.cotizacion}
                onChange={(e) => handleFilterChange("cotizacion", e.target.value)}
                placeholder="1.00"
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Checkboxes */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Tipos de Documentos</h3>
          <div className="flex gap-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="ventas"
                checked={filters.ventas}
                onCheckedChange={(checked) => handleFilterChange("ventas", !!checked)}
              />
              <Label htmlFor="ventas" className="text-sm font-normal cursor-pointer">
                Ventas
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="notas_remision"
                checked={filters.notas_remision}
                onCheckedChange={(checked) => handleFilterChange("notas_remision", !!checked)}
              />
              <Label htmlFor="notas_remision" className="text-sm font-normal cursor-pointer">
                Notas de Remisión
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="cobranzas"
                checked={filters.cobranzas}
                onCheckedChange={(checked) => handleFilterChange("cobranzas", !!checked)}
              />
              <Label htmlFor="cobranzas" className="text-sm font-normal cursor-pointer">
                Cobranzas
              </Label>
            </div>
          </div>
        </div>

        <Separator />

        {/* Campos informativos */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Información de Comprobantes</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="nro_comp_factura_iva" className="text-xs text-gray-600">
                Nro. de Comp. Factura con IVA
              </Label>
              <Input
                id="nro_comp_factura_iva"
                value={info.nro_comp_factura_iva}
                readOnly
                className="mt-1 bg-gray-50 font-mono"
              />
            </div>
            <div>
              <Label htmlFor="nro_comp_notas_remision" className="text-xs text-gray-600">
                Nro. de Comp. Notas de Remisión
              </Label>
              <Input
                id="nro_comp_notas_remision"
                value={info.nro_comp_notas_remision}
                readOnly
                className="mt-1 bg-gray-50 font-mono"
              />
            </div>
            <div>
              <Label htmlFor="nro_comp_cobranzas" className="text-xs text-gray-600">
                Nro. de Comp. Cobranzas
              </Label>
              <Input
                id="nro_comp_cobranzas"
                value={info.nro_comp_cobranzas}
                readOnly
                className="mt-1 bg-gray-50 font-mono"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Acción */}
        <div className="flex justify-end gap-4 pt-4">
          <Button
            onClick={handleContabilizar}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Calculator className="w-4 h-4 mr-2" />
            Contabilizar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}







