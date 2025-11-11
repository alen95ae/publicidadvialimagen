"use client"

import type React from "react"
import Link from "next/link"
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Download,
  Upload,
  Copy
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useState, useEffect } from "react"
import { toast } from "sonner"

interface ManoDeObraItem {
  id: string
  codigo: string
  nombre: string
  responsable: string
  unidad_medida: string
  coste: number
  categoria: string
  cantidad: number
  disponibilidad: string
}

const categorias = [
  "Categoria general",
  "Corte y grabado", 
  "Displays",
  "Impresion digital",
  "Insumos",
  "Mano de obra"
]

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

function getStockBadge(cantidad: number) {
  if (cantidad >= 1) {
    return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{cantidad}</Badge>
  } else {
    return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Agotado</Badge>
  }
}

export default function ManoDeObraPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [openImport, setOpenImport] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async (page: number = currentPage) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.set('q', searchTerm)
      if (selectedCategory) params.set('categoria', selectedCategory)
      params.set('page', page.toString())
      params.set('limit', '25')

      const response = await fetch(`/api/mano-de-obra?${params.toString()}`)
      if (response.ok) {
        const result = await response.json()
        setItems(result.data || [])
        setPagination(result.pagination || pagination)
        setCurrentPage(page)
      } else {
        setItems([])
      }
    } catch (error) {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setCurrentPage(1)
    fetchItems(1)
  }, [searchTerm, selectedCategory])

  const [editedItems, setEditedItems] = useState<Record<string, Partial<ManoDeObraItem>>>({})
  const [savingChanges, setSavingChanges] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<Record<string, Partial<ManoDeObraItem>>>({})

  const filteredItems = items.filter(item => {
    const matchesSearch = searchTerm === "" || 
      item.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.categoria.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "" || item.categoria === selectedCategory
    return matchesSearch && matchesCategory
  })

  const ids = filteredItems.map(i => i.id)
  const allSelected = ids.length > 0 && ids.every(id => selected[id])
  const someSelected = ids.some(id => selected[id]) || allSelected
  const selectedIds = Object.keys(selected).filter(id => selected[id])
  const singleSelected = selectedIds.length === 1

  function toggleAll(checked: boolean) {
    const next: Record<string, boolean> = {}
    ids.forEach(id => { next[id] = checked })
    setSelected(next)
  }

  async function bulkUpdate(patch: any) {
    const ids = Object.keys(selected).filter(id => selected[id])
    try {
      const response = await fetch('/api/mano-de-obra/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action: 'update', data: patch })
      })
      if (response.ok) {
        await fetchItems()
        setSelected({})
      }
    } catch (error) {
    }
  }

  const handleBulkFieldChange = (field: keyof ManoDeObraItem, value: any) => {
    const updates: Record<string, Partial<ManoDeObraItem>> = {}
    Object.keys(selected).filter(id => selected[id]).forEach(id => {
      updates[id] = {
        ...(pendingChanges[id] || {}),
        [field]: value
      }
    })
    setPendingChanges(prev => ({ ...prev, ...updates }))
    toast.info(`Campo ${field} actualizado para ${Object.keys(selected).filter(id => selected[id]).length} item(s)`) 
  }

  const handleSaveBulkChanges = async () => {
    if (Object.keys(pendingChanges).length === 0) return
    setSavingChanges(true)
    try {
      const promises = Object.entries(pendingChanges).map(async ([id, changes]) => {
        const response = await fetch(`/api/mano-de-obra/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(changes)
        })
        if (!response.ok) throw new Error('Error')
        return response
      })
      await Promise.all(promises)
      setPendingChanges({})
      await fetchItems()
      toast.success('Cambios aplicados correctamente')
    } catch (error) {
      toast.error('Error al guardar cambios')
    } finally {
      setSavingChanges(false)
    }
  }

  const handleDiscardChanges = () => {
    setPendingChanges({})
    toast.info("Cambios descartados")
  }

  async function bulkDelete() {
    const ids = Object.keys(selected).filter(id => selected[id])
    if (!confirm(`¿Eliminar ${ids.length} items de mano de obra?`)) return
    try {
      const response = await fetch('/api/mano-de-obra/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action: 'delete' })
      })
      if (response.ok) {
        await fetchItems(currentPage)
        setSelected({})
      }
    } catch (error) {
    }
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.set('q', searchTerm)
      if (selectedCategory) params.set('categoria', selectedCategory)
      const response = await fetch(`/api/mano-de-obra/export?${params.toString()}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `mano_de_obra_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('Error al exportar los datos')
      }
    } catch (error) {
      alert('Error al exportar los datos')
    }
  }

  const handleEdit = (id: string) => {
    setSelected(prev => ({ ...prev, [id]: true }))
  }

  const handleFieldChange = (id: string, field: keyof ManoDeObraItem, value: string | number) => {
    setEditedItems(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }))
  }

  const handleSaveChanges = async (id: string) => {
    if (!editedItems[id]) return
    setSavingChanges(true)
    try {
      const response = await fetch(`/api/mano-de-obra/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedItems[id]),
      })
      if (response.ok) {
        toast.success('Cambios guardados correctamente')
        setEditedItems(prev => {
          const newItems = { ...prev }
          delete newItems[id]
          return newItems
        })
        setSelected(prev => ({ ...prev, [id]: false }))
        fetchItems()
      } else {
        toast.error('Error al guardar cambios')
      }
    } catch (error) {
      toast.error('Error al guardar cambios')
    } finally {
      setSavingChanges(false)
    }
  }

  const handleCancelEdit = (id: string) => {
    setEditedItems(prev => {
      const newItems = { ...prev }
      delete newItems[id]
      return newItems
    })
    setSelected(prev => ({ ...prev, [id]: false }))
  }

  const handleDuplicate = async (id: string) => {
    try {
      const item = items.find(i => i.id === id)
      if (!item) return
      const duplicateItem = { ...item, codigo: `${item.codigo}-COPY`, nombre: `${item.nombre} (Copia)`, id: undefined }
      const response = await fetch('/api/mano-de-obra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicateItem),
      })
      if (response.ok) {
        toast.success('Item duplicado correctamente')
        fetchItems()
      } else {
        toast.error('Error al duplicar item')
      }
    } catch (error) {
      toast.error('Error al duplicar item')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este item?')) return
    try {
      const response = await fetch(`/api/mano-de-obra/${id}`, { method: 'DELETE' })
      if (response.ok) {
        toast.success('Item eliminado correctamente')
        fetchItems()
      } else {
        toast.error('Error al eliminar item')
      }
    } catch (error) {
      toast.error('Error al eliminar item')
    }
  }

  const handleCsvImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setImportLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch('/api/mano-de-obra/import', { method: 'POST', body: formData })
      const result = await response.json()
      if (response.ok) {
        alert(`Importación completada: ${result.created} creados, ${result.updated} actualizados${result.errors > 0 ? `, ${result.errors} errores` : ''}`)
        await fetchItems(currentPage)
        setOpenImport(false)
      } else {
        alert(`Error: ${result.error || 'Error desconocido'}`)
      }
    } catch (error) {
      alert('Error al importar los datos')
    } finally {
      setImportLoading(false)
      event.target.value = ''
    }
  }

  return (
    <div className="p-6">

      <main className="w-full max-w-full px-4 sm:px-6 py-8 overflow-hidden">
        <div className="mb-8">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Filtros y Búsqueda</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por código, nombre o categoría..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filtrar por categoría" />
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
                <div className="flex gap-2 items-center ml-auto">
                  <Button variant="outline" size="sm" onClick={handleExport}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                  <Dialog open={openImport} onOpenChange={setOpenImport}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Importar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Importar mano de obra (CSV)</DialogTitle>
                        <DialogDescription>
                          Columnas: codigo, nombre, descripcion, categoria, cantidad, unidad_medida, coste, responsable, disponibilidad
                          <br/>
                          <a href="/api/mano-de-obra/import/template" className="underline">Descargar plantilla</a>
                        </DialogDescription>
                      </DialogHeader>
                      <input 
                        type="file" 
                        accept=".csv,text/csv" 
                        onChange={handleCsvImport}
                        disabled={importLoading}
                      />
                      {importLoading && <p>Importando...</p>}
                    </DialogContent>
                  </Dialog>
                  <Button className="bg-red-600 hover:bg-red-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Item
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Mano de Obra ({filteredItems.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {someSelected && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-blue-800">
                      {selectedIds.length} item{selectedIds.length > 1 ? 's' : ''} seleccionado{selectedIds.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {Object.keys(pendingChanges).length > 0 && (
                      <>
                        <Button 
                          size="sm" 
                          onClick={handleSaveBulkChanges}
                          disabled={savingChanges}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          {savingChanges ? "Guardando..." : `Guardar cambios (${Object.keys(pendingChanges).length})`}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleDiscardChanges}
                        >
                          Descartar
                        </Button>
                      </>
                    )}
                    {singleSelected && (
                      <Button variant="outline" size="sm" onClick={() => handleDuplicate(selectedIds[0])}>
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicar
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      onClick={bulkDelete}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-center py-8 text-gray-500">Cargando mano de obra...</div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm || selectedCategory ? "No se encontraron items" : "No hay items en mano de obra"}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allSelected ? true : (someSelected ? 'indeterminate' : false)}
                        onCheckedChange={(v) => toggleAll(Boolean(v))}
                        aria-label="Seleccionar todo"
                      />
                    </TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Responsable</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Unidad</TableHead>
                    <TableHead>Coste</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="w-10">
                        <Checkbox
                          checked={!!selected[item.id]}
                          onCheckedChange={(v) =>
                            setSelected(prev => ({ ...prev, [item.id]: Boolean(v) }))
                          }
                          aria-label={`Seleccionar ${item.codigo}`}
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-1 font-mono text-xs text-gray-800 border border-neutral-200">
                          {item.codigo}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[42ch]">
                        {selected[item.id] ? (
                          <Input
                            value={editedItems[item.id]?.nombre ?? item.nombre}
                            onChange={(e) => handleFieldChange(item.id, 'nombre', e.target.value)}
                            className="h-8"
                            onBlur={() => handleSaveChanges(item.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveChanges(item.id)
                              } else if (e.key === 'Escape') {
                                handleCancelEdit(item.id)
                              }
                            }}
                            autoFocus
                          />
                        ) : (
                          <div className="truncate">
                            {item.nombre.length > 30 ? (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <span className="cursor-pointer hover:text-blue-600">
                                    {item.nombre.substring(0, 30)}...
                                  </span>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto max-w-sm">
                                  <p className="text-sm">{item.nombre}</p>
                                </PopoverContent>
                              </Popover>
                            ) : (
                              item.nombre
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {selected[item.id] ? (
                          <Input
                            value={editedItems[item.id]?.responsable ?? item.responsable}
                            onChange={(e) => handleFieldChange(item.id, 'responsable', e.target.value)}
                            className="h-8"
                            onBlur={() => handleSaveChanges(item.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveChanges(item.id)
                              } else if (e.key === 'Escape') {
                                handleCancelEdit(item.id)
                              }
                            }}
                          />
                        ) : (
                          item.responsable
                        )}
                      </TableCell>
                      <TableCell>
                        {selected[item.id] ? (
                          <Select 
                            value={editedItems[item.id]?.categoria ?? item.categoria}
                            onValueChange={(value) => handleFieldChange(item.id, 'categoria', value)}
                          >
                            <SelectTrigger className="h-8 w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {categorias.map((categoria) => (
                                <SelectItem key={categoria} value={categoria}>
                                  {categoria}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="secondary">{item.categoria}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {selected[item.id] ? (
                          <Select 
                            value={editedItems[item.id]?.unidad_medida ?? item.unidad_medida}
                            onValueChange={(value) => handleFieldChange(item.id, 'unidad_medida', value)}
                          >
                            <SelectTrigger className="h-8 w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {unidadesMedida.map((unidad) => (
                                <SelectItem key={unidad} value={unidad}>
                                  {unidad}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-200 text-gray-800 hover:bg-gray-200">
                            {item.unidad_medida}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {selected[item.id] ? (
                          <div className="flex items-center">
                            <span className="text-sm text-gray-500 mr-1">Bs</span>
                            <Input
                              type="number"
                              step="0.01"
                              value={editedItems[item.id]?.coste ?? item.coste}
                              onChange={(e) => handleFieldChange(item.id, 'coste', parseFloat(e.target.value) || 0)}
                              className="h-8 w-20"
                              onBlur={() => handleSaveChanges(item.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveChanges(item.id)
                                } else if (e.key === 'Escape') {
                                  handleCancelEdit(item.id)
                                }
                              }}
                            />
                          </div>
                        ) : (
                          `Bs ${item.coste.toFixed(2)}`
                        )}
                      </TableCell>
                      <TableCell>
                        {selected[item.id] ? (
                          <Select 
                            value={editedItems[item.id]?.disponibilidad ?? item.disponibilidad}
                            onValueChange={(value) => handleFieldChange(item.id, 'disponibilidad', value)}
                          >
                            <SelectTrigger className="h-8 w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Disponible">Disponible</SelectItem>
                              <SelectItem value="Agotado">Agotado</SelectItem>
                              <SelectItem value="Reservado">Reservado</SelectItem>
                              <SelectItem value="No disponible">No disponible</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          getStockBadge(item.cantidad)
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="Editar"
                            onClick={() => handleEdit(item.id)}
                            className="text-gray-600 hover:text-gray-800 hover:bg-gray-200"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="Eliminar"
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}


