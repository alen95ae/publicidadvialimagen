"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Ruler, Clock, Shield, Filter, X, Construction, Home } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Card, CardContent } from "@/components/ui/card"

// Cambiar a false para mostrar la página normal
const MAINTENANCE_MODE = true

export default function PrintShopPage() {
  const [priceRange, setPriceRange] = useState([0, 100])
  const [selectedFilters, setSelectedFilters] = useState({
    materials: [],
    uses: [],
    durability: [],
    finishing: [],
  })
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const printProducts = [
    {
      id: 1,
      name: "Vinilo Adhesivo Premium",
      image: "/placeholder.svg?height=300&width=400",
      pricePerM2: 25,
      material: "Vinilo adhesivo",
      durability: "5-7 años exterior",
      recommendedUse: "Vehículos, escaparates, señalización",
      thickness: "80 micras",
      finish: "Brillante/Mate disponible",
      waterproof: true,
      category: "Vinilo",
      deliveryTime: "2-3 días laborables",
      features: ["Resistente UV", "Fácil aplicación", "Sin burbujas"],
      addOns: [
        { name: "Laminado protector", price: 8 },
        { name: "Aplicación profesional", price: 15 },
      ],
    },
    {
      id: 2,
      name: "Lona Publicitaria Exterior",
      image: "/placeholder.svg?height=300&width=400",
      pricePerM2: 18,
      material: "Lona PVC",
      durability: "3-5 años exterior",
      recommendedUse: "Vallas, eventos, construcción",
      thickness: "440g/m²",
      finish: "Mate antirreflejos",
      waterproof: true,
      category: "Lona",
      deliveryTime: "1-2 días laborables",
      features: ["Impermeable", "Resistente al viento", "Ojales incluidos"],
      addOns: [
        { name: "Ojales reforzados", price: 3 },
        { name: "Dobladillo perimetral", price: 5 },
      ],
    },
    {
      id: 3,
      name: "Banner Roll-Up Premium",
      image: "/placeholder.svg?height=300&width=400",
      pricePerM2: 35,
      material: "Poliéster sintético",
      durability: "2-3 años interior",
      recommendedUse: "Ferias, eventos, presentaciones",
      thickness: "200g/m²",
      finish: "Satinado",
      waterproof: false,
      category: "Banner",
      deliveryTime: "24-48 horas",
      features: ["Alta resolución", "Colores vibrantes", "Fácil montaje"],
      addOns: [
        { name: "Estructura roll-up", price: 45 },
        { name: "Bolsa de transporte", price: 12 },
      ],
    },
    {
      id: 4,
      name: "Malla Microperforada",
      image: "/placeholder.svg?height=300&width=400",
      pricePerM2: 22,
      material: "PVC microperforado",
      durability: "2-4 años exterior",
      recommendedUse: "Fachadas, andamios, vallas",
      thickness: "280g/m²",
      finish: "Microperforado",
      waterproof: true,
      category: "Malla",
      deliveryTime: "2-4 días laborables",
      features: ["Permite paso del aire", "Reduce carga de viento", "Visión unidireccional"],
      addOns: [
        { name: "Sistema de fijación", price: 10 },
        { name: "Refuerzo perimetral", price: 7 },
      ],
    },
    {
      id: 5,
      name: "Adhesivo Suelo Antideslizante",
      image: "/placeholder.svg?height=300&width=400",
      pricePerM2: 42,
      material: "Vinilo antideslizante",
      durability: "1-2 años alto tráfico",
      recommendedUse: "Suelos, escaleras, pasillos",
      thickness: "120 micras",
      finish: "Texturizado antideslizante",
      waterproof: true,
      category: "Vinilo",
      deliveryTime: "3-5 días laborables",
      features: ["Certificado antideslizante", "Fácil limpieza", "Resistente al tráfico"],
      addOns: [
        { name: "Imprimación especial", price: 12 },
        { name: "Instalación profesional", price: 25 },
      ],
    },
    {
      id: 6,
      name: "Canvas Artístico Premium",
      image: "/placeholder.svg?height=300&width=400",
      pricePerM2: 55,
      material: "Canvas 100% algodón",
      durability: "10+ años interior",
      recommendedUse: "Arte, decoración, fotografía",
      thickness: "380g/m²",
      finish: "Textura lienzo",
      waterproof: false,
      category: "Canvas",
      deliveryTime: "3-4 días laborables",
      features: ["Calidad museo", "Colores duraderos", "Textura natural"],
      addOns: [
        { name: "Bastidor de madera", price: 20 },
        { name: "Barniz protector", price: 15 },
      ],
    },
  ]

  const toggleFilter = (type, value) => {
    setSelectedFilters((prev) => {
      const current = [...prev[type]]
      const index = current.indexOf(value)

      if (index === -1) {
        current.push(value)
      } else {
        current.splice(index, 1)
      }

      return {
        ...prev,
        [type]: current,
      }
    })
  }

  const clearFilters = () => {
    setSelectedFilters({
      materials: [],
      uses: [],
      durability: [],
      finishing: [],
    })
    setPriceRange([0, 100])
  }

  const FilterSidebar = ({ isMobile = false }) => (
    <div className={`space-y-6 ${isMobile ? "" : "sticky top-20"}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-lg">Filtros</h3>
        {(selectedFilters.materials.length > 0 ||
          selectedFilters.uses.length > 0 ||
          selectedFilters.durability.length > 0 ||
          selectedFilters.finishing.length > 0 ||
          priceRange[0] > 0 ||
          priceRange[1] < 100) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8 text-xs text-primary hover:text-primary/80"
          >
            Limpiar todo
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <Accordion type="single" collapsible defaultValue="materials">
          <AccordionItem value="materials">
            <AccordionTrigger>Tipo de Material</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {["Vinilo", "Lona", "Banner", "Malla", "Canvas"].map((material) => (
                  <div key={material} className="flex items-center space-x-2">
                    <Checkbox
                      id={`material-${material}`}
                      checked={selectedFilters.materials.includes(material)}
                      onCheckedChange={() => toggleFilter("materials", material)}
                    />
                    <Label htmlFor={`material-${material}`} className="text-sm font-normal cursor-pointer">
                      {material}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="price">
            <AccordionTrigger>Precio por m² (€)</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 px-1">
                <Slider
                  defaultValue={[0, 100]}
                  max={100}
                  step={5}
                  value={priceRange}
                  onValueChange={setPriceRange}
                  className="py-4"
                />
                <div className="flex items-center justify-between">
                  <span className="text-sm">€{priceRange[0]}</span>
                  <span className="text-sm">€{priceRange[1]}</span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="uses">
            <AccordionTrigger>Uso Recomendado</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {["Exterior", "Interior", "Vehículos", "Eventos", "Decoración"].map((use) => (
                  <div key={use} className="flex items-center space-x-2">
                    <Checkbox
                      id={`use-${use}`}
                      checked={selectedFilters.uses.includes(use)}
                      onCheckedChange={() => toggleFilter("uses", use)}
                    />
                    <Label htmlFor={`use-${use}`} className="text-sm font-normal cursor-pointer">
                      {use}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="durability">
            <AccordionTrigger>Durabilidad</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {["1-2 años", "2-3 años", "3-5 años", "5+ años"].map((duration) => (
                  <div key={duration} className="flex items-center space-x-2">
                    <Checkbox
                      id={`duration-${duration}`}
                      checked={selectedFilters.durability.includes(duration)}
                      onCheckedChange={() => toggleFilter("durability", duration)}
                    />
                    <Label htmlFor={`duration-${duration}`} className="text-sm font-normal cursor-pointer">
                      {duration}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="finishing">
            <AccordionTrigger>Características</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {["Impermeable", "Resistente UV", "Antideslizante", "Microperforado"].map((feature) => (
                  <div key={feature} className="flex items-center space-x-2">
                    <Checkbox
                      id={`feature-${feature}`}
                      checked={selectedFilters.finishing.includes(feature)}
                      onCheckedChange={() => toggleFilter("finishing", feature)}
                    />
                    <Label htmlFor={`feature-${feature}`} className="text-sm font-normal cursor-pointer">
                      {feature}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )

  const filteredProducts = printProducts.filter((product) => {
    // Filter by material category
    if (selectedFilters.materials.length > 0 && !selectedFilters.materials.includes(product.category)) {
      return false
    }

    // Filter by price
    if (product.pricePerM2 < priceRange[0] || product.pricePerM2 > priceRange[1]) {
      return false
    }

    // Filter by use (simplified - checking if use keywords exist in recommendedUse)
    if (selectedFilters.uses.length > 0) {
      const hasMatchingUse = selectedFilters.uses.some((use) =>
        product.recommendedUse.toLowerCase().includes(use.toLowerCase()),
      )
      if (!hasMatchingUse) return false
    }

    // Filter by durability (simplified - checking if duration exists in durability string)
    if (selectedFilters.durability.length > 0) {
      const hasMatchingDurability = selectedFilters.durability.some((duration) =>
        product.durability.includes(duration.split("-")[0]),
      )
      if (!hasMatchingDurability) return false
    }

    return true
  })

  // Página de mantenimiento
  if (MAINTENANCE_MODE) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="container px-4 py-12 md:px-6">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            {/* Icono de construcción */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
                <div className="relative bg-primary/10 p-8 rounded-full">
                  <Construction className="h-24 w-24 text-primary animate-pulse" strokeWidth={1.5} />
                </div>
              </div>
            </div>

            {/* Contenido */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Próximamente
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground font-medium">
                Página en Construcción
              </p>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                Estamos trabajando para traerte nuestros servicios de impresión digital. 
                Muy pronto podrás disfrutar de materiales de alta calidad para tus proyectos publicitarios.
              </p>
            </div>

            {/* Características que vendrán */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8">
              <Card className="border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center space-y-2">
                    <Ruler className="h-8 w-8 text-primary" />
                    <h3 className="font-semibold">Cálculo por m²</h3>
                    <p className="text-sm text-muted-foreground text-center">
                      Precios transparentes calculados exactamente
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center space-y-2">
                    <Shield className="h-8 w-8 text-primary" />
                    <h3 className="font-semibold">Alta Calidad</h3>
                    <p className="text-sm text-muted-foreground text-center">
                      Materiales profesionales y duraderos
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center space-y-2">
                    <Clock className="h-8 w-8 text-primary" />
                    <h3 className="font-semibold">Entrega Rápida</h3>
                    <p className="text-sm text-muted-foreground text-center">
                      Tiempos de producción optimizados
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Botón de regreso */}
            <div className="pt-8">
              <Button asChild size="lg" className="gap-2">
                <Link href="/">
                  <Home className="h-5 w-5" />
                  Volver al Inicio
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Página normal de impresión
  return (
    <div className="container px-4 py-8 md:px-6 md:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-balance">Servicios de Impresión</h1>
        <p className="text-muted-foreground mb-4 text-pretty">
          Materiales de impresión profesional calculados por metro cuadrado
        </p>
        <div className="flex items-center text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary">
            Inicio
          </Link>
          <span className="mx-2">/</span>
          <span>Impresión</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Filters - Desktop */}
        <div className="hidden md:block w-64 shrink-0">
          <FilterSidebar />
        </div>

        {/* Filters - Mobile */}
        <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
          <SheetContent side="left" className="w-full sm:max-w-md">
            <SheetHeader className="mb-4">
              <SheetTitle>Filtros</SheetTitle>
              <SheetDescription>Encuentra el material perfecto para tu proyecto</SheetDescription>
            </SheetHeader>
            <FilterSidebar isMobile={true} />
          </SheetContent>
        </Sheet>

        {/* Product Grid */}
        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="md:hidden flex items-center gap-2 bg-transparent"
                onClick={() => setMobileFiltersOpen(true)}
              >
                <Filter className="h-4 w-4" />
                Filtros
              </Button>

              {/* Active filters */}
              <div className="flex flex-wrap gap-2">
                {selectedFilters.materials.map((material) => (
                  <Badge key={`material-${material}`} variant="secondary" className="flex items-center gap-1">
                    {material}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => toggleFilter("materials", material)} />
                  </Badge>
                ))}
                {selectedFilters.uses.map((use) => (
                  <Badge key={`use-${use}`} variant="secondary" className="flex items-center gap-1">
                    {use}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => toggleFilter("uses", use)} />
                  </Badge>
                ))}
                {(priceRange[0] > 0 || priceRange[1] < 100) && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    €{priceRange[0]} - €{priceRange[1]}/m²
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setPriceRange([0, 100])} />
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {filteredProducts.length} productos
              </span>
              <Select defaultValue="featured">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Destacados</SelectItem>
                  <SelectItem value="price-low">Precio: Menor a Mayor</SelectItem>
                  <SelectItem value="price-high">Precio: Mayor a Menor</SelectItem>
                  <SelectItem value="delivery">Entrega más rápida</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">No se encontraron productos</h3>
              <p className="text-muted-foreground mb-4">Intenta ajustar tus filtros para encontrar lo que buscas.</p>
              <Button onClick={clearFilters}>Limpiar todos los filtros</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
              {filteredProducts.map((product) => (
                <div key={product.id} className="group relative w-[222px]">
                  <div className="w-[222px] h-[147px] overflow-hidden rounded-lg bg-background border shadow-sm">
                    <Image
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      width={222}
                      height={147}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 bg-black/50">
                      <Button className="mx-auto bg-primary hover:bg-primary/90 text-white">
                        <Ruler className="mr-2 h-4 w-4" />
                        Reservar
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1 text-center">
                    <h3 className="font-medium text-sm text-foreground">{product.name}</h3>
                    <div className="flex justify-center gap-2">
                      <span className="font-medium text-primary text-sm">€{product.pricePerM2}/m²</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
