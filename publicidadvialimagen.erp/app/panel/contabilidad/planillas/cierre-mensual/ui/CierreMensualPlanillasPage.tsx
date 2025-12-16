"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Toaster, toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Save, PlayCircle, RotateCcw, XCircle, Plus, Trash2 } from "lucide-react"
import PlanillasMensualesHeader from "../../_components/PlanillasMensualesHeader"
import { catalogosCierre, cierreMensualMockInicial, type CierreMensualForm, type TipoValor } from "@/lib/planillas/cierreMock"

export default function CierreMensualPlanillasPage() {
  const router = useRouter()
  const [form, setForm] = useState<CierreMensualForm>(cierreMensualMockInicial)

  const setCabecera = (patch: Partial<CierreMensualForm["cabecera"]>) =>
    setForm((prev) => ({ ...prev, cabecera: { ...prev.cabecera, ...patch } }))
  const setInformativo = (patch: Partial<CierreMensualForm["informativo"]>) =>
    setForm((prev) => ({ ...prev, informativo: { ...prev.informativo, ...patch } }))
  const setDescuentosAportes = (patch: Partial<CierreMensualForm["descuentos_aportes"]>) =>
    setForm((prev) => ({ ...prev, descuentos_aportes: { ...prev.descuentos_aportes, ...patch } }))

  const headerValue = useMemo(
    () => ({
      periodo: form.cabecera.periodo,
      empresa: form.cabecera.empresa,
      regional: form.cabecera.regional,
      sucursal: form.cabecera.sucursal,
    }),
    [form.cabecera]
  )

  const handleProcesar = () => toast.success("Mock: cierre procesado")
  const handleReabrir = () => toast.info("Mock: planilla reabierta")
  const handleGuardar = () => toast.success("Mock: guardado")
  const handleCancelar = () => {
    toast.info("Mock: cancelado")
    router.back()
  }

  const addIngreso = () =>
    setForm((p) => ({
      ...p,
      ingresos_varios: [...p.ingresos_varios, { tipo_ingreso: "", valor: 0, tipo: "SIN PORCENTAJE" }],
    }))
  const removeIngreso = (idx: number) =>
    setForm((p) => ({ ...p, ingresos_varios: p.ingresos_varios.filter((_, i) => i !== idx) }))

  const addDescuento = () =>
    setForm((p) => ({
      ...p,
      descuentos_varios: [...p.descuentos_varios, { tipo_descuento: "", valor: 0, tipo: "SIN PORCENTAJE" }],
    }))
  const removeDescuento = (idx: number) =>
    setForm((p) => ({ ...p, descuentos_varios: p.descuentos_varios.filter((_, i) => i !== idx) }))

  const tipoValorOptions = catalogosCierre.tipoValor.map((t) => ({ value: t, label: t }))

  const TipoValorSelect = ({
    value,
    onChange,
  }: {
    value: TipoValor
    onChange: (v: TipoValor) => void
  }) => (
    <Select value={value} onValueChange={(v) => onChange(v as TipoValor)}>
      <SelectTrigger>
        <SelectValue placeholder="Seleccione" />
      </SelectTrigger>
      <SelectContent>
        {tipoValorOptions.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  return (
    <>
      <Toaster position="top-right" />
      <div className="p-6 space-y-6">
        <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3">
          <h1 className="text-lg font-bold text-blue-900 tracking-wide">CIERRE MENSUAL DE PLANILLAS</h1>
          <p className="text-xs text-blue-800 mt-1">Mock (sin lógica real). Estado: {form.cabecera.estado}</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button size="sm" className="gap-2" onClick={handleProcesar}>
            <PlayCircle className="h-4 w-4" />
            Procesar Cierre
          </Button>
          <Button size="sm" variant="outline" className="gap-2" onClick={handleReabrir}>
            <RotateCcw className="h-4 w-4" />
            Reabrir
          </Button>
          <Button size="sm" variant="outline" className="gap-2" onClick={handleGuardar}>
            <Save className="h-4 w-4" />
            Guardar
          </Button>
          <Button size="sm" variant="outline" className="gap-2" onClick={handleCancelar}>
            <XCircle className="h-4 w-4" />
            Cancelar
          </Button>
          <Button size="sm" variant="outline" className="gap-2 ml-auto" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        </div>

        {/* Formulario principal (incluye header común + campos adicionales) */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <PlanillasMensualesHeader
              value={headerValue}
              onChange={(v) =>
                setCabecera({ periodo: v.periodo, empresa: v.empresa, regional: v.regional, sucursal: v.sucursal })
              }
            />

            <Card>
              <CardHeader className="pb-4">
                <CardTitle>Formulario principal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>De Fecha</Label>
                    <Input
                      type="date"
                      value={form.cabecera.de_fecha}
                      onChange={(e) => setCabecera({ de_fecha: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>A Fecha</Label>
                    <Input
                      type="date"
                      value={form.cabecera.a_fecha}
                      onChange={(e) => setCabecera({ a_fecha: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Select
                      value={form.cabecera.estado}
                      onValueChange={(v) => setCabecera({ estado: v as any })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione" />
                      </SelectTrigger>
                      <SelectContent>
                        {catalogosCierre.estados.map((e) => (
                          <SelectItem key={e} value={e}>
                            {e}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle>Descuentos y Aportes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>% RC-IVA</Label>
                    <Input
                      type="number"
                      value={form.descuentos_aportes.rc_iva_pct}
                      onChange={(e) => setDescuentosAportes({ rc_iva_pct: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>% Aportes C.N.S.</Label>
                    <Input
                      type="number"
                      value={form.descuentos_aportes.aportes_cns_pct}
                      onChange={(e) => setDescuentosAportes({ aportes_cns_pct: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>% Aportes FONVI</Label>
                    <Input
                      type="number"
                      value={form.descuentos_aportes.aportes_fonvi_pct}
                      onChange={(e) => setDescuentosAportes({ aportes_fonvi_pct: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Informativo (solo lectura) */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle>Informativo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    ["Básico Nacional", form.informativo.basico_nacional],
                    ["Días Trabajados", form.informativo.dias_trabajados],
                    ["Cotización SUS Anterior", form.informativo.cotizacion_sus_anterior],
                    ["Cotización SUS Actual", form.informativo.cotizacion_sus_actual],
                    ["UFV Anterior", form.informativo.ufv_anterior],
                    ["UFV Actual", form.informativo.ufv_actual],
                  ].map(([label, val]) => (
                    <div key={String(label)} className="flex items-center justify-between gap-3">
                      <span className="text-sm text-gray-700">{label}</span>
                      <Input
                        value={String(val)}
                        readOnly
                        className="w-[160px] text-right bg-gray-50"
                        onChange={() => {}}
                      />
                    </div>
                  ))}
                  <Separator className="my-1" />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      // mock: permitir “editar” informativo solo para pruebas visuales
                      toast.info("Mock: (solo lectura) bloque informativo")
                      setInformativo({ ufv_actual: form.informativo.ufv_actual })
                    }}
                  >
                    Ver detalle (mock)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Ingresos y Descuentos Generales */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Ingresos y Descuentos Generales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Ingresos Varios */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">Detalle de Ingresos Varios</h3>
                  <Button size="sm" variant="outline" className="gap-2" onClick={addIngreso}>
                    <Plus className="h-4 w-4" />
                    Agregar
                  </Button>
                </div>
                <div className="space-y-3">
                  {form.ingresos_varios.map((it, idx) => (
                    <Card key={`ing-${idx}`} className="border-gray-200">
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-2 md:col-span-1">
                            <Label>Tipo de Ingreso</Label>
                            <Input
                              value={it.tipo_ingreso}
                              onChange={(e) =>
                                setForm((p) => ({
                                  ...p,
                                  ingresos_varios: p.ingresos_varios.map((x, i) =>
                                    i === idx ? { ...x, tipo_ingreso: e.target.value } : x
                                  ),
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Valor</Label>
                            <Input
                              type="number"
                              value={it.valor}
                              onChange={(e) =>
                                setForm((p) => ({
                                  ...p,
                                  ingresos_varios: p.ingresos_varios.map((x, i) =>
                                    i === idx ? { ...x, valor: parseFloat(e.target.value) || 0 } : x
                                  ),
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Tipo</Label>
                            <TipoValorSelect
                              value={it.tipo}
                              onChange={(v) =>
                                setForm((p) => ({
                                  ...p,
                                  ingresos_varios: p.ingresos_varios.map((x, i) => (i === idx ? { ...x, tipo: v } : x)),
                                }))
                              }
                            />
                          </div>
                        </div>
                        <div className="flex justify-end mt-3">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-2"
                            onClick={() => removeIngreso(idx)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Quitar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {form.ingresos_varios.length === 0 && (
                    <div className="text-sm text-gray-500 border rounded-md p-4 bg-gray-50">
                      No hay ingresos varios registrados
                    </div>
                  )}
                </div>
              </div>

              {/* Descuentos Varios */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">Detalle de Descuentos Varios</h3>
                  <Button size="sm" variant="outline" className="gap-2" onClick={addDescuento}>
                    <Plus className="h-4 w-4" />
                    Agregar
                  </Button>
                </div>
                <div className="space-y-3">
                  {form.descuentos_varios.map((it, idx) => (
                    <Card key={`des-${idx}`} className="border-gray-200">
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-2 md:col-span-1">
                            <Label>Tipo de Descuento</Label>
                            <Input
                              value={it.tipo_descuento}
                              onChange={(e) =>
                                setForm((p) => ({
                                  ...p,
                                  descuentos_varios: p.descuentos_varios.map((x, i) =>
                                    i === idx ? { ...x, tipo_descuento: e.target.value } : x
                                  ),
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Valor</Label>
                            <Input
                              type="number"
                              value={it.valor}
                              onChange={(e) =>
                                setForm((p) => ({
                                  ...p,
                                  descuentos_varios: p.descuentos_varios.map((x, i) =>
                                    i === idx ? { ...x, valor: parseFloat(e.target.value) || 0 } : x
                                  ),
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Tipo</Label>
                            <TipoValorSelect
                              value={it.tipo}
                              onChange={(v) =>
                                setForm((p) => ({
                                  ...p,
                                  descuentos_varios: p.descuentos_varios.map((x, i) => (i === idx ? { ...x, tipo: v } : x)),
                                }))
                              }
                            />
                          </div>
                        </div>
                        <div className="flex justify-end mt-3">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-2"
                            onClick={() => removeDescuento(idx)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Quitar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {form.descuentos_varios.length === 0 && (
                    <div className="text-sm text-gray-500 border rounded-md p-4 bg-gray-50">
                      No hay descuentos varios registrados
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}


