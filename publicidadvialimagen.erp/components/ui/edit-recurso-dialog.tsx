"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { UNIDADES_MEDIDA_AIRTABLE } from "@/lib/constants"

// Categorías disponibles (solo las válidas en Airtable)
const categorias = [
  "Insumos",
  "Mano de Obra"
]

// Unidades de medida de Airtable
const unidadesMedida = UNIDADES_MEDIDA_AIRTABLE

interface RecursoItem {
  id?: string
  codigo: string
  nombre: string
  responsable: string
  unidad_medida: string
  coste: number
  categoria: string
  cantidad: number
  descripcion?: string
  disponibilidad?: string
}

interface EditRecursoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recurso?: RecursoItem | null
  onSave: (recurso: Partial<RecursoItem> & { id?: string }) => Promise<void> | void
  onCancel?: () => void
  isNew?: boolean
}

export function EditRecursoDialog({ 
  open, 
  onOpenChange, 
  recurso, 
  onSave, 
  onCancel,
  isNew = false 
}: EditRecursoDialogProps) {
  const [formData, setFormData] = useState<RecursoItem>({
    codigo: "",
    nombre: "",
    responsable: "",
    unidad_medida: "unidad",
    coste: 0,
    categoria: "Insumos",
    cantidad: 0,
    descripcion: ""
  })
  const [loading, setLoading] = useState(false)

  // Cargar datos del recurso cuando se abre el diálogo
  useEffect(() => {
    if (open && recurso) {
      // Redondear coste a 2 decimales al cargar
      const costeRedondeado = recurso.coste ? Math.round(recurso.coste * 100) / 100 : 0
      
      // Usar directamente el valor que viene de Airtable sin modificaciones
      const unidadMedida = recurso.unidad_medida || "unidad"
      
      console.log('🔍 Cargando recurso para edición:')
      console.log('   - ID:', recurso.id)
      console.log('   - Código:', recurso.codigo)
      console.log('   - Unidad de medida RAW:', recurso.unidad_medida)
      console.log('   - Unidad de medida que se usará:', unidadMedida)
      console.log('   - Tipo de unidad_medida:', typeof recurso.unidad_medida)
      console.log('   - Unidades disponibles:', unidadesMedida)
      
      setFormData({
        id: recurso.id,
        codigo: recurso.codigo || "",
        nombre: recurso.nombre || "",
        responsable: recurso.responsable || "",
        unidad_medida: unidadMedida,
        coste: costeRedondeado,
        categoria: recurso.categoria || "Insumos",
        cantidad: recurso.cantidad || 0,
        descripcion: recurso.descripcion || ""
      })
    } else if (open && isNew) {
      // Resetear formulario para nuevo recurso
      setFormData({
        codigo: "",
        nombre: "",
        responsable: "",
        unidad_medida: "unidad",
        coste: 0,
        categoria: "Insumos",
        cantidad: 0,
        descripcion: ""
      })
    }
  }, [open, recurso, isNew])

  const handleInputChange = (field: keyof RecursoItem, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    // Validaciones básicas - solo campos obligatorios
    if (!formData.codigo.trim()) {
      toast.error("El código es obligatorio")
      return
    }
    if (!formData.nombre.trim()) {
      toast.error("El nombre es obligatorio")
      return
    }
    if (!formData.categoria) {
      toast.error("La categoría es obligatoria")
      return
    }
    if (!formData.unidad_medida) {
      toast.error("La unidad de medida es obligatoria")
      return
    }
    if (formData.coste < 0) {
      toast.error("El coste no puede ser negativo")
      return
    }
    if (!formData.coste && formData.coste !== 0) {
      toast.error("El coste es obligatorio")
      return
    }
    if (formData.cantidad < 0) {
      toast.error("La cantidad no puede ser negativa")
      return
    }

    setLoading(true)
    try {
      // Redondear coste a 2 decimales y asegurar que todos los campos estén presentes
      // Limpiar unidad_medida de posibles escapes o comillas
      const unidadLimpia = (formData.unidad_medida || "unidad").trim().replace(/^["']|["']$/g, '')
      
      const recursoToSave: any = {
        codigo: (formData.codigo || "").trim(),
        nombre: (formData.nombre || "").trim(),
        responsable: (formData.responsable || "").trim(),
        unidad_medida: unidadLimpia,
        coste: Math.round(formData.coste * 100) / 100,
        categoria: formData.categoria || "Insumos",
        cantidad: formData.cantidad || 0,
        descripcion: (formData.descripcion || "").trim()
      }
      
      // Solo incluir ID si estamos editando (no si es nuevo)
      if (!isNew && formData.id) {
        recursoToSave.id = formData.id
      }
      
      console.log('💾 Guardando recurso con valores limpios:')
      console.log('   - unidad_medida (limpia):', unidadLimpia)
      console.log('   - unidad_medida JSON:', JSON.stringify(unidadLimpia))
      console.log('   - unidad_medida charCodes:', Array.from(unidadLimpia).map(c => c.charCodeAt(0)))
      console.log('   - unidad_medida tipo:', typeof unidadLimpia)
      console.log('   - recursoToSave.unidad_medida:', recursoToSave.unidad_medida)
      console.log('   - recursoToSave.unidad_medida JSON:', JSON.stringify(recursoToSave.unidad_medida))
      
      await onSave(recursoToSave)
      onOpenChange(false)
      toast.success(isNew ? "Recurso creado correctamente" : "Recurso actualizado correctamente")
    } catch (error) {
      console.error("Error al guardar recurso:", error)
      const errorMessage = error instanceof Error ? error.message : "Error al guardar el recurso"
      toast.error(errorMessage)
      throw error // Re-lanzar el error para que handleSaveRecurso lo maneje
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isNew ? "Nuevo Recurso" : "Editar Recurso"}
          </DialogTitle>
          <DialogDescription>
            {isNew 
              ? "Complete la información del nuevo recurso" 
              : "Modifique la información del recurso"
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
              placeholder="Ej: INS-001 o MDO-001"
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
              placeholder="Nombre del recurso"
            />
          </div>

          {/* Responsable */}
          <div className="space-y-2">
            <Label htmlFor="responsable">Responsable</Label>
            <Input
              id="responsable"
              value={formData.responsable}
              onChange={(e) => handleInputChange("responsable", e.target.value)}
              placeholder="Nombre del responsable (opcional)"
            />
          </div>

          {/* Categoría */}
          <div className="space-y-2">
            <Label htmlFor="categoria">Categoría *</Label>
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
            <Label htmlFor="unidad_medida">Unidad de Medida *</Label>
            <Select
              value={formData.unidad_medida || "unidad"}
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
            {/* Debug info */}
            {process.env.NODE_ENV === 'development' && (
              <p className="text-xs text-gray-400">Valor actual: {formData.unidad_medida || 'undefined'}</p>
            )}
          </div>

          {/* Cantidad (Stock) */}
          <div className="space-y-2">
            <Label htmlFor="cantidad">Stock (Cantidad)</Label>
            <Input
              id="cantidad"
              type="number"
              min="0"
              value={formData.cantidad}
              onChange={(e) => handleInputChange("cantidad", parseInt(e.target.value) || 0)}
              placeholder="0"
            />
            {formData.cantidad === 0 && (
              <p className="text-xs text-red-600">El stock será marcado como "Agotado"</p>
            )}
          </div>

          {/* Coste */}
          <div className="space-y-2">
            <Label htmlFor="coste">Coste (Bs) *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">Bs</span>
              <Input
                id="coste"
                type="number"
                min="0"
                step="0.01"
                value={formData.coste}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0
                  handleInputChange("coste", value)
                }}
                onBlur={(e) => {
                  const value = parseFloat(e.target.value) || 0
                  const rounded = Math.round(value * 100) / 100
                  handleInputChange("coste", rounded)
                }}
                placeholder="0.00"
                className="pl-10"
              />
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Input
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => handleInputChange("descripcion", e.target.value)}
              placeholder="Descripción opcional del recurso"
            />
          </div>
        </div>

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
            {loading ? "Guardando..." : (isNew ? "Crear Recurso" : "Guardar Cambios")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

