"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileDown, Search } from "lucide-react"
import { toast } from "sonner"

interface FacturacionFilters {
  empresa: string
  regional: string
  sucursal: string
  desde_fecha: string
  hasta_fecha: string
  tipo_documento: string
}

interface FacturacionItem {
  nro_documento: string
  fecha: string
  cliente: string
  tipo_documento: string
  subtotal: number
  iva: number
  total: number
  estado: string
}

export default function FacturacionReporte() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<FacturacionItem[]>([])
  const [filters, setFilters] = useState<FacturacionFilters>({
    empresa: "",
    regional: "",
    sucursal: "",
    desde_fecha: new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0],
    hasta_fecha: new Date().toISOString().split("T")[0],
    tipo_documento: "TODAS",
  })

  const handleFilterChange = (field: keyof FacturacionFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const handleGenerarReporte = () => {
    setLoading(true)
    // Simular carga
    setTimeout(() => {
      // Datos mock
      const mockData: FacturacionItem[] = [
        {
          nro_documento: "FAC-001-2025",
          fecha: "2025-01-15",
          cliente: "Cliente A",
          tipo_documento: "Factura Computarizada",
          subtotal: 1000.00,
          iva: 130.00,
          total: 1130.00,
          estado: "Aprobada",
        },
        {
          nro_documento: "FAC-002-2025",
          fecha: "2025-01-16",
          cliente: "Cliente B",
          tipo_documento: "Factura Manual",
          subtotal: 2000.00,
          iva: 260.00,
          total: 2260.00,
          estado: "Aprobada",
        },
        {
          nro_documento: "NR-001-2025",
          fecha: "2025-01-17",
          cliente: "Cliente C",
          tipo_documento: "Nota de Remisión",
          subtotal: 500.00,
          iva: 0.00,
          total: 500.00,
          estado: "Pendiente",
        },
        {
          nro_documento: "FAC-003-2025",
          fecha: "2025-01-18",
          cliente: "Cliente D",
          tipo_documento: "Factura Computarizada",
          subtotal: 3000.00,
          iva: 390.00,
          total: 3390.00,
          estado: "Aprobada",
        },
        {
          nro_documento: "FAC-004-2025",
          fecha: "2025-01-19",
          cliente: "Cliente E",
          tipo_documento: "Factura Manual",
          subtotal: 1500.00,
          iva: 195.00,
          total: 1695.00,
          estado: "Anulada",
        },
      ]
      setResults(mockData)
      setLoading(false)
      toast.success("Reporte generado correctamente (mock)")
    }, 500)
  }

  const handleExportar = () => {
    toast.info("Exportación iniciada (mock)")
    // TODO: implementar exportación real
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reporte de Facturación</CardTitle>
        <CardDescription>
          Generar reportes de facturación por período y tipo de documento
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
              <Label htmlFor="tipo_documento" className="text-xs text-gray-600">
                Tipo de Documento
              </Label>
              <Select
                value={filters.tipo_documento}
                onValueChange={(value) => handleFilterChange("tipo_documento", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODAS">Todas</SelectItem>
                  <SelectItem value="FACTURAS_COMPUTARIZADAS">Facturas Computarizadas</SelectItem>
                  <SelectItem value="FACTURAS_MANUALES">Facturas Manuales</SelectItem>
                  <SelectItem value="NOTAS_REMISION">Notas de Remisión</SelectItem>
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
              <Label htmlFor="hasta_fecha" className="text-xs text-gray-600">
                Hasta Fecha
              </Label>
              <Input
                id="hasta_fecha"
                type="date"
                value={filters.hasta_fecha}
                onChange={(e) => handleFilterChange("hasta_fecha", e.target.value)}
                className="mt-1"
              />
            </div>
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
                    <TableHead>Nº Documento</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo Documento</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="text-right">IVA</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono">{item.nro_documento}</TableCell>
                      <TableCell>{new Date(item.fecha).toLocaleDateString("es-ES")}</TableCell>
                      <TableCell>{item.cliente}</TableCell>
                      <TableCell>{item.tipo_documento}</TableCell>
                      <TableCell className="text-right font-mono">
                        {item.subtotal.toLocaleString("es-ES", {
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
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            item.estado === "Aprobada"
                              ? "bg-green-100 text-green-800"
                              : item.estado === "Anulada"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {item.estado}
                        </span>
                      </TableCell>
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


