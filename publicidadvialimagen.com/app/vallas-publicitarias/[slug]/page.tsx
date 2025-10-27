"use client"

import { useState, useEffect, useCallback, useLayoutEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import useEmblaCarousel from 'embla-carousel-react'
import { Calendar, MapPin, ArrowLeft, Ruler, Building, Lightbulb, CheckCircle, Eye, Calendar as CalendarIcon, FileText, Monitor, ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useBillboards } from "@/hooks/use-billboards"
import { useTranslations } from "@/hooks/use-translations"

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

// Función para crear slug SEO-friendly (misma que en la página principal)
function createSlug(text: string | undefined | null): string {
  if (!text) return ''
  return text
    .toLowerCase()
    .trim()
    .replace(/[áàäâã]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöôõ]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Componente para mostrar soportes similares de la misma ciudad
function SimilarSupportsCarousel({ billboards, currentBillboardId }: { billboards: any[], currentBillboardId: string }) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true,
      align: 'start',
      slidesToScroll: 1,
      containScroll: 'trimSnaps',
    }
  )

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  // Filtrar soportes de la misma ciudad, excluyendo el actual
  const similarBillboards = billboards.filter(b => 
    b.id !== currentBillboardId && 
    b.city === billboards.find(current => current.id === currentBillboardId)?.city
  ).slice(0, 8) // Limitar a 8 soportes

  if (similarBillboards.length === 0) {
    return null
  }

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4 pb-4">
          {similarBillboards.map((billboard) => (
            <div key={billboard.id} className="flex-[0_0_auto] min-w-[280px] max-w-[280px]">
              <Card className="overflow-hidden">
                <Link href={`/vallas-publicitarias/${billboard.id}`} className="w-full h-[147px] relative block">
                  <Image
                    src={billboard.images?.[0] || "/placeholder.svg"}
                    alt={billboard.name}
                    width={280}
                    height={147}
                    className="h-full w-full object-cover hover:opacity-90 transition-opacity"
                  />
                </Link>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-base text-balance">{billboard.name}</h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Ruler className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">
                          {billboard.dimensions || "Medidas no disponibles"}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        className="bg-primary hover:bg-primary/90 text-xs"
                        asChild
                      >
                        {billboard.available ? (
                          <Link href={`/vallas-publicitarias/${billboard.id}`}>
                            <FileText className="mr-1 h-3 w-3" />
                            Cotizar
                          </Link>
                        ) : (
                          <Link href={`/vallas-publicitarias/${billboard.id}`}>
                            <Eye className="mr-1 h-3 w-3" />
                            Ver más
                          </Link>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
      
      {/* Botones de navegación */}
      <button
        onClick={scrollPrev}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Anterior"
      >
        <ChevronLeft className="w-6 h-6 text-gray-700 dark:text-gray-200" />
      </button>
      
      <button
        onClick={scrollNext}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Siguiente"
      >
        <ChevronRight className="w-6 h-6 text-gray-700 dark:text-gray-200" />
      </button>
    </div>
  )
}

interface BillboardDetailPageProps {
  params: {
    slug: string
  }
}

export default function BillboardDetailPage({ params }: BillboardDetailPageProps) {
  const [selectedStartDate, setSelectedStartDate] = useState("")
  const [selectedMonths, setSelectedMonths] = useState("1")
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [shouldRedirect, setShouldRedirect] = useState(false)
  const { billboards, loading } = useBillboards()
  const { t } = useTranslations()
  const router = useRouter()
  
  // Scroll al inicio inmediatamente
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [])
  
  // Buscar el billboard por slug o ID
  const billboard = billboards.find(b => {
    const expectedSlug = createSlug(b.name)
    const matchesSlug = expectedSlug === params.slug
    const matchesId = b.id === params.slug
    console.log(`🔍 Buscando billboard:`, {
      paramsSlug: params.slug,
      billboardId: b.id,
      billboardName: b.name,
      expectedSlug,
      matchesSlug,
      matchesId,
      found: matchesSlug || matchesId
    })
    return matchesSlug || matchesId
  })
  
  // Log para depuración
  useEffect(() => {
    if (billboard) {
      console.log('📥 Billboard cargado:', billboard)
      console.log('🖼️ Imágenes del billboard:', billboard.images)
    }
  }, [billboard])

  // Redirección cuando no se encuentra el soporte
  useEffect(() => {
    if (!loading && !billboard) {
      console.log('❌ Billboard no encontrado:', {
        loading,
        billboard,
        paramsSlug: params.slug,
        totalBillboards: billboards.length,
        billboardIds: billboards.slice(0, 5).map(b => b.id)
      })
      setShouldRedirect(true)
      router.push("/vallas-publicitarias")
    }
  }, [loading, billboard, router])

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

  // Redirigir a la página principal si no se encuentra el soporte
  if (!billboard || shouldRedirect) {
    return (
      <div className="container px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirigiendo a espacios publicitarios...</p>
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
    { id: "diseno", name: t('billboards.page.graphicDesign') },
    { id: "impresion", name: t('billboards.page.bannerPrinting') },
    { id: "instalacion", name: t('billboards.page.billboardInstallation') }
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

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index)
  }

  return (
    <div className="container px-4 py-8 md:px-6 md:py-12" style={{ scrollBehavior: 'auto' }}>
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
            {t('billboards.page.backToSpaces')}
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
            <h3 className="text-lg font-semibold mb-3">{t('billboards.page.location')}</h3>
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
                    {t('billboards.page.location')}: {displayData.location}
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
            <h3 className="font-semibold text-lg">{t('billboards.page.spaceCharacteristics')}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Ruler className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="font-medium">{displayData.technicalSpecs.dimension}</div>
                  <div className="text-sm text-muted-foreground">{t('billboards.page.dimension')}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Monitor className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="font-medium">{displayData.technicalSpecs.tipo}</div>
                  <div className="text-sm text-muted-foreground">{t('billboards.page.supportType')}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Eye className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="font-medium">{displayData.technicalSpecs.impactos}</div>
                  <div className="text-sm text-muted-foreground">{t('billboards.page.dailyImpacts')}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Lightbulb className={`h-5 w-5 ${displayData.technicalSpecs.iluminacion === 'Sí' ? 'text-yellow-500' : 'text-gray-400'}`} />
                <div>
                  <div className="font-medium">{displayData.technicalSpecs.iluminacion}</div>
                  <div className="text-sm text-muted-foreground">{t('billboards.page.lighting')}</div>
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
                  {t('billboards.page.quoteSpace')}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Fecha de inicio */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('billboards.page.startDate')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedStartDate ? new Date(selectedStartDate).toLocaleDateString('es-ES') : t('billboards.page.selectDate')}
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
                <Label className="text-sm font-medium">{t('billboards.page.rentalMonths')}</Label>
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
                <Label className="text-sm font-medium">{t('billboards.page.additionalServices')}</Label>
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
                {t('billboards.page.requestQuote')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sección de Otros soportes similares */}
      <section className="mt-16 py-12">
        <div className="container px-4 md:px-6">
          <h2 className="text-2xl font-bold tracking-tight text-center mb-8 md:text-3xl text-balance">
            {t('billboards.page.similarSupports')}
          </h2>
          <SimilarSupportsCarousel 
            billboards={billboards} 
            currentBillboardId={billboard.id} 
          />
        </div>
      </section>
    </div>
  )
}
