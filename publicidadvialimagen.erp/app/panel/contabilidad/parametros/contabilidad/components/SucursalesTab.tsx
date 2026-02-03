"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Save, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/fetcher"
import type { Sucursal } from "@/lib/types/contabilidad"
import type { Empresa } from "@/lib/types/contabilidad"

type SucursalConEmpresa = Sucursal & {
  empresas?: { codigo: string; nombre: string } | null
}

export default function SucursalesTab() {
  const [sucursales, setSucursales] = useState<SucursalConEmpresa[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedSucursal, setSelectedSucursal] = useState<SucursalConEmpresa | null>(null)

  const [formData, setFormData] = useState<Partial<Sucursal>>({
    empresa_id: "",
    codigo: "",
    nombre: "",
    representante: "",
    direccion: "",
    sucursal: "",
    telefonos: "",
    email: "",
    pais: "",
    ciudad: "",
    localidad: "",
    nit: "",
  })

  useEffect(() => {
    fetchEmpresas()
    fetchSucursales()
  }, [])

  useEffect(() => {
    if (selectedSucursal) {
      setFormData({
        empresa_id: selectedSucursal.empresa_id,
        codigo: selectedSucursal.codigo,
        nombre: selectedSucursal.nombre,
        representante: selectedSucursal.representante || "",
        direccion: selectedSucursal.direccion || "",
        sucursal: selectedSucursal.sucursal || "",
        telefonos: selectedSucursal.telefonos || "",
        email: selectedSucursal.email || "",
        pais: selectedSucursal.pais || "",
        ciudad: selectedSucursal.ciudad || "",
        localidad: selectedSucursal.localidad || "",
        nit: selectedSucursal.nit || "",
      })
    } else {
      resetForm()
    }
  }, [selectedSucursal])

  const fetchEmpresas = async () => {
    try {
      const response = await api("/api/contabilidad/empresas?limit=1000")
      if (response.ok) {
        const data = await response.json()
        setEmpresas(data.data || [])
      } else {
        setEmpresas([])
      }
    } catch (error) {
      console.error("Error fetching empresas:", error)
      setEmpresas([])
    }
  }

  const fetchSucursales = async () => {
    try {
      setLoading(true)
      const response = await api("/api/contabilidad/sucursales?limit=1000")
      if (response.ok) {
        const data = await response.json()
        setSucursales(data.data || [])
      } else {
        setSucursales([])
      }
    } catch (error) {
      console.error("Error fetching sucursales:", error)
      setSucursales([])
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      empresa_id: "",
      codigo: "",
      nombre: "",
      representante: "",
      direccion: "",
      sucursal: "",
      telefonos: "",
      email: "",
      pais: "",
      ciudad: "",
      localidad: "",
      nit: "",
    })
  }

  const handleNew = () => {
    setSelectedSucursal(null)
    resetForm()
  }

  const handleSave = async () => {
    if (!formData.empresa_id || !formData.codigo || !formData.nombre) {
      toast.error("Empresa, código y nombre son requeridos")
      return
    }

    try {
      setSaving(true)

      if (selectedSucursal?.id) {
        const response = await api(`/api/contabilidad/sucursales/${selectedSucursal.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })

        if (response.ok) {
          toast.success("Sucursal actualizada correctamente")
          fetchSucursales()
        } else {
          const error = await response.json()
          toast.error(error.error || "Error al actualizar la sucursal")
        }
      } else {
        const response = await api("/api/contabilidad/sucursales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })

        if (response.ok) {
          toast.success("Sucursal creada correctamente")
          resetForm()
          fetchSucursales()
        } else {
          const error = await response.json()
          toast.error(error.error || "Error al crear la sucursal")
        }
      }
    } catch (error) {
      console.error("Error saving sucursal:", error)
      toast.error("Error de conexión")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedSucursal?.id) {
      toast.error("Debe seleccionar una sucursal para eliminar")
      return
    }

    if (!confirm(`¿Estás seguro de que quieres eliminar la sucursal "${selectedSucursal.nombre}"?`)) {
      return
    }

    try {
      setSaving(true)
      const response = await api(`/api/contabilidad/sucursales/${selectedSucursal.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Sucursal eliminada correctamente")
        setSelectedSucursal(null)
        resetForm()
        fetchSucursales()
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al eliminar la sucursal")
      }
    } catch (error) {
      console.error("Error deleting sucursal:", error)
      toast.error("Error de conexión")
    } finally {
      setSaving(false)
    }
  }

  const isEditing = !!selectedSucursal?.id
  const empresaNombre = (s: SucursalConEmpresa) =>
    s.empresas ? `${s.empresas.codigo} - ${s.empresas.nombre}` : s.empresa_id || "—"

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Lista de Sucursales</CardTitle>
          <CardDescription>Selecciona una sucursal para ver o editar</CardDescription>
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
                    <TableHead>Empresa</TableHead>
                    <TableHead>Sucursal</TableHead>
                    <TableHead>Ciudad</TableHead>
                    <TableHead>Teléfonos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sucursales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                        No hay sucursales registradas
                      </TableCell>
                    </TableRow>
                  ) : (
                    sucursales.map((suc) => (
                      <TableRow
                        key={suc.id}
                        onClick={() => setSelectedSucursal(suc)}
                        className={`cursor-pointer ${
                          selectedSucursal?.id === suc.id ? "bg-blue-50" : ""
                        }`}
                      >
                        <TableCell className="font-mono font-semibold">{suc.codigo}</TableCell>
                        <TableCell className="font-semibold">{suc.nombre}</TableCell>
                        <TableCell className="text-sm text-gray-600">{empresaNombre(suc)}</TableCell>
                        <TableCell>{suc.sucursal || "—"}</TableCell>
                        <TableCell>{suc.ciudad || "—"}</TableCell>
                        <TableCell>{suc.telefonos || "—"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {isEditing ? `Editar Sucursal ${selectedSucursal?.codigo}` : "Nueva Sucursal"}
              </CardTitle>
              <CardDescription>
                {isEditing
                  ? "Edita la información de la sucursal"
                  : "Complete la información para crear una nueva sucursal"}
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
                  onClick={handleDelete}
                  disabled={saving}
                  className="bg-red-600 hover:bg-red-700 text-white"
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
            {/* Empresa */}
            <div className="space-y-2">
              <Label htmlFor="empresa_id">Empresa *</Label>
              <Select
                value={formData.empresa_id || ""}
                onValueChange={(v) => setFormData({ ...formData, empresa_id: v })}
                disabled={isEditing}
              >
                <SelectTrigger id="empresa_id">
                  <SelectValue placeholder="Seleccionar empresa" />
                </SelectTrigger>
                <SelectContent>
                  {empresas.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.codigo} - {e.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Código */}
            <div className="space-y-2">
              <Label htmlFor="codigo">Código *</Label>
              <Input
                id="codigo"
                value={formData.codigo || ""}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                disabled={isEditing}
                className="font-mono"
                placeholder="001"
              />
            </div>

            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formData.nombre || ""}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Nombre de la sucursal"
              />
            </div>

            {/* Sucursal */}
            <div className="space-y-2">
              <Label htmlFor="sucursal">Sucursal</Label>
              <Input
                id="sucursal"
                value={formData.sucursal || ""}
                onChange={(e) => setFormData({ ...formData, sucursal: e.target.value })}
                placeholder="Ej: La Paz, Santa Cruz"
              />
            </div>

            {/* Representante */}
            <div className="space-y-2">
              <Label htmlFor="representante">Representante</Label>
              <Input
                id="representante"
                value={formData.representante || ""}
                onChange={(e) => setFormData({ ...formData, representante: e.target.value })}
                placeholder="Nombre del representante"
              />
            </div>

            {/* Dirección */}
            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                value={formData.direccion || ""}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                placeholder="Dirección completa"
              />
            </div>

            {/* Teléfonos */}
            <div className="space-y-2">
              <Label htmlFor="telefonos">Teléfonos</Label>
              <Input
                id="telefonos"
                value={formData.telefonos || ""}
                onChange={(e) => setFormData({ ...formData, telefonos: e.target.value })}
                placeholder="Teléfonos de contacto"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ""}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@ejemplo.com"
              />
            </div>

            {/* País */}
            <div className="space-y-2">
              <Label htmlFor="pais">País</Label>
              <Input
                id="pais"
                value={formData.pais || ""}
                onChange={(e) => setFormData({ ...formData, pais: e.target.value })}
                placeholder="País"
              />
            </div>

            {/* Ciudad */}
            <div className="space-y-2">
              <Label htmlFor="ciudad">Ciudad</Label>
              <Input
                id="ciudad"
                value={formData.ciudad || ""}
                onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                placeholder="Ciudad"
              />
            </div>

            {/* Localidad */}
            <div className="space-y-2">
              <Label htmlFor="localidad">Localidad</Label>
              <Input
                id="localidad"
                value={formData.localidad || ""}
                onChange={(e) => setFormData({ ...formData, localidad: e.target.value })}
                placeholder="Localidad"
              />
            </div>

            {/* NIT */}
            <div className="space-y-2">
              <Label htmlFor="nit">NIT</Label>
              <Input
                id="nit"
                value={formData.nit || ""}
                onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                placeholder="Número de identificación tributaria"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
