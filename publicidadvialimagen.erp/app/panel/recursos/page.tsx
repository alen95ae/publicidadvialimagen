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
  CheckCircle,
  XCircle,
  Copy,
  X,
  Download
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { UNIDADES_MEDIDA_AIRTABLE } from "@/lib/constants"
import { usePermisosContext } from "@/hooks/permisos-provider"
import { normalizeText } from "@/lib/utils"
import { AjustesRecursosModal } from "@/components/inventario/ajustes-recursos-modal"
import { FormatosRecursosModal } from "@/components/inventario/formatos-recursos-modal"
import { useCategorias } from "@/hooks/use-categorias"
import { Settings, PillBottle } from "lucide-react"

// Tipo para los items de recursos
interface RecursoItem {
  id: string
  codigo: string
  nombre: string
  responsable: string
  unidad_medida: string
  formato?: { formato: string; cantidad: number; unidad_medida: string } | null
  coste: number
  categoria: string
  cantidad: number
  disponibilidad: string
  imagen_portada?: string
}

// Categorías se cargan dinámicamente desde la BD


// Datos de ejemplo para los recursos
const recursosItems = [
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


export default function RecursosPage() {
  const { tieneFuncionTecnica } = usePermisosContext()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })
  const [filtersLoaded, setFiltersLoaded] = useState(false)
  const [ajustesModalOpen, setAjustesModalOpen] = useState(false)
  const [formatosModalOpen, setFormatosModalOpen] = useState(false)
  
  // Cargar categorías dinámicamente
  const { categorias, loading: categoriasLoading } = useCategorias("Inventario", "Recursos")
  // Cargar unidades de medida dinámicamente (desde Productos_unidades)
  const { categorias: unidadesMedida, loading: unidadesLoading } = useCategorias("Inventario", "Productos_unidades")
  // Cargar formatos
  const [formatos, setFormatos] = useState<Array<{ id: string; formato: string; cantidad: number; unidad_medida: string }>>([])
  const [formatosLoading, setFormatosLoading] = useState(false)

  // 1) Cargar los filtros una sola vez al montar
  useEffect(() => {
    const saved = sessionStorage.getItem("recursos_filtros")
    
    if (saved) {
      try {
        const f = JSON.parse(saved)
        setSearchTerm(f.searchTerm ?? "")
        setSelectedCategory(f.selectedCategory ?? "")
      } catch (error) {
        console.error('❌ Error parseando filtros guardados:', error)
      }
    }
    
    setFiltersLoaded(true)
  }, [])

  // 2) Guardar los filtros cuando cambien
  useEffect(() => {
    if (!filtersLoaded) return
    
    sessionStorage.setItem("recursos_filtros", JSON.stringify({
      searchTerm,
      selectedCategory
    }))
  }, [searchTerm, selectedCategory, filtersLoaded])

  // Función para eliminar un filtro específico
  const eliminarFiltro = (tipo: 'busqueda' | 'categoria') => {
    switch (tipo) {
      case 'busqueda':
        setSearchTerm("")
        break
      case 'categoria':
        setSelectedCategory("")
        break
    }
  }

  // Función para limpiar todos los filtros
  const limpiarTodosFiltros = () => {
    setSearchTerm("")
    setSelectedCategory("")
    sessionStorage.removeItem('recursos_filtros')
  }

  // Cargar formatos al montar
  useEffect(() => {
    const fetchFormatos = async () => {
      try {
        setFormatosLoading(true)
        const response = await fetch('/api/formatos')
        if (response.ok) {
          const result = await response.json()
          setFormatos(result.data || [])
        }
      } catch (error) {
        console.error('Error cargando formatos:', error)
      } finally {
        setFormatosLoading(false)
      }
    }
    fetchFormatos()
  }, [])

  // Cargar datos de la API al inicializar
  useEffect(() => {
    if (filtersLoaded) {
      fetchItems()
    }
  }, [filtersLoaded])

  const fetchItems = async (page: number = currentPage) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      // NO enviar 'q' al backend - haremos búsqueda completa en frontend
      // if (searchTerm) params.set('q', searchTerm)
      if (selectedCategory) params.set('categoria', selectedCategory)
      
      // Si hay búsqueda, cargar más datos para filtrar en frontend
      if (searchTerm && searchTerm.trim() !== '') {
        params.set('page', '1')
        params.set('limit', '10000') // Límite alto para obtener todos y filtrar en frontend
      } else {
        params.set('page', page.toString())
        params.set('limit', '50')
      }
      
      console.log('Fetching recursos from:', `/api/recursos?${params.toString()}`)
      const response = await fetch(`/api/recursos?${params.toString()}`)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Received data:', result)
        console.log('Pagination info:', result.pagination)
        let itemsData = result.data || []
        
        // Si hay búsqueda, filtrar en el frontend con normalización flexible
        if (searchTerm && searchTerm.trim() !== '') {
          const normalizedSearch = normalizeText(searchTerm.trim())
          itemsData = itemsData.filter((item: any) => {
            const normalizedCode = normalizeText(item.codigo || '')
            const normalizedNombre = normalizeText(item.nombre || '')
            const normalizedCategoria = normalizeText(item.categoria || '')
            
            return normalizedCode.includes(normalizedSearch) ||
                   normalizedNombre.includes(normalizedSearch) ||
                   normalizedCategoria.includes(normalizedSearch)
          })
        }
        
        setItems(itemsData)
        setPagination(result.pagination || pagination)
        setCurrentPage(page)
      } else {
        const errorData = await response.json()
        console.error('Error al cargar recursos:', errorData)
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
    if (!filtersLoaded) return
    setCurrentPage(1)
    fetchItems(1)
  }, [searchTerm, selectedCategory, filtersLoaded])
  
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
  const [editedItems, setEditedItems] = useState<Record<string, Partial<RecursoItem>>>({})
  const [savingChanges, setSavingChanges] = useState(false)
  
  // Estados para cambios masivos pendientes
  const [pendingChanges, setPendingChanges] = useState<Record<string, Partial<RecursoItem>>>({})
  
  // Estados para acciones masivas
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [bulkAction, setBulkAction] = useState<string>("")
  const [bulkValue, setBulkValue] = useState<string>("")
  

  // Filtrar items basado en búsqueda y categoría (ya filtrado en fetchItems si hay búsqueda)
  const filteredItems = items.filter(item => {
    // Si no hay búsqueda activa, solo filtrar por categoría
    const matchesCategory = selectedCategory === "" || item.categoria === selectedCategory
    return matchesCategory
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
      const response = await fetch('/api/recursos/bulk', {
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
  const handleBulkFieldChange = (field: keyof RecursoItem, value: any) => {
    const updates: Record<string, Partial<RecursoItem>> = {}
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
    // Combinar pendingChanges y editedItems
    const allChanges = { ...pendingChanges }
    Object.entries(editedItems).forEach(([id, changes]) => {
      allChanges[id] = {
        ...allChanges[id],
        ...changes
      }
    })
    
    if (Object.keys(allChanges).length === 0) return

    setSavingChanges(true)
    try {
      const count = Object.keys(allChanges).length
      const promises = Object.entries(allChanges).map(async ([id, changes]) => {
        const response = await fetch(`/api/recursos/${id}`, {
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
      setEditedItems({})
      setSelected({})
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
    setEditedItems({})
    setSelected({})
    toast.info("Cambios descartados")
  }

  async function bulkDelete() {
    const ids = Object.keys(selected).filter(id => selected[id])
    if (!confirm(`¿Eliminar ${ids.length} items de insumos?`)) return
    
    try {
      const response = await fetch('/api/recursos/bulk', {
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
      
      const response = await fetch(`/api/recursos/export?${params.toString()}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const fecha = new Date().toISOString().split('T')[0] // Formato YYYY-MM-DD
        a.download = `recursos_${fecha}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Recursos exportados correctamente')
      } else {
        toast.error('Error al exportar los datos')
      }
    } catch (error) {
      console.error('Error al exportar:', error)
      toast.error('Error al exportar los datos')
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
    router.push(`/panel/recursos/${id}`)
  }

  const handleNewRecurso = () => {
    router.push('/panel/recursos/nuevo')
  }

  const handleFieldChange = (id: string, field: keyof RecursoItem, value: string | number) => {
    setEditedItems(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }))
  }

  // Agregar cambios a pendingChanges en lugar de guardar inmediatamente
  const handleSaveChanges = (id: string) => {
    if (!editedItems[id]) return
    
    // Agregar cambios a pendingChanges pero no guardar automáticamente
    setPendingChanges(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        ...editedItems[id]
      }
    }))
    
    // Limpiar editedItems pero mantener seleccionado
    setEditedItems(prev => {
      const newItems = { ...prev }
      delete newItems[id]
      return newItems
    })
    
    toast.info('Cambios agregados. Presiona "Guardar" para confirmar.')
  }

  // Guardar inmediatamente un campo específico sin depender de editedItems
  const handleImmediateSave = async (id: string, patch: Partial<RecursoItem>) => {
    setSavingChanges(true)
    try {
      const response = await fetch(`/api/recursos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch)
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

      const response = await fetch('/api/recursos/bulk', {
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
      const response = await fetch('/api/recursos/bulk', {
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

      const response = await fetch('/api/recursos', {
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
      const response = await fetch(`/api/recursos/${id}`, {
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

  return (
    <div className="p-6">

      {/* Main Content */}
      <main className="w-full max-w-full px-4 sm:px-6 py-8 overflow-hidden">
        <div className="mb-8">
          {/* Filtros y búsqueda */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Filtros y Búsqueda</CardTitle>
                <div className="flex gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFormatosModalOpen(true)}
                          className="h-9 w-9 p-0"
                        >
                          <PillBottle className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Gestionar formatos</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAjustesModalOpen(true)}
                          className="h-9 w-9 p-0"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Ajustes de Recursos</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Etiquetas de filtros activos */}
              {(searchTerm || selectedCategory) && (
                <div className="flex flex-wrap gap-2 items-center mb-4 pb-4 border-b">
                  {searchTerm && (
                    <div className="flex items-center gap-1 bg-blue-100 hover:bg-blue-200 rounded-full px-3 py-1 text-sm">
                      <span className="font-medium">Búsqueda:</span>
                      <span className="text-gray-700">{searchTerm}</span>
                      <button
                        type="button"
                        onClick={() => eliminarFiltro('busqueda')}
                        className="ml-1 hover:text-red-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  
                  {selectedCategory && (
                    <div className="flex items-center gap-1 bg-green-100 hover:bg-green-200 rounded-full px-3 py-1 text-sm">
                      <span className="font-medium">Categoría:</span>
                      <span className="text-gray-700">{selectedCategory}</span>
                      <button
                        type="button"
                        onClick={() => eliminarFiltro('categoria')}
                        className="ml-1 hover:text-red-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  
                  {/* Botón para limpiar todos */}
                  <button
                    type="button"
                    onClick={limpiarTodosFiltros}
                    className="text-sm text-gray-500 hover:text-gray-700 underline ml-2"
                  >
                    Limpiar todo
                  </button>
                </div>
              )}
              
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por código y nombre..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <Select value={selectedCategory || "all"} onValueChange={(value) => setSelectedCategory(value === "all" ? "" : value)}>
                    <SelectTrigger className="w-[200px] [&>span]:text-black !pl-9 !pr-3 relative">
                      <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none z-10" />
                      <SelectValue placeholder="Filtrar por categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Categorías</SelectItem>
                      {!categoriasLoading && categorias.map((categoria) => (
                        <SelectItem key={categoria} value={categoria}>
                          {categoria}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Botones de acciones - completamente a la derecha */}
                <div className="flex gap-2 items-center ml-auto">
                  {tieneFuncionTecnica("ver boton exportar") && (
                    <Button variant="outline" size="sm" onClick={handleExport}>
                      <Download className="h-4 w-4 mr-2" />
                      Exportar
                    </Button>
                  )}
                  <Button 
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={handleNewRecurso}
                  >
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
            <div className="flex items-center justify-between">
              <CardTitle>Lista de Recursos ({filteredItems.length})</CardTitle>
            </div>
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

                        

                        {/* Cambiar unidad */}
                        <Select onValueChange={(value) => handleBulkFieldChange('unidad_medida', value)}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Cambiar unidad" />
                          </SelectTrigger>
                          <SelectContent>
                            {!unidadesLoading && unidadesMedida.map((unidad) => (
                              <SelectItem key={unidad} value={unidad}>
                                {unidad}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Cambiar formato */}
                        <Select onValueChange={(value) => {
                          let formatoObj: { formato: string; cantidad: number; unidad_medida: string } | null = null
                          if (value === "__sin_formato__") {
                            formatoObj = null
                          } else if (value === "Unidad suelta") {
                            formatoObj = { formato: "Unidad suelta", cantidad: 0, unidad_medida: "" }
                          } else {
                            const formatoSeleccionado = formatos.find(f => 
                              `${f.formato} ${f.cantidad} ${f.unidad_medida}` === value
                            )
                            if (formatoSeleccionado) {
                              formatoObj = {
                                formato: formatoSeleccionado.formato,
                                cantidad: formatoSeleccionado.cantidad,
                                unidad_medida: formatoSeleccionado.unidad_medida
                              }
                            }
                          }
                          handleBulkFieldChange('formato', formatoObj)
                        }}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Cambiar formato" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__sin_formato__">Sin formato</SelectItem>
                            <SelectItem value="Unidad suelta">Unidad suelta</SelectItem>
                            {!formatosLoading && formatos.map((formato) => {
                              const displayText = `${formato.formato} ${formato.cantidad} ${formato.unidad_medida}`
                              return (
                                <SelectItem key={formato.id} value={displayText}>
                                  {displayText}
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {(Object.keys(pendingChanges).length > 0 || Object.keys(editedItems).length > 0) && (
                      <>
                        <Button 
                          size="sm" 
                          onClick={handleSaveBulkChanges}
                          disabled={savingChanges}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          {savingChanges ? "Guardando..." : `Guardar cambios (${Object.keys(pendingChanges).length + Object.keys(editedItems).length})`}
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
              <div className="text-center py-8 text-gray-500">Cargando recursos...</div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm || selectedCategory ? "No se encontraron items" : "No hay items en los recursos"}
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
                    <TableHead>Formato</TableHead>
                    <TableHead>Unidad</TableHead>
                    <TableHead>Coste</TableHead>
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
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger className="text-left">
                                    {item.nombre.slice(0, 30) + "…"}
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-sm">{item.nombre}</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
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
                            onValueChange={(value) => {
                              handleFieldChange(item.id, 'categoria', value as string)
                              handleImmediateSave(item.id, { categoria: value as string })
                            }}
                          >
                            <SelectTrigger className="h-8 w-32 [&_svg]:hidden overflow-hidden [&>*]:truncate [&>*]:max-w-full">
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
                            value={
                              editedItems[item.id]?.formato 
                                ? typeof editedItems[item.id].formato === 'object' && editedItems[item.id].formato?.formato === "Unidad suelta"
                                  ? "Unidad suelta"
                                  : typeof editedItems[item.id].formato === 'object' && editedItems[item.id].formato
                                    ? `${editedItems[item.id].formato.formato} ${editedItems[item.id].formato.cantidad} ${editedItems[item.id].formato.unidad_medida}`
                                    : "__sin_formato__"
                                : item.formato
                                  ? item.formato.formato === "Unidad suelta"
                                    ? "Unidad suelta"
                                    : `${item.formato.formato} ${item.formato.cantidad} ${item.formato.unidad_medida}`
                                  : "__sin_formato__"
                            }
                            onValueChange={(value) => {
                              let formatoObj: { formato: string; cantidad: number; unidad_medida: string } | null = null
                              if (value === "__sin_formato__") {
                                formatoObj = null
                              } else if (value === "Unidad suelta") {
                                formatoObj = { formato: "Unidad suelta", cantidad: 0, unidad_medida: "" }
                              } else {
                                const formatoSeleccionado = formatos.find(f => 
                                  `${f.formato} ${f.cantidad} ${f.unidad_medida}` === value
                                )
                                if (formatoSeleccionado) {
                                  formatoObj = {
                                    formato: formatoSeleccionado.formato,
                                    cantidad: formatoSeleccionado.cantidad,
                                    unidad_medida: formatoSeleccionado.unidad_medida
                                  }
                                }
                              }
                              handleFieldChange(item.id, 'formato', formatoObj)
                              handleImmediateSave(item.id, { formato: formatoObj })
                            }}
                          >
                            <SelectTrigger className="h-8 w-24 [&_svg]:hidden overflow-hidden [&>*]:truncate [&>*]:max-w-full">
                              <SelectValue placeholder="Sin formato" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__sin_formato__">Sin formato</SelectItem>
                              <SelectItem value="Unidad suelta">Unidad suelta</SelectItem>
                              {!formatosLoading && formatos.map((formato) => {
                                const displayText = `${formato.formato} ${formato.cantidad} ${formato.unidad_medida}`
                                return (
                                  <SelectItem key={formato.id} value={displayText}>
                                    {displayText}
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {(() => {
                              let formatosArray: Array<{ formato: string; cantidad: number; unidad_medida: string }> = []
                              if (item.formato) {
                                if (Array.isArray(item.formato)) {
                                  formatosArray = item.formato
                                } else if (typeof item.formato === 'string') {
                                  try {
                                    const parsed = JSON.parse(item.formato)
                                    formatosArray = Array.isArray(parsed) ? parsed : (parsed ? [parsed] : [])
                                  } catch {
                                    formatosArray = []
                                  }
                                } else if (typeof item.formato === 'object') {
                                  formatosArray = [item.formato]
                                }
                              }
                              
                              if (formatosArray.length === 0) {
                                return (
                                  <Badge variant="secondary" className="bg-gray-200 text-gray-800 hover:bg-gray-200">
                                    Sin formato
                                  </Badge>
                                )
                              }
                              
                              return formatosArray.map((formato, idx) => {
                                const displayText = formato.formato === "Unidad suelta" 
                                  ? "Unidad suelta"
                                  : `${formato.formato} ${formato.cantidad} ${formato.unidad_medida}`
                                return (
                                  <Badge 
                                    key={idx}
                                    variant="secondary" 
                                    className="bg-blue-200 text-blue-800 hover:bg-blue-200"
                                  >
                                    {displayText}
                                  </Badge>
                                )
                              })
                            })()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {selected[item.id] ? (
                          <Select 
                            value={editedItems[item.id]?.unidad_medida ?? item.unidad_medida}
                            onValueChange={(value) => {
                              handleFieldChange(item.id, 'unidad_medida', value as string)
                              handleImmediateSave(item.id, { unidad_medida: value as string })
                            }}
                          >
                            <SelectTrigger className="h-8 w-24 [&_svg]:hidden overflow-hidden [&>*]:truncate [&>*]:max-w-full">
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
                          <Badge variant="secondary" className="bg-purple-200 text-purple-800 hover:bg-purple-200">
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
                          `Bs ${item.coste.toFixed(2)}/${item.unidad_medida || ''}`
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
        {(() => {
          console.log('Pagination debug:', { totalPages: pagination.totalPages, total: pagination.total, currentPage })
          return null
        })()}
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
              Mostrando {((currentPage - 1) * 50) + 1} - {Math.min(currentPage * 50, pagination.total)} de {pagination.total} items
            </div>
          </div>
        )}
      </main>

      <AjustesRecursosModal 
        open={ajustesModalOpen} 
        onOpenChange={(open) => {
          setAjustesModalOpen(open)
          if (!open) {
            // Refrescar categorías cuando se cierre el modal
            window.location.reload()
          }
        }}
      />

      <FormatosRecursosModal 
        open={formatosModalOpen} 
        onOpenChange={setFormatosModalOpen}
      />
    </div>
  )
}
