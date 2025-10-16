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


export default function SolicitarCotizacionPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
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

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Solicitud enviada exitosamente:', result)
        setIsSubmitted(true)
      } else {
        const errorData = await response.json()
        console.error('❌ Error del servidor:', errorData)
        alert(`Error: ${errorData.error}`)
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
      'diseno': 'Diseño gráfico',
      'impresion': 'Impresión de lona',
      'instalacion': 'Instalación en valla'
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
              <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Solicitud Enviada!</h2>
              <p className="text-gray-600 mb-6">
                Tu solicitud de cotización ha sido enviada exitosamente. 
                Nos pondremos en contacto contigo pronto.
              </p>
              <div className="space-y-3">
                <Link href="/">
                  <Button className="w-full">
                    Volver al Inicio
                  </Button>
                </Link>
                <Link href="/vallas-publicitarias">
                  <Button variant="outline" className="w-full">
                    Ver Más Productos
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
            Volver
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Solicitar Cotización</h1>
          <p className="text-gray-600">Completa los datos para solicitar tu cotización</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Resumen de la selección */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Resumen de tu Selección
              </CardTitle>
              <CardDescription>
                Revisa los datos que seleccionaste en el producto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="font-medium">Fecha de Inicio:</span>
                <span>{datosProducto.fechaInicio}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-gray-400" />
                <span className="font-medium">Meses de Alquiler:</span>
                <span>{datosProducto.mesesAlquiler} meses</span>
              </div>
              
              
              {serviciosSeleccionados.length > 0 && (
                <div>
                  <span className="font-medium">Servicios Adicionales:</span>
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
                Datos de Contacto
              </CardTitle>
              <CardDescription>
                Completa tus datos para procesar la solicitud
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="empresa">Empresa *</Label>
                  <Input
                    id="empresa"
                    name="empresa"
                    value={formData.empresa}
                    onChange={handleInputChange}
                    placeholder="Nombre de tu empresa"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="contacto">Nombre *</Label>
                  <Input
                    id="contacto"
                    name="contacto"
                    value={formData.contacto}
                    onChange={handleInputChange}
                    placeholder="Tu nombre completo"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="telefono">Teléfono *</Label>
                  <Input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    placeholder="+591 2 1234567"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="tu@empresa.com"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="comentarios">Comentarios</Label>
                  <Textarea
                    id="comentarios"
                    name="comentarios"
                    value={formData.comentarios}
                    onChange={handleInputChange}
                    placeholder="Información adicional sobre tu solicitud..."
                    rows={3}
                  />
                </div>


                <Button 
                  type="submit" 
                  className="w-full bg-[#D54644] hover:bg-[#D54644]/90"
                  disabled={isSubmitting}
                  onClick={() => console.log('🔘 Botón de envío clickeado')}
                >
                  {isSubmitting ? 'Enviando...' : 'Solicitar Cotización'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
