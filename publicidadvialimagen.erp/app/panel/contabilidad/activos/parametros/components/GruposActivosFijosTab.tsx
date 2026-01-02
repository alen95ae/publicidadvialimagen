"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"

type DepreciableFlag = "DEPRECIABLE" | "NO_DEPRECIABLE"

interface GrupoActivoFijoRow {
  id: number
  grupo: string
  descripcion: string
  vida_util_anios: number
  porcentaje_depreciacion_anual: number
  cuenta_activo: string
  cuenta_depreciacion: string
  cuenta_depreciacion_acumulada: string
  cuenta_ajuste: string
  depreciable: DepreciableFlag
  alta: boolean
}

function toNumber(value: string, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export default function GruposActivosFijosTab() {
  const defaultRows: GrupoActivoFijoRow[] = useMemo(
    () => [
      {
        id: 1,
        grupo: "01",
        descripcion: "Equipo de Computación",
        vida_util_anios: 4,
        porcentaje_depreciacion_anual: 25,
        cuenta_activo: "1-1-01-001",
        cuenta_depreciacion: "6-1-01-001",
        cuenta_depreciacion_acumulada: "1-1-09-001",
        cuenta_ajuste: "1-1-99-001",
        depreciable: "DEPRECIABLE",
        alta: true,
      },
      {
        id: 2,
        grupo: "02",
        descripcion: "Mobiliario y Enseres",
        vida_util_anios: 10,
        porcentaje_depreciacion_anual: 10,
        cuenta_activo: "1-1-02-001",
        cuenta_depreciacion: "6-1-02-001",
        cuenta_depreciacion_acumulada: "1-1-09-002",
        cuenta_ajuste: "1-1-99-002",
        depreciable: "DEPRECIABLE",
        alta: true,
      },
      {
        id: 3,
        grupo: "99",
        descripcion: "Activos No Depreciables (Mock)",
        vida_util_anios: 0,
        porcentaje_depreciacion_anual: 0,
        cuenta_activo: "1-1-99-999",
        cuenta_depreciacion: "",
        cuenta_depreciacion_acumulada: "",
        cuenta_ajuste: "",
        depreciable: "NO_DEPRECIABLE",
        alta: true,
      },
    ],
    []
  )

  const [rows, setRows] = useState<GrupoActivoFijoRow[]>(defaultRows)

  const addRow = () => {
    const nextId = (rows.at(-1)?.id || 0) + 1
    setRows((prev) => [
      ...prev,
      {
        id: nextId,
        grupo: "",
        descripcion: "",
        vida_util_anios: 5,
        porcentaje_depreciacion_anual: 20,
        cuenta_activo: "",
        cuenta_depreciacion: "",
        cuenta_depreciacion_acumulada: "",
        cuenta_ajuste: "",
        depreciable: "DEPRECIABLE",
        alta: true,
      },
    ])
  }

  const removeRow = (id: number) => {
    setRows((prev) => prev.filter((r) => r.id !== id))
  }

  const updateRow = <K extends keyof GrupoActivoFijoRow>(
    id: number,
    key: K,
    value: GrupoActivoFijoRow[K]
  ) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)))
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Registro de Grupos de Activos Fijos</CardTitle>
        <CardDescription>
          Configuración base de grupos, vida útil y cuentas (solo UI mock).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            Edita los valores inline. Validaciones solo visuales.
          </div>
          <Button type="button" onClick={addRow} className="gap-2">
            <Plus className="h-4 w-4" />
            Agregar fila
          </Button>
        </div>

        <div className="border rounded-md overflow-hidden">
          <div className="max-h-[520px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow>
                  <TableHead className="w-[90px]">Grupo</TableHead>
                  <TableHead className="min-w-[260px]">Descripción</TableHead>
                  <TableHead className="w-[120px]">Vida Útil (años)</TableHead>
                  <TableHead className="w-[160px]">% Dep. Anual</TableHead>
                  <TableHead className="min-w-[160px]">Cuenta Activo</TableHead>
                  <TableHead className="min-w-[180px]">Cuenta Depreciación</TableHead>
                  <TableHead className="min-w-[220px]">Cuenta Deprec. Acum.</TableHead>
                  <TableHead className="min-w-[160px]">Cuenta Ajuste</TableHead>
                  <TableHead className="w-[190px]">Depreciable</TableHead>
                  <TableHead className="w-[90px]">Alta</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const invalidGrupo = r.grupo.trim().length === 0
                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        <Input
                          value={r.grupo}
                          onChange={(e) => updateRow(r.id, "grupo", e.target.value)}
                          className={invalidGrupo ? "border-red-300 focus-visible:ring-red-200" : ""}
                        />
                        {invalidGrupo && (
                          <div className="mt-1 text-xs text-red-600">Requerido</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Input
                          value={r.descripcion}
                          onChange={(e) => updateRow(r.id, "descripcion", e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={r.vida_util_anios}
                          onChange={(e) => updateRow(r.id, "vida_util_anios", toNumber(e.target.value))}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={r.porcentaje_depreciacion_anual}
                          onChange={(e) =>
                            updateRow(r.id, "porcentaje_depreciacion_anual", toNumber(e.target.value))
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={r.cuenta_activo}
                          onChange={(e) => updateRow(r.id, "cuenta_activo", e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={r.cuenta_depreciacion}
                          onChange={(e) => updateRow(r.id, "cuenta_depreciacion", e.target.value)}
                          disabled={r.depreciable === "NO_DEPRECIABLE"}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={r.cuenta_depreciacion_acumulada}
                          onChange={(e) =>
                            updateRow(r.id, "cuenta_depreciacion_acumulada", e.target.value)
                          }
                          disabled={r.depreciable === "NO_DEPRECIABLE"}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={r.cuenta_ajuste}
                          onChange={(e) => updateRow(r.id, "cuenta_ajuste", e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Label className="sr-only">Depreciable</Label>
                        <Select
                          value={r.depreciable}
                          onValueChange={(v) => updateRow(r.id, "depreciable", v as DepreciableFlag)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DEPRECIABLE">Depreciable</SelectItem>
                            <SelectItem value="NO_DEPRECIABLE">No Depreciable</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={r.alta}
                            onCheckedChange={(v) => updateRow(r.id, "alta", Boolean(v))}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRow(r.id)}
                          className="text-red-600 hover:text-red-700"
                          aria-label="Eliminar fila"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}






