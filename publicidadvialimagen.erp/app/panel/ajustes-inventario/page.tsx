"use client"

import type React from "react"
import Link from "next/link"
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  MapPin,
  X,
  Filter
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
import { usePermisosContext } from "@/hooks/permisos-provider"
import { ProtectRoute } from "@/components/protect-route"
import { normalizeText } from "@/lib/utils"

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
  tipo?: 'recurso' | 'consumible' // Tipo de item
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

function AjustesInventarioPageContent() {
  const router = useRouter()
  const { puedeEditar } = usePermisosContext()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSucursal, setSelectedSucursal] = useState<string>("all")
  const [selectedCategoria, setSelectedCategoria] = useState<string>("all")
  const [items, setItems] = useState<any[]>([])
  const [consumibles, setConsumibles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [editedItems, setEditedItems] = useState<Record<string, Partial<AjusteInventarioItem>>>({})
  const [pendingChanges, setPendingChanges] = useState<Record<string, Partial<AjusteInventarioItem>>>({})
  const [savingChanges, setSavingChanges] = useState(false)
  // Estado para valores de escritura libre (strings) mientras se edita
  const [inputValues, setInputValues] = useState<Record<string, { diferenciaPrecio?: string, precioVariante?: string, stock?: string }>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 100
  const [filtersLoaded, setFiltersLoaded] = useState(false)

  // 1) Cargar los filtros una sola vez al montar
  useEffect(() => {
    const saved = sessionStorage.getItem("control_stock_filtros")
    
    if (saved) {
      try {
        const f = JSON.parse(saved)
        setSearchTerm(f.searchTerm ?? "")
        setSelectedSucursal(f.selectedSucursal ?? "all")
        setSelectedCategoria(f.selectedCategoria ?? "all")
      } catch (error) {
        console.error('❌ Error parseando filtros guardados:', error)
      }
    }
    
    setFiltersLoaded(true)
  }, [])

  // 2) Guardar los filtros cuando cambien
  useEffect(() => {
    if (!filtersLoaded) return
    
    sessionStorage.setItem("control_stock_filtros", JSON.stringify({
      searchTerm,
      selectedSucursal,
      selectedCategoria
    }))
  }, [searchTerm, selectedSucursal, selectedCategoria, filtersLoaded])

  // Función para eliminar un filtro específico
  const eliminarFiltro = (tipo: 'busqueda' | 'sucursal' | 'categoria') => {
    switch (tipo) {
      case 'busqueda':
        setSearchTerm("")
        break
      case 'sucursal':
        setSelectedSucursal("all")
        break
      case 'categoria':
        setSelectedCategoria("all")
        break
    }
  }

  // Función para limpiar todos los filtros
  const limpiarTodosFiltros = () => {
    setSearchTerm("")
    setSelectedSucursal("all")
    setSelectedCategoria("all")
    sessionStorage.removeItem('control_stock_filtros')
  }

  // Cargar datos de recursos
  useEffect(() => {
    if (filtersLoaded) {
      fetchRecursos()
    }
  }, [filtersLoaded])

  const fetchRecursos = async () => {
    try {
      setLoading(true)
      
      // Cargar recursos
      const recursosResponse = await fetch('/api/recursos?limit=1000')
      if (recursosResponse.ok) {
        const recursosResult = await recursosResponse.json()
        setItems(recursosResult.data || [])
      } else {
        console.error('Error al cargar recursos')
        setItems([])
      }
      
      // Cargar consumibles
      const consumiblesResponse = await fetch('/api/consumibles?limit=1000')
      if (consumiblesResponse.ok) {
        const consumiblesResult = await consumiblesResponse.json()
        setConsumibles(consumiblesResult.data || [])
      } else {
        console.error('Error al cargar consumibles')
        setConsumibles([])
      }
    } catch (error) {
      console.error('Error de conexión:', error)
      setItems([])
      setConsumibles([])
    } finally {
      setLoading(false)
    }
  }

  // Generar items de ajuste de inventario
  const ajustesItems = useMemo(() => {
    const ajustes: AjusteInventarioItem[] = []

    // Filtrar solo recursos con categoría "Insumos"
    const recursosInsumos = items.filter(item => item.categoria === "Insumos")

    // Procesar recursos (Unimos)
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
            variantesData: combinacionConSucursal, // Incluye sucursal en los datos
            tipo: 'recurso' // Marcar como recurso
          })
        })
      })
    })

    // Procesar consumibles (sin variantes, solo por sucursal)
    consumibles.forEach(consumible => {
      // Obtener sucursales del consumible si existe el campo, sino usar las por defecto
      const sucursales = consumible.sucursal 
        ? (Array.isArray(consumible.sucursal) ? consumible.sucursal : [consumible.sucursal])
        : SUCURSALES_DEFAULT

      // Los consumibles no tienen variantes, solo se duplican por sucursal
      sucursales.forEach((sucursal: string) => {
        const id = `consumible-${consumible.id}-${sucursal}`

        // Obtener stock, precio variante y diferencia de precio desde Control de Stock
        const stockVariante = getStockFromControlStock(consumible, {}, sucursal)
        const precioVarianteData = getPrecioVarianteFromControlStock(consumible, {}, sucursal)
        const diferenciaPrecio = precioVarianteData.diferencia || 0
        const precioVariante = precioVarianteData.precio || consumible.coste || 0

        // Crear combinación con sucursal incluida
        const combinacionConSucursal = { Sucursal: sucursal }
        
        ajustes.push({
          id,
          recursoId: consumible.id,
          codigo: consumible.codigo,
          nombre: consumible.nombre,
          sucursal,
          varianteCombinacion: "Sin variantes",
          unidad_medida: consumible.unidad_medida || '',
          diferenciaPrecio,
          precioVariante,
          stock: stockVariante,
          variantesData: combinacionConSucursal,
          tipo: 'consumible' // Marcar como consumible
        })
      })
    })

    return ajustes
  }, [items, consumibles])

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
          const diferencia = Math.round((datosVariante.diferenciaPrecio || 0) * 100) / 100
          // Si hay precioVariante guardado, usarlo; sino calcularlo
          const precio = datosVariante.precioVariante !== undefined
            ? Math.round(datosVariante.precioVariante * 100) / 100
            : Math.round(((recurso.coste || 0) + diferencia) * 100) / 100
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

  // Filtrar items basado en búsqueda y sucursal con normalización flexible
  const filteredItems = ajustesItems.filter(item => {
    // Búsqueda flexible con normalización
    let matchesSearch = true
    if (searchTerm && searchTerm.trim() !== '') {
      const normalizedSearch = normalizeText(searchTerm.trim())
      const normalizedNombre = normalizeText(item.nombre || '')
      const normalizedVariante = normalizeText(item.varianteCombinacion || '')
      
      matchesSearch = normalizedNombre.includes(normalizedSearch) ||
        normalizedVariante.includes(normalizedSearch)
    }
    
    const matchesSucursal = selectedSucursal === "all" || item.sucursal === selectedSucursal
    
    // Filtro por categoría
    let matchesCategoria = true
    if (selectedCategoria !== "all") {
      if (selectedCategoria === "Unimos") {
        matchesCategoria = item.tipo !== 'consumible'
      } else if (selectedCategoria === "Consumibles") {
        matchesCategoria = item.tipo === 'consumible'
      }
    }
    
    return matchesSearch && matchesSucursal && matchesCategoria
  })

  // Calcular paginación
  const totalItems = filteredItems.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedItems = filteredItems.slice(startIndex, endIndex)

  // Resetear a página 1 cuando cambian los filtros
  useEffect(() => {
    if (!filtersLoaded) return
    setCurrentPage(1)
  }, [searchTerm, selectedSucursal, selectedCategoria, filtersLoaded])

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
      
      // Todos los campos (diferenciaPrecio, precioVariante y stock) redondean a 2 decimales
      const processedValue = Math.round(parseFloat(value) * 100) / 100 || 0
      
      const fieldUpdates: Partial<AjusteInventarioItem> = {
        ...(pendingChanges[id] || {}),
        [field]: processedValue
      }
      
      // Si cambia diferenciaPrecio, también actualizar precioVariante
      if (field === 'diferenciaPrecio') {
        const nuevaDiferencia = processedValue
        fieldUpdates.precioVariante = Math.round((costeBase + nuevaDiferencia) * 100) / 100
      }
      
      // Si cambia precioVariante, también actualizar diferenciaPrecio
      if (field === 'precioVariante') {
        const nuevoPrecio = processedValue
        const nuevaDiferencia = Math.round((nuevoPrecio - costeBase) * 100) / 100
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
        
        // Buscar en recursos o consumibles según el tipo
        const recurso = item.tipo === 'consumible' 
          ? consumibles.find(c => c.id === item.recursoId)
          : items.find(r => r.id === item.recursoId)
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
          diferenciaPrecioActual = Math.round((precioVarianteActual - costeBase) * 100) / 100
        }
        // Si se actualizó diferenciaPrecio, recalcular precioVariante
        else if (changes.diferenciaPrecio !== undefined) {
          precioVarianteActual = Math.round((costeBase + diferenciaPrecioActual) * 100) / 100
        }
        
        // Redondear valores antes de guardar
        diferenciaPrecioActual = Math.round(diferenciaPrecioActual * 100) / 100
        precioVarianteActual = Math.round(precioVarianteActual * 100) / 100
        
        // Actualizar con los cambios
        if (changes.stock !== undefined) {
          cambiosPorRecurso[recursoId][key].stock = Math.round(changes.stock * 100) / 100
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
      
      // Guardar cada recurso/consumible actualizado
      const promises = Object.entries(cambiosPorRecurso).map(async ([recursoId, datosPorVariante]) => {
        // Determinar si es consumible o recurso
        const item = filteredItems.find(i => i.recursoId === recursoId)
        const esConsumible = item?.tipo === 'consumible'
        
        const recurso = esConsumible
          ? consumibles.find(c => c.id === recursoId)
          : items.find(r => r.id === recursoId)
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
        
        // Guardar en Supabase (recursos o consumibles)
        const endpoint = esConsumible ? `/api/consumibles/${recursoId}` : `/api/recursos/${recursoId}`
        const response = await fetch(endpoint, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ control_stock: controlStock })
        })
        
        if (!response.ok) {
          let errorData: any = {}
          try {
            const responseText = await response.text()
            if (responseText) {
              errorData = JSON.parse(responseText)
            }
          } catch (e) {
            console.error('Error parseando respuesta de error:', e)
          }
          
          // Construir mensaje de error detallado
          let errorMessage = `Error actualizando ${esConsumible ? 'consumible' : 'recurso'} ${recursoId}`
          
          if (errorData.error) {
            errorMessage = errorData.error
          } else if (errorData.message) {
            errorMessage = errorData.message
          }
          
          // Si es un error de Supabase, mostrar detalles
          if (errorData.details) {
            if (errorData.details.code) {
              errorMessage = `Error de Supabase (${errorData.details.code}): ${errorMessage}`
              if (errorData.details.details) {
                errorMessage += ` - ${errorData.details.details}`
              }
              if (errorData.details.hint) {
                errorMessage += ` (${errorData.details.hint})`
              }
            }
          }
          
          console.error(`❌ Error actualizando ${esConsumible ? 'consumible' : 'recurso'} ${recursoId}:`, {
            status: response.status,
            statusText: response.statusText,
            errorData: errorData
          })
          
          throw new Error(errorMessage)
        }
      })
      
      await Promise.all(promises)
      
      const count = Object.keys(pendingChanges).length
      setPendingChanges({})
      setEditedItems({})
      setInputValues({})
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
    setInputValues({})
    toast.info("Cambios descartados")
  }

  // Función para validar y formatear número con máximo 2 decimales
  const validateNumberInput = (value: string, currentValue: string = ''): string => {
    // Permitir vacío para poder borrar
    if (value === '' || value === '-') return value
    
    // Reemplazar coma por punto
    value = value.replace(',', '.')
    
    // Solo permitir números, un punto decimal y signo negativo al inicio
    const validPattern = /^-?\d*\.?\d{0,2}$/
    if (!validPattern.test(value)) {
      // Si no es válido, retornar el valor anterior
      return currentValue
    }
    
    return value
  }

  // Manejar cambios en campos individuales (escritura libre)
  const handleFieldChange = (id: string, field: 'diferenciaPrecio' | 'stock' | 'precioVariante', value: string) => {
    const item = filteredItems.find(i => i.id === id)
    if (!item) return
    
    // Obtener el valor actual del input
    const currentInputValue = inputValues[id]?.[field] ?? (() => {
      const val = editedItems[id]?.[field] ?? pendingChanges[id]?.[field] ?? (field === 'diferenciaPrecio' ? item.diferenciaPrecio : field === 'precioVariante' ? item.precioVariante : item.stock)
      return typeof val === 'number' ? val.toFixed(2) : String(val || '0.00')
    })()
    
    // Validar el input
    const validatedValue = validateNumberInput(value, currentInputValue)
    
    // Guardar el valor como string para escritura libre
    setInputValues(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: validatedValue
      }
    }))
    
    // Convertir a número solo si es válido
    const numValue = validatedValue === '' || validatedValue === '-' ? 0 : parseFloat(validatedValue) || 0
    const roundedValue = Math.round(numValue * 100) / 100
    const recurso = item ? items.find(r => r.id === item.recursoId) : null
    const costeBase = recurso?.coste || 0
    
    // Si cambia diferenciaPrecio, también actualizar precioVariante
    const updates: Partial<AjusteInventarioItem> = { [field]: roundedValue }
    if (field === 'diferenciaPrecio') {
      // Calcular nuevo precioVariante
      const nuevaDiferencia = roundedValue
      const nuevoPrecioVariante = Math.round((costeBase + nuevaDiferencia) * 100) / 100
      updates.precioVariante = nuevoPrecioVariante
      // Actualizar también el input value de precioVariante
      setInputValues(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          precioVariante: nuevoPrecioVariante.toFixed(2)
        }
      }))
    }
    
    // Si cambia precioVariante, también actualizar diferenciaPrecio
    if (field === 'precioVariante') {
      const nuevoPrecio = roundedValue
      const nuevaDiferencia = Math.round((nuevoPrecio - costeBase) * 100) / 100
      updates.precioVariante = nuevoPrecio
      updates.diferenciaPrecio = nuevaDiferencia
      // Actualizar también el input value de diferenciaPrecio
      setInputValues(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          diferenciaPrecio: nuevaDiferencia.toFixed(2)
        }
      }))
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

  // Función para formatear valor al perder el foco
  const handleFieldBlur = (id: string, field: 'diferenciaPrecio' | 'stock' | 'precioVariante') => {
    const inputValue = inputValues[id]?.[field]
    if (inputValue !== undefined) {
      const numValue = inputValue === '' || inputValue === '-' ? 0 : parseFloat(inputValue) || 0
      const formattedValue = Math.round(numValue * 100) / 100
      
      // Actualizar el input value con formato
      setInputValues(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          [field]: formattedValue.toFixed(2)
        }
      }))
      
      // Guardar cambios si hay edición
      if (editedItems[id]) {
        handleSaveChanges(id)
      }
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
    // Limpiar valores de input
    setInputValues(prev => {
      const newValues = { ...prev }
      delete newValues[id]
      return newValues
    })
    setSelected(prev => ({ ...prev, [id]: false }))
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
              {(searchTerm || selectedSucursal !== "all" || selectedCategoria !== "all") && (
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
                  
                  {selectedSucursal !== "all" && (
                    <div className="flex items-center gap-1 bg-purple-100 hover:bg-purple-200 rounded-full px-3 py-1 text-sm">
                      <span className="font-medium">Sucursal:</span>
                      <span className="text-gray-700">{selectedSucursal}</span>
                      <button
                        type="button"
                        onClick={() => eliminarFiltro('sucursal')}
                        className="ml-1 hover:text-red-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  
                  {selectedCategoria !== "all" && (
                    <div className="flex items-center gap-1 bg-green-100 hover:bg-green-200 rounded-full px-3 py-1 text-sm">
                      <span className="font-medium">Categoría:</span>
                      <span className="text-gray-700">{selectedCategoria}</span>
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
                      placeholder="Buscar por nombre o variante..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex gap-2 items-center">
                  <Select value={selectedSucursal} onValueChange={setSelectedSucursal}>
                    <SelectTrigger className="w-[200px] [&>span]:text-black !pl-9 !pr-3 relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none z-10" />
                      <SelectValue placeholder="Filtrar por sucursal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Sucursal</SelectItem>
                      <SelectItem value="La Paz">La Paz</SelectItem>
                      <SelectItem value="Santa Cruz">Santa Cruz</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
                    <SelectTrigger className="w-[200px] [&>span]:text-black !pl-9 !pr-3 relative">
                      <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none z-10" />
                      <SelectValue placeholder="Filtrar por categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Categorías</SelectItem>
                      <SelectItem value="Unimos">Unimos</SelectItem>
                      <SelectItem value="Consumibles">Consumibles</SelectItem>
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
            {someSelected && puedeEditar("inventario") && (
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
                            type="text"
                            inputMode="decimal"
                            placeholder="Cambiar diferencia"
                            className="h-8 w-32 text-right"
                            onChange={(e) => {
                              const value = validateNumberInput(e.target.value, '')
                              if (value !== '') {
                                handleBulkFieldChange('diferenciaPrecio', value)
                              }
                            }}
                          />
                        </div>

                        {/* Precio Variante */}
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-700">Precio Variante:</label>
                          <Input
                            type="text"
                            inputMode="decimal"
                            placeholder="Cambiar precio"
                            className="h-8 w-32 text-right"
                            onChange={(e) => {
                              const value = validateNumberInput(e.target.value, '')
                              if (value !== '') {
                                handleBulkFieldChange('precioVariante', value)
                              }
                            }}
                          />
                        </div>

                        {/* Stock */}
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-700">Stock:</label>
                          <Input
                            type="text"
                            inputMode="decimal"
                            placeholder="Cambiar stock"
                            className="h-8 w-32 text-right"
                            onChange={(e) => {
                              const value = validateNumberInput(e.target.value, '')
                              if (value !== '') {
                                handleBulkFieldChange('stock', value)
                              }
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
                {searchTerm || selectedSucursal !== "all" || selectedCategoria !== "all" ? "No se encontraron items" : "No hay items en el control de stock"}
              </div>
            ) : (
              <div className="overflow-x-auto">
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
                          {puedeEditar("inventario") && (
                            <Checkbox
                              checked={!!selected[item.id]}
                              onCheckedChange={(v) => {
                                const isSelected = Boolean(v)
                                setSelected(prev => ({ ...prev, [item.id]: isSelected }))
                                
                                // Inicializar valores de input cuando se selecciona
                                if (isSelected) {
                                  setInputValues(prev => ({
                                    ...prev,
                                    [item.id]: {
                                      diferenciaPrecio: (pendingChanges[item.id]?.diferenciaPrecio ?? item.diferenciaPrecio).toFixed(2),
                                      precioVariante: (pendingChanges[item.id]?.precioVariante ?? item.precioVariante).toFixed(2),
                                      stock: (pendingChanges[item.id]?.stock ?? item.stock).toFixed(2)
                                    }
                                  }))
                                } else {
                                  // Limpiar valores cuando se deselecciona
                                  setInputValues(prev => {
                                    const newValues = { ...prev }
                                    delete newValues[item.id]
                                    return newValues
                                  })
                                  // También limpiar ediciones
                                  setEditedItems(prev => {
                                    const newItems = { ...prev }
                                    delete newItems[item.id]
                                    return newItems
                                  })
                                }
                              }}
                              aria-label={`Seleccionar ${item.nombre}`}
                            />
                          )}
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
                            {selected[item.id] && puedeEditar("inventario") ? (
                              <Input
                                type="text"
                                inputMode="decimal"
                                value={inputValues[item.id]?.diferenciaPrecio ?? (() => {
                                  const val = editedItems[item.id]?.diferenciaPrecio ?? pendingChanges[item.id]?.diferenciaPrecio ?? item.diferenciaPrecio
                                  return typeof val === 'number' ? val.toFixed(2) : String(val || '0.00')
                                })()}
                                onChange={(e) => handleFieldChange(item.id, 'diferenciaPrecio', e.target.value)}
                                className="h-8 w-24 text-center"
                                onBlur={() => handleFieldBlur(item.id, 'diferenciaPrecio')}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleFieldBlur(item.id, 'diferenciaPrecio')
                                    handleSaveChanges(item.id)
                                  } else if (e.key === 'Escape') {
                                    handleCancelEdit(item.id)
                                  }
                                }}
                                autoFocus
                              />
                            ) : (
                              <span className="text-black">
                                {(() => {
                                  const val = pendingChanges[item.id]?.diferenciaPrecio ?? item.diferenciaPrecio
                                  return typeof val === 'number' ? val.toFixed(2) : parseFloat(val || 0).toFixed(2)
                                })()}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right w-28">
                          <div className="flex justify-end">
                            {selected[item.id] && puedeEditar("inventario") ? (
                              <Input
                                type="text"
                                inputMode="decimal"
                                value={inputValues[item.id]?.precioVariante ?? (() => {
                                  const val = editedItems[item.id]?.precioVariante ?? pendingChanges[item.id]?.precioVariante ?? item.precioVariante
                                  return typeof val === 'number' ? val.toFixed(2) : String(val || '0.00')
                                })()}
                                onChange={(e) => handleFieldChange(item.id, 'precioVariante', e.target.value)}
                                className="h-8 w-24 text-right"
                                onBlur={() => handleFieldBlur(item.id, 'precioVariante')}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleFieldBlur(item.id, 'precioVariante')
                                    handleSaveChanges(item.id)
                                  } else if (e.key === 'Escape') {
                                    handleCancelEdit(item.id)
                                  }
                                }}
                                autoFocus
                              />
                            ) : (
                              <span className="font-medium text-green-600">
                                Bs {(() => {
                                  const val = pendingChanges[item.id]?.precioVariante ?? 
                                    editedItems[item.id]?.precioVariante ?? 
                                    item.precioVariante
                                  return typeof val === 'number' ? val.toFixed(2) : parseFloat(val || 0).toFixed(2)
                                })()}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right w-20">
                          <div className="flex justify-end">
                            {selected[item.id] && puedeEditar("inventario") ? (
                              <Input
                                type="text"
                                inputMode="decimal"
                                value={inputValues[item.id]?.stock ?? (() => {
                                  const val = editedItems[item.id]?.stock ?? pendingChanges[item.id]?.stock ?? item.stock
                                  return typeof val === 'number' ? val.toFixed(2) : String(val || '0.00')
                                })()}
                                onChange={(e) => handleFieldChange(item.id, 'stock', e.target.value)}
                                className="h-8 w-24 text-right"
                                onBlur={() => handleFieldBlur(item.id, 'stock')}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleFieldBlur(item.id, 'stock')
                                    handleSaveChanges(item.id)
                                  } else if (e.key === 'Escape') {
                                    handleCancelEdit(item.id)
                                  }
                                }}
                                autoFocus
                              />
                            ) : (
                              <Badge className={(() => {
                                const stockValue = pendingChanges[item.id]?.stock ?? item.stock
                                const numValue = typeof stockValue === 'number' ? stockValue : parseFloat(stockValue || 0)
                                if (numValue > 0) {
                                  return "bg-green-100 text-green-800 hover:bg-green-100"
                                } else if (numValue === 0) {
                                  return "bg-gray-100 text-gray-800 hover:bg-gray-100"
                                } else {
                                  return "bg-red-100 text-red-800 hover:bg-red-100"
                                }
                              })()}>
                                {(() => {
                                  const val = pendingChanges[item.id]?.stock ?? item.stock
                                  return typeof val === 'number' ? val.toFixed(2) : parseFloat(val || 0).toFixed(2)
                                })()}
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

export default function AjustesInventarioPage() {
  return (
    <ProtectRoute modulo="inventario" accion="ver">
      <AjustesInventarioPageContent />
    </ProtectRoute>
  )
}

