"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"

// Categorías disponibles (ordenadas alfabéticamente)
const categorias = [
  "Categoria general",
  "Corte y grabado", 
  "Displays",
  "Impresion digital",
  "Insumos",
  "Mano de obra"
]

// Unidades de medida disponibles
const unidadesMedida = [
  "unidad",
  "m²",
  "kg",
  "hora",
  "metro",
  "litro",
  "pieza",
  "rollo",
  "pliego"
]

// Estados de disponibilidad
const estadosDisponibilidad = [
  "Disponible",
  "Bajo Stock",
  "Agotado",
  "Reservado",
  "No disponible"
]

interface InventoryItem {
  id?: string
  codigo: string
  nombre: string
  responsable: string
  unidad_medida: string
  coste: number
  precio_venta: number
  categoria: string
  cantidad: number
  disponibilidad: string
  descripcion?: string
}

interface EditProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: InventoryItem | null
  onSave: (product: InventoryItem) => void
  onCancel?: () => void
  isNew?: boolean
}

export function EditProductDialog({ 
  open, 
  onOpenChange, 
  product, 
  onSave, 
  onCancel,
  isNew = false 
}: EditProductDialogProps) {
  const [formData, setFormData] = useState<InventoryItem>({
    codigo: "",
    nombre: "",
    responsable: "",
    unidad_medida: "unidad",
    coste: 0,
    precio_venta: 0,
    categoria: "Categoria general",
    cantidad: 0,
    disponibilidad: "Disponible",
    descripcion: ""
  })
  const [loading, setLoading] = useState(false)

  // Cargar datos del producto cuando se abre el diálogo
  useEffect(() => {
    if (open && product) {
      setFormData({
        id: product.id,
        codigo: product.codigo || "",
        nombre: product.nombre || "",
        responsable: product.responsable || "",
        unidad_medida: product.unidad_medida || "unidad",
        coste: product.coste || 0,
        precio_venta: product.precio_venta || 0,
        categoria: product.categoria || "Categoria general",
        cantidad: product.cantidad || 0,
        disponibilidad: product.disponibilidad || "Disponible",
        descripcion: product.descripcion || ""
      })
    } else if (open && isNew) {
      // Resetear formulario para nuevo producto
      setFormData({
        codigo: "",
        nombre: "",
        responsable: "",
        unidad_medida: "unidad",
        coste: 0,
        precio_venta: 0,
        categoria: "Categoria general",
        cantidad: 0,
        disponibilidad: "Disponible",
        descripcion: ""
      })
    }
  }, [open, product, isNew])

  const handleInputChange = (field: keyof InventoryItem, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    // Validaciones básicas
    if (!formData.codigo.trim()) {
      toast.error("El código es obligatorio")
      return
    }
    if (!formData.nombre.trim()) {
      toast.error("El nombre es obligatorio")
      return
    }
    if (!formData.responsable.trim()) {
      toast.error("El responsable es obligatorio")
      return
    }
    if (formData.coste < 0) {
      toast.error("El coste no puede ser negativo")
      return
    }
    if (formData.precio_venta < 0) {
      toast.error("El precio de venta no puede ser negativo")
      return
    }
    if (formData.cantidad < 0) {
      toast.error("La cantidad no puede ser negativa")
      return
    }

    setLoading(true)
    try {
      await onSave(formData)
      onOpenChange(false)
      toast.success(isNew ? "Producto creado correctamente" : "Producto actualizado correctamente")
    } catch (error) {
      console.error("Error al guardar producto:", error)
      toast.error("Error al guardar el producto")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    }
    onOpenChange(false)
  }

  // Calcular porcentaje de utilidad
  const calcularPorcentajeUtilidad = (coste: number, precioVenta: number): number => {
    if (coste === 0) return 0
    return ((precioVenta - coste) / coste) * 100
  }

  const utilidad = calcularPorcentajeUtilidad(formData.coste, formData.precio_venta)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isNew ? "Nuevo Producto" : "Editar Producto"}
          </DialogTitle>
          <DialogDescription>
            {isNew 
              ? "Complete la información del nuevo producto" 
              : "Modifique la información del producto"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          {/* Código */}
          <div className="space-y-2">
            <Label htmlFor="codigo">Código *</Label>
            <Input
              id="codigo"
              value={formData.codigo}
              onChange={(e) => handleInputChange("codigo", e.target.value)}
              placeholder="Ej: INV-001"
              className="font-mono"
            />
          </div>

          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => handleInputChange("nombre", e.target.value)}
              placeholder="Nombre del producto"
            />
          </div>

          {/* Responsable */}
          <div className="space-y-2">
            <Label htmlFor="responsable">Responsable *</Label>
            <Input
              id="responsable"
              value={formData.responsable}
              onChange={(e) => handleInputChange("responsable", e.target.value)}
              placeholder="Nombre del responsable"
            />
          </div>

          {/* Categoría */}
          <div className="space-y-2">
            <Label htmlFor="categoria">Categoría</Label>
            <Select
              value={formData.categoria}
              onValueChange={(value) => handleInputChange("categoria", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((categoria) => (
                  <SelectItem key={categoria} value={categoria}>
                    {categoria}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Unidad de medida */}
          <div className="space-y-2">
            <Label htmlFor="unidad_medida">Unidad de Medida</Label>
            <Select
              value={formData.unidad_medida}
              onValueChange={(value) => handleInputChange("unidad_medida", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar unidad" />
              </SelectTrigger>
              <SelectContent>
                {unidadesMedida.map((unidad) => (
                  <SelectItem key={unidad} value={unidad}>
                    {unidad}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cantidad */}
          <div className="space-y-2">
            <Label htmlFor="cantidad">Cantidad</Label>
            <Input
              id="cantidad"
              type="number"
              min="0"
              value={formData.cantidad}
              onChange={(e) => handleInputChange("cantidad", parseInt(e.target.value) || 0)}
              placeholder="0"
            />
          </div>

          {/* Coste */}
          <div className="space-y-2">
            <Label htmlFor="coste">Coste (Bs)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">Bs</span>
              <Input
                id="coste"
                type="number"
                min="0"
                step="0.01"
                value={formData.coste}
                onChange={(e) => handleInputChange("coste", parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="pl-10"
              />
            </div>
          </div>

          {/* Precio de Venta */}
          <div className="space-y-2">
            <Label htmlFor="precio_venta">Precio de Venta (Bs)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">Bs</span>
              <Input
                id="precio_venta"
                type="number"
                min="0"
                step="0.01"
                value={formData.precio_venta}
                onChange={(e) => handleInputChange("precio_venta", parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="pl-10"
              />
            </div>
          </div>

          {/* Disponibilidad */}
          <div className="space-y-2">
            <Label htmlFor="disponibilidad">Disponibilidad</Label>
            <Select
              value={formData.disponibilidad}
              onValueChange={(value) => handleInputChange("disponibilidad", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar disponibilidad" />
              </SelectTrigger>
              <SelectContent>
                {estadosDisponibilidad.map((estado) => (
                  <SelectItem key={estado} value={estado}>
                    {estado}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Descripción */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Input
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => handleInputChange("descripcion", e.target.value)}
              placeholder="Descripción opcional del producto"
            />
          </div>
        </div>

        {/* Información de utilidad */}
        {formData.coste > 0 && formData.precio_venta > 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Utilidad:</span>
              <span className={`text-sm font-bold ${
                utilidad >= 50 ? 'text-green-600' : 
                utilidad >= 20 ? 'text-yellow-600' : 
                'text-red-600'
              }`}>
                {utilidad.toFixed(1)}%
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Coste: Bs {formData.coste.toFixed(2)} | Precio: Bs {formData.precio_venta.toFixed(2)}
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? "Guardando..." : (isNew ? "Crear Producto" : "Guardar Cambios")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
