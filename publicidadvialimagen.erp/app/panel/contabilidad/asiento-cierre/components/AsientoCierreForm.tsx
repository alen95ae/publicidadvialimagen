"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Lock, Archive } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/fetcher"

interface AsientoCierreFormData {
  empresa: string
  regional: string
  sucursal: string
  clasificador: string
  fecha_desde: string
  fecha_hasta: string
  cotizacion_usd: number | undefined
  glosa: string
  numero_comprobante: string
}

export default function AsientoCierreForm() {
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  const [formData, setFormData] = useState<AsientoCierreFormData>({
    empresa: "",
    regional: "",
    sucursal: "",
    clasificador: "CONTABILIDAD OFICINA CENTRAL",
    fecha_desde: "",
    fecha_hasta: "",
    cotizacion_usd: undefined,
    glosa: "",
    numero_comprobante: "",
  })

  useEffect(() => {
    fetchUser()
  }, [])

  useEffect(() => {
    // Auto-generar glosa cuando cambia la fecha_hasta
    if (formData.fecha_hasta) {
      const fechaHasta = new Date(formData.fecha_hasta)
      const gestion = fechaHasta.getFullYear()
      setFormData((prev) => ({
        ...prev,
        glosa: `Asiento de cierre gestión ${gestion}`,
      }))
    }
  }, [formData.fecha_hasta])

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setFormData((prev) => ({
          ...prev,
          empresa: data.user?.empresa_nombre || "Empresa",
          regional: data.user?.regional || "",
          sucursal: data.user?.sucursal || "",
        }))
      }
    } catch (error) {
      console.error("Error fetching user:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validaciones
    if (!formData.fecha_desde) {
      toast.error("La fecha desde es requerida")
      return
    }

    if (!formData.fecha_hasta) {
      toast.error("La fecha hasta es requerida")
      return
    }

    if (formData.cotizacion_usd === undefined || formData.cotizacion_usd <= 0) {
      toast.error("La cotización USD es requerida y debe ser mayor a 0")
      return
    }

    if (!formData.glosa || formData.glosa.trim() === "") {
      toast.error("La glosa es requerida")
      return
    }

    // Validar que fecha_hasta sea mayor o igual a fecha_desde
    const fechaDesde = new Date(formData.fecha_desde)
    const fechaHasta = new Date(formData.fecha_hasta)
    if (fechaHasta < fechaDesde) {
      toast.error("La fecha hasta debe ser mayor o igual a la fecha desde")
      return
    }

    try {
      setLoading(true)

      const payload = {
        fecha_desde: formData.fecha_desde,
        fecha_hasta: formData.fecha_hasta,
        cotizacion_usd: formData.cotizacion_usd,
        glosa: formData.glosa.trim(),
      }

      const response = await api("/api/contabilidad/asiento-cierre", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success("Asiento de cierre generado en estado BORRADOR. Pendiente de revisión.")
        
        // Actualizar número de comprobante si viene en la respuesta
        if (data.data?.numero) {
          setFormData((prev) => ({
            ...prev,
            numero_comprobante: data.data.numero,
          }))
        }
        
        // Limpiar formulario (mantener campos readonly)
        setFormData((prev) => ({
          ...prev,
          fecha_desde: "",
          fecha_hasta: "",
          cotizacion_usd: undefined,
          glosa: "",
          numero_comprobante: "",
        }))
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al generar el asiento de cierre")
      }
    } catch (error) {
      console.error("Error executing asiento cierre:", error)
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generar Asiento de Cierre</CardTitle>
        <CardDescription>
          Complete los datos para generar el comprobante base del asiento de cierre contable
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Primera fila: Empresa, Regional, Sucursal */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="empresa">Empresa</Label>
              <Input
                id="empresa"
                value={formData.empresa}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="regional">Regional</Label>
              <Input
                id="regional"
                value={formData.regional}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sucursal">Sucursal</Label>
              <Input
                id="sucursal"
                value={formData.sucursal}
                disabled
                className="bg-gray-50"
              />
            </div>
          </div>

          {/* Segunda fila: Clasificador */}
          <div className="space-y-2">
            <Label htmlFor="clasificador">Clasificador</Label>
            <Input
              id="clasificador"
              value={formData.clasificador}
              disabled
              className="bg-gray-50"
            />
          </div>

          {/* Tercera fila: Fecha Desde, Fecha Hasta */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha_desde">Fecha Desde *</Label>
              <Input
                id="fecha_desde"
                type="date"
                value={formData.fecha_desde}
                onChange={(e) => setFormData({ ...formData, fecha_desde: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fecha_hasta">Fecha Hasta *</Label>
              <Input
                id="fecha_hasta"
                type="date"
                value={formData.fecha_hasta}
                onChange={(e) => setFormData({ ...formData, fecha_hasta: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Cuarta fila: Cotización USD */}
          <div className="space-y-2">
            <Label htmlFor="cotizacion_usd">Cotización USD *</Label>
            <Input
              id="cotizacion_usd"
              type="number"
              step="0.0001"
              min="0"
              value={formData.cotizacion_usd || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  cotizacion_usd: parseFloat(e.target.value) || undefined,
                })
              }
              placeholder="0.0000"
              required
            />
          </div>

          {/* Quinta fila: Glosa */}
          <div className="space-y-2">
            <Label htmlFor="glosa">Glosa *</Label>
            <Input
              id="glosa"
              value={formData.glosa}
              onChange={(e) => setFormData({ ...formData, glosa: e.target.value })}
              placeholder="Asiento de cierre gestión XXXX"
              required
            />
          </div>

          {/* Sexta fila: Número de Comprobante */}
          <div className="space-y-2">
            <Label htmlFor="numero_comprobante">Número de Comprobante</Label>
            <Input
              id="numero_comprobante"
              value={formData.numero_comprobante}
              disabled
              className="bg-gray-50 font-mono"
              placeholder="Se generará automáticamente"
            />
          </div>

          {/* Botón de ejecución */}
          <div className="flex justify-end pt-4 border-t">
            <Button
              type="submit"
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
              size="lg"
            >
              {loading ? (
                <>
                  <Archive className="w-5 h-5 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5 mr-2" />
                  Generar Asiento de Cierre
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}



