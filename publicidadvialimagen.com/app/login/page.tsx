"use client"

import { useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { LogIn, UserPlus } from "lucide-react"
import { LoginLink, RegisterLink } from "@kinde-oss/kinde-auth-nextjs/components"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"

export default function LoginPage() {
  const router = useRouter()
  const { user } = useAuth()

  // Redirigir si ya está logueado
  useEffect(() => {
    if (user) {
      router.push("/account")
    }
  }, [user, router])

  return (
    <div className="container px-4 py-8 md:px-6 md:py-12 max-w-md mx-auto">
      <Card>
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center bg-white p-2">
              <Image
                src="/logo-publicidad-vial.svg"
                alt="Publicidad Vial Imagen"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Iniciar Sesión</CardTitle>
          <CardDescription className="text-center">
            Accede a tu cuenta con autenticación segura
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LoginLink postLoginRedirectURL="/">
            <Button className="w-full" size="lg">
              <LogIn className="mr-2 h-4 w-4" />
              Iniciar Sesión
            </Button>
          </LoginLink>

          <RegisterLink postLoginRedirectURL="/">
            <Button variant="outline" className="w-full" size="lg">
              <UserPlus className="mr-2 h-4 w-4" />
              Registrarse
            </Button>
          </RegisterLink>
        </CardContent>
        <CardFooter className="flex flex-col">
          <p className="text-center text-sm text-muted-foreground">
            Al iniciar sesión, aceptas nuestros{" "}
            <Link href="/privacy-policy" className="text-primary hover:underline">
              términos de servicio
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
