"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Edit, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { useCategorias } from "@/hooks/use-categorias"

interface AjustesProductosModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AjustesProductosModal({ open, onOpenChange }: AjustesProductosModalProps) {
  // Categorías de productos
  const { categorias: categoriasProductos, loading: loadingCategorias, error: errorCategorias, updateCategorias: updateCategoriasProductos, refetch: refetchCategorias } = useCategorias("Inventario", "Productos")
  const [localCategorias, setLocalCategorias] = useState<string[]>([])
  const [editingCategoriaIndex, setEditingCategoriaIndex] = useState<number | null>(null)
  const [editCategoriaValue, setEditCategoriaValue] = useState("")
  const [newCategoria, setNewCategoria] = useState("")
  const [savingCategorias, setSavingCategorias] = useState(false)
  const [deleteCategoriaIndex, setDeleteCategoriaIndex] = useState<number | null>(null)

  // Unidades de medida
  const { categorias: unidadesMedida, loading: loadingUnidades, error: errorUnidades, updateCategorias: updateUnidades, refetch: refetchUnidades } = useCategorias("Inventario", "Productos_unidades")
  const [localUnidades, setLocalUnidades] = useState<string[]>([])
  const [editingUnidadIndex, setEditingUnidadIndex] = useState<number | null>(null)
  const [editUnidadValue, setEditUnidadValue] = useState("")
  const [newUnidad, setNewUnidad] = useState("")
  const [savingUnidades, setSavingUnidades] = useState(false)
  const [deleteUnidadIndex, setDeleteUnidadIndex] = useState<number | null>(null)

  // Sincronizar categorías cuando se cargan
  useEffect(() => {
    if (categoriasProductos.length > 0) {
      setLocalCategorias([...categoriasProductos])
    } else if (!loadingCategorias && categoriasProductos.length === 0) {
      setLocalCategorias([])
    }
  }, [categoriasProductos, loadingCategorias])

  // Sincronizar unidades cuando se cargan
  useEffect(() => {
    if (unidadesMedida.length > 0) {
      setLocalUnidades([...unidadesMedida])
    } else if (!loadingUnidades && unidadesMedida.length === 0) {
      setLocalUnidades([])
    }
  }, [unidadesMedida, loadingUnidades])

  // Resetear al abrir/cerrar
  useEffect(() => {
    if (open) {
      refetchCategorias()
      refetchUnidades()
      setEditingCategoriaIndex(null)
      setEditCategoriaValue("")
      setNewCategoria("")
      setDeleteCategoriaIndex(null)
      setEditingUnidadIndex(null)
      setEditUnidadValue("")
      setNewUnidad("")
      setDeleteUnidadIndex(null)
    }
  }, [open, refetchCategorias, refetchUnidades])

  // Funciones para categorías
  const handleAddCategoria = () => {
    const trimmed = newCategoria.trim()
    
    if (!trimmed) {
      toast.error("La categoría no puede estar vacía")
      return
    }

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

  const handleStartEditCategoria = (index: number) => {
    setEditingCategoriaIndex(index)
    setEditCategoriaValue(localCategorias[index])
  }

  const handleSaveEditCategoria = () => {
    if (editingCategoriaIndex === null) return

    const trimmed = editCategoriaValue.trim()

    if (!trimmed) {
      toast.error("La categoría no puede estar vacía")
      return
    }

    const exists = localCategorias.some(
      (cat, idx) => idx !== editingCategoriaIndex && cat.toLowerCase().trim() === trimmed.toLowerCase()
    )

    if (exists) {
      toast.error("Esta categoría ya existe")
      return
    }

    const updated = [...localCategorias]
    updated[editingCategoriaIndex] = trimmed
    setLocalCategorias(updated)
    setEditingCategoriaIndex(null)
    setEditCategoriaValue("")
  }

  const handleCancelEditCategoria = () => {
    setEditingCategoriaIndex(null)
    setEditCategoriaValue("")
  }

  const handleDeleteCategoria = (index: number) => {
    if (localCategorias.length <= 1) {
      toast.error("Debe existir al menos una categoría")
      return
    }
    setDeleteCategoriaIndex(index)
  }

  const confirmDeleteCategoria = () => {
    if (deleteCategoriaIndex === null) return

    if (localCategorias.length <= 1) {
      toast.error("Debe existir al menos una categoría")
      setDeleteCategoriaIndex(null)
      return
    }

    const updated = localCategorias.filter((_, idx) => idx !== deleteCategoriaIndex)
    setLocalCategorias(updated)
    setDeleteCategoriaIndex(null)
  }

  const handleSaveCategorias = async () => {
    if (localCategorias.length === 0) {
      toast.error("Debe existir al menos una categoría")
      return
    }

    const hasEmpty = localCategorias.some(cat => !cat.trim())
    if (hasEmpty) {
      toast.error("No se permiten categorías vacías")
      return
    }

    setSavingCategorias(true)
    try {
      const success = await updateCategoriasProductos(localCategorias)
      
      if (success) {
        toast.success("Categorías actualizadas correctamente")
        await refetchCategorias()
      } else {
        toast.error("Error al actualizar las categorías")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setSavingCategorias(false)
    }
  }

  // Funciones para unidades
  const handleAddUnidad = () => {
    const trimmed = newUnidad.trim()
    
    if (!trimmed) {
      toast.error("La unidad no puede estar vacía")
      return
    }

    const exists = localUnidades.some(
      unidad => unidad.toLowerCase().trim() === trimmed.toLowerCase()
    )

    if (exists) {
      toast.error("Esta unidad ya existe")
      return
    }

    setLocalUnidades([...localUnidades, trimmed])
    setNewUnidad("")
  }

  const handleStartEditUnidad = (index: number) => {
    setEditingUnidadIndex(index)
    setEditUnidadValue(localUnidades[index])
  }

  const handleSaveEditUnidad = () => {
    if (editingUnidadIndex === null) return

    const trimmed = editUnidadValue.trim()

    if (!trimmed) {
      toast.error("La unidad no puede estar vacía")
      return
    }

    const exists = localUnidades.some(
      (unidad, idx) => idx !== editingUnidadIndex && unidad.toLowerCase().trim() === trimmed.toLowerCase()
    )

    if (exists) {
      toast.error("Esta unidad ya existe")
      return
    }

    const updated = [...localUnidades]
    updated[editingUnidadIndex] = trimmed
    setLocalUnidades(updated)
    setEditingUnidadIndex(null)
    setEditUnidadValue("")
  }

  const handleCancelEditUnidad = () => {
    setEditingUnidadIndex(null)
    setEditUnidadValue("")
  }

  const handleDeleteUnidad = (index: number) => {
    if (localUnidades.length <= 1) {
      toast.error("Debe existir al menos una unidad")
      return
    }
    setDeleteUnidadIndex(index)
  }

  const confirmDeleteUnidad = () => {
    if (deleteUnidadIndex === null) return

    if (localUnidades.length <= 1) {
      toast.error("Debe existir al menos una unidad")
      setDeleteUnidadIndex(null)
      return
    }

    const updated = localUnidades.filter((_, idx) => idx !== deleteUnidadIndex)
    setLocalUnidades(updated)
    setDeleteUnidadIndex(null)
  }

  const handleSaveUnidades = async () => {
    if (localUnidades.length === 0) {
      toast.error("Debe existir al menos una unidad")
      return
    }

    const hasEmpty = localUnidades.some(unidad => !unidad.trim())
    if (hasEmpty) {
      toast.error("No se permiten unidades vacías")
      return
    }

    setSavingUnidades(true)
    try {
      const success = await updateUnidades(localUnidades)
      
      if (success) {
        toast.success("Unidades actualizadas correctamente")
        await refetchUnidades()
      } else {
        toast.error("Error al actualizar las unidades")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setSavingUnidades(false)
    }
  }

  const handleSaveAll = async () => {
    // Validar categorías
    if (localCategorias.length === 0) {
      toast.error("Debe existir al menos una categoría")
      return
    }

    const hasEmptyCategorias = localCategorias.some(cat => !cat.trim())
    if (hasEmptyCategorias) {
      toast.error("No se permiten categorías vacías")
      return
    }

    // Validar unidades
    if (localUnidades.length === 0) {
      toast.error("Debe existir al menos una unidad")
      return
    }

    const hasEmptyUnidades = localUnidades.some(unidad => !unidad.trim())
    if (hasEmptyUnidades) {
      toast.error("No se permiten unidades vacías")
      return
    }

    setSavingCategorias(true)
    setSavingUnidades(true)
    
    try {
      const [categoriasSuccess, unidadesSuccess] = await Promise.all([
        updateCategoriasProductos(localCategorias),
        updateUnidades(localUnidades)
      ])
      
      if (categoriasSuccess && unidadesSuccess) {
        toast.success("Cambios guardados correctamente")
        await Promise.all([refetchCategorias(), refetchUnidades()])
        onOpenChange(false)
      } else {
        toast.error("Error al guardar algunos cambios")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setSavingCategorias(false)
      setSavingUnidades(false)
    }
  }

  const handleCancel = () => {
    if (categoriasProductos.length > 0) {
      setLocalCategorias([...categoriasProductos])
    } else {
      setLocalCategorias([])
    }
    if (unidadesMedida.length > 0) {
      setLocalUnidades([...unidadesMedida])
    } else {
      setLocalUnidades([])
    }
    setEditingCategoriaIndex(null)
    setEditCategoriaValue("")
    setNewCategoria("")
    setEditingUnidadIndex(null)
    setEditUnidadValue("")
    setNewUnidad("")
    onOpenChange(false)
  }

  const renderLista = (
    items: string[],
    editingIndex: number | null,
    editValue: string,
    newValue: string,
    onAdd: () => void,
    onStartEdit: (index: number) => void,
    onSaveEdit: () => void,
    onCancelEdit: () => void,
    onDelete: (index: number) => void,
    setNewValue: (value: string) => void,
    setEditValue: (value: string) => void,
    label: string
  ) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Agregar Nueva {label}</Label>
        <div className="flex gap-2">
          <Input
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                onAdd()
              }
            }}
            placeholder={`Nombre de la ${label.toLowerCase()}`}
          />
          <Button onClick={onAdd} type="button" className="bg-[#D54644] hover:bg-[#B03A38] text-white">
            <Plus className="h-4 w-4 mr-2" />
            Agregar
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>{label}s Configuradas ({items.length})</Label>
        {items.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">
            No hay {label.toLowerCase()}s configuradas. Agrega al menos una.
          </p>
        ) : (
          <div className="border rounded-md divide-y">
            {items.map((item, index) => (
              <div key={index} className="p-3 flex items-center justify-between hover:bg-gray-50">
                {editingIndex === index ? (
                  <div className="flex-1 flex items-center gap-2">
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          onSaveEdit()
                        } else if (e.key === 'Escape') {
                          onCancelEdit()
                        }
                      }}
                      className="flex-1"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={onSaveEdit}
                      variant="outline"
                    >
                      Guardar
                    </Button>
                    <Button
                      size="sm"
                      onClick={onCancelEdit}
                      variant="ghost"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1">{item}</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onStartEdit(index)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(index)}
                        className="text-red-600 hover:text-red-700"
                        disabled={items.length <= 1}
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
  )

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajustes de Productos</DialogTitle>
            <DialogDescription>
              Administra las categorías y unidades de medida disponibles para los productos.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="categorias" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="categorias">Categorías</TabsTrigger>
              <TabsTrigger value="unidades">Unidades de Medida</TabsTrigger>
            </TabsList>

            <TabsContent value="categorias" className="space-y-4">
              {loadingCategorias && (
                <div className="py-8 text-center text-gray-500">
                  Cargando categorías...
                </div>
              )}

              {errorCategorias && (
                <div className="py-4 px-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">Error: {errorCategorias}</p>
                </div>
              )}

              {!loadingCategorias && !errorCategorias && renderLista(
                localCategorias,
                editingCategoriaIndex,
                editCategoriaValue,
                newCategoria,
                handleAddCategoria,
                handleStartEditCategoria,
                handleSaveEditCategoria,
                handleCancelEditCategoria,
                handleDeleteCategoria,
                setNewCategoria,
                setEditCategoriaValue,
                "Categoría"
              )}
            </TabsContent>

            <TabsContent value="unidades" className="space-y-4">
              {loadingUnidades && (
                <div className="py-8 text-center text-gray-500">
                  Cargando unidades...
                </div>
              )}

              {errorUnidades && (
                <div className="py-4 px-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">Error: {errorUnidades}</p>
                </div>
              )}

              {!loadingUnidades && !errorUnidades && renderLista(
                localUnidades,
                editingUnidadIndex,
                editUnidadValue,
                newUnidad,
                handleAddUnidad,
                handleStartEditUnidad,
                handleSaveEditUnidad,
                handleCancelEditUnidad,
                handleDeleteUnidad,
                setNewUnidad,
                setEditUnidadValue,
                "Unidad"
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel} disabled={savingCategorias || savingUnidades}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveAll} 
              disabled={savingCategorias || savingUnidades || loadingCategorias || loadingUnidades || localCategorias.length === 0 || localUnidades.length === 0}
              className="bg-[#D54644] hover:bg-[#B03A38] text-white"
            >
              {savingCategorias || savingUnidades ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteCategoriaIndex !== null} onOpenChange={(open) => !open && setDeleteCategoriaIndex(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la categoría "{localCategorias[deleteCategoriaIndex ?? -1]}". 
              Los productos que usen esta categoría no se verán afectados, pero deberás actualizar su categoría manualmente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCategoria} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteUnidadIndex !== null} onOpenChange={(open) => !open && setDeleteUnidadIndex(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar unidad?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la unidad "{localUnidades[deleteUnidadIndex ?? -1]}". 
              Los productos que usen esta unidad no se verán afectados, pero deberás actualizar su unidad manualmente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteUnidad} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
