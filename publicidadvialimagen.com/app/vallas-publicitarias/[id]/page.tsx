"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import dynamic from "next/dynamic"
import { Calendar, MapPin, ArrowLeft, Ruler, Building, Lightbulb, CheckCircle, Eye, Calendar as CalendarIcon, FileText, Megaphone, Monitor } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useCampaignsContext } from "@/components/campaigns-provider"
import { useBillboards } from "@/hooks/use-billboards"

// Dynamic import para el mapa
const LeafletHybridMap = dynamic(
  () => import("@/components/maps/LeafletHybridMap"),
  { 
    ssr: false,
    loading: () => (
      <div className="h-80 rounded-lg bg-muted flex items-center justify-center">
        <p className="text-muted-foreground">Cargando mapa...</p>
      </div>
    )
  }
)

interface BillboardDetailPageProps {
  params: {
    id: string
  }
}

export default function BillboardDetailPage({ params }: BillboardDetailPageProps) {
  const [selectedStartDate, setSelectedStartDate] = useState("")
  const [selectedMonths, setSelectedMonths] = useState("1")
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const { addToCampaign } = useCampaignsContext()
  const { billboards, loading } = useBillboards()
  
  // Buscar el billboard por ID
  const billboard = billboards.find(b => b.id === params.id)
  
  // Log para depuración
  useEffect(() => {
    if (billboard) {
      console.log('📥 Billboard cargado:', billboard)
      console.log('🖼️ Imágenes del billboard:', billboard.images)
    }
  }, [billboard])

  // Mostrar loading
  if (loading) {
    return (
      <div className="container px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando soporte...</p>
          </div>
        </div>
      </div>
    )
  }

  // Mostrar error si no se encuentra
  if (!billboard) {
    return (
      <div className="container px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Soporte no encontrado</h2>
          <Button asChild>
            <Link href="/vallas-publicitarias">Volver a espacios publicitarios</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Preparar datos para mostrar
  const displayData = {
    ...billboard,
    description: billboard.description || billboard.location || "Espacio publicitario de alta visibilidad",
    technicalSpecs: {
      dimension: billboard.dimensions,
      tipo: billboard.format,
      impactos: billboard.impactos_diarios?.toLocaleString() || billboard.traffic,
      iluminacion: billboard.lighting
    }
  }

  const additionalServices = [
    { id: "diseno", name: "Diseño gráfico" },
    { id: "impresion", name: "Impresión de lona" },
    { id: "instalacion", name: "Instalación en valla" }
  ]

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    )
  }

  const getTotalPrice = () => {
    const basePrice = displayData.monthlyPrice * parseInt(selectedMonths)
    return basePrice
  }

  const getEndDate = () => {
    if (!selectedStartDate || !selectedMonths) return ""
    const startDate = new Date(selectedStartDate)
    const endDate = new Date(startDate)
    endDate.setMonth(endDate.getMonth() + parseInt(selectedMonths))
    return endDate.toLocaleDateString('es-ES')
  }

  const handleAddToCampaign = () => {
    if (!selectedStartDate) {
      alert("Por favor selecciona una fecha de inicio")
      return
    }

    const campaignItem = {
      id: `${displayData.id}-${Date.now()}`,
      billboardId: displayData.id,
      name: displayData.name,
      city: displayData.city,
      dimensions: displayData.technicalSpecs.dimension,
      impacts: displayData.technicalSpecs.impactos,
      type: displayData.technicalSpecs.tipo,
      startDate: selectedStartDate,
      months: parseInt(selectedMonths),
      image: displayData.images[0] || "/placeholder.svg"
    }

    console.log('Intentando añadir a campaña:', campaignItem)
    addToCampaign(campaignItem)
    
    // Mostrar mensaje de confirmación
    const button = document.querySelector('[data-campaign-button]') as HTMLButtonElement
    if (button) {
      const originalText = button.textContent
      button.textContent = "✓ Añadido a campaña"
      button.disabled = true
      button.className = button.className.replace('border-[#D54644] text-[#D54644]', 'border-green-500 text-green-500')
      
      setTimeout(() => {
        button.textContent = originalText
        button.disabled = false
        button.className = button.className.replace('border-green-500 text-green-500', 'border-[#D54644] text-[#D54644]')
      }, 2000)
    }
  }

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index)
  }


  return (
    <div className="container px-4 py-8 md:px-6 md:py-12">
      {/* Breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center text-sm text-muted-foreground mb-4">
          <Link href="/" className="hover:text-primary">
            Inicio
          </Link>
          <span className="mx-2">/</span>
          <Link href="/vallas-publicitarias" className="hover:text-primary">
            Vallas Publicitarias
          </Link>
          <span className="mx-2">/</span>
          <span>{displayData.name}</span>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/vallas-publicitarias">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a espacios
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Images and Map */}
        <div className="space-y-4">
          <div className="aspect-[4/3] relative rounded-lg overflow-hidden">
            <Image
              src={displayData.images[selectedImageIndex] || "/placeholder.svg"}
              alt={displayData.name}
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {displayData.images.map((image, index) => (
              <div 
                key={index} 
                className={`aspect-[4/3] relative rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:opacity-80 hover:scale-105 ${
                  selectedImageIndex === index ? 'ring-2 ring-[#D54644] ring-offset-2' : ''
                }`}
                onClick={() => handleImageClick(index)}
              >
                <Image
                  src={image || "/placeholder.svg"}
                  alt={`${displayData.name} - Vista ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
          
          {/* Mapa con ubicación real */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Ubicación</h3>
            {displayData.coordinates && displayData.coordinates.lat && displayData.coordinates.lng ? (
              <LeafletHybridMap
                points={[{
                  id: displayData.id,
                  lat: displayData.coordinates.lat,
                  lng: displayData.coordinates.lng,
                  title: displayData.name,
                  type: "billboard",
                  dimensions: displayData.dimensions,
                  format: displayData.format,
                  image: displayData.images && displayData.images.length > 0 ? displayData.images[0] : undefined
                }]}
                height={320}
                center={[displayData.coordinates.lat, displayData.coordinates.lng]}
                zoom={16}
              />
            ) : (
              <div className="h-80 rounded-lg bg-muted flex items-center justify-center border">
                <div className="text-center p-4">
                  <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Ubicación: {displayData.location}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    (Coordenadas no disponibles)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Details and Booking */}
        <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Badge className={`${
                displayData.status === 'Disponible' 
                  ? "bg-green-100 text-green-800 border-green-200 hover:bg-green-100 hover:text-green-800" 
                  : displayData.status === 'Reservado'
                  ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                  : displayData.status === 'Ocupado'
                  ? "bg-red-100 text-red-800 border-red-200"
                  : "bg-gray-100 text-gray-800 border-gray-200"
              } transition-none pointer-events-none`}>
                {displayData.status || 'No disponible'}
              </Badge>
            </div>
            
            <h1 className="text-3xl font-bold mb-2">{displayData.name}</h1>
            <div className="flex items-center gap-1 text-muted-foreground mb-4">
              <MapPin className="h-5 w-5" />
              <span>{displayData.city}</span>
            </div>
          </div>

          {/* Características del espacio */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Características del espacio</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Ruler className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="font-medium">{displayData.technicalSpecs.dimension}</div>
                  <div className="text-sm text-muted-foreground">Dimensión</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Monitor className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="font-medium">{displayData.technicalSpecs.tipo}</div>
                  <div className="text-sm text-muted-foreground">Tipo de soporte</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Eye className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="font-medium">{displayData.technicalSpecs.impactos}</div>
                  <div className="text-sm text-muted-foreground">Impactos diarios</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Lightbulb className={`h-5 w-5 ${displayData.technicalSpecs.iluminacion === 'Sí' ? 'text-yellow-500' : 'text-gray-400'}`} />
                <div>
                  <div className="font-medium">{displayData.technicalSpecs.iluminacion}</div>
                  <div className="text-sm text-muted-foreground">Iluminación</div>
                </div>
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <h3 className="font-semibold text-lg mb-2">Descripción</h3>
            <p className="text-muted-foreground">{displayData.description}</p>
          </div>

          {/* Pricing and Booking */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold">
                  Cotizar espacio
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Fecha de inicio */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Fecha de inicio</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedStartDate ? new Date(selectedStartDate).toLocaleDateString('es-ES') : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <input
                      type="date"
                      value={selectedStartDate}
                      onChange={(e) => setSelectedStartDate(e.target.value)}
                      className="p-3"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Meses de alquiler */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Meses de alquiler</Label>
                <Select value={selectedMonths} onValueChange={setSelectedMonths}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 12].map(months => (
                      <SelectItem key={months} value={months.toString()}>
                        {months} mes{months > 1 ? 'es' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Resumen del período */}
              {selectedStartDate && selectedMonths && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    <span className="font-medium">Resumen del período</span>
                  </div>
                  <div className="text-sm space-y-1">
                    <div>Inicio: {new Date(selectedStartDate).toLocaleDateString('es-ES')}</div>
                    <div>Duración: {selectedMonths} mes{parseInt(selectedMonths) > 1 ? 'es' : ''}</div>
                    <div>Fin: {getEndDate()}</div>
                  </div>
                </div>
              )}

              {/* Servicios adicionales */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Servicios adicionales (se pagan al inicio)</Label>
                <div className="space-y-2">
                  {additionalServices.map((service) => (
                    <div key={service.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={service.id}
                        checked={selectedServices.includes(service.id)}
                        onCheckedChange={() => handleServiceToggle(service.id)}
                      />
                      <Label htmlFor={service.id} className="flex-1 cursor-pointer">
                        {service.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>


              {/* Botón añadir a campaña */}
              <Button 
                variant="outline" 
                className="w-full border-[#D54644] text-[#D54644] hover:bg-[#D54644] hover:text-white"
                onClick={handleAddToCampaign}
                data-campaign-button
              >
                <Megaphone className="mr-2 h-4 w-4" />
                Añadir a campaña
              </Button>

              {/* Botón de cotización */}
              <Button 
                className="w-full bg-[#D54644] hover:bg-[#B03A38] text-white"
                onClick={() => {
                  // Validar que se hayan seleccionado los campos requeridos
                  if (!selectedStartDate) {
                    alert('Por favor, selecciona una fecha de inicio')
                    return
                  }
                  if (!selectedMonths) {
                    alert('Por favor, selecciona los meses de alquiler')
                    return
                  }
                  
                  // Construir URL con los datos seleccionados
                  const params = new URLSearchParams({
                    fechaInicio: selectedStartDate,
                    mesesAlquiler: selectedMonths,
                    serviciosAdicionales: selectedServices.join(','),
                    soporte: billboard.code // Usar el código real del soporte
                  })
                  
                  // Redirigir al formulario de solicitud
                  window.location.href = `/solicitar-cotizacion?${params.toString()}`
                }}
              >
                <FileText className="mr-2 h-4 w-4" />
                Solicitar cotización
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  )
}