"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { catalogosPlanillasMensuales } from "@/lib/planillas/mensualesMock"
import { periodoToRange } from "./planillas-informes-utils"

export interface InformesPlanillasFiltrosValue {
  empresa: string
  regional: string
  sucursal: string
  periodo: number
}

interface Props {
  value: InformesPlanillasFiltrosValue
  onChange: (value: InformesPlanillasFiltrosValue) => void
  showEmpleado?: boolean
  empleadoValue?: string
  onEmpleadoChange?: (value: string) => void
}

export default function PlanillasInformesFiltros({
  value,
  onChange,
  showEmpleado = false,
  empleadoValue = "% TODOS",
  onEmpleadoChange,
}: Props) {
  const range = useMemo(() => periodoToRange(value.periodo), [value.periodo])

  const set = (k: keyof InformesPlanillasFiltrosValue, v: any) => onChange({ ...value, [k]: v })

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Filtros</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
          <div className="space-y-2">
            <Label>Empresa</Label>
            <Select value={value.empresa} onValueChange={(v) => set("empresa", v)}>
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
            <Select value={value.regional} onValueChange={(v) => set("regional", v)}>
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
            <Select value={value.sucursal} onValueChange={(v) => set("sucursal", v)}>
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

          <div className="space-y-2">
            <Label>Periodo (YYYYMM)</Label>
            <Input
              type="number"
              value={value.periodo}
              onChange={(e) => set("periodo", parseInt(e.target.value || "0", 10))}
              placeholder="202503"
            />
          </div>

          <div className="space-y-2">
            <Label>Fecha Inicial</Label>
            <Input value={range.fechaInicial} readOnly className="bg-gray-50" />
          </div>

          <div className="space-y-2">
            <Label>Fecha Final</Label>
            <Input value={range.fechaFinal} readOnly className="bg-gray-50" />
          </div>

          {showEmpleado && (
            <div className="space-y-2 lg:col-span-6">
              <Label>Empleado</Label>
              <Input
                value={empleadoValue}
                onChange={(e) => onEmpleadoChange?.(e.target.value)}
                placeholder="% TODOS"
              />
              <p className="text-xs text-gray-500">Use % para búsqueda. Por defecto: “% TODOS”.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}


