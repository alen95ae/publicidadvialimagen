import Image from "next/image"
import Link from "next/link"

export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container px-4 py-8 md:px-6 md:py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          <div className="space-y-4">
            <Link href="/" className="flex items-center">
              <div className="w-40 h-40 flex items-center justify-center">
                <img 
                  src="/logo-publicidad-vial.svg" 
                  alt="Publicidad Vial Imagen" 
                  className="h-36 w-auto"
                />
              </div>
            </Link>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Servicios</h3>
            <nav className="flex flex-col space-y-2">
              <Link href="/billboards" className="text-sm text-muted-foreground hover:text-primary">
                Vallas Publicitarias
              </Link>
              <Link href="/billboards" className="text-sm text-muted-foreground hover:text-primary">
                Pantallas LED
              </Link>
              <Link href="/billboards" className="text-sm text-muted-foreground hover:text-primary">
                Murales
              </Link>
              <Link href="/billboards" className="text-sm text-muted-foreground hover:text-primary">
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
                Información de Entrega
              </Link>
              <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary">
                Contacto
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-primary">
                Blog
              </Link>
            </nav>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-medium">La Paz</h3>
            <div className="flex flex-col space-y-2 text-sm text-muted-foreground">
              <p>C. Nicolás Acosta Esq. Pedro Blanco</p>
              <p>(Alto San Pedro) N° 1471</p>
              <p>contactos@publicidadvialimagen.com</p>
              <p>TEL: (591-2) 2493155 – 2493156</p>
              <p>CEL.: 76244800 – 77229109</p>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Santa Cruz</h3>
            <div className="flex flex-col space-y-2 text-sm text-muted-foreground">
              <p>Avenida 2 de Agosto, Calle 6</p>
              <p>(Entre 4 y 5 Anillo) N° 27</p>
              <p>comercial@publicidadvialimagen.com</p>
              <p>TEL.: (591-3) 3494677</p>
              <p>CEL.: 76244800 - 78988344</p>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t pt-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Publicidad Vial Imagen. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex justify-center gap-4">
                <Link href="/privacy-policy" className="text-xs text-muted-foreground hover:text-primary">
                  Política de Privacidad
                </Link>
                <Link href="/terms-of-service" className="text-xs text-muted-foreground hover:text-primary">
                  Términos de Servicio
                </Link>
                <Link href="/cookie-policy" className="text-xs text-muted-foreground hover:text-primary">
                  Política de Cookies
                </Link>
              </div>
              <div className="flex gap-4">
                {/* LinkedIn */}
                <Link href="https://www.linkedin.com/company/publicidad-vial-imagen" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
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
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                    <rect x="2" y="9" width="4" height="12"></rect>
                    <circle cx="4" cy="4" r="2"></circle>
                  </svg>
                  <span className="sr-only">LinkedIn</span>
                </Link>
                {/* Facebook */}
                <Link href="https://www.facebook.com/PVISRL" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
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
                {/* Instagram */}
                <Link href="https://www.instagram.com/imagenpublicidadbolivia/?hl=es-la" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
