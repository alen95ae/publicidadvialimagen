"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Trash2, FileText, Megaphone, MapPin, Ruler, Eye, Building, Calendar } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useCampaignsContext } from "@/components/campaigns-provider"

export default function CampaignsPage() {
  const { campaigns, removeFromCampaign, clearCampaigns } = useCampaignsContext()
  const [isSubmitting, setIsSubmitting] = useState(false)

  console.log('Campañas actuales:', campaigns)

  const handleRemoveItem = (billboardId: number) => {
    removeFromCampaign(billboardId)
  }

  const handleSubmitQuote = () => {
    // Redirigir a la página de cotización de campaña
    window.location.href = '/solicitar-cotizacion-campana'
  }

  if (campaigns.length === 0) {
    return (
      <div className="container px-4 py-8 md:px-6 md:py-12">
        {/* Breadcrumb */}
        <div className="mb-6">
          <div className="flex items-center text-sm text-muted-foreground mb-4">
            <Link href="/" className="hover:text-primary">
              Inicio
            </Link>
            <span className="mx-2">/</span>
            <span>Mi Campaña</span>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/vallas-publicitarias">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a espacios
            </Link>
          </Button>
        </div>

        <div className="text-center py-12">
          <Megaphone className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Tu campaña está vacía</h2>
          <p className="text-muted-foreground mb-6">
            Agrega soportes publicitarios a tu campaña para solicitar una cotización
          </p>
          <Button asChild>
            <Link href="/vallas-publicitarias">
              Explorar soportes
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container px-4 py-8 md:px-6 md:py-12">
      {/* Breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center text-sm text-muted-foreground mb-4">
          <Link href="/" className="hover:text-primary">
            Inicio
          </Link>
          <span className="mx-2">/</span>
          <span>Mi Campaña</span>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/vallas-publicitarias">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a espacios
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lista de campañas */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Mi Campaña</h1>
            <Badge variant="secondary" className="text-sm">
              {campaigns.length} soporte{campaigns.length > 1 ? 's' : ''}
            </Badge>
          </div>

          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {/* Imagen */}
                    <div className="w-24 h-24 relative rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={campaign.image || "/placeholder.svg"}
                        alt={campaign.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Información */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-2">{campaign.name}</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{campaign.city}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Ruler className="h-4 w-4" />
                          <span>{campaign.dimensions}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          <span>{campaign.impacts} impactos/día</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          <span>{campaign.type}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {new Date(campaign.startDate).toLocaleDateString('es-ES')} - {campaign.months} mes{campaign.months > 1 ? 'es' : ''}
                        </span>
                      </div>
                    </div>

                    {/* Botón eliminar */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(campaign.billboardId)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Resumen y acciones */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5" />
                Resumen de Campaña
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Soportes seleccionados:</span>
                  <span className="font-medium">{campaigns.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Impactos totales:</span>
                  <span className="font-medium">
                    {campaigns.reduce((total, campaign) => {
                      const dailyImpacts = parseInt(campaign.impacts.replace(/[^\d]/g, '')) || 0
                      const totalDays = campaign.months * 30
                      return total + (dailyImpacts * totalDays)
                    }, 0).toLocaleString()} impactos
                  </span>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Al solicitar cotización, nuestro equipo se pondrá en contacto contigo para proporcionar precios personalizados según tus necesidades.
                </p>
                
                <Button 
                  className="w-full bg-[#D54644] hover:bg-[#B03A38] text-white"
                  onClick={handleSubmitQuote}
                  disabled={isSubmitting}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Enviando..." : "Solicitar cotización"}
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={clearCampaigns}
                >
                  Limpiar campaña
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
