"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, MapPin, Calculator } from "lucide-react"
import { toast } from "sonner"

// Constantes para selects y colores
const TYPE_OPTIONS = [
  'valla','pantalla','totem','parada de bus','mural','pasacalles'
] as const

const STATUS_META = {
  DISPONIBLE:   { label: 'Disponible',    className: 'bg-emerald-600 text-white' },
  RESERVADO:    { label: 'Reservado',     className: 'bg-amber-500 text-black' },
  OCUPADO:      { label: 'Ocupado',       className: 'bg-red-600 text-white' },
  NO_DISPONIBLE:{ label: 'No disponible', className: 'bg-neutral-900 text-white' },
} as const

export default function NuevoSoportePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    code: "",
    title: "",
    type: "",
    status: "DISPONIBLE",
    widthM: "",
    heightM: "",
    areaM2: "",
    pricePerM2: "",
    productionCost: "",
    productionCostOverride: false,
    owner: "",
    imageUrl: "",
    latitude: "",
    longitude: "",
    address: "",
    city: "",
    country: "",
    priceMonth: "",
    available: true
  })

  // Cálculos automáticos
  const widthM = Number(formData.widthM) || 0
  const heightM = Number(formData.heightM) || 0
  const pricePerM2 = Number(formData.pricePerM2) || 0
  const override = formData.productionCostOverride

  const areaM2 = useMemo(() => +(Number(widthM) * Number(heightM)).toFixed(2), [widthM, heightM])
  
  useEffect(() => {
    setFormData(prev => ({ ...prev, areaM2: areaM2.toString() }))
    if (!override) {
      const calculatedCost = +(areaM2 * Number(pricePerM2)).toFixed(2)
      setFormData(prev => ({ ...prev, productionCost: calculatedCost.toString() }))
    }
  }, [areaM2, pricePerM2, override])

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.code || !formData.title) {
      toast.error("Código y título son requeridos")
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch("/api/soportes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const created = await response.json()
        toast.success("Soporte creado correctamente")
        router.push(`/panel/soportes/${created.id}`)
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al crear el soporte")
      }
    } catch (error) {
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  const owner = formData.owner?.trim()
  const ownerIsImagen = owner?.toLowerCase() === 'imagen'
  const ownerClass = owner
    ? ownerIsImagen ? 'bg-rose-900 text-white' : 'bg-sky-700 text-white'
    : 'hidden'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/panel/soportes" className="text-gray-600 hover:text-gray-800 mr-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Soportes
            </Link>
            <div className="text-xl font-bold text-slate-800">Nuevo Soporte</div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Buscar</span>
            <span className="text-gray-800 font-medium">admin</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Crear Nuevo Soporte</h1>
          <p className="text-gray-600">Añade un nuevo soporte publicitario al sistema</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Información Básica */}
            <Card>
              <CardHeader>
                <CardTitle>Información Básica</CardTitle>
                <CardDescription>Datos principales del soporte</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Código *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => handleChange("code", e.target.value)}
                    placeholder="SM-001"
                    className="bg-neutral-100 border-neutral-200 text-gray-900 font-mono"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    placeholder="Valla Avenidas"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo *</Label>
                  <Select value={formData.type} onValueChange={(value) => handleChange("type", value)}>
                    <SelectTrigger className="bg-white dark:bg-white text-gray-900 border border-gray-200">
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-md">
                      {TYPE_OPTIONS.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Estado *</Label>
                  <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                    <SelectTrigger className="bg-white dark:bg-white text-gray-900 border border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-md">
                      {Object.entries(STATUS_META).map(([key, meta]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <span className={`inline-block w-3 h-3 rounded-full ${meta.className}`}></span>
                            {meta.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="owner">Propietario</Label>
                  <Input
                    id="owner"
                    value={formData.owner}
                    onChange={(e) => handleChange("owner", e.target.value)}
                    placeholder="Propietario del soporte"
                  />
                  {owner && (
                    <div className={`mt-2 inline-flex rounded-md px-3 py-1 text-sm pointer-events-none select-none ${ownerClass}`}>
                      {owner}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="imageUrl">Imagen del soporte</Label>
                  {formData.imageUrl ? (
                    <div className="flex items-center gap-3">
                      <img src={formData.imageUrl} alt="preview" className="h-24 w-40 object-cover rounded-md border" />
                      <Button variant="outline" onClick={() => handleChange("imageUrl", "")}>Quitar</Button>
                    </div>
                  ) : (
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={async (e) => {
                        const f = e.target.files?.[0]
                        if (!f) return
                        const fd = new FormData()
                        fd.set('file', f)
                        const r = await fetch('/api/uploads', { method: 'POST', body: fd })
                        const { url } = await r.json()
                        handleChange("imageUrl", url)
                      }} 
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Dimensiones y Costes */}
            <Card>
              <CardHeader>
                <CardTitle>Dimensiones y Costes</CardTitle>
                <CardDescription>Medidas y cálculos automáticos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="widthM">Ancho (m)</Label>
                    <Input
                      id="widthM"
                      type="number"
                      step="0.1"
                      value={formData.widthM}
                      onChange={(e) => handleChange("widthM", e.target.value)}
                      placeholder="3.5"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="heightM">Alto (m)</Label>
                    <Input
                      id="heightM"
                      type="number"
                      step="0.1"
                      value={formData.heightM}
                      onChange={(e) => handleChange("heightM", e.target.value)}
                      placeholder="2.5"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="areaM2">Área total (m²)</Label>
                  <Input
                    id="areaM2"
                    value={formData.areaM2}
                    readOnly
                    aria-readonly="true"
                    className="bg-gray-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pricePerM2">Precio por m² (€)</Label>
                  <Input
                    id="pricePerM2"
                    type="number"
                    step="0.01"
                    value={formData.pricePerM2}
                    onChange={(e) => handleChange("pricePerM2", e.target.value)}
                    placeholder="12.00"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="productionCostOverride"
                      checked={formData.productionCostOverride}
                      onCheckedChange={(checked) => handleChange("productionCostOverride", checked)}
                    />
                    <span className="text-sm text-muted-foreground">Editar manualmente</span>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="productionCost">Coste de producción (€)</Label>
                    <Input
                      id="productionCost"
                      type="number"
                      step="0.01"
                      className="no-spinner"
                      value={formData.productionCost}
                      onChange={(e) => handleChange("productionCost", e.target.value)}
                      placeholder="144.00"
                      disabled={!formData.productionCostOverride}
                      className={!formData.productionCostOverride ? "bg-gray-50" : ""}
                    />
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <Calculator className="h-4 w-4 shrink-0" />
                      {!formData.productionCostOverride
                        ? <span>{`Se calcula automáticamente: ${Number(formData.areaM2 || 0).toFixed(2)} m² × ${Number(formData.pricePerM2 || 0).toFixed(2)} €/m²`}</span>
                        : <span>Modo manual activo.</span>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ubicación */}
            <Card>
              <CardHeader>
                <CardTitle>Ubicación</CardTitle>
                <CardDescription>Información de localización</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    placeholder="Calle Principal, 123"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Ciudad</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleChange("city", e.target.value)}
                      placeholder="Zamora"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="country">País</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => handleChange("country", e.target.value)}
                      placeholder="ES"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitud</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="0.000001"
                      value={formData.latitude}
                      onChange={(e) => handleChange("latitude", e.target.value)}
                      placeholder="41.503"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitud</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="0.000001"
                      value={formData.longitude}
                      onChange={(e) => handleChange("longitude", e.target.value)}
                      placeholder="-5.744"
                    />
                  </div>
                </div>
                
                {/* Placeholder para mapa futuro */}
                <div className="aspect-[16/9] bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MapPin className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">Mapa de ubicación</p>
                    <p className="text-xs">Integración con Google Maps próximamente</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Precios */}
            <Card>
              <CardHeader>
                <CardTitle>Precios</CardTitle>
                <CardDescription>Información de tarifas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="priceMonth">Precio por Mes (€)</Label>
                  <Input
                    id="priceMonth"
                    type="number"
                    step="0.01"
                    value={formData.priceMonth}
                    onChange={(e) => handleChange("priceMonth", e.target.value)}
                    placeholder="450.00"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="mt-8 flex gap-4 justify-end">
            <Link href="/panel/soportes">
              <Button variant="outline">Cancelar</Button>
            </Link>
            <Button 
              type="submit" 
              className="bg-[#D54644] hover:bg-[#B03A38]"
              disabled={loading}
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Creando..." : "Crear Soporte"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
