import Image from "next/image"
import Link from "next/link"
import { Heart, Award, Users, Truck } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function AboutPage() {
  return (
    <div className="container px-4 py-8 md:px-6 md:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Sobre nosotros</h1>
        <div className="flex items-center text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary">
            Inicio
          </Link>
          <span className="mx-2">/</span>
          <span>Sobre nosotros</span>
        </div>
      </div>

      {/* Hero Section */}
      <div className="grid md:grid-cols-2 gap-8 items-center mb-16">
        <div className="relative h-[300px] md:h-[400px] rounded-lg overflow-hidden order-1 md:order-1">
          <Image
            src="/publicidad_vial_imagen.png"
            alt="Equipo de Publicidad Vial Imagen"
            fill
            className="object-contain rounded-lg"
          />
        </div>
        <div className="order-2 md:order-2">
          <h2 className="text-3xl font-bold mb-4">Nuestra historia</h2>
          <p className="text-muted-foreground mb-4">
            Publicidad Vial Imagen una empresa con 33 años de experiencia en el sector de la publicidad. Disponemos de espacios publicitarios en vía pública para ayudar a nuestros clientes a promocionar su marca, productos y servicios.
          </p>
          <p className="text-muted-foreground mb-4">
            Disponemos de última tecnología para proporcionar a nuestros clientes una publicidad de alto impacto y efectiva de forma rápida y sencilla.
          </p>
          <p className="text-muted-foreground">
            Nos tomamos la publicidad en serio, por eso ofrecemos productos de calidad y un excelente servicio al cliente. Nuestro equipo de profesionales está aquí para ayudarle con cualquier pregunta o inquietud. ¡No dude en contactar con nosotros si desea obtener más información sobre cómo podemos ayudarle a llevar su publicidad al siguiente nivel!
          </p>
        </div>
      </div>

      {/* Second Hero Section */}
      <div className="grid md:grid-cols-2 gap-8 items-center mb-16">
        <div className="order-2 md:order-1">
          <h2 className="text-3xl font-bold mb-4">Nuestra empresa</h2>
          <p className="text-muted-foreground mb-4">
            Publicidad Vial Imagen S.R.L. se encuentra a la vanguardia de la publicidad boliviana desde 1980.
          </p>
          <p className="text-muted-foreground mb-4">
            Martín Sillerico, Gerente General y fundador, a través de varias líneas de negocio ha logrado posicionarse a nivel nacional con su amplia gama de productos y servicios.
          </p>
          <p className="text-muted-foreground mb-4">
            Generamos ideas, las diseñamos y las plasmamos, elaborando y produciendo conceptos de marketing con valor para nuestros clientes.
          </p>
          <p className="text-muted-foreground">
            Somos una empresa líder en servicios integrales de publicidad a nivel nacional, reconocida por su capacidad tecnológica y calidad humana que contribuye día a día al desarrollo económico del país.
          </p>
        </div>
        <div className="flex justify-center order-1 md:order-2">
          <div className="relative">
            <Image
              src="/martin_sillerico.png"
              alt="Martín Sillerico Ariñez"
              width={300}
              height={400}
              className="rounded-lg"
            />
            <div className="absolute bottom-4 left-4 right-4 bg-[#be0811]/80 text-white p-3 rounded-lg">
              <p className="italic text-sm">Martín Sillerico Ariñez</p>
              <p className="font-bold text-sm">Gerente General</p>
            </div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="mb-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-4">Nuestros valores</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            En Publicidad Vial Imagen, nuestros valores fundamentales guían todo lo que hacemos, desde la selección de espacios hasta el servicio al cliente.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-card rounded-lg border p-6 text-center">
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-4">
              <Heart className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Compromiso</h3>
            <p className="text-muted-foreground">
              Nos comprometemos con el éxito de nuestros clientes, ofreciendo soluciones publicitarias efectivas y de calidad.
            </p>
          </div>

          <div className="bg-card rounded-lg border p-6 text-center">
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-4">
              <Award className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Calidad garantizada</h3>
            <p className="text-muted-foreground">
              Todos nuestros espacios y servicios cumplen los más altos estándares de calidad y efectividad publicitaria.
            </p>
          </div>

          <div className="bg-card rounded-lg border p-6 text-center">
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-4">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Enfoque al cliente</h3>
            <p className="text-muted-foreground">
              Estamos dedicados a proporcionar un servicio excepcional y construir relaciones duraderas con nuestros clientes.
            </p>
          </div>

          <div className="bg-card rounded-lg border p-6 text-center">
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-4">
              <Truck className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Confiabilidad</h3>
            <p className="text-muted-foreground">
              Cumplimos nuestras promesas con entrega rápida, instalaciones precisas y soporte al cliente responsivo.
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}
