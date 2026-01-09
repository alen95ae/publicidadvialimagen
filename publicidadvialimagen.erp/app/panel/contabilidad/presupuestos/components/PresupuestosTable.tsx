"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Plus, Save, CheckCircle, X } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/fetcher"
import type { Presupuesto, PresupuestosFilters, Cuenta } from "@/lib/types/contabilidad"

const MESES = [
  { key: "enero", label: "Ene", fullLabel: "Enero" },
  { key: "febrero", label: "Feb", fullLabel: "Febrero" },
  { key: "marzo", label: "Mar", fullLabel: "Marzo" },
  { key: "abril", label: "Abr", fullLabel: "Abril" },
  { key: "mayo", label: "May", fullLabel: "Mayo" },
  { key: "junio", label: "Jun", fullLabel: "Junio" },
  { key: "julio", label: "Jul", fullLabel: "Julio" },
  { key: "agosto", label: "Ago", fullLabel: "Agosto" },
  { key: "septiembre", label: "Sep", fullLabel: "Septiembre" },
  { key: "octubre", label: "Oct", fullLabel: "Octubre" },
  { key: "noviembre", label: "Nov", fullLabel: "Noviembre" },
  { key: "diciembre", label: "Dic", fullLabel: "Diciembre" },
]

export default function PresupuestosTable() {
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([])
  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedPresupuesto, setSelectedPresupuesto] = useState<Presupuesto | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [cuentaSearch, setCuentaSearch] = useState("")
  const [cuentasFiltradas, setCuentasFiltradas] = useState<Cuenta[]>([])

  // Filtros
  const [filters, setFilters] = useState<PresupuestosFilters>({
    gestion: new Date().getFullYear(),
    cuenta: undefined,
    aprobado: undefined,
  })

  // Formulario
  const [formData, setFormData] = useState<Partial<Presupuesto>>({
    gestion: new Date().getFullYear(),
    cuenta: "",
    tipo_cambio: 1,
    aprobado: false,
    enero: 0,
    febrero: 0,
    marzo: 0,
    abril: 0,
    mayo: 0,
    junio: 0,
    julio: 0,
    agosto: 0,
    septiembre: 0,
    octubre: 0,
    noviembre: 0,
    diciembre: 0,
  })

  useEffect(() => {
    fetchPresupuestos()
    fetchCuentas()
  }, [filters])

  useEffect(() => {
    // Filtrar cuentas para autocomplete
    if (cuentaSearch.trim() === "") {
      setCuentasFiltradas([])
    } else {
      const search = cuentaSearch.toLowerCase()
      const filtradas = cuentas.filter(
        (c) =>
          c.cuenta.toLowerCase().includes(search) ||
          c.descripcion.toLowerCase().includes(search)
      )
      setCuentasFiltradas(filtradas.slice(0, 10)) // Limitar a 10 resultados
    }
  }, [cuentaSearch, cuentas])

  const fetchPresupuestos = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.gestion) params.append("gestion", filters.gestion.toString())
      if (filters.cuenta) params.append("cuenta", filters.cuenta)
      if (filters.aprobado !== undefined) params.append("aprobado", filters.aprobado.toString())

      const response = await api(`/api/contabilidad/presupuestos?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setPresupuestos(data.data || [])
      } else {
        setPresupuestos([])
      }
    } catch (error) {
      console.error("Error fetching presupuestos:", error)
      setPresupuestos([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCuentas = async () => {
    try {
      const response = await api("/api/contabilidad/cuentas?limit=10000")
      if (response.ok) {
        const data = await response.json()
        setCuentas(data.data || [])
      }
    } catch (error) {
      console.error("Error fetching cuentas:", error)
    }
  }

  const handleNew = () => {
    setIsNew(true)
    setSelectedPresupuesto(null)
    setFormData({
      gestion: filters.gestion || new Date().getFullYear(),
      cuenta: "",
      tipo_cambio: 1,
      aprobado: false,
      enero: 0,
      febrero: 0,
      marzo: 0,
      abril: 0,
      mayo: 0,
      junio: 0,
      julio: 0,
      agosto: 0,
      septiembre: 0,
      octubre: 0,
      noviembre: 0,
      diciembre: 0,
    })
    setCuentaSearch("")
  }

  const handleSelectPresupuesto = (presupuesto: Presupuesto) => {
    setSelectedPresupuesto(presupuesto)
    setIsNew(false)
    setFormData({
      gestion: presupuesto.gestion,
      cuenta: presupuesto.cuenta,
      tipo_cambio: presupuesto.tipo_cambio,
      aprobado: presupuesto.aprobado,
      enero: presupuesto.enero,
      febrero: presupuesto.febrero,
      marzo: presupuesto.marzo,
      abril: presupuesto.abril,
      mayo: presupuesto.mayo,
      junio: presupuesto.junio,
      julio: presupuesto.julio,
      agosto: presupuesto.agosto,
      septiembre: presupuesto.septiembre,
      octubre: presupuesto.octubre,
      noviembre: presupuesto.noviembre,
      diciembre: presupuesto.diciembre,
    })
    // Buscar la cuenta para mostrar su descripción
    const cuenta = cuentas.find((c) => c.cuenta === presupuesto.cuenta)
    setCuentaSearch(cuenta ? `${cuenta.cuenta} - ${cuenta.descripcion}` : presupuesto.cuenta)
  }

  const handleSelectCuenta = (cuenta: Cuenta) => {
    setFormData({ ...formData, cuenta: cuenta.cuenta })
    setCuentaSearch(`${cuenta.cuenta} - ${cuenta.descripcion}`)
    setCuentasFiltradas([])
  }

  const handleSave = async () => {
    if (!formData.cuenta || !formData.gestion) {
      toast.error("Debe seleccionar una cuenta y gestión")
      return
    }

    try {
      setSaving(true)

      if (isNew) {
        // Crear nuevo
        const response = await api("/api/contabilidad/presupuestos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })

        if (response.ok) {
          toast.success("Presupuesto creado correctamente")
          setIsNew(false)
          fetchPresupuestos()
        } else {
          const error = await response.json()
          toast.error(error.error || "Error al crear el presupuesto")
        }
      } else if (selectedPresupuesto) {
        // Actualizar
        const response = await api(`/api/contabilidad/presupuestos/${selectedPresupuesto.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })

        if (response.ok) {
          toast.success("Presupuesto actualizado correctamente")
          fetchPresupuestos()
        } else {
          const error = await response.json()
          toast.error(error.error || "Error al actualizar el presupuesto")
        }
      }
    } catch (error) {
      console.error("Error saving presupuesto:", error)
      toast.error("Error de conexión")
    } finally {
      setSaving(false)
    }
  }

  const handleAprobar = async () => {
    if (!selectedPresupuesto) {
      toast.error("Debe seleccionar un presupuesto")
      return
    }

    if (!confirm("¿Estás seguro de que quieres aprobar este presupuesto?")) {
      return
    }

    try {
      setSaving(true)
      const response = await api(`/api/contabilidad/presupuestos/${selectedPresupuesto.id}/aprobar`, {
        method: "POST",
      })

      if (response.ok) {
        toast.success("Presupuesto aprobado correctamente")
        fetchPresupuestos()
        // Recargar el presupuesto seleccionado
        const updated = await api(`/api/contabilidad/presupuestos/${selectedPresupuesto.id}`)
        if (updated.ok) {
          const data = await updated.json()
          handleSelectPresupuesto(data.data)
        }
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al aprobar el presupuesto")
      }
    } catch (error) {
      console.error("Error aprobando presupuesto:", error)
      toast.error("Error de conexión")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setIsNew(false)
    setSelectedPresupuesto(null)
    setFormData({
      gestion: filters.gestion || new Date().getFullYear(),
      cuenta: "",
      tipo_cambio: 1,
      aprobado: false,
      enero: 0,
      febrero: 0,
      marzo: 0,
      abril: 0,
      mayo: 0,
      junio: 0,
      julio: 0,
      agosto: 0,
      septiembre: 0,
      octubre: 0,
      noviembre: 0,
      diciembre: 0,
    })
    setCuentaSearch("")
  }

  const isReadOnly = selectedPresupuesto?.aprobado && !isNew

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filtro_gestion">Gestión</Label>
              <Input
                id="filtro_gestion"
                type="number"
                min="2000"
                max="2100"
                value={filters.gestion || ""}
                onChange={(e) =>
                  setFilters({ ...filters, gestion: parseInt(e.target.value) || undefined })
                }
                placeholder="Año"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filtro_cuenta">Cuenta</Label>
              <Input
                id="filtro_cuenta"
                value={filters.cuenta || ""}
                onChange={(e) => setFilters({ ...filters, cuenta: e.target.value || undefined })}
                placeholder="Código de cuenta"
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filtro_aprobado">Estado</Label>
              <Select
                value={
                  filters.aprobado === undefined
                    ? "all"
                    : filters.aprobado
                    ? "aprobado"
                    : "borrador"
                }
                onValueChange={(value) => {
                  if (value === "all") {
                    setFilters({ ...filters, aprobado: undefined })
                  } else {
                    setFilters({ ...filters, aprobado: value === "aprobado" })
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="borrador">Borrador</SelectItem>
                  <SelectItem value="aprobado">Aprobado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla y Formulario */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tabla (2/3) */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Lista de Presupuestos</CardTitle>
                  <CardDescription>
                    {presupuestos.length} presupuesto(s) encontrado(s)
                  </CardDescription>
                </div>
                <Button onClick={handleNew} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">Cargando...</div>
              ) : (
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Gestión</TableHead>
                        <TableHead>Cuenta</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {presupuestos.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                            No hay presupuestos registrados
                          </TableCell>
                        </TableRow>
                      ) : (
                        presupuestos.map((presupuesto) => {
                          const cuenta = cuentas.find((c) => c.cuenta === presupuesto.cuenta)
                          return (
                            <TableRow
                              key={presupuesto.id}
                              onClick={() => handleSelectPresupuesto(presupuesto)}
                              className={`cursor-pointer ${
                                selectedPresupuesto?.id === presupuesto.id ? "bg-blue-50" : ""
                              }`}
                            >
                              <TableCell className="font-semibold">{presupuesto.gestion}</TableCell>
                              <TableCell>
                                <div className="font-mono">{presupuesto.cuenta}</div>
                                {cuenta && (
                                  <div className="text-xs text-gray-500">{cuenta.descripcion}</div>
                                )}
                              </TableCell>
                              <TableCell className="font-mono text-right">
                                {presupuesto.total?.toLocaleString("es-BO", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }) || "0.00"}
                              </TableCell>
                              <TableCell>
                                {presupuesto.aprobado ? (
                                  <Badge className="bg-green-100 text-green-800">Aprobado</Badge>
                                ) : (
                                  <Badge variant="secondary">Borrador</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Formulario (1/3) */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {isNew ? "Nuevo Presupuesto" : `Presupuesto ${selectedPresupuesto?.gestion}`}
                  </CardTitle>
                  <CardDescription>
                    {isNew
                      ? "Complete la información para crear un nuevo presupuesto"
                      : isReadOnly
                      ? "Presupuesto aprobado (solo lectura)"
                      : "Edita la información del presupuesto"}
                  </CardDescription>
                </div>
                {!isNew && selectedPresupuesto && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                    disabled={isReadOnly}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Gestión */}
                <div className="space-y-2">
                  <Label htmlFor="gestion">Gestión</Label>
                  <Input
                    id="gestion"
                    type="number"
                    min="2000"
                    max="2100"
                    value={formData.gestion || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, gestion: parseInt(e.target.value) || undefined })
                    }
                    disabled={isReadOnly || !isNew}
                  />
                </div>

                {/* Cuenta con autocomplete */}
                <div className="space-y-2">
                  <Label htmlFor="cuenta">Cuenta</Label>
                  <div className="relative">
                    <Input
                      id="cuenta"
                      value={cuentaSearch}
                      onChange={(e) => {
                        setCuentaSearch(e.target.value)
                        if (!e.target.value) {
                          setFormData({ ...formData, cuenta: "" })
                        }
                      }}
                      disabled={isReadOnly || !isNew}
                      placeholder="Buscar cuenta..."
                      className="font-mono"
                    />
                    {cuentasFiltradas.length > 0 && !isReadOnly && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {cuentasFiltradas.map((cuenta) => (
                          <div
                            key={cuenta.id}
                            onClick={() => handleSelectCuenta(cuenta)}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-mono font-semibold">{cuenta.cuenta}</div>
                            <div className="text-sm text-gray-600">{cuenta.descripcion}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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

                {/* Estado */}
                <div className="space-y-2">
                  <Label htmlFor="aprobado">Estado</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="aprobado"
                      checked={formData.aprobado || false}
                      disabled
                      className="bg-gray-50"
                    />
                    <Label htmlFor="aprobado" className="cursor-not-allowed">
                      {formData.aprobado ? "Aprobado" : "Borrador"}
                    </Label>
                  </div>
                </div>

                {/* Meses */}
                <div className="space-y-3">
                  <Label>Meses</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {MESES.map((mes) => (
                      <div key={mes.key} className="space-y-1">
                        <Label htmlFor={mes.key} className="text-xs text-gray-600">
                          {mes.fullLabel}
                        </Label>
                        <Input
                          id={mes.key}
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData[mes.key as keyof Presupuesto] || 0}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              [mes.key]: parseFloat(e.target.value) || 0,
                            })
                          }
                          disabled={isReadOnly}
                          className="text-right font-mono"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total (solo lectura) */}
                <div className="space-y-2 pt-2 border-t">
                  <Label htmlFor="total">Total</Label>
                  <Input
                    id="total"
                    value={
                      selectedPresupuesto?.total?.toLocaleString("es-BO", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }) || "0.00"
                    }
                    disabled
                    className="bg-gray-50 font-mono font-semibold text-right"
                  />
                </div>

                {/* Botones */}
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={saving || isReadOnly}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "Guardando..." : "Guardar"}
                  </Button>
                  {!isNew && selectedPresupuesto && !isReadOnly && (
                    <Button
                      onClick={handleAprobar}
                      disabled={saving}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Aprobar
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}








