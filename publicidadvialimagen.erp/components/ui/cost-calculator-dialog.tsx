"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Calculator } from "lucide-react"
import { toast } from "sonner"

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

interface RecursoItem {
  id: string
  codigo: string
  nombre: string
  unidad_medida: string
  coste: number
  precio_venta?: number
  categoria: string
  cantidad: number
  disponibilidad?: string
  responsable?: string
}

interface CalculatorItem {
  id: string
  recurso: RecursoItem
  cantidad: number
  unidad: string
  coste_unitario: number
  coste_total: number
}

interface CostCalculatorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCalculate?: (total: number, items: CalculatorItem[]) => void
  product?: any
}

export function CostCalculatorDialog({ 
  open, 
  onOpenChange, 
  onCalculate,
  product 
}: CostCalculatorDialogProps) {
  const [recursos, setRecursos] = useState<RecursoItem[]>([])
  const [calculatorItems, setCalculatorItems] = useState<CalculatorItem[]>([])
  const [loading, setLoading] = useState(false)
  const [totalCost, setTotalCost] = useState(0)
  const [rows, setRows] = useState([{
    id: 1,
    selectedRecurso: null as RecursoItem | null,
    cantidad: 1,
    unidad: "",
    searchTerm: ""
  }])
  const [filteredRecursos, setFilteredRecursos] = useState<RecursoItem[]>([])
  const [showDropdown, setShowDropdown] = useState<number | null>(null)

  // Cargar recursos disponibles
  useEffect(() => {
    if (open) {
      fetchRecursos()
      // Resetear filas cuando se abre
      setRows([{
        id: 1,
        selectedRecurso: null,
        cantidad: 1,
        unidad: "",
        searchTerm: ""
      }])
      // Ocultar dropdown y limpiar filtros al abrir
      setShowDropdown(null)
      setFilteredRecursos([])
    }
  }, [open])

  // Calcular total cuando cambien los items o las cantidades en las filas
  useEffect(() => {
    const total = calculatorItems.reduce((sum, item) => sum + item.coste_total, 0)
    setTotalCost(total)
  }, [calculatorItems])

  // Recalcular total basado en las filas actuales (para mostrar total en tiempo real)
  useEffect(() => {
    const totalFromRows = rows.reduce((sum, row) => {
      if (row.selectedRecurso && row.cantidad > 0) {
        return sum + (row.selectedRecurso.coste * row.cantidad)
      }
      return sum
    }, 0)
    
    const totalFromItems = calculatorItems.reduce((sum, item) => sum + item.coste_total, 0)
    setTotalCost(totalFromRows + totalFromItems)
  }, [rows, calculatorItems])

  // No filtrar insumos automáticamente - solo cuando el usuario busque
  // useEffect removido para evitar mostrar dropdown automático

  // Cerrar dropdown cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.dropdown-container')) {
        setShowDropdown(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchRecursos = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/recursos')
      
      if (response.ok) {
        const result = await response.json()
        setRecursos(result.data || [])
      } else {
        console.error('Error al cargar recursos')
        toast.error('Error al cargar la lista de recursos')
      }
    } catch (error) {
      console.error('Error de conexión:', error)
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }


  const handleSearchChange = (rowId: number, searchTerm: string) => {
    setRows(prev => prev.map(row => 
      row.id === rowId 
        ? { ...row, searchTerm, selectedRecurso: null }
        : row
    ))
    
    // Solo mostrar dropdown si hay texto de búsqueda
    if (searchTerm.trim().length > 0) {
      // Filtrar recursos basado en el término de búsqueda
      const filtered = recursos.filter(recurso => 
        recurso.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recurso.codigo.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredRecursos(filtered)
      setShowDropdown(rowId)
    } else {
      // Si no hay texto, ocultar dropdown
      setShowDropdown(null)
    }
  }


  const handleRecursoSelect = (rowId: number, recurso: RecursoItem) => {
    setRows(prev => prev.map(row => 
      row.id === rowId 
        ? { 
            ...row, 
            selectedRecurso: recurso, 
            unidad: recurso.unidad_medida,
            searchTerm: recurso.nombre
          }
        : row
    ))
    setShowDropdown(null)
    
    // Añadir automáticamente a la calculadora
    setTimeout(() => {
      handleAddItem(rowId)
    }, 100)
  }


  const handleRowChange = (rowId: number, field: string, value: any) => {
    setRows(prev => prev.map(row => 
      row.id === rowId 
        ? { ...row, [field]: value }
        : row
    ))
  }


  const handleAddRow = () => {
    const newRowId = Math.max(...rows.map(r => r.id)) + 1
    setRows(prev => [...prev, {
      id: newRowId,
      selectedRecurso: null,
      cantidad: 1,
      unidad: "",
      searchTerm: ""
    }])
  }


  const handleRemoveRow = (rowId: number) => {
    if (rows.length > 1) {
      setRows(prev => prev.filter(row => row.id !== rowId))
    }
  }


  const handleAddItem = (rowId: number) => {
    const row = rows.find(r => r.id === rowId)
    
    if (!row || !row.selectedRecurso || row.cantidad <= 0) {
      toast.warning('Completa la fila con recurso y cantidad')
      return
    }

    const newItem: CalculatorItem = {
      id: `calc_${Date.now()}_${rowId}`,
      recurso: row.selectedRecurso,
      cantidad: row.cantidad,
      unidad: row.unidad,
      coste_unitario: row.selectedRecurso.coste,
      coste_total: row.selectedRecurso.coste * row.cantidad
    }

    setCalculatorItems(prev => [...prev, newItem])
    toast.success(`${row.selectedRecurso.nombre} añadido a la calculadora`)
    
    // Limpiar la fila actual
    setRows(prev => prev.map(r => 
      r.id === rowId 
        ? { ...r, selectedRecurso: null, cantidad: 1, unidad: "", searchTerm: "" }
        : r
    ))
  }


  const handleRemoveItem = (itemId: string) => {
    setCalculatorItems(prev => prev.filter(item => item.id !== itemId))
    toast.info('Item eliminado de la calculadora')
  }


  const handleQuantityChange = (itemId: string, cantidad: number) => {
    if (cantidad < 0) return

    setCalculatorItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const coste_total = item.coste_unitario * cantidad
        return { ...item, cantidad, coste_total }
      }
      return item
    }))
  }


  const handleUnitChange = (itemId: string, unidad: string) => {
    setCalculatorItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, unidad }
      }
      return item
    }))
  }


  const handleCalculate = () => {
    if (calculatorItems.length === 0) {
      toast.warning('Añade al menos un recurso para calcular')
      return
    }

    if (onCalculate) {
      onCalculate(totalCost, calculatorItems)
    }
    
    toast.success(`Total calculado: Bs ${totalCost.toFixed(2)}`)
  }

  const handleClear = () => {
    setCalculatorItems([])
    toast.info('Calculadora limpiada')
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-8xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calculadora de Costes (Receta)
          </DialogTitle>
          <DialogDescription>
            Añade recursos y calcula el coste total de tu proyecto
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Sección de selección de recursos */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Producto (1m²): {product?.nombre || 'Sin producto seleccionado'}</Label>
            </div>
            
            <div className={`space-y-4 ${rows.length >= 4 ? 'max-h-80 overflow-y-auto pr-2' : ''}`}>
              {/* Filas dinámicas */}
              {rows.map((row, index) => (
                <div key={row.id} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                    {/* Buscador de recursos */}
                    <div className="space-y-2 md:col-span-4 relative dropdown-container">
                      {index === 0 && <Label>Recurso</Label>}
                      <Input
                        placeholder="Buscar recurso..."
                        value={row.searchTerm}
                        onChange={(e) => handleSearchChange(row.id, e.target.value)}
                        onFocus={() => setShowDropdown(row.id)}
                      />
                      
                      {/* Dropdown de resultados */}
                      {showDropdown === row.id && filteredRecursos.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {filteredRecursos.map((recurso) => (
                            <div
                              key={recurso.id}
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                              onClick={() => handleRecursoSelect(row.id, recurso)}
                            >
                              <div className="font-medium text-sm">{recurso.nombre}</div>
                              <div className="text-xs text-gray-500">{recurso.codigo} | {recurso.categoria}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Cantidad */}
                    <div className="space-y-2 md:col-span-2">
                      {index === 0 && <Label>Cantidad</Label>}
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.cantidad}
                        onChange={(e) => handleRowChange(row.id, 'cantidad', parseFloat(e.target.value) || 0)}
                        placeholder="1"
                      />
                    </div>

                    {/* Unidad */}
                    <div className="space-y-2 md:col-span-2">
                      {index === 0 && <Label>Unidad</Label>}
                      <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background bg-gray-50 items-center">
                        {row.unidad || ''}
                      </div>
                    </div>

                    {/* Precio */}
                    <div className="space-y-2 md:col-span-2">
                      {index === 0 && <Label>Precio</Label>}
                      <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background bg-gray-50 items-center">
                        {row.selectedRecurso ? `Bs ${(row.selectedRecurso.coste * row.cantidad).toFixed(2)}` : ''}
                      </div>
                    </div>

                    {/* Botón eliminar fila */}
                    <div className="md:col-span-2">
                      <div className={`flex items-center justify-start h-10 ${index === 0 ? 'mt-6' : ''}`}>
                        {rows.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveRow(row.id)}
                            className="h-10 w-10 p-0 text-red-600 hover:text-red-700 hover:bg-transparent -ml-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>


                </div>
              ))}

              {/* Botón añadir línea */}
              <div className="flex justify-start">
                <Button
                  onClick={handleAddRow}
                  variant="outline"
                  className="w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir Línea
                </Button>
              </div>
            </div>
          </div>

        </div>

        {/* Total */}
        <div className="border-t pt-4 mt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xl font-bold">
              Total: <span className="text-red-600">Bs {totalCost.toFixed(2)}</span>
            </div>
            <Button
              onClick={handleCalculate}
              disabled={calculatorItems.length === 0}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Calculator className="h-4 w-4 mr-2" />
              Calcular Total
            </Button>
          </div>

          {calculatorItems.length > 0 && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={handleClear}
              >
                Limpiar Todo
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
