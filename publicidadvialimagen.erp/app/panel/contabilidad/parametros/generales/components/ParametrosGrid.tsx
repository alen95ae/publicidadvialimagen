"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2 } from "lucide-react"

interface Parametro {
  id: string
  nro: number
  cod_parametro: string
  descripcion: string
  tipo_dato: "NUMERICO" | "CARACTER" | "FECHA"
  dato_numerico: number | null
  dato_caracter: string
  dato_fecha: string
}

const TIPOS_DATO = ["NUMERICO", "CARACTER", "FECHA"]

// Datos mock iniciales
const initialParametros: Parametro[] = [
  {
    id: "1",
    nro: 1,
    cod_parametro: "PAR001",
    descripcion: "Parámetro numérico de ejemplo",
    tipo_dato: "NUMERICO",
    dato_numerico: 100,
    dato_caracter: "",
    dato_fecha: "",
  },
  {
    id: "2",
    nro: 2,
    cod_parametro: "PAR002",
    descripcion: "Parámetro de carácter",
    tipo_dato: "CARACTER",
    dato_numerico: null,
    dato_caracter: "Valor texto",
    dato_fecha: "",
  },
  {
    id: "3",
    nro: 3,
    cod_parametro: "PAR003",
    descripcion: "Parámetro de fecha",
    tipo_dato: "FECHA",
    dato_numerico: null,
    dato_caracter: "",
    dato_fecha: "2024-01-01",
  },
]

export default function ParametrosGrid() {
  const [parametros, setParametros] = useState<Parametro[]>(initialParametros)

  const handleAddRow = () => {
    const newParametro: Parametro = {
      id: Date.now().toString(),
      nro: parametros.length + 1,
      cod_parametro: "",
      descripcion: "",
      tipo_dato: "NUMERICO",
      dato_numerico: null,
      dato_caracter: "",
      dato_fecha: "",
    }
    setParametros([...parametros, newParametro])
  }

  const handleRemoveRow = (id: string) => {
    const filtered = parametros.filter((p) => p.id !== id)
    // Renumerar
    const renumbered = filtered.map((p, index) => ({
      ...p,
      nro: index + 1,
    }))
    setParametros(renumbered)
  }

  const handleChange = (id: string, field: keyof Parametro, value: any) => {
    setParametros(
      parametros.map((p) => {
        if (p.id === id) {
          const updated = { ...p, [field]: value }
          // Si cambia el tipo_dato, limpiar los otros campos
          if (field === "tipo_dato") {
            if (value === "NUMERICO") {
              updated.dato_caracter = ""
              updated.dato_fecha = ""
            } else if (value === "CARACTER") {
              updated.dato_numerico = null
              updated.dato_fecha = ""
            } else if (value === "FECHA") {
              updated.dato_numerico = null
              updated.dato_caracter = ""
            }
          }
          return updated
        }
        return p
      })
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Parámetros</CardTitle>
            <CardDescription>
              Configuración de parámetros del sistema
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
                <TableHead className="w-16">Nro.</TableHead>
                <TableHead className="w-32">Cod. Parámetro</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="w-32">Tipo Dato</TableHead>
                <TableHead className="w-32">Dato Numérico</TableHead>
                <TableHead className="w-40">Dato Carácter</TableHead>
                <TableHead className="w-32">Dato Fecha</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parametros.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                    No hay parámetros. Click en "Agregar Fila" para comenzar.
                  </TableCell>
                </TableRow>
              ) : (
                parametros.map((parametro) => (
                  <TableRow key={parametro.id}>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        value={parametro.nro}
                        onChange={(e) =>
                          handleChange(
                            parametro.id,
                            "nro",
                            parseInt(e.target.value) || 1
                          )
                        }
                        className="w-16"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={parametro.cod_parametro}
                        onChange={(e) =>
                          handleChange(
                            parametro.id,
                            "cod_parametro",
                            e.target.value
                          )
                        }
                        className="w-32 font-mono"
                        placeholder="PAR001"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={parametro.descripcion}
                        onChange={(e) =>
                          handleChange(
                            parametro.id,
                            "descripcion",
                            e.target.value
                          )
                        }
                        placeholder="Descripción del parámetro"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={parametro.tipo_dato}
                        onValueChange={(value) =>
                          handleChange(parametro.id, "tipo_dato", value)
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPOS_DATO.map((tipo) => (
                            <SelectItem key={tipo} value={tipo}>
                              {tipo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={parametro.dato_numerico || ""}
                        onChange={(e) =>
                          handleChange(
                            parametro.id,
                            "dato_numerico",
                            parseFloat(e.target.value) || null
                          )
                        }
                        disabled={parametro.tipo_dato !== "NUMERICO"}
                        className={`w-32 ${
                          parametro.tipo_dato !== "NUMERICO"
                            ? "bg-gray-50"
                            : ""
                        }`}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={parametro.dato_caracter}
                        onChange={(e) =>
                          handleChange(
                            parametro.id,
                            "dato_caracter",
                            e.target.value
                          )
                        }
                        disabled={parametro.tipo_dato !== "CARACTER"}
                        className={`w-40 ${
                          parametro.tipo_dato !== "CARACTER"
                            ? "bg-gray-50"
                            : ""
                        }`}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        value={parametro.dato_fecha}
                        onChange={(e) =>
                          handleChange(parametro.id, "dato_fecha", e.target.value)
                        }
                        disabled={parametro.tipo_dato !== "FECHA"}
                        className={`w-32 ${
                          parametro.tipo_dato !== "FECHA" ? "bg-gray-50" : ""
                        }`}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveRow(parametro.id)}
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



