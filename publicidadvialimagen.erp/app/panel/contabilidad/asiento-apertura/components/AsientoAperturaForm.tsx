"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Unlock, FileText } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/fetcher"

interface AsientoAperturaFormData {
  gestion: number | undefined
  cotizacion: number | undefined
  fecha: string
  glosa: string
}

export default function AsientoAperturaForm() {
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  const [formData, setFormData] = useState<AsientoAperturaFormData>({
    gestion: new Date().getFullYear(),
    cotizacion: undefined,
    fecha: new Date().toISOString().split("T")[0],
    glosa: "",
  })

  useEffect(() => {
    fetchUser()
  }, [])

  useEffect(() => {
    // Auto-generar glosa cuando cambia la gestión
    if (formData.gestion) {
      setFormData((prev) => ({
        ...prev,
        glosa: `Asiento de apertura gestión ${formData.gestion}`,
      }))
    }
  }, [formData.gestion])

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
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

    if (formData.cotizacion === undefined || formData.cotizacion <= 0) {
      toast.error("La cotización es requerida y debe ser mayor a 0")
      return
    }

    if (!formData.fecha) {
      toast.error("La fecha es requerida")
      return
    }

    if (!formData.glosa || formData.glosa.trim() === "") {
      toast.error("La glosa es requerida")
      return
    }

    try {
      setLoading(true)

      const payload = {
        gestion: formData.gestion,
        cotizacion: formData.cotizacion,
        fecha: formData.fecha,
        glosa: formData.glosa.trim(),
      }

      const response = await api("/api/contabilidad/asiento-apertura", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast.success("Asiento de apertura creado en estado BORRADOR")
        
        // Limpiar formulario (mantener gestión)
        setFormData((prev) => ({
          ...prev,
          cotizacion: undefined,
          fecha: new Date().toISOString().split("T")[0],
          glosa: `Asiento de apertura gestión ${prev.gestion}`,
        }))
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al generar el asiento de apertura")
      }
    } catch (error) {
      console.error("Error executing asiento apertura:", error)
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generar Asiento de Apertura</CardTitle>
        <CardDescription>
          Complete los datos para generar el comprobante base del asiento de apertura contable.
          Solo se puede crear un asiento de apertura por gestión.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Primera fila: Gestión */}
          <div className="space-y-2">
            <Label htmlFor="gestion">Gestión *</Label>
            <Input
              id="gestion"
              type="number"
              min="2000"
              max="2100"
              value={formData.gestion || ""}
              onChange={(e) => {
                const gestion = parseInt(e.target.value) || undefined
                setFormData({
                  ...formData,
                  gestion,
                  glosa: gestion ? `Asiento de apertura gestión ${gestion}` : "",
                })
              }}
              required
            />
          </div>

          {/* Segunda fila: Cotización y Fecha */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cotizacion">Cotización USD *</Label>
              <Input
                id="cotizacion"
                type="number"
                step="0.0001"
                min="0"
                value={formData.cotizacion || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cotizacion: parseFloat(e.target.value) || undefined,
                  })
                }
                placeholder="0.0000"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha *</Label>
              <Input
                id="fecha"
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Tercera fila: Glosa */}
          <div className="space-y-2">
            <Label htmlFor="glosa">Glosa *</Label>
            <Input
              id="glosa"
              value={formData.glosa}
              onChange={(e) => setFormData({ ...formData, glosa: e.target.value })}
              placeholder="Asiento de apertura gestión XXXX"
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
                  <FileText className="w-5 h-5 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Unlock className="w-5 h-5 mr-2" />
                  Generar Asiento de Apertura
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}








