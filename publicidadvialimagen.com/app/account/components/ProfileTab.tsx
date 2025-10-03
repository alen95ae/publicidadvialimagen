"use client"

import { useState } from "react"
import { User } from "@supabase/supabase-js"
import { Loader2, Upload, Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"

interface ProfileTabProps {
  user: User
}

export default function ProfileTab({ user }: ProfileTabProps) {
  const { toast } = useToast()
  const { updateProfile, updatePassword } = useAuth()
  const [loading, setLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  
  const [firstName, setFirstName] = useState(user.user_metadata?.first_name || "")
  const [lastName, setLastName] = useState(user.user_metadata?.last_name || "")
  
  // Estados para cambio de contraseña
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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
    const first = firstName || user.email?.[0] || ""
    const last = lastName?.[0] || ""
    return `${first}${last}`.toUpperCase()
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Las contraseñas no coinciden",
      })
      return
    }

    if (newPassword.length < 8) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "La contraseña debe tener al menos 8 caracteres",
      })
      return
    }

    setPasswordLoading(true)

    try {
      const { error } = await updatePassword(newPassword)

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
        })
        return
      }

      toast({
        title: "¡Contraseña actualizada!",
        description: "Tu contraseña ha sido actualizada correctamente",
      })
      
      setNewPassword("")
      setConfirmPassword("")
    } finally {
      setPasswordLoading(false)
    }
  }

  const isOAuthUser = user?.app_metadata?.provider !== 'email'

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
            <AvatarImage src={user.user_metadata?.avatar_url} alt={firstName} />
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

        <Separator className="my-8" />

        {/* Sección de Cambiar Contraseña */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Cambiar Contraseña</h3>
          <p className="text-sm text-muted-foreground mb-6">
            {isOAuthUser 
              ? "Has iniciado sesión con una cuenta social. La contraseña se gestiona desde tu proveedor."
              : "Actualiza tu contraseña para mantener tu cuenta segura"
            }
          </p>

          {isOAuthUser ? (
            <div className="p-4 border rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">
                {user?.app_metadata?.provider === 'google' && (
                  <>Gestionas tu cuenta con Google. Para cambiar tu contraseña, visita tu configuración de Google.</>
                )}
                {user?.app_metadata?.provider === 'facebook' && (
                  <>Gestionas tu cuenta con Facebook. Para cambiar tu contraseña, visita tu configuración de Facebook.</>
                )}
              </p>
            </div>
          ) : (
            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nueva Contraseña</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={passwordLoading}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    disabled={passwordLoading}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar Nueva Contraseña</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={passwordLoading}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={passwordLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  La contraseña debe tener al menos 8 caracteres.
                </p>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={passwordLoading}>
                  {passwordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Actualizar Contraseña
                </Button>
              </div>
            </form>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

