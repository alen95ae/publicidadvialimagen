"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calculator, Plus, Trash2 } from "lucide-react"

interface CostRow {
  id: number
  selectedRecurso: any
  cantidad: number
  unidad: string
  searchTerm: string
}

interface CostCalculatorProps {
  productoNombre: string
  costRows: CostRow[]
  filteredRecursos: any[]
  showCostDropdown: number | null
  obtenerPrecioRecurso: (recurso: any) => number | null
  handleCostSearchChange: (rowId: number, searchTerm: string) => void
  setShowCostDropdown: (rowId: number | null) => void
  handleRecursoSelect: (rowId: number, recurso: any) => void
  handleCostRowChange: (rowId: number, field: string, value: any) => void
  handleRemoveCostRow: (rowId: number) => void
  handleAddCostRow: () => void
}

export function CostCalculator({
  productoNombre,
  costRows,
  filteredRecursos,
  showCostDropdown,
  obtenerPrecioRecurso,
  handleCostSearchChange,
  setShowCostDropdown,
  handleRecursoSelect,
  handleCostRowChange,
  handleRemoveCostRow,
  handleAddCostRow
}: CostCalculatorProps) {
  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Calculadora de Costes (Receta)
        </CardTitle>
        <CardDescription>Añade recursos y calcula el coste total</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600 mb-2">
          Producto: {productoNombre}
        </div>
        
        <div className="space-y-3">
          {costRows.map((row, index) => {
            return (
              <div key={`cost-row-${row.id}-${index}`} className="space-y-2">
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-4 relative dropdown-container">
                    {index === 0 && <Label className="text-xs">Recurso</Label>}
                    <Input
                      placeholder="Buscar recurso..."
                      value={row.searchTerm}
                      onChange={(e) => handleCostSearchChange(row.id, e.target.value)}
                      onFocus={() => setShowCostDropdown(row.id)}
                      className="h-9 text-sm"
                    />
                    {showCostDropdown === row.id && filteredRecursos.length > 0 && (
                      <div className="absolute z-[999] w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {filteredRecursos.map((recurso: any) => (
                          <div
                            key={recurso.id}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 text-sm"
                            onClick={() => handleRecursoSelect(row.id, recurso)}
                          >
                            <div className="font-medium">{recurso.nombre}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="col-span-2">
                    {index === 0 && <Label className="text-xs">Cantidad</Label>}
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.cantidad}
                      onChange={(e) => handleCostRowChange(row.id, 'cantidad', parseFloat(e.target.value) || 0)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    {index === 0 && <Label className="text-xs">Unidad</Label>}
                    <div className="flex h-9 w-full rounded-md border border-input bg-gray-50 px-3 py-2 text-sm items-center">
                      {row.unidad || '-'}
                    </div>
                  </div>
                  <div className="col-span-3">
                    {index === 0 && <Label className="text-xs">Total</Label>}
                    <div className="flex h-9 w-full rounded-md border border-input bg-gray-50 px-3 py-2 text-sm items-center">
                      {row.selectedRecurso ? (() => {
                        const precioReal = obtenerPrecioRecurso(row.selectedRecurso)
                        if (precioReal === null) {
                          return '-'
                        }
                        const total = precioReal * row.cantidad
                        return `Bs ${total.toFixed(2)}`
                      })() : '-'}
                    </div>
                  </div>
                  <div className="col-span-1">
                    {index === 0 && <div className="h-5"></div>}
                    {costRows.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCostRow(row.id)}
                        className="h-9 w-9 p-0 text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
          
          <Button onClick={handleAddCostRow} variant="outline" size="sm" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Añadir Línea
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}





