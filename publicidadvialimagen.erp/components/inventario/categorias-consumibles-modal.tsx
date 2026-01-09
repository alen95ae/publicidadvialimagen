"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Plus, Edit, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { useCategorias } from "@/hooks/use-categorias"

interface CategoriasConsumiblesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CategoriasConsumiblesModal({ open, onOpenChange }: CategoriasConsumiblesModalProps) {
  const { categorias, loading, error, updateCategorias, refetch } = useCategorias("Inventario", "Consumibles")
  const [localCategorias, setLocalCategorias] = useState<string[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editValue, setEditValue] = useState("")
  const [newCategoria, setNewCategoria] = useState("")
  const [saving, setSaving] = useState(false)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)

  // Sincronizar categorías cuando se cargan
  useEffect(() => {
    if (categorias.length > 0) {
      setLocalCategorias([...categorias])
    } else if (!loading && categorias.length === 0) {
      setLocalCategorias([])
    }
  }, [categorias, loading])

  // Resetear al abrir/cerrar
  useEffect(() => {
    if (open) {
      refetch()
      setEditingIndex(null)
      setEditValue("")
      setNewCategoria("")
      setDeleteIndex(null)
    }
  }, [open, refetch])

  const handleAdd = () => {
    const trimmed = newCategoria.trim()
    
    if (!trimmed) {
      toast.error("La categoría no puede estar vacía")
      return
    }

    // Validar duplicados (case-insensitive)
    const exists = localCategorias.some(
      cat => cat.toLowerCase().trim() === trimmed.toLowerCase()
    )

    if (exists) {
      toast.error("Esta categoría ya existe")
      return
    }

    setLocalCategorias([...localCategorias, trimmed])
    setNewCategoria("")
  }

  const handleStartEdit = (index: number) => {
    setEditingIndex(index)
    setEditValue(localCategorias[index])
  }

  const handleSaveEdit = () => {
    if (editingIndex === null) return

    const trimmed = editValue.trim()

    if (!trimmed) {
      toast.error("La categoría no puede estar vacía")
      return
    }

    // Validar duplicados (case-insensitive, excluyendo el índice actual)
    const exists = localCategorias.some(
      (cat, idx) => idx !== editingIndex && cat.toLowerCase().trim() === trimmed.toLowerCase()
    )

    if (exists) {
      toast.error("Esta categoría ya existe")
      return
    }

    const updated = [...localCategorias]
    updated[editingIndex] = trimmed
    setLocalCategorias(updated)
    setEditingIndex(null)
    setEditValue("")
  }

  const handleCancelEdit = () => {
    setEditingIndex(null)
    setEditValue("")
  }

  const handleDelete = (index: number) => {
    if (localCategorias.length <= 1) {
      toast.error("Debe existir al menos una categoría")
      return
    }
    setDeleteIndex(index)
  }

  const confirmDelete = () => {
    if (deleteIndex === null) return

    if (localCategorias.length <= 1) {
      toast.error("Debe existir al menos una categoría")
      setDeleteIndex(null)
      return
    }

    const updated = localCategorias.filter((_, idx) => idx !== deleteIndex)
    setLocalCategorias(updated)
    setDeleteIndex(null)
  }

  const handleSave = async () => {
    if (localCategorias.length === 0) {
      toast.error("Debe existir al menos una categoría")
      return
    }

    // Validar que no haya categorías vacías
    const hasEmpty = localCategorias.some(cat => !cat.trim())
    if (hasEmpty) {
      toast.error("No se permiten categorías vacías")
      return
    }

    setSaving(true)
    try {
      const success = await updateCategorias(localCategorias)
      
      if (success) {
        toast.success("Categorías actualizadas correctamente")
        await refetch()
        onOpenChange(false)
      } else {
        toast.error("Error al actualizar las categorías")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    // Restaurar categorías originales
    if (categorias.length > 0) {
      setLocalCategorias([...categorias])
    } else {
      setLocalCategorias([])
    }
    setEditingIndex(null)
    setEditValue("")
    setNewCategoria("")
    onOpenChange(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gestionar Categorías de Consumibles</DialogTitle>
            <DialogDescription>
              Administra las categorías disponibles para los consumibles. Debe existir al menos una categoría.
            </DialogDescription>
          </DialogHeader>

          {loading && (
            <div className="py-8 text-center text-gray-500">
              Cargando categorías...
            </div>
          )}

          {error && (
            <div className="py-4 px-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">Error: {error}</p>
            </div>
          )}

          {!loading && !error && (
            <div className="space-y-4">
              {/* Agregar nueva categoría */}
              <div className="space-y-2">
                <Label>Agregar Nueva Categoría</Label>
                <div className="flex gap-2">
                  <Input
                    value={newCategoria}
                    onChange={(e) => setNewCategoria(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAdd()
                      }
                    }}
                    placeholder="Nombre de la categoría"
                  />
                  <Button onClick={handleAdd} type="button" className="bg-[#D54644] hover:bg-[#B03A38] text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar
                  </Button>
                </div>
              </div>

              {/* Lista de categorías */}
              <div className="space-y-2">
                <Label>Categorías Configuradas ({localCategorias.length})</Label>
                {localCategorias.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4 text-center">
                    No hay categorías configuradas. Agrega al menos una.
                  </p>
                ) : (
                  <div className="border rounded-md divide-y">
                    {localCategorias.map((categoria, index) => (
                      <div key={index} className="p-3 flex items-center justify-between hover:bg-gray-50">
                        {editingIndex === index ? (
                          <div className="flex-1 flex items-center gap-2">
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  handleSaveEdit()
                                } else if (e.key === 'Escape') {
                                  handleCancelEdit()
                                }
                              }}
                              className="flex-1"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              onClick={handleSaveEdit}
                              variant="outline"
                            >
                              Guardar
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleCancelEdit}
                              variant="ghost"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <span className="flex-1">{categoria}</span>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleStartEdit(index)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(index)}
                                className="text-red-600 hover:text-red-700"
                                disabled={localCategorias.length <= 1}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || loading || localCategorias.length === 0} className="bg-[#D54644] hover:bg-[#B03A38] text-white">
              {saving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteIndex !== null} onOpenChange={(open) => !open && setDeleteIndex(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la categoría "{localCategorias[deleteIndex ?? -1]}". 
              Los consumibles que usen esta categoría no se verán afectados, pero deberás actualizar su categoría manualmente.
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
