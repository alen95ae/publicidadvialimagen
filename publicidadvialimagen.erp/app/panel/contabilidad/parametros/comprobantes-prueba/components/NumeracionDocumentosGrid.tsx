"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface NumeracionDocumento {
  id: string
  empresa: string
  regional: string
  sucursal: string
  clasificador: string
  descripcion: string
  tipo_numeracion: "AUTOMATICA" | "MANUAL"
  tipo_periodo: "MENSUAL" | "ANUAL"
  estado: boolean
}

const TIPOS_NUMERACION = ["AUTOMATICA", "MANUAL"]
const TIPOS_PERIODO = ["MENSUAL", "ANUAL"]

// Datos mock iniciales
const initialNumeraciones: NumeracionDocumento[] = [
  {
    id: "1",
    empresa: "001",
    regional: "01",
    sucursal: "001",
    clasificador: "CONTABILIDAD",
    descripcion: "Numeración automática mensual",
    tipo_numeracion: "AUTOMATICA",
    tipo_periodo: "MENSUAL",
    estado: true,
  },
  {
    id: "2",
    empresa: "001",
    regional: "01",
    sucursal: "001",
    clasificador: "VENTAS",
    descripcion: "Numeración manual anual",
    tipo_numeracion: "MANUAL",
    tipo_periodo: "ANUAL",
    estado: true,
  },
]

export default function NumeracionDocumentosGrid() {
  const [numeraciones, setNumeraciones] = useState<NumeracionDocumento[]>(initialNumeraciones)
  const [infoSeleccionada, setInfoSeleccionada] = useState<Partial<NumeracionDocumento> | null>(null)

  const handleAddRow = () => {
    const newNumeracion: NumeracionDocumento = {
      id: Date.now().toString(),
      empresa: "",
      regional: "",
      sucursal: "",
      clasificador: "",
      descripcion: "",
      tipo_numeracion: "AUTOMATICA",
      tipo_periodo: "MENSUAL",
      estado: true,
    }
    setNumeraciones([...numeraciones, newNumeracion])
  }

  const handleRemoveRow = (id: string) => {
    setNumeraciones(numeraciones.filter((n) => n.id !== id))
  }

  const handleChange = (id: string, field: keyof NumeracionDocumento, value: any) => {
    const updated = numeraciones.map((n) => {
      if (n.id === id) {
        const newValue = { ...n, [field]: value }
        // Si se selecciona una fila, actualizar info
        if (field !== "estado") {
          setInfoSeleccionada(newValue)
        }
        return newValue
      }
      return n
    })
    setNumeraciones(updated)
  }

  const handleRowClick = (numeracion: NumeracionDocumento) => {
    setInfoSeleccionada(numeracion)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Numeración de Documentos</CardTitle>
            <CardDescription>
              Configuración de numeración por empresa, regional y sucursal
            </CardDescription>
          </div>
          <Button onClick={handleAddRow} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Agregar Fila
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Tabla editable */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Empresa</TableHead>
                  <TableHead className="w-24">Regional</TableHead>
                  <TableHead className="w-24">Sucursal</TableHead>
                  <TableHead className="w-32">Clasificador</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="w-40">Tipo de Numeración</TableHead>
                  <TableHead className="w-32">Tipo de Periodo</TableHead>
                  <TableHead className="w-24">Estado</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {numeraciones.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-gray-500 py-8">
                      No hay numeraciones. Click en "Agregar Fila" para comenzar.
                    </TableCell>
                  </TableRow>
                ) : (
                  numeraciones.map((numeracion) => (
                    <TableRow
                      key={numeracion.id}
                      onClick={() => handleRowClick(numeracion)}
                      className={`cursor-pointer ${
                        infoSeleccionada?.id === numeracion.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <TableCell>
                        <Input
                          value={numeracion.empresa}
                          onChange={(e) =>
                            handleChange(numeracion.id, "empresa", e.target.value)
                          }
                          className="w-24 font-mono"
                          placeholder="001"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={numeracion.regional}
                          onChange={(e) =>
                            handleChange(numeracion.id, "regional", e.target.value)
                          }
                          className="w-24 font-mono"
                          placeholder="01"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={numeracion.sucursal}
                          onChange={(e) =>
                            handleChange(numeracion.id, "sucursal", e.target.value)
                          }
                          className="w-24 font-mono"
                          placeholder="001"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={numeracion.clasificador}
                          onChange={(e) =>
                            handleChange(numeracion.id, "clasificador", e.target.value)
                          }
                          className="w-32"
                          placeholder="CONTABILIDAD"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={numeracion.descripcion}
                          onChange={(e) =>
                            handleChange(numeracion.id, "descripcion", e.target.value)
                          }
                          placeholder="Descripción de la numeración"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={numeracion.tipo_numeracion}
                          onValueChange={(value) =>
                            handleChange(numeracion.id, "tipo_numeracion", value)
                          }
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIPOS_NUMERACION.map((tipo) => (
                              <SelectItem key={tipo} value={tipo}>
                                {tipo}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={numeracion.tipo_periodo}
                          onValueChange={(value) =>
                            handleChange(numeracion.id, "tipo_periodo", value)
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIPOS_PERIODO.map((tipo) => (
                              <SelectItem key={tipo} value={tipo}>
                                {tipo}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Checkbox
                            checked={numeracion.estado}
                            onCheckedChange={(checked) =>
                              handleChange(numeracion.id, "estado", !!checked)
                            }
                          />
                          <span className="ml-2 text-sm text-gray-600">
                            {numeracion.estado ? "ACTIVO" : "INACTIVO"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveRow(numeracion.id)
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Bloque informativo (solo lectura) */}
          <Separator />
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Información de la numeración seleccionada
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs text-gray-500">Empresa</Label>
                <div className="mt-1 font-mono text-sm">
                  {infoSeleccionada?.empresa || "—"}
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Regional</Label>
                <div className="mt-1 font-mono text-sm">
                  {infoSeleccionada?.regional || "—"}
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Sucursal</Label>
                <div className="mt-1 font-mono text-sm">
                  {infoSeleccionada?.sucursal || "—"}
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Clasificador</Label>
                <div className="mt-1 text-sm">
                  {infoSeleccionada?.clasificador || "—"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

