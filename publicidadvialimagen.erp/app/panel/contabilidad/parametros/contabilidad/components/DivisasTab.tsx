"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Save, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/fetcher"
import type { Divisa } from "@/lib/types/contabilidad"

export default function DivisasTab() {
  const [divisas, setDivisas] = useState<Divisa[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedDivisa, setSelectedDivisa] = useState<Divisa | null>(null)

  const [formData, setFormData] = useState<Partial<Divisa>>({
    codigo: "",
    nombre: "",
    simbolo: "",
    tipo_cambio: 1,
    es_base: false,
    estado: "ACTIVO",
  })

  useEffect(() => {
    fetchDivisas()
  }, [])

  useEffect(() => {
    if (selectedDivisa) {
      setFormData({
        codigo: selectedDivisa.codigo,
        nombre: selectedDivisa.nombre,
        simbolo: selectedDivisa.simbolo,
        tipo_cambio: selectedDivisa.tipo_cambio,
        es_base: selectedDivisa.es_base,
        estado: selectedDivisa.estado || "ACTIVO",
      })
    } else {
      resetForm()
    }
  }, [selectedDivisa])

  const fetchDivisas = async () => {
    try {
      setLoading(true)
      const response = await api("/api/contabilidad/divisas?limit=1000")
      if (response.ok) {
        const data = await response.json()
        setDivisas(data.data || [])
      } else {
        setDivisas([])
      }
    } catch (error) {
      console.error("Error fetching divisas:", error)
      setDivisas([])
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      codigo: "",
      nombre: "",
      simbolo: "",
      tipo_cambio: 1,
      es_base: false,
      estado: "ACTIVO",
    })
  }

  const handleNew = () => {
    setSelectedDivisa(null)
    resetForm()
  }

  const handleSave = async () => {
    if (!formData.codigo?.trim() || !formData.nombre?.trim() || formData.simbolo === undefined || formData.simbolo === "") {
      toast.error("Código, nombre y símbolo son requeridos")
      return
    }

    const tc = Number(formData.tipo_cambio)
    if (Number.isNaN(tc) || tc < 0) {
      toast.error("Tipo de cambio debe ser un número mayor o igual a 0")
      return
    }

    try {
      setSaving(true)

      if (selectedDivisa?.id) {
        const response = await api(`/api/contabilidad/divisas/${selectedDivisa.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: formData.nombre,
            simbolo: formData.simbolo,
            tipo_cambio: tc,
            es_base: formData.es_base,
            estado: formData.estado,
          }),
        })

        if (response.ok) {
          toast.success("Divisa actualizada correctamente")
          fetchDivisas()
        } else {
          const error = await response.json()
          toast.error(error.error || "Error al actualizar la divisa")
        }
      } else {
        const response = await api("/api/contabilidad/divisas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            codigo: formData.codigo.trim().toUpperCase(),
            nombre: formData.nombre.trim(),
            simbolo: formData.simbolo.trim(),
            tipo_cambio: tc,
            es_base: formData.es_base ?? false,
            estado: formData.estado || "ACTIVO",
          }),
        })

        if (response.ok) {
          toast.success("Divisa creada correctamente")
          resetForm()
          fetchDivisas()
        } else {
          const error = await response.json()
          toast.error(error.error || "Error al crear la divisa")
        }
      }
    } catch (error) {
      console.error("Error saving divisa:", error)
      toast.error("Error de conexión")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedDivisa?.id) {
      toast.error("Debe seleccionar una divisa para eliminar")
      return
    }

    if (!confirm(`¿Estás seguro de que quieres eliminar la divisa "${selectedDivisa.nombre}" (${selectedDivisa.codigo})?`)) {
      return
    }

    try {
      setSaving(true)
      const response = await api(`/api/contabilidad/divisas/${selectedDivisa.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Divisa eliminada correctamente")
        setSelectedDivisa(null)
        resetForm()
        fetchDivisas()
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al eliminar la divisa")
      }
    } catch (error) {
      console.error("Error deleting divisa:", error)
      toast.error("Error de conexión")
    } finally {
      setSaving(false)
    }
  }

  const isEditing = !!selectedDivisa?.id

  const formatTipoCambio = (n: number) =>
    Number(n).toLocaleString("es-BO", { minimumFractionDigits: 4, maximumFractionDigits: 4 })

  return (
    <div className="space-y-6">
      {/* Tabla de divisas */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Divisas</CardTitle>
          <CardDescription>Selecciona una divisa para ver o editar</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Cargando...</div>
          ) : (
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Símbolo</TableHead>
                    <TableHead className="text-right">Tipo de Cambio</TableHead>
                    <TableHead className="text-center">Es Base</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {divisas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                        No hay divisas registradas
                      </TableCell>
                    </TableRow>
                  ) : (
                    divisas.map((divisa) => (
                      <TableRow
                        key={divisa.id}
                        onClick={() => setSelectedDivisa(divisa)}
                        className={`cursor-pointer ${
                          selectedDivisa?.id === divisa.id ? "bg-blue-50" : ""
                        }`}
                      >
                        <TableCell className="font-mono font-semibold">{divisa.codigo}</TableCell>
                        <TableCell className="font-semibold">{divisa.nombre}</TableCell>
                        <TableCell className="font-mono">{divisa.simbolo}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatTipoCambio(divisa.tipo_cambio)}
                        </TableCell>
                        <TableCell className="text-center">
                          {divisa.es_base ? "Sí" : "No"}
                        </TableCell>
                        <TableCell>{divisa.estado || "—"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formulario */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {isEditing ? `Editar Divisa ${selectedDivisa?.codigo}` : "Nueva Divisa"}
              </CardTitle>
              <CardDescription>
                {isEditing
                  ? "Edita la información de la divisa (código no editable)"
                  : "Complete la información para crear una nueva divisa"}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleNew}>
                <Plus className="w-4 h-4 mr-2" />
                Nueva
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Guardando..." : "Guardar"}
              </Button>
              {isEditing && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={saving}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="divisa-codigo">Código *</Label>
              <Input
                id="divisa-codigo"
                value={formData.codigo || ""}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                disabled={isEditing}
                className="font-mono"
                placeholder="BOB, USD"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="divisa-nombre">Nombre *</Label>
              <Input
                id="divisa-nombre"
                value={formData.nombre || ""}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Bolivianos, Dólares"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="divisa-simbolo">Símbolo *</Label>
              <Input
                id="divisa-simbolo"
                value={formData.simbolo || ""}
                onChange={(e) => setFormData({ ...formData, simbolo: e.target.value })}
                className="font-mono"
                placeholder="Bs, $"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="divisa-tipo-cambio">Tipo de Cambio</Label>
              <Input
                id="divisa-tipo-cambio"
                type="number"
                min={0}
                step={0.0001}
                value={formData.tipo_cambio ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tipo_cambio: e.target.value === "" ? undefined : Number(e.target.value),
                  })
                }
                placeholder="1.0000"
                className="font-mono"
              />
            </div>

            <div className="space-y-2 flex items-end gap-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="divisa-es-base"
                  checked={formData.es_base ?? false}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, es_base: Boolean(checked) })
                  }
                />
                <Label htmlFor="divisa-es-base" className="font-normal cursor-pointer">
                  Es base (moneda de referencia, tipo_cambio = 1)
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="divisa-estado">Estado</Label>
              <Select
                value={formData.estado || "ACTIVO"}
                onValueChange={(value) => setFormData({ ...formData, estado: value })}
              >
                <SelectTrigger id="divisa-estado">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVO">ACTIVO</SelectItem>
                  <SelectItem value="INACTIVO">INACTIVO</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
