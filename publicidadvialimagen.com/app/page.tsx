"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import useEmblaCarousel from 'embla-carousel-react'
import {
  TruckIcon,
  ShieldCheck,
  Clock,
  CreditCard,
  Monitor,
  Building2,
  Smartphone,
  MonitorPlay,
  Eye,
  Calendar,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Ruler,
  FileText,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useMessages } from "@/hooks/use-messages"
import { useBillboards, type Billboard } from "@/hooks/use-billboards"


const cities = [
  { name: "La Paz", image: "/vallas_publicitarias_la_paz.png" },
  { name: "Santa Cruz", image: "/vallas_publicitarias_santa_cruz_de_la_sierra.png" },
  { name: "Cochabamba", image: "/vallas_publicitarias_cochabamba.png" },
  { name: "El Alto", image: "/vallas_publicitarias_el_alto.png" },
  { name: "Sucre", image: "/vallas_publicitarias_sucre.png" },
  { name: "Potosí", image: "/vallas_publicitarias_potosi.png" },
  { name: "Tarija", image: "/vallas_publicitarias_tarija.png" },
  { name: "Oruro", image: "/vallas_publicitarias_oruro.png" },
  { name: "Trinidad", image: "/vallas_publicitarias_trinidad.png" },
  { name: "Cobija", image: "/vallas_publicitarias_cobija.png" },
]

function CitiesCarousel() {
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

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-3">
          {cities.map((city, index) => (
            <div key={index} className="flex-[0_0_auto] min-w-[140px]">
              <Link href={`/vallas-publicitarias?city=${city.name}`} className="text-center group block">
                <img 
                  src={city.image} 
                  alt={city.name} 
                  className="mx-auto mb-2 w-28 h-28 rounded-full object-cover group-hover:scale-105 transition-transform" 
                />
                <p className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                  {city.name}
                </p>
              </Link>
            </div>
          ))}
        </div>
      </div>
      
      {/* Botones de navegación */}
      <button
        onClick={scrollPrev}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Ciudad anterior"
      >
        <ChevronLeft className="w-6 h-6 text-gray-700 dark:text-gray-200" />
      </button>
      
      <button
        onClick={scrollNext}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Siguiente ciudad"
      >
        <ChevronRight className="w-6 h-6 text-gray-700 dark:text-gray-200" />
      </button>
    </div>
  )
}

function FeaturedBillboardsCarousel({ billboards }: { billboards: Billboard[] }) {
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

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4 pb-4">
          {billboards.map((billboard) => (
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

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    empresa: '',
    mensaje: ''
  })
  // Anti-spam fields (honeypot + JS/time validation)
  const [antiSpam, setAntiSpam] = useState({ website: '', ts: '', js: '0' })

  // Initialize anti-spam fields on mount
  useEffect(() => {
    setAntiSpam({ website: '', ts: String(Date.now()), js: '1' })
  }, [])
  const { addMessage } = useMessages()
  const { billboards, loading, error } = useBillboards()
  
  // Debug logs
  useEffect(() => {
    console.log('🏠 HomePage - billboards:', billboards.length, 'loading:', loading, 'error:', error)
  }, [billboards, loading, error])

  // Debug: Verificar que el componente se está renderizando
  console.log('HomePage component rendering')
  console.log('Billboards loaded:', billboards.length)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.nombre,
          email: formData.email,
          phone: formData.telefono,
          company: formData.empresa,
          message: formData.mensaje,
          origin: 'Home',
          // Anti-spam metadata
          website: antiSpam.website,
          ts: Number(antiSpam.ts),
          js: antiSpam.js
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error sending message:', errorData)
        alert('Error al enviar el mensaje. Por favor, inténtalo de nuevo.')
        return
      }

      // Guardar mensaje en localStorage también
      await addMessage({
        asunto: `Mensaje desde página principal - ${formData.nombre}`,
        mensaje: formData.mensaje,
        email: formData.email
      })

      setFormSubmitted(true)
      setFormData({
        nombre: '',
        email: '',
        telefono: '',
        empresa: '',
        mensaje: ''
      })
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Error al enviar el mensaje. Por favor, inténtalo de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const advertisingCategories = [
    {
      id: 1,
      name: "Vallas Publicitarias",
      icon: Monitor,
      description: "",
      image: "/vallas_publicitarias_imagen.png",
    },
    {
      id: 2,
      name: "Pantallas LED",
      icon: MonitorPlay,
      description: "",
      image: "/pantallas_publicitarias_imagen.png",
    },
    {
      id: 3,
      name: "Murales",
      icon: Building2,
      description: "",
      image: "/murales_publicitarios_imagen.png",
    },
    {
      id: 4,
      name: "Publicidad Móvil",
      icon: TruckIcon,
      description: "",
      image: "/publicidad_movil_imagen.png",
    },
  ]

  // Seleccionar los primeros 7 soportes disponibles como destacados
  const featuredBillboards = billboards.filter(b => b.available).slice(0, 7)


  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Texto a la izquierda */}
          <div className="text-left text-black z-10">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Vallas Publicitarias en Bolivia
            </h1>
            <p className="text-muted-foreground md:text-lg text-pretty mb-8">
              Conectamos tu marca con audiencias masivas a través de espacios publicitarios estratégicamente ubicados.
            </p>
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 py-4" asChild>
              <Link href="/vallas-publicitarias">Explorar Vallas</Link>
            </Button>
          </div>
          
          {/* Imagen a la derecha */}
          <div className="relative h-[300px] sm:h-[400px] rounded-2xl overflow-hidden">
            <Image
              src="/vallas_publicitarias_en_bolivia.png"
              alt="Vallas Publicitarias en Bolivia"
              fill
              className="object-cover rounded-2xl"
              priority
            />
          </div>
        </div>
      </section>

      {/* Cities Carousel Section */}
      <section className="py-12 md:py-16 bg-background overflow-hidden">
        <div className="container px-4 md:px-6">
          <h2 className="text-2xl font-bold tracking-tight text-center mb-8 md:text-3xl text-balance">
            Compara soportes disponibles en tu ciudad
          </h2>
          <CitiesCarousel />
        </div>
      </section>

      <section className="bg-muted py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <h2 className="text-2xl font-bold tracking-tight text-center mb-8 md:text-3xl text-balance">
            Nuestros Servicios de Publicidad Exterior
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {advertisingCategories.map((category) => {
              const IconComponent = category.icon
              return (
                <Link
                  key={category.id}
                  href={`/vallas-publicitarias?tipo_soporte=${encodeURIComponent(category.name)}`}
                  className="group relative overflow-hidden rounded-lg bg-background shadow-md transition-all hover:shadow-lg hover:scale-105"
                >
                  <div className="aspect-[4/3] relative">
                    <Image
                      src={category.image || "/placeholder.svg"}
                      alt={category.name}
                      fill
                      className="object-cover transition-transform group-hover:scale-110"
                    />
                    {category.name !== "Pantallas LED" && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    )}
                    <div className="absolute top-4 left-4">
                      <div className="w-12 h-12 bg-primary/90 rounded-lg flex items-center justify-center">
                        <IconComponent className="h-6 w-6 text-primary-foreground" />
                      </div>
                    </div>
                    <div className="absolute bottom-0 w-full p-4">
                      <h3 className="text-lg font-semibold text-white mb-1">{category.name}</h3>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <h2 className="text-2xl font-bold tracking-tight text-center mb-8 md:text-3xl text-balance">
            Espacios Publicitarios Destacados
          </h2>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Cargando espacios publicitarios...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Error al cargar los espacios. Por favor, intenta más tarde.</p>
            </div>
          ) : featuredBillboards.length > 0 ? (
            <>
              <FeaturedBillboardsCarousel billboards={featuredBillboards} />
              <div className="mt-10 text-center">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent"
                  asChild
                >
                  <Link href="/vallas-publicitarias">Ver Todos los Espacios</Link>
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No hay espacios publicitarios disponibles en este momento.</p>
            </div>
          )}
        </div>
      </section>

      <section className="bg-card py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl text-balance">
                Servicios de Impresión a Medida
              </h2>
              <p className="text-muted-foreground md:text-lg text-pretty">
                Complementa tu estrategia publicitaria con nuestros servicios de impresión profesional. Vinilos
                adhesivos, lonas, banners y más, calculados por metro cuadrado.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Materiales de alta durabilidad
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Entrega rápida garantizada
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Acabados profesionales
                </li>
              </ul>
              <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground" asChild>
                <Link href="/print-shop">Explorar Impresión</Link>
              </Button>
            </div>
            <div className="relative h-[300px] sm:h-[400px] rounded-xl overflow-hidden">
              <Image
                src="/impresion_digital_imagen.png"
                alt="Servicios de impresión profesional"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <h2 className="text-2xl font-bold tracking-tight text-center mb-8 md:text-3xl text-balance">
            Por Qué Elegir Publicidad Vial Imagen
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-background border-border">
              <CardContent className="flex flex-col items-center text-center p-6">
                <MapPin className="h-10 w-10 mb-4 text-primary" />
                <h3 className="text-lg font-semibold mb-2">Ubicaciones Premium</h3>
                <p className="text-muted-foreground text-sm">
                  Espacios publicitarios en las mejores ubicaciones con máximo impacto visual.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-background border-border">
              <CardContent className="flex flex-col items-center text-center p-6">
                <ShieldCheck className="h-10 w-10 mb-4 text-primary" />
                <h3 className="text-lg font-semibold mb-2">Calidad Garantizada</h3>
                <p className="text-muted-foreground text-sm">
                  Todos nuestros espacios y servicios cumplen los más altos estándares de calidad.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-background border-border">
              <CardContent className="flex flex-col items-center text-center p-6">
                <Clock className="h-10 w-10 mb-4 text-primary" />
                <h3 className="text-lg font-semibold mb-2">Soporte 24/7</h3>
                <p className="text-muted-foreground text-sm">
                  Nuestro equipo está disponible para ayudarte en cualquier momento.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-background border-border">
              <CardContent className="flex flex-col items-center text-center p-6">
                <CreditCard className="h-10 w-10 mb-4 text-primary" />
                <h3 className="text-lg font-semibold mb-2">Pago Seguro</h3>
                <p className="text-muted-foreground text-sm">
                  Múltiples opciones de pago seguras para tu comodidad y tranquilidad.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Clients Section */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-background to-muted/30">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-4 md:text-4xl">
              Confían en Nosotros
          </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Empresas líderes que han elegido nuestros espacios publicitarios para potenciar su marca
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-12 max-w-6xl mx-auto">
            {/* First row */}
            <div className="flex flex-col items-center group">
              <div className="w-28 h-28 md:w-28 md:h-28 rounded-full bg-gray-700 dark:bg-gray-600 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105 border border-gray-200 dark:border-gray-600 overflow-hidden">
                <img src="/Cliente1.svg" alt="Cliente 1" className="w-full h-full object-cover" />
              </div>
            </div>
            
            <div className="flex flex-col items-center group">
              <div className="w-28 h-28 md:w-28 md:h-28 rounded-full bg-gray-700 dark:bg-gray-600 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105 border border-gray-200 dark:border-gray-600 overflow-hidden">
                <img src="/Cliente2.svg" alt="Cliente 2" className="w-full h-full object-cover" />
              </div>
            </div>
            
            <div className="flex flex-col items-center group">
              <div className="w-28 h-28 md:w-28 md:h-28 rounded-full bg-gray-700 dark:bg-gray-600 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105 border border-gray-200 dark:border-gray-600 overflow-hidden">
                <img src="/Cliente3.svg" alt="Cliente 3" className="w-full h-full object-cover" />
              </div>
            </div>
            
            <div className="flex flex-col items-center group">
              <div className="w-28 h-28 md:w-28 md:h-28 rounded-full bg-gray-700 dark:bg-gray-600 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105 border border-gray-200 dark:border-gray-600 overflow-hidden">
                <img src="/Cliente4.svg" alt="Cliente 4" className="w-full h-full object-cover" />
              </div>
            </div>
            
            <div className="flex flex-col items-center group">
              <div className="w-28 h-28 md:w-28 md:h-28 rounded-full bg-gray-700 dark:bg-gray-600 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105 border border-gray-200 dark:border-gray-600 overflow-hidden">
                <img src="/Cliente5.svg" alt="Cliente 5" className="w-full h-full object-cover" />
              </div>
            </div>
            
            {/* Second row */}
            <div className="flex flex-col items-center group">
              <div className="w-28 h-28 md:w-28 md:h-28 rounded-full bg-gray-700 dark:bg-gray-600 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105 border border-gray-200 dark:border-gray-600 overflow-hidden">
                <img src="/Cliente6.svg" alt="Cliente 6" className="w-full h-full object-cover" />
              </div>
            </div>
            
            <div className="flex flex-col items-center group">
              <div className="w-28 h-28 md:w-28 md:h-28 rounded-full bg-gray-700 dark:bg-gray-600 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105 border border-gray-200 dark:border-gray-600 overflow-hidden">
                <img src="/Cliente7.svg" alt="Cliente 7" className="w-full h-full object-cover" />
              </div>
            </div>
            
            <div className="flex flex-col items-center group">
              <div className="w-28 h-28 md:w-28 md:h-28 rounded-full bg-gray-700 dark:bg-gray-600 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105 border border-gray-200 dark:border-gray-600 overflow-hidden">
                <img src="/Cliente8.svg" alt="Cliente 8" className="w-full h-full object-cover" />
              </div>
            </div>
            
            <div className="flex flex-col items-center group">
              <div className="w-28 h-28 md:w-28 md:h-28 rounded-full bg-gray-700 dark:bg-gray-600 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105 border border-gray-200 dark:border-gray-600 overflow-hidden">
                <img src="/Cliente9.svg" alt="Cliente 9" className="w-full h-full object-cover" />
              </div>
            </div>
            
            <div className="flex flex-col items-center group">
              <div className="w-28 h-28 md:w-28 md:h-28 rounded-full bg-gray-700 dark:bg-gray-600 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105 border border-gray-200 dark:border-gray-600 overflow-hidden">
                <img src="/Cliente10.svg" alt="Cliente 10" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
          
          {/* Stats section */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">+400</div>
              <div className="text-muted-foreground">Soportes Publicitarios</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">+1000</div>
              <div className="text-muted-foreground">Clientes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">+36</div>
              <div className="text-muted-foreground">Años de Experiencia</div>
            </div>
          </div>
          
          {/* Premio Maya 2023 */}
          <div className="mt-16 text-center">
            <h3 className="text-2xl font-bold tracking-tight text-center mb-4 md:text-3xl text-balance">Ganador Premios Maya 2023</h3>
            <p className="text-muted-foreground md:text-lg text-pretty mb-6">A mejor empresa de publicidad vial</p>
            <div className="flex justify-center">
              <div className="w-32 h-32 rounded-full shadow-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center overflow-hidden">
                <svg id="Capa_1" data-name="Capa 1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 1080 1080" className="w-full h-full">
                  <defs>
                    <style>{`.cls-1{fill:#141414;}.cls-2{fill:url(#linear-gradient);}.cls-3{fill:url(#linear-gradient-2);}.cls-4{fill:url(#linear-gradient-3);}.cls-5{fill:url(#linear-gradient-4);}.cls-6{fill:url(#linear-gradient-5);}.cls-7{fill:url(#linear-gradient-6);}.cls-8{fill:url(#linear-gradient-7);}.cls-9{fill:url(#linear-gradient-8);}.cls-10{fill:url(#linear-gradient-9);}.cls-11{fill:url(#linear-gradient-10);}.cls-12{fill:#d3d3d3;}`}</style>
                    <linearGradient id="linear-gradient" x1="366.79" y1="410.85" x2="668.18" y2="410.85" gradientUnits="userSpaceOnUse">
                      <stop offset="0" stopColor="#fefefe"/>
                      <stop offset="0.09" stopColor="#e6e6e6"/>
                      <stop offset="0.28" stopColor="#aaa9a9"/>
                      <stop offset="0.29" stopColor="#a7a6a6"/>
                      <stop offset="0.3" stopColor="#ababab"/>
                      <stop offset="0.42" stopColor="#d6d6d6"/>
                      <stop offset="0.52" stopColor="#f0f0f0"/>
                      <stop offset="0.58" stopColor="#fafafa"/>
                      <stop offset="0.62" stopColor="#f4f4f4"/>
                      <stop offset="0.68" stopColor="#e3e3e3"/>
                      <stop offset="0.74" stopColor="#c8c7c7"/>
                      <stop offset="0.8" stopColor="#a7a6a6"/>
                      <stop offset="0.82" stopColor="#afafaf"/>
                      <stop offset="0.9" stopColor="#dadada"/>
                      <stop offset="0.96" stopColor="#f4f4f4"/>
                      <stop offset="1" stopColor="#fefefe"/>
                    </linearGradient>
                    <linearGradient id="linear-gradient-2" x1="532.74" y1="719.12" x2="742.11" y2="719.12" xlinkHref="#linear-gradient"/>
                    <linearGradient id="linear-gradient-3" x1="121.2" y1="696.81" x2="350.87" y2="696.81" xlinkHref="#linear-gradient"/>
                    <linearGradient id="linear-gradient-4" x1="704.06" y1="696.83" x2="912.92" y2="696.83" xlinkHref="#linear-gradient"/>
                    <linearGradient id="linear-gradient-5" x1="362.52" y1="697.03" x2="572.09" y2="697.03" xlinkHref="#linear-gradient"/>
                    <linearGradient id="linear-gradient-6" x1="467.18" y1="316.89" x2="540.1" y2="316.89" xlinkHref="#linear-gradient"/>
                    <linearGradient id="linear-gradient-7" x1="223.68" y1="718.96" x2="249.67" y2="718.96" xlinkHref="#linear-gradient"/>
                    <linearGradient id="linear-gradient-8" x1="783.74" y1="714.43" x2="834.06" y2="714.43" xlinkHref="#linear-gradient"/>
                    <linearGradient id="linear-gradient-9" x1="442.46" y1="714.13" x2="492.72" y2="714.13" xlinkHref="#linear-gradient"/>
                    <linearGradient id="linear-gradient-10" x1="486.4" y1="219.36" x2="505.7" y2="219.36" xlinkHref="#linear-gradient"/>
                  </defs>
                  <rect className="cls-1" width="1080" height="1080"/>
                  <path className="cls-2" d="M479.45,269.34c-2.34,4-4.91,7.57-6.62,11.5-4.12,9.5-7.7,19.23-11.79,28.75-1.05,2.44-2.71,5.18-4.87,6.52-63.53,39.54-73.62,128.46-20.37,181.05a115.06,115.06,0,0,0,43,26.89c6.07,2.14,8.15.55,6.88-5.74-4.36-21.68-1.08-41.94,10.6-60.8,1.88-3,3.29-6.38,5.33-9.29,16.22-23.06,14.83-47.8,7.25-73.19-.81-2.72-1.44-5.48-2.1-8,.95-.58,1.31-1,1.49-.88,5.91,2.4,12.51,3.46,17.09,8.49a5.7,5.7,0,0,1,1.67,3.28c.15,7,.08,14.05,1.09,21.48.67-1.44,1.4-2.86,2-4.32,12.64-29.79,11.8-59.16-3.27-87.84-4-7.68-4.3-15-1.43-22.92,3.18-8.8,6-17.75,9.3-27.79,5.65,7.65,11,14.5,15.91,21.64,10.34,15,19,30.93,20.1,49.49,1.67,28.3-3,55.63-14.94,81.56-8.9,19.33-21.87,36-34,53.28-10.67,15.11-19.87,30.93-22.32,49.68a102.71,102.71,0,0,0-.77,18,20.44,20.44,0,0,0,20.92,19.52C531,549.4,539.53,540.45,540,529a89.6,89.6,0,0,0-12.7-49.78c-3-5.16-3.15-10.23-.52-15.27,2.77-5.29,6.06-10.3,9.76-16.51C545.57,463.72,555,478.6,554.61,497c-.13,6.64-.92,13.27-1.67,19.88-.72,6.25,1.2,8,7,5.59,32.18-13.32,54.91-36.06,66.6-68.95,17.93-50.44-.2-104.68-44.77-135.18a16.59,16.59,0,0,1-7-9.34c-4.24-13.35-11.95-24.78-20.62-35.62-1.2-1.51-2.38-3-3.66-4.65,9.3-1.41,39.77,12,57,25.15Q658.78,333.23,667,397.4c10.53,81-50.49,157.84-132.62,166.84-84,9.21-159.77-52.1-167-135.71C359.81,340.37,424,281.21,479.45,269.34Z"/>
                  <path className="cls-3" d="M650.53,792.43h-26V748.16a10.32,10.32,0,0,0-2.44-.54c-18.93,1.6-31.29-8.25-40.69-23.29q-23-36.75-46-73.51c-.83-1.32-1.52-2.73-2.69-4.85,10.9,0,21.07-.14,31.23.16,1.4,0,3.1,2,4,3.53,12,18.9,24.06,37.81,35.82,56.87,6.34,10.27,14.51,16.32,27.22,14.9a96.74,96.74,0,0,1,16.06-.33c10.84.59,18.23-4.56,23.73-13.3,11.76-18.69,23.64-37.31,35.18-56.13,2.56-4.17,5.23-6.14,10.34-5.84,8.24.49,16.52.14,25.75.14-1.21,2.15-2,3.66-2.87,5.09Q716.16,688,693,725c-6,9.57-13.46,17.75-24.64,21-5.49,1.6-11.45,1.55-17.85,2.33Z"/>
                  <path className="cls-4" d="M350.87,747.62c-10.46,0-20.2.13-29.92-.14-1.51,0-3.48-1.61-4.38-3q-18.42-28.92-36.55-58c-6.13-9.79-14.18-15.46-26.42-14.79-14.09.78-28.23.54-42.34,1-8.27.25-13.81,5.31-17.95,11.79-11.93,18.69-23.78,37.44-35.3,56.38-3,4.93-6,7.56-12.23,7-7.73-.67-15.55-.16-24.58-.16,2.84-4.67,5.18-8.58,7.61-12.45,14.8-23.58,29.34-47.33,44.54-70.65,8.05-12.35,19.43-19.22,35-18.75,19.31.58,38.66.36,58,.06,14.08-.22,24.75,6.36,31.95,17.32,17.73,27,34.54,54.56,51.7,81.91A15.18,15.18,0,0,1,350.87,747.62Z"/>
                  <path className="cls-5" d="M912.92,747.61c-10.39,0-20.12.13-29.85-.14-1.49,0-3.43-1.6-4.32-3-12-18.86-23.87-37.86-35.94-56.71a63.36,63.36,0,0,0-8.51-10.54c-4.95-4.94-11.36-5.8-18.09-5.39-5.83.35-11.7,1-17.49.59-10.53-.7-17.76,4.13-23.09,12.51-11.75,18.5-23.62,36.92-34.9,55.7-3.29,5.48-6.82,7.61-13.12,7.11-7.55-.59-15.17-.14-23.55-.14,1-1.91,1.5-3.19,2.22-4.35,15.46-24.79,30.78-49.67,46.52-74.28a78.45,78.45,0,0,1,13-15c6.14-5.67,13.74-8.2,22.34-8,12.82.28,25.69.6,38.48,0,15.34-.77,26.7,6.11,34.53,18.08,17.5,26.73,34.13,54,51.09,81.11A12.34,12.34,0,0,1,912.92,747.61Z"/>
                  <path className="cls-6" d="M572.09,747.57c-10.65,0-20.55.18-30.44-.18-1.67-.06-3.74-2.16-4.82-3.84-11.78-18.46-23.64-36.88-35-55.6-7-11.5-15.94-18-30-15.94a79.18,79.18,0,0,1-15.55.45c-10-.54-16.72,4.42-21.73,12.24-10.5,16.39-21.45,32.54-30.91,49.53-5.68,10.2-12.11,15.68-24.2,13.54-5.13-.91-10.55-.15-16.92-.15,3.87-6.38,7.11-11.89,10.5-17.31q19.49-31.12,39.05-62.22c5.74-9.1,12.88-16.76,23.35-20.39a32.45,32.45,0,0,1,10-1.62c13.31-.18,26.65.42,39.93-.2,14.67-.69,25.49,5.74,33.67,16.92,6.59,9,12.24,18.73,18.19,28.21q17,27,33.8,54.07C571.32,745.6,571.49,746.2,572.09,747.57Z"/>
                  <path className="cls-7" d="M502.7,442.72c-15-20.8-25.77-41.59-30.75-65-6-28-7.4-56,1.95-83.63,6.58-19.48,18.11-36.15,29.69-52.85,11.18-16.12,21.82-32.61,32.72-48.93a10.13,10.13,0,0,1,1.37-1.29c3,10.12,2.77,20.08,1.59,30-2.41,20.41-10.4,39.07-18.24,57.8-5.51,13.16-11,26.35-15.75,39.8a96,96,0,0,0-.17,64.91c5.09,14.72,5.47,29.94,2.29,45.15C506.49,433.11,504.58,437.24,502.7,442.72Z"/>
                  <path className="cls-8" d="M223.68,747.6V690.29H249a46.15,46.15,0,0,1,.7,5.7c0,16,0,32.08-.29,48.11,0,1.18-1.65,3.32-2.59,3.35C239.21,747.73,231.61,747.6,223.68,747.6Z"/>
                  <path className="cls-9" d="M783.74,701.17H834c0,8.12.1,16-.15,23.89,0,.9-2,2.49-3.1,2.5-15.56.17-31.12.11-47,.11Z"/>
                  <path className="cls-10" d="M492.72,701.21v25.84H442.46V701.21Z"/>
                  <path className="cls-11" d="M487.4,193.05c6.22,9.26,12.22,17.34,17.17,26,1.57,2.75,1.39,7.49.19,10.62-2,5.19-5.44,9.81-9,16C488.84,228,484.27,211.69,487.4,193.05Z"/>
                  <path className="cls-12" d="M545.93,596.07c-5.66,8.15-10.52,15.11-15.36,22.1-4.45,6.42-4.72,6.44-9.29-.08a222,222,0,0,0-15.8-20.72c0,7,.1,14-.09,21,0,1.43-1.17,2.82-1.79,4.23-.75-1.45-2.11-2.88-2.14-4.35-.21-8.57-.1-17.14-.1-25.7,4.12-1.68,6.65-.62,8.9,2.78,4.9,7.4,10.12,14.57,15.71,22.55,5.47-7.88,10.65-15.06,15.49-22.47,2.2-3.38,4.67-4.62,9-2.84,0,9,.06,18.2-.08,27.39,0,.9-1.24,1.77-1.9,2.65-.73-1-2.07-1.92-2.11-2.92-.21-5.83-.09-11.67-.12-17.5C546.2,600.67,546.07,599.12,545.93,596.07Z"/>
                  <path className="cls-12" d="M834,622.81c-3.25,0-6.51.17-9.75,0-4.18-.28-7.14-2.3-7.46-6.8-.06-.92,1-1.93,1.53-2.89.7.67,1.93,1.28,2,2,.48,3.88,3.06,4.59,6.27,4.59,5.19,0,10.39,0,15.59,0,3.59,0,5.86-1.49,5.88-5.5s-2.14-5-5.59-5.07c-6-.07-12,0-18-.49-6.45-.58-9.2-4.2-7.53-10.31.64-2.33,3.37-5.61,5.37-5.78a139.8,139.8,0,0,1,23.24,0c1.95.16,3.73,3.35,5.37,5.34.28.35-.53,1.6-.84,2.44a14.4,14.4,0,0,1-2.69-1.26c-1.68-1.24-3.17-3.66-4.86-3.78a156,156,0,0,0-18,.1c-3.17.15-4.37,2.4-4.2,5.45s2.07,4.28,4.83,4.34c6,.14,12-.06,18,.27,6.31.35,8.75,3,8.75,8.69,0,5.48-2.31,8.18-7.77,8.58-3.39.25-6.82,0-10.23,0Z"/>
                  <path className="cls-12" d="M321.89,608c.77,5.57,1.38,9.91,2,14.26l-2.27.73c-.6-1.29-1.62-2.56-1.71-3.89-.55-8.16-1-8.71-9.16-8.79-5.66-.05-11.31,0-17.68,0,0,3.47.16,6.66-.09,9.81-.07.89-1.3,1.69-2,2.53-.63-.73-1.79-1.45-1.8-2.19-.14-7.94-.12-15.88-.1-23.82,0-1.41.16-2.83.27-4.53,9.49,0,18.7-.32,27.86.23,2.22.13,5.45,2.71,6.15,4.85C324.66,601.19,325.28,605.9,321.89,608Zm-28.58-.88c7.59,0,14.52.11,21.45,0,3.69-.08,5.29-2.12,5.27-6s-1.55-5.81-5.33-5.85c-7.05-.06-14.1,0-21.39,0Z"/>
                  <path className="cls-12" d="M723.23,622.82c-3.58,0-7.16.13-10.72,0-5.22-.22-8-2.37-8.53-7.53a95.1,95.1,0,0,1,0-16c.33-4.4,3.2-7.27,7.67-7.43,7.78-.28,15.59-.4,23.36,0,5.23.25,7.79,3.46,8.12,9.2a104.85,104.85,0,0,1,0,12.66c-.39,6.28-3.44,9.05-9.67,9.17-3.41.07-6.82,0-10.23,0Zm-.17-3.07c2.92,0,5.84.06,8.76,0,5.43-.15,7.27-2,7.34-7.35.05-3.24,0-6.49,0-9.73,0-5.63-1.83-7.72-7.4-7.94s-11-.21-16.53,0c-6,.27-7.6,2.15-7.76,8.21-.08,3.24-.14,6.49.06,9.72.33,5.28,2.05,6.88,7.26,7C717.55,619.81,720.31,619.74,723.06,619.75Z"/>
                  <path className="cls-12" d="M402.36,595.21v9.91h17.48a17.3,17.3,0,0,1,3.88.06,15.64,15.64,0,0,1,3.29,1.66c-1.16.53-2.32,1.47-3.5,1.51-5.35.17-10.71.06-16.07.09-1.58,0-3.15.15-5,.25V619.1c7.49,0,14.74-.09,22,.07,1.32,0,2.61,1.08,3.91,1.65-1.22.63-2.44,1.78-3.67,1.81-8.58.16-17.15.08-26.14.08V591.83c9.12,0,18.16,0,27.2.08.79,0,1.57,1.12,2.36,1.73-.86.52-1.71,1.47-2.57,1.49-5.68.14-11.36.08-17,.08Z"/>
                  <path className="cls-12" d="M182.7,592c9.73,0,18.79-.28,27.82.11,5,.21,6.61,3.42,6.25,10.62-.26,5.16-2.12,7.38-7,7.5-7.43.17-14.87,0-23.08,0,0,3.41.18,6.44-.1,9.42-.1,1-1.36,2-2.09,3-.61-.93-1.75-1.84-1.76-2.77C182.64,610.83,182.7,601.76,182.7,592Zm4.17,15.19c7.47,0,14.38,0,21.3,0,3.2,0,4.56-2,4.56-5s.32-6.48-3.72-6.67c-7.32-.35-14.67-.1-22.14-.1Z"/>
                  <path className="cls-12" d="M629.32,607.16c0,4.2.13,8.41-.11,12.61-.06,1-1.39,1.93-2.13,2.89-.6-.94-1.7-1.87-1.71-2.82q-.2-12.6,0-25.23c0-.9,1.21-1.78,1.86-2.67.69.87,1.93,1.71,2,2.6C629.43,598.74,629.32,603,629.32,607.16Z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-muted/30 to-background">
        <div className="container px-4 md:px-6 max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold tracking-tight mb-4 md:text-3xl text-balance">
              Contacto
            </h2>
            <p className="text-muted-foreground md:text-lg text-pretty mb-2">
              Contáctenos para una cotización sin compromiso:
            </p>
            <p className="text-muted-foreground">
              Contestaremos en pocos minutos
            </p>
          </div>
          
          {formSubmitted ? (
            <div className="bg-primary/10 text-primary p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-lg mb-2">¡Gracias!</h3>
              <p>Tu mensaje ha sido enviado exitosamente. Te responderemos lo antes posible.</p>
            </div>
          ) : (
            <form id="contact-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Anti-spam hidden fields: do not alter layout */}
              {/* Honeypot: visible to bots, offscreen for users */}
              <input
                type="text"
                name="website"
                value={antiSpam.website}
                onChange={(e) => setAntiSpam(s => ({ ...s, website: e.target.value }))}
                autoComplete="off"
                tabIndex={-1}
                aria-hidden="true"
                style={{ position: 'absolute', left: '-9999px' }}
              />
              {/* Timestamp and JS execution markers */}
              <input type="hidden" name="ts" value={antiSpam.ts} readOnly />
              <input type="hidden" name="js" value={antiSpam.js} readOnly />
              {/* Left Column */}
              <div className="space-y-6">
                <div>
                  <label htmlFor="nombre" className="block text-sm font-medium text-foreground mb-2">
                    Nombre
                  </label>
                  <Input
                    id="nombre"
                    name="nombre"
                    type="text"
                    placeholder="Nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
                  />
                </div>
                
                <div>
                  <label htmlFor="telefono" className="block text-sm font-medium text-foreground mb-2">
                    Teléfono
                  </label>
                  <Input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    placeholder="Teléfono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
                  />
                </div>
              </div>
              
              {/* Right Column */}
              <div className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                    Email
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Correo electrónico"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
                  />
                </div>
                
                <div>
                  <label htmlFor="empresa" className="block text-sm font-medium text-foreground mb-2">
                    Empresa
                  </label>
                  <Input
                    id="empresa"
                    name="empresa"
                    type="text"
                    placeholder="Empresa"
                    value={formData.empresa}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
                  />
                </div>
              </div>
              
              {/* Full Width Message */}
              <div className="col-span-1 md:col-span-2">
                <div>
                  <label htmlFor="mensaje" className="block text-sm font-medium text-foreground mb-2">
                    Mensaje
                  </label>
                  <textarea
                    id="mensaje"
                    name="mensaje"
                    rows={6}
                    placeholder="Escribe tu mensaje aquí (máx. 500 caracteres)"
                    maxLength={500}
                    value={formData.mensaje}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-primary resize-none"
                  />
                </div>
              </div>
            </form>
          )}
          
          {!formSubmitted && (
            <div className="flex justify-end mt-8">
              <Button
                type="submit"
                form="contact-form"
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-lg font-medium"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Enviando...' : 'Enviar consulta'}
              </Button>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
