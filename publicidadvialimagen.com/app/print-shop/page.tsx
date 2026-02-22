"use client"

import Image from "next/image"
import Link from "next/link"

import { Card } from "@/components/ui/card"

export default function PrintShopPage() {
    return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="relative min-h-[50vh] flex items-center overflow-hidden">
        {/* Imagen de fondo */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/impresion_digital_publicitaria_bolivia.png"
            alt="Impresión Digital Publicitaria"
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          {/* Filtro gris oscuro sobre la imagen */}
          <div className="absolute inset-0 bg-gray-900/70" />
            </div>

            {/* Contenido */}
        <div className="container mx-auto px-4 md:px-6 py-12 md:py-16 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white">
              PrintShop
              </h1>
            <p className="text-xl md:text-2xl text-white max-w-2xl mx-auto text-pretty">
              Soluciones de impresión de alta calidad para empresas y marcas. Materiales profesionales que potencian tu presencia visual.
              </p>
            </div>
        </div>
      </section>

      {/* Categorías Section */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {/* Impresión Digital */}
            <Link href="/impresion-digital" className="group">
              <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50">
                <div className="relative w-full aspect-[4/3] bg-muted overflow-hidden">
                  <Image
                    src="/impresion_digital_santacruz_bolivia.png"
                    alt="Impresión Digital"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                      Impresión Digital
                    </h3>
                    <p className="text-sm text-white/90">
                      Materiales de alta calidad para tus proyectos
                    </p>
                  </div>
                </div>
              </Card>
            </Link>

            {/* Displays */}
            <Link href="/impresion-digital?categoria=Displays" className="group">
              <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50">
                <div className="relative w-full aspect-[4/3] bg-muted overflow-hidden">
                  <Image
                    src="/displays_publicitarios_bolivia.png"
                    alt="Displays"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                      Displays
                    </h3>
                    <p className="text-sm text-white/90">
                      Soluciones visuales para tu marca
                    </p>
                  </div>
                </div>
              </Card>
            </Link>

            {/* Corte y Grabado */}
            <Link href="/impresion-digital?categoria=Corte y Grabado" className="group">
              <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50">
                <div className="relative w-full aspect-[4/3] bg-muted overflow-hidden">
                  <Image
                    src="/corte_acrilico_cnc_bolivia.png"
                    alt="Corte y Grabado"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                      Corte y Grabado
                    </h3>
                    <p className="text-sm text-white/90">
                      Precisión y calidad en cada detalle
                    </p>
                  </div>
                </div>
              </Card>
                </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
