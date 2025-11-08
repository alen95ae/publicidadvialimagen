"use client"

import type React from "react"
import Link from "next/link"
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2
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
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

// Tipo para los items de ajustes de inventario
interface AjusteInventarioItem {
  id: string // ID único para cada combinación
  recursoId: string // ID del recurso original
  codigo: string
  nombre: string
  sucursal: string
  varianteCombinacion: string // Descripción de la combinación de variantes
  unidad_medida: string
  diferenciaPrecio: number
  precioVariante: number
  stock: number
  variantesData: any // Datos de las variantes combinadas
}

// Sucursales disponibles (se pueden leer desde Airtable si existe el campo)
const SUCURSALES_DEFAULT = ["La Paz", "Santa Cruz"]

// Función para generar todas las combinaciones posibles de variantes (producto cartesiano)
function generateVarianteCombinations(variantes: any[]): any[] {
  if (!variantes || variantes.length === 0) {
    return [{}] // Una combinación vacía si no hay variantes
  }

  // Función auxiliar para generar combinaciones de arrays
  function cartesianProduct(arrays: any[][]): any[][] {
    return arrays.reduce((acc, curr) => {
      return acc.flatMap(accVal => curr.map(currVal => [...accVal, currVal]))
    }, [[]])
  }

  // Obtener todas las posibilidades de cada variante
  const variantesArrays = variantes.map(v => 
    (v.posibilidades || []).map((pos: string) => ({
      nombre: v.nombre,
      valor: pos
    }))
  )

  // Generar producto cartesiano
  const combinations = cartesianProduct(variantesArrays)

  // Convertir a formato de objeto
  return combinations.map(combo => {
    const result: any = {}
    combo.forEach((item: any) => {
      result[item.nombre] = item.valor
    })
    return result
  })
}

// Función para generar descripción de variante combinada (solo valores, sin títulos)
function getVarianteDescription(combinacion: any): string {
  const parts = Object.values(combinacion).map((value) => {
    const valueStr = String(value)
    // Si el valor contiene un código hexadecimal (formato "nombreColor:#HEX"), solo mostrar el nombre
    if (valueStr.includes(':') && /^#[0-9A-Fa-f]{6}$/.test(valueStr.split(':')[1])) {
      return valueStr.split(':')[0]
    }
    return valueStr
  })
  return parts.length > 0 ? parts.join(", ") : "Sin variantes"
}

// Función para generar clave de combinación de variantes (formato: "Color:blanco mate|Grosor:11oz")
function generateVarianteKey(combinacion: any): string {
  if (!combinacion || Object.keys(combinacion).length === 0) {
    return "sin_variantes"
  }
  
  const parts = Object.entries(combinacion)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => {
      const valueStr = String(value)
      // Si el valor contiene un código hexadecimal, solo usar el nombre del color
      if (valueStr.includes(':') && /^#[0-9A-Fa-f]{6}$/.test(valueStr.split(':')[1])) {
        return `${key}:${valueStr.split(':')[0]}`
      }
      return `${key}:${valueStr}`
    })
  
  return parts.join("|")
}

export default function AjustesInventarioPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSucursal, setSelectedSucursal] = useState<string>("all")
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [editedItems, setEditedItems] = useState<Record<string, Partial<AjusteInventarioItem>>>({})
  const [pendingChanges, setPendingChanges] = useState<Record<string, Partial<AjusteInventarioItem>>>({})
  const [savingChanges, setSavingChanges] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 100

  // Cargar datos de recursos
  useEffect(() => {
    fetchRecursos()
  }, [])

  const fetchRecursos = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/recursos?limit=1000')
      
      if (response.ok) {
        const result = await response.json()
        setItems(result.data || [])
      } else {
        console.error('Error al cargar recursos')
        setItems([])
      }
    } catch (error) {
      console.error('Error de conexión:', error)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  // Generar items de ajuste de inventario
  const ajustesItems = useMemo(() => {
    const ajustes: AjusteInventarioItem[] = []

    // Filtrar solo recursos con categoría "Insumos"
    const recursosInsumos = items.filter(item => item.categoria === "Insumos")

    recursosInsumos.forEach(recurso => {
      // Obtener sucursales del recurso si existe el campo, sino usar las por defecto
      const sucursales = recurso.sucursal 
        ? (Array.isArray(recurso.sucursal) ? recurso.sucursal : [recurso.sucursal])
        : SUCURSALES_DEFAULT

      // Generar todas las combinaciones de variantes
      let variantes = []
      try {
        if (recurso.variantes) {
          if (typeof recurso.variantes === 'string') {
            const parsed = JSON.parse(recurso.variantes)
            // Puede ser array o objeto con estructura { variantes: [...], datosVariantes: {...} }
            variantes = Array.isArray(parsed) ? parsed : (parsed.variantes || [])
          } else if (Array.isArray(recurso.variantes)) {
            variantes = recurso.variantes
          } else if (recurso.variantes.variantes) {
            variantes = recurso.variantes.variantes
          }
        }
      } catch (e) {
        console.error('Error parseando variantes:', e)
        variantes = []
      }
      
      const combinaciones = generateVarianteCombinations(variantes)

      // Si no hay variantes, crear una combinación vacía
      if (combinaciones.length === 0) {
        combinaciones.push({})
      }

      // Para cada combinación de variantes, crear un item por cada sucursal
      combinaciones.forEach((combinacion, indexCombo) => {
        sucursales.forEach((sucursal: string) => {
          const varianteDesc = getVarianteDescription(combinacion)
          
          // Generar ID único para esta combinación
          const id = `${recurso.id}-${indexCombo}-${sucursal}`

          // Obtener stock, precio variante y diferencia de precio desde Control de Stock
          const stockVariante = getStockFromControlStock(recurso, combinacion, sucursal)
          const precioVarianteData = getPrecioVarianteFromControlStock(recurso, combinacion, sucursal)
          const diferenciaPrecio = precioVarianteData.diferencia || 0
          const precioVariante = precioVarianteData.precio || recurso.coste || 0

          // Crear combinación con sucursal incluida
          const combinacionConSucursal = { ...combinacion, Sucursal: sucursal }
          
          ajustes.push({
            id,
            recursoId: recurso.id,
            codigo: recurso.codigo,
            nombre: recurso.nombre,
            sucursal,
            varianteCombinacion: varianteDesc,
            unidad_medida: recurso.unidad_medida || '',
            diferenciaPrecio,
            precioVariante,
            stock: stockVariante,
            variantesData: combinacionConSucursal // Incluye sucursal en los datos
          })
        })
      })
    })

    return ajustes
  }, [items])

  // Función auxiliar para obtener stock desde Control de Stock
  function getStockFromControlStock(recurso: any, combinacion: any, sucursal: string): number {
    try {
      if (!recurso.control_stock) return 0
      
      let controlStock: any = null
      if (typeof recurso.control_stock === 'string') {
        controlStock = JSON.parse(recurso.control_stock)
      } else {
        controlStock = recurso.control_stock
      }
      
      // Estructura esperada: { "Color:x|Grosor:y|Sucursal:La Paz": { stock: 50, diferenciaPrecio: 5.5, precioVariante: 15.5 } }
      if (controlStock && typeof controlStock === 'object') {
        // Crear combinación con sucursal
        const combinacionConSucursal = { ...combinacion, Sucursal: sucursal }
        const key = generateVarianteKey(combinacionConSucursal)
        const datosVariante = controlStock[key]
        
        if (datosVariante && datosVariante.stock !== undefined) {
          return datosVariante.stock || 0
        }
      }
    } catch (e) {
      console.error('Error leyendo stock desde Control de Stock:', e)
    }
    return 0
  }

  // Función auxiliar para obtener precio variante desde Control de Stock
  function getPrecioVarianteFromControlStock(recurso: any, combinacion: any, sucursal: string): { precio: number, diferencia: number } {
    try {
      if (!recurso.control_stock) {
        return {
          precio: recurso.coste || 0,
          diferencia: 0
        }
      }
      
      let controlStock: any = null
      if (typeof recurso.control_stock === 'string') {
        controlStock = JSON.parse(recurso.control_stock)
      } else {
        controlStock = recurso.control_stock
      }
      
      // Estructura esperada: { "Color:x|Grosor:y|Sucursal:La Paz": { stock: 50, diferenciaPrecio: 5.5, precioVariante: 15.5 } }
      if (controlStock && typeof controlStock === 'object') {
        // Crear combinación con sucursal
        const combinacionConSucursal = { ...combinacion, Sucursal: sucursal }
        const key = generateVarianteKey(combinacionConSucursal)
        const datosVariante = controlStock[key]
        
        if (datosVariante) {
          const diferencia = datosVariante.diferenciaPrecio || 0
          // Si hay precioVariante guardado, usarlo; sino calcularlo
          const precio = datosVariante.precioVariante !== undefined
            ? datosVariante.precioVariante
            : (recurso.coste || 0) + diferencia
          return {
            precio,
            diferencia
          }
        }
      }
    } catch (e) {
      console.error('Error leyendo precio desde Control de Stock:', e)
    }
    return {
      precio: recurso.coste || 0,
      diferencia: 0
    }
  }

  // Filtrar items basado en búsqueda y sucursal
  const filteredItems = ajustesItems.filter(item => {
    const matchesSearch = searchTerm === "" || 
      item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.varianteCombinacion.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesSucursal = selectedSucursal === "all" || item.sucursal === selectedSucursal
    
    return matchesSearch && matchesSucursal
  })

  // Calcular paginación
  const totalItems = filteredItems.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedItems = filteredItems.slice(startIndex, endIndex)

  // Resetear a página 1 cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedSucursal])

  // Funciones de paginación
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll al inicio de la tabla
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1)
    }
  }

  // Función para obtener el color del badge según la sucursal
  const getSucursalBadgeClass = (sucursal: string) => {
    if (sucursal === "La Paz") {
      return "bg-red-100 text-red-800 hover:bg-red-100"
    } else if (sucursal === "Santa Cruz") {
      return "bg-green-100 text-green-800 hover:bg-green-100"
    }
    return "bg-gray-100 text-gray-800 hover:bg-gray-100"
  }

  // Funciones para edición múltiple
  const ids = paginatedItems.map(i => i.id)
  const allSelected = ids.length > 0 && ids.every(id => selected[id])
  const someSelected = ids.some(id => selected[id])
  const selectedIds = Object.keys(selected).filter(id => selected[id])

  function toggleAll(checked: boolean) {
    const next: Record<string, boolean> = {}
    ids.forEach(id => { next[id] = checked })
    setSelected(next)
  }

  // Aplicar cambio masivo a seleccionados
  const handleBulkFieldChange = (field: 'diferenciaPrecio' | 'stock' | 'precioVariante', value: any) => {
    const updates: Record<string, Partial<AjusteInventarioItem>> = {}
    Object.keys(selected).filter(id => selected[id]).forEach(id => {
      const item = filteredItems.find(i => i.id === id)
      const recurso = item ? items.find(r => r.id === item.recursoId) : null
      const costeBase = recurso?.coste || 0
      
      const fieldUpdates: Partial<AjusteInventarioItem> = {
        ...(pendingChanges[id] || {}),
        [field]: value
      }
      
      // Si cambia diferenciaPrecio, también actualizar precioVariante
      if (field === 'diferenciaPrecio') {
        const nuevaDiferencia = parseFloat(value) || 0
        fieldUpdates.precioVariante = costeBase + nuevaDiferencia
      }
      
      // Si cambia precioVariante, también actualizar diferenciaPrecio
      if (field === 'precioVariante') {
        const nuevoPrecio = parseFloat(value) || 0
        const nuevaDiferencia = nuevoPrecio - costeBase
        fieldUpdates.diferenciaPrecio = nuevaDiferencia
      }
      
      updates[id] = fieldUpdates
    })
    setPendingChanges(prev => ({ ...prev, ...updates }))
    const fieldNames: Record<string, string> = {
      'diferenciaPrecio': 'Diferencia de precio',
      'stock': 'Stock',
      'precioVariante': 'Precio variante'
    }
    toast.info(`Campo ${fieldNames[field]} actualizado para ${Object.keys(selected).filter(id => selected[id]).length} item(s)`)
  }

  // Guardar cambios pendientes masivos
  const handleSaveBulkChanges = async () => {
    if (Object.keys(pendingChanges).length === 0) return

    setSavingChanges(true)
    try {
      // Agrupar cambios por recursoId, luego por key de variante y sucursal
      const cambiosPorRecurso: Record<string, Record<string, Record<string, { stock: number, diferenciaPrecio: number, precioVariante: number }>>> = {}
      
      Object.entries(pendingChanges).forEach(([id, changes]) => {
        const item = filteredItems.find(i => i.id === id)
        if (!item) return
        
        const recurso = items.find(r => r.id === item.recursoId)
        if (!recurso) return
        
        const recursoId = item.recursoId
        if (!cambiosPorRecurso[recursoId]) {
          cambiosPorRecurso[recursoId] = {}
        }
        
        // La clave ya incluye la sucursal porque variantesData la contiene
        const key = generateVarianteKey(item.variantesData)
        
        if (!cambiosPorRecurso[recursoId][key]) {
          cambiosPorRecurso[recursoId][key] = {
            stock: item.stock,
            diferenciaPrecio: item.diferenciaPrecio,
            precioVariante: item.precioVariante
          }
        }
        
        // Calcular diferenciaPrecio y precioVariante actualizados
        const costeBase = recurso.coste || 0
        let diferenciaPrecioActual = changes.diferenciaPrecio !== undefined 
          ? changes.diferenciaPrecio 
          : item.diferenciaPrecio
        let precioVarianteActual = changes.precioVariante !== undefined
          ? changes.precioVariante
          : item.precioVariante
        
        // Si se actualizó precioVariante directamente, recalcular diferenciaPrecio
        if (changes.precioVariante !== undefined) {
          diferenciaPrecioActual = precioVarianteActual - costeBase
        }
        // Si se actualizó diferenciaPrecio, recalcular precioVariante
        else if (changes.diferenciaPrecio !== undefined) {
          precioVarianteActual = costeBase + diferenciaPrecioActual
        }
        
        // Actualizar con los cambios
        if (changes.stock !== undefined) {
          cambiosPorRecurso[recursoId][key].stock = changes.stock
        }
        if (changes.diferenciaPrecio !== undefined) {
          cambiosPorRecurso[recursoId][key].diferenciaPrecio = diferenciaPrecioActual
          cambiosPorRecurso[recursoId][key].precioVariante = precioVarianteActual
        }
        if (changes.precioVariante !== undefined) {
          cambiosPorRecurso[recursoId][key].precioVariante = precioVarianteActual
          cambiosPorRecurso[recursoId][key].diferenciaPrecio = diferenciaPrecioActual
        }
      })
      
      // Guardar cada recurso actualizado
      const promises = Object.entries(cambiosPorRecurso).map(async ([recursoId, datosPorVariante]) => {
        const recurso = items.find(r => r.id === recursoId)
        if (!recurso) return
        
        // Obtener estructura actual de Control de Stock
        let controlStock: any = {}
        try {
          if (recurso.control_stock) {
            if (typeof recurso.control_stock === 'string') {
              controlStock = JSON.parse(recurso.control_stock)
            } else {
              controlStock = recurso.control_stock
            }
          }
        } catch (e) {
          console.error('Error parseando Control de Stock:', e)
          controlStock = {}
        }
        
        // Actualizar Control de Stock con los nuevos valores
        // La clave ya incluye la sucursal: "Color:x|Grosor:y|Sucursal:La Paz"
        Object.entries(datosPorVariante).forEach(([keyVariante, datos]) => {
          controlStock[keyVariante] = {
            stock: datos.stock,
            diferenciaPrecio: datos.diferenciaPrecio,
            precioVariante: datos.precioVariante
          }
        })
        
        // Guardar en Airtable
        const response = await fetch(`/api/recursos/${recursoId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ control_stock: controlStock })
        })
        
        if (!response.ok) {
          throw new Error(`Error actualizando recurso ${recursoId}`)
        }
      })
      
      await Promise.all(promises)
      
      const count = Object.keys(pendingChanges).length
      setPendingChanges({})
      setEditedItems({})
      setSelected({})
      toast.success(`${count} item(s) actualizado(s) correctamente`)
      
      // Recargar datos
      await fetchRecursos()
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
    toast.info("Cambios descartados")
  }

  // Manejar cambios en campos individuales
  const handleFieldChange = (id: string, field: 'diferenciaPrecio' | 'stock' | 'precioVariante', value: string | number) => {
    const numValue = typeof value === 'string' ? (field === 'stock' ? parseInt(value) || 0 : parseFloat(value) || 0) : value
    
    const item = filteredItems.find(i => i.id === id)
    const recurso = item ? items.find(r => r.id === item.recursoId) : null
    const costeBase = recurso?.coste || 0
    
    // Si cambia diferenciaPrecio, también actualizar precioVariante
    const updates: Partial<AjusteInventarioItem> = { [field]: numValue }
    if (field === 'diferenciaPrecio') {
      // Calcular nuevo precioVariante
      const nuevaDiferencia = numValue as number
      const nuevoPrecioVariante = costeBase + nuevaDiferencia
      updates.precioVariante = nuevoPrecioVariante
    }
    
    // Si cambia precioVariante, también actualizar diferenciaPrecio
    if (field === 'precioVariante') {
      const nuevoPrecio = numValue as number
      const nuevaDiferencia = nuevoPrecio - costeBase
      updates.precioVariante = nuevoPrecio
      updates.diferenciaPrecio = nuevaDiferencia
    }
    
    setEditedItems(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        ...updates
      }
    }))
    
    // Si hay múltiples seleccionados, también agregar a pendingChanges
    if (selectedIds.length > 1) {
      setPendingChanges(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          ...updates
        }
      }))
    }
  }

  // Guardar cambios de un item individual (ahora solo agrega a pendingChanges, no guarda automáticamente)
  const handleSaveChanges = async (id: string) => {
    if (!editedItems[id]) return
    
    // Agregar cambios a pendingChanges pero no guardar automáticamente
    const item = filteredItems.find(i => i.id === id)
    if (item) {
      setPendingChanges(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          ...editedItems[id]
        }
      }))
    }
    
    setEditedItems(prev => {
      const newItems = { ...prev }
      delete newItems[id]
      return newItems
    })
    
    // No deseleccionar para que el usuario pueda seguir editando o guardar todos juntos
    toast.info('Cambios agregados. Presiona "Guardar" para confirmar.')
  }

  // Cancelar edición de un item individual
  const handleCancelEdit = (id: string) => {
    setEditedItems(prev => {
      const newItems = { ...prev }
      delete newItems[id]
      return newItems
    })
    setSelected(prev => ({ ...prev, [id]: false }))
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
                href="/panel/recursos" 
                className="text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
              >
                Recursos
              </Link>
              <Link 
                href="/panel/ajustes-inventario" 
                className="text-sm font-medium text-[#D54644] hover:text-[#D54644]/80 transition-colors"
              >
                Control de Stock
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
                      placeholder="Buscar por nombre o variante..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex gap-2 items-center">
                  <Select value={selectedSucursal} onValueChange={setSelectedSucursal}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filtrar por sucursal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las sucursales</SelectItem>
                      <SelectItem value="La Paz">La Paz</SelectItem>
                      <SelectItem value="Santa Cruz">Santa Cruz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de ajustes */}
        <Card>
          <CardHeader>
            <CardTitle>Control de Stock ({filteredItems.length})</CardTitle>
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
                    
                    {/* Campos de edición masiva */}
                    {selectedIds.length > 1 && (
                      <>
                        {/* Diferencia de precio */}
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-700">Diferencia Precio:</label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Cambiar diferencia"
                            className="h-8 w-32 text-right"
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0
                              handleBulkFieldChange('diferenciaPrecio', value)
                            }}
                          />
                        </div>

                        {/* Precio Variante */}
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-700">Precio Variante:</label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Cambiar precio"
                            className="h-8 w-32 text-right"
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0
                              handleBulkFieldChange('precioVariante', value)
                            }}
                          />
                        </div>

                        {/* Stock */}
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-700">Stock:</label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="Cambiar stock"
                            className="h-8 w-32 text-right"
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0
                              handleBulkFieldChange('stock', value)
                            }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div className="flex gap-2 items-center">
                    {Object.keys(pendingChanges).length > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleDiscardChanges}
                      >
                        Descartar
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      onClick={handleSaveBulkChanges}
                      disabled={savingChanges || Object.keys(pendingChanges).length === 0}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      {savingChanges ? "Guardando..." : "Guardar"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-center py-8 text-gray-500">Cargando control de stock...</div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm || selectedSucursal !== "all" ? "No se encontraron items" : "No hay items en el control de stock"}
              </div>
            ) : (
              <div className="overflow-x-auto">
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
                      <TableHead>Nombre</TableHead>
                      <TableHead className="w-24">Sucursal</TableHead>
                      <TableHead className="min-w-[200px]">Variantes</TableHead>
                      <TableHead className="w-20">Unidad</TableHead>
                      <TableHead className="text-center w-32">Diferencia Precio</TableHead>
                      <TableHead className="text-right w-28">Precio Variante</TableHead>
                      <TableHead className="text-right w-20">Stock</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="w-10">
                          <Checkbox
                            checked={!!selected[item.id]}
                            onCheckedChange={(v) =>
                              setSelected(prev => ({ ...prev, [item.id]: Boolean(v) }))
                            }
                            aria-label={`Seleccionar ${item.nombre}`}
                          />
                        </TableCell>
                        <TableCell className="max-w-[42ch]">
                          <div className="truncate">{item.nombre}</div>
                        </TableCell>
                        <TableCell className="w-24">
                          <Badge className={getSucursalBadgeClass(item.sucursal)}>
                            {item.sucursal}
                          </Badge>
                        </TableCell>
                        <TableCell className="min-w-[200px] max-w-[300px]">
                          <div className="text-sm text-gray-600 break-words">
                            {item.varianteCombinacion || "Sin variantes"}
                          </div>
                        </TableCell>
                        <TableCell className="w-20">
                          <Badge variant="secondary" className="bg-gray-200 text-gray-800 hover:bg-gray-200">
                            {item.unidad_medida || 'Sin unidad'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center w-32">
                          <div className="flex justify-center">
                            {selected[item.id] ? (
                              <Input
                                type="number"
                                step="0.01"
                                value={editedItems[item.id]?.diferenciaPrecio ?? pendingChanges[item.id]?.diferenciaPrecio ?? item.diferenciaPrecio}
                                onChange={(e) => handleFieldChange(item.id, 'diferenciaPrecio', e.target.value)}
                              className="h-8 w-24 text-center"
                              onBlur={() => {
                                // No guardar automáticamente, solo agregar a pendingChanges
                                if (editedItems[item.id]) {
                                  handleSaveChanges(item.id)
                                }
                              }}
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
                              <span className="text-black">
                                {(pendingChanges[item.id]?.diferenciaPrecio ?? item.diferenciaPrecio).toFixed(2)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right w-28">
                          <div className="flex justify-end">
                            {selected[item.id] ? (
                              <Input
                                type="number"
                                step="0.01"
                                value={editedItems[item.id]?.precioVariante ?? pendingChanges[item.id]?.precioVariante ?? item.precioVariante}
                                onChange={(e) => handleFieldChange(item.id, 'precioVariante', e.target.value)}
                                className="h-8 w-24 text-right"
                                onBlur={() => {
                                  // No guardar automáticamente, solo agregar a pendingChanges
                                  if (editedItems[item.id]) {
                                    handleSaveChanges(item.id)
                                  }
                                }}
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
                              <span className="font-medium text-green-600">
                                Bs {(
                                  pendingChanges[item.id]?.precioVariante ?? 
                                  editedItems[item.id]?.precioVariante ?? 
                                  item.precioVariante
                                ).toFixed(2)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right w-20">
                          <div className="flex justify-end">
                            {selected[item.id] ? (
                              <Input
                                type="number"
                                min="0"
                                value={editedItems[item.id]?.stock ?? pendingChanges[item.id]?.stock ?? item.stock}
                                onChange={(e) => handleFieldChange(item.id, 'stock', e.target.value)}
                              className="h-8 w-24 text-right"
                              onBlur={() => {
                                // No guardar automáticamente, solo agregar a pendingChanges
                                if (editedItems[item.id]) {
                                  handleSaveChanges(item.id)
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveChanges(item.id)
                                } else if (e.key === 'Escape') {
                                  handleCancelEdit(item.id)
                                }
                              }}
                            />
                            ) : (
                              <Badge className={(pendingChanges[item.id]?.stock ?? item.stock) > 0 ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-red-100 text-red-800 hover:bg-red-100"}>
                                {pendingChanges[item.id]?.stock ?? item.stock}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handlePrevPage}
                    disabled={currentPage === 1 || loading}
                  >
                    Anterior
                  </Button>
                  
                  {/* Mostrar páginas */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
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
                    disabled={currentPage === totalPages || loading}
                  >
                    Siguiente
                  </Button>
                </div>
                
                {/* Información de paginación */}
                <div className="ml-4 text-sm text-gray-600">
                  Mostrando {startIndex + 1} - {Math.min(endIndex, totalItems)} de {totalItems} items
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

