"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Trash2, DollarSign } from "lucide-react"
import { toast } from "sonner"

interface PriceRow {
  id: number
  campo: string
  porcentaje: number | string
  valor: number | string
}

interface PriceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCalculate?: (total: number, items: PriceRow[]) => void
  product?: any
}

export function PriceDialog({ 
  open, 
  onOpenChange, 
  onCalculate,
  product 
}: PriceDialogProps) {
  const firstInputRef = useRef<HTMLInputElement | null>(null)
  const firstValueRef = useRef<HTMLInputElement | null>(null)
  
  const [rows, setRows] = useState<PriceRow[]>([
    { id: 1, campo: "Coste", porcentaje: 0, valor: 0 },
    { id: 2, campo: "Utilidad (U)", porcentaje: 28, valor: 0 },
    { id: 3, campo: "Factura (F)", porcentaje: 18, valor: 0 },
    { id: 4, campo: "Comisión (C)", porcentaje: 8, valor: 0 }
  ])

  // Calcular total con useMemo (optimización)
  const totalPrice = useMemo(() => {
    return rows.reduce((sum, row) => {
      const valor = typeof row.valor === 'string' ? parseFloat(row.valor) || 0 : row.valor
      return sum + valor
    }, 0)
  }, [rows])

  // Extraer coste para dependencia limpia
  const coste = useMemo(() => {
    const costeRow = rows.find(row => row.campo === "Coste")
    if (!costeRow) return 0
    return typeof costeRow.valor === 'string' ? parseFloat(costeRow.valor) || 0 : costeRow.valor
  }, [rows])

  // Resetear filas cuando se abre
  useEffect(() => {
    if (open) {
      setRows([
        { id: 1, campo: "Coste", porcentaje: 0, valor: product?.coste || 0 },
        { id: 2, campo: "Utilidad (U)", porcentaje: 28, valor: 0 },
        { id: 3, campo: "Factura (F)", porcentaje: 18, valor: 0 },
        { id: 4, campo: "Comisión (C)", porcentaje: 8, valor: 0 }
      ])
    }
  }, [open, product])

  // Controlar el foco del primer input para evitar selección automática
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        if (firstInputRef.current) {
          firstInputRef.current.blur()
        }
        if (firstValueRef.current) {
          firstValueRef.current.blur()
        }
      })
    }
  }, [open])

  // Calcular valores automáticamente basados en el coste (solo filas predefinidas)
  useEffect(() => {
    if (coste === 0) return

    setRows(prev => {
      const newRows = prev.map(row => {
        if (row.campo === "Utilidad (U)") {
          // Utilidad: 28% del coste
          const valor = parseFloat((coste * 0.28).toFixed(2))
          return { ...row, valor, porcentaje: 28 }
        } else if (row.campo === "Factura (F)") {
          // Factura: 18% de (coste + utilidad)
          const utilidad = coste * 0.28
          const base = coste + utilidad
          const valor = parseFloat((base * 0.18).toFixed(2))
          return { ...row, valor, porcentaje: 18 }
        } else if (row.campo === "Comisión (C)") {
          // Comisión: 8% de (coste + utilidad)
          const utilidad = coste * 0.28
          const base = coste + utilidad
          const valor = parseFloat((base * 0.08).toFixed(2))
          return { ...row, valor, porcentaje: 8 }
        }
        return row
      })
      
      return newRows
    })
  }, [coste])

  // Handlers para cambios de campo
  const handleCampoChange = (rowId: number, campo: string) => {
    setRows(prev => prev.map(row => 
      row.id === rowId ? { ...row, campo } : row
    ))
  }

  // Handler para cambios de porcentaje (recalcula valor)
  const handlePorcentajeChange = (rowId: number, porcentajeStr: string) => {
    setRows(prev => {
      const costeRow = prev.find(r => r.campo === "Coste")
      const coste = costeRow ? (typeof costeRow.valor === 'string' ? parseFloat(costeRow.valor) || 0 : costeRow.valor) : 0
      const porcentaje = parseFloat(porcentajeStr) || 0

      return prev.map(row => {
        if (row.id === rowId) {
          if (porcentajeStr === "") return { ...row, porcentaje: "" }
          
          // Para filas predefinidas, calcular basado en coste
          if (row.campo === "Utilidad (U)") {
            const valor = parseFloat((coste * (porcentaje / 100)).toFixed(2))
            return { ...row, porcentaje, valor }
          } else if (row.campo === "Factura (F)") {
            const utilidad = coste * 0.28
            const base = coste + utilidad
            const valor = parseFloat((base * (porcentaje / 100)).toFixed(2))
            return { ...row, porcentaje, valor }
          } else if (row.campo === "Comisión (C)") {
            const utilidad = coste * 0.28
            const base = coste + utilidad
            const valor = parseFloat((base * (porcentaje / 100)).toFixed(2))
            return { ...row, porcentaje, valor }
          } else {
            // Para otras filas, calcular basado en coste
            const valor = parseFloat((coste * (porcentaje / 100)).toFixed(2))
            return { ...row, porcentaje, valor }
          }
        }
        return row
      })
    })
  }

  // Handler para cambios de valor (recalcula porcentaje)
  const handleValorChange = (rowId: number, valorStr: string) => {
    setRows(prev => {
      return prev.map(row => {
        if (row.id === rowId) {
          if (valorStr === "") return { ...row, valor: "" }
          
          const valor = parseFloat(valorStr)
          const total = prev.reduce((sum, r) => {
            const rValor = r.id === rowId ? valor : (typeof r.valor === 'string' ? parseFloat(r.valor) || 0 : r.valor)
            return sum + rValor
          }, 0)
          const porcentaje = total > 0 ? (valor / total) * 100 : 0
          
          return { ...row, valor, porcentaje: parseFloat(porcentaje.toFixed(2)) }
        }
        return row
      })
    })
  }

  // Añadir nueva fila
  const handleAddRow = () => {
    const newRowId = Math.max(...rows.map(r => r.id)) + 1
    setRows(prev => [...prev, {
      id: newRowId,
      campo: "",
      porcentaje: 0,
      valor: 0
    }])
  }

  // Eliminar fila
  const handleRemoveRow = (rowId: number) => {
    if (rows.length > 1) {
      setRows(prev => {
        const filtered = prev.filter(row => row.id !== rowId)
        
        // Recalcular porcentajes SOLO para filas que NO sean las predefinidas
        const total = filtered.reduce((sum, r) => {
          const valor = typeof r.valor === 'string' ? parseFloat(r.valor) || 0 : r.valor
          return sum + valor
        }, 0)
        return filtered.map(row => {
          if (row.campo === "Utilidad (U)" || row.campo === "Factura (F)" || row.campo === "Comisión (C)") {
            return row // Mantener porcentajes fijos 28-18-8
          }
          const valor = typeof row.valor === 'string' ? parseFloat(row.valor) || 0 : row.valor
          const porcentaje = total > 0 ? (valor / total) * 100 : 0
          return { ...row, porcentaje: parseFloat(porcentaje.toFixed(2)) }
        })
      })
    }
  }

  // Calcular total
  const handleCalculate = () => {
    if (rows.length === 0 || totalPrice === 0) {
      toast.warning('Añade campos con valores para calcular')
      return
    }

    if (onCalculate) {
      // Filtrar solo filas con datos válidos
      const validRows = rows.filter(row => {
        const valor = typeof row.valor === 'string' ? parseFloat(row.valor) || 0 : row.valor
        return row.campo.trim() && valor > 0
      })
      onCalculate(totalPrice, validRows)
    }
    
    toast.success(`Total calculado: Bs ${totalPrice.toFixed(2)}`)
  }


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Calculadora de Precios
          </DialogTitle>
          <DialogDescription>
            Añade campos y calcula el precio total de tu proyecto
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Sección de campos de precio */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">
                Producto: {product?.nombre || 'Sin producto seleccionado'}
              </Label>
            </div>
            
            <div className={`space-y-4 ${rows.length >= 4 ? 'max-h-80 overflow-y-auto pr-2' : ''}`}>
              {/* Headers */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                <div className="md:col-span-4">
                  <Label className="text-sm font-medium text-gray-700">Campo</Label>
                </div>
                <div className="md:col-span-3">
                  <Label className="text-sm font-medium text-gray-700">Porcentaje (%)</Label>
                </div>
                <div className="md:col-span-3">
                  <Label className="text-sm font-medium text-gray-700">Valor (Bs)</Label>
                </div>
                <div className="md:col-span-2">
                  <div className="h-6"></div>
                </div>
              </div>

              {/* Filas dinámicas */}
              {rows.map((row) => (
                <div key={row.id} className="grid grid-cols-1 md:grid-cols-12 gap-2">
                  {/* Campo */}
                  <div className="md:col-span-4">
                    <Input
                      ref={row.id === 1 ? firstInputRef : undefined}
                      placeholder="Nombre del campo..."
                      value={row.campo}
                      onChange={(e) => handleCampoChange(row.id, e.target.value)}
                      disabled={row.campo === "Coste"}
                      className={row.campo === "Coste" ? "bg-gray-100 cursor-not-allowed" : ""}
                    />
                  </div>

                  {/* Porcentaje */}
                  <div className="md:col-span-3">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.porcentaje}
                      onChange={(e) => handlePorcentajeChange(row.id, e.target.value)}
                      onBlur={(e) => {
                        const value = parseFloat(e.target.value) || 0
                        handlePorcentajeChange(row.id, value.toFixed(2))
                      }}
                      placeholder="0.00"
                      disabled={row.campo === "Coste"}
                      className={row.campo === "Coste" ? "bg-gray-100 cursor-not-allowed" : ""}
                    />
                  </div>

                  {/* Valor */}
                  <div className="md:col-span-3">
                    <Input
                      ref={row.id === 1 ? firstValueRef : undefined}
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.valor}
                      onChange={(e) => handleValorChange(row.id, e.target.value)}
                      onBlur={(e) => {
                        const value = parseFloat(e.target.value) || 0
                        handleValorChange(row.id, value.toFixed(2))
                      }}
                      placeholder="0.00"
                    />
                  </div>

                  {/* Botón eliminar fila */}
                  <div className="md:col-span-2">
                    <div className="flex items-center justify-start h-10">
                      {rows.length > 1 && row.campo !== "Coste" && (
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
              Total: <span className="text-green-600">Bs {totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleCalculate}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Calcular Total
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
