"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileDown, Search, FileText } from "lucide-react"
import { toast } from "sonner"

interface LibroVentasFilters {
  empresa: string
  regional: string
  sucursal: string
  periodo: string
  año: string
}

interface LibroVentasItem {
  fecha: string
  nro_factura: string
  cliente: string
  base_imponible: number
  iva: number
  total: number
  tipo_factura: string
}

const meses = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]

export default function LibroVentasIVAReporte() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<LibroVentasItem[]>([])
  const [nombreArchivo, setNombreArchivo] = useState("libro_ventas_iva.txt")
  const [filters, setFilters] = useState<LibroVentasFilters>({
    empresa: "",
    regional: "",
    sucursal: "",
    periodo: "",
    año: new Date().getFullYear().toString(),
  })

  const handleFilterChange = (field: keyof LibroVentasFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const handleGenerarReporte = () => {
    setLoading(true)
    // Simular carga
    setTimeout(() => {
      // Datos mock
      const mockData: LibroVentasItem[] = [
        {
          fecha: "2025-01-15",
          nro_factura: "FAC-001-2025",
          cliente: "Cliente A",
          base_imponible: 1000.00,
          iva: 130.00,
          total: 1130.00,
          tipo_factura: "Factura Computarizada",
        },
        {
          fecha: "2025-01-16",
          nro_factura: "FAC-002-2025",
          cliente: "Cliente B",
          base_imponible: 2000.00,
          iva: 260.00,
          total: 2260.00,
          tipo_factura: "Factura Manual",
        },
        {
          fecha: "2025-01-17",
          nro_factura: "FAC-003-2025",
          cliente: "Cliente C",
          base_imponible: 3000.00,
          iva: 390.00,
          total: 3390.00,
          tipo_factura: "Factura Computarizada",
        },
        {
          fecha: "2025-01-18",
          nro_factura: "FAC-004-2025",
          cliente: "Cliente D",
          base_imponible: 1500.00,
          iva: 195.00,
          total: 1695.00,
          tipo_factura: "Factura Manual",
        },
        {
          fecha: "2025-01-19",
          nro_factura: "FAC-005-2025",
          cliente: "Cliente E",
          base_imponible: 5000.00,
          iva: 650.00,
          total: 5650.00,
          tipo_factura: "Factura Computarizada",
        },
      ]
      setResults(mockData)
      setLoading(false)
      toast.success("Reporte generado correctamente (mock)")
    }, 500)
  }

  const handleGenerarArchivo = () => {
    toast.info(`Archivo ${nombreArchivo} generado (mock)`)
    // TODO: implementar generación real de archivo
  }

  const handleExportar = () => {
    toast.info("Exportación iniciada (mock)")
    // TODO: implementar exportación real
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Libro de Ventas - IVA</CardTitle>
        <CardDescription>
          Generar libro de ventas con IVA para reportes fiscales
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
              <Label htmlFor="periodo" className="text-xs text-gray-600">
                Periodo
              </Label>
              <Select
                value={filters.periodo}
                onValueChange={(value) => handleFilterChange("periodo", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Seleccionar mes" />
                </SelectTrigger>
                <SelectContent>
                  {meses.map((mes, index) => (
                    <SelectItem key={index} value={(index + 1).toString()}>
                      {mes}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="año" className="text-xs text-gray-600">
                Año
              </Label>
              <Input
                id="año"
                type="number"
                value={filters.año}
                onChange={(e) => handleFilterChange("año", e.target.value)}
                placeholder="2025"
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Sección de Archivo */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Generación de Archivo</h3>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="nombre_archivo" className="text-xs text-gray-600">
                Nombre del Archivo
              </Label>
              <Input
                id="nombre_archivo"
                value={nombreArchivo}
                onChange={(e) => setNombreArchivo(e.target.value)}
                placeholder="libro_ventas_iva.txt"
                className="mt-1 font-mono"
              />
            </div>
            <Button
              onClick={handleGenerarArchivo}
              variant="outline"
            >
              <FileText className="w-4 h-4 mr-2" />
              Generar Archivo
            </Button>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex justify-end gap-4">
          <Button
            onClick={handleGenerarReporte}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Search className="w-4 h-4 mr-2" />
            {loading ? "Generando..." : "Generar Reporte"}
          </Button>
          <Button
            onClick={handleExportar}
            variant="outline"
            disabled={results.length === 0}
          >
            <FileDown className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>

        {/* Resultados */}
        {results.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Resultados</h3>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Nº Factura</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Base Imponible</TableHead>
                    <TableHead className="text-right">IVA</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Tipo Factura</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{new Date(item.fecha).toLocaleDateString("es-ES")}</TableCell>
                      <TableCell className="font-mono">{item.nro_factura}</TableCell>
                      <TableCell>{item.cliente}</TableCell>
                      <TableCell className="text-right font-mono">
                        {item.base_imponible.toLocaleString("es-ES", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {item.iva.toLocaleString("es-ES", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        {item.total.toLocaleString("es-ES", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell>{item.tipo_factura}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}







