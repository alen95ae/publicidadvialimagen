"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { type Contrato, catalogosEmpleados } from "@/lib/planillas/empleadosMock"

interface Props {
  contratos: Contrato[]
  onChange: (contratos: Contrato[]) => void
  readonly?: boolean
}

export default function EmpleadoContratosTab({ contratos, onChange, readonly = false }: Props) {
  // Por simplicidad, editamos solo el primer contrato (mock)
  const contrato = contratos[0] || {
    numero_contrato: "",
    codigo_empleado: "",
    empresa: "",
    regional: "",
    sucursal: "",
    haber_basico: 0,
    cargo: "",
    centro_costo: "",
    tipo_contrato: "Indefinido" as any,
    calificacion: "Profesional" as any,
    fecha_inicio: "",
    fecha_termino: "",
    detalle_contrato: "",
    estado: "Pendiente" as any
  }

  const handleChange = (field: keyof Contrato, value: any) => {
    const updated = { ...contrato, [field]: value }
    onChange([updated])
  }

  return (
    <div className="space-y-6">
      {/* Datos del Contrato */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Datos del Contrato</CardTitle>
          <CardDescription>Información base del contrato laboral</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Nº Contrato</Label>
              <Input
                value={contrato.numero_contrato}
                onChange={(e) => handleChange("numero_contrato", e.target.value)}
                disabled={readonly}
              />
            </div>
            <div className="space-y-2">
              <Label>Código Empleado</Label>
              <Input value={contrato.codigo_empleado} readOnly className="bg-gray-50" />
            </div>
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Input value={contrato.empresa} readOnly className="bg-gray-50" />
            </div>
            <div className="space-y-2">
              <Label>Regional</Label>
              <Input value={contrato.regional} readOnly className="bg-gray-50" />
            </div>
            <div className="space-y-2">
              <Label>Sucursal</Label>
              <Input value={contrato.sucursal} readOnly className="bg-gray-50" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detalle del Contrato */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Detalle del Contrato</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Haber Básico</Label>
              <Input
                type="number"
                value={contrato.haber_basico}
                onChange={(e) => handleChange("haber_basico", parseFloat(e.target.value) || 0)}
                disabled={readonly}
              />
            </div>
            <div className="space-y-2">
              <Label>Cargo</Label>
              <Select
                value={contrato.cargo}
                onValueChange={(v) => handleChange("cargo", v)}
                disabled={readonly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione" />
                </SelectTrigger>
                <SelectContent>
                  {catalogosEmpleados.cargos.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Centro de Costo</Label>
              <Select
                value={contrato.centro_costo}
                onValueChange={(v) => handleChange("centro_costo", v)}
                disabled={readonly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione" />
                </SelectTrigger>
                <SelectContent>
                  {catalogosEmpleados.centrosCosto.map((cc) => (
                    <SelectItem key={cc.value} value={cc.value}>
                      {cc.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de Contrato</Label>
              <Select
                value={contrato.tipo_contrato}
                onValueChange={(v) => handleChange("tipo_contrato", v)}
                disabled={readonly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione" />
                </SelectTrigger>
                <SelectContent>
                  {catalogosEmpleados.tiposContrato.map((tc) => (
                    <SelectItem key={tc} value={tc}>
                      {tc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Calificación</Label>
              <Select
                value={contrato.calificacion}
                onValueChange={(v) => handleChange("calificacion", v)}
                disabled={readonly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione" />
                </SelectTrigger>
                <SelectContent>
                  {catalogosEmpleados.calificaciones.map((cal) => (
                    <SelectItem key={cal} value={cal}>
                      {cal}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fecha Inicio</Label>
              <Input
                type="date"
                value={contrato.fecha_inicio}
                onChange={(e) => handleChange("fecha_inicio", e.target.value)}
                disabled={readonly}
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha Término</Label>
              <Input
                type="date"
                value={contrato.fecha_termino}
                onChange={(e) => handleChange("fecha_termino", e.target.value)}
                disabled={readonly}
              />
            </div>
            <div className="space-y-2 md:col-span-3">
              <Label>Detalle del Contrato</Label>
              <Textarea
                value={contrato.detalle_contrato}
                onChange={(e) => handleChange("detalle_contrato", e.target.value)}
                disabled={readonly}
                rows={4}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estado del Contrato */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Estado del Contrato</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={contrato.estado}
            onValueChange={(v) => handleChange("estado", v)}
            disabled={readonly}
          >
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Pendiente" id="contrato-pendiente" />
                <Label htmlFor="contrato-pendiente">Pendiente</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Alta" id="contrato-alta" />
                <Label htmlFor="contrato-alta">Alta</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Concluido" id="contrato-concluido" />
                <Label htmlFor="contrato-concluido">Concluido</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Baja" id="contrato-baja" />
                <Label htmlFor="contrato-baja">Baja</Label>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  )
}

