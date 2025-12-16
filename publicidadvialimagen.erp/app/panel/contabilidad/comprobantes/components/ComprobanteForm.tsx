"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Plus, Save, Trash2, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/fetcher"
import type { Comprobante, ComprobanteDetalle, OrigenComprobante, TipoComprobante, TipoAsiento, EstadoComprobante, Moneda, Cuenta } from "@/lib/types/contabilidad"

interface ComprobanteFormProps {
  comprobante: Comprobante | null
  onNew: () => void
  onSave: () => void
}

const ORIGENES: OrigenComprobante[] = ["Contabilidad", "Ventas", "Tesorería", "Activos", "Planillas"]
const TIPOS_COMPROBANTE: TipoComprobante[] = ["Ingreso", "Egreso", "Diario", "Traspaso", "Ctas por Pagar"]
const TIPOS_ASIENTO: TipoAsiento[] = ["Normal", "Apertura", "Cierre", "Ajuste"]
const MONEDAS: Moneda[] = ["BOB", "USD"]
const MESES = [
  { value: 1, label: "Enero" },
  { value: 2, label: "Febrero" },
  { value: 3, label: "Marzo" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Mayo" },
  { value: 6, label: "Junio" },
  { value: 7, label: "Julio" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Septiembre" },
  { value: 10, label: "Octubre" },
  { value: 11, label: "Noviembre" },
  { value: 12, label: "Diciembre" },
]

export default function ComprobanteForm({ comprobante, onNew, onSave }: ComprobanteFormProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  const [loadingCuentas, setLoadingCuentas] = useState(false)

  // Estado del formulario
  const [formData, setFormData] = useState<Partial<Comprobante>>({
    origen: "Contabilidad",
    tipo_comprobante: "Diario",
    tipo_asiento: "Normal",
    fecha: new Date().toISOString().split("T")[0],
    periodo: new Date().getMonth() + 1,
    gestion: new Date().getFullYear(),
    moneda: "BOB",
    tipo_cambio: 1,
    estado: "BORRADOR",
  })

  const [detalles, setDetalles] = useState<ComprobanteDetalle[]>([])

  // Cargar cuentas transaccionales
  useEffect(() => {
    fetchCuentasTransaccionales()
  }, [])

  // Sincronizar formulario cuando cambia comprobante seleccionado
  useEffect(() => {
    if (comprobante) {
      setFormData({
        numero: comprobante.numero,
        origen: comprobante.origen,
        tipo_comprobante: comprobante.tipo_comprobante,
        tipo_asiento: comprobante.tipo_asiento,
        fecha: comprobante.fecha,
        periodo: comprobante.periodo,
        gestion: comprobante.gestion,
        moneda: comprobante.moneda,
        tipo_cambio: comprobante.tipo_cambio,
        glosa: comprobante.glosa || "",
        beneficiario: comprobante.beneficiario || "",
        nro_cheque: comprobante.nro_cheque || "",
        estado: comprobante.estado,
        empresa_id: comprobante.empresa_id,
      })
      
      // Cargar detalles
      if (comprobante.id) {
        fetchDetalles(comprobante.id)
      }
    } else {
      resetForm()
    }
  }, [comprobante])

  const fetchCuentasTransaccionales = async () => {
    try {
      setLoadingCuentas(true)
      const response = await api("/api/contabilidad/cuentas?limit=10000")
      if (response.ok) {
        const data = await response.json()
        // Filtrar solo cuentas transaccionales
        const transaccionales = (data.data || []).filter(
          (c: Cuenta) => c.transaccional === true
        )
        setCuentas(transaccionales)
      }
    } catch (error) {
      console.error("Error fetching cuentas:", error)
    } finally {
      setLoadingCuentas(false)
    }
  }

  const fetchDetalles = async (comprobanteId: number) => {
    try {
      const response = await api(`/api/contabilidad/comprobantes/${comprobanteId}`)
      if (response.ok) {
        const data = await response.json()
        setDetalles(data.data?.detalles || [])
      }
    } catch (error) {
      console.error("Error fetching detalles:", error)
    }
  }

  const resetForm = () => {
    setFormData({
      origen: "Contabilidad",
      tipo_comprobante: "Diario",
      tipo_asiento: "Normal",
      fecha: new Date().toISOString().split("T")[0],
      periodo: new Date().getMonth() + 1,
      gestion: new Date().getFullYear(),
      moneda: "BOB",
      tipo_cambio: 1,
      estado: "BORRADOR",
    })
    setDetalles([])
  }

  const handleAddDetalle = () => {
    const newDetalle: ComprobanteDetalle = {
      cuenta: "",
      auxiliar: null,
      lc: false,
      glosa: null,
      nro_ot: null,
      debe_bs: 0,
      haber_bs: 0,
      debe_usd: 0,
      haber_usd: 0,
      orden: detalles.length + 1,
    }
    setDetalles([...detalles, newDetalle])
  }

  const handleRemoveDetalle = (index: number) => {
    setDetalles(detalles.filter((_, i) => i !== index))
  }

  const handleDetalleChange = (index: number, field: keyof ComprobanteDetalle, value: any) => {
    const updated = [...detalles]
    updated[index] = { ...updated[index], [field]: value }
    setDetalles(updated)
  }

  // Calcular totales
  const totales = detalles.reduce(
    (acc, det) => ({
      debe_bs: acc.debe_bs + (det.debe_bs || 0),
      haber_bs: acc.haber_bs + (det.haber_bs || 0),
      debe_usd: acc.debe_usd + (det.debe_usd || 0),
      haber_usd: acc.haber_usd + (det.haber_usd || 0),
    }),
    { debe_bs: 0, haber_bs: 0, debe_usd: 0, haber_usd: 0 }
  )

  const diferenciaBs = totales.debe_bs - totales.haber_bs
  const diferenciaUsd = totales.debe_usd - totales.haber_usd
  const isBalanced = Math.abs(diferenciaBs) < 0.01 && Math.abs(diferenciaUsd) < 0.01

  const handleSave = async () => {
    try {
      setSaving(true)

      // Validar que haya al menos un detalle
      if (detalles.length === 0) {
        toast.error("Debe agregar al menos un detalle al comprobante")
        return
      }

      // Validar que todos los detalles tengan cuenta
      const detallesInvalidos = detalles.some((d) => !d.cuenta)
      if (detallesInvalidos) {
        toast.error("Todos los detalles deben tener una cuenta asignada")
        return
      }

      const payload = {
        ...formData,
        detalles: detalles.map((d, index) => ({
          ...d,
          orden: index + 1,
        })),
      }

      if (comprobante?.id) {
        // Actualizar
        const response = await api(`/api/contabilidad/comprobantes/${comprobante.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        if (response.ok) {
          toast.success("Comprobante actualizado correctamente")
          onSave()
        } else {
          const error = await response.json()
          toast.error(error.error || "Error al actualizar el comprobante")
        }
      } else {
        // Crear
        const response = await api("/api/contabilidad/comprobantes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        if (response.ok) {
          toast.success("Comprobante creado correctamente")
          const newComp = await response.json()
          resetForm()
          onSave()
        } else {
          const error = await response.json()
          toast.error(error.error || "Error al crear el comprobante")
        }
      }
    } catch (error) {
      console.error("Error saving comprobante:", error)
      toast.error("Error de conexión")
    } finally {
      setSaving(false)
    }
  }

  const handleAprobar = async () => {
    if (!comprobante?.id) {
      toast.error("Debe guardar el comprobante antes de aprobarlo")
      return
    }

    if (!isBalanced) {
      toast.error("El comprobante debe estar balanceado (Debe = Haber) para poder aprobarlo")
      return
    }

    if (!confirm("¿Estás seguro de que quieres aprobar este comprobante? No podrá ser editado después.")) {
      return
    }

    try {
      setSaving(true)
      const response = await api(`/api/contabilidad/comprobantes/${comprobante.id}/aprobar`, {
        method: "POST",
      })

      if (response.ok) {
        toast.success("Comprobante aprobado correctamente")
        onSave()
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al aprobar el comprobante")
      }
    } catch (error) {
      console.error("Error aprobando comprobante:", error)
      toast.error("Error de conexión")
    } finally {
      setSaving(false)
    }
  }

  const isReadOnly = comprobante?.estado === "APROBADO"

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {comprobante ? `Comprobante ${comprobante.numero}` : "Nuevo Comprobante"}
              </CardTitle>
              <CardDescription>
                {comprobante
                  ? isReadOnly
                    ? "Comprobante aprobado (solo lectura)"
                    : "Edita la información del comprobante"
                  : "Complete la información para crear un nuevo comprobante"}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onNew} disabled={isReadOnly}>
                Nuevo
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving || isReadOnly}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Guardando..." : "Guardar"}
              </Button>
              {comprobante?.id && !isReadOnly && (
                <Button
                  size="sm"
                  onClick={handleAprobar}
                  disabled={saving || !isBalanced}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Aprobar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {/* Número (solo lectura) */}
            <div className="space-y-2">
              <Label htmlFor="numero">Número</Label>
              <Input
                id="numero"
                value={formData.numero || "AUTO"}
                disabled
                className="bg-gray-50 font-mono"
              />
            </div>

            {/* Origen */}
            <div className="space-y-2">
              <Label htmlFor="origen">Origen</Label>
              <Select
                value={formData.origen || "Contabilidad"}
                onValueChange={(value) =>
                  setFormData({ ...formData, origen: value as OrigenComprobante })
                }
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORIGENES.map((origen) => (
                    <SelectItem key={origen} value={origen}>
                      {origen}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de Comprobante */}
            <div className="space-y-2">
              <Label htmlFor="tipo_comprobante">Tipo de Comprobante</Label>
              <Select
                value={formData.tipo_comprobante || "Diario"}
                onValueChange={(value) =>
                  setFormData({ ...formData, tipo_comprobante: value as TipoComprobante })
                }
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_COMPROBANTE.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de Asiento */}
            <div className="space-y-2">
              <Label htmlFor="tipo_asiento">Tipo de Asiento</Label>
              <Select
                value={formData.tipo_asiento || "Normal"}
                onValueChange={(value) =>
                  setFormData({ ...formData, tipo_asiento: value as TipoAsiento })
                }
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_ASIENTO.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fecha */}
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha</Label>
              <Input
                id="fecha"
                type="date"
                value={formData.fecha || ""}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                disabled={isReadOnly}
              />
            </div>

            {/* Periodo */}
            <div className="space-y-2">
              <Label htmlFor="periodo">Periodo</Label>
              <Select
                value={formData.periodo?.toString() || "1"}
                onValueChange={(value) =>
                  setFormData({ ...formData, periodo: parseInt(value) })
                }
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MESES.map((mes) => (
                    <SelectItem key={mes.value} value={mes.value.toString()}>
                      {mes.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Gestión */}
            <div className="space-y-2">
              <Label htmlFor="gestion">Gestión</Label>
              <Input
                id="gestion"
                type="number"
                min="2000"
                max="2100"
                value={formData.gestion || new Date().getFullYear()}
                onChange={(e) =>
                  setFormData({ ...formData, gestion: parseInt(e.target.value) || new Date().getFullYear() })
                }
                disabled={isReadOnly}
              />
            </div>

            {/* Moneda */}
            <div className="space-y-2">
              <Label htmlFor="moneda">Moneda</Label>
              <Select
                value={formData.moneda || "BOB"}
                onValueChange={(value) =>
                  setFormData({ ...formData, moneda: value as Moneda })
                }
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONEDAS.map((moneda) => (
                    <SelectItem key={moneda} value={moneda}>
                      {moneda}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de Cambio */}
            <div className="space-y-2">
              <Label htmlFor="tipo_cambio">Tipo de Cambio</Label>
              <Input
                id="tipo_cambio"
                type="number"
                step="0.0001"
                min="0"
                value={formData.tipo_cambio || 1}
                onChange={(e) =>
                  setFormData({ ...formData, tipo_cambio: parseFloat(e.target.value) || 1 })
                }
                disabled={isReadOnly}
              />
            </div>

            {/* Glosa */}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="glosa">Glosa</Label>
              <Input
                id="glosa"
                value={formData.glosa || ""}
                onChange={(e) => setFormData({ ...formData, glosa: e.target.value })}
                disabled={isReadOnly}
                placeholder="Descripción general del comprobante"
              />
            </div>

            {/* Beneficiario */}
            <div className="space-y-2">
              <Label htmlFor="beneficiario">Beneficiario</Label>
              <Input
                id="beneficiario"
                value={formData.beneficiario || ""}
                onChange={(e) => setFormData({ ...formData, beneficiario: e.target.value })}
                disabled={isReadOnly}
              />
            </div>

            {/* Nro. Cheque */}
            <div className="space-y-2">
              <Label htmlFor="nro_cheque">Nro. Cheque</Label>
              <Input
                id="nro_cheque"
                value={formData.nro_cheque || ""}
                onChange={(e) => setFormData({ ...formData, nro_cheque: e.target.value })}
                disabled={isReadOnly}
                className="font-mono"
              />
            </div>

            {/* Estado */}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="estado">Estado</Label>
              <Input
                id="estado"
                value={formData.estado || "BORRADOR"}
                disabled
                className="bg-gray-50 font-semibold"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detalle del Comprobante */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Detalle del Comprobante</CardTitle>
              <CardDescription>Líneas del asiento contable</CardDescription>
            </div>
            <Button
              size="sm"
              onClick={handleAddDetalle}
              disabled={isReadOnly}
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Línea
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Cuenta</TableHead>
                  <TableHead className="w-24">Auxiliar</TableHead>
                  <TableHead className="w-12">LC</TableHead>
                  <TableHead>Glosa</TableHead>
                  <TableHead className="w-20">Nro OT</TableHead>
                  <TableHead className="w-24 text-right">Debe Bs</TableHead>
                  <TableHead className="w-24 text-right">Haber Bs</TableHead>
                  <TableHead className="w-24 text-right">Debe USD</TableHead>
                  <TableHead className="w-24 text-right">Haber USD</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detalles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-gray-500 py-8">
                      No hay líneas agregadas. Click en "Agregar Línea" para comenzar.
                    </TableCell>
                  </TableRow>
                ) : (
                  detalles.map((detalle, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Select
                          value={detalle.cuenta || ""}
                          onValueChange={(value) =>
                            handleDetalleChange(index, "cuenta", value)
                          }
                          disabled={isReadOnly}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Cuenta" />
                          </SelectTrigger>
                          <SelectContent>
                            {cuentas.map((cuenta) => (
                              <SelectItem key={cuenta.id} value={cuenta.cuenta}>
                                {cuenta.cuenta} - {cuenta.descripcion}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={detalle.auxiliar || ""}
                          onChange={(e) =>
                            handleDetalleChange(index, "auxiliar", e.target.value || null)
                          }
                          disabled={isReadOnly}
                          className="w-24"
                          placeholder="Auxiliar"
                        />
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={detalle.lc || false}
                          onCheckedChange={(checked) =>
                            handleDetalleChange(index, "lc", !!checked)
                          }
                          disabled={isReadOnly}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={detalle.glosa || ""}
                          onChange={(e) =>
                            handleDetalleChange(index, "glosa", e.target.value || null)
                          }
                          disabled={isReadOnly}
                          placeholder="Glosa línea"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={detalle.nro_ot || ""}
                          onChange={(e) =>
                            handleDetalleChange(index, "nro_ot", e.target.value || null)
                          }
                          disabled={isReadOnly}
                          className="w-20 font-mono"
                          placeholder="OT"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={detalle.debe_bs || 0}
                          onChange={(e) =>
                            handleDetalleChange(
                              index,
                              "debe_bs",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          disabled={isReadOnly}
                          className="w-24 text-right font-mono"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={detalle.haber_bs || 0}
                          onChange={(e) =>
                            handleDetalleChange(
                              index,
                              "haber_bs",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          disabled={isReadOnly}
                          className="w-24 text-right font-mono"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={detalle.debe_usd || 0}
                          onChange={(e) =>
                            handleDetalleChange(
                              index,
                              "debe_usd",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          disabled={isReadOnly}
                          className="w-24 text-right font-mono"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={detalle.haber_usd || 0}
                          onChange={(e) =>
                            handleDetalleChange(
                              index,
                              "haber_usd",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          disabled={isReadOnly}
                          className="w-24 text-right font-mono"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveDetalle(index)}
                          disabled={isReadOnly}
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

          {/* Totales */}
          <Separator className="my-4" />
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div className="space-y-2">
              <div className="font-semibold">Total Debe Bs</div>
              <div className="text-lg font-mono text-right">
                {totales.debe_bs.toLocaleString("es-BO", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
            <div className="space-y-2">
              <div className="font-semibold">Total Haber Bs</div>
              <div className="text-lg font-mono text-right">
                {totales.haber_bs.toLocaleString("es-BO", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
            <div className="space-y-2">
              <div className="font-semibold">Diferencia Bs</div>
              <div
                className={`text-lg font-mono text-right ${
                  Math.abs(diferenciaBs) < 0.01
                    ? "text-green-600"
                    : "text-red-600 font-bold"
                }`}
              >
                {diferenciaBs.toLocaleString("es-BO", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
            <div className="space-y-2">
              <div className="font-semibold">Diferencia USD</div>
              <div
                className={`text-lg font-mono text-right ${
                  Math.abs(diferenciaUsd) < 0.01
                    ? "text-green-600"
                    : "text-red-600 font-bold"
                }`}
              >
                {diferenciaUsd.toLocaleString("es-BO", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
          </div>

          {!isBalanced && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
              ⚠️ El comprobante no está balanceado. Debe = Haber para poder aprobarlo.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


