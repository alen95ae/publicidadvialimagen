"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Edit, Plus, Trash2, GripVertical, Save, Check, ChevronsUpDown, Power, PowerOff } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { api } from "@/lib/fetcher"
import type { Cuenta } from "@/lib/types/contabilidad"

interface Plantilla {
  id: string
  codigo: string
  nombre: string
  descripcion: string | null
  tipo_comprobante: string
  activa: boolean
  detalles?: PlantillaDetalle[]
}

interface PlantillaDetalle {
  id: string
  plantilla_id: string
  orden: number
  lado: "DEBE" | "HABER"
  porcentaje: number | null
  cuenta_es_fija: boolean
  permite_seleccionar_cuenta: boolean
  cuenta_id: string | null
  permite_auxiliar: boolean
}

export default function PlantillasTab() {
  const [plantillas, setPlantillas] = useState<Plantilla[]>([])
  const [loading, setLoading] = useState(true)
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState<Plantilla | null>(null)
  const [detallesPlantilla, setDetallesPlantilla] = useState<PlantillaDetalle[]>([])
  const [dialogAbierto, setDialogAbierto] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  
  // Estados para el formulario de plantilla
  const [dialogFormularioAbierto, setDialogFormularioAbierto] = useState(false)
  const [editandoPlantilla, setEditandoPlantilla] = useState(false)
  const [formData, setFormData] = useState({
    codigo: "",
    nombre: "",
    descripcion: "",
    tipo_comprobante: "Diario" as "Diario" | "Ingreso" | "Egreso" | "Traspaso" | "Ctas por Pagar",
    activa: true,
  })
  
  // Estados para cuentas
  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  const [loadingCuentas, setLoadingCuentas] = useState(false)
  const [openCuentaCombobox, setOpenCuentaCombobox] = useState<Record<string, boolean>>({})
  const [filteredCuentas, setFilteredCuentas] = useState<Record<string, Cuenta[]>>({})

  useEffect(() => {
    cargarPlantillas()
    cargarCuentas()
  }, [])

  const cargarPlantillas = async () => {
    try {
      setLoading(true)
      // Cargar todas las plantillas (no solo activas)
      const response = await api("/api/contabilidad/plantillas?solo_activas=false")
      if (response.ok) {
        const data = await response.json()
        setPlantillas(data.data || [])
      }
    } catch (error) {
      console.error("Error cargando plantillas:", error)
    } finally {
      setLoading(false)
    }
  }

  const cargarCuentas = async () => {
    try {
      setLoadingCuentas(true)
      const response = await api("/api/contabilidad/cuentas?limit=10000")
      if (response.ok) {
        const data = await response.json()
        setCuentas(data.data || [])
      }
    } catch (error) {
      console.error("Error cargando cuentas:", error)
    } finally {
      setLoadingCuentas(false)
    }
  }

  const editarPlantilla = async (plantilla: Plantilla) => {
    setPlantillaSeleccionada(plantilla)
    try {
      const response = await api(`/api/contabilidad/plantillas/${plantilla.id}`)
      if (response.ok) {
        const data = await response.json()
        // Mapear detalles para asegurar compatibilidad con la nueva estructura
        const detallesMapeados = (data.data.detalles || []).map((det: any) => ({
          ...det,
          cuenta_es_fija: det.cuenta_es_fija ?? (det.cuenta_fija !== null && det.cuenta_fija !== ""),
          cuenta_id: det.cuenta_id ?? det.cuenta_fija ?? null,
          permite_seleccionar_cuenta: det.permite_seleccionar_cuenta ?? false,
        }))
        setDetallesPlantilla(detallesMapeados)
        setDialogAbierto(true)
      } else {
        toast.error("Error al cargar la plantilla")
      }
    } catch (error) {
      console.error("Error cargando plantilla:", error)
      toast.error("Error de conexión")
    }
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === dropIndex) return

    const newList = [...detallesPlantilla]
    const [movedItem] = newList.splice(draggedIndex, 1)
    newList.splice(dropIndex, 0, movedItem)

    // Actualizar orden localmente
    const reorderedList = newList.map((item, index) => ({
      ...item,
      orden: index + 1,
    }))

    setDetallesPlantilla(reorderedList)
    setDraggedIndex(null)

    // Guardar nuevo orden en backend
    await guardarOrden(reorderedList)
  }

  const guardarOrden = async (lista: PlantillaDetalle[]) => {
    try {
      const items = lista.map((item, index) => ({
        id: item.id,
        orden: index + 1,
      }))

      const response = await api("/api/contabilidad/plantillas-detalle/reordenar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      })

      if (response.ok) {
        // Actualizar orden local
        setDetallesPlantilla(lista)
      } else {
        toast.error("Error al reordenar líneas")
        // Recargar desde backend
        if (plantillaSeleccionada) {
          editarPlantilla(plantillaSeleccionada)
        }
      }
    } catch (error) {
      console.error("Error guardando orden:", error)
      toast.error("Error de conexión")
    }
  }

  const actualizarDetalle = async (id: string, campo: keyof PlantillaDetalle | "permite_seleccionar_cuenta", valor: any) => {
    const detalle = detallesPlantilla.find((d) => d.id === id)
    if (!detalle) return

    // Preparar datos para actualizar
    let updateData: any = {}
    let nuevosDetalles = detallesPlantilla

    if (campo === "lado") {
      updateData.lado = valor
      nuevosDetalles = detallesPlantilla.map((d) =>
        d.id === id ? { ...d, lado: valor } : d
      )
    } else if (campo === "porcentaje") {
      const porcentajeValue = valor !== "" && valor !== null ? parseFloat(valor) : null
      updateData.porcentaje = porcentajeValue
      nuevosDetalles = detallesPlantilla.map((d) =>
        d.id === id ? { ...d, porcentaje: porcentajeValue } : d
      )
    } else if (campo === "cuenta_es_fija") {
      // Activar/desactivar cuenta fija
      const cuentaEsFija = valor === true
      updateData.cuenta_es_fija = cuentaEsFija
      updateData.permite_seleccionar_cuenta = !cuentaEsFija
      // Si se desactiva cuenta_es_fija, limpiar cuenta_id si no hay permite_seleccionar_cuenta
      if (!cuentaEsFija && !detalle.permite_seleccionar_cuenta) {
        updateData.cuenta_id = null
      }
      nuevosDetalles = detallesPlantilla.map((d) =>
        d.id === id ? { 
          ...d, 
          cuenta_es_fija: cuentaEsFija,
          permite_seleccionar_cuenta: !cuentaEsFija,
          cuenta_id: cuentaEsFija ? d.cuenta_id : (!d.permite_seleccionar_cuenta ? null : d.cuenta_id)
        } : d
      )
    } else if (campo === "permite_seleccionar_cuenta") {
      // Activar/desactivar permite seleccionar cuenta
      const permiteSeleccionar = valor === true
      updateData.permite_seleccionar_cuenta = permiteSeleccionar
      updateData.cuenta_es_fija = !permiteSeleccionar
      // Si se desactiva permite_seleccionar_cuenta, limpiar cuenta_id si no hay cuenta_es_fija
      if (!permiteSeleccionar && !detalle.cuenta_es_fija) {
        updateData.cuenta_id = null
      }
      nuevosDetalles = detallesPlantilla.map((d) =>
        d.id === id ? { 
          ...d, 
          permite_seleccionar_cuenta: permiteSeleccionar,
          cuenta_es_fija: !permiteSeleccionar,
          cuenta_id: permiteSeleccionar ? d.cuenta_id : (!d.cuenta_es_fija ? null : d.cuenta_id)
        } : d
      )
    } else if (campo === "cuenta_id") {
      // Actualizar cuenta_id (código de cuenta)
      updateData.cuenta_id = valor || null
      nuevosDetalles = detallesPlantilla.map((d) =>
        d.id === id ? { ...d, cuenta_id: valor || null } : d
      )
    } else if (campo === "permite_auxiliar") {
      updateData.permite_auxiliar = valor
      nuevosDetalles = detallesPlantilla.map((d) =>
        d.id === id ? { ...d, permite_auxiliar: valor } : d
      )
    }

    // Actualizar localmente primero
    setDetallesPlantilla(nuevosDetalles)

    // Si no hay cambios que guardar, salir
    if (Object.keys(updateData).length === 0) return

    try {
      const response = await api(`/api/contabilidad/plantillas-detalle/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        toast.error("Error al actualizar línea")
        // Revertir cambio local
        setDetallesPlantilla(detallesPlantilla)
      }
    } catch (error) {
      console.error("Error actualizando detalle:", error)
      toast.error("Error de conexión")
      // Revertir cambio local
      setDetallesPlantilla(detallesPlantilla)
    }
  }

  const agregarLinea = async () => {
    if (!plantillaSeleccionada) return

    try {
      setSaving(true)
      const response = await api("/api/contabilidad/plantillas-detalle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plantilla_id: plantillaSeleccionada.id,
          lado: "DEBE",
          porcentaje: null,
          cuenta_es_fija: false,
          permite_seleccionar_cuenta: false,
          cuenta_id: null,
          permite_auxiliar: false,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // Mapear el detalle agregado para asegurar compatibilidad
        const detalleMapeado = {
          ...data.data,
          cuenta_es_fija: data.data.cuenta_es_fija ?? (data.data.cuenta_fija !== null && data.data.cuenta_fija !== ""),
          cuenta_id: data.data.cuenta_id ?? data.data.cuenta_fija ?? null,
          permite_seleccionar_cuenta: data.data.permite_seleccionar_cuenta ?? false,
        }
        setDetallesPlantilla([...detallesPlantilla, detalleMapeado])
        toast.success("Línea agregada")
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al agregar línea")
      }
    } catch (error) {
      console.error("Error agregando línea:", error)
      toast.error("Error de conexión")
    } finally {
      setSaving(false)
    }
  }

  const eliminarLinea = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta línea?")) return

    try {
      setSaving(true)
      const response = await api(`/api/contabilidad/plantillas-detalle/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setDetallesPlantilla(detallesPlantilla.filter((d) => d.id !== id))
        toast.success("Línea eliminada")
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al eliminar línea")
      }
    } catch (error) {
      console.error("Error eliminando línea:", error)
      toast.error("Error de conexión")
    } finally {
      setSaving(false)
    }
  }

  const filtrarCuentas = (detalleId: string, searchValue: string) => {
    if (!searchValue || searchValue.trim() === '') {
      setFilteredCuentas(prev => ({ ...prev, [detalleId]: cuentas.slice(0, 20) }))
      return
    }

    const search = searchValue.toLowerCase().trim()
    const filtered = cuentas.filter((cuenta) => {
      const codigo = (cuenta.cuenta || '').toLowerCase()
      const descripcion = (cuenta.descripcion || '').toLowerCase()
      return codigo.startsWith(search) || descripcion.includes(search)
    }).slice(0, 20)

    setFilteredCuentas(prev => ({ ...prev, [detalleId]: filtered }))
  }

  const seleccionarCuenta = (detalleId: string, cuenta: Cuenta) => {
    actualizarDetalle(detalleId, "cuenta_id", cuenta.cuenta)
    setOpenCuentaCombobox(prev => ({ ...prev, [detalleId]: false }))
  }

  const getCuentaDisplayText = (cuentaCodigo: string | null) => {
    if (!cuentaCodigo) return "Seleccionar cuenta..."
    const cuenta = cuentas.find(c => c.cuenta === cuentaCodigo)
    if (cuenta) {
      return `${cuenta.cuenta} - ${cuenta.descripcion}`
    }
    return cuentaCodigo
  }

  const nuevaPlantilla = () => {
    setEditandoPlantilla(false)
    setFormData({
      codigo: "",
      nombre: "",
      descripcion: "",
      tipo_comprobante: "Diario",
      activa: true,
    })
    setDialogFormularioAbierto(true)
  }

  const editarPlantillaForm = (plantilla: Plantilla) => {
    setEditandoPlantilla(true)
    setFormData({
      codigo: plantilla.codigo,
      nombre: plantilla.nombre,
      descripcion: plantilla.descripcion || "",
      tipo_comprobante: plantilla.tipo_comprobante as any,
      activa: plantilla.activa,
    })
    setPlantillaSeleccionada(plantilla)
    setDialogFormularioAbierto(true)
  }

  const guardarPlantilla = async () => {
    try {
      setSaving(true)

      // Validaciones
      if (!formData.codigo.trim()) {
        toast.error("El código es requerido")
        return
      }
      if (!formData.nombre.trim()) {
        toast.error("El nombre es requerido")
        return
      }

      let response
      if (editandoPlantilla && plantillaSeleccionada) {
        // Actualizar
        response = await api(`/api/contabilidad/plantillas/${plantillaSeleccionada.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })
      } else {
        // Crear
        response = await api("/api/contabilidad/plantillas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })
      }

      if (response.ok) {
        toast.success(editandoPlantilla ? "Plantilla actualizada" : "Plantilla creada")
        setDialogFormularioAbierto(false)
        cargarPlantillas()
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al guardar plantilla")
      }
    } catch (error) {
      console.error("Error guardando plantilla:", error)
      toast.error("Error de conexión")
    } finally {
      setSaving(false)
    }
  }

  const toggleActiva = async (plantilla: Plantilla) => {
    try {
      const response = await api(`/api/contabilidad/plantillas/${plantilla.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activa: !plantilla.activa }),
      })

      if (response.ok) {
        toast.success(plantilla.activa ? "Plantilla desactivada" : "Plantilla activada")
        cargarPlantillas()
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al cambiar estado")
      }
    } catch (error) {
      console.error("Error cambiando estado:", error)
      toast.error("Error de conexión")
    }
  }

  const eliminarPlantilla = async (plantilla: Plantilla) => {
    if (!confirm(`¿Estás seguro de eliminar la plantilla "${plantilla.nombre}"?`)) return

    try {
      const response = await api(`/api/contabilidad/plantillas/${plantilla.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Plantilla eliminada")
        cargarPlantillas()
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al eliminar plantilla")
      }
    } catch (error) {
      console.error("Error eliminando plantilla:", error)
      toast.error("Error de conexión")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-gray-500">Cargando plantillas...</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Plantillas contables configuradas en el sistema. Estas plantillas se usan para generar comprobantes automáticamente.
          </p>
          <Button onClick={nuevaPlantilla}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Plantilla
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo de Comprobante</TableHead>
              <TableHead>Activa</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plantillas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                  No hay plantillas configuradas
                </TableCell>
              </TableRow>
            ) : (
              plantillas.map((plantilla) => (
                <TableRow key={plantilla.id}>
                  <TableCell className="font-mono text-sm">{plantilla.codigo}</TableCell>
                  <TableCell className="font-medium">{plantilla.nombre}</TableCell>
                  <TableCell>{plantilla.tipo_comprobante}</TableCell>
                  <TableCell>
                    <Badge variant={plantilla.activa ? "default" : "secondary"}>
                      {plantilla.activa ? "Sí" : "No"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editarPlantilla(plantilla)}
                        title="Editar líneas"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar Líneas
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editarPlantillaForm(plantilla)}
                        title="Editar plantilla"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActiva(plantilla)}
                        title={plantilla.activa ? "Desactivar" : "Activar"}
                      >
                        {plantilla.activa ? (
                          <PowerOff className="w-4 h-4 text-orange-500" />
                        ) : (
                          <Power className="w-4 h-4 text-green-500" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => eliminarPlantilla(plantilla)}
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog de edición */}
      <Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Plantilla: {plantillaSeleccionada?.nombre}</DialogTitle>
            <DialogDescription>
              Edita las líneas de la plantilla contable
            </DialogDescription>
          </DialogHeader>

          {plantillaSeleccionada && (
            <div className="space-y-4">
              {/* Información general */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Información General</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Código</p>
                      <p className="font-mono">{plantillaSeleccionada.codigo}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Tipo de Comprobante</p>
                      <p>{plantillaSeleccionada.tipo_comprobante}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabla editable de líneas */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Líneas de la Plantilla</CardTitle>
                    <CardDescription>Arrastra para reordenar, edita los campos directamente</CardDescription>
                  </div>
                  <Button onClick={agregarLinea} disabled={saving} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Línea
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead className="w-16">Orden</TableHead>
                        <TableHead className="w-32">Lado</TableHead>
                        <TableHead className="w-32">Porcentaje</TableHead>
                        <TableHead className="w-32">Cuenta Fija</TableHead>
                        <TableHead className="w-32">Seleccionar Cuenta</TableHead>
                        <TableHead className="w-48">Cuenta</TableHead>
                        <TableHead className="w-32">Permite Auxiliar</TableHead>
                        <TableHead className="w-24">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detallesPlantilla.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center text-gray-500 py-8">
                            No hay líneas configuradas. Haz clic en "Agregar Línea" para comenzar.
                          </TableCell>
                        </TableRow>
                      ) : (
                        detallesPlantilla
                          .sort((a, b) => a.orden - b.orden)
                          .map((detalle, index) => {
                            const mostrarCuenta = detalle.cuenta_es_fija || detalle.permite_seleccionar_cuenta
                            
                            return (
                              <TableRow
                                key={detalle.id}
                                draggable
                                onDragStart={() => handleDragStart(index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDrop={(e) => handleDrop(e, index)}
                                className={cn(
                                  "cursor-move",
                                  draggedIndex === index && "opacity-50"
                                )}
                              >
                                <TableCell>
                                  <GripVertical className="w-4 h-4 text-gray-400" />
                                </TableCell>
                                <TableCell className="font-medium">{detalle.orden}</TableCell>
                                <TableCell>
                                  <Select
                                    value={detalle.lado}
                                    onValueChange={(value) => actualizarDetalle(detalle.id, "lado", value)}
                                  >
                                    <SelectTrigger className="w-32">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="DEBE">DEBE</SelectItem>
                                      <SelectItem value="HABER">HABER</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={detalle.porcentaje ?? ""}
                                    onChange={(e) => {
                                      const value = e.target.value === "" ? null : e.target.value
                                      actualizarDetalle(detalle.id, "porcentaje", value)
                                    }}
                                    className="w-32"
                                    placeholder="0.00"
                                  />
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-2">
                                    <Switch
                                      checked={detalle.cuenta_es_fija}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          // Si se activa cuenta_es_fija, desactivar permite_seleccionar_cuenta
                                          actualizarDetalle(detalle.id, "cuenta_es_fija", true)
                                          actualizarDetalle(detalle.id, "permite_seleccionar_cuenta", false)
                                        } else {
                                          actualizarDetalle(detalle.id, "cuenta_es_fija", false)
                                        }
                                      }}
                                    />
                                    <Label className="text-sm">
                                      {detalle.cuenta_es_fija ? "Sí" : "No"}
                                    </Label>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-2">
                                    <Switch
                                      checked={detalle.permite_seleccionar_cuenta}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          // Si se activa permite_seleccionar_cuenta, desactivar cuenta_es_fija
                                          actualizarDetalle(detalle.id, "permite_seleccionar_cuenta", true)
                                          actualizarDetalle(detalle.id, "cuenta_es_fija", false)
                                        } else {
                                          actualizarDetalle(detalle.id, "permite_seleccionar_cuenta", false)
                                        }
                                      }}
                                    />
                                    <Label className="text-sm">
                                      {detalle.permite_seleccionar_cuenta ? "Sí" : "No"}
                                    </Label>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {mostrarCuenta ? (
                                    <Popover
                                      open={openCuentaCombobox[detalle.id] || false}
                                      onOpenChange={(open) => {
                                        setOpenCuentaCombobox(prev => ({ ...prev, [detalle.id]: open }))
                                        if (open) {
                                          setFilteredCuentas(prev => ({ ...prev, [detalle.id]: cuentas.slice(0, 20) }))
                                        }
                                      }}
                                    >
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="outline"
                                          role="combobox"
                                          className="w-full justify-between"
                                        >
                                          <span className={cn(
                                            "truncate",
                                            !detalle.cuenta_id && "text-muted-foreground"
                                          )}>
                                            {getCuentaDisplayText(detalle.cuenta_id)}
                                          </span>
                                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-[400px] p-0" align="start">
                                        <Command shouldFilter={false}>
                                          <CommandInput
                                            placeholder={
                                              detalle.cuenta_es_fija 
                                                ? "Buscar cuenta (obligatorio)..." 
                                                : "Buscar cuenta (opcional)..."
                                            }
                                            className="h-9"
                                            onValueChange={(value) => filtrarCuentas(detalle.id, value)}
                                          />
                                          <CommandList>
                                            <CommandEmpty>
                                              {loadingCuentas ? "Cargando..." : "No se encontraron cuentas."}
                                            </CommandEmpty>
                                            {(filteredCuentas[detalle.id] || cuentas.slice(0, 20)).map((cuenta) => (
                                              <CommandItem
                                                key={cuenta.id}
                                                value={`${cuenta.cuenta} ${cuenta.descripcion}`}
                                                onSelect={() => seleccionarCuenta(detalle.id, cuenta)}
                                              >
                                                <Check
                                                  className={cn(
                                                    "mr-2 h-4 w-4",
                                                    detalle.cuenta_id === cuenta.cuenta ? "opacity-100" : "opacity-0"
                                                  )}
                                                />
                                                <div className="flex items-center gap-2">
                                                  <span className="font-mono font-medium">{cuenta.cuenta}</span>
                                                  <span className="text-gray-600 truncate">{cuenta.descripcion}</span>
                                                </div>
                                              </CommandItem>
                                            ))}
                                          </CommandList>
                                        </Command>
                                      </PopoverContent>
                                    </Popover>
                                  ) : (
                                    <span className="text-gray-400 text-sm">—</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-2">
                                    <Switch
                                      checked={detalle.permite_auxiliar}
                                      onCheckedChange={(checked) => actualizarDetalle(detalle.id, "permite_auxiliar", checked)}
                                    />
                                    <Label className="text-sm">
                                      {detalle.permite_auxiliar ? "Sí" : "No"}
                                    </Label>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => eliminarLinea(detalle.id)}
                                    disabled={saving}
                                  >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            )
                          })
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de formulario de plantilla */}
      <Dialog open={dialogFormularioAbierto} onOpenChange={setDialogFormularioAbierto}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editandoPlantilla ? "Editar Plantilla" : "Nueva Plantilla"}
            </DialogTitle>
            <DialogDescription>
              {editandoPlantilla 
                ? "Modifica la información de la plantilla contable"
                : "Crea una nueva plantilla contable para generar comprobantes automáticamente"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código *</Label>
              <Input
                id="codigo"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                placeholder="Ej: COMPRA_CF"
                disabled={editandoPlantilla}
                className="font-mono"
              />
              <p className="text-xs text-gray-500">
                {editandoPlantilla 
                  ? "El código no se puede modificar después de crear la plantilla"
                  : "Código único de la plantilla (no se puede modificar después)"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Compra con Factura"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Input
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción opcional de la plantilla"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_comprobante">Tipo de Comprobante *</Label>
              <Select
                value={formData.tipo_comprobante}
                onValueChange={(value) => setFormData({ ...formData, tipo_comprobante: value as any })}
              >
                <SelectTrigger id="tipo_comprobante">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Diario">Diario</SelectItem>
                  <SelectItem value="Ingreso">Ingreso</SelectItem>
                  <SelectItem value="Egreso">Egreso</SelectItem>
                  <SelectItem value="Traspaso">Traspaso</SelectItem>
                  <SelectItem value="Ctas por Pagar">Ctas por Pagar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="activa"
                checked={formData.activa}
                onCheckedChange={(checked) => setFormData({ ...formData, activa: checked })}
              />
              <Label htmlFor="activa">Plantilla activa</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setDialogFormularioAbierto(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button onClick={guardarPlantilla} disabled={saving}>
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
