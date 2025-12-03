"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Loader2, Check } from "lucide-react"

interface PriceRow {
  id: number
  campo: string
  porcentaje: number | null
  valor: number
  editable: boolean
  porcentajeConfig?: number | null
}

interface PriceCalculatorProps {
  priceRows: PriceRow[]
  isApplyingPrice: boolean
  priceApplied: boolean
  parseNum: (v: number | string) => number
  handlePricePorcentajeChange: (rowId: number, value: string) => void
  handlePriceValorChange: (rowId: number, value: string) => void
  handleApplyPrice: () => void
}

export function PriceCalculator({
  priceRows,
  isApplyingPrice,
  priceApplied,
  parseNum,
  handlePricePorcentajeChange,
  handlePriceValorChange,
  handleApplyPrice
}: PriceCalculatorProps) {
  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Calculadora de Precios (UFC)
        </CardTitle>
        <CardDescription>Calcula el precio desde el precio objetivo del mercado</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-700 mb-2">
            <div className="col-span-4">Campo</div>
            <div className="col-span-3">%</div>
            <div className="col-span-5">Valor (Bs)</div>
          </div>
          
          {priceRows.map((row) => {
            const isEditable = row.editable
            const isPrecioRow = row.campo === "Precio"
            let showPorcentaje =
              row.porcentaje != null ||
              ((row.campo === "Factura" || row.campo === "IUE" || row.campo === "Comision" || row.campo === "Comisión" || row.campo === "Comisión (C)") &&
               (row as any).porcentajeConfig != null)
            let porcentajeToShow: number | string | null = row.porcentaje
            if (row.campo === "Comision" || row.campo === "Comisión" || row.campo === "Comisión (C)") {
              porcentajeToShow = (row as any).porcentajeConfig != null ? (row as any).porcentajeConfig : ""
              showPorcentaje = true
            } else if (row.campo === "Factura" || row.campo === "IUE") {
              porcentajeToShow = (row as any).porcentajeConfig != null
                ? (row as any).porcentajeConfig
                : row.porcentaje
            }
            
            return (
              <div key={`price-row-${row.id}`} className="grid grid-cols-12 gap-2">
                <div className="col-span-4">
                  <Input
                    value={row.campo}
                    disabled
                    className={`h-9 text-sm ${isPrecioRow ? "bg-green-100 cursor-not-allowed" : "bg-gray-100 cursor-not-allowed"}`}
                  />
                </div>
                <div className="col-span-3">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={isPrecioRow ? "" : (showPorcentaje ? (porcentajeToShow ?? "") : "")}
                    onChange={(e) => handlePricePorcentajeChange(row.id, e.target.value)}
                    disabled={!isEditable || !showPorcentaje || isPrecioRow}
                    placeholder={isPrecioRow ? "" : (showPorcentaje ? "0.00" : "")}
                    className={`h-9 text-sm ${!isEditable || !showPorcentaje || isPrecioRow ? (isPrecioRow ? "bg-green-100 cursor-not-allowed" : "bg-gray-100 cursor-not-allowed") : ""}`}
                  />
                </div>
                <div className="col-span-5">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.valor || ""}
                    onChange={(e) => handlePriceValorChange(row.id, e.target.value)}
                    disabled={!isEditable || isPrecioRow}
                    placeholder="0.00"
                    className={`h-9 text-sm ${!isEditable || isPrecioRow ? (isPrecioRow ? "bg-green-100 cursor-not-allowed" : "bg-gray-100 cursor-not-allowed") : ""}`}
                  />
                </div>
              </div>
            )
          })}
        </div>
        
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Precio Final:</span>
            <span className="text-lg font-bold text-green-600">
              Bs {parseNum(priceRows.find(r => r.campo === "Precio")?.valor ?? 0).toFixed(2)}
            </span>
          </div>
          <Button
            onClick={handleApplyPrice}
            disabled={isApplyingPrice || parseNum(priceRows.find(r => r.campo === "Precio")?.valor ?? 0) <= 0}
            className={`w-full mt-4 transition-all duration-300 transform ${
              priceApplied
                ? 'bg-green-500 hover:bg-green-600 scale-105 shadow-lg'
                : 'bg-green-600 hover:bg-green-700'
            } ${isApplyingPrice ? 'opacity-75 cursor-wait' : ''} text-white`}
            size="sm"
          >
            {isApplyingPrice ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : priceApplied ? (
              <>
                <Check className="w-4 h-4 mr-2 animate-pulse" />
                ¡Aplicado!
              </>
            ) : (
              'Aplicar Precio'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

