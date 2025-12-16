"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Search, X } from "lucide-react"

interface FacturaItem {
  id: number
  item: string
  nro_cont: string
  descripcion: string
  cantidad: number
  precio_unitario: number
  importe_bs: number
}

export default function FacturasManuales() {
  const [numero, setNumero] = useState("")
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0])
  const [vendedor, setVendedor] = useState("")
  const [cliente, setCliente] = useState("")
  const [nombre, setNombre] = useState("")
  const [nit, setNit] = useState("")
  const [detalle, setDetalle] = useState("")
  const [moneda, setMoneda] = useState("BOB")
  const [cotizacion, setCotizacion] = useState("1.00")
  const [items, setItems] = useState<FacturaItem[]>([
    {
      id: 1,
      item: "1",
      nro_cont: "",
      descripcion: "",
      cantidad: 0,
      precio_unitario: 0,
      importe_bs: 0,
    },
  ])

  const handleItemChange = (id: number, field: keyof FacturaItem, value: string | number) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value }
          // Calcular importe automáticamente
          if (field === "cantidad" || field === "precio_unitario") {
            updated.importe_bs = updated.cantidad * updated.precio_unitario
          }
          return updated
        }
        return item
      })
    )
  }

  const handleAddItem = () => {
    const newId = items.length > 0 ? Math.max(...items.map((i) => i.id)) + 1 : 1
    setItems([
      ...items,
      {
        id: newId,
        item: newId.toString(),
        nro_cont: "",
        descripcion: "",
        cantidad: 0,
        precio_unitario: 0,
        importe_bs: 0,
      },
    ])
  }

  const handleRemoveItem = (id: number) => {
    setItems(items.filter((item) => item.id !== id))
  }

  const total = items.reduce((sum, item) => sum + item.importe_bs, 0)

  const handleAnularFactura = () => {
    alert("Factura anulada (mock)")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Factura Manual</CardTitle>
        <CardDescription>
          Crear y gestionar facturas manuales
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Campos principales */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Datos de la Factura</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="numero" className="text-xs text-gray-600">
                Número
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="numero"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  placeholder="Número de factura"
                  className="font-mono"
                />
                <Button variant="outline" size="icon" title="Buscar">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="fecha" className="text-xs text-gray-600">
                Fecha
              </Label>
              <Input
                id="fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="vendedor" className="text-xs text-gray-600">
                Vendedor
              </Label>
              <Input
                id="vendedor"
                value={vendedor}
                onChange={(e) => setVendedor(e.target.value)}
                placeholder="Vendedor"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="cliente" className="text-xs text-gray-600">
                Cliente
              </Label>
              <Input
                id="cliente"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                placeholder="Cliente"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="nombre" className="text-xs text-gray-600">
                Nombre
              </Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre completo"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="nit" className="text-xs text-gray-600">
                NIT
              </Label>
              <Input
                id="nit"
                value={nit}
                onChange={(e) => setNit(e.target.value)}
                placeholder="NIT"
                className="mt-1 font-mono"
              />
            </div>
            <div>
              <Label htmlFor="moneda" className="text-xs text-gray-600">
                Moneda
              </Label>
              <Select value={moneda} onValueChange={setMoneda}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BOB">Bolivianos</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="cotizacion" className="text-xs text-gray-600">
                Cotización
              </Label>
              <Input
                id="cotizacion"
                type="number"
                step="0.01"
                value={cotizacion}
                onChange={(e) => setCotizacion(e.target.value)}
                placeholder="1.00"
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="detalle" className="text-xs text-gray-600">
              Detalle
            </Label>
            <Textarea
              id="detalle"
              value={detalle}
              onChange={(e) => setDetalle(e.target.value)}
              placeholder="Detalle de la factura"
              className="mt-1"
              rows={3}
            />
          </div>
        </div>

        <Separator />

        {/* Tabla de ítems */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Ítems de la Factura</h3>
            <Button onClick={handleAddItem} variant="outline" size="sm">
              Agregar Ítem
            </Button>
          </div>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Item</TableHead>
                  <TableHead className="w-32">Nro. Cont.</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="w-24">Cantidad</TableHead>
                  <TableHead className="w-32">Precio Unitario</TableHead>
                  <TableHead className="w-32">Importe Bs.</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                      No hay ítems. Click en "Agregar Ítem" para comenzar.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.item}</TableCell>
                      <TableCell>
                        <Input
                          value={item.nro_cont}
                          onChange={(e) => handleItemChange(item.id, "nro_cont", e.target.value)}
                          placeholder="Nro. Cont."
                          className="w-32 font-mono"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.descripcion}
                          onChange={(e) => handleItemChange(item.id, "descripcion", e.target.value)}
                          placeholder="Descripción"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.cantidad}
                          onChange={(e) =>
                            handleItemChange(item.id, "cantidad", parseFloat(e.target.value) || 0)
                          }
                          className="w-24 text-right"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.precio_unitario}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              "precio_unitario",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-32 text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {item.importe_bs.toLocaleString("es-ES", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <Separator />

        {/* Footer */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-4">
            <Label className="text-sm font-semibold">Total:</Label>
            <span className="text-lg font-bold font-mono">
              {total.toLocaleString("es-ES", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              Bs.
            </span>
          </div>
          <Button
            onClick={handleAnularFactura}
            variant="outline"
            className="text-red-600 hover:text-red-700 border-red-600"
          >
            Anular Factura
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}


