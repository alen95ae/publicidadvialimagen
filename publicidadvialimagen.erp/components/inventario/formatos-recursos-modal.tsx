"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { useCategorias } from "@/hooks/use-categorias"

interface Formato {
  id: string
  formato: string
  cantidad: number
  unidad_medida: string
}

interface FormatosRecursosModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FormatosRecursosModal({ open, onOpenChange }: FormatosRecursosModalProps) {
  const { categorias: unidadesMedida, loading: unidadesLoading } = useCategorias("Inventario", "Productos_unidades")
  const [formatos, setFormatos] = useState<Formato[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  
  // Estados para crear/editar
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formato, setFormato] = useState("")
  const [cantidad, setCantidad] = useState("")
  const [unidadMedida, setUnidadMedida] = useState("")

  // Cargar formatos
  const fetchFormatos = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/formatos')
      
      if (response.ok) {
        const result = await response.json()
        console.log('📦 Formatos cargados:', result)
        setFormatos(result.data || [])
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Error cargando formatos:', errorData)
        toast.error(errorData.error || 'Error al cargar formatos')
      }
    } catch (error) {
      console.error('❌ Error cargando formatos:', error)
      toast.error('Error al cargar formatos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchFormatos()
      resetForm()
    }
  }, [open])

  const resetForm = () => {
    setEditingId(null)
    setFormato("")
    setCantidad("")
    setUnidadMedida("")
  }

  const handleStartEdit = (formatoItem: Formato) => {
    setEditingId(formatoItem.id)
    setFormato(formatoItem.formato)
    setCantidad(formatoItem.cantidad.toString())
    setUnidadMedida(formatoItem.unidad_medida)
  }

  const handleCancelEdit = () => {
    resetForm()
  }

  const validateForm = (): boolean => {
    if (!formato.trim()) {
      toast.error("El formato es obligatorio")
      return false
    }

    const cantidadNum = parseFloat(cantidad)
    if (isNaN(cantidadNum) || cantidadNum <= 0) {
      toast.error("La cantidad debe ser mayor a 0")
      return false
    }

    if (!unidadMedida) {
      toast.error("La unidad de medida es obligatoria")
      return false
    }

    // Verificar duplicados (formato + unidad)
    const existeDuplicado = formatos.some(f => 
      f.id !== editingId && 
      f.formato.toLowerCase().trim() === formato.toLowerCase().trim() &&
      f.unidad_medida === unidadMedida
    )

    if (existeDuplicado) {
      toast.error("Ya existe un formato con este nombre y unidad de medida")
      return false
    }

    return true
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setSaving(true)
    try {
      const cantidadNum = parseFloat(cantidad)
      const payload = {
        formato: formato.trim(),
        cantidad: cantidadNum,
        unidad_medida: unidadMedida
      }

      if (editingId) {
        // Actualizar
        const response = await fetch(`/api/formatos/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        if (response.ok) {
          toast.success("Formato actualizado correctamente")
          await fetchFormatos()
          resetForm()
        } else {
          const result = await response.json()
          toast.error(result.error || 'Error al actualizar formato')
        }
      } else {
        // Crear
        const response = await fetch('/api/formatos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        if (response.ok) {
          toast.success("Formato creado correctamente")
          await fetchFormatos()
          resetForm()
        } else {
          const result = await response.json()
          toast.error(result.error || 'Error al crear formato')
        }
      }
    } catch (error) {
      console.error('Error guardando formato:', error)
      toast.error('Error al guardar formato')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (id: string) => {
    setDeleteId(id)
  }

  const confirmDelete = async () => {
    if (!deleteId) return

    try {
      const response = await fetch(`/api/formatos/${deleteId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success("Formato eliminado correctamente")
        await fetchFormatos()
        setDeleteId(null)
      } else {
        const result = await response.json()
        toast.error(result.error || 'Error al eliminar formato')
      }
    } catch (error) {
      console.error('Error eliminando formato:', error)
      toast.error('Error al eliminar formato')
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gestionar Formatos</DialogTitle>
            <DialogDescription>
              Administra los formatos disponibles para los recursos.
            </DialogDescription>
          </DialogHeader>

          {/* Formulario de crear/editar */}
          <div className="space-y-4 border-b pb-4 mb-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Formato *</Label>
                <Input
                  value={formato}
                  onChange={(e) => setFormato(e.target.value)}
                  placeholder="Ej: Rollo, bote, etc"
                />
              </div>
              <div className="space-y-2">
                <Label>Cantidad *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>UdM *</Label>
                <Select value={unidadMedida} onValueChange={setUnidadMedida}>
                  <SelectTrigger>
                    <SelectValue placeholder="Unidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {!unidadesLoading && unidadesMedida.map((unidad) => (
                      <SelectItem key={unidad} value={unidad}>
                        {unidad}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#D54644] hover:bg-[#B03A38] text-white"
              >
                {editingId ? "Actualizar" : "Agregar"}
              </Button>
              {editingId && (
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancelar
                </Button>
              )}
            </div>
          </div>

          {/* Lista de formatos */}
          {loading ? (
            <div className="py-8 text-center text-gray-500">
              Cargando formatos...
            </div>
          ) : formatos.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No hay formatos configurados. Agrega uno nuevo.
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Formato</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead>UdM</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formatos.map((formatoItem) => (
                    <TableRow key={formatoItem.id}>
                      <TableCell className="font-medium">{formatoItem.formato}</TableCell>
                      <TableCell className="text-right">{formatoItem.cantidad}</TableCell>
                      <TableCell>{formatoItem.unidad_medida}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStartEdit(formatoItem)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(formatoItem.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar formato?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el formato "{formatos.find(f => f.id === deleteId)?.formato}". 
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
