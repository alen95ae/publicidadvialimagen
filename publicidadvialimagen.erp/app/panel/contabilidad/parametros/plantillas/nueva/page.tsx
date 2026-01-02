"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/fetcher"

export default function NuevaPlantillaPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    codigo: "",
    nombre: "",
    descripcion: "",
    tipo_comprobante: "" as "" | "Diario" | "Ingreso" | "Egreso" | "Traspaso" | "Ctas por Pagar",
    activa: true,
  })

  const guardarPlantilla = async () => {
    // Validaciones
    if (!formData.codigo.trim()) {
      toast.error("El código es requerido")
      return
    }
    if (!formData.nombre.trim()) {
      toast.error("El nombre es requerido")
      return
    }
    if (!formData.tipo_comprobante) {
      toast.error("El tipo de comprobante es requerido")
      return
    }

    try {
      setSaving(true)
      const response = await api("/api/contabilidad/plantillas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success("Plantilla creada correctamente")
        // Redirigir a editar la plantilla recién creada
        router.push(`/panel/contabilidad/parametros/plantillas/editar/${data.data.id}`)
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al crear plantilla")
      }
    } catch (error) {
      console.error("Error guardando plantilla:", error)
      toast.error("Error de conexión")
    } finally {
      setSaving(false)
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Nueva Plantilla</h1>
          <p className="text-gray-600 mt-2">
            Crea una nueva plantilla de comprobante contable
          </p>
        </div>
      </div>

      {/* Formulario */}
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
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                placeholder="Ej: COMPRA_CF"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Compra con Crédito Fiscal"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Input
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción opcional"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_comprobante">Tipo de Comprobante *</Label>
              <Select
                value={formData.tipo_comprobante}
                onValueChange={(value: any) => setFormData({ ...formData, tipo_comprobante: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
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
                className="data-[state=checked]:bg-red-600"
              />
              <Label htmlFor="activa">Plantilla activa</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => router.push("/panel/contabilidad/parametros/plantillas")}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button onClick={guardarPlantilla} disabled={saving} className="bg-red-600 hover:bg-red-700 text-white">
              {saving ? "Creando..." : "Crear Plantilla"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

