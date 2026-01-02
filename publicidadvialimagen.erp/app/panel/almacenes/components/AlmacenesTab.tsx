"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"

interface Almacen {
  id: number
  codigo: string
  descripcion: string
  tipo: string
  direccion: string
  estado: boolean
}

interface SaldoAlmacen {
  codigo_item: string
  descripcion: string
  gestion: number
  saldo_inicial: number
  saldo_actual: number
  costo_bs: number
  costo_usd: number
}

export default function AlmacenesTab() {
  const [filters, setFilters] = useState({
    empresa: "",
    regional: "",
    sucursal: "",
    tipo_almacen: "TODOS",
    gestion: new Date().getFullYear().toString(),
    tipo_item: "TODOS",
  })

  const [almacenes, setAlmacenes] = useState<Almacen[]>([
    {
      id: 1,
      codigo: "ALM-001",
      descripcion: "Almacén Central",
      tipo: "General",
      direccion: "Av. Principal 123",
      estado: true,
    },
    {
      id: 2,
      codigo: "ALM-002",
      descripcion: "Almacén de Producción",
      tipo: "Producción",
      direccion: "Zona Industrial",
      estado: true,
    },
    {
      id: 3,
      codigo: "ALM-003",
      descripcion: "Almacén Auxiliar",
      tipo: "General",
      direccion: "Sucursal Norte",
      estado: false,
    },
  ])

  const [saldos, setSaldos] = useState<SaldoAlmacen[]>([
    {
      codigo_item: "ITEM-001",
      descripcion: "Lona 6x4",
      gestion: 2025,
      saldo_inicial: 100,
      saldo_actual: 75,
      costo_bs: 150.00,
      costo_usd: 21.50,
    },
    {
      codigo_item: "ITEM-002",
      descripcion: "Herramienta Manual",
      gestion: 2025,
      saldo_inicial: 50,
      saldo_actual: 30,
      costo_bs: 200.00,
      costo_usd: 28.75,
    },
    {
      codigo_item: "ITEM-003",
      descripcion: "Material Seguridad",
      gestion: 2025,
      saldo_inicial: 200,
      saldo_actual: 180,
      costo_bs: 50.00,
      costo_usd: 7.20,
    },
  ])

  const handleAlmacenChange = (id: number, field: keyof Almacen, value: string | boolean) => {
    setAlmacenes(
      almacenes.map((alm) => (alm.id === id ? { ...alm, [field]: value } : alm))
    )
  }

  const handleAddAlmacen = () => {
    const newId = almacenes.length > 0 ? Math.max(...almacenes.map((a) => a.id)) + 1 : 1
    setAlmacenes([
      ...almacenes,
      {
        id: newId,
        codigo: `ALM-${String(newId).padStart(3, "0")}`,
        descripcion: "",
        tipo: "General",
        direccion: "",
        estado: true,
      },
    ])
  }

  const handleRemoveAlmacen = (id: number) => {
    setAlmacenes(almacenes.filter((a) => a.id !== id))
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <Label htmlFor="empresa" className="text-xs text-gray-600">
                Empresa
              </Label>
              <Select
                value={filters.empresa}
                onValueChange={(value) => setFilters({ ...filters, empresa: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Seleccionar" />
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
                onValueChange={(value) => setFilters({ ...filters, regional: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Seleccionar" />
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
                onValueChange={(value) => setFilters({ ...filters, sucursal: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="001">Sucursal 001</SelectItem>
                  <SelectItem value="002">Sucursal 002</SelectItem>
                  <SelectItem value="003">Sucursal 003</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tipo_almacen" className="text-xs text-gray-600">
                Tipo de Almacén
              </Label>
              <Select
                value={filters.tipo_almacen}
                onValueChange={(value) => setFilters({ ...filters, tipo_almacen: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos</SelectItem>
                  <SelectItem value="GENERAL">General</SelectItem>
                  <SelectItem value="PRODUCCION">Producción</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="gestion" className="text-xs text-gray-600">
                Gestión de Saldos
              </Label>
              <Select
                value={filters.gestion}
                onValueChange={(value) => setFilters({ ...filters, gestion: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tipo_item" className="text-xs text-gray-600">
                Tipo de Ítem
              </Label>
              <Select
                value={filters.tipo_item}
                onValueChange={(value) => setFilters({ ...filters, tipo_item: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos</SelectItem>
                  <SelectItem value="HERRAMIENTAS">Herramientas</SelectItem>
                  <SelectItem value="INSUMOS">Insumos</SelectItem>
                  <SelectItem value="MATERIALES">Materiales</SelectItem>
                  <SelectItem value="LONAS">Lonas</SelectItem>
                  <SelectItem value="SEGURIDAD">Seguridad</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Almacenes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Almacenes</CardTitle>
              <CardDescription>Gestión de almacenes y sus configuraciones</CardDescription>
            </div>
            <Button onClick={handleAddAlmacen} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Almacén
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Código</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="w-40">Tipo</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead className="w-24">Estado</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {almacenes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                      No hay almacenes. Click en "Agregar Almacén" para comenzar.
                    </TableCell>
                  </TableRow>
                ) : (
                  almacenes.map((almacen) => (
                    <TableRow key={almacen.id}>
                      <TableCell className="font-mono">{almacen.codigo}</TableCell>
                      <TableCell>
                        <Input
                          value={almacen.descripcion}
                          onChange={(e) =>
                            handleAlmacenChange(almacen.id, "descripcion", e.target.value)
                          }
                          placeholder="Descripción"
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={almacen.tipo}
                          onValueChange={(value) => handleAlmacenChange(almacen.id, "tipo", value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="General">General</SelectItem>
                            <SelectItem value="Producción">Producción</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={almacen.direccion}
                          onChange={(e) =>
                            handleAlmacenChange(almacen.id, "direccion", e.target.value)
                          }
                          placeholder="Dirección"
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={almacen.estado}
                            onCheckedChange={(checked) =>
                              handleAlmacenChange(almacen.id, "estado", !!checked)
                            }
                          />
                          <Label className="text-xs">
                            {almacen.estado ? "Activo" : "Inactivo"}
                          </Label>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAlmacen(almacen.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Saldos por Almacén */}
      <Card>
        <CardHeader>
          <CardTitle>Saldos por Almacén</CardTitle>
          <CardDescription>Saldo de ítems por almacén seleccionado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Código Ítem</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="w-24">Gestión</TableHead>
                  <TableHead className="w-32 text-right">Saldo Inicial</TableHead>
                  <TableHead className="w-32 text-right">Saldo Actual</TableHead>
                  <TableHead className="w-32 text-right">Costo Bs.</TableHead>
                  <TableHead className="w-32 text-right">Costo $us.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {saldos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                      No hay saldos registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  saldos.map((saldo, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono">{saldo.codigo_item}</TableCell>
                      <TableCell>{saldo.descripcion}</TableCell>
                      <TableCell>{saldo.gestion}</TableCell>
                      <TableCell className="text-right font-mono">
                        {saldo.saldo_inicial.toLocaleString("es-ES")}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {saldo.saldo_actual.toLocaleString("es-ES")}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {saldo.costo_bs.toLocaleString("es-ES", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {saldo.costo_usd.toLocaleString("es-ES", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}






