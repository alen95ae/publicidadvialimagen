"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calculator, TrendingUp } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/fetcher"
import type { Cuenta } from "@/lib/types/contabilidad"

const MESES = [
  { value: 1, label: "Enero" },
  { value: 2, label: "Febrero" },
  { value: 3, label: "Marzo" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Mayo" },
  { value: 6, label: "Junio" },
  { value: 7, label: "Julio" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Septiembre" },
  { value: 10, label: "Octubre" },
  { value: 11, label: "Noviembre" },
  { value: 12, label: "Diciembre" },
]

interface AITBFormData {
  cuenta_banco: string
  periodo: number | undefined
  gestion: number | undefined
  fecha_desde: string
  fecha_hasta: string
  tipo_cambio: number | undefined
}

export default function AITBForm() {
  const [loading, setLoading] = useState(false)
  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  const [cuentaSearch, setCuentaSearch] = useState("")
  const [cuentasFiltradas, setCuentasFiltradas] = useState<Cuenta[]>([])

  const [formData, setFormData] = useState<AITBFormData>({
    cuenta_banco: "",
    periodo: new Date().getMonth() + 1,
    gestion: new Date().getFullYear(),
    fecha_desde: "",
    fecha_hasta: "",
    tipo_cambio: undefined,
  })

  useEffect(() => {
    fetchCuentas()
  }, [])

  useEffect(() => {
    // Filtrar cuentas para autocomplete
    if (cuentaSearch.trim() === "") {
      setCuentasFiltradas([])
    } else {
      const search = cuentaSearch.toLowerCase()
      const filtradas = cuentas.filter(
        (c) =>
          c.cuenta.toLowerCase().includes(search) ||
          c.descripcion.toLowerCase().includes(search)
      )
      setCuentasFiltradas(filtradas.slice(0, 10)) // Limitar a 10 resultados
    }
  }, [cuentaSearch, cuentas])

  const fetchCuentas = async () => {
    try {
      const response = await api("/api/contabilidad/cuentas?limit=10000")
      if (response.ok) {
        const data = await response.json()
        setCuentas(data.data || [])
      }
    } catch (error) {
      console.error("Error fetching cuentas:", error)
    }
  }

  const handleSelectCuenta = (cuenta: Cuenta) => {
    setFormData({ ...formData, cuenta_banco: cuenta.cuenta })
    setCuentaSearch(`${cuenta.cuenta} - ${cuenta.descripcion}`)
    setCuentasFiltradas([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validaciones
    if (!formData.cuenta_banco || formData.cuenta_banco.trim() === "") {
      toast.error("La cuenta banco es requerida")
      return
    }

    if (!formData.periodo) {
      toast.error("El periodo es requerido")
      return
    }

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

    if (formData.tipo_cambio === undefined || formData.tipo_cambio <= 0) {
      toast.error("El tipo de cambio es requerido y debe ser mayor a 0")
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
        cuenta_banco: formData.cuenta_banco,
        periodo: formData.periodo,
        gestion: formData.gestion,
        fecha_desde: formData.fecha_desde,
        fecha_hasta: formData.fecha_hasta,
        tipo_cambio: formData.tipo_cambio,
      }

      const response = await api("/api/contabilidad/aitb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast.success("Proceso AITB creado en estado BORRADOR")
        
        // Limpiar formulario (mantener gestión y periodo)
        setFormData((prev) => ({
          ...prev,
          cuenta_banco: "",
          fecha_desde: "",
          fecha_hasta: "",
          tipo_cambio: undefined,
        }))
        setCuentaSearch("")
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al generar el ajuste AITB")
      }
    } catch (error) {
      console.error("Error executing AITB:", error)
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generar Ajuste AITB</CardTitle>
        <CardDescription>
          Complete los datos para generar el comprobante base del ajuste de saldos AITB.
          Solo se puede crear un ajuste AITB por empresa, gestión y periodo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Primera fila: Cuenta Banco con autocomplete */}
          <div className="space-y-2">
            <Label htmlFor="cuenta_banco">Cuenta Banco *</Label>
            <div className="relative">
              <Input
                id="cuenta_banco"
                value={cuentaSearch}
                onChange={(e) => {
                  setCuentaSearch(e.target.value)
                  if (!e.target.value) {
                    setFormData({ ...formData, cuenta_banco: "" })
                  }
                }}
                placeholder="Buscar cuenta..."
                className="font-mono"
                required
              />
              {cuentasFiltradas.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {cuentasFiltradas.map((cuenta) => (
                    <div
                      key={cuenta.id}
                      onClick={() => handleSelectCuenta(cuenta)}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-mono font-semibold">{cuenta.cuenta}</div>
                      <div className="text-sm text-gray-600">{cuenta.descripcion}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Segunda fila: Periodo y Gestión */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="periodo">Periodo *</Label>
              <Select
                value={formData.periodo?.toString() || ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, periodo: parseInt(value) })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un mes" />
                </SelectTrigger>
                <SelectContent>
                  {MESES.map((mes) => (
                    <SelectItem key={mes.value} value={mes.value.toString()}>
                      {mes.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
          </div>

          {/* Tercera fila: Fecha Desde y Fecha Hasta */}
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

          {/* Cuarta fila: Tipo de Cambio */}
          <div className="space-y-2">
            <Label htmlFor="tipo_cambio">Tipo de Cambio USD *</Label>
            <Input
              id="tipo_cambio"
              type="number"
              step="0.0001"
              min="0"
              value={formData.tipo_cambio || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  tipo_cambio: parseFloat(e.target.value) || undefined,
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
                  Generando...
                </>
              ) : (
                <>
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Generar Ajuste AITB
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}


