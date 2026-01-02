"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"

interface DetalleActivo {
  id: number
  numero: number
  descripcion: string
  fecha_registro: string
  unidad: string
  cantidad: number
  valor_compra_bs: number
  valor_compra_usd: number
  estado: string
}

export default function ActivoRegistroTab() {
  const [formData, setFormData] = useState({
    tipo_activo: "",
    codigo: "ACT-001",
    proyecto_entidad: "",
    fecha_compra: new Date().toISOString().split("T")[0],
    descripcion: "",
    fecha_activacion: new Date().toISOString().split("T")[0],
    unidad: "",
    moneda: "BS",
    cantidad: 1,
    cotizacion: "1.00",
    depreciable: false,
    estado: "Pendiente",
    valor_compra_bs: 0,
    valor_compra_usd: 0,
    tiempo_vida_util: 0,
    fecha_baja: "",
    depreciacion_bs: 0,
    depreciacion_usd: 0,
    valor_actual_bs: 0,
    valor_actual_usd: 0,
    departamento: "",
    ciudad: "",
    ubicacion_edificio: "",
    oficina: "",
    centro_costo: "",
    proveedor: "",
    autorizado: "",
    responsable: "",
    caracteristicas: "",
  })

  const [detalles, setDetalles] = useState<DetalleActivo[]>([
    {
      id: 1,
      numero: 1,
      descripcion: "Equipo de cómputo",
      fecha_registro: "2025-01-15",
      unidad: "Unidad",
      cantidad: 1,
      valor_compra_bs: 5000.00,
      valor_compra_usd: 720.00,
      estado: "Alta",
    },
    {
      id: 2,
      numero: 2,
      descripcion: "Mobiliario de oficina",
      fecha_registro: "2025-01-16",
      unidad: "Unidad",
      cantidad: 1,
      valor_compra_bs: 3000.00,
      valor_compra_usd: 432.00,
      estado: "Alta",
    },
  ])

  const handleFormChange = (field: string, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleDetalleChange = (id: number, field: keyof DetalleActivo, value: string | number) => {
    setDetalles(
      detalles.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    )
  }

  const handleAddDetalle = () => {
    const newId = detalles.length > 0 ? Math.max(...detalles.map((d) => d.id)) + 1 : 1
    setDetalles([
      ...detalles,
      {
        id: newId,
        numero: newId,
        descripcion: "",
        fecha_registro: new Date().toISOString().split("T")[0],
        unidad: "Unidad",
        cantidad: 1,
        valor_compra_bs: 0,
        valor_compra_usd: 0,
        estado: "Pendiente",
      },
    ])
  }

  const handleRemoveDetalle = (id: number) => {
    setDetalles(detalles.filter((d) => d.id !== id))
  }

  const totalCompraBs = detalles.reduce((sum, d) => sum + d.valor_compra_bs, 0)
  const totalCompraUsd = detalles.reduce((sum, d) => sum + d.valor_compra_usd, 0)

  return (
    <div className="space-y-6">
      {/* Formulario Superior - Datos del Activo */}
      <Card>
        <CardHeader>
          <CardTitle>Datos del Activo</CardTitle>
          <CardDescription>Información básica del activo fijo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Primera fila de campos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="tipo_activo" className="text-xs text-gray-600">
                Tipo de Activo
              </Label>
              <Select
                value={formData.tipo_activo}
                onValueChange={(value) => handleFormChange("tipo_activo", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EQUIPO">Equipo</SelectItem>
                  <SelectItem value="MOBILIARIO">Mobiliario</SelectItem>
                  <SelectItem value="VEHICULO">Vehículo</SelectItem>
                  <SelectItem value="MAQUINARIA">Maquinaria</SelectItem>
                  <SelectItem value="EDIFICIO">Edificio</SelectItem>
                  <SelectItem value="OTRO">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="codigo" className="text-xs text-gray-600">
                Código
              </Label>
              <Input
                id="codigo"
                value={formData.codigo}
                readOnly
                className="mt-1 bg-gray-50 font-mono"
              />
            </div>
            <div>
              <Label htmlFor="proyecto_entidad" className="text-xs text-gray-600">
                Proyecto / Entidad
              </Label>
              <Select
                value={formData.proyecto_entidad}
                onValueChange={(value) => handleFormChange("proyecto_entidad", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PROY-001">Proyecto 001</SelectItem>
                  <SelectItem value="PROY-002">Proyecto 002</SelectItem>
                  <SelectItem value="ENT-001">Entidad 001</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="fecha_compra" className="text-xs text-gray-600">
                Fecha de Compra
              </Label>
              <Input
                id="fecha_compra"
                type="date"
                value={formData.fecha_compra}
                onChange={(e) => handleFormChange("fecha_compra", e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="descripcion" className="text-xs text-gray-600">
                Descripción
              </Label>
              <Input
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => handleFormChange("descripcion", e.target.value)}
                placeholder="Descripción del activo"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="fecha_activacion" className="text-xs text-gray-600">
                Fecha de Activación
              </Label>
              <Input
                id="fecha_activacion"
                type="date"
                value={formData.fecha_activacion}
                onChange={(e) => handleFormChange("fecha_activacion", e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="unidad" className="text-xs text-gray-600">
                Unidad
              </Label>
              <Select
                value={formData.unidad}
                onValueChange={(value) => handleFormChange("unidad", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UNIDAD">Unidad</SelectItem>
                  <SelectItem value="METRO">Metro</SelectItem>
                  <SelectItem value="KILO">Kilo</SelectItem>
                  <SelectItem value="LITRO">Litro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="moneda" className="text-xs text-gray-600">
                Moneda
              </Label>
              <Select
                value={formData.moneda}
                onValueChange={(value) => handleFormChange("moneda", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BS">Bs</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="cantidad" className="text-xs text-gray-600">
                Cantidad
              </Label>
              <Input
                id="cantidad"
                type="number"
                value={formData.cantidad}
                onChange={(e) => handleFormChange("cantidad", parseInt(e.target.value) || 0)}
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
                value={formData.cotizacion}
                onChange={(e) => handleFormChange("cotizacion", e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <Checkbox
                id="depreciable"
                checked={formData.depreciable}
                onCheckedChange={(checked) => handleFormChange("depreciable", !!checked)}
              />
              <Label htmlFor="depreciable" className="text-sm font-normal cursor-pointer">
                ¿Depreciable?
              </Label>
            </div>
          </div>

          <Separator />

          {/* Estado del Activo */}
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-3 block">
              Estado del Activo
            </Label>
            <RadioGroup
              value={formData.estado}
              onValueChange={(value) => handleFormChange("estado", value)}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Pendiente" id="estado-pendiente" />
                <Label htmlFor="estado-pendiente" className="cursor-pointer">
                  Pendiente
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Alta" id="estado-alta" />
                <Label htmlFor="estado-alta" className="cursor-pointer">
                  Alta
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Baja" id="estado-baja" />
                <Label htmlFor="estado-baja" className="cursor-pointer">
                  Baja
                </Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Valores y Depreciación */}
      <Card>
        <CardHeader>
          <CardTitle>Valores y Depreciación</CardTitle>
          <CardDescription>Valores del activo y cálculo de depreciación</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="valor_compra_bs" className="text-xs text-gray-600">
                Valor Compra Bs.
              </Label>
              <Input
                id="valor_compra_bs"
                type="number"
                step="0.01"
                value={formData.valor_compra_bs}
                onChange={(e) =>
                  handleFormChange("valor_compra_bs", parseFloat(e.target.value) || 0)
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="valor_compra_usd" className="text-xs text-gray-600">
                Valor Compra USD
              </Label>
              <Input
                id="valor_compra_usd"
                type="number"
                step="0.01"
                value={formData.valor_compra_usd}
                onChange={(e) =>
                  handleFormChange("valor_compra_usd", parseFloat(e.target.value) || 0)
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="tiempo_vida_util" className="text-xs text-gray-600">
                Tiempo de Vida Útil (meses)
              </Label>
              <Input
                id="tiempo_vida_util"
                type="number"
                value={formData.tiempo_vida_util}
                onChange={(e) =>
                  handleFormChange("tiempo_vida_util", parseInt(e.target.value) || 0)
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="fecha_baja" className="text-xs text-gray-600">
                Fecha de Baja
              </Label>
              <Input
                id="fecha_baja"
                type="date"
                value={formData.fecha_baja}
                onChange={(e) => handleFormChange("fecha_baja", e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="depreciacion_bs" className="text-xs text-gray-600">
                Depreciación Bs.
              </Label>
              <Input
                id="depreciacion_bs"
                type="number"
                step="0.01"
                value={formData.depreciacion_bs}
                readOnly
                className="mt-1 bg-gray-50"
              />
            </div>
            <div>
              <Label htmlFor="depreciacion_usd" className="text-xs text-gray-600">
                Depreciación USD
              </Label>
              <Input
                id="depreciacion_usd"
                type="number"
                step="0.01"
                value={formData.depreciacion_usd}
                readOnly
                className="mt-1 bg-gray-50"
              />
            </div>
            <div>
              <Label htmlFor="valor_actual_bs" className="text-xs text-gray-600">
                Valor Actual Bs.
              </Label>
              <Input
                id="valor_actual_bs"
                type="number"
                step="0.01"
                value={formData.valor_actual_bs}
                readOnly
                className="mt-1 bg-gray-50"
              />
            </div>
            <div>
              <Label htmlFor="valor_actual_usd" className="text-xs text-gray-600">
                Valor Actual USD
              </Label>
              <Input
                id="valor_actual_usd"
                type="number"
                step="0.01"
                value={formData.valor_actual_usd}
                readOnly
                className="mt-1 bg-gray-50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Datos Administrativos */}
      <Card>
        <CardHeader>
          <CardTitle>Datos Administrativos</CardTitle>
          <CardDescription>Información administrativa y de ubicación</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="departamento" className="text-xs text-gray-600">
                Departamento
              </Label>
              <Input
                id="departamento"
                value={formData.departamento}
                onChange={(e) => handleFormChange("departamento", e.target.value)}
                placeholder="Departamento"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="ciudad" className="text-xs text-gray-600">
                Ciudad
              </Label>
              <Input
                id="ciudad"
                value={formData.ciudad}
                onChange={(e) => handleFormChange("ciudad", e.target.value)}
                placeholder="Ciudad"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="ubicacion_edificio" className="text-xs text-gray-600">
                Ubicación / Edificio
              </Label>
              <Input
                id="ubicacion_edificio"
                value={formData.ubicacion_edificio}
                onChange={(e) => handleFormChange("ubicacion_edificio", e.target.value)}
                placeholder="Ubicación / Edificio"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="oficina" className="text-xs text-gray-600">
                Oficina
              </Label>
              <Input
                id="oficina"
                value={formData.oficina}
                onChange={(e) => handleFormChange("oficina", e.target.value)}
                placeholder="Oficina"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="centro_costo" className="text-xs text-gray-600">
                Centro de Costo
              </Label>
              <Input
                id="centro_costo"
                value={formData.centro_costo}
                onChange={(e) => handleFormChange("centro_costo", e.target.value)}
                placeholder="Centro de Costo"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="proveedor" className="text-xs text-gray-600">
                Proveedor
              </Label>
              <Input
                id="proveedor"
                value={formData.proveedor}
                onChange={(e) => handleFormChange("proveedor", e.target.value)}
                placeholder="Proveedor"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="autorizado" className="text-xs text-gray-600">
                Autorizado
              </Label>
              <Input
                id="autorizado"
                value={formData.autorizado}
                onChange={(e) => handleFormChange("autorizado", e.target.value)}
                placeholder="Autorizado"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="responsable" className="text-xs text-gray-600">
                Responsable
              </Label>
              <Input
                id="responsable"
                value={formData.responsable}
                onChange={(e) => handleFormChange("responsable", e.target.value)}
                placeholder="Responsable"
                className="mt-1"
              />
            </div>
            <div className="md:col-span-2 lg:col-span-4">
              <Label htmlFor="caracteristicas" className="text-xs text-gray-600">
                Características
              </Label>
              <Textarea
                id="caracteristicas"
                value={formData.caracteristicas}
                onChange={(e) => handleFormChange("caracteristicas", e.target.value)}
                placeholder="Características del activo"
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Tabla de Detalle del Activo */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Detalle del Activo</CardTitle>
              <CardDescription>Detalle de componentes del activo</CardDescription>
            </div>
            <Button onClick={handleAddDetalle} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Detalle
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Nº</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="w-32">Fecha Registro</TableHead>
                  <TableHead className="w-24">Unidad</TableHead>
                  <TableHead className="w-24">Cantidad</TableHead>
                  <TableHead className="w-32 text-right">Valor Compra Bs.</TableHead>
                  <TableHead className="w-32 text-right">Valor Compra USD</TableHead>
                  <TableHead className="w-24">Estado</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detalles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-gray-500 py-8">
                      No hay detalles. Click en "Agregar Detalle" para comenzar.
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {detalles.map((detalle) => (
                      <TableRow key={detalle.id}>
                        <TableCell className="font-medium">{detalle.numero}</TableCell>
                        <TableCell>
                          <Input
                            value={detalle.descripcion}
                            onChange={(e) =>
                              handleDetalleChange(detalle.id, "descripcion", e.target.value)
                            }
                            placeholder="Descripción"
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="date"
                            value={detalle.fecha_registro}
                            onChange={(e) =>
                              handleDetalleChange(detalle.id, "fecha_registro", e.target.value)
                            }
                            className="w-32"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={detalle.unidad}
                            onChange={(e) =>
                              handleDetalleChange(detalle.id, "unidad", e.target.value)
                            }
                            placeholder="Unidad"
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={detalle.cantidad}
                            onChange={(e) =>
                              handleDetalleChange(
                                detalle.id,
                                "cantidad",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {detalle.valor_compra_bs.toLocaleString("es-ES", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {detalle.valor_compra_usd.toLocaleString("es-ES", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={detalle.estado}
                            onValueChange={(value) =>
                              handleDetalleChange(detalle.id, "estado", value)
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pendiente">Pendiente</SelectItem>
                              <SelectItem value="Alta">Alta</SelectItem>
                              <SelectItem value="Baja">Baja</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveDetalle(detalle.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-gray-50 font-semibold">
                      <TableCell colSpan={5} className="text-right">
                        TOTALES:
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {totalCompraBs.toLocaleString("es-ES", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {totalCompraUsd.toLocaleString("es-ES", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell colSpan={2}></TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}






