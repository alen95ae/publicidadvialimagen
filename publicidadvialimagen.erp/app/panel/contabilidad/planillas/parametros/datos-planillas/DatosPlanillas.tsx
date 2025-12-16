"use client"

import { useState } from "react"
import { Toaster, toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  catalogosDatosPlanillas,
  datosPlanillasMockInicial,
  type CuentaPlanillaRow,
  type DatosPlanillaParametros,
  type FirmaPlanillaRow,
  type TipoCuenta,
} from "@/lib/planillas/datosPlanillasMock"
import { Plus, Trash2, Save, XCircle } from "lucide-react"

export default function DatosPlanillas() {
  const [parametros, setParametros] = useState<DatosPlanillaParametros>(datosPlanillasMockInicial.parametros)
  const [cuentas, setCuentas] = useState<CuentaPlanillaRow[]>(datosPlanillasMockInicial.cuentas)
  const [firmas, setFirmas] = useState<FirmaPlanillaRow[]>(datosPlanillasMockInicial.firmas)

  const guardar = () => {
    toast.success("Mock: datos guardados")
  }

  const cancelar = () => {
    if (!confirm("¿Cancelar cambios y restaurar valores mock iniciales?")) return
    setParametros(datosPlanillasMockInicial.parametros)
    setCuentas(datosPlanillasMockInicial.cuentas)
    setFirmas(datosPlanillasMockInicial.firmas)
    toast.info("Mock: cambios cancelados")
  }

  const addCuenta = () => {
    const nextIndice = Math.max(0, ...cuentas.map((c) => c.indice)) + 1
    const id = `${Date.now()}`
    const nueva: CuentaPlanillaRow = {
      id,
      indice: nextIndice,
      clasificador: "",
      cuenta_contable: "",
      codigo: "",
      tipo_cuenta: "DEBE",
    }
    setCuentas((p) => [...p, nueva])
  }

  const removeCuenta = (id: string) => setCuentas((p) => p.filter((x) => x.id !== id))

  const addFirma = () => {
    const nextNumero = Math.max(0, ...firmas.map((f) => f.numero)) + 1
    const id = `${Date.now()}`
    const nueva: FirmaPlanillaRow = { id, numero: nextNumero, codigo: "", nombre: "", cargo: "" }
    setFirmas((p) => [...p, nueva])
  }

  const removeFirma = (id: string) => setFirmas((p) => p.filter((x) => x.id !== id))

  const setParam = (k: keyof DatosPlanillaParametros, v: any) => setParametros((p) => ({ ...p, [k]: v }))

  // Subcomponentes internos por pestaña (según requerimiento)
  const ParametrosTab = () => (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Parámetros</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Datos del Período */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Datos del Período</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Periodo (YYYYMM)</Label>
              <Input value={parametros.periodo} onChange={(e) => setParam("periodo", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Fecha Desde</Label>
              <Input
                type="date"
                value={parametros.fecha_desde}
                onChange={(e) => setParam("fecha_desde", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha Hasta</Label>
              <Input
                type="date"
                value={parametros.fecha_hasta}
                onChange={(e) => setParam("fecha_hasta", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={parametros.estado} onValueChange={(v) => setParam("estado", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione" />
                </SelectTrigger>
                <SelectContent>
                  {catalogosDatosPlanillas.estados.map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Días Trabajados</Label>
              <Input
                type="number"
                value={parametros.dias_trabajados}
                onChange={(e) => setParam("dias_trabajados", parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Valores Generales */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Valores Generales</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Básico Nacional</Label>
              <Input
                type="number"
                value={parametros.basico_nacional}
                onChange={(e) => setParam("basico_nacional", parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>Cotización Sus. Anterior</Label>
              <Input
                type="number"
                value={parametros.cotizacion_sus_anterior}
                onChange={(e) => setParam("cotizacion_sus_anterior", parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>Cotización Sus Actual</Label>
              <Input
                type="number"
                value={parametros.cotizacion_sus_actual}
                onChange={(e) => setParam("cotizacion_sus_actual", parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>UFV Anterior</Label>
              <Input
                type="number"
                value={parametros.ufv_anterior}
                onChange={(e) => setParam("ufv_anterior", parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>UFV Actual</Label>
              <Input
                type="number"
                value={parametros.ufv_actual}
                onChange={(e) => setParam("ufv_actual", parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Descuentos y Aportes */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Descuentos y Aportes</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>% RC-IVA</Label>
              <Input
                type="number"
                value={parametros.rc_iva_pct}
                onChange={(e) => setParam("rc_iva_pct", parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>% Aportes C.N.S.</Label>
              <Input
                type="number"
                value={parametros.aportes_cns_pct}
                onChange={(e) => setParam("aportes_cns_pct", parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>% Aportes FONVI</Label>
              <Input
                type="number"
                value={parametros.aportes_fonvi_pct}
                onChange={(e) => setParam("aportes_fonvi_pct", parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" className="gap-2" onClick={cancelar}>
            <XCircle className="h-4 w-4" />
            Cancelar
          </Button>
          <Button className="gap-2" onClick={guardar}>
            <Save className="h-4 w-4" />
            Guardar
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const CuentasTab = () => (
    <Card>
      <CardHeader className="pb-4 flex flex-row items-center justify-between">
        <CardTitle>Cuentas para Contabilizar Planillas</CardTitle>
        <Button size="sm" variant="outline" className="gap-2" onClick={addCuenta}>
          <Plus className="h-4 w-4" />
          Agregar fila
        </Button>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <div className="max-h-[520px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-100 z-10">
                  <tr className="text-gray-700">
                    <th className="p-2 text-right w-[110px]">Índice</th>
                    <th className="p-2 text-left w-[220px]">Clasificador</th>
                    <th className="p-2 text-left w-[200px]">Cuenta</th>
                    <th className="p-2 text-left w-[200px]">Código</th>
                    <th className="p-2 text-left w-[170px]">Tipo de Cuenta</th>
                    <th className="p-2 text-left w-[80px]"></th>
                  </tr>
                </thead>
                <tbody>
                  {cuentas.map((c) => (
                    <tr key={c.id} className="border-t hover:bg-gray-50">
                      <td className="p-2">
                        <Input
                          type="number"
                          value={c.indice}
                          onChange={(e) =>
                            setCuentas((p) =>
                              p.map((x) => (x.id === c.id ? { ...x, indice: parseFloat(e.target.value) || 0 } : x))
                            )
                          }
                          className="text-right"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          value={c.clasificador}
                          onChange={(e) =>
                            setCuentas((p) => p.map((x) => (x.id === c.id ? { ...x, clasificador: e.target.value } : x)))
                          }
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          value={c.cuenta_contable}
                          onChange={(e) =>
                            setCuentas((p) =>
                              p.map((x) => (x.id === c.id ? { ...x, cuenta_contable: e.target.value } : x))
                            )
                          }
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          value={c.codigo}
                          onChange={(e) =>
                            setCuentas((p) => p.map((x) => (x.id === c.id ? { ...x, codigo: e.target.value } : x)))
                          }
                        />
                      </td>
                      <td className="p-2">
                        <Select
                          value={c.tipo_cuenta}
                          onValueChange={(v) =>
                            setCuentas((p) =>
                              p.map((x) => (x.id === c.id ? { ...x, tipo_cuenta: v as TipoCuenta } : x))
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione" />
                          </SelectTrigger>
                          <SelectContent>
                            {catalogosDatosPlanillas.tiposCuenta.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => removeCuenta(c.id)}
                          title="Eliminar fila"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {cuentas.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">
                        No hay filas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const FirmasTab = () => (
    <Card>
      <CardHeader className="pb-4 flex flex-row items-center justify-between">
        <CardTitle>Firmas Autorizadas de Planillas</CardTitle>
        <Button size="sm" variant="outline" className="gap-2" onClick={addFirma}>
          <Plus className="h-4 w-4" />
          Agregar fila
        </Button>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <div className="max-h-[520px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-100 z-10">
                  <tr className="text-gray-700">
                    <th className="p-2 text-right w-[120px]">Número</th>
                    <th className="p-2 text-left w-[180px]">Código</th>
                    <th className="p-2 text-left w-[260px]">Nombre</th>
                    <th className="p-2 text-left w-[260px]">Cargo</th>
                    <th className="p-2 text-left w-[80px]"></th>
                  </tr>
                </thead>
                <tbody>
                  {firmas.map((f) => (
                    <tr key={f.id} className="border-t hover:bg-gray-50">
                      <td className="p-2">
                        <Input
                          type="number"
                          value={f.numero}
                          onChange={(e) =>
                            setFirmas((p) =>
                              p.map((x) => (x.id === f.id ? { ...x, numero: parseFloat(e.target.value) || 0 } : x))
                            )
                          }
                          className="text-right"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          value={f.codigo}
                          onChange={(e) =>
                            setFirmas((p) => p.map((x) => (x.id === f.id ? { ...x, codigo: e.target.value } : x)))
                          }
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          value={f.nombre}
                          onChange={(e) =>
                            setFirmas((p) => p.map((x) => (x.id === f.id ? { ...x, nombre: e.target.value } : x)))
                          }
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          value={f.cargo}
                          onChange={(e) =>
                            setFirmas((p) => p.map((x) => (x.id === f.id ? { ...x, cargo: e.target.value } : x)))
                          }
                        />
                      </td>
                      <td className="p-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => removeFirma(f.id)}
                          title="Eliminar fila"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {firmas.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">
                        No hay filas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <>
      <Toaster position="top-right" />
      <div className="p-6 space-y-6">
        <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3">
          <h1 className="text-lg font-bold text-blue-900 tracking-wide">DATOS DE PLANILLAS</h1>
          <p className="text-xs text-blue-800 mt-1">Parámetros y configuración (mock, sin lógica contable real).</p>
        </div>

        <Tabs defaultValue="parametros" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="parametros">Parámetros</TabsTrigger>
            <TabsTrigger value="cuentas">Cuentas</TabsTrigger>
            <TabsTrigger value="firmas">Firmas</TabsTrigger>
          </TabsList>

          {/* TAB 1: PARAMETROS */}
          <TabsContent value="parametros" className="mt-0 space-y-4">
            <ParametrosTab />
          </TabsContent>

          {/* TAB 2: CUENTAS */}
          <TabsContent value="cuentas" className="mt-0 space-y-4">
            <CuentasTab />
          </TabsContent>

          {/* TAB 3: FIRMAS */}
          <TabsContent value="firmas" className="mt-0 space-y-4">
            <FirmasTab />
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}


