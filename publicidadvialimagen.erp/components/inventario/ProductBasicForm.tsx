"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"

interface ProductBasicFormProps {
  editing: boolean
  formData: {
    codigo: string
    nombre: string
    descripcion: string
    categoria: string
    responsable: string
    unidad_medida: string
    mostrar_en_web: boolean
  }
  producto: {
    codigo: string
    categoria: string
    responsable: string
    unidad_medida: string
    mostrar_en_web?: boolean
    descripcion?: string
  } | null
  categoriasProductos: string[]
  unidadesProductos: string[]
  handleChange: (field: string, value: any) => void
}

export function ProductBasicForm({
  editing,
  formData,
  producto,
  categoriasProductos,
  unidadesProductos,
  handleChange
}: ProductBasicFormProps) {
  if (editing) {
    return (
      <>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="codigo">Código</Label>
            <Input
              id="codigo"
              value={formData.codigo}
              onChange={(e) => handleChange("codigo", e.target.value)}
              placeholder="Código del producto"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="categoria">Categoría</Label>
            <Select 
              value={formData.categoria} 
              onValueChange={(value) => handleChange("categoria", value)}
            >
              <SelectTrigger className="bg-white dark:bg-white text-gray-900 border border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-md">
                {categoriasProductos.map((categoria) => (
                  <SelectItem key={categoria} value={categoria}>
                    {categoria}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre</Label>
          <Input
            id="nombre"
            value={formData.nombre}
            onChange={(e) => handleChange("nombre", e.target.value)}
            placeholder="Nombre del producto"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="descripcion">Descripción</Label>
          <Textarea
            id="descripcion"
            value={formData.descripcion}
            onChange={(e) => handleChange("descripcion", e.target.value)}
            placeholder="Descripción del producto"
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="responsable">Responsable</Label>
          <Input
            id="responsable"
            value={formData.responsable}
            onChange={(e) => handleChange("responsable", e.target.value)}
            placeholder="Nombre del responsable"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="unidad_medida">Unidad de Medida</Label>
            <Select 
              value={formData.unidad_medida} 
              onValueChange={(value) => handleChange("unidad_medida", value)}
            >
              <SelectTrigger className="bg-white dark:bg-white text-gray-900 border border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-md">
                {unidadesProductos.map((unidad) => (
                  <SelectItem key={unidad} value={unidad}>
                    {unidad}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between pt-6">
              <Label htmlFor="mostrar_en_web">Mostrar en Web</Label>
              <Switch
                id="mostrar_en_web"
                checked={formData.mostrar_en_web}
                onCheckedChange={(checked) => handleChange("mostrar_en_web", checked)}
                className="data-[state=checked]:bg-red-500"
              />
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {producto && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Código</Label>
              <p className="font-mono font-medium">{producto.codigo}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Categoría</Label>
              <Badge variant="secondary">{producto.categoria || 'Sin categoría'}</Badge>
            </div>
          </div>
          
          <div>
            <Label className="text-sm font-medium text-gray-700">Responsable</Label>
            <p>{producto.responsable || "No asignado"}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Unidad de Medida</Label>
              <Badge variant="outline">{producto.unidad_medida || 'Sin unidad'}</Badge>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Mostrar en Web</Label>
              <div className="mt-1">
                {producto.mostrar_en_web ? (
                  <Badge className="bg-green-100 text-green-800">Sí</Badge>
                ) : (
                  <Badge variant="secondary">No</Badge>
                )}
              </div>
            </div>
          </div>

          {producto.descripcion && (
            <div>
              <Label className="text-sm font-medium text-gray-700">Descripción</Label>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{producto.descripcion}</p>
            </div>
          )}
        </>
      )}
    </>
  )
}








