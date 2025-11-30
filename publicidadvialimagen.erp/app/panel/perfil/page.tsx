"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Mail, User, Lock, Upload, Loader2, Eye, EyeOff, Phone } from "lucide-react"
import { toast } from "sonner"

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    passwordActual: "",
    passwordNueva: "",
    passwordNuevaConfirmar: "",
  })

  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [showPasswordActual, setShowPasswordActual] = useState(false)
  const [showPasswordNueva, setShowPasswordNueva] = useState(false)
  const [showPasswordConfirmar, setShowPasswordConfirmar] = useState(false)

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setFormData({
          nombre: data.user.name || "",
          email: data.user.email || "",
          telefono: data.user.numero || "",
          passwordActual: "",
          passwordNueva: "",
          passwordNuevaConfirmar: "",
        })
        
        // Cargar imagen de perfil si existe
        if (data.user.imagen_usuario) {
          const imagenData = typeof data.user.imagen_usuario === 'string' 
            ? JSON.parse(data.user.imagen_usuario) 
            : data.user.imagen_usuario
          if (imagenData?.url) {
            setImagePreview(imagenData.url)
          }
        }
      }
    } catch (error) {
      console.error("Error fetching user:", error)
      toast.error("Error al cargar datos del usuario")
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error("El archivo debe ser una imagen")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no puede superar los 5MB")
      return
    }

    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUploadImage = async () => {
    if (!imageFile) return

    try {
      setUploadingImage(true)
      const formData = new FormData()
      formData.append('file', imageFile)

      const response = await fetch('/api/usuarios/image', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success("Imagen de perfil actualizada correctamente")
        await fetchUser()
        setImageFile(null)
      } else {
        toast.error(data.error || "Error al subir imagen")
  }
    } catch (error) {
      console.error("Error uploading image:", error)
      toast.error("Error al subir imagen")
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Validar contraseñas si se está cambiando
      if (formData.passwordNueva || formData.passwordNuevaConfirmar) {
        if (!formData.passwordActual) {
          toast.error("Debes ingresar tu contraseña actual")
          setSaving(false)
          return
        }
        if (formData.passwordNueva !== formData.passwordNuevaConfirmar) {
          toast.error("Las contraseñas nuevas no coinciden")
          setSaving(false)
          return
        }
        if (formData.passwordNueva.length < 6) {
          toast.error("La contraseña nueva debe tener al menos 6 caracteres")
          setSaving(false)
          return
        }
      }

      const response = await fetch("/api/perfil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          nombre: formData.nombre,
          email: formData.email,
          telefono: formData.telefono,
          passwordActual: formData.passwordActual || undefined,
          passwordNueva: formData.passwordNueva || undefined,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Perfil actualizado correctamente")
        setFormData({
          ...formData,
          passwordActual: "",
          passwordNueva: "",
          passwordNuevaConfirmar: "",
        })
        await fetchUser()
      } else {
        toast.error(data.error || "Error al actualizar perfil")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Error al actualizar perfil")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  const initials = (user?.name?.[0] || "") + (user?.name?.[1] || "")

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-gray-600 mt-2">Información de tu cuenta</p>
      </div>

        <Card>
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
            <CardDescription>Tus datos de usuario</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
          {/* Avatar e imagen de perfil */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={imagePreview || ""} alt={user?.name || user?.email || "Usuario"} />
                <AvatarFallback className="text-xl">{initials}</AvatarFallback>
              </Avatar>
              <label
                htmlFor="image-upload"
                className="absolute bottom-0 right-0 bg-[#D54644] text-white rounded-full p-2 cursor-pointer hover:bg-[#B03A38] transition-colors"
                title="Cambiar imagen"
              >
                <Upload className="h-4 w-4" />
              </label>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>
            <div>
              <p className="text-lg font-semibold">{user?.name}</p>
              <p className="text-sm text-gray-600">{user?.email}</p>
              {imageFile && (
                <Button
                  size="sm"
                  onClick={handleUploadImage}
                  disabled={uploadingImage}
                  className="mt-2 bg-[#D54644] hover:bg-[#B03A38]"
                >
                  {uploadingImage ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    "Guardar imagen"
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Formulario de edición */}
          <form onSubmit={handleSubmit} className="space-y-4">
              <div>
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Tu nombre completo"
              />
              </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="Ej: +591 70000000"
              />
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-sm font-semibold mb-4">Cambiar Contraseña</h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="passwordActual">Contraseña Actual</Label>
                  <div className="relative">
                    <Input
                      id="passwordActual"
                      type={showPasswordActual ? "text" : "password"}
                      value={formData.passwordActual}
                      onChange={(e) => setFormData({ ...formData, passwordActual: e.target.value })}
                      placeholder="Ingresa tu contraseña actual"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPasswordActual(!showPasswordActual)}
                    >
                      {showPasswordActual ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
              </div>

                <div>
                  <Label htmlFor="passwordNueva">Nueva Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="passwordNueva"
                      type={showPasswordNueva ? "text" : "password"}
                      value={formData.passwordNueva}
                      onChange={(e) => setFormData({ ...formData, passwordNueva: e.target.value })}
                      placeholder="Ingresa tu nueva contraseña"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPasswordNueva(!showPasswordNueva)}
                    >
                      {showPasswordNueva ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
              </div>

                <div>
                  <Label htmlFor="passwordNuevaConfirmar">Confirmar Nueva Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="passwordNuevaConfirmar"
                      type={showPasswordConfirmar ? "text" : "password"}
                      value={formData.passwordNuevaConfirmar}
                      onChange={(e) => setFormData({ ...formData, passwordNuevaConfirmar: e.target.value })}
                      placeholder="Confirma tu nueva contraseña"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPasswordConfirmar(!showPasswordConfirmar)}
                    >
                      {showPasswordConfirmar ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={saving}
                className="bg-[#D54644] hover:bg-[#B03A38]"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Cambios"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/api/auth/logout")}
              >
            Cerrar Sesión
          </Button>
      </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
