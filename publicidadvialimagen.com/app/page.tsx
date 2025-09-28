"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  TruckIcon,
  ShieldCheck,
  Clock,
  CreditCard,
  Monitor,
  Building2,
  Smartphone,
  Eye,
  Calendar,
  MapPin,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const advertisingCategories = [
    {
      id: 1,
      name: "Pantallas LED",
      icon: Monitor,
      description: "Publicidad digital de alto impacto",
      image: "/placeholder.svg?height=300&width=400",
    },
    {
      id: 2,
      name: "Vallas Tradicionales",
      icon: Building2,
      description: "Espacios publicitarios clásicos",
      image: "/placeholder.svg?height=300&width=400",
    },
    {
      id: 3,
      name: "Mobiliario Urbano",
      icon: TruckIcon,
      description: "Paradas de autobús y mobiliario",
      image: "/placeholder.svg?height=300&width=400",
    },
    {
      id: 4,
      name: "Publicidad Móvil",
      icon: Smartphone,
      description: "Vehículos y displays móviles",
      image: "/placeholder.svg?height=300&width=400",
    },
  ]

  const featuredBillboards = [
    {
      id: 1,
      name: "Pantalla LED Premium - Centro Madrid",
      image: "/placeholder.svg?height=300&width=400",
      monthlyPrice: 2500,
      location: "Gran Vía, Madrid",
      visibility: "Alto tráfico",
      dimensions: "6x3 metros",
      type: "LED Digital",
    },
    {
      id: 2,
      name: "Valla Tradicional - Autopista A-1",
      image: "/placeholder.svg?height=300&width=400",
      monthlyPrice: 1200,
      location: "Autopista A-1, Km 15",
      visibility: "Muy alto tráfico",
      dimensions: "8x4 metros",
      type: "Impresa",
    },
    {
      id: 3,
      name: "Parada de Autobús - Zona Comercial",
      image: "/placeholder.svg?height=300&width=400",
      monthlyPrice: 800,
      location: "Centro Comercial Xanadú",
      visibility: "Medio-alto tráfico",
      dimensions: "2x1.5 metros",
      type: "Backlight",
    },
    {
      id: 4,
      name: "Pantalla LED Móvil - Eventos",
      image: "/placeholder.svg?height=300&width=400",
      monthlyPrice: 1800,
      location: "Servicio móvil Madrid",
      visibility: "Eventos y zonas específicas",
      dimensions: "4x2 metros",
      type: "LED Móvil",
    },
  ]


  return (
    <main className="flex-1">
      <section className="relative bg-gradient-to-br from-background via-card to-muted">
        <div className="container px-4 py-12 md:px-6 md:py-24 lg:py-32">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl text-balance">
                Encuentra tu espacio publicitario ideal
              </h1>
              <p className="max-w-[600px] text-muted-foreground md:text-xl text-pretty">
                Conectamos tu marca con audiencias masivas a través de vallas publicitarias estratégicamente ubicadas y
                servicios de impresión de alta calidad.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="font-medium bg-primary hover:bg-primary/90" asChild>
                  <Link href="/billboards">Explorar Vallas</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="font-medium border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent"
                >
                  <Link href="/print-shop">Servicios de Impresión</Link>
                </Button>
              </div>
            </div>
            <div className="relative h-[300px] sm:h-[400px] lg:h-[500px] rounded-xl overflow-hidden">
              <Image
                src="/vallas_publicitarias_en_bolivia.png"
                alt="Vallas publicitarias en Bolivia"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Cities Carousel Section */}
      <section className="py-12 md:py-16 bg-background overflow-hidden">
        <div className="container px-4 md:px-6">
          <h2 className="text-2xl font-bold tracking-tight text-center mb-8 md:text-3xl text-balance">
            Compara soportes disponibles en tu ciudad
          </h2>
          <div className="flex justify-center items-center gap-8 pb-4 flex-wrap">
            <Link href="/billboards?city=La Paz" className="flex-shrink-0 text-center group">
              <img src="/vallas_publicitarias_la_paz.png" alt="La Paz" className="mx-auto mb-2 w-28 h-28 rounded-full object-cover group-hover:scale-105 transition-transform" />
              <p className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">La Paz</p>
            </Link>
            <Link href="/billboards?city=Santa Cruz" className="flex-shrink-0 text-center group">
              <img src="/vallas_publicitarias_santa_cruz_de_la_sierra.png" alt="Santa Cruz" className="mx-auto mb-2 w-28 h-28 rounded-full object-cover group-hover:scale-105 transition-transform" />
              <p className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">Santa Cruz</p>
            </Link>
            <Link href="/billboards?city=Cochabamba" className="flex-shrink-0 text-center group">
              <img src="/vallas_publicitarias_cochabamba.png" alt="Cochabamba" className="mx-auto mb-2 w-28 h-28 rounded-full object-cover group-hover:scale-105 transition-transform" />
              <p className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">Cochabamba</p>
            </Link>
            <Link href="/billboards?city=El Alto" className="flex-shrink-0 text-center group">
              <img src="/vallas_publicitarias_el_alto.png" alt="El Alto" className="mx-auto mb-2 w-28 h-28 rounded-full object-cover group-hover:scale-105 transition-transform" />
              <p className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">El Alto</p>
            </Link>
            <Link href="/billboards?city=Sucre" className="flex-shrink-0 text-center group">
              <img src="/vallas_publicitarias_sucre.png" alt="Sucre" className="mx-auto mb-2 w-28 h-28 rounded-full object-cover group-hover:scale-105 transition-transform" />
              <p className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">Sucre</p>
            </Link>
            <Link href="/billboards?city=Potosí" className="flex-shrink-0 text-center group">
              <img src="/vallas_publicitarias_potosi.png" alt="Potosí" className="mx-auto mb-2 w-28 h-28 rounded-full object-cover group-hover:scale-105 transition-transform" />
              <p className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">Potosí</p>
            </Link>
            <Link href="/billboards?city=Tarija" className="flex-shrink-0 text-center group">
              <img src="/vallas_publicitarias_tarija.png" alt="Tarija" className="mx-auto mb-2 w-28 h-28 rounded-full object-cover group-hover:scale-105 transition-transform" />
              <p className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">Tarija</p>
            </Link>
            <Link href="/billboards?city=Oruro" className="flex-shrink-0 text-center group">
              <img src="/vallas_publicitarias_oruro.png" alt="Oruro" className="mx-auto mb-2 w-28 h-28 rounded-full object-cover group-hover:scale-105 transition-transform" />
              <p className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">Oruro</p>
            </Link>
            <Link href="/billboards?city=Trinidad" className="flex-shrink-0 text-center group">
              <img src="/vallas_publicitarias_trinidad.png" alt="Trinidad" className="mx-auto mb-2 w-28 h-28 rounded-full object-cover group-hover:scale-105 transition-transform" />
              <p className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">Trinidad</p>
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-muted py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <h2 className="text-2xl font-bold tracking-tight text-center mb-8 md:text-3xl text-balance">
            Nuestros Servicios de Publicidad
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {advertisingCategories.map((category) => {
              const IconComponent = category.icon
              return (
                <Link
                  key={category.id}
                  href={`/billboards/${category.name.toLowerCase().replace(/\s+/g, "-")}`}
                  className="group relative overflow-hidden rounded-lg bg-background shadow-md transition-all hover:shadow-lg hover:scale-105"
                >
                  <div className="aspect-square relative">
                    <Image
                      src={category.image || "/placeholder.svg"}
                      alt={category.name}
                      fill
                      className="object-cover transition-transform group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute top-4 left-4">
                      <div className="w-12 h-12 bg-primary/90 rounded-lg flex items-center justify-center">
                        <IconComponent className="h-6 w-6 text-primary-foreground" />
                      </div>
                    </div>
                    <div className="absolute bottom-0 w-full p-4">
                      <h3 className="text-lg font-semibold text-white mb-1">{category.name}</h3>
                      <p className="text-sm text-white/80">{category.description}</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredBillboards.map((billboard) => (
              <div key={billboard.id} className="group relative">
                <div className="aspect-[4/3] overflow-hidden rounded-lg bg-background border">
                  <Image
                    src={billboard.image || "/placeholder.svg"}
                    alt={billboard.name}
                    width={400}
                    height={300}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    <Badge variant="secondary" className="bg-primary text-primary-foreground">
                      {billboard.type}
                    </Badge>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 bg-black/50">
                    <Button className="mx-auto bg-primary hover:bg-primary/90">
                      <Eye className="mr-2 h-4 w-4" />
                      Ver Detalles
                    </Button>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <h3 className="font-medium text-sm text-balance">{billboard.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {billboard.location}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {billboard.dimensions} • {billboard.visibility}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-primary text-lg">
                      €{billboard.monthlyPrice.toLocaleString()}/mes
                    </span>
                    <Button size="sm" variant="outline" className="text-xs bg-transparent">
                      <Calendar className="mr-1 h-3 w-3" />
                      Reservar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button
              variant="outline"
              size="lg"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent"
              asChild
            >
              <Link href="/billboards">Ver Todos los Espacios</Link>
            </Button>
          </div>
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
                src="/placeholder.svg?height=400&width=500"
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
          
          <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-foreground mb-2">
                  Nombre
                </label>
                <Input
                  id="nombre"
                  type="text"
                  placeholder="Nombre"
                  className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
                />
              </div>
              
              <div>
                <label htmlFor="telefono" className="block text-sm font-medium text-foreground mb-2">
                  Teléfono <span className="text-primary">*</span>
                </label>
                <Input
                  id="telefono"
                  type="tel"
                  placeholder="Teléfono"
                  required
                  className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
                />
              </div>
              
              <div>
                <label htmlFor="ciudad" className="block text-sm font-medium text-foreground mb-2">
                  Ciudad
                </label>
                <Input
                  id="ciudad"
                  type="text"
                  placeholder="Ciudad"
                  className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Subir archivo
                </label>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-lg border-gray-300 hover:bg-gray-50 text-gray-700"
                >
                  Subir archivo +
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  Subir archivo compatible (máximo 15 MB)
                </p>
              </div>
            </div>
            
            {/* Right Column */}
            <div className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Email <span className="text-primary">*</span>
                </label>
              <Input
                  id="email"
                type="email"
                  placeholder="Correo electrónico"
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
                  type="text"
                  placeholder="Empresa"
                  className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
                />
              </div>
              
              <div>
                <label htmlFor="mensaje" className="block text-sm font-medium text-foreground mb-2">
                  Tu mensaje
                </label>
                <textarea
                  id="mensaje"
                  rows={6}
                  placeholder="Escribe aquí"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-primary resize-none"
                />
              </div>
            </div>
          </form>
          
          <div className="flex justify-end mt-8">
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-lg font-medium"
            >
              Enviar consulta
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
