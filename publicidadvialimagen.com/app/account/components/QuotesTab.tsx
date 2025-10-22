"use client"

import { useState, useEffect } from "react"
import { FileText, Loader2, Calendar, Building2, Mail, Phone } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Quote {
  id: string
  created_at: string
  empresa: string
  email: string
  telefono: string
  mensaje: string
  estado: 'Nueva' | 'En Proceso' | 'Respondida' | 'Cerrada' | 'pendiente' | 'respondida' | 'cerrada'
  respuesta?: string
  fecha_respuesta?: string
  soporte?: string
  fecha_inicio?: string
  meses_alquiler?: number
  servicios_adicionales?: string[]
}

interface QuotesTabProps {
  userId: string
}

export default function QuotesTab({ userId }: QuotesTabProps) {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadQuotes()
  }, [userId])

  const loadQuotes = async () => {
    try {
      console.log('🔄 Cargando cotizaciones para usuario:', userId)
      
      // Cargar cotizaciones desde Airtable
      const response = await fetch('/api/cotizaciones', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log('📡 Respuesta del API:', response.status, response.statusText)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Error del API:', errorData)
        throw new Error(`Error ${response.status}: ${errorData.message || 'Error al cargar cotizaciones'}`)
      }

      const data = await response.json()
      console.log('📊 Datos recibidos:', data)
      
      // Filtrar solo las cotizaciones del usuario actual
      // El userId puede ser el email del usuario o un ID de usuario
      const userQuotes = data.filter((quote: any) => 
        quote.email === userId || 
        quote.user_id === userId ||
        quote.email?.toLowerCase() === userId?.toLowerCase()
      )
      
      console.log('👤 UserId recibido:', userId)
      console.log('📊 Total cotizaciones:', data.length)
      console.log('👤 Cotizaciones del usuario:', userQuotes.length)
      setQuotes(userQuotes)
    } catch (error: any) {
      console.error('❌ Error cargando cotizaciones:', error)
      
      // Mostrar mensaje de error más específico
      const errorMessage = error.message || "No se pudieron cargar las cotizaciones"
      
      toast({
        variant: "destructive",
        title: "Error al cargar cotizaciones",
        description: errorMessage,
      })
      
      // En caso de error, mostrar lista vacía
      setQuotes([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'Nueva':
      case 'pendiente':
        return <Badge variant="secondary">Nueva</Badge>
      case 'En Proceso':
        return <Badge variant="default" className="bg-blue-500">En Proceso</Badge>
      case 'Respondida':
      case 'respondida':
        return <Badge variant="default" className="bg-green-500">Respondida</Badge>
      case 'Cerrada':
      case 'cerrada':
        return <Badge variant="outline">Cerrada</Badge>
      default:
        return <Badge variant="secondary">{estado}</Badge>
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mis Cotizaciones</CardTitle>
          <CardDescription>Solicitudes de cotización que has enviado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-red-600" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mis Cotizaciones</CardTitle>
        <CardDescription>
          Solicitudes de cotización que has enviado ({quotes.length})
        </CardDescription>
      </CardHeader>
      <CardContent>
        {quotes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tienes cotizaciones</h3>
            <p className="text-muted-foreground mb-4">
              Explora nuestros soportes publicitarios disponibles
            </p>
            <Button asChild>
              <a href="/vallas-publicitarias">Ver Soportes</a>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {quotes.map((quote) => (
              <Card key={quote.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">Cotización #{quote.id.slice(0, 8)}</h3>
                        {getStatusBadge(quote.estado)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {format(new Date(quote.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{quote.empresa}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{quote.email}</span>
                    </div>
                    {quote.telefono && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{quote.telefono}</span>
                      </div>
                    )}
                    {quote.soporte && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>Soporte: {quote.soporte}</span>
                      </div>
                    )}
                    {quote.fecha_inicio && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Inicio: {new Date(quote.fecha_inicio).toLocaleDateString('es-ES')}</span>
                      </div>
                    )}
                    {quote.meses_alquiler && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Duración: {quote.meses_alquiler} meses</span>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {quote.mensaje}
                  </p>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full">
                        Ver Detalles
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Cotización #{quote.id.slice(0, 8)}</DialogTitle>
                        <DialogDescription>
                          Solicitada el {format(new Date(quote.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">Estado</h4>
                          {getStatusBadge(quote.estado)}
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Empresa</h4>
                          <p>{quote.empresa}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Datos de contacto</h4>
                          <p className="text-sm">Email: {quote.email}</p>
                          {quote.telefono && <p className="text-sm">Teléfono: {quote.telefono}</p>}
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Mensaje</h4>
                          <p className="text-sm text-muted-foreground">{quote.mensaje}</p>
                        </div>
                        {quote.respuesta && (
                          <div className="border-t pt-4">
                            <h4 className="font-semibold mb-2 text-green-600">Respuesta</h4>
                            <p className="text-sm text-muted-foreground">{quote.respuesta}</p>
                            {quote.fecha_respuesta && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Respondida el {format(new Date(quote.fecha_respuesta), "d 'de' MMMM, yyyy", { locale: es })}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

