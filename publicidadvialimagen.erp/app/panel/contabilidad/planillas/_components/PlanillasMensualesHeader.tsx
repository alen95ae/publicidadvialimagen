"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  CabeceraPlanillasMensuales,
  catalogosPlanillasMensuales,
} from "@/lib/planillas/mensualesMock"

interface Props {
  value: CabeceraPlanillasMensuales
  onChange: (value: CabeceraPlanillasMensuales) => void
  readonly?: boolean
}

export default function PlanillasMensualesHeader({ value, onChange, readonly = false }: Props) {
  const set = (k: keyof CabeceraPlanillasMensuales, v: any) => onChange({ ...value, [k]: v })

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Cabecera</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Periodo</Label>
            <Input
              type="number"
              value={value.periodo}
              onChange={(e) => set("periodo", parseInt(e.target.value || "0", 10))}
              disabled={readonly}
              placeholder="202503"
            />
          </div>

          <div className="space-y-2">
            <Label>Empresa</Label>
            <Select value={value.empresa} onValueChange={(v) => set("empresa", v)} disabled={readonly}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione" />
              </SelectTrigger>
              <SelectContent>
                {catalogosPlanillasMensuales.empresas.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Regional</Label>
            <Select value={value.regional} onValueChange={(v) => set("regional", v)} disabled={readonly}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione" />
              </SelectTrigger>
              <SelectContent>
                {catalogosPlanillasMensuales.regionales.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Sucursal</Label>
            <Select value={value.sucursal} onValueChange={(v) => set("sucursal", v)} disabled={readonly}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione" />
              </SelectTrigger>
              <SelectContent>
                {catalogosPlanillasMensuales.sucursales.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


