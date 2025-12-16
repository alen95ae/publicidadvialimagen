"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2 } from "lucide-react"

interface TipoComprobanteNumeracion {
  id: string
  tipo_documento: string
  descripcion: string
  gestion: number
  numero_inicial: number
  numero_proximo: number
  fecha_inicial: string
  fecha_final: string
  estado: boolean
}

// Datos mock iniciales
const initialTipos: TipoComprobanteNumeracion[] = [
  {
    id: "1",
    tipo_documento: "DIA",
    descripcion: "Diario",
    gestion: 2024,
    numero_inicial: 1,
    numero_proximo: 150,
    fecha_inicial: "2024-01-01",
    fecha_final: "2024-12-31",
    estado: true,
  },
  {
    id: "2",
    tipo_documento: "ING",
    descripcion: "Ingreso",
    gestion: 2024,
    numero_inicial: 1,
    numero_proximo: 75,
    fecha_inicial: "2024-01-01",
    fecha_final: "2024-12-31",
    estado: true,
  },
  {
    id: "3",
    tipo_documento: "EGR",
    descripcion: "Egreso",
    gestion: 2024,
    numero_inicial: 1,
    numero_proximo: 50,
    fecha_inicial: "2024-01-01",
    fecha_final: "2024-12-31",
    estado: true,
  },
  {
    id: "4",
    tipo_documento: "TRA",
    descripcion: "Traspaso",
    gestion: 2024,
    numero_inicial: 1,
    numero_proximo: 25,
    fecha_inicial: "2024-01-01",
    fecha_final: "2024-12-31",
    estado: false,
  },
  {
    id: "5",
    tipo_documento: "CPP",
    descripcion: "Cuentas por Pagar",
    gestion: 2024,
    numero_inicial: 1,
    numero_proximo: 100,
    fecha_inicial: "2024-01-01",
    fecha_final: "2024-12-31",
    estado: true,
  },
]

export default function TiposComprobanteNumeracionGrid() {
  const [tipos, setTipos] = useState<TipoComprobanteNumeracion[]>(initialTipos)

  const handleAddRow = () => {
    const newTipo: TipoComprobanteNumeracion = {
      id: Date.now().toString(),
      tipo_documento: "",
      descripcion: "",
      gestion: new Date().getFullYear(),
      numero_inicial: 1,
      numero_proximo: 1,
      fecha_inicial: new Date().toISOString().split("T")[0],
      fecha_final: new Date().toISOString().split("T")[0],
      estado: true,
    }
    setTipos([...tipos, newTipo])
  }

  const handleRemoveRow = (id: string) => {
    setTipos(tipos.filter((t) => t.id !== id))
  }

  const handleChange = (id: string, field: keyof TipoComprobanteNumeracion, value: any) => {
    setTipos(tipos.map((t) => (t.id === id ? { ...t, [field]: value } : t)))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Tipos de Comprobante</CardTitle>
            <CardDescription>
              Configuración de tipos de comprobante y numeración
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
                <TableHead className="w-32">Tipo Documento</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="w-24">Gestión</TableHead>
                <TableHead className="w-32">Número Inicial</TableHead>
                <TableHead className="w-32">Número Próximo</TableHead>
                <TableHead className="w-32">Fecha Inicial</TableHead>
                <TableHead className="w-32">Fecha Final</TableHead>
                <TableHead className="w-24">Estado</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tipos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-gray-500 py-8">
                    No hay tipos de comprobante. Click en "Agregar Fila" para comenzar.
                  </TableCell>
                </TableRow>
              ) : (
                tipos.map((tipo) => (
                  <TableRow key={tipo.id}>
                    <TableCell>
                      <Input
                        value={tipo.tipo_documento}
                        onChange={(e) =>
                          handleChange(
                            tipo.id,
                            "tipo_documento",
                            e.target.value.toUpperCase()
                          )
                        }
                        className="w-32 font-mono"
                        placeholder="DIA"
                        maxLength={10}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={tipo.descripcion}
                        onChange={(e) =>
                          handleChange(tipo.id, "descripcion", e.target.value)
                        }
                        placeholder="Descripción del tipo"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="2000"
                        max="2100"
                        value={tipo.gestion}
                        onChange={(e) =>
                          handleChange(
                            tipo.id,
                            "gestion",
                            parseInt(e.target.value) || new Date().getFullYear()
                          )
                        }
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        value={tipo.numero_inicial}
                        onChange={(e) =>
                          handleChange(
                            tipo.id,
                            "numero_inicial",
                            parseInt(e.target.value) || 1
                          )
                        }
                        className="w-32 font-mono"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        value={tipo.numero_proximo}
                        onChange={(e) =>
                          handleChange(
                            tipo.id,
                            "numero_proximo",
                            parseInt(e.target.value) || 1
                          )
                        }
                        className="w-32 font-mono"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        value={tipo.fecha_inicial}
                        onChange={(e) =>
                          handleChange(tipo.id, "fecha_inicial", e.target.value)
                        }
                        className="w-32"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        value={tipo.fecha_final}
                        onChange={(e) =>
                          handleChange(tipo.id, "fecha_final", e.target.value)
                        }
                        className="w-32"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Checkbox
                          checked={tipo.estado}
                          onCheckedChange={(checked) =>
                            handleChange(tipo.id, "estado", !!checked)
                          }
                        />
                        <span className="ml-2 text-sm text-gray-600">
                          {tipo.estado ? "ACTIVO" : "INACTIVO"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveRow(tipo.id)}
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


