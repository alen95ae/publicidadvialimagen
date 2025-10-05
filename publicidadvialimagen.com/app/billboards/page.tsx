"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Calendar, MapPin, Eye, Filter, X, Clock, Users, Zap, FileText } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Card, CardContent } from "@/components/ui/card"
import BillboardMap from "@/components/billboard-map"
import { useBillboards } from "@/hooks/use-billboards"

// ⚠️ IMPORTANTE: usar los 4 valores oficiales en 'format'
const FALLBACK_BILLBOARDS = [
  {
    id: "1",
    name: "Pantalla LED Premium - Gran Vía",
    code: "LP-001",
    images: ["/placeholder.svg?height=300&width=400"],
    monthlyPrice: 2500,
    location: "Av. 16 de Julio, La Paz",
    city: "La Paz",
    format: "Pantallas LED",
    type: "Premium",
    dimensions: "6x3 metros",
    width: 6,
    height: 3,
    visibility: "Alto tráfico",
    traffic: "150,000 personas/día",
    lighting: "24/7",
    material: "Pantalla LED exterior",
    available: true,
    availableMonths: ["2024-02", "2024-03", "2024-04", "2024-05"],
    features: ["Resolución 4K", "Contenido dinámico", "Ubicación premium"],
    coordinates: { lat: -16.5000, lng: -68.1500 },
  },
  {
    id: 2,
    name: "Valla Tradicional - Autopista A-1",
    image: "/placeholder.svg?height=300&width=400",
    monthlyPrice: 1200,
    location: "Autopista La Paz - Oruro, Km 15",
    city: "La Paz",
    format: "Vallas Publicitarias",
    type: "Autopista",
    dimensions: "8x4 metros",
    visibility: "Muy alto tráfico",
    traffic: "80,000 vehículos/día",
    lighting: "Iluminada",
    available: true,
    availableMonths: ["2024-01", "2024-02", "2024-03", "2024-06"],
    features: ["Doble cara", "Iluminación LED", "Fácil acceso"],
    coordinates: { lat: -16.5200, lng: -68.1700 },
  },
  {
    id: 3,
    name: "Parada de Autobús - Centro Comercial",
    image: "/placeholder.svg?height=300&width=400",
    monthlyPrice: 800,
    location: "Centro Comercial Santa Cruz",
    city: "Santa Cruz de la Sierra",
    format: "Murales",
    type: "Mobiliario Urbano",
    dimensions: "2x1.5 metros",
    visibility: "Medio-alto tráfico",
    traffic: "25,000 personas/día",
    lighting: "Retroiluminada",
    available: true,
    availableMonths: ["2024-02", "2024-04", "2024-05", "2024-07"],
    features: ["Retroiluminación", "Protección clima", "Zona comercial"],
    coordinates: { lat: -17.7833, lng: -63.1833 },
  },
  {
    id: 4,
    name: "Pantalla LED Móvil - Eventos",
    image: "/placeholder.svg?height=300&width=400",
    monthlyPrice: 1800,
    location: "Servicio móvil Cochabamba",
    city: "Cochabamba",
    format: "Publicidad Móvil",
    type: "Móvil",
    dimensions: "4x2 metros",
    visibility: "Eventos específicos",
    traffic: "Variable según evento",
    lighting: "24/7",
    available: true,
    availableMonths: ["2024-01", "2024-03", "2024-05", "2024-06"],
    features: ["Totalmente móvil", "Eventos personalizados", "Flexibilidad total"],
    coordinates: { lat: -17.3833, lng: -66.1667 },
  },
  {
    id: 5,
    name: "Valla Digital - Estación Atocha",
    image: "/placeholder.svg?height=300&width=400",
    monthlyPrice: 3200,
    location: "Terminal de Buses El Alto",
    city: "El Alto",
    format: "Pantallas LED",
    type: "Premium",
    dimensions: "5x3 metros",
    visibility: "Muy alto tráfico",
    traffic: "200,000 personas/día",
    lighting: "24/7",
    available: false,
    availableMonths: ["2024-06", "2024-07", "2024-08"],
    features: ["Ubicación estratégica", "Audiencia cautiva", "Alta frecuencia"],
    coordinates: { lat: -16.5167, lng: -68.1833 },
  },
  {
    id: 6,
    name: "Valla Tradicional - Entrada Barcelona",
    image: "/placeholder.svg?height=300&width=400",
    monthlyPrice: 1500,
    location: "Entrada Sucre Norte",
    city: "Sucre",
    format: "Vallas Publicitarias",
    type: "Autopista",
    dimensions: "7x3.5 metros",
    visibility: "Alto tráfico",
    traffic: "60,000 vehículos/día",
    lighting: "Iluminada",
    available: true,
    availableMonths: ["2024-02", "2024-03", "2024-04"],
    features: ["Primera impresión ciudad", "Doble cara", "Iluminación nocturna"],
    coordinates: { lat: -19.0500, lng: -65.2500 },
  },
  {
    id: 7,
    name: "Pantalla LED - Centro Potosí",
    image: "/placeholder.svg?height=300&width=400",
    monthlyPrice: 1800,
    location: "Plaza 10 de Noviembre, Potosí",
    city: "Potosí",
    format: "Pantallas LED",
    type: "Premium",
    dimensions: "4x2 metros",
    visibility: "Alto tráfico",
    traffic: "45,000 personas/día",
    lighting: "24/7",
    available: true,
    availableMonths: ["2024-01", "2024-03", "2024-05"],
    features: ["Centro histórico", "Alta visibilidad", "Contenido dinámico"],
    coordinates: { lat: -19.5833, lng: -65.7500 },
  },
  {
    id: 8,
    name: "Valla Tradicional - Tarija",
    image: "/placeholder.svg?height=300&width=400",
    monthlyPrice: 1000,
    location: "Av. Las Américas, Tarija",
    city: "Tarija",
    format: "Vallas Publicitarias",
    type: "Premium",
    dimensions: "6x3 metros",
    visibility: "Medio-alto tráfico",
    traffic: "35,000 personas/día",
    lighting: "Iluminada",
    available: true,
    availableMonths: ["2024-02", "2024-04", "2024-06"],
    features: ["Zona comercial", "Iluminación LED", "Excelente ubicación"],
    coordinates: { lat: -21.5333, lng: -64.7333 },
  },
  {
    id: 9,
    name: "Mobiliario Urbano - Oruro",
    image: "/placeholder.svg?height=300&width=400",
    monthlyPrice: 600,
    location: "Plaza 10 de Febrero, Oruro",
    city: "Oruro",
    format: "Murales",
    type: "Mobiliario Urbano",
    dimensions: "2x1 metros",
    visibility: "Medio tráfico",
    traffic: "20,000 personas/día",
    lighting: "Retroiluminada",
    available: true,
    availableMonths: ["2024-01", "2024-03", "2024-05"],
    features: ["Centro histórico", "Protección clima", "Carnaval de Oruro"],
    coordinates: { lat: -17.9833, lng: -67.1500 },
  },
  {
    id: 10,
    name: "Valla Digital - Trinidad",
    image: "/placeholder.svg?height=300&width=400",
    monthlyPrice: 1400,
    location: "Av. Cipriano Barace, Trinidad",
    city: "Trinidad",
    format: "Pantallas LED",
    type: "Premium",
    dimensions: "3x2 metros",
    visibility: "Medio-alto tráfico",
    traffic: "30,000 personas/día",
    lighting: "24/7",
    available: true,
    availableMonths: ["2024-02", "2024-04", "2024-06"],
    features: ["Capital del Beni", "Alta tecnología", "Contenido personalizado"],
    coordinates: { lat: -14.8333, lng: -64.9000 },
  },
]

// Función para normalizar nombres de ciudades y reconocer variantes
function normalizeCityName(city: string): string {
  const cityMap: Record<string, string> = {
    // Santa Cruz
    'Santa Cruz': 'Santa Cruz de la Sierra',
    'Santa Cruz de la Sierra': 'Santa Cruz de la Sierra',
    // Trinidad/Beni - Beni es el departamento, Trinidad es la capital
    'Beni': 'Trinidad',
    'Trinidad': 'Trinidad',
    // Potosí - manejar con y sin acento
    'Potosi': 'Potosí',
    'Potosí': 'Potosí',
  }
  return cityMap[city] || city
}

// Función para normalizar tipos de soporte
function normalizeFormatName(format: string): string {
  const formatMap: Record<string, string> = {
    // Mapear variantes a los nombres estándar
    'Vallas Publicitarias': 'Vallas Publicitarias',
    'vallas publicitarias': 'Vallas Publicitarias',
    'Valla': 'Vallas Publicitarias',
    'valla': 'Vallas Publicitarias',
    'Pantallas LED': 'Pantallas LED',
    'pantallas led': 'Pantallas LED',
    'pantalla led': 'Pantallas LED',
    'Murales': 'Murales',
    'murales': 'Murales',
    'Mural': 'Murales',              // Singular desde Airtable
    'mural': 'Murales',              // Singular desde Airtable
    'Publicidad Móvil': 'Publicidad Móvil',
    'publicidad móvil': 'Publicidad Móvil',
    'publicidad movil': 'Publicidad Móvil',
  }
  return formatMap[format] || format
}

// Función para comparar ciudades considerando variantes
function citiesMatch(city1: string, city2: string): boolean {
  return normalizeCityName(city1) === normalizeCityName(city2)
}

// Componente FilterSidebar separado para evitar re-renders
function FilterSidebar({ 
  isMobile = false,
  selectedFilters,
  toggleFilter,
  clearFilters,
  minPriceInput,
  setMinPriceInput,
  maxPriceInput,
  setMaxPriceInput,
  handleApplyPriceFilter,
  dynamicMinPrice,
  dynamicMaxPrice
}: {
  isMobile?: boolean
  selectedFilters: {
    cities: string[]
    formats: string[]
    availability: string[]
  }
  toggleFilter: (type: keyof typeof selectedFilters, value: string) => void
  clearFilters: () => void
  minPriceInput: string
  setMinPriceInput: (value: string) => void
  maxPriceInput: string
  setMaxPriceInput: (value: string) => void
  handleApplyPriceFilter: () => void
  dynamicMinPrice: number
  dynamicMaxPrice: number
}) {
  return (
    <div className={`space-y-6 ${isMobile ? "" : "sticky top-20"}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-lg">Filtros</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-8 text-xs text-black hover:text-red-500 hover:bg-transparent"
        >
          Limpiar todo
        </Button>
      </div>

      <div className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {/* Ciudades */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Ciudades</h3>
          <div className="space-y-2">
            {["La Paz", "Santa Cruz de la Sierra", "Cochabamba", "El Alto", "Sucre", "Potosí", "Tarija", "Oruro", "Trinidad"].map((city) => (
              <div key={city} className="flex items-center space-x-2">
                <Checkbox
                  id={`city-${city}`}
                  checked={selectedFilters.cities.includes(city)}
                  onCheckedChange={() => toggleFilter("cities", city)}
                />
                <Label htmlFor={`city-${city}`} className="text-sm font-normal cursor-pointer">
                  {city}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Precio Mensual */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Precio Mensual (Bs)</h3>
          <div className="space-y-3">
            <div>
              <Label htmlFor="min-price" className="text-xs text-muted-foreground">Precio mínimo</Label>
              <Input
                id="min-price"
                type="number"
                placeholder={`Mín: ${dynamicMinPrice.toLocaleString()}`}
                value={minPriceInput}
                onChange={(e) => setMinPriceInput(e.target.value)}
                className="mt-1"
                min={0}
              />
            </div>
            <div>
              <Label htmlFor="max-price" className="text-xs text-muted-foreground">Precio máximo</Label>
              <Input
                id="max-price"
                type="number"
                placeholder={`Máx: ${dynamicMaxPrice.toLocaleString()}`}
                value={maxPriceInput}
                onChange={(e) => setMaxPriceInput(e.target.value)}
                className="mt-1"
                min={0}
              />
            </div>
            <Button 
              onClick={handleApplyPriceFilter}
              className="w-full"
              size="sm"
              variant="default"
            >
              Aplicar filtro
            </Button>
            <div className="text-xs text-muted-foreground text-center">
              Rango disponible: Bs {dynamicMinPrice.toLocaleString()} - Bs {dynamicMaxPrice.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Tipo de Soporte */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Tipo de Soporte</h3>
          <div className="space-y-2">
            {["Vallas Publicitarias", "Pantallas LED", "Murales", "Publicidad Móvil"].map((format) => (
              <div key={format} className="flex items-center space-x-2">
                <Checkbox
                  id={`format-${format}`}
                  checked={selectedFilters.formats.includes(format)}
                  onCheckedChange={() => toggleFilter("formats", format)}
                />
                <Label htmlFor={`format-${format}`} className="text-sm font-normal cursor-pointer">
                  {format}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Disponibilidad */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Disponibilidad</h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="available-now"
                checked={selectedFilters.availability.includes("available")}
                onCheckedChange={() => toggleFilter("availability", "available")}
              />
              <Label htmlFor="available-now" className="text-sm font-normal cursor-pointer">
                Disponible ahora
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="coming-soon"
                checked={selectedFilters.availability.includes("coming-soon")}
                onCheckedChange={() => toggleFilter("availability", "coming-soon")}
              />
              <Label htmlFor="coming-soon" className="text-sm font-normal cursor-pointer">
                Próximamente
              </Label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BillboardsPage() {
  const searchParams = useSearchParams()
  const { billboards: allBillboards, loading, error } = useBillboards()
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [minPriceInput, setMinPriceInput] = useState("")
  const [maxPriceInput, setMaxPriceInput] = useState("")
  const [selectedFilters, setSelectedFilters] = useState<{
    cities: string[]
    formats: string[]
    availability: string[]
  }>({
    cities: [],
    formats: [],
    availability: [],
  })
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [mapVisible, setMapVisible] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const billboards = allBillboards && allBillboards.length > 0 ? allBillboards : FALLBACK_BILLBOARDS

  // Effect to handle URL parameters
  useEffect(() => {
    const cityParam = searchParams.get('city')
    const searchParam = searchParams.get('search')
    // ✅ Leer tipo_soporte de la URL (nueva única fuente de verdad)
    const tipoSoporteParam = searchParams.get('tipo_soporte')
    // Mantener compatibilidad con "format" antiguo
    const formatParam = searchParams.get('format')
    
    // Hacer scroll al inicio cuando se accede con parámetros desde otra página
    if (cityParam || tipoSoporteParam || formatParam || searchParam) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    
    if (cityParam) {
      // Normalizar el nombre de la ciudad antes de guardarlo
      const normalizedCity = normalizeCityName(cityParam)
      setSelectedFilters(prev => ({
        ...prev,
        cities: [normalizedCity]
      }))
    }
    
    // Priorizar tipo_soporte sobre format
    if (tipoSoporteParam) {
      const normalizedFormat = normalizeFormatName(tipoSoporteParam)
      setSelectedFilters(prev => ({
        ...prev,
        formats: [normalizedFormat]
      }))
    } else if (formatParam) {
      const normalizedFormat = normalizeFormatName(formatParam)
      setSelectedFilters(prev => ({
        ...prev,
        formats: [normalizedFormat]
      }))
    }
    
    if (searchParam) {
      setSearchQuery(searchParam)
    }
  }, [searchParams])

  // Si está cargando, mostrar loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando vallas publicitarias...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Si hay error, mostrar mensaje
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-600 mb-4">Error al cargar las vallas publicitarias</p>
              <p className="text-gray-600">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Calcular min y max dinámicos basados en todos los billboards
  const allPrices = billboards.map(b => b.monthlyPrice)
  const dynamicMinPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0
  const dynamicMaxPrice = allPrices.length > 0 ? Math.max(...allPrices) : 10000

  // Función para validar y obtener valores de precio
  const getMinPriceValue = () => {
    const value = parseInt(minPrice)
    return isNaN(value) || value < 0 ? dynamicMinPrice : value
  }

  const getMaxPriceValue = () => {
    const value = parseInt(maxPrice)
    return isNaN(value) || value < 0 ? dynamicMaxPrice : value
  }

  // Calcular billboards sin filtro de precio para obtener el rango correcto
  const billboardsWithoutPriceFilter = billboards.filter((billboard) => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      const matchesCity = billboard.city?.toLowerCase().includes(query)
      const matchesCode = billboard.id?.toString().toLowerCase().includes(query)
      const matchesType = billboard.type?.toLowerCase().includes(query)
      const matchesFormat = billboard.format?.toLowerCase().includes(query)
      const matchesName = billboard.name?.toLowerCase().includes(query)
      const matchesLocation = billboard.location?.toLowerCase().includes(query)
      
      if (!matchesCity && !matchesCode && !matchesType && !matchesFormat && !matchesName && !matchesLocation) {
        return false
      }
    }

    // Comparar ciudades (las ciudades filtradas ya están normalizadas)
    if (selectedFilters.cities.length > 0 && !selectedFilters.cities.includes(billboard.city)) {
      return false
    }

    if (selectedFilters.formats.length > 0) {
      const matchesFormat = selectedFilters.formats.some(filterFormat => {
        const normalizedFilter = normalizeFormatName(filterFormat)
        const normalizedBillboard = normalizeFormatName(billboard.format)
        const matches = normalizedFilter === normalizedBillboard
        
        // Log para debug del filtro
        if (selectedFilters.formats.includes('Murales')) {
          console.log(`🔍 Filtro Murales: billboard="${billboard.name}" format="${billboard.format}" normalized="${normalizedBillboard}" matches=${matches}`)
        }
        
        return matches
      })
      
      if (!matchesFormat) {
        return false
      }
    }

    if (selectedFilters.availability.length > 0) {
      if (selectedFilters.availability.includes("available") && !billboard.available) {
        return false
      }
      if (selectedFilters.availability.includes("coming-soon") && billboard.available) {
        return false
      }
    }

    return true
  })

  const toggleFilter = (type: keyof typeof selectedFilters, value: string) => {
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
      cities: [],
      formats: [],
      availability: [],
    })
    setMinPrice("")
    setMaxPrice("")
    setMinPriceInput("")
    setMaxPriceInput("")
    setSearchQuery("")
  }

  // Aplicar ambos filtros de precio cuando se presiona el botón
  const handleApplyPriceFilter = () => {
    setMinPrice(minPriceInput)
    setMaxPrice(maxPriceInput)
  }


  const filteredBillboards = billboardsWithoutPriceFilter.filter((billboard) => {
    // Filter by price
    const minPriceValue = getMinPriceValue()
    const maxPriceValue = getMaxPriceValue()
    
    if (billboard.monthlyPrice < minPriceValue || billboard.monthlyPrice > maxPriceValue) {
      return false
    }

    return true
  })

  return (
    <div className="container px-4 py-8 md:px-6 md:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-balance">
          {searchQuery ? `Resultados para "${searchQuery}"` : "Espacios Publicitarios"}
        </h1>
        {searchQuery && (
          <p className="text-muted-foreground mb-2">
            Se encontraron {filteredBillboards.length} espacios publicitarios
          </p>
        )}
        <div className="flex items-center text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary">
            Inicio
          </Link>
          <span className="mx-2">/</span>
          <span>Vallas Publicitarias</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Filters - Desktop */}
        <div className="hidden md:block w-64 shrink-0">
          <FilterSidebar 
            selectedFilters={selectedFilters}
            toggleFilter={toggleFilter}
            clearFilters={clearFilters}
            minPriceInput={minPriceInput}
            setMinPriceInput={setMinPriceInput}
            maxPriceInput={maxPriceInput}
            setMaxPriceInput={setMaxPriceInput}
            handleApplyPriceFilter={handleApplyPriceFilter}
            dynamicMinPrice={dynamicMinPrice}
            dynamicMaxPrice={dynamicMaxPrice}
          />
        </div>

        {/* Filters - Mobile */}
        <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
          <SheetContent side="left" className="w-full sm:max-w-md">
            <SheetHeader className="mb-4">
              <SheetTitle>Filtros</SheetTitle>
              <SheetDescription>Encuentra el espacio publicitario perfecto</SheetDescription>
            </SheetHeader>
            <FilterSidebar 
              isMobile={true}
              selectedFilters={selectedFilters}
              toggleFilter={toggleFilter}
              clearFilters={clearFilters}
              minPriceInput={minPriceInput}
              setMinPriceInput={setMinPriceInput}
              maxPriceInput={maxPriceInput}
              setMaxPriceInput={setMaxPriceInput}
              handleApplyPriceFilter={handleApplyPriceFilter}
              dynamicMinPrice={dynamicMinPrice}
              dynamicMaxPrice={dynamicMaxPrice}
            />
          </SheetContent>
        </Sheet>

        {/* Billboard Grid */}
        <div className="flex-1">
          {/* Map Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Ubicación de Espacios Publicitarios</h2>
            <BillboardMap 
              billboards={filteredBillboards} 
              selectedCity={selectedFilters.cities.length === 1 ? selectedFilters.cities[0] : undefined}
              isVisible={mapVisible}
              onToggle={() => setMapVisible(!mapVisible)}
            />
          </div>

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
                {searchQuery && (
                  <Badge variant="default" className="flex items-center gap-1 bg-primary">
                    Búsqueda: {searchQuery}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchQuery("")} />
                  </Badge>
                )}
                {selectedFilters.cities.map((city) => (
                  <Badge key={`city-${city}`} variant="secondary" className="flex items-center gap-1">
                    {city}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => toggleFilter("cities", city)} />
                  </Badge>
                ))}
                {selectedFilters.formats.map((format) => (
                  <Badge key={`format-${format}`} variant="secondary" className="flex items-center gap-1">
                    {format}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => toggleFilter("formats", format)} />
                  </Badge>
                ))}
                {(minPrice !== "" || maxPrice !== "") && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Bs {minPrice || dynamicMinPrice.toLocaleString()} - Bs {maxPrice || dynamicMaxPrice.toLocaleString()}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => { setMinPrice(""); setMaxPrice(""); setMinPriceInput(""); setMaxPriceInput(""); }} />
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {filteredBillboards.length} espacios
              </span>
              <Select defaultValue="featured">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Destacados</SelectItem>
                  <SelectItem value="price-low">Precio: Menor a Mayor</SelectItem>
                  <SelectItem value="price-high">Precio: Mayor a Menor</SelectItem>
                  <SelectItem value="traffic">Mayor Tráfico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredBillboards.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">No se encontraron espacios</h3>
              <p className="text-muted-foreground mb-4">Intenta ajustar tus filtros para encontrar lo que buscas.</p>
              <Button onClick={clearFilters}>Limpiar todos los filtros</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredBillboards.map((billboard) => (
                <Card key={billboard.id} className="overflow-hidden">
                  <div className="w-full h-[147px] relative">
                    <Image
                      src={billboard.images?.[0] || "/placeholder.svg"}
                      alt={billboard.name}
                      width={222}
                      height={147}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <h3 className="font-semibold text-base text-balance">{billboard.name}</h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-lg font-bold text-primary">
                            Bs {billboard.monthlyPrice.toLocaleString()}
                          </span>
                          <span className="text-xs text-muted-foreground">/mes</span>
                        </div>
                        <Button
                          size="sm"
                          className="bg-primary hover:bg-primary/90 text-xs"
                          disabled={!billboard.available}
                          asChild={billboard.available}
                        >
                          {billboard.available ? (
                            <Link href={`/billboards/${billboard.id}`}>
                              <FileText className="mr-1 h-3 w-3" />
                              Cotizar
                            </Link>
                          ) : (
                            <>
                              <Clock className="mr-1 h-3 w-3" />
                              No disponible
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
