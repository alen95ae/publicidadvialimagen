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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Auxiliar, AuxiliarSaldos, TipoAuxiliar, Moneda } from "@/lib/types/contabilidad"
import { api } from "@/lib/fetcher"

const TIPOS_AUXILIAR: TipoAuxiliar[] = ["Cliente", "Proveedor", "Banco", "Caja", "Empleado", "Otro"]
// Monedas: BS es el valor por defecto en la BD, pero también puede haber USD
const MONEDAS: string[] = ["BS", "USD"]

export default function AuxiliaresTab() {
  const [auxiliares, setAuxiliares] = useState<Auxiliar[]>([])
  const [selectedAuxiliar, setSelectedAuxiliar] = useState<Auxiliar | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saldos, setSaldos] = useState<AuxiliarSaldos[]>([])
  
  // Estado del formulario
  const [formData, setFormData] = useState<any>({
    tipo_auxiliar: "",
    codigo: "",
    nombre: "",
    cuenta_id: null,
    moneda: "BS",
    es_cuenta_bancaria: false,
    departamento: "",
    direccion: "",
    telefono: "",
    email: "",
    nit: "",
    autorizacion: "",
    vigente: true,
  })

  useEffect(() => {
    fetchAuxiliares()
  }, [])

  // DEBUG: Log cuando cambia el estado de auxiliares
  useEffect(() => {
    console.log("🔍 [AuxiliaresTab] Estado auxiliares actualizado:", {
      total: auxiliares.length,
      loading: loading,
      primerAuxiliar: auxiliares.length > 0 ? {
        id: auxiliares[0].id,
        codigo: auxiliares[0].codigo,
        nombre: auxiliares[0].nombre,
      } : null,
    })
  }, [auxiliares, loading])

  useEffect(() => {
    if (selectedAuxiliar) {
      // Priorizar datos de contactos si existen, sino usar datos de auxiliar
      const contacto = selectedAuxiliar.contactos
      const nombre = contacto?.nombre ?? selectedAuxiliar.nombre ?? ""
      const telefono = contacto?.telefono ?? selectedAuxiliar.telefono ?? ""
      const email = contacto?.email ?? selectedAuxiliar.email ?? ""
      const nit = contacto?.nit ?? selectedAuxiliar.nit ?? ""

      setFormData({
        tipo_auxiliar: selectedAuxiliar.tipo_auxiliar || "",
        codigo: selectedAuxiliar.codigo || "",
        nombre: nombre,
        cuenta_id: (selectedAuxiliar as any).cuenta_id || null,
        moneda: selectedAuxiliar.moneda || "BS",
        es_cuenta_bancaria: (selectedAuxiliar as any).es_cuenta_bancaria ?? false,
        departamento: selectedAuxiliar.departamento || "",
        direccion: selectedAuxiliar.direccion || "",
        telefono: telefono,
        email: email,
        nit: nit,
        autorizacion: selectedAuxiliar.autorizacion || "",
        vigente: (selectedAuxiliar as any).vigente ?? true,
      })
      fetchSaldos(selectedAuxiliar.id)
    } else {
      resetForm()
    }
  }, [selectedAuxiliar])

  const fetchAuxiliares = async () => {
    try {
      setLoading(true)
      console.log("🔍 [AuxiliaresTab] Iniciando carga de auxiliares...")
      // Solicitar todos los registros (límite alto)
      const response = await api("/api/contabilidad/auxiliares?limit=10000")
      
      // DEBUG: Log de respuesta
      console.log("🔍 [AuxiliaresTab] Status de respuesta:", response.status)
      console.log("🔍 [AuxiliaresTab] Response OK:", response.ok)
      
      if (response.ok) {
        const data = await response.json()
        console.log("🔍 [AuxiliaresTab] Datos recibidos:", {
          success: data.success,
          totalRegistros: data.pagination?.total || 0,
          registrosEnPagina: data.data?.length || 0,
        })
        
        const auxiliaresData = data.data || []
        console.log("🔍 [AuxiliaresTab] Array de auxiliares:", auxiliaresData.length, "elementos")
        if (auxiliaresData.length > 0) {
          console.log("🔍 [AuxiliaresTab] Primer auxiliar:", JSON.stringify(auxiliaresData[0], null, 2))
        }
        
        setAuxiliares(auxiliaresData)
        console.log("✅ [AuxiliaresTab] Estado actualizado con", auxiliaresData.length, "auxiliares")
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error("❌ [AuxiliaresTab] Error en respuesta:", response.status, errorData)
        toast.error("Error al cargar los auxiliares")
      }
    } catch (error) {
      console.error("❌ [AuxiliaresTab] Error fetching auxiliares:", error)
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
      cuenta_id: null,
      moneda: "BS",
      es_cuenta_bancaria: false,
      departamento: "",
      direccion: "",
      telefono: "",
      email: "",
      nit: "",
      autorizacion: "",
      vigente: true,
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
    <div className="flex flex-col gap-4 h-full overflow-hidden">
      {/* Fila superior: Tabla de auxiliares y Panel de saldos */}
      <div className="flex gap-4 flex-1 min-h-0 overflow-hidden">
        {/* Contenedor principal - Tabla de auxiliares */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex-shrink-0">
              <CardTitle>Auxiliares</CardTitle>
              <CardDescription>Lista de auxiliares contables</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden flex flex-col min-h-0">
              {loading ? (
                <div className="text-center py-8 text-gray-500">Cargando...</div>
              ) : (
                <div 
                  className="overflow-x-auto max-h-[600px] overflow-y-auto"
                  data-table-container
                >
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-32">Tipo</TableHead>
                        <TableHead className="w-24">Código</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead className="w-20 text-center">Moneda</TableHead>
                        <TableHead className="w-24 text-center">Vigencia</TableHead>
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
                        auxiliares.map((auxiliar) => {
                          // Priorizar nombre de contactos si existe
                          const contacto = auxiliar.contactos
                          const nombre = contacto?.nombre ?? auxiliar.nombre ?? '—'
                          const vigente = (auxiliar as any).vigente ?? true

                          return (
                            <TableRow
                              key={auxiliar.id}
                              onClick={() => setSelectedAuxiliar(auxiliar)}
                              className={`cursor-pointer ${
                                selectedAuxiliar?.id === auxiliar.id ? "bg-blue-50" : ""
                              }`}
                            >
                              <TableCell>
                                <Badge variant="outline" className="text-xs">{auxiliar.tipo_auxiliar}</Badge>
                              </TableCell>
                              <TableCell className="font-mono">{auxiliar.codigo}</TableCell>
                              <TableCell>
                                {nombre && nombre.length > 40 ? (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger className="text-left">
                                        {nombre.slice(0, 40) + '…'}
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-sm">
                                        <p>{nombre}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                ) : (
                                  nombre
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className="text-xs">{auxiliar.moneda}</Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                {vigente ? (
                                  <Badge className="bg-green-100 text-green-800 text-xs">Activo</Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs">Inactivo</Badge>
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

        {/* Panel lateral de saldos */}
        <Card className="w-80 flex-shrink-0 overflow-hidden flex flex-col max-h-full">
          <CardHeader className="flex-shrink-0">
            <CardTitle>Saldos por Gestión</CardTitle>
            <CardDescription>Saldo del auxiliar por gestión</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden flex flex-col min-h-0">
            {!selectedAuxiliar ? (
              <div className="text-center text-gray-500 py-8">
                Seleccione un auxiliar para ver sus saldos
              </div>
            ) : saldos.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No hay saldos registrados
              </div>
            ) : (
              <div className="space-y-4 flex-1 overflow-hidden flex flex-col min-h-0">
                <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
                  <Table className="min-w-full">
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
      </div>

      {/* Formulario inferior - Todo el ancho */}
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
                <Button variant="outline" size="sm" onClick={handleDelete} className="border-gray-300">
                  <Trash2 className="w-4 h-4 mr-2 text-red-600" />
                  <span className="text-gray-700">Eliminar</span>
                </Button>
              )}
              <Button size="sm" onClick={handleSave} disabled={saving} className="bg-red-600 hover:bg-red-700 text-white">
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  {/* Si hay un tipo que no está en la lista, mostrarlo también */}
                  {formData.tipo_auxiliar && formData.tipo_auxiliar.trim() !== "" && !TIPOS_AUXILIAR.includes(formData.tipo_auxiliar as TipoAuxiliar) && (
                    <SelectItem value={formData.tipo_auxiliar}>
                      {formData.tipo_auxiliar}
                    </SelectItem>
                  )}
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
            <div className="space-y-2 md:col-span-2 lg:col-span-1">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formData.nombre || ""}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
              />
            </div>

            {/* Cuenta ID (cuenta_id) */}
            <div className="space-y-2">
              <Label htmlFor="cuenta_id">Cuenta ID</Label>
              <Input
                id="cuenta_id"
                type="number"
                value={formData.cuenta_id || ""}
                onChange={(e) =>
                  setFormData({ ...formData, cuenta_id: e.target.value ? parseInt(e.target.value) : null })
                }
                className="font-mono"
                placeholder="ID de cuenta"
              />
            </div>

            {/* Moneda */}
            <div className="space-y-2">
              <Label htmlFor="moneda">Moneda</Label>
              <Select
                value={formData.moneda || "BS"}
                onValueChange={(value) =>
                  setFormData({ ...formData, moneda: value })
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
                  {/* Si hay una moneda que no está en la lista, mostrarla también */}
                  {formData.moneda && !MONEDAS.includes(formData.moneda) && (
                    <SelectItem value={formData.moneda}>
                      {formData.moneda}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Es Cuenta Bancaria */}
            <div className="space-y-2 md:col-span-2 lg:col-span-1">
              <div className="flex items-center space-x-2 pt-6">
                <Checkbox
                  id="es_cuenta_bancaria"
                  checked={formData.es_cuenta_bancaria ?? false}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, es_cuenta_bancaria: !!checked })
                  }
                />
                <Label htmlFor="es_cuenta_bancaria" className="cursor-pointer">
                  Es Cuenta Bancaria
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

            {/* Vigente */}
            <div className="space-y-2 md:col-span-2 lg:col-span-1">
              <div className="flex items-center space-x-2 pt-6">
                <Checkbox
                  id="vigente"
                  checked={formData.vigente ?? true}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, vigente: !!checked })
                  }
                />
                <Label htmlFor="vigente" className="cursor-pointer">
                  Vigente
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

