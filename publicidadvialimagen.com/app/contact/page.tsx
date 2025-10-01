"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { MapPin, Phone, Mail, Clock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"

// Dynamic OSM map (Leaflet) to avoid SSR issues
const SimpleMap = dynamic(() => import("@/components/simple-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-muted rounded-lg flex items-center justify-center">
      <p className="text-muted-foreground">Cargando mapa...</p>
    </div>
  ),
})

export default function ContactPage() {
  const [formSubmitted, setFormSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    // In a real application, you would handle form submission here
    setFormSubmitted(true)
  }

  return (
    <div className="container px-4 py-8 md:px-6 md:py-12">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight mb-4 md:text-4xl">Contacto</h1>
          <p className="text-muted-foreground md:text-lg">
            ¿Tienes alguna pregunta? Nos encantaría escucharte. Envíanos un mensaje y te responderemos lo antes posible.
          </p>
        </div>

        {/* Formulario de Contacto Completo */}
        <div className="mb-12">
          <Card className="shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold mb-6 text-center">Envíanos un Mensaje</h2>

              {formSubmitted ? (
                <div className="bg-primary/10 text-primary p-4 rounded-lg mb-6">
                  <h3 className="font-semibold text-lg mb-2">¡Gracias!</h3>
                  <p>Tu mensaje ha sido enviado exitosamente. Te responderemos lo antes posible.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre</Label>
                      <Input id="name" placeholder="Tu nombre" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="tu@email.com" required />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input id="phone" type="tel" placeholder="Tu teléfono" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Empresa</Label>
                      <Input id="company" placeholder="Tu empresa" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Asunto</Label>
                    <Input id="subject" placeholder="¿En qué podemos ayudarte?" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Mensaje</Label>
                    <Textarea 
                      id="message" 
                      placeholder="Cuéntanos más detalles sobre tu proyecto o consulta..." 
                      className="min-h-[150px]" 
                      required 
                    />
                  </div>

                  <div className="text-center">
                    <Button type="submit" className="w-full sm:w-auto px-8">
                      Enviar Mensaje
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Redes Sociales */}
        <div className="mb-12">
          <Card className="shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-xl font-semibold mb-6 text-center">Síguenos en Redes Sociales</h2>
              
              <div className="flex justify-center gap-8">
                {/* LinkedIn */}
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
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
                      className="h-6 w-6"
                    >
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                      <rect x="2" y="9" width="4" height="12"></rect>
                      <circle cx="4" cy="4" r="2"></circle>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">LinkedIn</h3>
                    <p className="text-muted-foreground text-sm">Publicidad Vial Imagen S.R.L.</p>
                  </div>
                </div>

                {/* Facebook */}
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
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
                      className="h-6 w-6"
                    >
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">Facebook</h3>
                    <p className="text-muted-foreground text-sm">Publicidad Vial Imagen S.R.L.</p>
                  </div>
                </div>

                {/* Instagram */}
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
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
                      className="h-6 w-6"
                    >
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">Instagram</h3>
                    <p className="text-muted-foreground text-sm">@imagenpublicidadbolivia</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Título Sucursales */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Sucursales</h2>
        </div>

        {/* Fichas de Sucursales */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* La Paz */}
          <div className="space-y-6">
            <Card className="shadow-lg">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-6 text-center">La Paz</h3>
                
                {/* Imagen de La Paz */}
                <div className="flex justify-center mb-6">
                  <div className="w-64 h-64 rounded-lg overflow-hidden shadow-lg">
                    <img 
                      src="/sucursal_la_paz_imagen.png" 
                      alt="Sucursal La Paz" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Ubicación</h4>
                      <address className="not-italic text-muted-foreground">
                        C. Nicolás Acosta Esq. Pedro Blanco<br />
                        (Alto San Pedro) N° 1471<br />
                        La Paz, Bolivia
                      </address>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <Phone className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Teléfonos</h4>
                      <p className="text-muted-foreground">
                        <a href="tel:+59122493155" className="hover:text-primary">
                          (591-2) 2493155 – 2493156
                        </a>
                      </p>
                      <p className="text-muted-foreground">
                        <a href="tel:+59176244800" className="hover:text-primary">
                          76244800 – 77229109
                        </a>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <Mail className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Email</h4>
                      <p className="text-muted-foreground">
                        <a href="mailto:contactos@publicidadvialimagen.com" className="hover:text-primary">
                          contactos@publicidadvialimagen.com
                        </a>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <Clock className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Horarios</h4>
                      <p className="text-muted-foreground">Lunes - Viernes: 8:30am - 6:30pm</p>
                      <p className="text-muted-foreground">Sábados: 9:30am - 1:00pm</p>
                      <p className="text-muted-foreground">Domingos: Cerrado</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Santa Cruz */}
          <div className="space-y-6">
            <Card className="shadow-lg">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-6 text-center">Santa Cruz</h3>
                
                {/* Imagen de Santa Cruz */}
                <div className="flex justify-center mb-6">
                  <div className="w-64 h-64 rounded-lg overflow-hidden shadow-lg">
                    <img 
                      src="/sucursal_santa_cruz_imagen.png" 
                      alt="Sucursal Santa Cruz" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Ubicación</h4>
                      <address className="not-italic text-muted-foreground">
                        Avenida 2 de Agosto, Calle 6<br />
                        (Entre 4 y 5 Anillo) N° 27<br />
                        Santa Cruz, Bolivia
                      </address>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <Phone className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Teléfonos</h4>
                      <p className="text-muted-foreground">
                        <a href="tel:+59133494677" className="hover:text-primary">
                          (591-3) 3494677
                        </a>
                      </p>
                      <p className="text-muted-foreground">
                        <a href="tel:+59176244800" className="hover:text-primary">
                          76244800 - 78988344
                        </a>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <Mail className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Email</h4>
                      <p className="text-muted-foreground">
                        <a href="mailto:comercial@publicidadvialimagen.com" className="hover:text-primary">
                          comercial@publicidadvialimagen.com
                        </a>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <Clock className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Horarios</h4>
                      <p className="text-muted-foreground">Lunes - Viernes: 8:30am - 5:15pm</p>
                      <p className="text-muted-foreground">Sábados y Domingos: Cerrado</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Mapas de Sucursales (OpenStreetMap) */}
        <div className="grid md:grid-cols-2 gap-8 mt-8">
          {/* Mapa de La Paz */}
          <SimpleMap
            center={[-16.506308, -68.139439]}
            heightClassName="h-96"
            markerTitle="La Paz"
            markerSubtitle="Publicidad Vial Imagen"
            markerLinkUrl="https://maps.app.goo.gl/joMzm79QcDd1Tp5VA"
            markerLinkLabel="Abrir en Google Maps"
          />

          {/* Mapa de Santa Cruz */}
          <SimpleMap
            center={[-17.751314, -63.153452]}
            heightClassName="h-96"
            markerTitle="Santa Cruz"
            markerSubtitle="Publicidad Vial Imagen"
            markerLinkUrl="https://maps.app.goo.gl/nX8e3qsa2E3rfXQA6"
            markerLinkLabel="Abrir en Google Maps"
          />
        </div>
      </div>
    </div>
  )
}
