import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Mail, User, Calendar } from "lucide-react"
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components"
import { Button } from "@/components/ui/button"

export default async function ProfilePage() {
  const { getUser, isAuthenticated } = getKindeServerSession()
  
  if (!(await isAuthenticated())) {
    redirect("/api/auth/login")
  }

  const user = await getUser()

  if (!user) {
    redirect("/api/auth/login")
  }

  const initials = (user.given_name?.[0] || "") + (user.family_name?.[0] || "")

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-gray-600 mt-2">Información de tu cuenta</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
            <CardDescription>Tus datos de usuario</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.picture || undefined} alt={user.given_name || user.email || "Usuario"} />
                <AvatarFallback className="text-xl">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-lg font-semibold">
                  {user.given_name} {user.family_name}
                </p>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Nombre:</span>
                <span>{user.given_name} {user.family_name}</span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Email:</span>
                <span>{user.email}</span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="font-medium">ID:</span>
                <span className="font-mono text-xs">{user.id}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Datos Completos</CardTitle>
            <CardDescription>Información técnica del usuario</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-xs">
              {JSON.stringify(user, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <LogoutLink>
          <Button variant="destructive" className="w-full md:w-auto">
            Cerrar Sesión
          </Button>
        </LogoutLink>
      </div>
    </div>
  )
}
