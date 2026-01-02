"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { MapPin, Phone, Mail, Clock, Building2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { useMessages } from "@/hooks/use-messages"
import { useTranslations } from "@/hooks/use-translations"


// Dynamic ContactMap to avoid SSR issues
const ContactMap = dynamic(() => import("@/components/maps/ContactMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-muted rounded-lg flex items-center justify-center">
      <p className="text-muted-foreground">Cargando mapa...</p>
    </div>
  ),
})

export default function ContactPage() {
  const { t } = useTranslations()
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: ''
  })
  // Anti-spam fields (honeypot + JS/time validation)
  const [antiSpam, setAntiSpam] = useState({ website: '', ts: '', js: '0' })
  const { addMessage } = useMessages()

  // Initialize anti-spam fields on mount
  useEffect(() => {
    setAntiSpam({ website: '', ts: String(Date.now()), js: '1' })
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/form/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          message: formData.message,
          origin: 'Contacto',
          // Anti-spam metadata
          website: antiSpam.website,
          ts: Number(antiSpam.ts),
          js: antiSpam.js
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error sending message:', errorData)
        alert('Error al enviar el mensaje. Por favor, inténtalo de nuevo.')
        return
      }

      // Guardar mensaje en localStorage también
      await addMessage({
        asunto: `Mensaje de contacto - ${formData.name}`,
        mensaje: formData.message,
        email: formData.email
      })

      setFormSubmitted(true)
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        message: ''
      })
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Error al enviar el mensaje. Por favor, inténtalo de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container px-4 py-8 md:px-6 md:py-12">
      <div className="max-w-6xl mx-auto">
        {/* Título Sucursales */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{t('contact.page.branches')}</h2>
        </div>

        {/* Fichas de Sucursales */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* La Paz */}
          <div className="space-y-6">
            <Card className="shadow-lg">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-6 text-center">{t('contact.page.laPaz')}</h3>
                
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
                      <h4 className="font-semibold mb-2">{t('contact.page.location')}</h4>
                      <address className="not-italic text-muted-foreground" dangerouslySetInnerHTML={{ __html: t('contact.page.laPazAddress') }}>
                      </address>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <Phone className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">{t('contact.page.phones')}</h4>
                      <p className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: t('contact.page.laPazPhones') }}>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <Mail className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">{t('contact.page.email')}</h4>
                      <p className="text-muted-foreground">
                        <a href="mailto:contactos@publicidadvialimagen.com" className="hover:text-primary">
                          {t('contact.page.laPazEmail')}
                        </a>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <Clock className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">{t('contact.page.hours')}</h4>
                      <p className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: t('contact.page.laPazHours') }}>
                      </p>
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
                <h3 className="text-xl font-semibold mb-6 text-center">{t('contact.page.santaCruz')}</h3>
                
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
                      <h4 className="font-semibold mb-2">{t('contact.page.location')}</h4>
                      <address className="not-italic text-muted-foreground" dangerouslySetInnerHTML={{ __html: t('contact.page.santaCruzAddress') }}>
                      </address>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <Phone className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">{t('contact.page.phones')}</h4>
                      <p className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: t('contact.page.santaCruzPhones') }}>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <Mail className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">{t('contact.page.email')}</h4>
                      <p className="text-muted-foreground">
                        <a href="mailto:comercial@publicidadvialimagen.com" className="hover:text-primary">
                          {t('contact.page.santaCruzEmail')}
                        </a>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <Clock className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">{t('contact.page.hours')}</h4>
                      <p className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: t('contact.page.santaCruzHours') }}>
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Mapas de Sucursales (Leaflet Hybrid Maps) */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold tracking-tight mb-6 text-center">{t('contact.page.branchLocation')}</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Mapa de La Paz */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center">{t('contact.page.laPaz')}</h3>
              <ContactMap 
                lat={-16.506308}
                lng={-68.139439}
                title={`${t('contact.page.laPaz')}<br/>C. Nicolás Acosta Esq. Pedro Blanco<br/><a href='https://maps.app.goo.gl/mGtyd2gxh4B7a7T97' target='_blank' style='color: #dc2626; text-decoration: none;'>${t('contact.page.viewLocation')}</a>`}
                height={300}
              />
            </div>

            {/* Mapa de Santa Cruz */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center">{t('contact.page.santaCruz')}</h3>
              <ContactMap 
                lat={-17.751314}
                lng={-63.153452}
                title={`${t('contact.page.santaCruz')}<br/>Avenida 2 de Agosto, Calle 6<br/><a href='https://maps.app.goo.gl/Ead7Bnyu5EG5jdQE9' target='_blank' style='color: #dc2626; text-decoration: none;'>${t('contact.page.viewLocation')}</a>`}
                height={300}
              />
            </div>
          </div>
        </div>

        {/* Redes Sociales */}
        <div className="mb-12 mt-12">
          <Card className="shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-xl font-semibold mb-6 text-center">{t('contact.page.followUs')}</h2>
              
              <div className="flex flex-col sm:flex-row justify-center gap-8">
                {/* LinkedIn */}
                <a href="https://www.linkedin.com/company/publicidad-vial-imagen" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
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
                </a>

                {/* Facebook */}
                <a href="https://www.facebook.com/PVISRL" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
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
                </a>

                {/* Instagram */}
                <a href="https://www.instagram.com/imagenpublicidadbolivia/?hl=es-la" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
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
                </a>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Formulario de Contacto Completo */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight mb-4 md:text-3xl">{t('contact.page.title')}</h1>
            <p className="text-muted-foreground md:text-lg">
              {t('contact.page.subtitle')}
            </p>
          </div>
          <Card className="shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold mb-6 text-center">{t('contact.page.sendMessage')}</h2>

              {formSubmitted ? (
                <div className="bg-primary/10 text-primary p-4 rounded-lg mb-6">
                  <h3 className="font-semibold text-lg mb-2">{t('contact.page.thanks')}</h3>
                  <p>{t('contact.page.thanksDesc')}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
                  {/* Anti-spam hidden fields: do not alter layout */}
                  {/* Honeypot: visible to bots, offscreen for users */}
                  <input
                    type="text"
                    name="website"
                    value={antiSpam.website}
                    onChange={(e) => setAntiSpam(s => ({ ...s, website: e.target.value }))}
                    autoComplete="off"
                    tabIndex={-1}
                    aria-hidden="true"
                    style={{ position: 'absolute', left: '-9999px' }}
                  />
                  {/* Timestamp and JS execution markers */}
                  <input type="hidden" name="ts" value={antiSpam.ts} readOnly />
                  <input type="hidden" name="js" value={antiSpam.js} readOnly />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t('contact.form.name')}</Label>
                      <Input 
                        id="name" 
                        name="name"
                        placeholder={t('contact.page.namePlaceholder')} 
                        value={formData.name}
                        onChange={handleInputChange}
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">{t('contact.form.email')}</Label>
                      <Input 
                        id="email" 
                        name="email"
                        type="email" 
                        placeholder={t('contact.page.emailPlaceholder')} 
                        value={formData.email}
                        onChange={handleInputChange}
                        required 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">{t('contact.form.phone')}</Label>
                      <Input 
                        id="phone" 
                        name="phone"
                        type="tel" 
                        placeholder={t('contact.page.phonePlaceholder')} 
                        value={formData.phone}
                        onChange={handleInputChange}
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">{t('contact.form.company')}</Label>
                      <Input 
                        id="company" 
                        name="company"
                        placeholder={t('contact.page.companyPlaceholder')} 
                        value={formData.company}
                        onChange={handleInputChange}
                        required 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">{t('contact.form.message')}</Label>
                    <Textarea 
                      id="message" 
                      name="message"
                      placeholder={t('contact.page.messagePlaceholder')} 
                      className="min-h-[150px]" 
                      maxLength={500}
                      value={formData.message}
                      onChange={handleInputChange}
                      required 
                    />
                  </div>

                  <div className="text-center">
                    <Button 
                      type="submit" 
                      className="w-full sm:w-auto px-8"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? t('contact.page.sending') : t('contact.page.sendMessageBtn')}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
