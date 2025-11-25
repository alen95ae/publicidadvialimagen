"use client"

import type React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  MoreHorizontal,
  Download,
  CheckCircle,
  XCircle,
  Copy,
  LayoutGrid,
  List,
  X
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
import { Switch } from "@/components/ui/switch"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { includesIgnoreAccents } from "@/lib/utils"
import { usePermisosContext } from "@/hooks/permisos-provider"

// Tipo para los items del inventario
interface InventoryItem {
  id: string
  codigo: string
  nombre: string
  responsable: string
  unidad_medida: string
  coste: number
  precio_venta: number
  categoria: string
  cantidad: number
  disponibilidad: string
  imagen_portada?: string
  mostrar_en_web?: boolean
}

// Categorías disponibles - Valores exactos en Airtable
const categoriasProductos = [
  "Categoria general",
  "Impresion Digital",
  "Corte y Grabado",
  "Displays"
]

// Unidades de medida disponibles para edición masiva
const unidadesProductos = [
  "m2",
  "unidad"
]

// Unidades de medida disponibles (para filtros y otras funciones)
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

// Función para calcular el porcentaje de utilidad
function calcularPorcentajeUtilidad(coste: number, precioVenta: number): number {
  if (coste === 0) return 0
  return ((precioVenta - coste) / coste) * 100
}

// Datos de ejemplo para el inventario
const inventarioItems = [
  {
    id: 1,
    codigo: "INV-001",
    nombre: "Soporte Publicitario 6x3",
    responsable: "Juan Pérez",
    unidadMedida: "unidad",
    coste: 150.00,
    precioVenta: 250.00,
    categoria: "Displays",
    cantidad: 25,
    disponibilidad: "Disponible",
  },
  {
    id: 2,
    codigo: "INV-002", 
    nombre: "Banner Vinilo 2x1",
    responsable: "María García",
    unidadMedida: "m²",
    coste: 45.00,
    precioVenta: 75.00,
    categoria: "Impresion Digital",
    cantidad: 0,
    disponibilidad: "Agotado"
  },
  {
    id: 3,
    codigo: "INV-003",
    nombre: "Estructura Metálica Base",
    responsable: "Carlos López",
    unidadMedida: "unidad",
    coste: 320.00,
    precioVenta: 450.00,
    categoria: "Categoria general",
    cantidad: 8,
    disponibilidad: "Bajo Stock"
  },
  {
    id: 4,
    codigo: "INV-004",
    nombre: "Tornillos Anclaje M8",
    responsable: "Ana Martínez",
    unidadMedida: "kg",
    coste: 12.50,
    precioVenta: 18.00,
    categoria: "Insumos",
    cantidad: 150,
    disponibilidad: "Disponible"
  },
  {
    id: 5,
    codigo: "INV-005",
    nombre: "Servicio de Corte Láser",
    responsable: "Pedro Ruiz",
    unidadMedida: "hora",
    coste: 25.00,
    precioVenta: 40.00,
    categoria: "Corte y Grabado",
    cantidad: 0,
    disponibilidad: "Disponible"
  },
  {
    id: 6,
    codigo: "INV-006",
    nombre: "Instalación Publicitaria",
    responsable: "Laura Sánchez",
    unidadMedida: "hora",
    coste: 30.00,
    precioVenta: 50.00,
    categoria: "Mano de obra",
    cantidad: 0,
    disponibilidad: "Disponible"
  }
]

function getStockBadge(cantidad: number) {
  if (cantidad >= 1) {
    return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Disponible</Badge>
  } else {
    return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Agotado</Badge>
  }
}


export default function InventarioPage() {
  const { tieneFuncionTecnica, puedeEditar } = usePermisosContext()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })
  const [filtersLoaded, setFiltersLoaded] = useState(false)
  
  // Estados para edición en línea
  const [editedItems, setEditedItems] = useState<Record<string, Partial<InventoryItem>>>({})
  const [savingChanges, setSavingChanges] = useState(false)
  
  // Estados para cambios masivos pendientes
  const [pendingChanges, setPendingChanges] = useState<Record<string, Partial<InventoryItem>>>({})
  
  // Estado para vista (lista o galería)
  const [viewMode, setViewMode] = useState<"list" | "gallery">("list")

  // 1) Cargar los filtros una sola vez al montar
  useEffect(() => {
    const saved = sessionStorage.getItem("inventario_filtros")
    
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
    
    sessionStorage.setItem("inventario_filtros", JSON.stringify({
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
    sessionStorage.removeItem('inventario_filtros')
  }

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
      if (searchTerm) params.set('q', searchTerm)
      if (selectedCategory) params.set('categoria', selectedCategory)
      params.set('page', page.toString())
      params.set('limit', '50')
      
      console.log('Fetching inventario from:', `/api/inventario?${params.toString()}`)
      const response = await fetch(`/api/inventario?${params.toString()}`)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Received data:', result)
        setItems(result.data || [])
        setPagination(result.pagination || pagination)
        setCurrentPage(page)
      } else {
        const errorData = await response.json()
        console.error('Error al cargar inventario:', errorData)
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
  
  // Estados para acciones masivas
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [bulkAction, setBulkAction] = useState<string>("")
  const [bulkValue, setBulkValue] = useState<string>("")
  
  // Filtrar items basado en búsqueda y categoría (ignorando tildes)
  const filteredItems = items.filter(item => {
    const matchesSearch = searchTerm === "" || 
      includesIgnoreAccents(item.codigo, searchTerm) ||
      includesIgnoreAccents(item.nombre, searchTerm)
    
    // Comparación case-insensitive para categoría (ignorando tildes)
    const matchesCategory = selectedCategory === "" || 
      (item.categoria && includesIgnoreAccents(item.categoria, selectedCategory))
    
    return matchesSearch && matchesCategory
  })
  
  // Funciones para edición masiva
  const ids = filteredItems.map(i => i.id)
  const allSelected = ids.length > 0 && ids.every(id => selected[id])
  const someSelected = ids.some(id => selected[id]) || allSelected
  const selectedIds = Object.keys(selected).filter(id => selected[id])
  const singleSelected = selectedIds.length === 1
  
  // Efecto para mostrar/ocultar barra de acciones masivas
  useEffect(() => {
    setShowBulkActions(someSelected)
  }, [someSelected])


  // Funciones para edición inline
  const handleFieldChange = (id: string, field: keyof InventoryItem, value: string | number) => {
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
  const handleImmediateSave = async (id: string, patch: Partial<InventoryItem>) => {
    // Limpiar valores string antes de enviar (remover TODAS las comillas y espacios extras)
    const cleanedPatch: any = {}
    Object.keys(patch).forEach(key => {
      const value = patch[key as keyof InventoryItem]
      if (typeof value === 'string') {
        cleanedPatch[key] = value
          .replace(/["""''']+/g, '')  // Eliminar TODAS las comillas
          .replace(/\s+/g, ' ')       // Normalizar espacios
          .trim()
      } else {
        cleanedPatch[key] = value
      }
    })
    
    setSavingChanges(true)
    try {
      const response = await fetch(`/api/inventario/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedPatch)
      })
      if (response.ok) {
        // Limpiar cambios pendientes del item
        setEditedItems(prev => {
          const newItems = { ...prev }
          delete newItems[id]
          return newItems
        })
        // Deseleccionar el item después de guardar (como en recursos)
        setSelected(prev => ({ ...prev, [id]: false }))
        await fetchItems()
        // No mostrar toast para cambios inmediatos (categoría/unidad)
      } else {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || 'Error al guardar cambios'
        toast.error(errorMessage)
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

  // Ya no guardamos automáticamente al deseleccionar - el usuario debe usar los botones

  function toggleAll(checked: boolean) {
    const next: Record<string, boolean> = {}
    ids.forEach(id => { next[id] = checked })
    setSelected(next)
  }
  
  const handleBulkFieldChange = (field: keyof InventoryItem, value: any) => {
    const selectedIds = Object.keys(selected).filter(id => selected[id])
    
    // Limpiar el valor si es string (remover TODAS las comillas y espacios extras)
    let valorLimpio = value
    if (typeof value === 'string') {
      // Eliminar TODAS las comillas y normalizar espacios
      valorLimpio = value
        .replace(/["""''']+/g, '')  // Eliminar TODAS las comillas
        .replace(/\s+/g, ' ')       // Normalizar espacios
        .trim()
    }
    
    console.log(`📝 handleBulkFieldChange: campo=${field}, valor original=${JSON.stringify(value)}, valor limpio=${JSON.stringify(valorLimpio)}, items seleccionados=${selectedIds.length}`)
    
    const updates: Record<string, Partial<InventoryItem>> = {}
    selectedIds.forEach(id => {
      updates[id] = {
        ...(pendingChanges[id] || {}),
        [field]: valorLimpio
      }
    })
    
    console.log('📝 Cambios pendientes que se van a agregar:', updates)
    
    setPendingChanges(prev => {
      const next = { ...prev, ...updates }
      console.log('📝 Estado actualizado de pendingChanges:', next)
      console.log('📝 Total de items con cambios pendientes:', Object.keys(next).length)
      return next
    })
    
    toast.info(`Campo ${field} actualizado para ${selectedIds.length} item(s)`)
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
    
    const pendingCount = Object.keys(allChanges).length
    
    console.log('💾 handleSaveBulkChanges llamado - cambios pendientes:', pendingCount)
    console.log('💾 Contenido de allChanges:', allChanges)
    
    if (pendingCount === 0) {
      console.warn('⚠️ No hay cambios pendientes para guardar')
      toast.info('No hay cambios pendientes para guardar')
      return
    }

    setSavingChanges(true)
    try {
      const count = Object.keys(allChanges).length
      console.log('💾 Guardando cambios masivos:', { count, changes: allChanges })
      
      const promises = Object.entries(allChanges).map(async ([id, changes]) => {
        // Limpiar valores string antes de enviar
        const cleanedChanges: any = {}
        Object.keys(changes).forEach(key => {
          const value = changes[key as keyof InventoryItem]
          if (typeof value === 'string') {
            cleanedChanges[key] = value
              .replace(/["""''']+/g, '')  // Eliminar TODAS las comillas
              .replace(/\s+/g, ' ')       // Normalizar espacios
              .trim()
          } else {
            cleanedChanges[key] = value
          }
        })
        
        console.log(`📤 Enviando actualización para ${id}:`, cleanedChanges)
        console.log(`📤 JSON que se enviará:`, JSON.stringify(cleanedChanges))
        
        try {
          const response = await fetch(`/api/inventario/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cleanedChanges)
          })
          
          if (!response.ok) {
            let errorMessage = `Error ${response.status} actualizando item ${id}`
            
            try {
              const contentType = response.headers.get('content-type')
              
              if (contentType && contentType.includes('application/json')) {
                const errorData = await response.json()
                console.warn(`⚠️ Error data completo recibido para ${id}:`, JSON.stringify(errorData, null, 2))
                
                // Intentar obtener el mensaje de error de diferentes campos posibles
                errorMessage = errorData.error || errorData.message || errorData.details || errorMessage
                
                // Si el objeto está vacío o no tiene información útil, usar status
                if (!errorData || (typeof errorData === 'object' && Object.keys(errorData).length === 0)) {
                  errorMessage = `Error ${response.status}: ${response.statusText || 'Error desconocido'}`
                }
                
                console.warn(`⚠️ Error actualizando ${id}:`, {
                  status: response.status,
                  statusText: response.statusText,
                  errorData: errorData,
                  changes: changes,
                  errorMessage: errorMessage
                })
              } else {
                // Si no es JSON, usar el status text
                errorMessage = `Error ${response.status}: ${response.statusText || 'Error desconocido'}`
                console.warn(`⚠️ Error actualizando ${id} (no JSON):`, {
                  status: response.status,
                  statusText: response.statusText
                })
              }
            } catch (e) {
              // Si no se puede parsear, usar el status text
              errorMessage = `Error ${response.status}: ${response.statusText || 'Error desconocido'}`
              console.warn(`⚠️ Error parsing response for ${id}:`, e)
            }
            
            return { success: false, id, error: errorMessage }
          }
          
          const result = await response.json()
          console.log(`✅ Item ${id} actualizado correctamente:`, result)
          return { success: true, id, data: result }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : `Error desconocido actualizando ${id}`
          console.warn(`⚠️ Error en fetch para ${id}:`, error)
          return { success: false, id, error: errorMessage }
        }
      })

      const results = await Promise.all(promises)
      const successCount = results.filter(r => r.success).length
      const failedResults = results.filter(r => !r.success)
      
      if (failedResults.length > 0) {
        // Usar console.warn para evitar que Next.js lo trate como error no manejado
        console.warn('⚠️ Algunos items fallaron:', failedResults)
        const errorMessages = failedResults.map(r => r.error).filter(Boolean).join(', ')
        const message = errorMessages || 'Error desconocido'
        toast.error(`${successCount} actualizado(s), ${failedResults.length} fallido(s): ${message}`)
      } else {
        toast.success(`${successCount} item(s) actualizado(s) correctamente`)
      }
      
      // Limpiar cambios pendientes solo después de guardar exitosamente
      setPendingChanges({})
      setEditedItems({})
      // Limpiar selección después de guardar
      setSelected({})
      await fetchItems()
    } catch (error) {
      console.warn('⚠️ Error updating items:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar items'
      toast.error(errorMessage)
    } finally {
      setSavingChanges(false)
    }
  }

  const handleDiscardChanges = () => {
    setPendingChanges({})
    setEditedItems({})
    setSelected({})
    toast.info("Cambios descartados")
  }

  async function bulkUpdate(patch: any) {
    const ids = Object.keys(selected).filter(id => selected[id])
    
    try {
      const response = await fetch('/api/inventario/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action: 'update', data: patch })
      })

      if (response.ok) {
        // Recargar los datos después de la actualización
        await fetchItems()
        setSelected({})
      } else {
        console.error('Error al actualizar items')
      }
    } catch (error) {
      console.error('Error de conexión:', error)
    }
  }

  async function bulkDelete() {
    const ids = Object.keys(selected).filter(id => selected[id])
    if (!confirm(`¿Eliminar ${ids.length} items del inventario?`)) return
    
    try {
      const response = await fetch('/api/inventario/bulk', {
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
      
      const response = await fetch(`/api/inventario/export?${params.toString()}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const fecha = new Date().toISOString().split('T')[0] // Formato YYYY-MM-DD
        a.download = `productos_${fecha}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Productos exportados correctamente')
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
    router.push(`/panel/inventario/${id}?edit=true`)
  }

  const handleNewProduct = () => {
    router.push('/panel/inventario/nuevo?edit=true')
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

      const response = await fetch('/api/inventario/bulk', {
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
      const response = await fetch('/api/inventario/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: selectedItems, action: 'delete' }),
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(result.message || `${selectedCount} items eliminados correctamente`)
        setSelected({})
        setShowBulkActions(false)
        await fetchItems()
      } else {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || errorData.message || 'Error al eliminar items'
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error('Error deleting items:', error)
      toast.error('Error de conexión al eliminar items')
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

      const response = await fetch('/api/inventario', {
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
      const response = await fetch(`/api/inventario/${id}`, {
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
              <CardTitle className="text-lg">Filtros y Búsqueda</CardTitle>
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
                      <SelectItem value="all">Todas las categorías</SelectItem>
                      {categoriasProductos.map((categoria) => (
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
                    onClick={handleNewProduct}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Item
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de inventario */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Lista de Productos ({filteredItems.length})</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={viewMode === "list" ? "bg-white text-gray-900 border-red-500 border-2" : ""}
                >
                  <List className="h-4 w-4 mr-2" />
                  Lista
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode("gallery")}
                  className={viewMode === "gallery" ? "bg-white text-gray-900 border-red-500 border-2" : ""}
                >
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Galería
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Barra azul unificada de acciones masivas - Solo en modo lista */}
            {viewMode === "list" && puedeEditar("inventario") && someSelected && (
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
                            {categoriasProductos.map((categoria) => (
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
                            {unidadesProductos.map((unidad) => (
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
                      onClick={handleBulkDelete}
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
              <div className="text-center py-8 text-gray-500">Cargando inventario...</div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm || selectedCategory ? "No se encontraron items" : "No hay items en el inventario"}
              </div>
            ) : viewMode === "gallery" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-8 gap-3">
                {filteredItems.map((item) => (
                  <Card 
                    key={item.id} 
                    className="overflow-hidden transition-all cursor-pointer hover:shadow-lg p-0"
                  >
                    <div 
                      className="relative aspect-square w-full bg-gray-100 group cursor-pointer"
                      onClick={() => handleEdit(item.id)}
                    >
                      {item.imagen_portada ? (
                        <img
                          src={item.imagen_portada}
                          alt={item.nombre}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105 rounded-t-lg"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-gray-200 to-gray-300 rounded-t-lg">
                          <span className="text-gray-400 text-sm font-medium">Sin imagen</span>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-2">
                      <div className="space-y-1.5">
                        <div>
                          <p className="text-[10px] font-mono text-gray-500 mb-0.5">{item.codigo}</p>
                          <h3 className="font-semibold text-xs line-clamp-2 min-h-[2rem] leading-tight">{item.nombre}</h3>
                        </div>
                        <div className="flex items-center gap-1 flex-wrap">
                          <Badge variant="secondary" className="text-[10px] px-1 py-0">
                            {item.categoria || 'Sin categoría'}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] px-1 py-0">
                            {item.unidad_medida || 'Sin unidad'}
                          </Badge>
                        </div>
                        <div className="space-y-0.5 pt-1 border-t">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-gray-600">Stock:</span>
                            <span className="font-medium">{item.cantidad}</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-gray-600">Precio:</span>
                            <span className="font-medium text-green-600">Bs {item.precio_venta.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 pt-1 border-t">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Editar"
                            onClick={() => handleEdit(item.id)}
                            className="flex-1 text-[10px] h-6 px-1"
                          >
                            <Edit className="w-2.5 h-2.5 mr-0.5" />
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Eliminar"
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 text-[10px] h-6 px-1"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    {puedeEditar("inventario") && (
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allSelected ? true : (someSelected ? 'indeterminate' : false)}
                        onCheckedChange={(v) => toggleAll(Boolean(v))}
                        aria-label="Seleccionar todo"
                      />
                    </TableHead>
                    )}
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Unidad</TableHead>
                    <TableHead>Coste</TableHead>
                    <TableHead>Precio Venta</TableHead>
                    <TableHead>% Utilidad</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Mostrar en Web</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      {puedeEditar("inventario") && (
                      <TableCell className="w-10">
                        <Checkbox
                          checked={!!selected[item.id]}
                          onCheckedChange={(v) =>
                            setSelected(prev => ({ ...prev, [item.id]: Boolean(v) }))
                          }
                          aria-label={`Seleccionar ${item.codigo}`}
                        />
                      </TableCell>
                      )}
                      <TableCell className="whitespace-nowrap">
                        {selected[item.id] && puedeEditar("inventario") ? (
                          <Input
                            value={editedItems[item.id]?.codigo ?? item.codigo}
                            onChange={(e) => handleFieldChange(item.id, 'codigo', e.target.value)}
                            className="h-8 font-mono text-xs"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveChanges(item.id)
                              } else if (e.key === 'Escape') {
                                handleCancelEdit(item.id)
                              }
                            }}
                          />
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-1 font-mono text-xs text-gray-800 border border-neutral-200">
                            {item.codigo}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[42ch]">
                        {selected[item.id] && puedeEditar("inventario") ? (
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
                            {item.nombre && item.nombre.length > 30 ? (
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
                        {selected[item.id] && puedeEditar("inventario") ? (
                          <Select 
                            value={(editedItems[item.id]?.categoria ?? item.categoria) || undefined}
                            onValueChange={(value) => {
                              // Limpiar el valor antes de guardar (remover TODAS las comillas y normalizar)
                              const categoriaLimpia = typeof value === 'string' 
                                ? value.replace(/["""''']+/g, '').replace(/\s+/g, ' ').trim()
                                : value
                              handleImmediateSave(item.id, { categoria: categoriaLimpia as string })
                            }}
                          >
                            <SelectTrigger className="h-8 w-40">
                              <SelectValue placeholder="Seleccionar categoría" />
                            </SelectTrigger>
                            <SelectContent>
                              {categoriasProductos.map((categoria) => (
                                <SelectItem key={categoria} value={categoria}>
                                  {categoria}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="secondary">{item.categoria || 'Sin categoría'}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {selected[item.id] && puedeEditar("inventario") ? (
                          <Select 
                            value={(editedItems[item.id]?.unidad_medida ?? item.unidad_medida) || undefined}
                            onValueChange={(value) => {
                              // Limpiar el valor antes de guardar (remover TODAS las comillas)
                              const unidadLimpia = typeof value === 'string' 
                                ? value.replace(/["""''']+/g, '').replace(/\s+/g, ' ').trim()
                                : value
                              handleImmediateSave(item.id, { unidad_medida: unidadLimpia as string })
                            }}
                          >
                            <SelectTrigger className="h-8 w-24">
                              <SelectValue placeholder="Seleccionar unidad" />
                            </SelectTrigger>
                            <SelectContent>
                              {unidadesProductos.map((unidad) => (
                                <SelectItem key={unidad} value={unidad}>
                                  {unidad}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-200 text-gray-800 hover:bg-gray-200">
                            {item.unidad_medida || 'Sin unidad'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        Bs {item.coste.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        Bs {item.precio_venta.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${
                          calcularPorcentajeUtilidad(item.coste, item.precio_venta) >= 50 
                            ? 'text-green-600' 
                            : calcularPorcentajeUtilidad(item.coste, item.precio_venta) >= 20 
                            ? 'text-yellow-600' 
                            : 'text-red-600'
                        }`}>
                          {calcularPorcentajeUtilidad(item.coste, item.precio_venta).toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        {selected[item.id] ? (
                          <Input
                            type="number"
                            min="0"
                            value={editedItems[item.id]?.cantidad ?? item.cantidad}
                            onChange={(e) => handleFieldChange(item.id, 'cantidad', parseInt(e.target.value) || 0)}
                            className="h-8 w-20"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveChanges(item.id)
                              } else if (e.key === 'Escape') {
                                handleCancelEdit(item.id)
                              }
                            }}
                          />
                        ) : (
                          getStockBadge(item.cantidad)
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center">
                          <Switch
                            checked={editedItems[item.id]?.mostrar_en_web ?? item.mostrar_en_web ?? false}
                            onCheckedChange={(checked) => {
                              handleImmediateSave(item.id, { mostrar_en_web: checked })
                            }}
                            className="data-[state=checked]:bg-red-500 data-[state=unchecked]:bg-gray-300 hover:data-[state=checked]:bg-red-600 data-[state=unchecked]:hover:bg-gray-400 transition-colors"
                          />
                        </div>
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
              Mostrando {((currentPage - 1) * 50) + 1} - {Math.min(currentPage * 50, pagination.total)} de {pagination.total} items
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

