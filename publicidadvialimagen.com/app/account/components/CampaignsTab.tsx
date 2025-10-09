"use client"

import { useState, useEffect } from "react"
import { Calendar, TrendingUp, Eye, Loader2, Plus } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface Campaign {
  id: string
  nombre: string
  fecha_inicio: string
  fecha_fin: string
  presupuesto: number
  estado: 'activa' | 'pausada' | 'finalizada'
  impresiones: number
  clicks: number
}

interface CampaignsTabProps {
  userId: string
}

export default function CampaignsTab({ userId }: CampaignsTabProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // Aquí cargarías las campañas desde Supabase
    // Por ahora, mostramos datos de ejemplo
    const mockCampaigns: Campaign[] = []
    
    setCampaigns(mockCampaigns)
    setLoading(false)
  }, [userId])

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'activa':
        return <Badge className="bg-green-500">Activa</Badge>
      case 'pausada':
        return <Badge variant="secondary">Pausada</Badge>
      case 'finalizada':
        return <Badge variant="outline">Finalizada</Badge>
      default:
        return <Badge variant="secondary">{estado}</Badge>
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mis Campañas</CardTitle>
          <CardDescription>Gestiona tus campañas publicitarias</CardDescription>
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Mis Campañas</CardTitle>
            <CardDescription>
              Gestiona tus campañas publicitarias ({campaigns.length})
            </CardDescription>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Campaña
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {campaigns.length === 0 ? (
          <div className="text-center py-12">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tienes campañas</h3>
            <p className="text-muted-foreground mb-6">
              Crea tu primera campaña publicitaria para promocionar tu negocio
            </p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Crear Primera Campaña
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{campaign.nombre}</h3>
                        {getStatusBadge(campaign.estado)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(campaign.fecha_inicio).toLocaleDateString()} - {new Date(campaign.fecha_fin).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold">${campaign.presupuesto.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Presupuesto</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold">{campaign.impresiones.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Impresiones</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold">{campaign.clicks.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Clicks</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="mr-2 h-4 w-4" />
                      Ver Detalles
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Editar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

