"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { ShoppingCart, Search, Menu, X, ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import UserMenu from "@/components/user-menu"
import { useTranslations } from "@/hooks/use-translations"
import { Locale, localeNames, localeFlags } from "@/lib/i18n"

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

// Componente de la bandera de Estados Unidos
const USAFlag = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="24" height="24" fill="#B22234" />
    <rect width="24" height="1.85" fill="#FFFFFF" />
    <rect y="3.7" width="24" height="1.85" fill="#FFFFFF" />
    <rect y="7.4" width="24" height="1.85" fill="#FFFFFF" />
    <rect y="11.1" width="24" height="1.85" fill="#FFFFFF" />
    <rect y="14.8" width="24" height="1.85" fill="#FFFFFF" />
    <rect y="18.5" width="24" height="1.85" fill="#FFFFFF" />
    <rect y="22.2" width="24" height="1.8" fill="#FFFFFF" />
    <rect width="9.6" height="12.95" fill="#3C3B6E" />
    <g fill="#FFFFFF">
      <circle cx="1.6" cy="1.6" r="0.4" />
      <circle cx="3.2" cy="1.6" r="0.4" />
      <circle cx="4.8" cy="1.6" r="0.4" />
      <circle cx="6.4" cy="1.6" r="0.4" />
      <circle cx="8" cy="1.6" r="0.4" />
      <circle cx="2.4" cy="3.2" r="0.4" />
      <circle cx="4" cy="3.2" r="0.4" />
      <circle cx="5.6" cy="3.2" r="0.4" />
      <circle cx="7.2" cy="3.2" r="0.4" />
      <circle cx="1.6" cy="4.8" r="0.4" />
      <circle cx="3.2" cy="4.8" r="0.4" />
      <circle cx="4.8" cy="4.8" r="0.4" />
      <circle cx="6.4" cy="4.8" r="0.4" />
      <circle cx="8" cy="4.8" r="0.4" />
      <circle cx="2.4" cy="6.4" r="0.4" />
      <circle cx="4" cy="6.4" r="0.4" />
      <circle cx="5.6" cy="6.4" r="0.4" />
      <circle cx="7.2" cy="6.4" r="0.4" />
      <circle cx="1.6" cy="8" r="0.4" />
      <circle cx="3.2" cy="8" r="0.4" />
      <circle cx="4.8" cy="8" r="0.4" />
      <circle cx="6.4" cy="8" r="0.4" />
      <circle cx="8" cy="8" r="0.4" />
      <circle cx="2.4" cy="9.6" r="0.4" />
      <circle cx="4" cy="9.6" r="0.4" />
      <circle cx="5.6" cy="9.6" r="0.4" />
      <circle cx="7.2" cy="9.6" r="0.4" />
      <circle cx="1.6" cy="11.2" r="0.4" />
      <circle cx="3.2" cy="11.2" r="0.4" />
      <circle cx="4.8" cy="11.2" r="0.4" />
      <circle cx="6.4" cy="11.2" r="0.4" />
      <circle cx="8" cy="11.2" r="0.4" />
    </g>
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
  const { locale, setLocale, t } = useTranslations()

  // Función para cambiar idioma y navegar
  const handleLanguageChange = (newLocale: Locale) => {
    setLocale(newLocale)
    // Navegar a la ruta con el nuevo idioma
    if (newLocale === 'en') {
      router.push('/en')
    } else {
      router.push('/')
    }
  }

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
    locale === 'es' ? "Digital LED" : "Digital LED",
    locale === 'es' ? "Pantalla LED" : "LED Screen",
    locale === 'es' ? "Valla Tradicional" : "Traditional Billboard",
    locale === 'es' ? "Impresa" : "Printed",
    "Backlight",
    "Premium",
    locale === 'es' ? "Autopista" : "Highway",
    locale === 'es' ? "Mobiliario Urbano" : "Urban Furniture",
    locale === 'es' ? "Móvil" : "Mobile",
  ]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/vallas-publicitarias?search=${encodeURIComponent(searchQuery.trim())}`)
      setShowSuggestions(false)
      setMobileMenuOpen(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion)
    router.push(`/vallas-publicitarias?search=${encodeURIComponent(suggestion)}`)
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
              {t('nav.home')}
            </Link>
            <Link href="/vallas-publicitarias" className="text-sm font-medium transition-colors hover:text-primary">
              {t('nav.billboards')}
            </Link>
            <Link href="/print-shop" className="text-sm font-medium transition-colors hover:text-primary">
              {t('nav.printShop')}
            </Link>
            <Link href="/about" className="text-sm font-medium transition-colors hover:text-primary">
              {t('nav.about')}
            </Link>
            <Link href="/contact" className="text-sm font-medium transition-colors hover:text-primary">
              {t('nav.contact')}
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex" ref={searchRef}>
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
              <Input
                type="search"
                placeholder={t('nav.search')}
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 hidden md:flex">
                {locale === 'es' ? <BoliviaFlag className="h-4 w-4" /> : <USAFlag className="h-4 w-4" />}
                <span className="text-sm">{localeNames[locale]}</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLocale('es')} className="gap-2">
                <BoliviaFlag className="h-4 w-4" />
                {localeNames.es}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocale('en')} className="gap-2">
                <USAFlag className="h-4 w-4" />
                {localeNames.en}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <UserMenu />
          <Button variant="ghost" size="icon" className="relative" asChild>
            <Link href="/cart">
              <ShoppingCart className="h-5 w-5" />
              <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-primary">
                0
              </Badge>
              <span className="sr-only">{t('nav.cart')}</span>
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="sr-only">{t('nav.menu')}</span>
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
                placeholder={t('nav.search')} 
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
              {t('nav.home')}
            </Link>
            <Link href="/vallas-publicitarias" className="text-sm font-medium transition-colors hover:text-primary">
              {t('nav.billboards')}
            </Link>
            <Link href="/print-shop" className="text-sm font-medium transition-colors hover:text-primary">
              {t('nav.printShop')}
            </Link>
            <Link href="/about" className="text-sm font-medium transition-colors hover:text-primary">
              {t('nav.about')}
            </Link>
            <Link href="/contact" className="text-sm font-medium transition-colors hover:text-primary">
              {t('nav.contact')}
            </Link>
          </nav>
          <div className="flex flex-col space-y-2 pt-4 border-t">
            <div className="text-sm font-medium text-muted-foreground">Idioma / Language</div>
            <div className="flex gap-2">
              <Button 
                variant={locale === 'es' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => handleLanguageChange('es')}
                className="gap-2"
              >
                <BoliviaFlag className="h-3 w-3" />
                ES
              </Button>
              <Button 
                variant={locale === 'en' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => handleLanguageChange('en')}
                className="gap-2"
              >
                <USAFlag className="h-3 w-3" />
                EN
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
