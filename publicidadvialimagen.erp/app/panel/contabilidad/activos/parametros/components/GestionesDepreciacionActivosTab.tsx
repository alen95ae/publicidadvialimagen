"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2 } from "lucide-react"

type EstadoGestion = "Pendiente" | "Depreciado" | "Contabilizado"
type Moneda = "BOB" | "USD"

interface GestionDepreciacionRow {
  id: number
  gestion: string
  desde_fecha: string
  hasta_fecha: string
  moneda: Moneda
  tipo_cambio_inicial: number
  tipo_cambio_final: number
  estado: EstadoGestion
}

function todayISO() {
  return new Date().toISOString().split("T")[0]
}

function toNumber(value: string, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export default function GestionesDepreciacionActivosTab() {
  const currentYear = new Date().getFullYear()

  const [org, setOrg] = useState({
    empresa: "001",
    regional: "01",
    sucursal: "001",
    clasificador: "CONTABILIDAD",
  })

  const defaultRows: GestionDepreciacionRow[] = useMemo(
    () => [
      {
        id: 1,
        gestion: currentYear.toString(),
        desde_fecha: new Date(currentYear, 0, 1).toISOString().split("T")[0],
        hasta_fecha: new Date(currentYear, 11, 31).toISOString().split("T")[0],
        moneda: "BOB",
        tipo_cambio_inicial: 6.96,
        tipo_cambio_final: 6.96,
        estado: "Pendiente",
      },
      {
        id: 2,
        gestion: (currentYear - 1).toString(),
        desde_fecha: new Date(currentYear - 1, 0, 1).toISOString().split("T")[0],
        hasta_fecha: new Date(currentYear - 1, 11, 31).toISOString().split("T")[0],
        moneda: "BOB",
        tipo_cambio_inicial: 6.86,
        tipo_cambio_final: 6.96,
        estado: "Depreciado",
      },
    ],
    [currentYear]
  )

  const [rows, setRows] = useState<GestionDepreciacionRow[]>(defaultRows)

  const addRow = () => {
    const nextId = (rows.at(-1)?.id || 0) + 1
    setRows((prev) => [
      ...prev,
      {
        id: nextId,
        gestion: currentYear.toString(),
        desde_fecha: todayISO(),
        hasta_fecha: todayISO(),
        moneda: "BOB",
        tipo_cambio_inicial: 6.96,
        tipo_cambio_final: 6.96,
        estado: "Pendiente",
      },
    ])
  }

  const removeRow = (id: number) => setRows((prev) => prev.filter((r) => r.id !== id))

  const updateRow = <K extends keyof GestionDepreciacionRow>(
    id: number,
    key: K,
    value: GestionDepreciacionRow[K]
  ) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Datos Organizativos</CardTitle>
          <CardDescription>
            Datos base para configurar gestiones (mock, sin conexión).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Select value={org.empresa} onValueChange={(v) => setOrg((p) => ({ ...p, empresa: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="001">001</SelectItem>
                  <SelectItem value="002">002</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Regional</Label>
              <Select
                value={org.regional}
                onValueChange={(v) => setOrg((p) => ({ ...p, regional: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Regional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="01">01</SelectItem>
                  <SelectItem value="02">02</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sucursal</Label>
              <Select
                value={org.sucursal}
                onValueChange={(v) => setOrg((p) => ({ ...p, sucursal: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sucursal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="001">001</SelectItem>
                  <SelectItem value="002">002</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Clasificador / Área Contable</Label>
              <Select
                value={org.clasificador}
                onValueChange={(v) => setOrg((p) => ({ ...p, clasificador: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Clasificador" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONTABILIDAD">CONTABILIDAD</SelectItem>
                  <SelectItem value="ACTIVOS_FIJOS">ACTIVOS_FIJOS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Gestiones para la Depreciación de Activos</CardTitle>
          <CardDescription>Tabla editable (mock), preparada para enlazar con el proceso.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              Configura periodos, moneda y estado (sin cálculos reales).
            </div>
            <Button type="button" onClick={addRow} className="gap-2">
              <Plus className="h-4 w-4" />
              Agregar fila
            </Button>
          </div>

          <Separator />

          <div className="border rounded-md overflow-hidden">
            <div className="max-h-[520px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-white z-10">
                  <TableRow>
                    <TableHead className="w-[120px]">Gestión</TableHead>
                    <TableHead className="w-[160px]">Desde Fecha</TableHead>
                    <TableHead className="w-[160px]">Hasta Fecha</TableHead>
                    <TableHead className="w-[160px]">Moneda</TableHead>
                    <TableHead className="w-[190px]">Tipo de Cambio Inicial</TableHead>
                    <TableHead className="w-[190px]">Tipo de Cambio Final</TableHead>
                    <TableHead className="w-[220px]">Estado</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <Input
                          value={r.gestion}
                          onChange={(e) => updateRow(r.id, "gestion", e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="date"
                          value={r.desde_fecha}
                          onChange={(e) => updateRow(r.id, "desde_fecha", e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="date"
                          value={r.hasta_fecha}
                          onChange={(e) => updateRow(r.id, "hasta_fecha", e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={r.moneda}
                          onValueChange={(v) => updateRow(r.id, "moneda", v as Moneda)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Moneda" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BOB">Bs (BOB)</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={r.tipo_cambio_inicial}
                          onChange={(e) =>
                            updateRow(r.id, "tipo_cambio_inicial", toNumber(e.target.value, 0))
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={r.tipo_cambio_final}
                          onChange={(e) =>
                            updateRow(r.id, "tipo_cambio_final", toNumber(e.target.value, 0))
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={r.estado}
                          onValueChange={(v) => updateRow(r.id, "estado", v as EstadoGestion)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Estado" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pendiente">Pendiente</SelectItem>
                            <SelectItem value="Depreciado">Depreciado</SelectItem>
                            <SelectItem value="Contabilizado">Contabilizado</SelectItem>
                          </SelectContent>
                        </Select>
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
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}







