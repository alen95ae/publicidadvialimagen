"use client"

import Image from "next/image"
import Link from "next/link"
import { useTranslations } from "@/hooks/use-translations"

export default function Footer() {
  const { t } = useTranslations()
  
  // Función para obtener el nombre original del formato para la URL
  const getFormatUrlName = (format: string) => {
    // Mapear los nombres de formatos a sus equivalentes para URL
    const formatUrlMap: Record<string, string> = {
      'Unipolar': 'Unipolar',
      'Bipolar': 'Bipolar', 
      'Tripolar': 'Tripolar',
      'Mural': 'Mural',
      'Mega Valla': 'Mega Valla',
      'Cartelera': 'Cartelera',
      'Paleta': 'Paleta'
    }
    return formatUrlMap[format] || format
  }
  
  return (
    <footer className="border-t bg-background">
      <div className="container px-4 py-8 md:px-6 md:py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          <div className="space-y-4">
            <Link href="/" className="flex items-center">
              <div className="w-40 h-40 flex items-center justify-center relative">
                <Image 
                  src="/logo-publicidad-vial.svg" 
                  alt="Publicidad Vial Imagen" 
                  width={144}
                  height={144}
                  className="h-36 w-auto"
                  priority
                />
              </div>
            </Link>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-medium">{t('footer.billboards')}</h3>
            <nav className="flex flex-col space-y-2">
              <Link href={`/vallas-publicitarias?formats=${getFormatUrlName('Unipolar')}`} className="text-sm text-muted-foreground hover:text-primary">
                {t('billboards.categories.unipolar')}
              </Link>
              <Link href={`/vallas-publicitarias?formats=${getFormatUrlName('Bipolar')}`} className="text-sm text-muted-foreground hover:text-primary">
                {t('billboards.categories.bipolar')}
              </Link>
              <Link href={`/vallas-publicitarias?formats=${getFormatUrlName('Tripolar')}`} className="text-sm text-muted-foreground hover:text-primary">
                {t('billboards.categories.tripolar')}
              </Link>
              <Link href={`/vallas-publicitarias?formats=${getFormatUrlName('Mural')}`} className="text-sm text-muted-foreground hover:text-primary">
                {t('billboards.categories.mural')}
              </Link>
              <Link href={`/vallas-publicitarias?formats=${getFormatUrlName('Mega Valla')}`} className="text-sm text-muted-foreground hover:text-primary">
                {t('billboards.categories.megaValla')}
              </Link>
              <Link href={`/vallas-publicitarias?formats=${getFormatUrlName('Cartelera')}`} className="text-sm text-muted-foreground hover:text-primary">
                {t('billboards.categories.cartelera')}
              </Link>
              <Link href={`/vallas-publicitarias?formats=${getFormatUrlName('Paleta')}`} className="text-sm text-muted-foreground hover:text-primary">
                {t('billboards.categories.paleta')}
              </Link>
            </nav>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-medium">{t('footer.company')}</h3>
            <nav className="flex flex-col space-y-2">
              <Link href="/about" className="text-sm text-muted-foreground hover:text-primary">
                {t('footer.links.about')}
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-primary">
                {t('footer.links.successCases')}
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-primary">
                {t('footer.links.deliveryInfo')}
              </Link>
              <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary">
                {t('footer.links.contact')}
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-primary">
                {t('footer.links.blog')}
              </Link>
            </nav>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-medium">{t('footer.laPaz')}</h3>
            <div className="flex flex-col space-y-2 text-sm text-muted-foreground">
              <p>C. Nicolás Acosta Esq. Pedro Blanco</p>
              <p>(Alto San Pedro) N° 1471</p>
              <p>contactos@publicidadvialimagen.com</p>
              <p>TEL: (591-2) 2493155 – 2493156</p>
              <p>CEL.: 76244800 – 77229109</p>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-medium">{t('footer.santaCruz')}</h3>
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
              &copy; {new Date().getFullYear()} Publicidad Vial Imagen. {t('footer.copyright')}
            </p>
            <div className="flex items-center gap-4">
              <div className="flex justify-center gap-4">
                <Link href="/privacy-policy" className="text-xs text-muted-foreground hover:text-primary">
                  {t('footer.links.privacy')}
                </Link>
                <Link href="/terms-of-service" className="text-xs text-muted-foreground hover:text-primary">
                  {t('footer.links.terms')}
                </Link>
                <Link href="/cookie-policy" className="text-xs text-muted-foreground hover:text-primary">
                  {t('footer.links.cookies')}
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
                  <span className="sr-only">{t('footer.social.linkedin')}</span>
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
                  <span className="sr-only">{t('footer.social.facebook')}</span>
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
                  <span className="sr-only">{t('footer.social.instagram')}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}