"use client"

import { FileText, Loader2, Calendar, Building2, Mail, Phone } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useCotizaciones } from "@/hooks/use-cotizaciones"
import { useTranslations } from "@/hooks/use-translations"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface QuotesTabProps {
  userId: string
}

export default function QuotesTab({ userId }: QuotesTabProps) {
  const { toast } = useToast()
  const { quotes, loading } = useCotizaciones(userId)
  const { t } = useTranslations()

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
          <CardTitle>{t('account.quotes.title')}</CardTitle>
          <CardDescription>{t('account.quotes.description')}</CardDescription>
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
        <CardTitle>{t('account.quotes.title')}</CardTitle>
        <CardDescription>
          {t('account.quotes.description')} ({quotes.length})
        </CardDescription>
      </CardHeader>
      <CardContent>
        {quotes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('account.quotes.noQuotes')}</h3>
            <p className="text-muted-foreground mb-4">
              {t('account.quotes.noQuotesDesc')}
            </p>
            <Button asChild>
              <a href="/vallas-publicitarias">{t('account.quotes.viewSupports')}</a>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {quotes.map((quote) => (
              <Card key={quote.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">{t('account.quotes.quoteNumber')} #{quote.id}</h3>
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
                      <span className="font-medium">{t('account.quotes.company')}</span>
                      <span>{quote.empresa}</span>
                    </div>
                    {quote.fecha_inicio && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{t('account.quotes.startDate')}</span>
                        <span>{new Date(quote.fecha_inicio).toLocaleDateString('es-ES')}</span>
                      </div>
                    )}
                    {quote.meses_alquiler && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{t('account.quotes.rentalMonths')}</span>
                        <span>{quote.meses_alquiler} {t('account.quotes.months')}</span>
                      </div>
                    )}
                    {quote.servicios_adicionales && quote.servicios_adicionales.length > 0 && (
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <span className="font-medium">{t('account.quotes.additionalServices')}</span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {quote.servicios_adicionales.map((servicio, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {servicio}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {quote.mensaje && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-muted-foreground mb-1">{t('account.quotes.comments')}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {quote.mensaje}
                      </p>
                    </div>
                  )}

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full">
                        {t('account.quotes.viewDetails')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{t('account.quotes.quoteNumber')} #{quote.id.slice(0, 8)}</DialogTitle>
                        <DialogDescription>
                          {t('account.quotes.requestedOn')} {format(new Date(quote.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">{t('account.quotes.company')}</h4>
                          <p>{quote.empresa}</p>
                        </div>
                        {/* Campo soporte oculto para el cliente */}
                        {quote.fecha_inicio && (
                          <div>
                            <h4 className="font-semibold mb-2">{t('account.quotes.startDate')}</h4>
                            <p className="text-sm">{new Date(quote.fecha_inicio).toLocaleDateString('es-ES', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}</p>
                          </div>
                        )}
                        {quote.meses_alquiler && (
                          <div>
                            <h4 className="font-semibold mb-2">{t('account.quotes.rentalDuration')}</h4>
                            <p className="text-sm">{quote.meses_alquiler} {t('account.quotes.months')}</p>
                          </div>
                        )}
                        {quote.servicios_adicionales && quote.servicios_adicionales.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">{t('account.quotes.additionalServices')}</h4>
                            <div className="flex flex-wrap gap-2">
                              {quote.servicios_adicionales.map((servicio, idx) => (
                                <Badge key={idx} variant="secondary">
                                  {servicio}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {quote.mensaje && (
                          <div>
                            <h4 className="font-semibold mb-2">{t('account.quotes.comments')}</h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{quote.mensaje}</p>
                          </div>
                        )}
                        {quote.respuesta && (
                          <div className="border-t pt-4">
                            <h4 className="font-semibold mb-2 text-green-600">{t('account.quotes.teamResponse')}</h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{quote.respuesta}</p>
                            {quote.fecha_respuesta && (
                              <p className="text-xs text-muted-foreground mt-2">
                                {t('account.quotes.respondedOn')} {format(new Date(quote.fecha_respuesta), "d 'de' MMMM, yyyy", { locale: es })}
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