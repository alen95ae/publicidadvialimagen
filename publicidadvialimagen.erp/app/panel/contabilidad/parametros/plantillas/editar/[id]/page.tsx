"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { ArrowLeft, Plus, Trash2, GripVertical, Check, ChevronsUpDown } from "lucide-react"
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
  cuenta_id: number | null
  permite_auxiliar: boolean
  bloqueado: boolean
}

export default function EditarPlantillaPage() {
  const router = useRouter()
  const params = useParams()
  const plantillaId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Datos de la plantilla
  const [formData, setFormData] = useState({
    codigo: "",
    nombre: "",
    descripcion: "",
    tipo_comprobante: "Diario" as "Diario" | "Ingreso" | "Egreso" | "Traspaso" | "Ctas por Pagar",
    activa: true,
  })

  // Detalles/líneas de la plantilla
  const [detallesPlantilla, setDetallesPlantilla] = useState<PlantillaDetalle[]>([])
  const [detallesOriginales, setDetallesOriginales] = useState<PlantillaDetalle[]>([])
  const [hayCambiosPendientes, setHayCambiosPendientes] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  // Cuentas
  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  const [loadingCuentas, setLoadingCuentas] = useState(false)
  const [openCuentaCombobox, setOpenCuentaCombobox] = useState<Record<string, boolean>>({})
  const [filteredCuentas, setFilteredCuentas] = useState<Record<string, Cuenta[]>>({})

  useEffect(() => {
    cargarPlantilla()
    cargarCuentas()
  }, [plantillaId])

  const cargarPlantilla = async () => {
    try {
      setLoading(true)
      const response = await api(`/api/contabilidad/plantillas/${plantillaId}`)
      if (response.ok) {
        const data = await response.json()
        const plantilla = data.data
        
        setFormData({
          codigo: plantilla.codigo || "",
          nombre: plantilla.nombre || "",
          descripcion: plantilla.descripcion || "",
          tipo_comprobante: plantilla.tipo_comprobante || "Diario",
          activa: plantilla.activa ?? true,
        })

        const detallesMapeados = (plantilla.detalles || []).map((det: any) => ({
          ...det,
          cuenta_es_fija: det.cuenta_es_fija ?? (det.cuenta_fija !== null && det.cuenta_fija !== ""),
          cuenta_id: det.cuenta_id ? Number(det.cuenta_id) : null,
          // Cargar bloqueado directamente desde backend, sin inferencias
          bloqueado: det.bloqueado ?? false,
        }))
        
        setDetallesPlantilla(detallesMapeados)
        setDetallesOriginales(JSON.parse(JSON.stringify(detallesMapeados)))
      } else {
        toast.error("Error al cargar la plantilla")
        router.push("/panel/contabilidad/parametros/plantillas")
      }
    } catch (error) {
      console.error("Error cargando plantilla:", error)
      toast.error("Error de conexión")
      router.push("/panel/contabilidad/parametros/plantillas")
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

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === dropIndex) return

    const newList = [...detallesPlantilla]
    const [movedItem] = newList.splice(draggedIndex, 1)
    newList.splice(dropIndex, 0, movedItem)

    const reorderedList = newList.map((item, index) => ({
      ...item,
      orden: index + 1,
    }))

    setDetallesPlantilla(reorderedList)
    setDraggedIndex(null)
    setHayCambiosPendientes(true)
  }

  const actualizarDetalle = (id: string, campo: keyof PlantillaDetalle, valor: any) => {
    const detalle = detallesPlantilla.find((d) => d.id === id)
    if (!detalle) return

    let nuevosDetalles = detallesPlantilla

    if (campo === "lado") {
      nuevosDetalles = detallesPlantilla.map((d) =>
        d.id === id ? { ...d, lado: valor } : d
      )
    } else if (campo === "porcentaje") {
      const porcentajeValue = valor !== "" && valor !== null ? parseFloat(valor) : null
      // NO inferir bloqueado desde porcentaje - el usuario lo controla explícitamente
      nuevosDetalles = detallesPlantilla.map((d) =>
        d.id === id ? { ...d, porcentaje: porcentajeValue } : d
      )
    } else if (campo === "bloqueado") {
      nuevosDetalles = detallesPlantilla.map((d) =>
        d.id === id ? { ...d, bloqueado: valor } : d
      )
    } else if (campo === "cuenta_es_fija") {
      const cuentaEsFija = valor === true
      nuevosDetalles = detallesPlantilla.map((d) =>
        d.id === id ? { 
          ...d, 
          cuenta_es_fija: cuentaEsFija,
          cuenta_id: cuentaEsFija ? d.cuenta_id : null
        } : d
      )
    } else if (campo === "cuenta_id") {
      nuevosDetalles = detallesPlantilla.map((d) =>
        d.id === id ? { ...d, cuenta_id: valor ? Number(valor) : null } : d
      )
    } else if (campo === "permite_auxiliar") {
      nuevosDetalles = detallesPlantilla.map((d) =>
        d.id === id ? { ...d, permite_auxiliar: valor } : d
      )
    }

    setDetallesPlantilla(nuevosDetalles)
    setHayCambiosPendientes(true)
  }

  const agregarLinea = async () => {
    try {
      setSaving(true)
      const response = await api("/api/contabilidad/plantillas-detalle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plantilla_id: plantillaId,
          lado: "DEBE",
          porcentaje: null,
          cuenta_es_fija: false,
          cuenta_id: null,
          permite_auxiliar: false,
          bloqueado: false, // Nueva línea es editable por defecto
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const detalleMapeado = {
          ...data.data,
          cuenta_es_fija: data.data.cuenta_es_fija ?? (data.data.cuenta_fija !== null && data.data.cuenta_fija !== ""),
          cuenta_id: data.data.cuenta_id ? Number(data.data.cuenta_id) : null,
          bloqueado: data.data.bloqueado ?? false,
        }
        setDetallesPlantilla([...detallesPlantilla, detalleMapeado])
        setHayCambiosPendientes(true)
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

  const eliminarDetalle = async (id: string) => {
    if (!confirm("¿Eliminar esta línea?")) return

    try {
      const response = await api(`/api/contabilidad/plantillas-detalle/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setDetallesPlantilla(detallesPlantilla.filter((d) => d.id !== id))
        setHayCambiosPendientes(true)
        toast.success("Línea eliminada")
      } else {
        toast.error("Error al eliminar línea")
      }
    } catch (error) {
      console.error("Error eliminando línea:", error)
      toast.error("Error de conexión")
    }
  }

  const guardarCambios = async () => {
    try {
      setSaving(true)

      // 4️⃣ VALIDACIÓN: Impedir guardar si todas las líneas están bloqueadas
      const todasBloqueadas = detallesPlantilla.length > 0 && detallesPlantilla.every(d => d.bloqueado === true)
      if (todasBloqueadas) {
        toast.error("La plantilla debe tener al menos una línea editable (bloqueado = No)")
        setSaving(false)
        return
      }

      // 1. Guardar cambios en la plantilla principal
      const responsePlantilla = await api(`/api/contabilidad/plantillas/${plantillaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!responsePlantilla.ok) {
        const error = await responsePlantilla.json()
        throw new Error(error.error || "Error al actualizar plantilla")
      }

      // 2. Guardar cambios en las líneas
      const idsActuales = new Set(detallesPlantilla.map(d => d.id))
      const lineasEliminadas = detallesOriginales.filter(d => !idsActuales.has(d.id))

      // Eliminar líneas removidas
      for (const linea of lineasEliminadas) {
        await api(`/api/contabilidad/plantillas-detalle/${linea.id}`, {
          method: "DELETE",
        })
      }

      // Actualizar líneas modificadas
      for (const detalle of detallesPlantilla) {
        const original = detallesOriginales.find(d => d.id === detalle.id)
        const haCambiado = !original || 
          original.lado !== detalle.lado ||
          original.porcentaje !== detalle.porcentaje ||
          original.cuenta_es_fija !== detalle.cuenta_es_fija ||
          original.cuenta_id !== detalle.cuenta_id ||
          original.permite_auxiliar !== detalle.permite_auxiliar ||
          original.bloqueado !== detalle.bloqueado

        if (haCambiado) {
          const updateData: any = {
            lado: detalle.lado,
            porcentaje: detalle.porcentaje,
            cuenta_es_fija: detalle.cuenta_es_fija,
            cuenta_id: detalle.cuenta_id,
            permite_auxiliar: detalle.permite_auxiliar,
            bloqueado: detalle.bloqueado,
          }

          const response = await api(`/api/contabilidad/plantillas-detalle/${detalle.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updateData),
          })

          if (!response.ok) {
            throw new Error("Error al actualizar detalle")
          }
        }
      }

      // 3. Reordenar si hubo cambios en el orden
      const ordenCambio = detallesPlantilla.some((d, i) => {
        const original = detallesOriginales.find(o => o.id === d.id)
        return original && original.orden !== d.orden
      })

      if (ordenCambio) {
        const items = detallesPlantilla.map((item, index) => ({
          id: item.id,
          orden: index + 1,
        }))

        const response = await api("/api/contabilidad/plantillas-detalle/reordenar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
        })

        if (!response.ok) {
          throw new Error("Error al reordenar líneas")
        }
      }

      setDetallesOriginales(JSON.parse(JSON.stringify(detallesPlantilla)))
      setHayCambiosPendientes(false)
      toast.success("Cambios guardados correctamente")
    } catch (error: any) {
      console.error("Error guardando cambios:", error)
      toast.error(error.message || "Error al guardar cambios")
    } finally {
      setSaving(false)
    }
  }

  const cancelarCambios = () => {
    if (hayCambiosPendientes && !confirm("¿Descartar todos los cambios?")) return
    router.push("/panel/contabilidad/parametros/plantillas")
  }

  const getCuentaDisplayText = (cuentaId: number | null) => {
    if (!cuentaId) return "Seleccionar cuenta..."
    const cuenta = cuentas.find(c => c.id === cuentaId)
    return cuenta ? `${cuenta.cuenta} - ${cuenta.descripcion}` : "Cuenta no encontrada"
  }

  const seleccionarCuenta = (detalleId: string, cuentaId: number) => {
    actualizarDetalle(detalleId, "cuenta_id", cuentaId)
    setOpenCuentaCombobox({ ...openCuentaCombobox, [detalleId]: false })
  }

  const filtrarCuentas = (detalleId: string, busqueda: string) => {
    if (!busqueda.trim()) {
      setFilteredCuentas({ ...filteredCuentas, [detalleId]: cuentas.slice(0, 20) })
      return
    }

    const filtered = cuentas.filter(
      (c) =>
        c.cuenta.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.descripcion.toLowerCase().includes(busqueda.toLowerCase())
    )
    setFilteredCuentas({ ...filteredCuentas, [detalleId]: filtered.slice(0, 20) })
  }

  if (loading) {
    return (
      <div className="p-6">
        <p>Cargando...</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.push("/panel/contabilidad/parametros/plantillas")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Editar Plantilla</h1>
          <p className="text-gray-600 mt-2">
            Configura la plantilla y sus líneas contables
          </p>
        </div>
        {hayCambiosPendientes && (
          <div className="flex gap-2">
            <Button onClick={cancelarCambios} disabled={saving} variant="outline">
              Cancelar
            </Button>
            <Button onClick={guardarCambios} disabled={saving} className="bg-red-600 hover:bg-red-700 text-white">
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        )}
      </div>

      {/* Datos de la plantilla */}
      <Card>
        <CardHeader>
          <CardTitle>Datos de la Plantilla</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código *</Label>
              <Input
                id="codigo"
                value={formData.codigo}
                onChange={(e) => {
                  setFormData({ ...formData, codigo: e.target.value })
                  setHayCambiosPendientes(true)
                }}
                placeholder="Ej: COMPRA_CF"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => {
                  setFormData({ ...formData, nombre: e.target.value })
                  setHayCambiosPendientes(true)
                }}
                placeholder="Ej: Compra con Crédito Fiscal"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Input
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => {
                  setFormData({ ...formData, descripcion: e.target.value })
                  setHayCambiosPendientes(true)
                }}
                placeholder="Descripción opcional"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_comprobante">Tipo de Comprobante *</Label>
              <Select
                value={formData.tipo_comprobante}
                onValueChange={(value: any) => {
                  setFormData({ ...formData, tipo_comprobante: value })
                  setHayCambiosPendientes(true)
                }}
              >
                <SelectTrigger>
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
                onCheckedChange={(checked) => {
                  setFormData({ ...formData, activa: checked })
                  setHayCambiosPendientes(true)
                }}
                className="data-[state=checked]:bg-red-600"
              />
              <Label htmlFor="activa">Plantilla activa</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Líneas de la plantilla */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Líneas de la Plantilla</CardTitle>
          <Button onClick={agregarLinea} disabled={saving} size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Agregar Línea
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="w-16">Orden</TableHead>
                  <TableHead className="w-48">Cuenta</TableHead>
                  <TableHead className="w-32">Cuenta Fija</TableHead>
                  <TableHead className="w-32">Permite Auxiliar</TableHead>
                  <TableHead className="w-32">Porcentaje</TableHead>
                  <TableHead className="w-32">Lado</TableHead>
                  <TableHead className="w-32">Bloqueado</TableHead>
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
                      return (
                        <TableRow
                          key={detalle.id}
                          draggable
                          onDragStart={() => setDraggedIndex(index)}
                          onDragOver={(e) => e.preventDefault()}
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
                          
                          {/* Cuenta */}
                          <TableCell>
                            {detalle.cuenta_es_fija ? (
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
                                      placeholder="Buscar cuenta..."
                                      onValueChange={(value) => filtrarCuentas(detalle.id, value)}
                                    />
                                    <CommandList>
                                      <CommandEmpty>No se encontraron cuentas.</CommandEmpty>
                                      {(filteredCuentas[detalle.id] || cuentas.slice(0, 20)).map((cuenta) => (
                                        <CommandItem
                                          key={cuenta.id}
                                          value={cuenta.id.toString()}
                                          onSelect={() => seleccionarCuenta(detalle.id, cuenta.id)}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              detalle.cuenta_id === cuenta.id ? "opacity-100" : "opacity-0"
                                            )}
                                          />
                                          {cuenta.cuenta} - {cuenta.descripcion}
                                        </CommandItem>
                                      ))}
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </TableCell>
                          
                          {/* Cuenta Fija */}
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={detalle.cuenta_es_fija}
                                onCheckedChange={(checked) => {
                                  actualizarDetalle(detalle.id, "cuenta_es_fija", checked)
                                }}
                                className="data-[state=checked]:bg-red-600"
                              />
                              <Label className="text-sm">
                                {detalle.cuenta_es_fija ? "Sí" : "No"}
                              </Label>
                            </div>
                          </TableCell>
                          
                          {/* Permite Auxiliar */}
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={detalle.permite_auxiliar}
                                onCheckedChange={(checked) => actualizarDetalle(detalle.id, "permite_auxiliar", checked)}
                                className="data-[state=checked]:bg-red-600"
                              />
                              <Label className="text-sm">
                                {detalle.permite_auxiliar ? "Sí" : "No"}
                              </Label>
                            </div>
                          </TableCell>
                          
                          {/* Porcentaje */}
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
                          
                          {/* Lado */}
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
                          
                          {/* Bloqueado */}
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={detalle.bloqueado}
                                onCheckedChange={(checked) => actualizarDetalle(detalle.id, "bloqueado", checked)}
                                className="data-[state=checked]:bg-red-600"
                              />
                              <Label className="text-sm">
                                {detalle.bloqueado ? "Sí" : "No"}
                              </Label>
                            </div>
                          </TableCell>
                          
                          {/* Acciones */}
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => eliminarDetalle(detalle.id)}
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
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

