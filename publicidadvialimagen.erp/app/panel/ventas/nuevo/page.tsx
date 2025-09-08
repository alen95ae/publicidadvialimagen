"use client"

import Link from "next/link"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { 
  Handshake, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Camera,
  Calculator,
  Save,
  Send
} from "lucide-react"

// Datos de ejemplo para los desplegables
const clientes = [
  { id: "1", nombre: "Empresa ABC S.A." },
  { id: "2", nombre: "Comercial XYZ Ltda." },
  { id: "3", nombre: "Industrias DEF S.A.S." },
  { id: "4", nombre: "Servicios GHI S.A." },
  { id: "5", nombre: "Distribuidora JKL Ltda." }
]

const sucursales = [
  { id: "1", nombre: "Centro" },
  { id: "2", nombre: "Norte" },
  { id: "3", nombre: "Sur" },
  { id: "4", nombre: "Oriente" },
  { id: "5", nombre: "Occidente" }
]

const vendedores = [
  { id: "1", nombre: "Juan Pérez" },
  { id: "2", nombre: "María García" },
  { id: "3", nombre: "Carlos López" },
  { id: "4", nombre: "Ana Martínez" },
  { id: "5", nombre: "Pedro Rodríguez" }
]

const productos = [
  { 
    id: "ADH-001", 
    nombre: "ADHESIVO + INSTALACIÓN",
    descripcion: "Material: Adhesivo blanco con protección uv y anti hongos Calidad: 1440 dpi's Acabado: Corte a diseño con adhesivo impreso",
    precio: 95.00,
    unidad: "m²"
  },
  { 
    id: "VIN-002", 
    nombre: "VINILO AUTOMOTRIZ",
    descripcion: "Material: Vinilo automotriz de alta calidad con adhesivo profesional. Resistente a la intemperie y fácil aplicación.",
    precio: 120.00,
    unidad: "m²"
  },
  { 
    id: "LON-003", 
    nombre: "LONA PUBLICITARIA",
    descripcion: "Material: Lona de PVC 440g con ojetes metálicos. Ideal para publicidad exterior y eventos.",
    precio: 85.00,
    unidad: "m²"
  },
  { 
    id: "COR-004", 
    nombre: "CORPLAST",
    descripcion: "Material: Coroplast 3mm con impresión digital. Perfecto para señalización y publicidad.",
    precio: 75.00,
    unidad: "m²"
  }
]

const impuestos = [
  { id: "iva", nombre: "IVA VENTAS", porcentaje: 19 },
  { id: "sin_iva", nombre: "SIN IVA", porcentaje: 0 }
]

interface ProductoItem {
  id: string
  producto: string
  imagen?: string
  descripcion: string
  cantidad: number
  ancho: number
  alto: number
  totalM2: number
  udm: string
  precio: number
  comision: number
  impuestos: string
  total: number
}

export default function NuevaCotizacionPage() {
  const [cliente, setCliente] = useState("")
  const [sucursal, setSucursal] = useState("")
  const [vendedor, setVendedor] = useState("")
  const [productosList, setProductosList] = useState<ProductoItem[]>([
    {
      id: "1",
      producto: "",
      descripcion: "",
      cantidad: 0,
      ancho: 0,
      alto: 0,
      totalM2: 0,
      udm: "m²",
      precio: 0,
      comision: 0,
      impuestos: "iva",
      total: 0
    }
  ])

  const calcularTotalM2 = (ancho: number, alto: number) => {
    return ancho * alto
  }

  const calcularTotal = (cantidad: number, totalM2: number, precio: number, comision: number, impuesto: string) => {
    const subtotal = cantidad * totalM2 * precio
    const comisionTotal = subtotal * (comision / 100)
    const impuestoSeleccionado = impuestos.find(i => i.id === impuesto)
    const impuestoTotal = subtotal * (impuestoSeleccionado?.porcentaje || 0) / 100
    
    return subtotal + comisionTotal + impuestoTotal
  }

  const agregarProducto = () => {
    const nuevoProducto: ProductoItem = {
      id: Date.now().toString(),
      producto: "",
      descripcion: "",
      cantidad: 0,
      ancho: 0,
      alto: 0,
      totalM2: 0,
      udm: "m²",
      precio: 0,
      comision: 0,
      impuestos: "iva",
      total: 0
    }
    setProductosList([...productosList, nuevoProducto])
  }

  const eliminarProducto = (id: string) => {
    if (productosList.length > 1) {
      setProductosList(productosList.filter(p => p.id !== id))
    }
  }

  const actualizarProducto = (id: string, campo: keyof ProductoItem, valor: any) => {
    setProductosList(productosList.map(producto => {
      if (producto.id === id) {
        const productoActualizado = { ...producto, [campo]: valor }
        
        // Recalcular totalM2 si cambian ancho o alto
        if (campo === 'ancho' || campo === 'alto') {
          productoActualizado.totalM2 = calcularTotalM2(
            campo === 'ancho' ? valor : producto.ancho,
            campo === 'alto' ? valor : producto.alto
          )
        }
        
        // Recalcular total si cambian los valores relevantes
        if (['cantidad', 'ancho', 'alto', 'precio', 'comision', 'impuestos'].includes(campo)) {
          productoActualizado.total = calcularTotal(
            productoActualizado.cantidad,
            productoActualizado.totalM2,
            productoActualizado.precio,
            productoActualizado.comision,
            productoActualizado.impuestos
          )
        }
        
        return productoActualizado
      }
      return producto
    }))
  }

  const seleccionarProducto = (id: string, productoId: string) => {
    const productoSeleccionado = productos.find(p => p.id === productoId)
    if (productoSeleccionado) {
      actualizarProducto(id, 'producto', productoSeleccionado.nombre)
      actualizarProducto(id, 'descripcion', productoSeleccionado.descripcion)
      actualizarProducto(id, 'precio', productoSeleccionado.precio)
      actualizarProducto(id, 'udm', productoSeleccionado.unidad)
    }
  }

  const totalGeneral = productosList.reduce((sum, producto) => sum + producto.total, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/panel/ventas" className="text-gray-600 hover:text-gray-800 mr-4">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Handshake className="w-6 h-6 text-[#D54644]" />
              <div className="text-xl font-bold text-slate-800">Nueva Cotización</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm">
              <Save className="w-4 h-4 mr-2" />
              Guardar
            </Button>
            <Button className="bg-[#D54644] hover:bg-[#B03A38] text-white">
              <Send className="w-4 h-4 mr-2" />
              Enviar
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Nuevo</h1>
        </div>

        {/* Información General */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="cliente">Cliente</Label>
                <Select value={cliente} onValueChange={setCliente}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sucursal">Sucursal</Label>
                <Select value={sucursal} onValueChange={setSucursal}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar sucursal" />
                  </SelectTrigger>
                  <SelectContent>
                    {sucursales.map((sucursal) => (
                      <SelectItem key={sucursal.id} value={sucursal.id}>
                        {sucursal.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="vendedor">Comercial</Label>
                <Select value={vendedor} onValueChange={setVendedor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar vendedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendedores.map((vendedor) => (
                      <SelectItem key={vendedor.id} value={vendedor.id}>
                        {vendedor.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Productos */}
        <Card>
          <CardHeader>
            <CardTitle>Productos y Servicios</CardTitle>
            <CardDescription>
              Agrega los productos y servicios para esta cotización
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Producto</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Imagen de diseño</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Descripción</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Cantidad</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Ancho</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Altura</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Totales en m²</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">UdM</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Precio</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Comisión</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Impuestos</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Total</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productosList.map((producto, index) => (
                    <tr key={producto.id} className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        <Select onValueChange={(value) => seleccionarProducto(producto.id, value)}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Seleccionar producto" />
                          </SelectTrigger>
                          <SelectContent>
                            {productos.map((prod) => (
                              <SelectItem key={prod.id} value={prod.id}>
                                [{prod.id}] {prod.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      
                      <td className="py-3 px-4">
                        <Button variant="outline" size="sm" className="w-12 h-12">
                          <Camera className="w-4 h-4" />
                        </Button>
                      </td>
                      
                      <td className="py-3 px-4">
                        <Textarea
                          value={producto.descripcion}
                          onChange={(e) => actualizarProducto(producto.id, 'descripcion', e.target.value)}
                          className="w-64 h-20 resize-none"
                          placeholder="Descripción del producto"
                        />
                      </td>
                      
                      <td className="py-3 px-4">
                        <Input
                          type="number"
                          value={producto.cantidad}
                          onChange={(e) => actualizarProducto(producto.id, 'cantidad', parseFloat(e.target.value) || 0)}
                          className="w-20"
                          step="0.01"
                        />
                      </td>
                      
                      <td className="py-3 px-4">
                        <Input
                          type="number"
                          value={producto.ancho}
                          onChange={(e) => actualizarProducto(producto.id, 'ancho', parseFloat(e.target.value) || 0)}
                          className="w-20"
                          step="0.01"
                        />
                      </td>
                      
                      <td className="py-3 px-4">
                        <Input
                          type="number"
                          value={producto.alto}
                          onChange={(e) => actualizarProducto(producto.id, 'alto', parseFloat(e.target.value) || 0)}
                          className="w-20"
                          step="0.01"
                        />
                      </td>
                      
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{producto.totalM2.toFixed(2)}</span>
                          <Calculator className="w-4 h-4 text-red-500" />
                        </div>
                      </td>
                      
                      <td className="py-3 px-4">
                        <Input
                          value={producto.udm}
                          onChange={(e) => actualizarProducto(producto.id, 'udm', e.target.value)}
                          className="w-16"
                        />
                      </td>
                      
                      <td className="py-3 px-4">
                        <Input
                          type="number"
                          value={producto.precio}
                          onChange={(e) => actualizarProducto(producto.id, 'precio', parseFloat(e.target.value) || 0)}
                          className="w-24"
                          step="0.01"
                        />
                      </td>
                      
                      <td className="py-3 px-4">
                        <Input
                          type="number"
                          value={producto.comision}
                          onChange={(e) => actualizarProducto(producto.id, 'comision', parseFloat(e.target.value) || 0)}
                          className="w-20"
                          step="0.01"
                        />
                      </td>
                      
                      <td className="py-3 px-4">
                        <Select value={producto.impuestos} onValueChange={(value) => actualizarProducto(producto.id, 'impuestos', value)}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {impuestos.map((impuesto) => (
                              <SelectItem key={impuesto.id} value={impuesto.id}>
                                {impuesto.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      
                      <td className="py-3 px-4">
                        <span className="font-medium">${producto.total.toFixed(2)}</span>
                      </td>
                      
                      <td className="py-3 px-4">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => eliminarProducto(producto.id)}
                          disabled={productosList.length === 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Botones de Acción */}
            <div className="flex gap-4 mt-6">
              <Button variant="outline" onClick={agregarProducto}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar un producto
              </Button>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Agregar una sección
              </Button>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Agregar nota
              </Button>
            </div>
            
            {/* Total General */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total General:</span>
                <span className="text-2xl font-bold text-[#D54644]">
                  ${totalGeneral.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
