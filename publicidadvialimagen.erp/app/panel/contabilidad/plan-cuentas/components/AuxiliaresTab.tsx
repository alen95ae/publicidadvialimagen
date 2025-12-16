"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Save, Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { Auxiliar, AuxiliarSaldos, TipoAuxiliar, Moneda } from "@/lib/types/contabilidad"
import { api } from "@/lib/fetcher"

const TIPOS_AUXILIAR: TipoAuxiliar[] = ["Cliente", "Proveedor", "Banco", "Caja", "Empleado", "Otro"]
const MONEDAS: Moneda[] = ["BOB", "USD"]

export default function AuxiliaresTab() {
  const [auxiliares, setAuxiliares] = useState<Auxiliar[]>([])
  const [selectedAuxiliar, setSelectedAuxiliar] = useState<Auxiliar | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saldos, setSaldos] = useState<AuxiliarSaldos[]>([])
  
  // Estado del formulario
  const [formData, setFormData] = useState<Partial<Auxiliar>>({
    tipo_auxiliar: "",
    codigo: "",
    nombre: "",
    cuenta_asociada: "",
    moneda: "BOB",
    cuenta_bancaria_o_caja: false,
    departamento: "",
    direccion: "",
    telefono: "",
    email: "",
    nit: "",
    autorizacion: "",
    vigencia: true,
  })

  useEffect(() => {
    fetchAuxiliares()
  }, [])

  useEffect(() => {
    if (selectedAuxiliar) {
      setFormData({
        tipo_auxiliar: selectedAuxiliar.tipo_auxiliar || "",
        codigo: selectedAuxiliar.codigo || "",
        nombre: selectedAuxiliar.nombre || "",
        cuenta_asociada: selectedAuxiliar.cuenta_asociada || "",
        moneda: selectedAuxiliar.moneda || "BOB",
        cuenta_bancaria_o_caja: selectedAuxiliar.cuenta_bancaria_o_caja || false,
        departamento: selectedAuxiliar.departamento || "",
        direccion: selectedAuxiliar.direccion || "",
        telefono: selectedAuxiliar.telefono || "",
        email: selectedAuxiliar.email || "",
        nit: selectedAuxiliar.nit || "",
        autorizacion: selectedAuxiliar.autorizacion || "",
        vigencia: selectedAuxiliar.vigencia !== undefined ? selectedAuxiliar.vigencia : true,
      })
      fetchSaldos(selectedAuxiliar.id)
    } else {
      resetForm()
    }
  }, [selectedAuxiliar])

  const fetchAuxiliares = async () => {
    try {
      setLoading(true)
      const response = await api("/api/contabilidad/auxiliares")
      if (response.ok) {
        const data = await response.json()
        setAuxiliares(data.data || [])
      } else {
        toast.error("Error al cargar los auxiliares")
      }
    } catch (error) {
      console.error("Error fetching auxiliares:", error)
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  const fetchSaldos = async (auxiliarId: string) => {
    try {
      const response = await api(`/api/contabilidad/auxiliares/${auxiliarId}/saldos`)
      if (response.ok) {
        const data = await response.json()
        setSaldos(data.data || [])
      }
    } catch (error) {
      console.error("Error fetching saldos:", error)
    }
  }

  const resetForm = () => {
    setFormData({
      tipo_auxiliar: "",
      codigo: "",
      nombre: "",
      cuenta_asociada: "",
      moneda: "BOB",
      cuenta_bancaria_o_caja: false,
      departamento: "",
      direccion: "",
      telefono: "",
      email: "",
      nit: "",
      autorizacion: "",
      vigencia: true,
    })
    setSaldos([])
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      if (selectedAuxiliar) {
        // Actualizar
        const response = await api(`/api/contabilidad/auxiliares/${selectedAuxiliar.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })
        
        if (response.ok) {
          toast.success("Auxiliar actualizado correctamente")
          await fetchAuxiliares()
          const updated = await response.json()
          setSelectedAuxiliar(updated.data)
        } else {
          const error = await response.json()
          toast.error(error.error || "Error al actualizar el auxiliar")
        }
      } else {
        // Crear
        const response = await api("/api/contabilidad/auxiliares", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })
        
        if (response.ok) {
          toast.success("Auxiliar creado correctamente")
          await fetchAuxiliares()
          const newAuxiliar = await response.json()
          setSelectedAuxiliar(newAuxiliar.data)
        } else {
          const error = await response.json()
          toast.error(error.error || "Error al crear el auxiliar")
        }
      }
    } catch (error) {
      console.error("Error saving auxiliar:", error)
      toast.error("Error de conexión")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedAuxiliar) return
    if (!confirm("¿Estás seguro de que quieres eliminar este auxiliar?")) return

    try {
      const response = await api(`/api/contabilidad/auxiliares/${selectedAuxiliar.id}`, {
        method: "DELETE",
      })
      
      if (response.ok) {
        toast.success("Auxiliar eliminado correctamente")
        setSelectedAuxiliar(null)
        await fetchAuxiliares()
        resetForm()
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al eliminar el auxiliar")
      }
    } catch (error) {
      console.error("Error deleting auxiliar:", error)
      toast.error("Error de conexión")
    }
  }

  const handleNew = () => {
    setSelectedAuxiliar(null)
    resetForm()
  }

  return (
    <div className="flex gap-4 h-full">
      {/* Contenedor principal */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Tabla */}
        <Card>
          <CardHeader>
            <CardTitle>Auxiliares</CardTitle>
            <CardDescription>Lista de auxiliares contables</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Cargando...</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo Auxiliar</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Moneda</TableHead>
                      <TableHead>Vigencia</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auxiliares.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                          No hay auxiliares registrados
                        </TableCell>
                      </TableRow>
                    ) : (
                      auxiliares.map((auxiliar) => (
                        <TableRow
                          key={auxiliar.id}
                          onClick={() => setSelectedAuxiliar(auxiliar)}
                          className={`cursor-pointer ${
                            selectedAuxiliar?.id === auxiliar.id ? "bg-blue-50" : ""
                          }`}
                        >
                          <TableCell>
                            <Badge variant="outline">{auxiliar.tipo_auxiliar}</Badge>
                          </TableCell>
                          <TableCell className="font-mono">{auxiliar.codigo}</TableCell>
                          <TableCell>{auxiliar.nombre}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{auxiliar.moneda}</Badge>
                          </TableCell>
                          <TableCell>
                            {auxiliar.vigencia ? (
                              <Badge className="bg-green-100 text-green-800">Activo</Badge>
                            ) : (
                              <Badge variant="secondary">Inactivo</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Formulario inferior */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {selectedAuxiliar ? "Editar Auxiliar" : "Nuevo Auxiliar"}
                </CardTitle>
                <CardDescription>
                  {selectedAuxiliar
                    ? "Modifica la información del auxiliar seleccionado"
                    : "Complete la información para crear un nuevo auxiliar"}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleNew}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo
                </Button>
                {selectedAuxiliar && (
                  <Button variant="outline" size="sm" onClick={handleDelete}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </Button>
                )}
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tipo Auxiliar */}
              <div className="space-y-2">
                <Label htmlFor="tipo_auxiliar">Tipo Auxiliar *</Label>
                <Select
                  value={formData.tipo_auxiliar || ""}
                  onValueChange={(value) =>
                    setFormData({ ...formData, tipo_auxiliar: value as TipoAuxiliar })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_AUXILIAR.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Código Auxiliar */}
              <div className="space-y-2">
                <Label htmlFor="codigo">Código Auxiliar *</Label>
                <Input
                  id="codigo"
                  value={formData.codigo || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, codigo: e.target.value })
                  }
                  className="font-mono"
                />
              </div>

              {/* Nombre */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                />
              </div>

              {/* Cuenta asociada */}
              <div className="space-y-2">
                <Label htmlFor="cuenta_asociada">Cuenta asociada</Label>
                <Input
                  id="cuenta_asociada"
                  value={formData.cuenta_asociada || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, cuenta_asociada: e.target.value })
                  }
                  className="font-mono"
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

              {/* Cuenta Bancaria o Caja */}
              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="cuenta_bancaria_o_caja"
                    checked={formData.cuenta_bancaria_o_caja || false}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, cuenta_bancaria_o_caja: !!checked })
                    }
                  />
                  <Label htmlFor="cuenta_bancaria_o_caja" className="cursor-pointer">
                    Cuenta Bancaria o Caja
                  </Label>
                </div>
              </div>

              {/* Departamento */}
              <div className="space-y-2">
                <Label htmlFor="departamento">Departamento</Label>
                <Input
                  id="departamento"
                  value={formData.departamento || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, departamento: e.target.value })
                  }
                />
              </div>

              {/* Dirección */}
              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  value={formData.direccion || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, direccion: e.target.value })
                  }
                />
              </div>

              {/* Teléfono */}
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  type="tel"
                  value={formData.telefono || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, telefono: e.target.value })
                  }
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              {/* NIT */}
              <div className="space-y-2">
                <Label htmlFor="nit">NIT</Label>
                <Input
                  id="nit"
                  value={formData.nit || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, nit: e.target.value })
                  }
                  className="font-mono"
                />
              </div>

              {/* Autorización */}
              <div className="space-y-2">
                <Label htmlFor="autorizacion">Autorización</Label>
                <Input
                  id="autorizacion"
                  value={formData.autorizacion || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, autorizacion: e.target.value })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Panel lateral de saldos */}
      {selectedAuxiliar && (
        <Card className="w-80 flex-shrink-0">
          <CardHeader>
            <CardTitle>Saldos por Gestión</CardTitle>
            <CardDescription>Saldo del auxiliar por gestión</CardDescription>
          </CardHeader>
          <CardContent>
            {saldos.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No hay saldos registrados
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Gestión</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {saldos.map((saldo, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{saldo.gestion}</TableCell>
                          <TableCell className="text-right font-mono font-semibold">
                            {saldo.saldo.toLocaleString("es-BO", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

