"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Heart, MapPin, DollarSign, Loader2, Trash2 } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
// import { supabase } from "@/lib/supabase" // DISABLED - Migrated to Airtable

interface Favorite {
  id: string
  created_at: string
  soporte: {
    id: string
    codigo: string
    nombre: string
    ubicacion: string
    precio_mensual: number
    ciudad: string
    disponible: boolean
  }
}

interface FavoritesTabProps {
  userId: string
}

export default function FavoritesTab({ userId }: FavoritesTabProps) {
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadFavorites()
  }, [userId])

  const loadFavorites = async () => {
    try {
      const { data, error } = await supabase
        .from('favoritos')
        .select(`
          id,
          created_at,
          soporte:soporte_id (
            id,
            codigo,
            nombre,
            ubicacion,
            precio_mensual,
            ciudad,
            disponible
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      setFavorites(data || [])
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al cargar favoritos",
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const removeFavorite = async (favoriteId: string) => {
    setRemoving(favoriteId)
    try {
      const { error } = await supabase
        .from('favoritos')
        .delete()
        .eq('id', favoriteId)

      if (error) throw error

      setFavorites(favorites.filter(f => f.id !== favoriteId))
      
      toast({
        title: "Favorito eliminado",
        description: "El soporte ha sido eliminado de tus favoritos",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      })
    } finally {
      setRemoving(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mis Favoritos</CardTitle>
          <CardDescription>Soportes publicitarios que has guardado</CardDescription>
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
        <CardTitle>Mis Favoritos</CardTitle>
        <CardDescription>
          Soportes publicitarios que has guardado ({favorites.length})
        </CardDescription>
      </CardHeader>
      <CardContent>
        {favorites.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tienes favoritos</h3>
            <p className="text-muted-foreground mb-4">
              Guarda soportes publicitarios para acceder a ellos fácilmente
            </p>
            <Button asChild>
              <Link href="/billboards">Ver Soportes</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {favorites.map((favorite) => (
              <Card key={favorite.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{favorite.soporte.codigo}</h3>
                      <p className="text-sm text-muted-foreground">{favorite.soporte.nombre}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFavorite(favorite.id)}
                      disabled={removing === favorite.id}
                    >
                      {removing === favorite.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{favorite.soporte.ubicacion}, {favorite.soporte.ciudad}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">
                        ${favorite.soporte.precio_mensual?.toLocaleString()} / mes
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        favorite.soporte.disponible
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {favorite.soporte.disponible ? "Disponible" : "No disponible"}
                    </span>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/billboards/${favorite.soporte.id}`}>Ver Detalles</Link>
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

