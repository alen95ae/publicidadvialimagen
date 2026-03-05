"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/fetcher"
import type { Divisa } from "@/lib/types/contabilidad"

interface DivisaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  divisa: Divisa | null
  onSaved: () => void
}

export default function DivisaModal({ open, onOpenChange, divisa, onSaved }: DivisaModalProps) {
  const isEditing = !!divisa?.id
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    codigo: "",
    nombre: "",
    simbolo: "",
    tipo_cambio: "1.0000",
    es_base: false,
    estado: "ACTIVO",
  })

  useEffect(() => {
    if (open) {
      if (divisa) {
        setFormData({
          codigo: divisa.codigo,
          nombre: divisa.nombre,
          simbolo: divisa.simbolo,
          tipo_cambio: Number(divisa.tipo_cambio).toFixed(4),
          es_base: divisa.es_base,
          estado: divisa.estado || "ACTIVO",
        })
      } else {
        setFormData({
          codigo: "",
          nombre: "",
          simbolo: "",
          tipo_cambio: "1.0000",
          es_base: false,
          estado: "ACTIVO",
        })
      }
    }
  }, [open, divisa])

  const handleSave = async () => {
    if (!formData.codigo.trim() || !formData.nombre.trim() || !formData.simbolo.trim()) {
      toast.error("Código, nombre y símbolo son requeridos")
      return
    }

    const tc = Number(formData.tipo_cambio)
    if (Number.isNaN(tc) || tc < 0) {
      toast.error("Tipo de cambio debe ser un número válido (>= 0)")
      return
    }

    try {
      setSaving(true)

      if (isEditing) {
        const res = await api(`/api/contabilidad/divisas/${divisa!.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: formData.nombre.trim(),
            simbolo: formData.simbolo.trim(),
            tipo_cambio: tc,
            es_base: formData.es_base,
            estado: formData.estado,
          }),
        })
        if (res.ok) {
          toast.success("Divisa actualizada correctamente")
          onSaved()
          onOpenChange(false)
        } else {
          const err = await res.json()
          toast.error(err.error || "Error al actualizar la divisa")
        }
      } else {
        const res = await api("/api/contabilidad/divisas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            codigo: formData.codigo.trim().toUpperCase(),
            nombre: formData.nombre.trim(),
            simbolo: formData.simbolo.trim(),
            tipo_cambio: tc,
            es_base: formData.es_base,
            estado: formData.estado,
          }),
        })
        if (res.ok) {
          toast.success("Divisa creada correctamente")
          onSaved()
          onOpenChange(false)
        } else {
          const err = await res.json()
          toast.error(err.error || "Error al crear la divisa")
        }
      }
    } catch (error) {
      console.error("Error saving divisa:", error)
      toast.error("Error de conexión")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? `Editar Divisa — ${divisa?.codigo}` : "Nueva Divisa"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifique los campos y pulse Guardar"
              : "Complete los campos para crear una nueva divisa"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dlg-codigo">Código *</Label>
              <Input
                id="dlg-codigo"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                disabled={isEditing}
                className="font-mono uppercase"
                placeholder="USD"
                maxLength={10}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dlg-simbolo">Símbolo *</Label>
              <Input
                id="dlg-simbolo"
                value={formData.simbolo}
                onChange={(e) => setFormData({ ...formData, simbolo: e.target.value })}
                className="font-mono"
                placeholder="$"
                maxLength={5}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dlg-nombre">Nombre *</Label>
            <Input
              id="dlg-nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Dólares Americanos"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dlg-tipo-cambio">Tipo de Cambio</Label>
              <Input
                id="dlg-tipo-cambio"
                type="number"
                min={0}
                step={0.0001}
                value={formData.tipo_cambio}
                onChange={(e) => setFormData({ ...formData, tipo_cambio: e.target.value })}
                placeholder="6.9600"
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dlg-estado">Estado</Label>
              <Select
                value={formData.estado}
                onValueChange={(value) => setFormData({ ...formData, estado: value })}
              >
                <SelectTrigger id="dlg-estado">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVO">ACTIVO</SelectItem>
                  <SelectItem value="INACTIVO">INACTIVO</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-1">
            <Switch
              id="dlg-es-base"
              checked={formData.es_base}
              onCheckedChange={(checked) => setFormData({ ...formData, es_base: checked })}
            />
            <Label htmlFor="dlg-es-base" className="font-normal cursor-pointer">
              Es moneda base (tipo de cambio = 1)
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
