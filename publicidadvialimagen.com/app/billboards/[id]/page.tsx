"use client"

import { Label } from "@/components/ui/label"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Calendar, MapPin, Users, Zap, Clock, ArrowLeft, Star, Shield, Truck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface BillboardDetailPageProps {
  params: {
    id: string
  }
}

export default function BillboardDetailPage({ params }: BillboardDetailPageProps) {
  const [selectedMonths, setSelectedMonths] = useState<string[]>([])
  const [calendarOpen, setCalendarOpen] = useState(false)

  const billboard = {
    id: Number.parseInt(params.id),
    name: "Pantalla LED Premium - Gran Vía",
    images: [
      "/placeholder.svg?height=400&width=600",
      "/placeholder.svg?height=400&width=600",
      "/placeholder.svg?height=400&width=600",
    ],
    monthlyPrice: 2500,
    location: "Gran Vía 28, Madrid",
    city: "Madrid",
    format: "Digital LED",
    type: "Premium",
    dimensions: "6x3 metros",
    visibility: "Alto tráfico",
    traffic: "150,000 personas/día",
    lighting: "24/7",
    resolution: "1920x1080 Full HD",
    material: "Pantalla LED exterior",
    available: true,
    availableMonths: ["2024-02", "2024-03", "2024-04", "2024-05", "2024-06", "2024-07"],
    features: [
      "Resolución 4K",
      "Contenido dinámico",
      "Ubicación premium",
      "Gestión remota",
      "Soporte técnico 24/7",
      "Análisis de audiencia",
    ],
    description:
      "Ubicada en el corazón de Madrid, esta pantalla LED premium ofrece máxima visibilidad en una de las arterias más transitadas de la capital. Perfecta para campañas de alto impacto que buscan alcanzar una audiencia masiva y diversa.",
    technicalSpecs: {
      resolution: "1920x1080 Full HD",
      brightness: "5000 nits",
      viewingAngle: "160° horizontal / 140° vertical",
      refreshRate: "60Hz",
      connectivity: "4G/WiFi",
      powerConsumption: "800W promedio",
    },
  }

  const availableMonthsData = [
    { month: "2024-02", name: "Febrero 2024", available: true },
    { month: "2024-03", name: "Marzo 2024", available: true },
    { month: "2024-04", name: "Abril 2024", available: true },
    { month: "2024-05", name: "Mayo 2024", available: false },
    { month: "2024-06", name: "Junio 2024", available: true },
    { month: "2024-07", name: "Julio 2024", available: true },
  ]

  const toggleMonth = (month: string) => {
    setSelectedMonths((prev) => (prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month]))
  }

  const totalPrice = selectedMonths.length * billboard.monthlyPrice

  return (
    <div className="container px-4 py-8 md:px-6 md:py-12">
      {/* Breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center text-sm text-muted-foreground mb-4">
          <Link href="/" className="hover:text-primary">
            Inicio
          </Link>
          <span className="mx-2">/</span>
          <Link href="/billboards" className="hover:text-primary">
            Vallas Publicitarias
          </Link>
          <span className="mx-2">/</span>
          <span>{billboard.name}</span>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/billboards">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a espacios
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Images */}
        <div className="space-y-4">
          <div className="aspect-[4/3] relative rounded-lg overflow-hidden">
            <Image
              src={billboard.images[0] || "/placeholder.svg"}
              alt={billboard.name}
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {billboard.images.slice(1).map((image, index) => (
              <div key={index} className="aspect-[4/3] relative rounded-lg overflow-hidden">
                <Image
                  src={image || "/placeholder.svg"}
                  alt={`${billboard.name} - Vista ${index + 2}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="default" className="bg-primary text-primary-foreground">
                {billboard.format}
              </Badge>
              <Badge variant="outline">{billboard.type}</Badge>
            </div>
            <h1 className="text-3xl font-bold mb-4 text-balance">{billboard.name}</h1>
            <div className="flex items-center gap-1 text-muted-foreground mb-4">
              <MapPin className="h-5 w-5" />
              <span>{billboard.location}</span>
            </div>
            <p className="text-muted-foreground text-pretty">{billboard.description}</p>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium">{billboard.traffic}</div>
                <div className="text-sm text-muted-foreground">Tráfico diario</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium">{billboard.dimensions}</div>
                <div className="text-sm text-muted-foreground">Dimensiones</div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div>
            <h3 className="font-semibold mb-3">Características</h3>
            <div className="grid grid-cols-2 gap-2">
              {billboard.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-secondary" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Reservar Espacio</span>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">€{billboard.monthlyPrice.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">por mes</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Month Selection */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Seleccionar meses</Label>
                <div className="grid grid-cols-2 gap-2">
                  {availableMonthsData.map((monthData) => (
                    <Button
                      key={monthData.month}
                      variant={selectedMonths.includes(monthData.month) ? "default" : "outline"}
                      size="sm"
                      disabled={!monthData.available}
                      onClick={() => toggleMonth(monthData.month)}
                      className="justify-start text-xs"
                    >
                      {monthData.name}
                    </Button>
                  ))}
                </div>
              </div>

              {selectedMonths.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{selectedMonths.length} mes(es) seleccionado(s)</span>
                      <span>€{totalPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span className="text-primary">€{totalPrice.toLocaleString()}</span>
                    </div>
                  </div>
                </>
              )}

              <Button
                className="w-full bg-primary hover:bg-primary/90"
                size="lg"
                disabled={selectedMonths.length === 0}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Reservar Ahora
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Technical Specifications */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Especificaciones Técnicas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Especificaciones de Pantalla</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resolución:</span>
                  <span>{billboard.technicalSpecs.resolution}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Brillo:</span>
                  <span>{billboard.technicalSpecs.brightness}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ángulo de visión:</span>
                  <span>{billboard.technicalSpecs.viewingAngle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frecuencia:</span>
                  <span>{billboard.technicalSpecs.refreshRate}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Conectividad y Energía</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Conectividad:</span>
                  <span>{billboard.technicalSpecs.connectivity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Consumo:</span>
                  <span>{billboard.technicalSpecs.powerConsumption}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Iluminación:</span>
                  <span>{billboard.lighting}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Servicios Incluidos</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-sm">Soporte técnico 24/7</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-primary" />
                  <span className="text-sm">Instalación incluida</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-sm">Gestión de contenido</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
