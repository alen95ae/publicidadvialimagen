"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

/** Datos del Registro de Factura de Compra (LC) - flujo clásico */
export interface LcRegistroDatos {
  id?: string | null
  fecha: string
  cotizacion: number
  nro_dui: string
  nro_documento: string
  proveedor_id?: string | null
  proveedor_nombre: string
  proveedor_nit: string
  autorizacion: string
  codigo_control: string
  importe_no_sujeto_credito_fiscal: number
  descuentos_rebajas: number
  detalle_glosa: string
  monto: number
  credito_fiscal: number
}

const COTIZACION_FIJA = 6.96

const emptyLc: LcRegistroDatos = {
  fecha: new Date().toISOString().split("T")[0],
  cotizacion: COTIZACION_FIJA,
  nro_dui: "",
  nro_documento: "",
  proveedor_nombre: "",
  proveedor_nit: "",
  autorizacion: "",
  codigo_control: "",
  importe_no_sujeto_credito_fiscal: 0,
  descuentos_rebajas: 0,
  detalle_glosa: "",
  monto: 0,
  credito_fiscal: 0,
}

interface LcModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Datos iniciales (LC guardado o vacío) */
  initialData?: Partial<LcRegistroDatos> | null
  /** Fecha del comprobante (por defecto para Fecha) */
  fechaComprobante?: string
  /** Cotización del comprobante (readonly) */
  cotizacionComprobante?: number
  onSave: (data: LcRegistroDatos) => void
}

export function LcModal({
  open,
  onOpenChange,
  initialData,
  fechaComprobante,
  cotizacionComprobante = 6.96,
  onSave,
}: LcModalProps) {
  const [form, setForm] = useState<LcRegistroDatos>({ ...emptyLc })
  const [contactos, setContactos] = useState<any[]>([])
  const [filteredContactos, setFilteredContactos] = useState<any[]>([])
  const [openProveedorCombobox, setOpenProveedorCombobox] = useState(false)
  const [cargandoContactos, setCargandoContactos] = useState(false)

  const cargarContactos = useCallback(async () => {
    setCargandoContactos(true)
    try {
      const response = await fetch("/api/contactos")
      const data = await response.json()
      const list = data.data || []
      setContactos(list)
      setFilteredContactos(list.slice(0, 50))
    } catch (error) {
      console.error("Error cargando contactos:", error)
    } finally {
      setCargandoContactos(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      cargarContactos()
      const base = { ...emptyLc }
      base.fecha = fechaComprobante ?? new Date().toISOString().split("T")[0]
      base.cotizacion = cotizacionComprobante ?? COTIZACION_FIJA
      if (initialData) {
        if (initialData.id != null) base.id = initialData.id
        if (initialData.fecha) base.fecha = initialData.fecha
        if (initialData.cotizacion !== undefined) base.cotizacion = initialData.cotizacion
        if (initialData.nro_dui !== undefined) base.nro_dui = initialData.nro_dui
        if (initialData.nro_documento !== undefined) base.nro_documento = initialData.nro_documento
        if ((initialData as any).nro_dui_documento !== undefined) {
          base.nro_dui = (initialData as any).nro_dui_documento
          base.nro_documento = (initialData as any).nro_dui_documento
        }
        if (initialData.proveedor_nombre !== undefined) base.proveedor_nombre = initialData.proveedor_nombre
        if (initialData.proveedor_nit !== undefined) base.proveedor_nit = initialData.proveedor_nit
        if (initialData.autorizacion !== undefined) base.autorizacion = initialData.autorizacion
        if (initialData.codigo_control !== undefined) base.codigo_control = initialData.codigo_control
        if (initialData.importe_no_sujeto_credito_fiscal !== undefined)
          base.importe_no_sujeto_credito_fiscal = initialData.importe_no_sujeto_credito_fiscal
        if (initialData.descuentos_rebajas !== undefined) base.descuentos_rebajas = initialData.descuentos_rebajas
        if (initialData.detalle_glosa !== undefined) base.detalle_glosa = initialData.detalle_glosa
        if (initialData.monto !== undefined) base.monto = initialData.monto
        if (initialData.credito_fiscal !== undefined) base.credito_fiscal = initialData.credito_fiscal
      }
      setForm(base)
    }
  }, [open, initialData, fechaComprobante, cotizacionComprobante, cargarContactos])

  const filtrarProveedores = (value: string) => {
    if (!value) {
      setFilteredContactos(contactos.slice(0, 50))
      return
    }
    const v = value.toLowerCase()
    const filtered = contactos.filter(
      (c: any) =>
        (c.displayName || c.nombre || "").toLowerCase().includes(v) ||
        (c.legalName || "").toLowerCase().includes(v) ||
        (c.taxId || c.nit || "").toLowerCase().includes(v)
    )
    setFilteredContactos(filtered.slice(0, 50))
  }

  // Criterio operativo contable: Monto = importe bruto sujeto a IVA. IVA = 13% directo sobre monto.
  const PORCENTAJE_IVA = 0.13
  const calcularCreditoFiscal = (monto: number) => {
    if (!monto || monto <= 0) return 0
    return Math.round(monto * PORCENTAJE_IVA * 100) / 100
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const creditoFiscal = calcularCreditoFiscal(form.monto || 0)
    onSave({ ...form, credito_fiscal: creditoFiscal })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registro de Factura de Compra (LC)</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nº DUI y Nº Documento encima del todo */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="lc-nro-dui">Nº DUI</Label>
              <Input
                id="lc-nro-dui"
                value={form.nro_dui}
                onChange={(e) => setForm((f) => ({ ...f, nro_dui: e.target.value }))}
                placeholder="Nº DUI"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lc-nro-documento">Nº Documento</Label>
              <Input
                id="lc-nro-documento"
                value={form.nro_documento}
                onChange={(e) => setForm((f) => ({ ...f, nro_documento: e.target.value }))}
                placeholder="Nº Documento"
              />
            </div>
          </div>

          {/* Datos del documento */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Datos del documento</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="lc-fecha">Fecha</Label>
                <Input
                  id="lc-fecha"
                  type="date"
                  value={form.fecha}
                  onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lc-cotizacion">Cotización (tipo de cambio)</Label>
                <Input
                  id="lc-cotizacion"
                  type="number"
                  value={cotizacionComprobante ?? COTIZACION_FIJA}
                  disabled
                  readOnly
                  className="bg-gray-50 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Proveedor (desplegable como beneficiario) */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Proveedor</h4>
            <div className="space-y-2">
              <Label htmlFor="lc-proveedor-nombre">Nombre</Label>
              <Popover open={openProveedorCombobox} onOpenChange={setOpenProveedorCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-full justify-between",
                      !form.proveedor_nombre && "text-muted-foreground"
                    )}
                  >
                    <span className="truncate">
                      {form.proveedor_nombre || "Buscar proveedor..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command shouldFilter={false} className="overflow-visible">
                    <CommandInput
                      placeholder="Buscar por nombre o NIT..."
                      className="h-9 border-0 focus:ring-0"
                      onValueChange={filtrarProveedores}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {cargandoContactos ? "Cargando..." : "No se encontraron contactos."}
                      </CommandEmpty>
                      <CommandGroup>
                        {filteredContactos.map((contacto: any) => (
                          <CommandItem
                            key={contacto.id}
                            value={contacto.displayName || contacto.nombre}
                            onSelect={() => {
                              const nombre = contacto.displayName || contacto.nombre || contacto.legalName || ""
                              const nit = (contacto.taxId ?? contacto.nit ?? "") !== "" ? String(contacto.taxId ?? contacto.nit) : ""
                              setForm((f) => ({
                                ...f,
                                proveedor_id: contacto.id,
                                proveedor_nombre: nombre,
                                proveedor_nit: nit,
                              }))
                              setOpenProveedorCombobox(false)
                            }}
                            className="cursor-pointer"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                form.proveedor_id === contacto.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium">{contacto.displayName || contacto.nombre}</span>
                              {contacto.legalName && (
                                <span className="text-xs text-gray-500">{contacto.legalName}</span>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lc-proveedor-nit">NIT</Label>
              <Input
                id="lc-proveedor-nit"
                value={form.proveedor_nit}
                onChange={(e) => setForm((f) => ({ ...f, proveedor_nit: e.target.value }))}
                placeholder="NIT (se completa si el contacto lo tiene)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lc-autorizacion">Autorización</Label>
              <Input
                id="lc-autorizacion"
                value={form.autorizacion}
                onChange={(e) => setForm((f) => ({ ...f, autorizacion: e.target.value }))}
                placeholder="Nº de autorización"
              />
            </div>
          </div>

          {/* Datos fiscales */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Datos fiscales</h4>
            <div className="space-y-2">
              <Label htmlFor="lc-codigo-control">Código de Control</Label>
              <Input
                id="lc-codigo-control"
                value={form.codigo_control}
                onChange={(e) => setForm((f) => ({ ...f, codigo_control: e.target.value }))}
                placeholder="Código de control"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="lc-importe-no-sujeto">Importe no sujeto a crédito fiscal</Label>
                <Input
                  id="lc-importe-no-sujeto"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.importe_no_sujeto_credito_fiscal || ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      importe_no_sujeto_credito_fiscal: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lc-descuentos">Descuentos y rebajas</Label>
                <Input
                  id="lc-descuentos"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.descuentos_rebajas || ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, descuentos_rebajas: parseFloat(e.target.value) || 0 }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Detalle */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Detalle</h4>
            <div className="space-y-2">
              <Label htmlFor="lc-detalle-glosa">Glosa</Label>
              <Textarea
                id="lc-detalle-glosa"
                value={form.detalle_glosa}
                onChange={(e) => setForm((f) => ({ ...f, detalle_glosa: e.target.value }))}
                placeholder="Ej.: Factura por servicios de impresión, compra de materiales, etc."
                rows={3}
                className="resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="lc-monto">Monto</Label>
                <Input
                  id="lc-monto"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.monto || ""}
                  onChange={(e) => {
                    const monto = parseFloat(e.target.value) || 0
                    const creditoFiscal = calcularCreditoFiscal(monto)
                    setForm((f) => ({ ...f, monto, credito_fiscal: creditoFiscal }))
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lc-credito-fiscal">Crédito Fiscal (13%)</Label>
                <Input
                  id="lc-credito-fiscal"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.monto ? calcularCreditoFiscal(form.monto) : ""}
                  disabled
                  readOnly
                  className="bg-gray-50 font-mono"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-[#D54644] hover:bg-[#D54644]/90 text-white"
            >
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
