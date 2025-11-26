"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { ArrowLeft, Save, MapPin, Calculator, ImageIcon, Trash2 } from "lucide-react"
import { toast } from "sonner"
import dynamic from 'next/dynamic'

const EditableLeafletMap = dynamic(() => import('@/components/maps/EditableLeafletMap'), { ssr: false })

// Constantes para selects y colores
const TYPE_OPTIONS = [
  'Unipolar', 'Bipolar', 'Tripolar', 'Mural', 'Mega Valla', 'Cartelera', 'Paleta'
] as const

const STATUS_META = {
  'Disponible':     { label: 'Disponible',    className: 'bg-green-100 text-green-800' },
  'Reservado':      { label: 'Reservado',     className: 'bg-yellow-100 text-yellow-800' },
  'Ocupado':        { label: 'Ocupado',       className: 'bg-red-100 text-red-800' },
  'No disponible':  { label: 'No disponible', className: 'bg-gray-100 text-gray-800' },
  'A Consultar':    { label: 'A Consultar',   className: 'bg-blue-100 text-blue-800' },
} as const

export default function NuevoSoportePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploadingImages, setUploadingImages] = useState({
    principal: false,
    secundaria1: false,
    secundaria2: false
  })
  const [imageErrors, setImageErrors] = useState({
    principal: "",
    secundaria1: "",
    secundaria2: ""
  })
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
    imagen_principal: "" as string,
    imagen_secundaria_1: "" as string,
    imagen_secundaria_2: "" as string,
    imagen_principal_file: null as File | null,
    imagen_secundaria_1_file: null as File | null,
    imagen_secundaria_2_file: null as File | null,
    googleMapsLink: "",
    latitude: -16.5000 as number | null, // Coordenadas por defecto La Paz
    longitude: -68.1500 as number | null,
    address: "",
    city: "",
    zona: "",
    country: "BO",
    impactosDiarios: "",
    priceMonth: "",
    sustrato_id: null as string | null,
    sustrato_nombre: "" as string,
    available: true
  })
  
  // Estado para el buscador de sustrato
  const [openSustrato, setOpenSustrato] = useState(false)
  const [todosLosProductos, setTodosLosProductos] = useState<any[]>([])
  const [cargandoProductos, setCargandoProductos] = useState(false)
  const [filteredProductos, setFilteredProductos] = useState<any[]>([])

  // Cálculos automáticos
  const widthM = Number(formData.widthM) || 0
  const heightM = Number(formData.heightM) || 0

  const areaM2 = useMemo(() => {
    const calculated = Number(widthM) * Number(heightM)
    return parseFloat(calculated.toFixed(2))
  }, [widthM, heightM])
  
  useEffect(() => {
    const formattedArea = areaM2.toFixed(2)
    setFormData(prev => ({ ...prev, areaM2: formattedArea }))
  }, [areaM2])

  // Cargar productos para el sustrato y establecer el por defecto
  useEffect(() => {
    const cargarProductos = async () => {
      setCargandoProductos(true)
      try {
        const response = await fetch('/api/inventario?limit=1000')
        const data = await response.json()
        
        const productosList = (data.data || []).map((p: any) => ({
          id: p.id,
          codigo: p.codigo,
          nombre: p.nombre,
          precio_venta: p.precio_venta || 0
        }))
        
        setTodosLosProductos(productosList)
        setFilteredProductos(productosList.slice(0, 20))
        
        // Buscar y establecer el sustrato por defecto: "LONA 13 Oz + IMPRESIÓN"
        const sustratoDefault = productosList.find((p: any) => {
          const nombreUpper = (p.nombre || '').toUpperCase()
          return nombreUpper.includes('LONA') && 
                 nombreUpper.includes('13') && 
                 (nombreUpper.includes('OZ') || nombreUpper.includes('OZ.')) &&
                 (nombreUpper.includes('IMPRESIÓN') || nombreUpper.includes('IMPRESION'))
        })
        
        if (sustratoDefault) {
          setFormData(prev => ({
            ...prev,
            sustrato_id: sustratoDefault.id,
            sustrato_nombre: `${sustratoDefault.codigo} - ${sustratoDefault.nombre}`
          }))
        }
      } catch (error) {
        console.error('Error cargando productos:', error)
      } finally {
        setCargandoProductos(false)
      }
    }
    
    cargarProductos()
  }, [])

  // Filtrar productos
  const filtrarProductos = (searchValue: string) => {
    if (!searchValue || searchValue.trim() === '') {
      setFilteredProductos(todosLosProductos.slice(0, 20))
      return
    }

    const search = searchValue.toLowerCase().trim()
    const filtered = todosLosProductos.filter((item: any) => {
      const codigo = (item.codigo || '').toLowerCase()
      const nombre = (item.nombre || '').toLowerCase()
      return codigo.startsWith(search) || nombre.startsWith(search)
    }).slice(0, 15)
    
    setFilteredProductos(filtered)
  }

  // Seleccionar sustrato
  const seleccionarSustrato = (producto: any) => {
    setFormData(prev => ({
      ...prev,
      sustrato_id: producto.id,
      sustrato_nombre: `${producto.codigo} - ${producto.nombre}`
    }))
    setOpenSustrato(false)
    setFilteredProductos(todosLosProductos.slice(0, 20))
  }

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

  // Handlers para subir imágenes
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, imageType: 'principal' | 'secundaria1' | 'secundaria2') => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limpiar error anterior
    setImageErrors(prev => ({ ...prev, [imageType]: "" }))

    if (file.size > 5 * 1024 * 1024) {
      const errorMsg = "La imagen no puede superar los 5MB"
      setImageErrors(prev => ({ ...prev, [imageType]: errorMsg }))
      e.target.value = ''
      return
    }

    if (!file.type.startsWith('image/')) {
      const errorMsg = "El archivo debe ser una imagen (JPG, PNG, GIF)"
      setImageErrors(prev => ({ ...prev, [imageType]: errorMsg }))
      e.target.value = ''
      return
    }

    // Actualizar estado de carga
    setUploadingImages(prev => ({ ...prev, [imageType === 'principal' ? 'principal' : imageType === 'secundaria1' ? 'secundaria1' : 'secundaria2']: true }))
    
    try {
      toast.loading("Subiendo imagen...", { id: `upload-${imageType}` })
      
      const imageFormData = new FormData()
      imageFormData.append('file', file)
      
      const uploadResponse = await fetch('/api/soportes/new/image', {
        method: 'POST',
        body: imageFormData
      })

      const uploadData = await uploadResponse.json()

      if (!uploadResponse.ok || !uploadData.success) {
        throw new Error(uploadData.error || 'Error subiendo la imagen')
      }

      const publicUrl = uploadData.data.publicUrl
      
      // Actualizar formData con la URL pública
      const fieldName = imageType === 'principal' ? 'imagen_principal' : imageType === 'secundaria1' ? 'imagen_secundaria_1' : 'imagen_secundaria_2'
      const fileFieldName = imageType === 'principal' ? 'imagen_principal_file' : imageType === 'secundaria1' ? 'imagen_secundaria_1_file' : 'imagen_secundaria_2_file'
      
      setFormData(prev => ({
        ...prev,
        [fieldName]: publicUrl,
        [fileFieldName]: file
      }))

      toast.success("Imagen subida correctamente", { id: `upload-${imageType}` })
      // Limpiar error al subir correctamente
      setImageErrors(prev => ({ ...prev, [imageType]: "" }))
    } catch (error) {
      console.error(`Error subiendo imagen ${imageType}:`, error)
      const errorMsg = error instanceof Error ? error.message : "Error subiendo la imagen"
      setImageErrors(prev => ({ ...prev, [imageType]: errorMsg }))
      toast.error(errorMsg, { id: `upload-${imageType}` })
    } finally {
      setUploadingImages(prev => ({ ...prev, [imageType === 'principal' ? 'principal' : imageType === 'secundaria1' ? 'secundaria1' : 'secundaria2']: false }))
      e.target.value = ''
    }
  }

  const handleRemoveImage = (imageType: 'principal' | 'secundaria1' | 'secundaria2') => {
    const fieldName = imageType === 'principal' ? 'imagen_principal' : imageType === 'secundaria1' ? 'imagen_secundaria_1' : 'imagen_secundaria_2'
    const fileFieldName = imageType === 'principal' ? 'imagen_principal_file' : imageType === 'secundaria1' ? 'imagen_secundaria_1_file' : 'imagen_secundaria_2_file'
    
    setFormData(prev => ({
      ...prev,
      [fieldName]: "",
      [fileFieldName]: null
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
      // Construir array de imágenes para compatibilidad con buildSupabasePayload
      const imagesArray = [
        formData.imagen_principal || null,
        formData.imagen_secundaria_1 || null,
        formData.imagen_secundaria_2 || null
      ].filter(Boolean) as string[]
      
      const dataToSend = {
        ...formData,
        images: imagesArray, // Para compatibilidad con buildSupabasePayload
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
        zona: formData.zona || null,
        country: formData.country || null,
        owner: formData.owner || null,
        sustrato_id: formData.sustrato_id || null,
      }
      
      // Remover campos de archivos del payload (no se envían al servidor)
      delete (dataToSend as any).imagen_principal_file
      delete (dataToSend as any).imagen_secundaria_1_file
      delete (dataToSend as any).imagen_secundaria_2_file

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
                    value={formData.areaM2 ? parseFloat(formData.areaM2).toFixed(2) : ""}
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
                  <Label htmlFor="sustrato">Seleccionar sustrato</Label>
                  <Popover open={openSustrato} onOpenChange={(open) => {
                    setOpenSustrato(open)
                    if (open) {
                      setFilteredProductos(todosLosProductos.slice(0, 20))
                    }
                  }}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-start",
                          !formData.sustrato_nombre && "text-muted-foreground"
                        )}
                      >
                        <span className="truncate">
                          {formData.sustrato_nombre || "Buscar producto sustrato..."}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput 
                          placeholder="Escribe código o nombre..."
                          className="h-9 border-0 focus:ring-0"
                          onValueChange={filtrarProductos}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {cargandoProductos ? "Cargando..." : "No se encontraron productos."}
                          </CommandEmpty>
                          {filteredProductos.length > 0 && (
                            <CommandGroup heading="Productos">
                              {filteredProductos.map((producto: any) => (
                                <CommandItem
                                  key={producto.id}
                                  value={`${producto.codigo} ${producto.nombre}`}
                                  onSelect={() => seleccionarSustrato(producto)}
                                  className="cursor-pointer"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.sustrato_id === producto.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <span className="text-xs truncate">
                                    [{producto.codigo}] {producto.nombre}
                                  </span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
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
                  <Label htmlFor="address">Descripción</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    placeholder="Descripción del soporte"
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
                  <Label htmlFor="zona">Zona</Label>
                  <Input
                    id="zona"
                    value={formData.zona}
                    onChange={(e) => handleChange("zona", e.target.value)}
                    placeholder="Zona norte, centro, etc."
                  />
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
                  <EditableLeafletMap
                    lat={formData.latitude || -16.5000}
                    lng={formData.longitude || -68.1500}
                    onChange={(coords) => {
                      console.log('🎯 Map coordinates changed:', coords);
                      const newGoogleMapsLink = `https://www.google.com/maps?q=${coords.lat},${coords.lng}&z=15`;
                      console.log('🔗 Generated new Google Maps link:', newGoogleMapsLink);
                      
                      setFormData(prev => ({
                        ...prev,
                        latitude: coords.lat,
                        longitude: coords.lng,
                        googleMapsLink: newGoogleMapsLink
                      }));
                      
                      toast.success(`Ubicación actualizada: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
                    }}
                    height={420}
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
                
                <div className="space-y-4">
                  <Label>Imágenes del soporte (máximo 3, 5MB cada una)</Label>
                  
                  {/* Imagen Principal */}
                  <div className="space-y-2">
                    <Label htmlFor="imagen_principal" className="text-sm font-medium">Imagen Principal</Label>
                    <div className="flex items-center gap-3">
                      {formData.imagen_principal ? (
                        <div className="relative group">
                          <div className="relative h-24 w-40 overflow-hidden rounded-md border-2 border-gray-200 bg-gray-100">
                            <Image 
                              src={formData.imagen_principal} 
                              alt="Imagen principal" 
                              fill
                              className="object-cover"
                              sizes="160px"
                              loading="lazy"
                            />
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 opacity-90 hover:opacity-100 h-6 px-2"
                            onClick={() => handleRemoveImage('principal')}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="aspect-square w-24 flex flex-col items-center justify-center rounded-md border-2 border-dashed border-gray-300 bg-gray-50">
                          <ImageIcon className="w-6 h-6 text-gray-400 mb-1" />
                          <p className="text-xs text-gray-500">Sin imagen</p>
                        </div>
                      )}
                      <div className="flex-1">
                        <input
                          id="imagen_principal"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageChange(e, 'principal')}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          disabled={uploadingImages.principal}
                          onClick={() => {
                            const input = document.getElementById('imagen_principal') as HTMLInputElement
                            input?.click()
                          }}
                        >
                          <ImageIcon className="w-4 h-4 mr-2" />
                          {uploadingImages.principal 
                            ? 'Subiendo...' 
                            : formData.imagen_principal 
                              ? 'Cambiar imagen' 
                              : 'Seleccionar imagen'
                          }
                        </Button>
                      </div>
                      {imageErrors.principal && (
                        <p className="text-sm text-red-600 mt-1">{imageErrors.principal}</p>
                      )}
                    </div>
                  </div>

                  {/* Imagen Secundaria 1 */}
                  <div className="space-y-2">
                    <Label htmlFor="imagen_secundaria_1" className="text-sm font-medium">Imagen Secundaria 1</Label>
                    <div className="flex items-center gap-3">
                      {formData.imagen_secundaria_1 ? (
                        <div className="relative group">
                          <div className="relative h-24 w-40 overflow-hidden rounded-md border-2 border-gray-200 bg-gray-100">
                            <Image 
                              src={formData.imagen_secundaria_1} 
                              alt="Imagen secundaria 1" 
                              fill
                              className="object-cover"
                              sizes="160px"
                              loading="lazy"
                            />
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 opacity-90 hover:opacity-100 h-6 px-2"
                            onClick={() => handleRemoveImage('secundaria1')}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="aspect-square w-24 flex flex-col items-center justify-center rounded-md border-2 border-dashed border-gray-300 bg-gray-50">
                          <ImageIcon className="w-6 h-6 text-gray-400 mb-1" />
                          <p className="text-xs text-gray-500">Sin imagen</p>
                        </div>
                      )}
                      <div className="flex-1">
                        <input
                          id="imagen_secundaria_1"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageChange(e, 'secundaria1')}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          disabled={uploadingImages.secundaria1}
                          onClick={() => {
                            const input = document.getElementById('imagen_secundaria_1') as HTMLInputElement
                            input?.click()
                          }}
                        >
                          <ImageIcon className="w-4 h-4 mr-2" />
                          {uploadingImages.secundaria1 
                            ? 'Subiendo...' 
                            : formData.imagen_secundaria_1 
                              ? 'Cambiar imagen' 
                              : 'Seleccionar imagen'
                          }
                        </Button>
                      </div>
                      {imageErrors.secundaria1 && (
                        <p className="text-sm text-red-600 mt-1">{imageErrors.secundaria1}</p>
                      )}
                    </div>
                  </div>

                  {/* Imagen Secundaria 2 */}
                  <div className="space-y-2">
                    <Label htmlFor="imagen_secundaria_2" className="text-sm font-medium">Imagen Secundaria 2</Label>
                    <div className="flex items-center gap-3">
                      {formData.imagen_secundaria_2 ? (
                        <div className="relative group">
                          <div className="relative h-24 w-40 overflow-hidden rounded-md border-2 border-gray-200 bg-gray-100">
                            <Image 
                              src={formData.imagen_secundaria_2} 
                              alt="Imagen secundaria 2" 
                              fill
                              className="object-cover"
                              sizes="160px"
                              loading="lazy"
                            />
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 opacity-90 hover:opacity-100 h-6 px-2"
                            onClick={() => handleRemoveImage('secundaria2')}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="aspect-square w-24 flex flex-col items-center justify-center rounded-md border-2 border-dashed border-gray-300 bg-gray-50">
                          <ImageIcon className="w-6 h-6 text-gray-400 mb-1" />
                          <p className="text-xs text-gray-500">Sin imagen</p>
                        </div>
                      )}
                      <div className="flex-1">
                        <input
                          id="imagen_secundaria_2"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageChange(e, 'secundaria2')}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          disabled={uploadingImages.secundaria2}
                          onClick={() => {
                            const input = document.getElementById('imagen_secundaria_2') as HTMLInputElement
                            input?.click()
                          }}
                        >
                          <ImageIcon className="w-4 h-4 mr-2" />
                          {uploadingImages.secundaria2 
                            ? 'Subiendo...' 
                            : formData.imagen_secundaria_2 
                              ? 'Cambiar imagen' 
                              : 'Seleccionar imagen'
                          }
                        </Button>
                      </div>
                      {imageErrors.secundaria2 && (
                        <p className="text-sm text-red-600 mt-1">{imageErrors.secundaria2}</p>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-500">Máximo 5MB. Formatos: JPG, PNG, GIF</p>
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
