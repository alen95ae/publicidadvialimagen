"use client"

import type React from "react"
import Link from "next/link"
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  MoreHorizontal,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  Copy
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

// Tipo para los items de insumos
interface InsumoItem {
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


// Datos de ejemplo para los insumos
const insumosItems = [
  {
    id: 1,
    codigo: "INS-001",
    nombre: "Tornillos Anclaje M8",
    responsable: "Ana Martínez",
    unidad_medida: "kg",
    coste: 12.50,
    categoria: "Insumos",
    cantidad: 150,
    disponibilidad: "Disponible",
  },
  {
    id: 2,
    codigo: "INS-002", 
    nombre: "Pintura Acrílica Blanca",
    responsable: "Carlos López",
    unidad_medida: "litro",
    coste: 25.00,
    categoria: "Insumos",
    cantidad: 45,
    disponibilidad: "Disponible"
  },
  {
    id: 3,
    codigo: "INS-003",
    nombre: "Vinilo Adhesivo Transparente",
    responsable: "María García",
    unidad_medida: "m²",
    coste: 8.50,
    categoria: "Insumos",
    cantidad: 0,
    disponibilidad: "Agotado"
  },
  {
    id: 4,
    codigo: "INS-004",
    nombre: "Cables Eléctricos 2.5mm",
    responsable: "Pedro Ruiz",
    unidad_medida: "metro",
    coste: 3.20,
    categoria: "Insumos",
    cantidad: 200,
    disponibilidad: "Disponible"
  },
  {
    id: 5,
    codigo: "INS-005",
    nombre: "Tornillos Phillips 3x20",
    responsable: "Laura Sánchez",
    unidad_medida: "pieza",
    coste: 0.15,
    categoria: "Insumos",
    cantidad: 500,
    disponibilidad: "Disponible"
  },
  {
    id: 6,
    codigo: "INS-006",
    nombre: "Pegamento Industrial",
    responsable: "Juan Pérez",
    unidad_medida: "litro",
    coste: 18.00,
    categoria: "Insumos",
    cantidad: 12,
    disponibilidad: "Bajo Stock"
  }
]

function getStockBadge(cantidad: number) {
  if (cantidad >= 1) {
    return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{cantidad}</Badge>
  } else {
    return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Agotado</Badge>
  }
}


export default function InsumosPage() {
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

  // Cargar datos de la API al inicializar
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
      
      console.log('Fetching insumos from:', `/api/insumos?${params.toString()}`)
      const response = await fetch(`/api/insumos?${params.toString()}`)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Received data:', result)
        setItems(result.data || [])
        setPagination(result.pagination || pagination)
        setCurrentPage(page)
      } else {
        const errorData = await response.json()
        console.error('Error al cargar insumos:', errorData)
        setItems([])
      }
    } catch (error) {
      console.error('Error de conexión:', error)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  // Recargar datos cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1)
    fetchItems(1)
  }, [searchTerm, selectedCategory])
  
  // Estados para edición masiva
  const [nombreDraft, setNombreDraft] = useState("")
  const [responsableDraft, setResponsableDraft] = useState("")
  const [costeDraft, setCosteDraft] = useState("")
  const [categoriaDraft, setCategoriaDraft] = useState<string | undefined>(undefined)
  const [cantidadDraft, setCantidadDraft] = useState("")
  const [disponibilidadDraft, setDisponibilidadDraft] = useState<string | undefined>(undefined)
  const [unidadDraft, setUnidadDraft] = useState("")
  
  // Estados para controlar popovers
  const [nombreOpen, setNombreOpen] = useState(false)
  const [responsableOpen, setResponsableOpen] = useState(false)
  const [costeOpen, setCosteOpen] = useState(false)
  const [categoriaOpen, setCategoriaOpen] = useState(false)
  const [cantidadOpen, setCantidadOpen] = useState(false)
  const [disponibilidadOpen, setDisponibilidadOpen] = useState(false)
  const [unidadOpen, setUnidadOpen] = useState(false)
  
  // Estados para edición en línea
  const [editedItems, setEditedItems] = useState<Record<string, Partial<InsumoItem>>>({})
  const [savingChanges, setSavingChanges] = useState(false)
  
  // Estados para cambios masivos pendientes
  const [pendingChanges, setPendingChanges] = useState<Record<string, Partial<InsumoItem>>>({})
  
  // Estados para acciones masivas
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [bulkAction, setBulkAction] = useState<string>("")
  const [bulkValue, setBulkValue] = useState<string>("")

  // Filtrar items basado en búsqueda y categoría
  const filteredItems = items.filter(item => {
    const matchesSearch = searchTerm === "" || 
      item.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.categoria.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = selectedCategory === "" || item.categoria === selectedCategory
    
    return matchesSearch && matchesCategory
  })


  // Funciones para edición masiva
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
      const response = await fetch('/api/insumos/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action: 'update', data: patch })
      })

      if (response.ok) {
        // Recargar los datos después de la actualización
        await fetchItems()
        setSelected({})
        
        // Limpiar los drafts
        setNombreDraft('')
        setResponsableDraft('')
        setCosteDraft('')
        setCategoriaDraft(undefined)
        setCantidadDraft('')
        setDisponibilidadDraft(undefined)
        setUnidadDraft('')
      } else {
        console.error('Error al actualizar items')
      }
    } catch (error) {
      console.error('Error de conexión:', error)
    }
  }

  // Aplicar cambio masivo a seleccionados (versión pendiente)
  const handleBulkFieldChange = (field: keyof InsumoItem, value: any) => {
    const updates: Record<string, Partial<InsumoItem>> = {}
    Object.keys(selected).filter(id => selected[id]).forEach(id => {
      updates[id] = {
        ...(pendingChanges[id] || {}),
        [field]: value
      }
    })
    setPendingChanges(prev => ({ ...prev, ...updates }))
    toast.info(`Campo ${field} actualizado para ${Object.keys(selected).filter(id => selected[id]).length} item(s)`)
  }

  // Guardar cambios pendientes masivos
  const handleSaveBulkChanges = async () => {
    if (Object.keys(pendingChanges).length === 0) return

    setSavingChanges(true)
    try {
      const count = Object.keys(pendingChanges).length
      const promises = Object.entries(pendingChanges).map(async ([id, changes]) => {
        const response = await fetch(`/api/insumos/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(changes)
        })
        if (!response.ok) {
          throw new Error(`Error actualizando item ${id}`)
        }
        return response
      })

      await Promise.all(promises)
      setPendingChanges({})
      await fetchItems()
      toast.success(`${count} item(s) actualizado(s) correctamente`)
    } catch (error) {
      console.error('Error guardando cambios:', error)
      toast.error('Error al guardar cambios')
    } finally {
      setSavingChanges(false)
    }
  }

  // Descartar cambios pendientes
  const handleDiscardChanges = () => {
    setPendingChanges({})
    toast.info("Cambios descartados")
  }

  async function bulkDelete() {
    const ids = Object.keys(selected).filter(id => selected[id])
    if (!confirm(`¿Eliminar ${ids.length} items de insumos?`)) return
    
    try {
      const response = await fetch('/api/insumos/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action: 'delete' })
      })

      if (response.ok) {
        await fetchItems(currentPage)
        setSelected({})
      } else {
        console.error('Error al eliminar items')
      }
    } catch (error) {
      console.error('Error de conexión:', error)
    }
  }

  // Función para exportar datos
  const handleExport = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.set('q', searchTerm)
      if (selectedCategory) params.set('categoria', selectedCategory)
      
      const response = await fetch(`/api/insumos/export?${params.toString()}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `insumos_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('Error al exportar los datos')
      }
    } catch (error) {
      console.error('Error al exportar:', error)
      alert('Error al exportar los datos')
    }
  }

  // Funciones de paginación
  const handlePageChange = (page: number) => {
    fetchItems(page)
  }

  const handlePrevPage = () => {
    if (pagination.hasPrev) {
      handlePageChange(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (pagination.hasNext) {
      handlePageChange(currentPage + 1)
    }
  }

  const handleEdit = (id: string) => {
    // Activar edición en línea para el item
    setSelected(prev => ({ ...prev, [id]: true }))
  }

  const handleFieldChange = (id: string, field: keyof InsumoItem, value: string | number) => {
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
      const response = await fetch(`/api/insumos/${id}`, {
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
      console.error('Error saving changes:', error)
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

  // Funciones para acciones masivas
  const selectedItems = Object.keys(selected).filter(id => selected[id])
  const selectedCount = selectedItems.length

  const handleBulkAction = async () => {
    if (!bulkAction || selectedCount === 0) return

    try {
      const updates = selectedItems.map(id => ({
        id,
        [bulkAction]: bulkValue
      }))

      const response = await fetch('/api/insumos/bulk', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates }),
      })

      if (response.ok) {
        toast.success(`${selectedCount} items actualizados correctamente`)
        setSelected({})
        setShowBulkActions(false)
        setBulkAction("")
        setBulkValue("")
        fetchItems()
      } else {
        toast.error('Error al actualizar items')
      }
    } catch (error) {
      console.error('Error updating items:', error)
      toast.error('Error al actualizar items')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedCount === 0) return
    if (!confirm(`¿Estás seguro de que quieres eliminar ${selectedCount} items?`)) return

    try {
      const response = await fetch('/api/insumos/bulk', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: selectedItems }),
      })

      if (response.ok) {
        toast.success(`${selectedCount} items eliminados correctamente`)
        setSelected({})
        setShowBulkActions(false)
        fetchItems()
      } else {
        toast.error('Error al eliminar items')
      }
    } catch (error) {
      console.error('Error deleting items:', error)
      toast.error('Error al eliminar items')
    }
  }

  const handleDuplicate = async (id: string) => {
    try {
      const item = items.find(i => i.id === id)
      if (!item) return

      const duplicateItem = {
        ...item,
        codigo: `${item.codigo}-COPY`,
        nombre: `${item.nombre} (Copia)`,
        id: undefined
      }

      const response = await fetch('/api/insumos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(duplicateItem),
      })

      if (response.ok) {
        toast.success('Item duplicado correctamente')
        fetchItems()
      } else {
        toast.error('Error al duplicar item')
      }
    } catch (error) {
      console.error('Error duplicating item:', error)
      toast.error('Error al duplicar item')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este item?')) return
    
    try {
      const response = await fetch(`/api/insumos/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Item eliminado correctamente')
        fetchItems()
      } else {
        toast.error('Error al eliminar item')
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      toast.error('Error al eliminar item')
    }
  }

  // Función para manejar la importación de CSV
  const handleCsvImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    console.log('Iniciando importación de CSV:', file.name, file.size)
    setImportLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/insumos/import', {
        method: 'POST',
        body: formData
      })

      console.log('Respuesta del servidor:', response.status, response.statusText)
      const result = await response.json()
      console.log('Resultado:', result)
      
      if (response.ok) {
        alert(`Importación completada: ${result.created} creados, ${result.updated} actualizados${result.errors > 0 ? `, ${result.errors} errores` : ''}`)
        if (result.errorMessages && result.errorMessages.length > 0) {
          console.log('Errores detallados:', result.errorMessages)
          alert(`Errores encontrados:\n${result.errorMessages.slice(0, 5).join('\n')}`)
        }
        await fetchItems(currentPage)
        setOpenImport(false)
      } else {
        console.error('Error en la respuesta:', result)
        alert(`Error: ${result.error || 'Error desconocido'}`)
      }
    } catch (error) {
      console.error('Error al importar:', error)
      alert(`Error al importar el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setImportLoading(false)
      // Limpiar el input
      event.target.value = ''
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-xl font-bold text-slate-800">Inventario</div>
            <div className="flex items-center gap-6 ml-4">
              <Link 
                href="/panel/inventario" 
                className="text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
              >
                Productos
              </Link>
              <Link 
                href="/panel/insumos" 
                className="text-sm font-medium text-[#D54644] hover:text-[#D54644]/80 transition-colors"
              >
                Insumos
              </Link>
              <Link 
                href="/panel/mano-de-obra" 
                className="text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
              >
                Mano de Obra
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Buscar</span>
            <span className="text-gray-800 font-medium">admin</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-full px-4 sm:px-6 py-8 overflow-hidden">
        <div className="mb-8">
          {/* Filtros y búsqueda */}
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
                
                {/* Botones de acciones - completamente a la derecha */}
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
                        <DialogTitle>Importar insumos (CSV)</DialogTitle>
                        <DialogDescription>
                          Columnas: codigo, nombre, descripcion, categoria, cantidad, unidad_medida, coste, precio_venta, responsable, disponibilidad
                          <br/>
                          <a href="/api/insumos/import/template" className="underline">Descargar plantilla</a>
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

        {/* Tabla de insumos */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Insumos ({filteredItems.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Barra azul unificada de acciones masivas */}
            {someSelected && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-blue-800">
                      {selectedIds.length} item{selectedIds.length > 1 ? 's' : ''} seleccionado{selectedIds.length > 1 ? 's' : ''}
                    </span>
                    
                    {/* Solo mostrar desplegables cuando hay más de 1 seleccionado */}
                    {!singleSelected && selectedIds.length > 1 && (
                      <>
                        {/* Cambiar categoría */}
                        <Select onValueChange={(value) => handleBulkFieldChange('categoria', value)}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Cambiar categoría" />
                          </SelectTrigger>
                          <SelectContent>
                            {categorias.map((categoria) => (
                              <SelectItem key={categoria} value={categoria}>
                                {categoria}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Cambiar cantidad */}
                        <Input
                          placeholder="Nueva cantidad"
                          type="number"
                          min="0"
                          value={cantidadDraft}
                          onChange={(e) => setCantidadDraft(e.target.value)}
                          onBlur={() => {
                            if (cantidadDraft) {
                              handleBulkFieldChange('cantidad', parseInt(cantidadDraft) || 0)
                              setCantidadDraft('')
                            }
                          }}
                          className="w-32"
                        />

                        {/* Cambiar unidad */}
                        <Select onValueChange={(value) => handleBulkFieldChange('unidad_medida', value)}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Cambiar unidad" />
                          </SelectTrigger>
                          <SelectContent>
                            {unidadesMedida.map((unidad) => (
                              <SelectItem key={unidad} value={unidad}>
                                {unidad}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </>
                    )}
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
                    
                    {/* Solo mostrar duplicar cuando hay 1 seleccionado */}
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
              <div className="text-center py-8 text-gray-500">Cargando insumos...</div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm || selectedCategory ? "No se encontraron items" : "No hay items en los insumos"}
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


        {/* Paginación */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handlePrevPage}
                disabled={!pagination.hasPrev || loading}
              >
                Anterior
              </Button>
              
              {/* Mostrar páginas */}
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    disabled={loading}
                    className={currentPage === pageNum ? "bg-[#D54644] text-white hover:bg-[#B73E3A]" : ""}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleNextPage}
                disabled={!pagination.hasNext || loading}
              >
                Siguiente
              </Button>
            </div>
            
            {/* Información de paginación */}
            <div className="ml-4 text-sm text-gray-600">
              Mostrando {((currentPage - 1) * 25) + 1} - {Math.min(currentPage * 25, pagination.total)} de {pagination.total} items
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
