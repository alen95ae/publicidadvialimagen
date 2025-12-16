"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2 } from "lucide-react"
import { type Dependiente, catalogosEmpleados } from "@/lib/planillas/empleadosMock"

interface DependientesData {
  nombre_conyuge: string
  nombre_padre: string
  nombre_madre: string
  lista_dependientes: Dependiente[]
}

interface Props {
  datos: DependientesData
  onChange: (datos: DependientesData) => void
  readonly?: boolean
}

export default function EmpleadoDependientesTab({ datos, onChange, readonly = false }: Props) {
  const handleChangeGeneral = (field: keyof DependientesData, value: string) => {
    onChange({ ...datos, [field]: value })
  }

  const handleChangeDependiente = (id: string, field: keyof Dependiente, value: any) => {
    const updated = datos.lista_dependientes.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    onChange({ ...datos, lista_dependientes: updated })
  }

  const agregarDependiente = () => {
    const newId = (Math.max(0, ...datos.lista_dependientes.map((d) => parseInt(d.id))) + 1).toString()
    const nuevoDep: Dependiente = {
      id: newId,
      nombre: "",
      cedula_identidad: "",
      fecha_nacimiento: "",
      parentesco: "Hijo/a",
      sexo: "Masculino",
      nacionalidad: "Boliviana",
      beneficiario: false
    }
    onChange({ ...datos, lista_dependientes: [...datos.lista_dependientes, nuevoDep] })
  }

  const eliminarDependiente = (id: string) => {
    onChange({ ...datos, lista_dependientes: datos.lista_dependientes.filter((d) => d.id !== id) })
  }

  return (
    <div className="space-y-6">
      {/* Datos Familiares Directos */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Datos Familiares Directos</CardTitle>
          <CardDescription>Información de familiares directos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Nombre del Cónyuge</Label>
              <Input
                value={datos.nombre_conyuge}
                onChange={(e) => handleChangeGeneral("nombre_conyuge", e.target.value)}
                disabled={readonly}
              />
            </div>
            <div className="space-y-2">
              <Label>Nombre del Padre</Label>
              <Input
                value={datos.nombre_padre}
                onChange={(e) => handleChangeGeneral("nombre_padre", e.target.value)}
                disabled={readonly}
              />
            </div>
            <div className="space-y-2">
              <Label>Nombre de la Madre</Label>
              <Input
                value={datos.nombre_madre}
                onChange={(e) => handleChangeGeneral("nombre_madre", e.target.value)}
                disabled={readonly}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Dependientes */}
      <Card>
        <CardHeader className="pb-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle>Tabla de Dependientes</CardTitle>
            <CardDescription>Lista completa de dependientes del empleado</CardDescription>
          </div>
          {!readonly && (
            <Button type="button" onClick={agregarDependiente} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Agregar
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <div className="max-h-[420px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-white z-10">
                  <TableRow>
                    <TableHead className="w-[200px]">Nombre</TableHead>
                    <TableHead className="w-[150px]">Cédula de Identidad</TableHead>
                    <TableHead className="w-[150px]">Fecha de Nacimiento</TableHead>
                    <TableHead className="w-[140px]">Parentesco</TableHead>
                    <TableHead className="w-[120px]">Sexo</TableHead>
                    <TableHead className="w-[140px]">Nacionalidad</TableHead>
                    <TableHead className="w-[120px]">Beneficiario</TableHead>
                    {!readonly && <TableHead className="w-[70px]"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {datos.lista_dependientes.map((dep) => (
                    <TableRow key={dep.id}>
                      <TableCell>
                        <Input
                          value={dep.nombre}
                          onChange={(e) => handleChangeDependiente(dep.id, "nombre", e.target.value)}
                          disabled={readonly}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={dep.cedula_identidad}
                          onChange={(e) => handleChangeDependiente(dep.id, "cedula_identidad", e.target.value)}
                          disabled={readonly}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="date"
                          value={dep.fecha_nacimiento}
                          onChange={(e) => handleChangeDependiente(dep.id, "fecha_nacimiento", e.target.value)}
                          disabled={readonly}
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={dep.parentesco}
                          onValueChange={(v) => handleChangeDependiente(dep.id, "parentesco", v)}
                          disabled={readonly}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {catalogosEmpleados.parentescos.map((p) => (
                              <SelectItem key={p} value={p}>
                                {p}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={dep.sexo}
                          onValueChange={(v) => handleChangeDependiente(dep.id, "sexo", v)}
                          disabled={readonly}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {catalogosEmpleados.sexos.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={dep.nacionalidad}
                          onChange={(e) => handleChangeDependiente(dep.id, "nacionalidad", e.target.value)}
                          disabled={readonly}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          <Checkbox
                            checked={dep.beneficiario}
                            onCheckedChange={(checked) =>
                              handleChangeDependiente(dep.id, "beneficiario", checked === true)
                            }
                            disabled={readonly}
                          />
                        </div>
                      </TableCell>
                      {!readonly && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => eliminarDependiente(dep.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {datos.lista_dependientes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={readonly ? 7 : 8} className="text-center text-gray-500 py-8">
                        No hay dependientes registrados
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

