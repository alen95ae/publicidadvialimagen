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
                src="https://static.wixstatic.com/media/b65fb5_8fd3709d0d594afa929ee87f71e3c01a~mv2.jpg/v1/fill/w_1200,h_714,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/b65fb5_8fd3709d0d594afa929ee87f71e3c01a~mv2.jpg"
                alt="Valla publicitaria Publicidad Vial Imagen"
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
          <div className="relative">
            <div className="flex animate-scroll gap-8 pb-4">
              {/* First set of cities */}
              <div className="flex-shrink-0 text-center">
                <img src="/city-madrid.svg" alt="Madrid" className="mx-auto mb-2 w-20 h-20" />
                <p className="text-sm font-medium text-muted-foreground">Madrid</p>
              </div>
              <div className="flex-shrink-0 text-center">
                <img src="/city-barcelona.svg" alt="Barcelona" className="mx-auto mb-2 w-20 h-20" />
                <p className="text-sm font-medium text-muted-foreground">Barcelona</p>
              </div>
              <div className="flex-shrink-0 text-center">
                <img src="/city-valencia.svg" alt="Valencia" className="mx-auto mb-2 w-20 h-20" />
                <p className="text-sm font-medium text-muted-foreground">Valencia</p>
              </div>
              <div className="flex-shrink-0 text-center">
                <img src="/city-sevilla.svg" alt="Sevilla" className="mx-auto mb-2 w-20 h-20" />
                <p className="text-sm font-medium text-muted-foreground">Sevilla</p>
              </div>
              <div className="flex-shrink-0 text-center">
                <img src="/city-bilbao.svg" alt="Bilbao" className="mx-auto mb-2 w-20 h-20" />
                <p className="text-sm font-medium text-muted-foreground">Bilbao</p>
              </div>
              <div className="flex-shrink-0 text-center">
                <img src="/city-malaga.svg" alt="Málaga" className="mx-auto mb-2 w-20 h-20" />
                <p className="text-sm font-medium text-muted-foreground">Málaga</p>
              </div>
              <div className="flex-shrink-0 text-center">
                <img src="/city-zaragoza.svg" alt="Zaragoza" className="mx-auto mb-2 w-20 h-20" />
                <p className="text-sm font-medium text-muted-foreground">Zaragoza</p>
              </div>
              <div className="flex-shrink-0 text-center">
                <img src="/city-murcia.svg" alt="Murcia" className="mx-auto mb-2 w-20 h-20" />
                <p className="text-sm font-medium text-muted-foreground">Murcia</p>
              </div>
              <div className="flex-shrink-0 text-center">
                <img src="/city-palma.svg" alt="Palma" className="mx-auto mb-2 w-20 h-20" />
                <p className="text-sm font-medium text-muted-foreground">Palma</p>
              </div>
              {/* Duplicate set for infinite scroll */}
              <div className="flex-shrink-0 text-center">
                <img src="/city-madrid.svg" alt="Madrid" className="mx-auto mb-2 w-20 h-20" />
                <p className="text-sm font-medium text-muted-foreground">Madrid</p>
              </div>
              <div className="flex-shrink-0 text-center">
                <img src="/city-barcelona.svg" alt="Barcelona" className="mx-auto mb-2 w-20 h-20" />
                <p className="text-sm font-medium text-muted-foreground">Barcelona</p>
              </div>
              <div className="flex-shrink-0 text-center">
                <img src="/city-valencia.svg" alt="Valencia" className="mx-auto mb-2 w-20 h-20" />
                <p className="text-sm font-medium text-muted-foreground">Valencia</p>
              </div>
              <div className="flex-shrink-0 text-center">
                <img src="/city-sevilla.svg" alt="Sevilla" className="mx-auto mb-2 w-20 h-20" />
                <p className="text-sm font-medium text-muted-foreground">Sevilla</p>
              </div>
              <div className="flex-shrink-0 text-center">
                <img src="/city-bilbao.svg" alt="Bilbao" className="mx-auto mb-2 w-20 h-20" />
                <p className="text-sm font-medium text-muted-foreground">Bilbao</p>
              </div>
              <div className="flex-shrink-0 text-center">
                <img src="/city-malaga.svg" alt="Málaga" className="mx-auto mb-2 w-20 h-20" />
                <p className="text-sm font-medium text-muted-foreground">Málaga</p>
              </div>
              <div className="flex-shrink-0 text-center">
                <img src="/city-zaragoza.svg" alt="Zaragoza" className="mx-auto mb-2 w-20 h-20" />
                <p className="text-sm font-medium text-muted-foreground">Zaragoza</p>
              </div>
              <div className="flex-shrink-0 text-center">
                <img src="/city-murcia.svg" alt="Murcia" className="mx-auto mb-2 w-20 h-20" />
                <p className="text-sm font-medium text-muted-foreground">Murcia</p>
              </div>
              <div className="flex-shrink-0 text-center">
                <img src="/city-palma.svg" alt="Palma" className="mx-auto mb-2 w-20 h-20" />
                <p className="text-sm font-medium text-muted-foreground">Palma</p>
              </div>
            </div>
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

      <section className="bg-muted py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <h2 className="text-2xl font-bold tracking-tight text-center mb-8 md:text-3xl text-balance">
            Nuestros Clientes
          </h2>
          <div className="flex flex-col">
            {/* First row - 5 logos */}
            <div className="flex justify-center items-center">
              <img src="/client-samsung-new.svg" alt="Samsung" className="h-20 w-auto" />
              <img src="/client-bcp.svg" alt="BCP" className="h-20 w-auto" />
              <img src="/client-pacena.svg" alt="Paceña" className="h-20 w-auto" />
              <img src="/client-coca-cola-new.svg" alt="Coca-Cola" className="h-20 w-auto" />
              <img src="/client-bnb.svg" alt="BNB" className="h-20 w-auto" />
            </div>
            {/* Second row - 5 logos */}
            <div className="flex justify-center items-center">
              <img src="/client-yaigo.svg" alt="Yaigo" className="h-20 w-auto" />
              <img src="/client-pedidosya.svg" alt="PedidosYa" className="h-20 w-auto" />
              <img src="/client-tigo.svg" alt="Tigo" className="h-20 w-auto" />
              <img src="/client-lg.svg" alt="LG" className="h-20 w-auto" />
              <img src="/client-sprite.svg" alt="Sprite" className="h-20 w-auto" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-primary text-primary-foreground py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center text-center space-y-4 md:space-y-6">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl text-balance">Mantente Informado</h2>
            <p className="max-w-[600px] text-primary-foreground/90 md:text-lg text-pretty">
              Suscríbete para recibir ofertas especiales, nuevos espacios disponibles y consejos de marketing.
            </p>
            <div className="flex w-full max-w-md flex-col gap-2 sm:flex-row">
              <Input
                type="email"
                placeholder="Ingresa tu email"
                className="bg-primary-foreground text-foreground border-0"
              />
              <Button variant="secondary" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                Suscribirse
              </Button>
            </div>
            <p className="text-xs text-primary-foreground/70">
              Al suscribirte, aceptas nuestros Términos de Servicio y Política de Privacidad.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
