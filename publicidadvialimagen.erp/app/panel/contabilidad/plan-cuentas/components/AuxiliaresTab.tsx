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
import { Plus, Save, Trash2, ChevronsUpDown, Check } from "lucide-react"
import { toast } from "sonner"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import type { Auxiliar, TipoAuxiliar, Moneda } from "@/lib/types/contabilidad"
import { api } from "@/lib/fetcher"

/** Buscador tipo combobox para filtrar auxiliares (misma UX que en detalle del comprobante) */
function BuscadorAuxiliares({
  auxiliares,
  loading,
  value,
  onChange,
  onSelectAuxiliar,
  placeholder,
  className,
}: {
  auxiliares: Auxiliar[]
  loading: boolean
  value: string
  onChange: (v: string) => void
  onSelectAuxiliar?: (a: Auxiliar) => void
  placeholder?: string
  className?: string
}) {
  const search = (value || "").toLowerCase().trim()
  const options = !search
    ? auxiliares.slice(0, 50)
    : auxiliares
        .filter((a) => {
          const contacto = a.contactos
          const nombre = (contacto?.nombre ?? a.nombre ?? "").toLowerCase()
          const codigo = (a.codigo || "").toLowerCase()
          return nombre.includes(search) || codigo.includes(search)
        })
        .slice(0, 50)
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between text-sm", className)}
        >
          <span className={cn("truncate", !value && "text-muted-foreground")}>
            {value || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="end">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={placeholder}
            className="h-9 border-0 focus:ring-0"
            value={value}
            onValueChange={onChange}
          />
          <CommandList>
            <CommandEmpty>{loading ? "Cargando..." : "No se encontraron auxiliares."}</CommandEmpty>
            {options.length > 0 && (
              <CommandGroup>
                {options.map((auxiliar) => {
                  const contacto = auxiliar.contactos
                  const nombre = contacto?.nombre ?? auxiliar.nombre ?? auxiliar.nombre
                  return (
                    <CommandItem
                      key={auxiliar.id}
                      value={`${auxiliar.codigo} ${nombre}`}
                      onSelect={() => {
                        onSelectAuxiliar?.(auxiliar)
                        setOpen(false)
                      }}
                      className="cursor-pointer"
                    >
                      <Check className="mr-2 h-4 w-4 opacity-0" />
                      <span className="truncate">{nombre}</span>
                      <span className="text-gray-400 text-xs font-mono ml-auto">{auxiliar.codigo}</span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

const TIPOS_AUXILIAR: TipoAuxiliar[] = ["Cliente", "Proveedor", "Banco", "Caja", "Empleado", "Otro"]
// Monedas: BS es el valor por defecto en la BD, pero también puede haber USD
const MONEDAS: string[] = ["BS", "USD"]

export default function AuxiliaresTab() {
  const [auxiliares, setAuxiliares] = useState<Auxiliar[]>([])
  const [selectedAuxiliar, setSelectedAuxiliar] = useState<Auxiliar | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchAuxiliar, setSearchAuxiliar] = useState("")
  const [filterToAuxiliarId, setFilterToAuxiliarId] = useState<string | null>(null)
  const [filteredAuxiliaresForList, setFilteredAuxiliaresForList] = useState<Auxiliar[]>([])
  
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
    } else {
      resetForm()
    }
  }, [selectedAuxiliar])

  // Filtrar listado de auxiliares por búsqueda o por ítem seleccionado en el desplegable
  useEffect(() => {
    if (filterToAuxiliarId != null) {
      const one = auxiliares.filter((a) => a.id === filterToAuxiliarId)
      setFilteredAuxiliaresForList(one)
      return
    }
    if (!searchAuxiliar || searchAuxiliar.trim() === "") {
      setFilteredAuxiliaresForList(auxiliares)
      return
    }
    const search = searchAuxiliar.toLowerCase().trim()
    const filtered = auxiliares.filter((a) => {
      const contacto = a.contactos
      const nombre = (contacto?.nombre ?? a.nombre ?? "").toLowerCase()
      const codigo = (a.codigo || "").toLowerCase()
      return nombre.includes(search) || codigo.includes(search)
    })
    setFilteredAuxiliaresForList(filtered)
  }, [auxiliares, searchAuxiliar, filterToAuxiliarId])

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
      {/* Tabla de auxiliares con buscador */}
      <div className="flex gap-4 flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 min-w-0 overflow-hidden">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex-shrink-0 flex flex-row items-center gap-4 flex-wrap">
              <div>
                <CardTitle>Auxiliares</CardTitle>
                <CardDescription>Lista de auxiliares contables</CardDescription>
              </div>
              <BuscadorAuxiliares
                auxiliares={auxiliares}
                loading={loading}
                value={searchAuxiliar}
                onChange={(v) => {
                  setSearchAuxiliar(v)
                  setFilterToAuxiliarId(null)
                }}
                onSelectAuxiliar={(a) => {
                  setSelectedAuxiliar(a)
                  const nombre = a.contactos?.nombre ?? a.nombre ?? a.codigo ?? ""
                  setSearchAuxiliar(nombre)
                  setFilterToAuxiliarId(a.id)
                }}
                placeholder="Buscar por nombre o código..."
                className="w-[360px]"
              />
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
                      {filteredAuxiliaresForList.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                            No hay auxiliares registrados
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAuxiliaresForList.map((auxiliar) => {
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

