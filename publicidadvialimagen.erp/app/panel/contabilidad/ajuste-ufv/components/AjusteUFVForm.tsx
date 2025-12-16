"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Play, Calculator } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/fetcher"

interface AjusteUFVFormData {
  empresa: string
  clasificador: string
  gestion: number | undefined
  fecha_desde: string
  fecha_hasta: string
  glosa: string
  ufv_cotizacion_inicial: number | undefined
  ufv_cotizacion_final: number | undefined
  cotizacion_usd: number | undefined
}

export default function AjusteUFVForm() {
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  const [formData, setFormData] = useState<AjusteUFVFormData>({
    empresa: "",
    clasificador: "A.I.T.B.",
    gestion: new Date().getFullYear(),
    fecha_desde: "",
    fecha_hasta: "",
    glosa: "",
    ufv_cotizacion_inicial: undefined,
    ufv_cotizacion_final: undefined,
    cotizacion_usd: undefined,
  })

  useEffect(() => {
    fetchUser()
  }, [])

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
        }))
      }
    } catch (error) {
      console.error("Error fetching user:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validaciones
    if (!formData.gestion) {
      toast.error("La gestión es requerida")
      return
    }

    if (!formData.fecha_desde) {
      toast.error("La fecha desde es requerida")
      return
    }

    if (!formData.fecha_hasta) {
      toast.error("La fecha hasta es requerida")
      return
    }

    if (!formData.glosa || formData.glosa.trim() === "") {
      toast.error("La glosa del asiento es requerida")
      return
    }

    if (formData.ufv_cotizacion_inicial === undefined || formData.ufv_cotizacion_inicial <= 0) {
      toast.error("La cotización inicial UFV es requerida y debe ser mayor a 0")
      return
    }

    if (formData.ufv_cotizacion_final === undefined || formData.ufv_cotizacion_final <= 0) {
      toast.error("La cotización final UFV es requerida y debe ser mayor a 0")
      return
    }

    if (formData.cotizacion_usd === undefined || formData.cotizacion_usd <= 0) {
      toast.error("La cotización USD es requerida y debe ser mayor a 0")
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
        gestion: formData.gestion,
        fecha_desde: formData.fecha_desde,
        fecha_hasta: formData.fecha_hasta,
        glosa: formData.glosa.trim(),
        ufv_cotizacion_inicial: formData.ufv_cotizacion_inicial,
        ufv_cotizacion_final: formData.ufv_cotizacion_final,
        cotizacion_usd: formData.cotizacion_usd,
      }

      const response = await api("/api/contabilidad/ajuste-ufv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast.success("Ajuste UFV generado como borrador. Pendiente de cálculo.")
        // Limpiar formulario
        setFormData({
          empresa: formData.empresa,
          clasificador: formData.clasificador,
          gestion: formData.gestion,
          fecha_desde: "",
          fecha_hasta: "",
          glosa: "",
          ufv_cotizacion_inicial: undefined,
          ufv_cotizacion_final: undefined,
          cotizacion_usd: undefined,
        })
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al ejecutar el ajuste UFV")
      }
    } catch (error) {
      console.error("Error executing ajuste UFV:", error)
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ejecutar Ajuste UFV</CardTitle>
        <CardDescription>
          Complete los datos para generar el comprobante de ajuste por Unidad de Fomento a la Vivienda
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Primera fila: Empresa y Clasificador */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label htmlFor="clasificador">Clasificador</Label>
              <Input
                id="clasificador"
                value={formData.clasificador}
                disabled
                className="bg-gray-50"
              />
            </div>
          </div>

          {/* Segunda fila: Gestión, Fecha Desde, Fecha Hasta */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gestion">Gestión *</Label>
              <Input
                id="gestion"
                type="number"
                min="2000"
                max="2100"
                value={formData.gestion || ""}
                onChange={(e) =>
                  setFormData({ ...formData, gestion: parseInt(e.target.value) || undefined })
                }
                required
              />
            </div>
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

          {/* Tercera fila: Glosa */}
          <div className="space-y-2">
            <Label htmlFor="glosa">Glosa del Asiento *</Label>
            <Input
              id="glosa"
              value={formData.glosa}
              onChange={(e) => setFormData({ ...formData, glosa: e.target.value })}
              placeholder="Descripción del ajuste UFV"
              required
            />
          </div>

          {/* Cuarta fila: UFV Cotizaciones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ufv_cotizacion_inicial">UFV - Cotización Inicial *</Label>
              <Input
                id="ufv_cotizacion_inicial"
                type="number"
                step="0.000001"
                min="0"
                value={formData.ufv_cotizacion_inicial || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ufv_cotizacion_inicial: parseFloat(e.target.value) || undefined,
                  })
                }
                placeholder="0.000000"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ufv_cotizacion_final">UFV - Cotización Final *</Label>
              <Input
                id="ufv_cotizacion_final"
                type="number"
                step="0.000001"
                min="0"
                value={formData.ufv_cotizacion_final || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ufv_cotizacion_final: parseFloat(e.target.value) || undefined,
                  })
                }
                placeholder="0.000000"
                required
              />
            </div>
          </div>

          {/* Quinta fila: Cotización USD */}
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
                  <Calculator className="w-5 h-5 mr-2 animate-spin" />
                  Ejecutando...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Ejecutar Ajuste UFV
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}


