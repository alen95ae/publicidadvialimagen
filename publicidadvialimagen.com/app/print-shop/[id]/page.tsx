"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Clock, Shield, ArrowLeft, Plus, Minus, Package, Calculator } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"

interface PrintProductDetailPageProps {
  params: {
    id: string
  }
}

export default function PrintProductDetailPage({ params }: PrintProductDetailPageProps) {
  const [width, setWidth] = useState<number>(1)
  const [height, setHeight] = useState<number>(1)
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([])
  const [quantity, setQuantity] = useState<number>(1)

  const product = {
    id: Number.parseInt(params.id),
    name: "Vinilo Adhesivo Premium",
    images: [
      "/placeholder.svg?height=400&width=600",
      "/placeholder.svg?height=400&width=600",
      "/placeholder.svg?height=400&width=600",
    ],
    pricePerM2: 25,
    material: "Vinilo adhesivo de alta calidad",
    durability: "5-7 años exterior",
    recommendedUse: "Vehículos, escaparates, señalización exterior e interior",
    thickness: "80 micras",
    finish: "Brillante/Mate disponible",
    waterproof: true,
    category: "Vinilo",
    deliveryTime: "2-3 días laborables",
    features: [
      "Resistente a rayos UV",
      "Fácil aplicación sin burbujas",
      "Adhesivo permanente",
      "Colores vibrantes y duraderos",
      "Resistente a la intemperie",
      "Fácil de cortar y aplicar",
    ],
    addOns: [
      { id: "laminate", name: "Laminado protector", price: 8, description: "Protección extra contra rayones y UV" },
      {
        id: "installation",
        name: "Aplicación profesional",
        price: 15,
        description: "Instalación por profesionales certificados",
      },
      {
        id: "design",
        name: "Diseño personalizado",
        price: 35,
        description: "Servicio de diseño gráfico profesional",
      },
    ],
    description:
      "Nuestro vinilo adhesivo premium es la solución perfecta para proyectos de señalización que requieren durabilidad y calidad superior. Fabricado con materiales de primera calidad, ofrece una excelente adherencia y resistencia a las condiciones climáticas más exigentes.",
    technicalSpecs: {
      material: "PVC calandrado",
      adhesive: "Acrílico permanente",
      liner: "Papel siliconado 140g",
      temperature: "-40°C a +90°C",
      application: "Superficies lisas y curvas",
      printability: "Tintas ecosolventes, UV, látex",
    },
  }

  const toggleAddOn = (addOnId: string) => {
    setSelectedAddOns((prev) => (prev.includes(addOnId) ? prev.filter((id) => id !== addOnId) : [...prev, addOnId]))
  }

  const calculatePrice = () => {
    const area = width * height
    const basePrice = area * product.pricePerM2
    const addOnPrice = selectedAddOns.reduce((total, addOnId) => {
      const addOn = product.addOns.find((a) => a.id === addOnId)
      return total + (addOn ? addOn.price * area : 0)
    }, 0)
    return (basePrice + addOnPrice) * quantity
  }

  const area = width * height
  const totalPrice = calculatePrice()

  return (
    <div className="container px-4 py-8 md:px-6 md:py-12">
      {/* Breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center text-sm text-muted-foreground mb-4">
          <Link href="/" className="hover:text-primary">
            Inicio
          </Link>
          <span className="mx-2">/</span>
          <Link href="/print-shop" className="hover:text-primary">
            Impresión
          </Link>
          <span className="mx-2">/</span>
          <span>{product.name}</span>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/print-shop">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a productos
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Images */}
        <div className="space-y-4">
          <div className="aspect-[4/3] relative rounded-lg overflow-hidden">
            <Image
              src={product.images[0] || "/placeholder.svg"}
              alt={product.name}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {product.images.slice(1).map((image, index) => (
              <div key={index} className="aspect-[4/3] relative rounded-lg overflow-hidden">
                <Image
                  src={image || "/placeholder.svg"}
                  alt={`${product.name} - Vista ${index + 2}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 33vw, 16vw"
                  loading="lazy"
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
                {product.category}
              </Badge>
              {product.waterproof && <Badge variant="outline">Impermeable</Badge>}
            </div>
            <h1 className="text-3xl font-bold mb-4 text-balance">{product.name}</h1>
            <p className="text-muted-foreground text-pretty mb-4">{product.description}</p>
            <div className="text-sm text-muted-foreground">
              <strong>Uso recomendado:</strong> {product.recommendedUse}
            </div>
          </div>

          {/* Key Features */}
          <div>
            <h3 className="font-semibold mb-3">Características Principales</h3>
            <div className="grid grid-cols-1 gap-2">
              {product.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Calculator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Calculadora de Precio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Dimensions */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="width" className="text-sm font-medium">
                    Ancho (metros)
                  </Label>
                  <Input
                    id="width"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={width}
                    onChange={(e) => setWidth(Math.max(0.1, Number.parseFloat(e.target.value) || 0.1))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="height" className="text-sm font-medium">
                    Alto (metros)
                  </Label>
                  <Input
                    id="height"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={height}
                    onChange={(e) => setHeight(Math.max(0.1, Number.parseFloat(e.target.value) || 0.1))}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Area Display */}
              <div className="bg-muted p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Área total:</span>
                  <span className="font-bold">{area.toFixed(2)} m²</span>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Cantidad</Label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="font-medium min-w-[3ch] text-center">{quantity}</span>
                  <Button variant="outline" size="icon" onClick={() => setQuantity(quantity + 1)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Add-ons */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Servicios Adicionales</Label>
                <div className="space-y-3">
                  {product.addOns.map((addOn) => (
                    <div key={addOn.id} className="flex items-start space-x-3">
                      <Checkbox
                        id={addOn.id}
                        checked={selectedAddOns.includes(addOn.id)}
                        onCheckedChange={() => toggleAddOn(addOn.id)}
                      />
                      <div className="flex-1">
                        <Label htmlFor={addOn.id} className="text-sm font-medium cursor-pointer">
                          {addOn.name} (+€{addOn.price}/m²)
                        </Label>
                        <p className="text-xs text-muted-foreground">{addOn.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2">
                <Separator />
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>
                      Material ({area.toFixed(2)} m² × €{product.pricePerM2})
                    </span>
                    <span>€{(area * product.pricePerM2).toFixed(2)}</span>
                  </div>
                  {selectedAddOns.map((addOnId) => {
                    const addOn = product.addOns.find((a) => a.id === addOnId)
                    if (!addOn) return null
                    return (
                      <div key={addOnId} className="flex justify-between">
                        <span>
                          {addOn.name} ({area.toFixed(2)} m² × €{addOn.price})
                        </span>
                        <span>€{(area * addOn.price).toFixed(2)}</span>
                      </div>
                    )
                  })}
                  {quantity > 1 && (
                    <div className="flex justify-between">
                      <span>Cantidad × {quantity}</span>
                      <span>
                        €{(totalPrice / quantity).toFixed(2)} × {quantity}
                      </span>
                    </div>
                  )}
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-primary">€{totalPrice.toFixed(2)}</span>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="bg-card p-3 rounded-lg border">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Tiempo de entrega</span>
                </div>
                <p className="text-sm text-muted-foreground">{product.deliveryTime}</p>
              </div>

              <Button className="w-full bg-primary hover:bg-primary/90" size="lg">
                <Package className="mr-2 h-4 w-4" />
                Comprar Ahora - €{totalPrice.toFixed(2)}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Technical Specifications */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Especificaciones Técnicas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Características del Material</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Material:</span>
                  <span>{product.technicalSpecs.material}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Adhesivo:</span>
                  <span>{product.technicalSpecs.adhesive}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Grosor:</span>
                  <span>{product.thickness}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Liner:</span>
                  <span>{product.technicalSpecs.liner}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Condiciones de Uso</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Temperatura:</span>
                  <span>{product.technicalSpecs.temperature}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Aplicación:</span>
                  <span>{product.technicalSpecs.application}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Durabilidad:</span>
                  <span>{product.durability}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Impresión:</span>
                  <span>{product.technicalSpecs.printability}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
