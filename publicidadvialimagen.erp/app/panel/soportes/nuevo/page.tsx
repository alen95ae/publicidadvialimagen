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
import dynamic from 'next/dynamic'

const InteractiveMap = dynamic(() => import('@/components/interactive-map'), { ssr: false })

// Constantes para selects y colores
const TYPE_OPTIONS = [
  'Vallas Publicitarias', 'Pantallas LED', 'Murales', 'Publicidad Móvil'
] as const

const STATUS_META = {
  'Disponible':     { label: 'Disponible',    className: 'bg-green-100 text-green-800' },
  'Reservado':      { label: 'Reservado',     className: 'bg-yellow-100 text-yellow-800' },
  'Ocupado':        { label: 'Ocupado',       className: 'bg-red-100 text-red-800' },
  'No disponible':  { label: 'No disponible', className: 'bg-gray-100 text-gray-800' },
} as const

export default function NuevoSoportePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    code: "",
    title: "",
    type: "",
    status: "Disponible",
    widthM: "",
    heightM: "",
    areaM2: "",
    iluminacion: null as boolean | null,
    owner: "",
    images: [] as string[],
    googleMapsLink: "",
    latitude: -16.5000 as number | null, // Coordenadas por defecto La Paz
    longitude: -68.1500 as number | null,
    address: "",
    city: "",
    country: "BO",
    impactosDiarios: "",
    priceMonth: "",
    available: true
  })

  // Cálculos automáticos
  const widthM = Number(formData.widthM) || 0
  const heightM = Number(formData.heightM) || 0

  const areaM2 = useMemo(() => +(Number(widthM) * Number(heightM)).toFixed(2), [widthM, heightM])
  
  useEffect(() => {
    setFormData(prev => ({ ...prev, areaM2: areaM2.toString() }))
  }, [areaM2])

  // Función para expandir enlaces cortos usando una API externa
  const expandShortUrl = async (shortUrl: string): Promise<string | null> => {
    try {
      console.log('Expanding short URL:', shortUrl)
      
      // Usar la API de unshorten.me que no tiene restricciones CORS
      const response = await fetch(`https://unshorten.me/json/${encodeURIComponent(shortUrl)}`)
      const data = await response.json()
      
      if (data.success && data.resolved_url) {
        console.log('URL expanded successfully:', data.resolved_url)
        return data.resolved_url
      }
      
      // Fallback: usar longurl.org
      const fallbackResponse = await fetch(`https://api.longurl.org/v2/expand?url=${encodeURIComponent(shortUrl)}&format=json`)
      const fallbackData = await fallbackResponse.json()
      
      if (fallbackData['long-url']) {
        console.log('URL expanded with fallback:', fallbackData['long-url'])
        return fallbackData['long-url']
      }
      
      return null
    } catch (error) {
      console.error('Error expanding URL:', error)
      return null
    }
  }

  // Función para extraer coordenadas de Google Maps link
  const extractCoordinatesFromGoogleMaps = async (link: string): Promise<{ lat: number, lng: number } | null> => {
    if (!link || typeof link !== 'string') return null
    
    try {
      console.log('Extracting coordinates from:', link)
      let urlToProcess = link
      
      // Si es un enlace corto, expandirlo primero
      if (link.includes('goo.gl') || link.includes('maps.app.goo.gl')) {
        console.log('Short link detected, expanding...')
        const expandedUrl = await expandShortUrl(link)
        if (expandedUrl) {
          urlToProcess = expandedUrl
          console.log('Using expanded URL:', urlToProcess)
        } else {
          console.log('Could not expand short URL')
          return null
        }
      }
      
      // Patrones mejorados para diferentes formatos de Google Maps
      const patterns = [
        // Formato: @lat,lng,zoom (más común)
        /@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
        // Formato: !3dlat!4dlng
        /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/,
        // Formato: ll=lat,lng
        /[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
        // Formato: center=lat,lng
        /[?&]center=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
        // Formato: q=lat,lng
        /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
        // Formato directo: lat,lng en la URL
        /maps.*?(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/,
        // Formato place: place/lat,lng
        /place\/.*?@(-?\d+\.?\d*),(-?\d+\.?\d*)/
      ]

      for (let i = 0; i < patterns.length; i++) {
        const pattern = patterns[i]
        const match = urlToProcess.match(pattern)
        if (match) {
          const lat = parseFloat(match[1])
          const lng = parseFloat(match[2])
          console.log(`Pattern ${i} matched:`, { lat, lng })
          
          // Validar que las coordenadas estén en rangos válidos
          if (!isNaN(lat) && !isNaN(lng) && 
              lat >= -90 && lat <= 90 && 
              lng >= -180 && lng <= 180) {
            console.log('Valid coordinates extracted:', { lat, lng })
            return { lat, lng }
          }
        }
      }
      
      console.log('No coordinates found in link')
      return null
    } catch (error) {
      console.error('Error extracting coordinates:', error)
      return null
    }
  }

  // Función para generar Google Maps link desde coordenadas
  const generateGoogleMapsLink = (lat: number, lng: number): string => {
    return `https://www.google.com/maps?q=${lat},${lng}&z=15`
  }


  const handleChange = async (field: string, value: string | boolean) => {
    console.log(`handleChange called: ${field} = ${value}`)
    
    // Si se cambia el Google Maps link, extraer coordenadas automáticamente
    if (field === 'googleMapsLink' && typeof value === 'string') {
      console.log('Google Maps link changed:', value)
      
      // Primero actualizar el campo del enlace
      setFormData(prev => ({ ...prev, [field]: value }))
      
      if (value.trim()) {
        // Mostrar mensaje de carga
        if (value.includes('goo.gl') || value.includes('maps.app.goo.gl')) {
          toast.info('Expandiendo enlace corto de Google Maps...')
        }
        
        try {
          const coords = await extractCoordinatesFromGoogleMaps(value.trim())
          if (coords) {
            console.log('Coordinates extracted successfully:', coords)
            
            // Actualizar las coordenadas
            setFormData(prev => ({
              ...prev,
              latitude: coords.lat,
              longitude: coords.lng
            }))
            
            // Mostrar mensaje de éxito
            toast.success(`¡Ubicación encontrada! ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`)
          } else {
            console.log('No coordinates found')
            toast.warning('No se pudieron extraer coordenadas del enlace.')
          }
        } catch (error) {
          console.error('Error extracting coordinates:', error)
          toast.error('Error al procesar el enlace de Google Maps.')
        }
      } else {
        // Si se borra el link, mantener coordenadas por defecto
        console.log('Link cleared, using default coordinates')
        setFormData(prev => ({
          ...prev,
          latitude: -16.5000,
          longitude: -68.1500
        }))
      }
    } else {
      // Para otros campos, actualizar normalmente
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  // Función para manejar cambios de coordenadas desde el mapa
  const handleLocationChange = (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      googleMapsLink: generateGoogleMapsLink(lat, lng)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.code || !formData.title) {
      toast.error("Código y título son requeridos")
      return
    }

    setLoading(true)
    
    try {
      // Preparar datos para envío
      const dataToSend = {
        ...formData,
        widthM: formData.widthM ? parseFloat(formData.widthM) : null,
        heightM: formData.heightM ? parseFloat(formData.heightM) : null,
        areaM2: formData.areaM2 ? parseFloat(formData.areaM2) : null,
        priceMonth: formData.priceMonth ? parseFloat(formData.priceMonth) : null,
        impactosDiarios: formData.impactosDiarios ? parseInt(formData.impactosDiarios) : null,
        googleMapsLink: formData.googleMapsLink || null,
        latitude: formData.latitude,
        longitude: formData.longitude,
        address: formData.address || null,
        city: formData.city || null,
        country: formData.country || null,
        owner: formData.owner || null,
      }

      const response = await fetch("/api/soportes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend)
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
      console.error("Error creating support:", error)
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  const owner = formData.owner?.trim()
  const ownerIsImagen = owner?.toLowerCase() === 'imagen'
  const ownerClass = owner
    ? ownerIsImagen ? 'bg-pink-100 text-pink-800' : 'bg-blue-100 text-blue-800'
    : 'hidden'

  return (
    <div className="p-6">
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-xl font-bold text-slate-800">Soportes</div>
            <div className="flex items-center gap-6 ml-4">
              <Link 
                href="/panel/soportes/gestion" 
                className="text-sm font-medium text-[#D54644] hover:text-[#D54644]/80 transition-colors"
              >
                Soportes
              </Link>
              <Link 
                href="/panel/soportes/alquileres" 
                className="text-sm font-medium text-gray-600 hover:text-[#D54644] transition-colors"
              >
                Alquileres
              </Link>
              <Link 
                href="/panel/soportes/planificacion" 
                className="text-sm font-medium text-gray-600 hover:text-[#D54644] transition-colors"
              >
                Planificación
              </Link>
              <Link 
                href="/panel/soportes/costes" 
                className="text-sm font-medium text-gray-600 hover:text-[#D54644] transition-colors"
              >
                Costes
              </Link>
              <Link 
                href="/panel/soportes/mantenimiento" 
                className="text-sm font-medium text-gray-600 hover:text-[#D54644] transition-colors"
              >
                Mantenimiento
              </Link>
            </div>
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

              </CardContent>
            </Card>

            {/* Características Técnicas */}
            <Card>
              <CardHeader>
                <CardTitle>Características Técnicas</CardTitle>
                <CardDescription>Especificaciones técnicas del soporte</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo de soporte *</Label>
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
                  <Label htmlFor="iluminacion">Iluminación</Label>
                  <Select value={formData.iluminacion === null ? "" : formData.iluminacion.toString()} onValueChange={(value) => handleChange("iluminacion", value === "" ? null : value === "true")}>
                    <SelectTrigger className="bg-white dark:bg-white text-gray-900 border border-gray-200">
                      <SelectValue placeholder="Selecciona una opción" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-md">
                      <SelectItem value="true">Sí</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>


                <div className="space-y-2">
                  <Label htmlFor="images">Imágenes del soporte (máximo 5, 5MB cada una)</Label>
                  <div className="space-y-3">
                    {formData.images.map((image, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <img src={image} alt={`preview ${index + 1}`} className="h-24 w-40 object-cover rounded-md border" />
                        <Button variant="outline" onClick={() => {
                          const newImages = formData.images.filter((_, i) => i !== index)
                          handleChange("images", newImages)
                        }}>Quitar</Button>
                      </div>
                    ))}
                    {formData.images.length < 5 && (
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={async (e) => {
                          const f = e.target.files?.[0]
                          if (!f) return
                          if (f.size > 5 * 1024 * 1024) {
                            toast.error("La imagen no puede superar los 5MB")
                            return
                          }
                          const fd = new FormData()
                          fd.set('file', f)
                          const r = await fetch('/api/uploads', { method: 'POST', body: fd })
                          const { url } = await r.json()
                          handleChange("images", [...formData.images, url])
                        }} 
                      />
                    )}
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
                      placeholder="BO"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="googleMapsLink">Enlace de Google Maps</Label>
                  <Input
                    id="googleMapsLink"
                    type="url"
                    value={formData.googleMapsLink}
                    onChange={(e) => handleChange("googleMapsLink", e.target.value)}
                    placeholder="Pega aquí el enlace de Google Maps..."
                  />
                  <p className="text-xs text-gray-500">
                    💡 Pega cualquier enlace de Google Maps y las coordenadas se extraerán automáticamente
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Ubicación en el mapa</Label>
                  <InteractiveMap
                    lat={formData.latitude || -16.5000}
                    lng={formData.longitude || -68.1500}
                    editable={true}
                  />
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
                  <Label htmlFor="impactosDiarios">Impactos Diarios</Label>
                  <Input
                    id="impactosDiarios"
                    type="number"
                    value={formData.impactosDiarios}
                    onChange={(e) => handleChange("impactosDiarios", e.target.value)}
                    placeholder="1000"
                  />
                </div>
                
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
    </div>
  )
}
