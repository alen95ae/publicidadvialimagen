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
import { Edit, Trash2, Eye } from "lucide-react"

interface ItemInventario {
  id: number
  codigo: string
  codigo_alterno: string
  descripcion: string
  fecha_creacion: string
  tipo_item: string
  estado: string
}

interface ItemDetalle {
  grupo: string
  codigo_serie: string
  descripcion: string
  unidad: string
  fecha_creacion: string
  coste_bs: number
  coste_usd: number
  precio_bs: number
  insumo: boolean
  venta: boolean
  cuenta_clientes: string
  cuenta_ingreso: string
  cuenta_gasto: string
  cuenta_costo: string
  estado: string
  codigo: string
}

export default function ItemsInventarioTab() {
  const [filtroTipoItem, setFiltroTipoItem] = useState("TODOS")

  const [items, setItems] = useState<ItemInventario[]>([
    {
      id: 1,
      codigo: "ITEM-001",
      codigo_alterno: "ALT-001",
      descripcion: "Lona 6x4",
      fecha_creacion: "2025-01-15",
      tipo_item: "Lonas",
      estado: "Activo",
    },
    {
      id: 2,
      codigo: "ITEM-002",
      codigo_alterno: "ALT-002",
      descripcion: "Herramienta Manual",
      fecha_creacion: "2025-01-16",
      tipo_item: "Herramientas",
      estado: "Activo",
    },
    {
      id: 3,
      codigo: "ITEM-003",
      codigo_alterno: "ALT-003",
      descripcion: "Material Seguridad",
      fecha_creacion: "2025-01-17",
      tipo_item: "Seguridad",
      estado: "Inactivo",
    },
    {
      id: 4,
      codigo: "ITEM-004",
      codigo_alterno: "ALT-004",
      descripcion: "Insumo Básico",
      fecha_creacion: "2025-01-18",
      tipo_item: "Insumos",
      estado: "Activo",
    },
  ])

  const [selectedItem, setSelectedItem] = useState<ItemDetalle | null>({
    grupo: "GRP-001",
    codigo_serie: "SER-001",
    descripcion: "Lona 6x4",
    unidad: "Unidad",
    fecha_creacion: "2025-01-15",
    coste_bs: 150.00,
    coste_usd: 21.50,
    precio_bs: 200.00,
    insumo: true,
    venta: true,
    cuenta_clientes: "1.1.1.101",
    cuenta_ingreso: "4.1.1.001",
    cuenta_gasto: "5.1.1.001",
    cuenta_costo: "6.1.1.001",
    estado: "Activo",
    codigo: "ITEM-001",
  })

  const handleItemSelect = (item: ItemInventario) => {
    // Simular carga de detalle
    setSelectedItem({
      grupo: "GRP-001",
      codigo_serie: `SER-${item.codigo.split("-")[1]}`,
      descripcion: item.descripcion,
      unidad: "Unidad",
      fecha_creacion: item.fecha_creacion,
      coste_bs: 150.00,
      coste_usd: 21.50,
      precio_bs: 200.00,
      insumo: true,
      venta: true,
      cuenta_clientes: "1.1.1.101",
      cuenta_ingreso: "4.1.1.001",
      cuenta_gasto: "5.1.1.001",
      cuenta_costo: "6.1.1.001",
      estado: item.estado,
      codigo: item.codigo,
    })
  }

  const handleDetalleChange = (field: keyof ItemDetalle, value: string | number | boolean) => {
    if (selectedItem) {
      setSelectedItem({ ...selectedItem, [field]: value })
    }
  }

  return (
    <div className="space-y-6">
      {/* Filtro */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="tipo_item" className="text-xs text-gray-600">
                Tipo de Ítem
              </Label>
              <Select value={filtroTipoItem} onValueChange={setFiltroTipoItem}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos</SelectItem>
                  <SelectItem value="Lonas">Lonas</SelectItem>
                  <SelectItem value="Materiales">Materiales</SelectItem>
                  <SelectItem value="Herramientas">Herramientas</SelectItem>
                  <SelectItem value="Seguridad">Seguridad</SelectItem>
                  <SelectItem value="Insumos">Insumos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Ítems */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Ítems</CardTitle>
          <CardDescription>Gestión de ítems de inventario</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Código</TableHead>
                  <TableHead className="w-32">Código Alterno</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="w-32">Fecha Creación</TableHead>
                  <TableHead className="w-32">Tipo de Ítem</TableHead>
                  <TableHead className="w-24">Estado</TableHead>
                  <TableHead className="w-24">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                      No hay ítems registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow
                      key={item.id}
                      className={selectedItem?.codigo === item.codigo ? "bg-blue-50" : ""}
                    >
                      <TableCell className="font-mono">{item.codigo}</TableCell>
                      <TableCell className="font-mono">{item.codigo_alterno}</TableCell>
                      <TableCell>{item.descripcion}</TableCell>
                      <TableCell>
                        {new Date(item.fecha_creacion).toLocaleDateString("es-ES")}
                      </TableCell>
                      <TableCell>{item.tipo_item}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            item.estado === "Activo"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {item.estado}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleItemSelect(item)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
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

      {/* Registro de Ítem */}
      <Card>
        <CardHeader>
          <CardTitle>Registro de Ítem</CardTitle>
          <CardDescription>Detalle del ítem seleccionado</CardDescription>
        </CardHeader>
        <CardContent>
          {selectedItem ? (
            <div className="space-y-6">
              {/* Información Básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="codigo" className="text-xs text-gray-600">
                    Código
                  </Label>
                  <Input
                    id="codigo"
                    value={selectedItem.codigo}
                    readOnly
                    className="mt-1 bg-gray-50 font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="grupo" className="text-xs text-gray-600">
                    Grupo
                  </Label>
                  <Input
                    id="grupo"
                    value={selectedItem.grupo}
                    onChange={(e) => handleDetalleChange("grupo", e.target.value)}
                    placeholder="Grupo"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="codigo_serie" className="text-xs text-gray-600">
                    Código de Serie
                  </Label>
                  <Input
                    id="codigo_serie"
                    value={selectedItem.codigo_serie}
                    onChange={(e) => handleDetalleChange("codigo_serie", e.target.value)}
                    placeholder="Código de Serie"
                    className="mt-1 font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="unidad" className="text-xs text-gray-600">
                    Unidad
                  </Label>
                  <Input
                    id="unidad"
                    value={selectedItem.unidad}
                    onChange={(e) => handleDetalleChange("unidad", e.target.value)}
                    placeholder="Unidad"
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="descripcion" className="text-xs text-gray-600">
                    Descripción
                  </Label>
                  <Input
                    id="descripcion"
                    value={selectedItem.descripcion}
                    onChange={(e) => handleDetalleChange("descripcion", e.target.value)}
                    placeholder="Descripción"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="fecha_creacion" className="text-xs text-gray-600">
                    Fecha de Creación
                  </Label>
                  <Input
                    id="fecha_creacion"
                    type="date"
                    value={selectedItem.fecha_creacion}
                    onChange={(e) => handleDetalleChange("fecha_creacion", e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="estado" className="text-xs text-gray-600">
                    Estado
                  </Label>
                  <Select
                    value={selectedItem.estado}
                    onValueChange={(value) => handleDetalleChange("estado", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Activo">Activo</SelectItem>
                      <SelectItem value="Inactivo">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Costos y Precios */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="coste_bs" className="text-xs text-gray-600">
                    Coste Bs.
                  </Label>
                  <Input
                    id="coste_bs"
                    type="number"
                    step="0.01"
                    value={selectedItem.coste_bs}
                    onChange={(e) =>
                      handleDetalleChange("coste_bs", parseFloat(e.target.value) || 0)
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="coste_usd" className="text-xs text-gray-600">
                    Coste $us.
                  </Label>
                  <Input
                    id="coste_usd"
                    type="number"
                    step="0.01"
                    value={selectedItem.coste_usd}
                    onChange={(e) =>
                      handleDetalleChange("coste_usd", parseFloat(e.target.value) || 0)
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="precio_bs" className="text-xs text-gray-600">
                    Precio Bs.
                  </Label>
                  <Input
                    id="precio_bs"
                    type="number"
                    step="0.01"
                    value={selectedItem.precio_bs}
                    onChange={(e) =>
                      handleDetalleChange("precio_bs", parseFloat(e.target.value) || 0)
                    }
                    className="mt-1"
                  />
                </div>
              </div>

              <Separator />

              {/* Flags */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700">Flags</h3>
                <div className="flex gap-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="insumo"
                      checked={selectedItem.insumo}
                      onCheckedChange={(checked) =>
                        handleDetalleChange("insumo", !!checked)
                      }
                    />
                    <Label htmlFor="insumo" className="text-sm font-normal cursor-pointer">
                      Insumo
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="venta"
                      checked={selectedItem.venta}
                      onCheckedChange={(checked) => handleDetalleChange("venta", !!checked)}
                    />
                    <Label htmlFor="venta" className="text-sm font-normal cursor-pointer">
                      Venta
                    </Label>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Cuentas Contables */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700">Cuentas Contables</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="cuenta_clientes" className="text-xs text-gray-600">
                      Cuenta Clientes
                    </Label>
                    <Input
                      id="cuenta_clientes"
                      value={selectedItem.cuenta_clientes}
                      onChange={(e) => handleDetalleChange("cuenta_clientes", e.target.value)}
                      placeholder="1.1.1.101"
                      className="mt-1 font-mono"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cuenta_ingreso" className="text-xs text-gray-600">
                      Cuenta Ingreso
                    </Label>
                    <Input
                      id="cuenta_ingreso"
                      value={selectedItem.cuenta_ingreso}
                      onChange={(e) => handleDetalleChange("cuenta_ingreso", e.target.value)}
                      placeholder="4.1.1.001"
                      className="mt-1 font-mono"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cuenta_gasto" className="text-xs text-gray-600">
                      Cuenta Gasto
                    </Label>
                    <Input
                      id="cuenta_gasto"
                      value={selectedItem.cuenta_gasto}
                      onChange={(e) => handleDetalleChange("cuenta_gasto", e.target.value)}
                      placeholder="5.1.1.001"
                      className="mt-1 font-mono"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cuenta_costo" className="text-xs text-gray-600">
                      Cuenta Costo
                    </Label>
                    <Input
                      id="cuenta_costo"
                      value={selectedItem.cuenta_costo}
                      onChange={(e) => handleDetalleChange("cuenta_costo", e.target.value)}
                      placeholder="6.1.1.001"
                      className="mt-1 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Seleccione un ítem de la tabla para ver su detalle
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}







