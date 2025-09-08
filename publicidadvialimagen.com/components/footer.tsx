import Image from "next/image"
import Link from "next/link"

export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container px-4 py-8 md:px-6 md:py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          <div className="space-y-4">
            <Link href="/" className="flex items-center">
              <div className="w-32 h-32 flex items-center justify-center">
                <img 
                  src="/logo-publicidad-vial.svg" 
                  alt="Publicidad Vial Imagen" 
                  className="h-28 w-auto"
                />
              </div>
            </Link>
            <p className="text-sm text-muted-foreground text-pretty">
              Tu socio estratégico en publicidad exterior y servicios de impresión profesional. Conectamos tu marca con
              audiencias masivas.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
                <span className="sr-only">Facebook</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
                <span className="sr-only">Instagram</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                </svg>
                <span className="sr-only">Twitter</span>
              </Link>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Servicios</h3>
            <nav className="flex flex-col space-y-2">
              <Link href="/billboards" className="text-sm text-muted-foreground hover:text-primary">
                Vallas Publicitarias
              </Link>
              <Link href="/billboards/led-screens" className="text-sm text-muted-foreground hover:text-primary">
                Pantallas LED
              </Link>
              <Link href="/billboards/traditional" className="text-sm text-muted-foreground hover:text-primary">
                Vallas Tradicionales
              </Link>
              <Link href="/print-shop" className="text-sm text-muted-foreground hover:text-primary">
                Impresión Digital
              </Link>
              <Link href="/billboards/mobile" className="text-sm text-muted-foreground hover:text-primary">
                Publicidad Móvil
              </Link>
            </nav>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Empresa</h3>
            <nav className="flex flex-col space-y-2">
              <Link href="/about" className="text-sm text-muted-foreground hover:text-primary">
                Nosotros
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-primary">
                Casos de Éxito
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-primary">
                Noticias
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-primary">
                Blog
              </Link>
            </nav>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Soporte</h3>
            <nav className="flex flex-col space-y-2">
              <Link href="#" className="text-sm text-muted-foreground hover:text-primary">
                Centro de Ayuda
              </Link>
              <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary">
                Contacto
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-primary">
                Términos de Servicio
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-primary">
                Información de Entrega
              </Link>
            </nav>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Contacto</h3>
            <div className="flex flex-col space-y-2 text-sm text-muted-foreground">
              <p>Calle Gran Vía 123</p>
              <p>28013 Madrid, España</p>
              <p>Email: info@publicidadvialimagen.com</p>
              <p>Teléfono: +34 91 123 4567</p>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t pt-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Publicidad Vial Imagen. Todos los derechos reservados.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="text-xs text-muted-foreground hover:text-primary">
                Política de Privacidad
              </Link>
              <Link href="#" className="text-xs text-muted-foreground hover:text-primary">
                Términos de Servicio
              </Link>
              <Link href="#" className="text-xs text-muted-foreground hover:text-primary">
                Política de Cookies
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <Image
                src="/placeholder.svg?height=30&width=40"
                alt="Visa"
                width={40}
                height={30}
                className="rounded border"
              />
              <Image
                src="/placeholder.svg?height=30&width=40"
                alt="Mastercard"
                width={40}
                height={30}
                className="rounded border"
              />
              <Image
                src="/placeholder.svg?height=30&width=40"
                alt="PayPal"
                width={40}
                height={30}
                className="rounded border"
              />
              <Image
                src="/placeholder.svg?height=30&width=40"
                alt="Bizum"
                width={40}
                height={30}
                className="rounded border"
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
