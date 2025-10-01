"use client"

import { useState } from "react"
import Link from "next/link"
import { ShoppingCart, Search, ChevronDown, Globe, User, Menu, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
          <div className="hidden md:flex">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar espacios..."
                className="w-[200px] pl-8 md:w-[250px] rounded-full bg-muted"
              />
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Globe className="h-5 w-5" />
                <span className="sr-only">Idioma</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Español</DropdownMenuItem>
              <DropdownMenuItem>English</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" className="relative" asChild>
            <Link href="/login">
              <User className="h-5 w-5" />
              <span className="sr-only">Iniciar Sesión</span>
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
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Buscar espacios..." className="w-full pl-8 rounded-full bg-muted" />
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
