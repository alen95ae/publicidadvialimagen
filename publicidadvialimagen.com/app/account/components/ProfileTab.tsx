"use client"

import { useState } from "react"
// import { User } from "@supabase/supabase-js" // Replaced with Kinde
import { Loader2, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"

interface ProfileTabProps {
  user: any // Kinde user object
}

export default function ProfileTab({ user }: ProfileTabProps) {
  const { toast } = useToast()
  const { updateProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  
  const [firstName, setFirstName] = useState(user?.given_name || "")
  const [lastName, setLastName] = useState(user?.family_name || "")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await updateProfile({
        firstName,
        lastName,
      })

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
        })
        return
      }

      toast({
        title: "¡Perfil actualizado!",
        description: "Tus datos han sido actualizados correctamente",
      })
    } finally {
      setLoading(false)
    }
  }

  const getInitials = () => {
    const first = firstName || user?.given_name?.[0] || user?.email?.[0] || ""
    const last = lastName?.[0] || user?.family_name?.[0] || ""
    return `${first}${last}`.toUpperCase()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información Personal</CardTitle>
        <CardDescription>
          Actualiza tu información personal y cómo te mostramos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src={user?.picture} alt={firstName} />
            <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Button variant="outline" size="sm" disabled>
              <Upload className="mr-2 h-4 w-4" />
              Subir foto
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Próximamente: Podrás subir tu foto de perfil
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first-name">Nombre</Label>
              <Input
                id="first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Tu nombre"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last-name">Apellido</Label>
              <Input
                id="last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Tu apellido"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={user.email || ""}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Tu email no se puede cambiar por seguridad
            </p>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios
            </Button>
          </div>
        </form>

      </CardContent>
    </Card>
  )
}

