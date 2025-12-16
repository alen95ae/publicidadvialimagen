"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { type Complementarios } from "@/lib/planillas/empleadosMock"

interface Props {
  datos: Complementarios
  onChange: (datos: Complementarios) => void
  readonly?: boolean
}

export default function EmpleadoComplementariosTab({ datos, onChange, readonly = false }: Props) {
  const handleChange = (field: keyof Complementarios, value: string) => {
    onChange({ ...datos, [field]: value })
  }

  return (
    <div className="space-y-6">
      {/* Datos del Referente */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Datos del Referente</CardTitle>
          <CardDescription>Información de contacto de referencia</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombres</Label>
              <Input
                value={datos.referente_nombres}
                onChange={(e) => handleChange("referente_nombres", e.target.value)}
                disabled={readonly}
              />
            </div>
            <div className="space-y-2">
              <Label>Carnet de Identidad</Label>
              <Input
                value={datos.referente_ci}
                onChange={(e) => handleChange("referente_ci", e.target.value)}
                disabled={readonly}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Dirección</Label>
              <Input
                value={datos.referente_direccion}
                onChange={(e) => handleChange("referente_direccion", e.target.value)}
                disabled={readonly}
              />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input
                value={datos.referente_telefono}
                onChange={(e) => handleChange("referente_telefono", e.target.value)}
                disabled={readonly}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Observaciones */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Observaciones</CardTitle>
          <CardDescription>Notas adicionales sobre el empleado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Observaciones</Label>
            <Textarea
              value={datos.observaciones}
              onChange={(e) => handleChange("observaciones", e.target.value)}
              disabled={readonly}
              rows={6}
              placeholder="Ingrese cualquier información adicional relevante sobre el empleado..."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

