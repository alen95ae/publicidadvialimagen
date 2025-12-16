"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2 } from "lucide-react"

interface Entidad {
  id: string
  empresa: string
  modulo: "RR.HH." | "Contabilidad" | "Ventas"
  entidad: string
  desc_param: string
  entidad_relacionada: string
  nivel: number
  fecha: string
}

const MODULOS = ["RR.HH.", "Contabilidad", "Ventas"]

// Datos mock iniciales
const initialEntidades: Entidad[] = [
  {
    id: "1",
    empresa: "001",
    modulo: "Contabilidad",
    entidad: "AFP",
    desc_param: "Administradora de Fondos de Pensiones",
    entidad_relacionada: "",
    nivel: 1,
    fecha: "2024-01-01",
  },
  {
    id: "2",
    empresa: "001",
    modulo: "RR.HH.",
    entidad: "TPO_AUX",
    desc_param: "Tipo de Auxiliar",
    entidad_relacionada: "AUXILIARES",
    nivel: 2,
    fecha: "2024-01-01",
  },
]

export default function EntidadesGrid() {
  const [entidades, setEntidades] = useState<Entidad[]>(initialEntidades)

  const handleAddRow = () => {
    const newEntidad: Entidad = {
      id: Date.now().toString(),
      empresa: "",
      modulo: "Contabilidad",
      entidad: "",
      desc_param: "",
      entidad_relacionada: "",
      nivel: 1,
      fecha: new Date().toISOString().split("T")[0],
    }
    setEntidades([...entidades, newEntidad])
  }

  const handleRemoveRow = (id: string) => {
    setEntidades(entidades.filter((e) => e.id !== id))
  }

  const handleChange = (id: string, field: keyof Entidad, value: any) => {
    setEntidades(
      entidades.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Entidades</CardTitle>
            <CardDescription>
              Configuración de entidades por empresa y módulo
            </CardDescription>
          </div>
          <Button onClick={handleAddRow} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Agregar Fila
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Empresa</TableHead>
                <TableHead className="w-32">Módulo</TableHead>
                <TableHead className="w-32">Entidad</TableHead>
                <TableHead>Desc Param</TableHead>
                <TableHead className="w-40">Entidad Relacionada</TableHead>
                <TableHead className="w-20">Nivel</TableHead>
                <TableHead className="w-32">Fecha</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entidades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                    No hay entidades. Click en "Agregar Fila" para comenzar.
                  </TableCell>
                </TableRow>
              ) : (
                entidades.map((entidad) => (
                  <TableRow key={entidad.id}>
                    <TableCell>
                      <Input
                        value={entidad.empresa}
                        onChange={(e) =>
                          handleChange(entidad.id, "empresa", e.target.value)
                        }
                        className="w-24 font-mono"
                        placeholder="001"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={entidad.modulo}
                        onValueChange={(value) =>
                          handleChange(entidad.id, "modulo", value)
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MODULOS.map((mod) => (
                            <SelectItem key={mod} value={mod}>
                              {mod}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={entidad.entidad}
                        onChange={(e) =>
                          handleChange(entidad.id, "entidad", e.target.value)
                        }
                        className="w-32 font-mono"
                        placeholder="AFP"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={entidad.desc_param}
                        onChange={(e) =>
                          handleChange(entidad.id, "desc_param", e.target.value)
                        }
                        placeholder="Descripción del parámetro"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={entidad.entidad_relacionada}
                        onChange={(e) =>
                          handleChange(
                            entidad.id,
                            "entidad_relacionada",
                            e.target.value
                          )
                        }
                        className="w-40 font-mono"
                        placeholder="AUXILIARES"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        value={entidad.nivel}
                        onChange={(e) =>
                          handleChange(
                            entidad.id,
                            "nivel",
                            parseInt(e.target.value) || 1
                          )
                        }
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        value={entidad.fecha}
                        onChange={(e) =>
                          handleChange(entidad.id, "fecha", e.target.value)
                        }
                        className="w-32"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveRow(entidad.id)}
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
      </CardContent>
    </Card>
  )
}


