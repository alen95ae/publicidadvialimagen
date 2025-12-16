"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, Calculator, Save, Brush, Lock } from "lucide-react"

import {
  getDefaultCalculoPlanillasState,
  TIPO_DESCUENTOS_MOCK,
  TIPO_INGRESOS_MOCK,
  type CalculoPlanillasFormState,
  type TipoCalculoFila,
} from "@/lib/planillas/calculoPlanillasMock"

function toNumber(value: string, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function nowISO() {
  return new Date().toISOString()
}

export default function CalculoPlanillasPage() {
  const initialState = useMemo(() => getDefaultCalculoPlanillasState(), [])
  const [form, setForm] = useState<CalculoPlanillasFormState>(initialState)
  const [busy, setBusy] = useState<null | "calcular" | "guardar" | "cerrar">(null)

  const setField = <K extends keyof CalculoPlanillasFormState>(key: K, value: CalculoPlanillasFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const addIngreso = () => {
    const nextId = `ing-${Date.now()}`
    setForm((prev) => ({
      ...prev,
      ingresosVarios: [
        ...prev.ingresosVarios,
        { id: nextId, tipo: "Reintegro", valor: 0, tipoCalculo: "Sin Porcentaje" },
      ],
    }))
  }

  const addDescuento = () => {
    const nextId = `des-${Date.now()}`
    setForm((prev) => ({
      ...prev,
      descuentosVarios: [
        ...prev.descuentosVarios,
        { id: nextId, tipo: "Otros", valor: 0, tipoCalculo: "Sin Porcentaje" },
      ],
    }))
  }

  const updateIngreso = (id: string, patch: Partial<CalculoPlanillasFormState["ingresosVarios"][number]>) => {
    setForm((prev) => ({
      ...prev,
      ingresosVarios: prev.ingresosVarios.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }))
  }

  const updateDescuento = (id: string, patch: Partial<CalculoPlanillasFormState["descuentosVarios"][number]>) => {
    setForm((prev) => ({
      ...prev,
      descuentosVarios: prev.descuentosVarios.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }))
  }

  const removeIngreso = (id: string) => {
    setForm((prev) => ({ ...prev, ingresosVarios: prev.ingresosVarios.filter((r) => r.id !== id) }))
  }

  const removeDescuento = (id: string) => {
    setForm((prev) => ({ ...prev, descuentosVarios: prev.descuentosVarios.filter((r) => r.id !== id) }))
  }

  const handleLimpiar = () => {
    setForm(getDefaultCalculoPlanillasState())
    toast.success("Formulario limpiado (mock)")
  }

  const handleCalcular = async () => {
    if (form.estado === "Cerrada") {
      toast.error("El periodo está cerrado. No se puede recalcular.")
      return
    }
    setBusy("calcular")
    try {
      await new Promise((r) => setTimeout(r, 650))
      setForm((prev) => ({
        ...prev,
        calculoSimulado: { ...prev.calculoSimulado, ultimoCalculoAt: nowISO() },
      }))
      toast.success("Planilla calculada (simulado)")
    } finally {
      setBusy(null)
    }
  }

  const handleGuardar = async () => {
    setBusy("guardar")
    try {
      await new Promise((r) => setTimeout(r, 500))
      setForm((prev) => ({
        ...prev,
        calculoSimulado: { ...prev.calculoSimulado, guardadoAt: nowISO() },
      }))
      toast.success("Guardado (mock)")
    } finally {
      setBusy(null)
    }
  }

  const handleCerrarPeriodo = async () => {
    if (form.estado === "Cerrada") {
      toast.info("El periodo ya está cerrado.")
      return
    }
    setBusy("cerrar")
    try {
      await new Promise((r) => setTimeout(r, 600))
      setField("estado", "Cerrada")
      toast.success("Periodo cerrado (mock)")
    } finally {
      setBusy(null)
    }
  }

  const disabledEdicion = form.estado === "Cerrada" || busy !== null

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cálculo de Planillas</h1>
          <p className="text-gray-600 mt-2">
            Pantalla mock estilo ERP clásico (base para integración futura).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
            Datos (mock)
          </Badge>
          <Badge variant="outline" className={form.estado === "Cerrada" ? "bg-gray-100 text-gray-700" : "bg-yellow-50 text-yellow-800 border-yellow-200"}>
            Estado: {form.estado}
          </Badge>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={handleCalcular} disabled={busy !== null || form.estado === "Cerrada"} className="bg-[#D54644] hover:bg-[#B03A38]">
          <Calculator className="w-4 h-4 mr-2" />
          {busy === "calcular" ? "Calculando..." : "Calcular Planilla"}
        </Button>
        <Button variant="outline" onClick={handleGuardar} disabled={busy !== null}>
          <Save className="w-4 h-4 mr-2" />
          {busy === "guardar" ? "Guardando..." : "Guardar"}
        </Button>
        <Button variant="outline" onClick={handleLimpiar} disabled={busy !== null}>
          <Brush className="w-4 h-4 mr-2" />
          Limpiar
        </Button>
        <Button variant="outline" onClick={handleCerrarPeriodo} disabled={busy !== null || form.estado === "Cerrada"} className="border-gray-300">
          <Lock className="w-4 h-4 mr-2" />
          {busy === "cerrar" ? "Cerrando..." : "Cerrar Periodo"}
        </Button>
      </div>

      {/* BLOQUE 1 */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Datos de Planillas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label>Periodo</Label>
              <Input
                type="number"
                value={form.periodo}
                onChange={(e) => setField("periodo", toNumber(e.target.value, form.periodo))}
                disabled={disabledEdicion}
              />
            </div>
            <div className="space-y-2">
              <Label>Desde Fecha</Label>
              <Input
                type="date"
                value={form.desdeFecha}
                onChange={(e) => setField("desdeFecha", e.target.value)}
                disabled={disabledEdicion}
              />
            </div>
            <div className="space-y-2">
              <Label>Hasta Fecha</Label>
              <Input
                type="date"
                value={form.hastaFecha}
                onChange={(e) => setField("hastaFecha", e.target.value)}
                disabled={disabledEdicion}
              />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={form.estado} onValueChange={(v) => setField("estado", v as CalculoPlanillasFormState["estado"])} disabled={busy !== null}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Abierta">Abierta</SelectItem>
                  <SelectItem value="Cerrada">Cerrada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Básico Nacional</Label>
              <Input
                type="number"
                value={form.basicoNacional}
                onChange={(e) => setField("basicoNacional", toNumber(e.target.value))}
                disabled={disabledEdicion}
              />
            </div>
            <div className="space-y-2">
              <Label>Días Trabajados</Label>
              <Input
                type="number"
                value={form.diasTrabajados}
                onChange={(e) => setField("diasTrabajados", toNumber(e.target.value))}
                disabled={disabledEdicion}
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Datos de Cotización */}
            <div className="space-y-3">
              <div className="font-semibold text-gray-900">Datos de Cotización</div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cotización USD Anterior</Label>
                  <Input
                    type="number"
                    value={form.cotizacionUsdAnterior}
                    onChange={(e) => setField("cotizacionUsdAnterior", toNumber(e.target.value))}
                    disabled={disabledEdicion}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cotización USD Actual</Label>
                  <Input
                    type="number"
                    value={form.cotizacionUsdActual}
                    onChange={(e) => setField("cotizacionUsdActual", toNumber(e.target.value))}
                    disabled={disabledEdicion}
                  />
                </div>
                <div className="space-y-2">
                  <Label>U.F.V. Anterior</Label>
                  <Input
                    type="number"
                    value={form.ufvAnterior}
                    onChange={(e) => setField("ufvAnterior", toNumber(e.target.value))}
                    disabled={disabledEdicion}
                  />
                </div>
                <div className="space-y-2">
                  <Label>U.F.V. Actual</Label>
                  <Input
                    type="number"
                    value={form.ufvActual}
                    onChange={(e) => setField("ufvActual", toNumber(e.target.value))}
                    disabled={disabledEdicion}
                  />
                </div>
              </div>
            </div>

            {/* Info + Comprobante */}
            <div className="space-y-3">
              <div className="font-semibold text-gray-900">Información</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <div className="text-xs text-gray-500">Empresa</div>
                  <div className="text-sm font-medium text-gray-900">{form.empresa}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-gray-500">Regional</div>
                  <div className="text-sm font-medium text-gray-900">{form.regional}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-gray-500">Sucursal</div>
                  <div className="text-sm font-medium text-gray-900">{form.sucursal}</div>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <Label>Nº Comprobante</Label>
                <Input
                  value={form.nroComprobante}
                  onChange={(e) => setField("nroComprobante", e.target.value)}
                  placeholder="Ej: PLA-000123"
                  disabled={disabledEdicion}
                />
              </div>

              <div className="text-xs text-gray-500">
                Último cálculo:{" "}
                <span className="font-medium text-gray-700">
                  {form.calculoSimulado.ultimoCalculoAt ? new Date(form.calculoSimulado.ultimoCalculoAt).toLocaleString("es-ES") : "—"}
                </span>
                {" · "}
                Guardado:{" "}
                <span className="font-medium text-gray-700">
                  {form.calculoSimulado.guardadoAt ? new Date(form.calculoSimulado.guardadoAt).toLocaleString("es-ES") : "—"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* BLOQUE 2 */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Descuentos y Aportes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>% RC-IVA</Label>
              <Input
                type="number"
                value={form.porcentajeRcIva}
                onChange={(e) => setField("porcentajeRcIva", toNumber(e.target.value))}
                disabled={disabledEdicion}
              />
            </div>
            <div className="space-y-2">
              <Label>% Aportes C.N.S.</Label>
              <Input
                type="number"
                value={form.porcentajeAportesCns}
                onChange={(e) => setField("porcentajeAportesCns", toNumber(e.target.value))}
                disabled={disabledEdicion}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* BLOQUE 3 */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Ingresos y Descuentos Generales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* SUB-BLOQUE: INGRESOS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="font-semibold text-gray-900">Detalle de Ingresos Varios</div>
              <Button type="button" variant="outline" size="sm" onClick={addIngreso} disabled={disabledEdicion} className="gap-2">
                <Plus className="w-4 h-4" />
                Agregar
              </Button>
            </div>
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader className="bg-white">
                  <TableRow>
                    <TableHead className="min-w-[260px]">Tipo de Ingreso</TableHead>
                    <TableHead className="w-[160px]">Valor</TableHead>
                    <TableHead className="w-[220px]">Tipo de Cálculo</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {form.ingresosVarios.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <Select
                          value={r.tipo}
                          onValueChange={(v) => updateIngreso(r.id, { tipo: v })}
                          disabled={disabledEdicion}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Tipo de ingreso" />
                          </SelectTrigger>
                          <SelectContent>
                            {TIPO_INGRESOS_MOCK.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={r.valor}
                          onChange={(e) => updateIngreso(r.id, { valor: toNumber(e.target.value) })}
                          disabled={disabledEdicion}
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={r.tipoCalculo}
                          onValueChange={(v) => updateIngreso(r.id, { tipoCalculo: v as TipoCalculoFila })}
                          disabled={disabledEdicion}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Tipo de cálculo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Sin Porcentaje">Sin Porcentaje</SelectItem>
                            <SelectItem value="Con Porcentaje %">Con Porcentaje %</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeIngreso(r.id)}
                          disabled={disabledEdicion}
                          className="text-red-600 hover:text-red-700"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {form.ingresosVarios.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-sm text-gray-500 py-6">
                        Sin registros (mock)
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <Separator />

          {/* SUB-BLOQUE: DESCUENTOS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="font-semibold text-gray-900">Detalle de Descuentos Varios</div>
              <Button type="button" variant="outline" size="sm" onClick={addDescuento} disabled={disabledEdicion} className="gap-2">
                <Plus className="w-4 h-4" />
                Agregar
              </Button>
            </div>
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader className="bg-white">
                  <TableRow>
                    <TableHead className="min-w-[260px]">Tipo de Descuento</TableHead>
                    <TableHead className="w-[160px]">Valor</TableHead>
                    <TableHead className="w-[220px]">Tipo de Cálculo</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {form.descuentosVarios.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <Select
                          value={r.tipo}
                          onValueChange={(v) => updateDescuento(r.id, { tipo: v })}
                          disabled={disabledEdicion}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Tipo de descuento" />
                          </SelectTrigger>
                          <SelectContent>
                            {TIPO_DESCUENTOS_MOCK.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={r.valor}
                          onChange={(e) => updateDescuento(r.id, { valor: toNumber(e.target.value) })}
                          disabled={disabledEdicion}
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={r.tipoCalculo}
                          onValueChange={(v) => updateDescuento(r.id, { tipoCalculo: v as TipoCalculoFila })}
                          disabled={disabledEdicion}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Tipo de cálculo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Sin Porcentaje">Sin Porcentaje</SelectItem>
                            <SelectItem value="Con Porcentaje %">Con Porcentaje %</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeDescuento(r.id)}
                          disabled={disabledEdicion}
                          className="text-red-600 hover:text-red-700"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {form.descuentosVarios.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-sm text-gray-500 py-6">
                        Sin registros (mock)
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


