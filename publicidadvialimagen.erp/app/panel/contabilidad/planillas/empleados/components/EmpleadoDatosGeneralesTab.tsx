"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { type DatosGenerales, catalogosEmpleados } from "@/lib/planillas/empleadosMock"

interface Props {
  datos: DatosGenerales
  onChange: (datos: DatosGenerales) => void
  readonly?: boolean
}

export default function EmpleadoDatosGeneralesTab({ datos, onChange, readonly = false }: Props) {
  const handleChange = (field: keyof DatosGenerales, value: any) => {
    onChange({ ...datos, [field]: value })
  }

  return (
    <div className="space-y-6">
      {/* Datos Personales */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Datos Personales</CardTitle>
          <CardDescription>Información básica del empleado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Código</Label>
              <Input value={datos.codigo} readOnly className="bg-gray-50" />
            </div>
            <div className="space-y-2">
              <Label>Apellido Paterno</Label>
              <Input
                value={datos.apellido_paterno}
                onChange={(e) => handleChange("apellido_paterno", e.target.value)}
                disabled={readonly}
              />
            </div>
            <div className="space-y-2">
              <Label>Apellido Materno</Label>
              <Input
                value={datos.apellido_materno}
                onChange={(e) => handleChange("apellido_materno", e.target.value)}
                disabled={readonly}
              />
            </div>
            <div className="space-y-2">
              <Label>Nombres</Label>
              <Input
                value={datos.nombres}
                onChange={(e) => handleChange("nombres", e.target.value)}
                disabled={readonly}
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha de Nacimiento</Label>
              <Input
                type="date"
                value={datos.fecha_nacimiento}
                onChange={(e) => handleChange("fecha_nacimiento", e.target.value)}
                disabled={readonly}
              />
            </div>
            <div className="space-y-2">
              <Label>Nacionalidad</Label>
              <Input
                value={datos.nacionalidad}
                onChange={(e) => handleChange("nacionalidad", e.target.value)}
                disabled={readonly}
              />
            </div>
            <div className="space-y-2 md:col-span-3">
              <Label>Dirección</Label>
              <Input
                value={datos.direccion}
                onChange={(e) => handleChange("direccion", e.target.value)}
                disabled={readonly}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Datos Adicionales */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Datos Adicionales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Sexo</Label>
              <Select value={datos.sexo} onValueChange={(v) => handleChange("sexo", v)} disabled={readonly}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione" />
                </SelectTrigger>
                <SelectContent>
                  {catalogosEmpleados.sexos.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estado Civil</Label>
              <Select
                value={datos.estado_civil}
                onValueChange={(v) => handleChange("estado_civil", v)}
                disabled={readonly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione" />
                </SelectTrigger>
                <SelectContent>
                  {catalogosEmpleados.estadosCiviles.map((ec) => (
                    <SelectItem key={ec} value={ec}>
                      {ec}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Número C.I.</Label>
              <Input
                value={datos.numero_ci}
                onChange={(e) => handleChange("numero_ci", e.target.value)}
                disabled={readonly}
              />
            </div>
            <div className="space-y-2">
              <Label>Grupo Sanguíneo</Label>
              <Input
                value={datos.grupo_sanguineo}
                onChange={(e) => handleChange("grupo_sanguineo", e.target.value)}
                disabled={readonly}
              />
            </div>
            <div className="space-y-2">
              <Label>Grado Académico</Label>
              <Input
                value={datos.grado_academico}
                onChange={(e) => handleChange("grado_academico", e.target.value)}
                disabled={readonly}
              />
            </div>
            <div className="space-y-2">
              <Label>Profesión</Label>
              <Input
                value={datos.profesion}
                onChange={(e) => handleChange("profesion", e.target.value)}
                disabled={readonly}
              />
            </div>
            <div className="space-y-2">
              <Label>Idiomas</Label>
              <Input
                value={datos.idiomas}
                onChange={(e) => handleChange("idiomas", e.target.value)}
                disabled={readonly}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contacto */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Contacto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input
                value={datos.telefono}
                onChange={(e) => handleChange("telefono", e.target.value)}
                disabled={readonly}
              />
            </div>
            <div className="space-y-2">
              <Label>Celular</Label>
              <Input
                value={datos.celular}
                onChange={(e) => handleChange("celular", e.target.value)}
                disabled={readonly}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={datos.email}
                onChange={(e) => handleChange("email", e.target.value)}
                disabled={readonly}
              />
            </div>
            <div className="space-y-2">
              <Label>Casilla</Label>
              <Input
                value={datos.casilla}
                onChange={(e) => handleChange("casilla", e.target.value)}
                disabled={readonly}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Datos Laborales */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Datos Laborales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Fecha de Ingreso</Label>
              <Input
                type="date"
                value={datos.fecha_ingreso}
                onChange={(e) => handleChange("fecha_ingreso", e.target.value)}
                disabled={readonly}
              />
            </div>
            <div className="space-y-2">
              <Label>Nº Planilla</Label>
              <Input
                value={datos.numero_planilla}
                onChange={(e) => handleChange("numero_planilla", e.target.value)}
                disabled={readonly}
              />
            </div>
            <div className="space-y-2">
              <Label>Haber Básico</Label>
              <Input
                type="number"
                value={datos.haber_basico}
                onChange={(e) => handleChange("haber_basico", parseFloat(e.target.value) || 0)}
                disabled={readonly}
              />
            </div>
            <div className="space-y-2">
              <Label>Nº Cuenta Bancaria</Label>
              <Input
                value={datos.numero_cuenta_bancaria}
                onChange={(e) => handleChange("numero_cuenta_bancaria", e.target.value)}
                disabled={readonly}
              />
            </div>
            <div className="space-y-2">
              <Label>AFP</Label>
              <Select value={datos.afp} onValueChange={(v) => handleChange("afp", v)} disabled={readonly}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione AFP" />
                </SelectTrigger>
                <SelectContent>
                  {catalogosEmpleados.afps.map((afp) => (
                    <SelectItem key={afp} value={afp}>
                      {afp}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={datos.activo_jubilado}
                onValueChange={(v) => handleChange("activo_jubilado", v)}
                disabled={readonly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione" />
                </SelectTrigger>
                <SelectContent>
                  {catalogosEmpleados.activoJubilado.map((est) => (
                    <SelectItem key={est} value={est}>
                      {est}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Asignación Organizativa */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Asignación Organizativa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Select value={datos.empresa} onValueChange={(v) => handleChange("empresa", v)} disabled={readonly}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione" />
                </SelectTrigger>
                <SelectContent>
                  {catalogosEmpleados.empresas.map((e) => (
                    <SelectItem key={e.value} value={e.value}>
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Regional</Label>
              <Select value={datos.regional} onValueChange={(v) => handleChange("regional", v)} disabled={readonly}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione" />
                </SelectTrigger>
                <SelectContent>
                  {catalogosEmpleados.regionales.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sucursal</Label>
              <Select value={datos.sucursal} onValueChange={(v) => handleChange("sucursal", v)} disabled={readonly}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione" />
                </SelectTrigger>
                <SelectContent>
                  {catalogosEmpleados.sucursales.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Centro de Costo</Label>
              <Select
                value={datos.centro_costo}
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
              <Label>Cargo</Label>
              <Select value={datos.cargo} onValueChange={(v) => handleChange("cargo", v)} disabled={readonly}>
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
          </div>
        </CardContent>
      </Card>

      {/* Estado del Empleado */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Estado del Empleado</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={datos.estado} onValueChange={(v) => handleChange("estado", v)} disabled={readonly}>
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Alta" id="estado-alta" />
                <Label htmlFor="estado-alta">Alta</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Baja" id="estado-baja" />
                <Label htmlFor="estado-baja">Baja</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Pendiente" id="estado-pendiente" />
                <Label htmlFor="estado-pendiente">Pendiente</Label>
              </div>
            </div>
          </RadioGroup>
          
          <Separator className="my-4" />
          
          {/* Bloque lateral (mock - sin funcionalidad) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="p-4 border rounded-md bg-gray-50">
              <h4 className="font-medium text-sm mb-2">Ingresos asociados (mock)</h4>
              <p className="text-xs text-gray-500">
                • Bono de antigüedad<br />
                • Bono de transporte<br />
                • Bono de producción
              </p>
            </div>
            <div className="p-4 border rounded-md bg-gray-50">
              <h4 className="font-medium text-sm mb-2">Descuentos asociados (mock)</h4>
              <p className="text-xs text-gray-500">
                • Aporte AFP<br />
                • Seguro de salud<br />
                • RC-IVA
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

