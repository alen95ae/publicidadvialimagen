"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { ShoppingCart, Search, Menu, X, Megaphone } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import UserMenu from "@/components/user-menu"
import { useCampaignsContext } from "@/components/campaigns-provider"

// Componente de la bandera de Bolivia
const BoliviaFlag = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="24" height="8" fill="#D52B1E" />
    <rect y="8" width="24" height="8" fill="#F9E300" />
    <rect y="16" width="24" height="8" fill="#007A3D" />
  </svg>
)

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const router = useRouter()
  const pathname = usePathname()
  const searchRef = useRef<HTMLDivElement>(null)
  const { getCampaignCount } = useCampaignsContext()

  // Sugerencias predefinidas
  const allSuggestions = [
    "La Paz",
    "Santa Cruz",
    "Cochabamba",
    "El Alto",
    "Sucre",
    "Potosí",
    "Tarija",
    "Oruro",
    "Trinidad",
    "Digital LED",
    "Pantalla LED",
    "Valla Tradicional",
    "Impresa",
    "Backlight",
    "Premium",
    "Autopista",
    "Mobiliario Urbano",
    "Móvil",
  ]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/billboards?search=${encodeURIComponent(searchQuery.trim())}`)
      setShowSuggestions(false)
      setMobileMenuOpen(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion)
    router.push(`/billboards?search=${encodeURIComponent(suggestion)}`)
    setShowSuggestions(false)
    setMobileMenuOpen(false)
  }

  // Actualizar sugerencias cuando cambia el query
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const filtered = allSuggestions.filter((suggestion) =>
        suggestion.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setSuggestions(filtered.slice(0, 5)) // Máximo 5 sugerencias
      setShowSuggestions(filtered.length > 0)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [searchQuery])

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center">
            <div className="w-24 h-24 flex items-center justify-center">
              <img 
                src="/logo-publicidad-vial.svg" 
                alt="Publicidad Vial Imagen" 
                className="h-20 w-auto"
              />
            </div>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
              Inicio
            </Link>
            <Link href="/billboards" className="text-sm font-medium transition-colors hover:text-primary">
              Vallas Publicitarias
            </Link>
            <Link href="/print-shop" className="text-sm font-medium transition-colors hover:text-primary">
              Impresión Digital
            </Link>
            <Link href="/about" className="text-sm font-medium transition-colors hover:text-primary">
              Nosotros
            </Link>
            <Link href="/contact" className="text-sm font-medium transition-colors hover:text-primary">
              Contacto
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex" ref={searchRef}>
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
              <Input
                type="search"
                placeholder="Buscar..."
                className="w-[200px] pl-8 md:w-[250px] rounded-full bg-muted"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-background border rounded-lg shadow-lg overflow-hidden z-50">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
                    >
                      <Search className="h-3 w-3 text-muted-foreground" />
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </form>
          </div>
          <Button variant="ghost" size="sm" className="gap-2 hidden md:flex">
            <BoliviaFlag className="h-4 w-4" />
            <span className="text-sm">Español (Bolivia)</span>
          </Button>
          <UserMenu />
          <Button variant="ghost" size="icon" className="relative" asChild>
            <Link href="/campaigns">
              <Megaphone className="h-5 w-5" />
              <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-primary">
                {getCampaignCount()}
              </Badge>
              <span className="sr-only">Mi Campaña</span>
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="relative" asChild>
            <Link href="/cart">
              <ShoppingCart className="h-5 w-5" />
              <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-primary">
                0
              </Badge>
              <span className="sr-only">Carrito</span>
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="sr-only">Menú</span>
          </Button>
        </div>
      </div>
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t p-4 space-y-4 bg-background">
          <div className="relative mb-4">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
              <Input 
                type="search" 
                placeholder="Buscar..." 
                className="w-full pl-8 rounded-full bg-muted"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
              />
            </form>
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-background border rounded-lg shadow-lg overflow-hidden z-50 left-0 right-0">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
                  >
                    <Search className="h-3 w-3 text-muted-foreground" />
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
          <nav className="flex flex-col space-y-4">
            <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
              Inicio
            </Link>
            <Link href="/billboards" className="text-sm font-medium transition-colors hover:text-primary">
              Vallas Publicitarias
            </Link>
            <Link href="/print-shop" className="text-sm font-medium transition-colors hover:text-primary">
              Impresión Digital
            </Link>
            <Link href="/about" className="text-sm font-medium transition-colors hover:text-primary">
              Nosotros
            </Link>
            <Link href="/contact" className="text-sm font-medium transition-colors hover:text-primary">
              Contacto
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
