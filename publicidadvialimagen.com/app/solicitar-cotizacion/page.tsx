"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Calendar,
  User,
  Phone,
  Mail,
  FileText,
  Settings,
  ArrowLeft,
  CheckCircle
} from "lucide-react"
import Link from "next/link"
import { useTranslations } from "@/hooks/use-translations"


export default function SolicitarCotizacionPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { t } = useTranslations()
  
  // Datos que vienen de la página de producto
  const [datosProducto, setDatosProducto] = useState({
    fechaInicio: searchParams.get('fechaInicio') || '',
    mesesAlquiler: searchParams.get('mesesAlquiler') || '',
    serviciosAdicionales: searchParams.get('serviciosAdicionales')?.split(',').filter(s => s.trim() !== '') || [],
    soporte: searchParams.get('soporte') || ''
  })

  // Datos del formulario
  const [formData, setFormData] = useState({
    empresa: '',
    contacto: '',
    telefono: '',
    email: '',
    comentarios: ''
  })

  // Inicializar servicios con los que ya vienen seleccionados
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  // Manejar cambios en el formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }


  // Enviar solicitud
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('📝 Formulario enviado, iniciando proceso...')
    console.log('📋 Datos del formulario:', formData)
    console.log('📋 Datos del producto:', datosProducto)
    console.log('📋 Servicios seleccionados:', serviciosSeleccionados)
    
    setIsSubmitting(true)

    try {
      // Validación temporalmente deshabilitada para debug
      console.log('🔍 Validando datos...')
      console.log('📋 formData:', formData)
      console.log('📋 datosProducto:', datosProducto)
      
      // Validar datos requeridos
      if (!formData.empresa || !formData.contacto || !formData.telefono || !formData.email) {
        console.log('❌ Faltan campos del formulario')
        alert('Por favor, completa todos los campos requeridos')
        setIsSubmitting(false)
        return
      }

      if (!datosProducto.fechaInicio || !datosProducto.mesesAlquiler || !datosProducto.soporte) {
        console.log('❌ Faltan datos del producto')
        alert('Error: Faltan datos del producto. Por favor, regresa a la página anterior y selecciona un soporte.')
        setIsSubmitting(false)
        return
      }
      
      console.log('✅ Validación pasada, continuando...')

      const solicitudData = {
        ...formData,
        fechaInicio: datosProducto.fechaInicio,
        mesesAlquiler: parseInt(datosProducto.mesesAlquiler),
        soporte: datosProducto.soporte,
        serviciosAdicionales: serviciosSeleccionados
      }

      console.log('🚀 Enviando solicitud al API:', solicitudData)

      const response = await fetch('/api/solicitudes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(solicitudData)
      })

      console.log('📡 Respuesta del servidor:', response.status, response.statusText)

      // Manejo robusto de respuesta: no asumir que siempre hay JSON
      let data = null;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          const text = await response.text();
          console.error('Respuesta no JSON:', text);
          throw new Error(`Error del servidor (${response.status}): ${response.statusText}`);
        }
      } catch (jsonError) {
        console.error('Error parseando respuesta JSON:', jsonError);
        throw new Error(`Error del servidor (${response.status}): ${response.statusText}`);
      }

      if (response.ok) {
        console.log('✅ Solicitud enviada exitosamente:', data)
        setIsSubmitted(true)
      } else {
        const errorMessage = data?.error || data?.message || `Error del servidor (${response.status})`;
        console.error('❌ Error del servidor:', data)
        alert(`Error: ${errorMessage}`)
      }
    } catch (error) {
      console.error('❌ Error al enviar solicitud:', error)
      alert('Error al enviar la solicitud. Por favor, inténtalo de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Mapear nombres abreviados a nombres completos
  const mapearServicios = (servicios: string[]) => {
    const mapeo: { [key: string]: string } = {
      'diseno': t('billboards.page.graphicDesign'),
      'impresion': t('billboards.page.bannerPrinting'),
      'instalacion': t('billboards.page.billboardInstallation')
    }
    return servicios.map(servicio => mapeo[servicio] || servicio)
  }

  // Inicializar servicios seleccionados con los que vienen de la página anterior
  useEffect(() => {
    console.log('🔄 Inicializando servicios:', datosProducto.serviciosAdicionales)
    if (datosProducto.serviciosAdicionales.length > 0) {
      const serviciosCompletos = mapearServicios(datosProducto.serviciosAdicionales)
      console.log('🔄 Servicios mapeados:', serviciosCompletos)
      setServiciosSeleccionados(serviciosCompletos)
    }
  }, [datosProducto.serviciosAdicionales])

  // Debug: Log del estado del formulario
  useEffect(() => {
    console.log('📋 Estado del formulario:', {
      formData,
      isSubmitting,
      isSubmitted,
      serviciosSeleccionados
    })
  }, [formData, isSubmitting, isSubmitted, serviciosSeleccionados])

  // Si no hay datos del producto, redirigir
  useEffect(() => {
    if (!datosProducto.fechaInicio || !datosProducto.mesesAlquiler || !datosProducto.soporte) {
      router.push('/')
    }
  }, [datosProducto, router])

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('quoteRequest.success.title')}</h2>
              <p className="text-gray-600 mb-6">
                {t('quoteRequest.success.description')}
              </p>
              <div className="space-y-3">
                <Link href="/">
                  <Button className="w-full">
                    {t('quoteRequest.success.backToHome')}
                  </Button>
                </Link>
                <Link href="/vallas-publicitarias">
                  <Button variant="outline" className="w-full">
                    {t('quoteRequest.success.viewMoreProducts')}
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-[#D54644] hover:text-[#D54644]/80 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('quoteRequest.back')}
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">{t('quoteRequest.title')}</h1>
          <p className="text-gray-600">{t('quoteRequest.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Resumen de la selección */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                {t('quoteRequest.summary.title')}
              </CardTitle>
              <CardDescription>
                {t('quoteRequest.summary.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="font-medium">{t('quoteRequest.summary.startDate')}</span>
                <span>{datosProducto.fechaInicio}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-gray-400" />
                <span className="font-medium">{t('quoteRequest.summary.rentalMonths')}</span>
                <span>{datosProducto.mesesAlquiler} {t('quoteRequest.summary.months')}</span>
              </div>
              
              
              {serviciosSeleccionados.length > 0 && (
                <div>
                  <span className="font-medium">{t('quoteRequest.summary.additionalServices')}</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {serviciosSeleccionados.map((servicio, index) => (
                      <span key={index} className="inline-flex items-center rounded-md bg-blue-100 px-2 py-1 text-xs text-blue-800">
                        {servicio}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Formulario */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                {t('quoteRequest.contact.title')}
              </CardTitle>
              <CardDescription>
                {t('quoteRequest.contact.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Campos ocultos para confundir al autocompletado */}
                <div style={{ display: 'none' }}>
                  <input type="email" name="fake-email" autoComplete="off" />
                  <input type="text" name="fake-field" autoComplete="off" />
                </div>
                <div>
                  <Label htmlFor="empresa">{t('quoteRequest.contact.company')} *</Label>
                  <Input
                    id="empresa"
                    name="empresa"
                    value={formData.empresa}
                    onChange={handleInputChange}
                    placeholder={t('quoteRequest.contact.companyPlaceholder')}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="contacto">{t('quoteRequest.contact.name')} *</Label>
                  <Input
                    id="contacto"
                    name="contacto"
                    value={formData.contacto}
                    onChange={handleInputChange}
                    placeholder={t('quoteRequest.contact.namePlaceholder')}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="telefono">{t('quoteRequest.contact.phone')} *</Label>
                  <Input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    placeholder={t('quoteRequest.contact.phonePlaceholder')}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">{t('quoteRequest.contact.email')} *</Label>
                  {/* Campo oculto para confundir al autocompletado */}
                  <input type="text" style={{ display: 'none' }} autoComplete="off" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder={t('quoteRequest.contact.emailPlaceholder')}
                    required
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-form-type="other"
                  />
                </div>

                <div>
                  <Label htmlFor="comentarios">{t('quoteRequest.contact.comments')}</Label>
                  <Textarea
                    id="comentarios"
                    name="comentarios"
                    value={formData.comentarios}
                    onChange={handleInputChange}
                    placeholder={t('quoteRequest.contact.commentsPlaceholder')}
                    rows={3}
                  />
                </div>


                <Button 
                  type="submit" 
                  className="w-full bg-[#D54644] hover:bg-[#D54644]/90"
                  disabled={isSubmitting}
                  onClick={() => console.log('🔘 Botón de envío clickeado')}
                >
                  {isSubmitting ? t('quoteRequest.contact.submitting') : t('quoteRequest.contact.submit')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
