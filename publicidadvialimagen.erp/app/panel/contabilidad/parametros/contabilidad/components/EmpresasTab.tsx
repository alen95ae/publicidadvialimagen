"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Save, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/fetcher"
import type { Empresa } from "@/lib/types/contabilidad"

export default function EmpresasTab() {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null)

  const [formData, setFormData] = useState<Partial<Empresa>>({
    codigo: "",
    nombre: "",
    representante: "",
    direccion: "",
    casilla: "",
    telefonos: "",
    email: "",
    pais: "",
    ciudad: "",
    localidad: "",
    nit: "",
  })

  useEffect(() => {
    fetchEmpresas()
  }, [])

  useEffect(() => {
    if (selectedEmpresa) {
      setFormData({
        codigo: selectedEmpresa.codigo,
        nombre: selectedEmpresa.nombre,
        representante: selectedEmpresa.representante || "",
        direccion: selectedEmpresa.direccion || "",
        casilla: selectedEmpresa.casilla || "",
        telefonos: selectedEmpresa.telefonos || "",
        email: selectedEmpresa.email || "",
        pais: selectedEmpresa.pais || "",
        ciudad: selectedEmpresa.ciudad || "",
        localidad: selectedEmpresa.localidad || "",
        nit: selectedEmpresa.nit || "",
      })
    } else {
      resetForm()
    }
  }, [selectedEmpresa])

  const fetchEmpresas = async () => {
    try {
      setLoading(true)
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
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      codigo: "",
      nombre: "",
      representante: "",
      direccion: "",
      casilla: "",
      telefonos: "",
      email: "",
      pais: "",
      ciudad: "",
      localidad: "",
      nit: "",
    })
  }

  const handleNew = () => {
    setSelectedEmpresa(null)
    resetForm()
  }

  const handleSave = async () => {
    if (!formData.codigo || !formData.nombre) {
      toast.error("Código y nombre son requeridos")
      return
    }

    try {
      setSaving(true)

      if (selectedEmpresa?.id) {
        // Actualizar
        const response = await api(`/api/contabilidad/empresas/${selectedEmpresa.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })

        if (response.ok) {
          toast.success("Empresa actualizada correctamente")
          fetchEmpresas()
        } else {
          const error = await response.json()
          toast.error(error.error || "Error al actualizar la empresa")
        }
      } else {
        // Crear
        const response = await api("/api/contabilidad/empresas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })

        if (response.ok) {
          toast.success("Empresa creada correctamente")
          resetForm()
          fetchEmpresas()
        } else {
          const error = await response.json()
          toast.error(error.error || "Error al crear la empresa")
        }
      }
    } catch (error) {
      console.error("Error saving empresa:", error)
      toast.error("Error de conexión")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedEmpresa?.id) {
      toast.error("Debe seleccionar una empresa para eliminar")
      return
    }

    if (!confirm(`¿Estás seguro de que quieres eliminar la empresa "${selectedEmpresa.nombre}"?`)) {
      return
    }

    try {
      setSaving(true)
      const response = await api(`/api/contabilidad/empresas/${selectedEmpresa.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Empresa eliminada correctamente")
        setSelectedEmpresa(null)
        resetForm()
        fetchEmpresas()
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al eliminar la empresa")
      }
    } catch (error) {
      console.error("Error deleting empresa:", error)
      toast.error("Error de conexión")
    } finally {
      setSaving(false)
    }
  }

  const isEditing = !!selectedEmpresa?.id

  return (
    <div className="space-y-6">
      {/* Tabla de empresas */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Empresas</CardTitle>
          <CardDescription>Selecciona una empresa para ver o editar</CardDescription>
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
                    <TableHead>NIT</TableHead>
                    <TableHead>Ciudad</TableHead>
                    <TableHead>Teléfonos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {empresas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                        No hay empresas registradas
                      </TableCell>
                    </TableRow>
                  ) : (
                    empresas.map((empresa) => (
                      <TableRow
                        key={empresa.id}
                        onClick={() => setSelectedEmpresa(empresa)}
                        className={`cursor-pointer ${
                          selectedEmpresa?.id === empresa.id ? "bg-blue-50" : ""
                        }`}
                      >
                        <TableCell className="font-mono font-semibold">
                          {empresa.codigo}
                        </TableCell>
                        <TableCell className="font-semibold">{empresa.nombre}</TableCell>
                        <TableCell className="font-mono">{empresa.nit || "—"}</TableCell>
                        <TableCell>{empresa.ciudad || "—"}</TableCell>
                        <TableCell>{empresa.telefonos || "—"}</TableCell>
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
                {isEditing ? `Editar Empresa ${selectedEmpresa?.codigo}` : "Nueva Empresa"}
              </CardTitle>
              <CardDescription>
                {isEditing
                  ? "Edita la información de la empresa"
                  : "Complete la información para crear una nueva empresa"}
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
                placeholder="Nombre de la empresa"
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

            {/* Casilla */}
            <div className="space-y-2">
              <Label htmlFor="casilla">Casilla</Label>
              <Input
                id="casilla"
                value={formData.casilla || ""}
                onChange={(e) => setFormData({ ...formData, casilla: e.target.value })}
                placeholder="Número de casilla"
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
                className="font-mono"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
