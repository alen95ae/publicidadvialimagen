"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { ArrowLeft, Save, MapPin, Trash2, Edit, Eye, Calculator } from "lucide-react"
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

interface Support {
  id: string
  code: string
  title: string
  type: string
  status: keyof typeof STATUS_META
  widthM: number | null
  heightM: number | null
  areaM2: number | null
  pricePerM2: number | null
  productionCost: number | null
  productionCostOverride: boolean
  owner: string | null
  imageUrl: string | null
  latitude: number | null
  longitude: number | null
  address: string | null
  city: string | null
  country: string | null
  priceMonth: number | null
  available: boolean
  company?: { name: string }
  createdAt: string
  updatedAt: string
}

export default function SoporteDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  
  const [support, setSupport] = useState<Support | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    code: "",
    title: "",
    type: "",
    status: "DISPONIBLE" as keyof typeof STATUS_META,
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

  useEffect(() => {
    if (id) {
      fetchSupport()
    }
  }, [id])

  const fetchSupport = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/soportes/${id}`)
      if (response.ok) {
        const data = await response.json()
        setSupport(data)
        setFormData({
          code: data.code || "",
          title: data.title || "",
          type: data.type || "",
          status: data.status || "DISPONIBLE",
          widthM: data.widthM?.toString() || "",
          heightM: data.heightM?.toString() || "",
          areaM2: data.areaM2?.toString() || "",
          pricePerM2: data.pricePerM2?.toString() || "",
          productionCost: data.productionCost?.toString() || "",
          productionCostOverride: data.productionCostOverride || false,
          owner: data.owner || "",
          imageUrl: data.imageUrl || "",
          latitude: data.latitude?.toString() || "",
          longitude: data.longitude?.toString() || "",
          address: data.address || "",
          city: data.city || "",
          country: data.country || "",
          priceMonth: data.priceMonth?.toString() || "",
          available: data.available
        })
      } else {
        toast.error("Soporte no encontrado")
        router.push("/panel/soportes")
      }
    } catch (error) {
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  // Cálculos automáticos
  const widthM = Number(formData.widthM) || 0
  const heightM = Number(formData.heightM) || 0
  const pricePerM2 = Number(formData.pricePerM2) || 0
  const override = formData.productionCostOverride

  const areaM2 = useMemo(() => +(Number(widthM) * Number(heightM)).toFixed(2), [widthM, heightM])
  
  useEffect(() => {
    if (editing) {
      setFormData(prev => ({ ...prev, areaM2: areaM2.toString() }))
      if (!override) {
        const calculatedCost = +(areaM2 * Number(pricePerM2)).toFixed(2)
        setFormData(prev => ({ ...prev, productionCost: calculatedCost.toString() }))
      }
    }
  }, [areaM2, pricePerM2, override, editing])

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!formData.code || !formData.title) {
      toast.error("Código y título son requeridos")
      return
    }

    setSaving(true)
    
    try {
      const response = await fetch(`/api/soportes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const updated = await response.json()
        setSupport(updated)
        setEditing(false)
        toast.success("Soporte actualizado correctamente")
        fetchSupport() // Recargar datos
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al actualizar el soporte")
      }
    } catch (error) {
      toast.error("Error de conexión")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/soportes/${id}`, { method: "DELETE" })
      if (response.ok) {
        toast.success("Soporte eliminado correctamente")
        router.push("/panel/soportes")
      } else {
        toast.error("Error al eliminar el soporte")
      }
    } catch (error) {
      toast.error("Error de conexión")
    }
  }

  const formatPrice = (price: number | null) => {
    if (!price) return "N/A"
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR"
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-500">Cargando...</div>
      </div>
    )
  }

  if (!support) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-500">Soporte no encontrado</div>
      </div>
    )
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
            <div className="text-xl font-bold text-slate-800">
              {editing ? "Editando Soporte" : support.title}
            </div>
          </div>
          <div className="flex gap-2">
            {!editing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setEditing(true)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar soporte?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminará permanentemente el soporte "{support.title}".
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditing(false)
                    setFormData({
                      code: support.code || "",
                      title: support.title || "",
                      type: support.type || "",
                      status: support.status || "DISPONIBLE",
                      widthM: support.widthM?.toString() || "",
                      heightM: support.heightM?.toString() || "",
                      areaM2: support.areaM2?.toString() || "",
                      pricePerM2: support.pricePerM2?.toString() || "",
                      productionCost: support.productionCost?.toString() || "",
                      productionCostOverride: support.productionCostOverride || false,
                      owner: support.owner || "",
                      latitude: support.latitude?.toString() || "",
                      longitude: support.longitude?.toString() || "",
                      address: support.address || "",
                      city: support.city || "",
                      country: support.country || "",
                      priceMonth: support.priceMonth?.toString() || "",
                      available: support.available
                    })
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSave}
                  className="bg-[#D54644] hover:bg-[#B03A38]"
                  disabled={saving}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Guardando..." : "Guardar"}
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              {editing ? "Editar Soporte" : support.title}
            </h1>
            <p className="text-gray-600">
              {editing ? "Modifica la información del soporte" : "Detalles del soporte publicitario"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
              <CardDescription>Datos principales del soporte</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {editing ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="code">Código *</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => handleChange("code", e.target.value)}
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
                    <Select value={formData.status} onValueChange={(value) => handleChange("status", value as keyof typeof STATUS_META)}>
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
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Código</Label>
                      <p className="font-mono font-medium">{support.code}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Tipo</Label>
                      <Badge variant="secondary">{support.type}</Badge>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Estado</Label>
                    <span className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${STATUS_META[support.status]?.className || 'bg-gray-100 text-gray-800'}`}>
                      {STATUS_META[support.status]?.label || support.status}
                    </span>
                  </div>

                  {support.owner && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Propietario</Label>
                      <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ${
                        support.owner.trim().toLowerCase() === 'imagen' ? 'bg-rose-900 text-white' : 'bg-sky-700 text-white'
                      }`}>
                        {support.owner}
                      </span>
                    </div>
                  )}

                  {support.imageUrl && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Imagen</Label>
                      <img src={support.imageUrl} alt="Imagen del soporte" className="h-32 w-48 object-cover rounded-md border mt-2" />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Dimensiones y Costes */}
          <Card>
            <CardHeader>
              <CardTitle>Dimensiones y Costes</CardTitle>
              <CardDescription>Medidas y cálculos automáticos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {editing ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="widthM">Ancho (m)</Label>
                      <Input
                        id="widthM"
                        type="number"
                        step="0.1"
                        value={formData.widthM}
                        onChange={(e) => handleChange("widthM", e.target.value)}
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
                        className={!formData.productionCostOverride ? "bg-gray-50 no-spinner" : "no-spinner"}
                      />
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <Calculator className="h-4 w-4 shrink-0" />
                        {!formData.productionCostOverride
                          ? <span>{`Se calcula automáticamente: ${Number(formData.areaM2 || 0).toFixed(2)} m² × ${Number(formData.pricePerM2 || 0).toFixed(2)} €/m²`}</span>
                          : <span>Modo manual activo.</span>}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Ancho</Label>
                      <p>{support.widthM ? `${support.widthM}m` : "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Alto</Label>
                      <p>{support.heightM ? `${support.heightM}m` : "N/A"}</p>
                    </div>
                  </div>
                  
                  {support.areaM2 && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Área total</Label>
                      <p className="font-semibold">{support.areaM2} m²</p>
                    </div>
                  )}

                  {support.pricePerM2 && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Precio por m²</Label>
                      <p className="font-semibold">{formatPrice(support.pricePerM2)}</p>
                    </div>
                  )}

                  {support.productionCost && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Coste de producción</Label>
                      <p className="font-semibold">{formatPrice(support.productionCost)}</p>
                      {support.productionCostOverride && (
                        <p className="text-xs text-gray-500">Valor manual</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Ubicación */}
          <Card>
            <CardHeader>
              <CardTitle>Ubicación</CardTitle>
              <CardDescription>Información de localización</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {editing ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="address">Dirección</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleChange("address", e.target.value)}
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
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="country">País</Label>
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) => handleChange("country", e.target.value)}
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
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Dirección</Label>
                    <p>{support.address || "No especificada"}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Ciudad</Label>
                      <p>{support.city || "No especificada"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">País</Label>
                      <p>{support.country || "No especificado"}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Latitud</Label>
                      <p className="font-mono">{support.latitude || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Longitud</Label>
                      <p className="font-mono">{support.longitude || "N/A"}</p>
                    </div>
                  </div>
                </>
              )}
              
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
              {editing ? (
                <div className="space-y-2">
                  <Label htmlFor="priceMonth">Precio por Mes (€)</Label>
                  <Input
                    id="priceMonth"
                    type="number"
                    step="0.01"
                    value={formData.priceMonth}
                    onChange={(e) => handleChange("priceMonth", e.target.value)}
                  />
                </div>
              ) : (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Precio por Mes</Label>
                  <p className="text-lg font-semibold">{formatPrice(support.priceMonth)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Información del Sistema */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Información del Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <Label className="text-sm font-medium text-gray-700">Creado</Label>
                <p>{formatDate(support.createdAt)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Última actualización</Label>
                <p>{formatDate(support.updatedAt)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Empresa</Label>
                <p>{support.company?.name || "No asignada"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
