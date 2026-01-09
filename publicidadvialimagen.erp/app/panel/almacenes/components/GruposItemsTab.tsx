"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"

interface GrupoItem {
  id: number
  nivel: number
  grupo: string
  subgrupo: string
  codigo: string
  descripcion: string
  tipo_item: string
  cuenta_ingreso: string
  cuenta_gasto: string
  estado: boolean
}

interface ItemPorGrupo {
  codigo_item: string
  descripcion: string
  unidad: string
  costo_bs: number
  costo_usd: number
  precio_bs: number
  estado: string
}

export default function GruposItemsTab() {
  const [grupos, setGrupos] = useState<GrupoItem[]>([
    {
      id: 1,
      nivel: 1,
      grupo: "Lonas",
      subgrupo: "",
      codigo: "GRP-001",
      descripcion: "Grupo de Lonas",
      tipo_item: "Lonas",
      cuenta_ingreso: "4.1.1.001",
      cuenta_gasto: "5.1.1.001",
      estado: true,
    },
    {
      id: 2,
      nivel: 2,
      grupo: "Lonas",
      subgrupo: "Lonas Publicitarias",
      codigo: "GRP-002",
      descripcion: "Subgrupo Lonas Publicitarias",
      tipo_item: "Lonas",
      cuenta_ingreso: "4.1.1.002",
      cuenta_gasto: "5.1.1.002",
      estado: true,
    },
    {
      id: 3,
      nivel: 1,
      grupo: "Materiales",
      subgrupo: "",
      codigo: "GRP-003",
      descripcion: "Grupo de Materiales",
      tipo_item: "Materiales",
      cuenta_ingreso: "4.1.2.001",
      cuenta_gasto: "5.1.2.001",
      estado: true,
    },
  ])

  const [itemsPorGrupo, setItemsPorGrupo] = useState<ItemPorGrupo[]>([
    {
      codigo_item: "ITEM-001",
      descripcion: "Lona 6x4",
      unidad: "Unidad",
      costo_bs: 150.00,
      costo_usd: 21.50,
      precio_bs: 200.00,
      estado: "Activo",
    },
    {
      codigo_item: "ITEM-002",
      descripcion: "Lona 3x2",
      unidad: "Unidad",
      costo_bs: 80.00,
      costo_usd: 11.50,
      precio_bs: 120.00,
      estado: "Activo",
    },
    {
      codigo_item: "ITEM-003",
      descripcion: "Herramienta Manual",
      unidad: "Unidad",
      costo_bs: 200.00,
      costo_usd: 28.75,
      precio_bs: 280.00,
      estado: "Activo",
    },
  ])

  const handleGrupoChange = (id: number, field: keyof GrupoItem, value: string | number | boolean) => {
    setGrupos(grupos.map((g) => (g.id === id ? { ...g, [field]: value } : g)))
  }

  const handleAddGrupo = () => {
    const newId = grupos.length > 0 ? Math.max(...grupos.map((g) => g.id)) + 1 : 1
    setGrupos([
      ...grupos,
      {
        id: newId,
        nivel: 1,
        grupo: "",
        subgrupo: "",
        codigo: `GRP-${String(newId).padStart(3, "0")}`,
        descripcion: "",
        tipo_item: "Lonas",
        cuenta_ingreso: "",
        cuenta_gasto: "",
        estado: true,
      },
    ])
  }

  const handleRemoveGrupo = (id: number) => {
    setGrupos(grupos.filter((g) => g.id !== id))
  }

  return (
    <div className="space-y-6">
      {/* Tabla de Grupos de Ítems */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Registro de Grupos de Ítems</CardTitle>
              <CardDescription>Gestión de grupos y subgrupos de ítems</CardDescription>
            </div>
            <Button onClick={handleAddGrupo} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Grupo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Nivel</TableHead>
                  <TableHead className="w-32">Grupo</TableHead>
                  <TableHead className="w-40">Subgrupo</TableHead>
                  <TableHead className="w-32">Código</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="w-40">Tipo de Ítem</TableHead>
                  <TableHead className="w-32">Cuenta Ingreso</TableHead>
                  <TableHead className="w-32">Cuenta Gasto</TableHead>
                  <TableHead className="w-24">Estado</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grupos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-gray-500 py-8">
                      No hay grupos. Click en "Agregar Grupo" para comenzar.
                    </TableCell>
                  </TableRow>
                ) : (
                  grupos.map((grupo) => (
                    <TableRow key={grupo.id}>
                      <TableCell>
                        <Input
                          type="number"
                          value={grupo.nivel}
                          onChange={(e) =>
                            handleGrupoChange(grupo.id, "nivel", parseInt(e.target.value) || 1)
                          }
                          className="w-20"
                          min={1}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={grupo.grupo}
                          onChange={(e) => handleGrupoChange(grupo.id, "grupo", e.target.value)}
                          placeholder="Grupo"
                          className="w-32"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={grupo.subgrupo}
                          onChange={(e) => handleGrupoChange(grupo.id, "subgrupo", e.target.value)}
                          placeholder="Subgrupo"
                          className="w-40"
                        />
                      </TableCell>
                      <TableCell className="font-mono">{grupo.codigo}</TableCell>
                      <TableCell>
                        <Input
                          value={grupo.descripcion}
                          onChange={(e) =>
                            handleGrupoChange(grupo.id, "descripcion", e.target.value)
                          }
                          placeholder="Descripción"
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={grupo.tipo_item}
                          onValueChange={(value) => handleGrupoChange(grupo.id, "tipo_item", value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Lonas">Lonas</SelectItem>
                            <SelectItem value="Materiales">Materiales</SelectItem>
                            <SelectItem value="Herramientas">Herramientas</SelectItem>
                            <SelectItem value="Seguridad">Seguridad</SelectItem>
                            <SelectItem value="Insumos">Insumos</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={grupo.cuenta_ingreso}
                          onChange={(e) =>
                            handleGrupoChange(grupo.id, "cuenta_ingreso", e.target.value)
                          }
                          placeholder="Cuenta Ingreso"
                          className="w-32 font-mono"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={grupo.cuenta_gasto}
                          onChange={(e) =>
                            handleGrupoChange(grupo.id, "cuenta_gasto", e.target.value)
                          }
                          placeholder="Cuenta Gasto"
                          className="w-32 font-mono"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={grupo.estado}
                            onCheckedChange={(checked) =>
                              handleGrupoChange(grupo.id, "estado", !!checked)
                            }
                          />
                          <Label className="text-xs">
                            {grupo.estado ? "Activo" : "Inactivo"}
                          </Label>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveGrupo(grupo.id)}
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

      <Separator />

      {/* Lista de Ítems por Grupo */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Ítems por Grupo</CardTitle>
          <CardDescription>Ítems asociados al grupo seleccionado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Código Ítem</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="w-24">Unidad</TableHead>
                  <TableHead className="w-32 text-right">Costo Bs.</TableHead>
                  <TableHead className="w-32 text-right">Costo $us.</TableHead>
                  <TableHead className="w-32 text-right">Precio Bs.</TableHead>
                  <TableHead className="w-24">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itemsPorGrupo.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                      No hay ítems registrados para este grupo
                    </TableCell>
                  </TableRow>
                ) : (
                  itemsPorGrupo.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono">{item.codigo_item}</TableCell>
                      <TableCell>{item.descripcion}</TableCell>
                      <TableCell>{item.unidad}</TableCell>
                      <TableCell className="text-right font-mono">
                        {item.costo_bs.toLocaleString("es-ES", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {item.costo_usd.toLocaleString("es-ES", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {item.precio_bs.toLocaleString("es-ES", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            item.estado === "Activo"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {item.estado}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}







