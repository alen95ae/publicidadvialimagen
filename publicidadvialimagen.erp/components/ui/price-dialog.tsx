"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Trash2, DollarSign } from "lucide-react"
import { toast } from "sonner"

type Num = number | string
interface PriceRow {
  id: number
  campo: string
  porcentaje: Num
  valor: Num
}
interface PriceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCalculate?: (total: number, items: PriceRow[]) => void
  product?: any
}

/* ====================== */
/*     CONFIG & HELPERS   */
/* ====================== */

const CONFIG = {
  UTILIDAD: 28,
  FACTURA: 18,
  COMISION: 8,
} as const

const PREDEF = ["Coste", "Utilidad (U)", "Factura (F)", "Comisión (C)"] as const

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

// acepta "12,5", quita ceros a la izquierda tipo "0150"
const parseNum = (v: Num) => {
  if (typeof v === "number") return v
  const s = (v ?? "").toString().replace(",", ".").replace(/^0+(?=\d)/, "")
  const n = parseFloat(s)
  return isFinite(n) ? n : 0
}

const isPredef = (campo: string) => PREDEF.includes(campo as any)

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x))

/**
 * Calcula valores coherentes para todas las filas.
 * Reglas:
 *  - Filas nuevas (entre Coste y Utilidad): base = coste
 *  - Utilidad: % sobre coste
 *  - Factura y Comisión: % sobre (coste + utilidad + adicionales)
 *  - Los porcentajes de filas NO predefinidas se mantienen en relación a su base (coste),
 *    y si el usuario edita valor manualmente, % = valor/base
 */
function recalcAll(rowsIn: PriceRow[]): PriceRow[] {
  const rows = clone(rowsIn)

  const costeRow = rows.find(r => r.campo === "Coste")
  const coste = costeRow ? parseNum(costeRow.valor) : 0

  // adicionales = filas entre Coste y Utilidad que no son predefinidas
  const adicionales = rows
    .filter(r => !["Coste", "Utilidad (U)", "Factura (F)", "Comisión (C)"].includes(r.campo))
    .reduce((sum, r) => sum + parseNum(r.valor), 0)

  // Utilidad
  const utilRow = rows.find(r => r.campo === "Utilidad (U)")
  if (utilRow) {
    const p = parseNum(utilRow.porcentaje) || CONFIG.UTILIDAD
    utilRow.porcentaje = p
    utilRow.valor = round2(coste * (p / 100))
  }
  const utilidad = utilRow ? parseNum(utilRow.valor) : 0

  // Factura
  const facRow = rows.find(r => r.campo === "Factura (F)")
  if (facRow) {
    const base = coste + utilidad + adicionales
    const p = parseNum(facRow.porcentaje) || CONFIG.FACTURA
    facRow.porcentaje = p
    facRow.valor = round2(base * (p / 100))
  }

  // Comisión
  const comRow = rows.find(r => r.campo === "Comisión (C)")
  if (comRow) {
    const base = coste + utilidad + adicionales
    const p = parseNum(comRow.porcentaje) || CONFIG.COMISION
    comRow.porcentaje = p
    comRow.valor = round2(base * (p / 100))
  }

  // Filas nuevas (no predef): forzar coherencia valor ↔ % con base coste
  rows.forEach(r => {
    if (!isPredef(r.campo)) {
      const p = parseNum(r.porcentaje)
      const v = parseNum(r.valor)
      // Si tiene % definido, sincroniza valor con base = coste
      if (p !== 0 && (r.porcentaje !== "" as any)) {
        r.valor = round2(coste * (p / 100))
      } else {
        // Si solo tiene valor, calcula % = valor / coste
        const pct = coste > 0 ? (v / coste) * 100 : 0
        r.porcentaje = round2(pct)
      }
    }
  })

  return rows
}

/** Recalcula dependientes (Factura/Comisión) cuando cambian Coste/Utilidad/adicionales */
function recalcDependientes(rowsIn: PriceRow[]): PriceRow[] {
  const rows = clone(rowsIn)
  const coste = parseNum(rows.find(r => r.campo === "Coste")?.valor ?? 0)
  const utilidad = parseNum(rows.find(r => r.campo === "Utilidad (U)")?.valor ?? 0)
  const adicionales = rows
    .filter(r => !["Coste", "Utilidad (U)", "Factura (F)", "Comisión (C)"].includes(r.campo))
    .reduce((sum, r) => sum + parseNum(r.valor), 0)
  const base = coste + utilidad + adicionales

  const fac = rows.find(r => r.campo === "Factura (F)")
  if (fac) {
    const p = parseNum(fac.porcentaje) || CONFIG.FACTURA
    fac.valor = round2(base * (p / 100))
  }
  const com = rows.find(r => r.campo === "Comisión (C)")
  if (com) {
    const p = parseNum(com.porcentaje) || CONFIG.COMISION
    com.valor = round2(base * (p / 100))
  }
  return rows
}

/* ====================== */
/*       COMPONENTE       */
/* ====================== */

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
    { id: 2, campo: "Utilidad (U)", porcentaje: CONFIG.UTILIDAD, valor: 0 },
    { id: 3, campo: "Factura (F)", porcentaje: CONFIG.FACTURA, valor: 0 },
    { id: 4, campo: "Comisión (C)", porcentaje: CONFIG.COMISION, valor: 0 }
  ])

  // Total (suma de valores)
  const totalPrice = useMemo(
    () => rows.reduce((s, r) => s + parseNum(r.valor), 0),
    [rows]
  )

  // Coste memorizado
  const coste = useMemo(
    () => parseNum(rows.find(r => r.campo === "Coste")?.valor ?? 0),
    [rows]
  )

  // Reset al abrir con producto
  useEffect(() => {
    if (open) {
      const base: PriceRow[] = [
        { id: 1, campo: "Coste", porcentaje: 0, valor: product?.coste || 0 },
        { id: 2, campo: "Utilidad (U)", porcentaje: CONFIG.UTILIDAD, valor: 0 },
        { id: 3, campo: "Factura (F)", porcentaje: CONFIG.FACTURA, valor: 0 },
        { id: 4, campo: "Comisión (C)", porcentaje: CONFIG.COMISION, valor: 0 }
      ]
      setRows(recalcAll(base))
    }
  }, [open, product])

  // Evitar selección automática
  useEffect(() => {
    if (!open) return
    requestAnimationFrame(() => {
      firstInputRef.current?.blur()
      firstValueRef.current?.blur()
    })
  }, [open])

  // Recalcular automáticamente si cambia el coste (y todo lo dependiente)
  useEffect(() => {
    if (!open) return
    setRows(prev => recalcAll(prev))
  }, [coste, open])

  /* ========== Handlers ========== */

  const handleCampoChange = (rowId: number, campo: string) => {
    setRows(prev => prev.map(r => (r.id === rowId ? { ...r, campo } : r)))
  }

  // Cambia porcentaje → recalcula valor según base correcta
  const handlePorcentajeChange = (rowId: number, pctStr: string) => {
    setRows(prev => {
      const rowsCopy = clone(prev)
      const row = rowsCopy.find(r => r.id === rowId)
      if (!row) return prev

      if (pctStr === "") {
        row.porcentaje = ""
        return rowsCopy
      }

      const pct = parseNum(pctStr)
      row.porcentaje = pct

      // Bases
      if (row.campo === "Utilidad (U)") {
        row.valor = round2(coste * (pct / 100))
        return recalcDependientes(rowsCopy)
      }

      if (row.campo === "Factura (F)" || row.campo === "Comisión (C)") {
        // se recalculan en recalcDependientes con su base (coste+utilidad+adicionales)
        return recalcDependientes(rowsCopy.map(r => (r.id === rowId ? { ...row } : r)))
      }

      // Filas nuevas → base = coste
      row.valor = round2(coste * (pct / 100))
      return recalcDependientes(rowsCopy)
    })
  }

  // Cambia valor → recalcula porcentaje con respecto a su base
  const handleValorChange = (rowId: number, valStr: string) => {
    setRows(prev => {
      const rowsCopy = clone(prev)
      const row = rowsCopy.find(r => r.id === rowId)
      if (!row) return prev

      if (valStr === "") {
        row.valor = ""
        return rowsCopy
      }

      const val = parseNum(valStr)
      row.valor = val

      if (row.campo === "Utilidad (U)") {
        const pct = coste > 0 ? (val / coste) * 100 : 0
        row.porcentaje = round2(pct)
        return recalcDependientes(rowsCopy)
      }

      if (row.campo === "Factura (F)" || row.campo === "Comisión (C)") {
        // base = coste + utilidad + adicionales
        const utilidad = parseNum(rowsCopy.find(r => r.campo === "Utilidad (U)")?.valor ?? 0)
        const adicionales = rowsCopy
          .filter(r => !["Coste", "Utilidad (U)", "Factura (F)", "Comisión (C)"].includes(r.campo))
          .reduce((s, r) => s + parseNum(r.valor), 0)
        const base = coste + utilidad + adicionales
        const pct = base > 0 ? (val / base) * 100 : 0
        row.porcentaje = round2(pct)
        return recalcDependientes(rowsCopy)
      }

      // Filas nuevas → base = coste
      const pct = coste > 0 ? (val / coste) * 100 : 0
      row.porcentaje = round2(pct)
      return recalcDependientes(rowsCopy)
    })
  }

  // Insertar nueva fila entre Coste y Utilidad
  const handleAddRow = () => {
    setRows(prev => {
      const newId = Math.max(...prev.map(r => r.id)) + 1
      const newRow: PriceRow = { id: newId, campo: "", porcentaje: 0, valor: 0 }

      const copy = clone(prev)
      const costeIdx = copy.findIndex(r => r.campo === "Coste")
      const utilIdx = copy.findIndex(r => r.campo === "Utilidad (U)")
      const insertAt = utilIdx > -1 ? utilIdx : (costeIdx > -1 ? costeIdx + 1 : copy.length)
      copy.splice(insertAt, 0, newRow)
      return copy
    })
  }

  // Eliminar fila (no permite borrar Coste)
  const handleRemoveRow = (rowId: number) => {
    setRows(prev => {
      const row = prev.find(r => r.id === rowId)
      if (!row || row.campo === "Coste") return prev
      const filtered = prev.filter(r => r.id !== rowId)
      return recalcDependientes(filtered)
    })
  }

  const handleCalculate = () => {
    const valid = rows.filter(r => r.campo.trim() && parseNum(r.valor) > 0)
    if (valid.length === 0) {
      toast.warning("Añade campos con valores para calcular")
      return
    }
    onCalculate?.(totalPrice, valid)
    toast.success(`Total calculado: Bs ${totalPrice.toFixed(2)}`)
  }

  /* ========== RENDER ========== */

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Calculadora de Precios (UFC)
          </DialogTitle>
          <DialogDescription>
            Añade campos y calcula el precio total de tu proyecto
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">
                Producto: {product?.nombre || "Sin producto seleccionado"}
              </Label>
            </div>

            <div className={`space-y-4 ${rows.length >= 4 ? "max-h-80 overflow-y-auto pr-2" : ""}`}>
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

              {/* Filas */}
              {rows.map((row) => (
                <div key={row.id}>
                  {/* Botón Añadir Línea entre Coste y Utilidad */}
                  {row.campo === "Coste" && (
                    <div className="flex justify-start mb-4">
                      <Button onClick={handleAddRow} variant="outline" className="w-auto">
                        <Plus className="h-4 w-4 mr-2" />
                        Añadir Línea
                      </Button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
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
                        value={row.campo === "Coste" ? "" : row.porcentaje}
                        onChange={(e) => handlePorcentajeChange(row.id, e.target.value)}
                        onBlur={(e) => {
                          const value = parseNum(e.target.value)
                          handlePorcentajeChange(row.id, value.toFixed(2))
                        }}
                        placeholder={row.campo === "Coste" ? "" : "0.00"}
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
                          const value = parseNum(e.target.value)
                          handleValorChange(row.id, value.toFixed(2))
                        }}
                        placeholder="0.00"
                        disabled={row.campo === "Coste"}
                        className={row.campo === "Coste" ? "bg-gray-100 cursor-not-allowed" : ""}
                      />
                    </div>

                    {/* Eliminar */}
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
                </div>
              ))}
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
              <Button onClick={handleCalculate} className="bg-green-600 hover:bg-green-700 text-white">
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
