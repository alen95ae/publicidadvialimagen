"use client"

import { useState, useEffect } from "react"
import { FileText, Loader2, Calendar, Building2, Mail, Phone } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
// import { supabase } from "@/lib/supabase" // DISABLED - Migrated to Airtable
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
  estado: 'pendiente' | 'respondida' | 'cerrada'
  respuesta?: string
  fecha_respuesta?: string
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
      const { data, error } = await supabase
        .from('cotizaciones')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      setQuotes(data || [])
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al cargar cotizaciones",
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return <Badge variant="secondary">Pendiente</Badge>
      case 'respondida':
        return <Badge variant="default" className="bg-green-500">Respondida</Badge>
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
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
              Solicita una cotización desde la página de soportes
            </p>
            <Button asChild>
              <a href="/contact">Solicitar Cotización</a>
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

