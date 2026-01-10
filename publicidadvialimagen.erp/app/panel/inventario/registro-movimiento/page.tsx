"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, ArrowLeft, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface MovimientoLinea {
  id: string
  tipoItem: "insumo" | "consumible" | ""
  itemId: string
  itemNombre: string
  itemCodigo: string
  itemFormatos: Array<{ formato: string; cantidad: number; unidad_medida: string }>
  opcion: "UdM" | "formato" | ""
  formatoId: string | null
  formatoTexto: string
  cantidadFormato: number
  cantidadUdM: number
  unidadMedida: string
  impacto: "+" | "-"
}

interface Formato {
  id: string
  formato: string
  cantidad: number
  unidad_medida: string
}

export default function RegistroMovimientoPage() {
  const router = useRouter()
  const [tipoMovimiento, setTipoMovimiento] = useState<string>("")
  const [fecha, setFecha] = useState<string>(new Date().toISOString().split('T')[0])
  const [sucursal, setSucursal] = useState<string>("La Paz")
  const [referencia, setReferencia] = useState<string>("")
  const [observaciones, setObservaciones] = useState<string>("")
  const [lineas, setLineas] = useState<MovimientoLinea[]>([])
  const [insumos, setInsumos] = useState<any[]>([])
  const [consumibles, setConsumibles] = useState<any[]>([])
  const [formatos, setFormatos] = useState<Formato[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [openCombobox, setOpenCombobox] = useState<Record<string, boolean>>({})
  const [filteredItems, setFilteredItems] = useState<Record<string, any[]>>({})

  // Cargar código de referencia por defecto
  useEffect(() => {
    const cargarCodigoReferencia = async () => {
      try {
        const response = await fetch('/api/inventario/registro-movimiento/generar-codigo')
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.codigo) {
            setReferencia(data.codigo)
          }
        }
      } catch (error) {
        console.error('Error cargando código de referencia:', error)
      }
    }
    cargarCodigoReferencia()
  }, [])

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true)
        
        // Cargar recursos (solo los que tienen categoría "Insumos")
        const recursosRes = await fetch('/api/recursos?limit=1000')
        if (recursosRes.ok) {
          const recursosData = await recursosRes.json()
          const insumosData = (recursosData.data || []).filter((r: any) => 
            r.categoria && r.categoria.toLowerCase() === "insumos"
          )
          setInsumos(insumosData)
        }
        
        // Cargar consumibles
        const consumiblesRes = await fetch('/api/consumibles?limit=1000')
        if (consumiblesRes.ok) {
          const consumiblesData = await consumiblesRes.json()
          setConsumibles(consumiblesData.data || [])
        }
        
        // Cargar formatos
        const formatosRes = await fetch('/api/formatos')
        if (formatosRes.ok) {
          const formatosData = await formatosRes.json()
          setFormatos(formatosData.data || [])
        }
      } catch (error) {
        console.error('Error cargando datos:', error)
        toast.error('Error al cargar los datos')
      } finally {
        setLoading(false)
      }
    }
    
    cargarDatos()
  }, [])

  // Determinar impacto según tipo de movimiento
  const getImpacto = (tipo: string): "+" | "-" => {
    if (tipo === "Compra" || tipo === "Ajuste") return "+"
    return "-"
  }

  // Actualizar impacto de todas las líneas cuando cambia el tipo de movimiento
  useEffect(() => {
    if (tipoMovimiento) {
      const impacto = getImpacto(tipoMovimiento)
      setLineas(prev => prev.map(linea => ({ ...linea, impacto })))
    }
  }, [tipoMovimiento])

  const agregarLinea = () => {
    const nuevaLinea: MovimientoLinea = {
      id: `linea-${Date.now()}-${Math.random()}`,
      tipoItem: "",
      itemId: "",
      itemNombre: "",
      itemCodigo: "",
      itemFormatos: [],
      opcion: "",
      formatoId: null,
      formatoTexto: "",
      cantidadFormato: 0,
      cantidadUdM: 0,
      unidadMedida: "",
      impacto: tipoMovimiento ? getImpacto(tipoMovimiento) : "+"
    }
    setLineas([...lineas, nuevaLinea])
  }

  const eliminarLinea = (id: string) => {
    setLineas(lineas.filter(l => l.id !== id))
  }

  const filtrarItems = (lineaId: string, searchValue: string) => {
    const tipo = lineas.find(l => l.id === lineaId)?.tipoItem
    if (!tipo) return
    
    const items = tipo === "insumo" ? insumos : consumibles
    const searchLower = searchValue.toLowerCase()
    
    const filtered = items.filter((item: any) => {
      const codigo = (item.codigo || "").toLowerCase()
      const nombre = (item.nombre || "").toLowerCase()
      return codigo.includes(searchLower) || nombre.includes(searchLower)
    }).slice(0, 50)
    
    setFilteredItems(prev => ({ ...prev, [lineaId]: filtered }))
  }

  const seleccionarItem = (lineaId: string, item: any) => {
    // Parsear formatos del ítem
    let itemFormatos: Array<{ formato: string; cantidad: number; unidad_medida: string }> = []
    if (item.formato) {
      if (Array.isArray(item.formato)) {
        itemFormatos = item.formato
      } else if (typeof item.formato === 'string') {
        try {
          const parsed = JSON.parse(item.formato)
          itemFormatos = Array.isArray(parsed) ? parsed : (parsed ? [parsed] : [])
        } catch {
          try {
            const obj = typeof item.formato === 'object' ? item.formato : JSON.parse(item.formato)
            itemFormatos = obj ? [obj] : []
          } catch {
            itemFormatos = []
          }
        }
      } else if (typeof item.formato === 'object') {
        itemFormatos = [item.formato]
      }
    }
    
    setLineas(lineas.map(linea => {
      if (linea.id === lineaId) {
        return {
          ...linea,
          itemId: item.id,
          itemNombre: item.nombre || "",
          itemCodigo: item.codigo || "",
          itemFormatos: itemFormatos,
          unidadMedida: item.unidad_medida || "",
          formatoId: null,
          formatoTexto: "",
          cantidadFormato: 0,
          cantidadUdM: 0
        }
      }
      return linea
    }))
    setOpenCombobox(prev => ({ ...prev, [lineaId]: false }))
  }

  const actualizarLinea = (id: string, campo: keyof MovimientoLinea, valor: any) => {
    setLineas(lineas.map(linea => {
      if (linea.id === id) {
        const actualizada = { ...linea, [campo]: valor }
        
        // Si cambia el tipo de item, limpiar item seleccionado
        if (campo === "tipoItem") {
          actualizada.itemId = ""
          actualizada.itemNombre = ""
          actualizada.itemCodigo = ""
          actualizada.itemFormatos = []
          actualizada.unidadMedida = ""
          actualizada.formatoId = null
          actualizada.formatoTexto = ""
          actualizada.opcion = ""
          actualizada.cantidadFormato = 0
          actualizada.cantidadUdM = 0
        }
        
        // Si cambia la opción, resetear cálculos
        if (campo === "opcion") {
          actualizada.cantidadFormato = 0
          actualizada.cantidadUdM = 0
          if (valor === "UdM") {
            actualizada.formatoId = null
            actualizada.formatoTexto = ""
          }
        }
        
        // Si cambia el formato, actualizar texto y recalcular (usar formatos del ítem)
        if (campo === "formatoId") {
          if (valor === "__sin_formato__" || valor === "") {
            actualizada.formatoId = null
            actualizada.formatoTexto = ""
            actualizada.cantidadUdM = actualizada.cantidadFormato
          } else {
            // Buscar en los formatos del ítem
            const match = typeof valor === 'string' ? valor.match(/item_(\d+)_idx_(\d+)/) : null
            if (match) {
              const idx = parseInt(match[2])
              const formatoItem = actualizada.itemFormatos[idx]
              if (formatoItem) {
                actualizada.formatoId = valor
                actualizada.formatoTexto = formatoItem.formato === "Unidad suelta" 
                  ? "Unidad suelta"
                  : `${formatoItem.formato} ${formatoItem.cantidad} ${formatoItem.unidad_medida}`
                // Recalcular cantidad UdM
                if (formatoItem.formato === "Unidad suelta") {
                  actualizada.cantidadUdM = actualizada.cantidadFormato
                } else {
                  actualizada.cantidadUdM = actualizada.cantidadFormato * formatoItem.cantidad
                }
              }
            }
          }
        }
        
        // Si cambia cantidad formato, recalcular cantidad UdM
        if (campo === "cantidadFormato") {
          const cantidadFormato = parseFloat(valor) || 0
          actualizada.cantidadFormato = cantidadFormato
          if (actualizada.formatoId) {
            // Buscar en formatos del ítem
            const match = typeof actualizada.formatoId === 'string' ? actualizada.formatoId.match(/item_(\d+)_idx_(\d+)/) : null
            if (match) {
              const idx = parseInt(match[2])
              const formatoItem = actualizada.itemFormatos[idx]
              if (formatoItem) {
                if (formatoItem.formato === "Unidad suelta") {
                  actualizada.cantidadUdM = cantidadFormato
                } else {
                  actualizada.cantidadUdM = cantidadFormato * formatoItem.cantidad
                }
              } else {
                actualizada.cantidadUdM = cantidadFormato
              }
            } else {
              actualizada.cantidadUdM = cantidadFormato
            }
          } else {
            actualizada.cantidadUdM = cantidadFormato
          }
        }
        
        // Si cambia cantidad UdM (solo cuando opción es UdM)
        if (campo === "cantidadUdM" && actualizada.opcion === "UdM") {
          actualizada.cantidadUdM = parseFloat(valor) || 0
        }
        
        return actualizada
      }
      return linea
    }))
  }

  const validar = (): boolean => {
    if (!tipoMovimiento) {
      toast.error("El tipo de movimiento es obligatorio")
      return false
    }
    
    if (!sucursal) {
      toast.error("La sucursal es obligatoria")
      return false
    }
    
    if (lineas.length === 0) {
      toast.error("Debe agregar al menos una línea")
      return false
    }
    
    for (const linea of lineas) {
      if (!linea.tipoItem) {
        toast.error("El tipo de ítem es obligatorio en todas las líneas")
        return false
      }
      
      if (!linea.itemId) {
        toast.error("El ítem es obligatorio en todas las líneas")
        return false
      }
      
      if (!linea.opcion) {
        toast.error("La opción es obligatoria en todas las líneas")
        return false
      }
      
      if (linea.opcion === "formato") {
        if (!linea.formatoId) {
          toast.error("El formato es obligatorio cuando se selecciona la opción 'Formato'")
          return false
        }
        if (!linea.cantidadFormato || linea.cantidadFormato <= 0) {
          toast.error("La cantidad formato debe ser mayor a 0")
          return false
        }
      } else if (linea.opcion === "UdM") {
        if (!linea.cantidadUdM || linea.cantidadUdM <= 0) {
          toast.error("La cantidad UdM debe ser mayor a 0")
          return false
        }
      }
    }
    
    return true
  }

  const registrarMovimiento = async () => {
    if (!validar()) return
    
    try {
      setSaving(true)
      
      // Construir fecha con hora exacta del momento de guardar (ISO format)
      const ahora = new Date()
      const fechaConHora = fecha 
        ? `${fecha}T${ahora.toISOString().split('T')[1]}`
        : ahora.toISOString()
      
      const payload = {
        tipoMovimiento,
        fecha: fechaConHora,
        referencia: referencia || null,
        observaciones: observaciones || null,
        sucursal: sucursal,
        lineas: lineas.map(linea => ({
          tipoItem: linea.tipoItem,
          itemId: linea.itemId,
          itemNombre: linea.itemNombre,
          itemCodigo: linea.itemCodigo,
          opcion: linea.opcion,
          formatoId: linea.formatoId,
          formatoTexto: linea.formatoTexto || null,
          cantidadFormato: linea.opcion === "formato" ? linea.cantidadFormato : null,
          cantidadUdM: linea.cantidadUdM,
          unidadMedida: linea.unidadMedida,
          impacto: linea.impacto
        }))
      }
      
      const response = await fetch('/api/inventario/registro-movimiento', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al registrar movimiento')
      }

      toast.success(`Movimiento registrado correctamente${data.referencia_codigo ? ` (${data.referencia_codigo})` : ''}`)
      
      // Limpiar formulario y cargar nuevo código de referencia
      setTipoMovimiento("")
      setFecha(new Date().toISOString().split('T')[0])
      setObservaciones("")
      setLineas([])
      
      // Cargar nuevo código de referencia
      try {
        const response = await fetch('/api/inventario/registro-movimiento/generar-codigo')
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.codigo) {
            setReferencia(data.codigo)
          }
        }
      } catch (error) {
        console.error('Error cargando nuevo código de referencia:', error)
      }
      
    } catch (error) {
      console.error('Error registrando movimiento:', error)
      toast.error(error instanceof Error ? error.message : 'Error al registrar movimiento')
    } finally {
      setSaving(false)
    }
  }

  const itemsDisponibles = (tipo: "insumo" | "consumible" | "") => {
    if (tipo === "insumo") return insumos
    if (tipo === "consumible") return consumibles
    return []
  }

  const getItemDisplay = (linea: MovimientoLinea) => {
    if (!linea.itemId) return "Seleccionar ítem..."
    return `${linea.itemCodigo} - ${linea.itemNombre}`
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Registro de Movimiento</h1>
        <p className="text-gray-600 mt-2">Registrar movimientos de stock</p>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Cargando...</div>
      ) : (
        <>
          {/* Cabecera */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Información del Movimiento</CardTitle>
                <Button
                  onClick={registrarMovimiento}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  disabled={saving}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Registrando...' : 'Registrar movimiento'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipoMovimiento">
                    Tipo de movimiento <span className="text-red-500">*</span>
                  </Label>
                  <Select value={tipoMovimiento} onValueChange={setTipoMovimiento}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Compra">Compra</SelectItem>
                      <SelectItem value="Consumo interno">Consumo interno</SelectItem>
                      <SelectItem value="Desecho / Pérdida">Desecho / Pérdida</SelectItem>
                      <SelectItem value="Ajuste">Ajuste</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sucursal">
                    Sucursal <span className="text-red-500">*</span>
                  </Label>
                  <Select value={sucursal} onValueChange={setSucursal}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar sucursal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="La Paz">La Paz</SelectItem>
                      <SelectItem value="Santa Cruz">Santa Cruz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 w-auto">
                  <Label htmlFor="fecha">Fecha</Label>
                  <Input
                    id="fecha"
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-auto"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="referencia">Referencia</Label>
                  <span className="text-sm text-gray-500">(Número de factura, orden, etc.)</span>
                </div>
                <Input
                  id="referencia"
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                  className="w-auto max-w-xs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea
                  id="observaciones"
                  placeholder="Notas adicionales..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Líneas de movimiento */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Líneas de Movimiento</CardTitle>
                <Button onClick={agregarLinea} className="bg-red-600 hover:bg-red-700 text-white" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Añadir línea
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {lineas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay líneas agregadas. Haz clic en "Añadir línea" para comenzar.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px]">Tipo</TableHead>
                        <TableHead>Ítem</TableHead>
                        <TableHead className="w-[120px]">Opción</TableHead>
                        <TableHead className="w-[120px]">Cant. Formato</TableHead>
                        <TableHead className="w-[180px]">Formato</TableHead>
                        <TableHead className="w-[120px]">Cantidad UdM</TableHead>
                        <TableHead className="w-[120px]">Unidad</TableHead>
                        <TableHead className="w-[80px]">Impacto</TableHead>
                        <TableHead className="w-[80px]">Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lineas.map((linea) => (
                        <TableRow key={linea.id}>
                          <TableCell>
                            <Select
                              value={linea.tipoItem}
                              onValueChange={(value) => actualizarLinea(linea.id, "tipoItem", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Tipo" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="insumo">Insumo</SelectItem>
                                <SelectItem value="consumible">Consumible</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Popover
                              open={openCombobox[linea.id] || false}
                              onOpenChange={(open) => {
                                setOpenCombobox(prev => ({ ...prev, [linea.id]: open }))
                                if (open && linea.tipoItem) {
                                  const items = itemsDisponibles(linea.tipoItem)
                                  setFilteredItems(prev => ({ ...prev, [linea.id]: items.slice(0, 50) }))
                                }
                              }}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className={cn(
                                    "w-full justify-between",
                                    !linea.itemId && "text-muted-foreground"
                                  )}
                                  disabled={!linea.tipoItem}
                                >
                                  <span className="truncate">
                                    {getItemDisplay(linea)}
                                  </span>
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[400px] p-0" align="start">
                                <Command shouldFilter={false}>
                                  <CommandInput
                                    placeholder="Buscar por código o nombre..."
                                    onValueChange={(value) => filtrarItems(linea.id, value)}
                                  />
                                  <CommandList>
                                    <CommandEmpty>
                                      No se encontraron resultados.
                                    </CommandEmpty>
                                    <CommandGroup>
                                      {(filteredItems[linea.id] || []).map((item: any) => (
                                        <CommandItem
                                          key={item.id}
                                          value={`${item.codigo} ${item.nombre}`}
                                          onSelect={() => seleccionarItem(linea.id, item)}
                                          className="cursor-pointer"
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              linea.itemId === item.id ? "opacity-100" : "opacity-0"
                                            )}
                                          />
                                          <span className="truncate">
                                            [{item.codigo}] {item.nombre}
                                          </span>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={linea.opcion}
                              onValueChange={(value) => actualizarLinea(linea.id, "opcion", value)}
                              disabled={!linea.itemId}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Opción" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="UdM">UdM</SelectItem>
                                <SelectItem value="formato">Formato</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            {linea.opcion === "formato" ? (
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={linea.cantidadFormato || ""}
                                onChange={(e) => actualizarLinea(linea.id, "cantidadFormato", parseFloat(e.target.value) || 0)}
                                placeholder="0"
                                disabled={!linea.opcion || linea.opcion !== "formato"}
                              />
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {linea.opcion === "formato" ? (
                              <Select
                                value={linea.formatoId || "__sin_formato__"}
                                onValueChange={(value) => actualizarLinea(linea.id, "formatoId", value)}
                                disabled={!linea.itemId || !linea.itemFormatos || linea.itemFormatos.length === 0}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Formato" />
                                </SelectTrigger>
                                <SelectContent>
                                  {linea.itemFormatos && linea.itemFormatos.length > 0 ? (
                                    linea.itemFormatos.map((formato, idx) => {
                                      const displayText = formato.formato === "Unidad suelta"
                                        ? "Unidad suelta"
                                        : `${formato.formato} ${formato.cantidad} ${formato.unidad_medida}`
                                      return (
                                        <SelectItem key={`item_${idx}_idx_${idx}`} value={`item_${idx}_idx_${idx}`}>
                                          {displayText}
                                        </SelectItem>
                                      )
                                    })
                                  ) : (
                                    <SelectItem value="__sin_formato__" disabled>Sin formatos disponibles</SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {linea.opcion === "UdM" ? (
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={linea.cantidadUdM || ""}
                                onChange={(e) => actualizarLinea(linea.id, "cantidadUdM", parseFloat(e.target.value) || 0)}
                                placeholder="0"
                              />
                            ) : (
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={linea.cantidadUdM || ""}
                                readOnly
                                className="bg-gray-50"
                                placeholder="0"
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <Input
                              value={linea.unidadMedida}
                              readOnly
                              className="bg-gray-50"
                              placeholder="Unidad"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center justify-center gap-1">
                              <span className={`text-lg font-bold ${
                                linea.impacto === "+" ? "text-green-600" : "text-red-600"
                              }`}>
                                {linea.impacto}
                              </span>
                              <span className="text-xs text-gray-500">
                                {linea.impacto === "+" ? "Suma" : "Resta"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => eliminarLinea(linea.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
