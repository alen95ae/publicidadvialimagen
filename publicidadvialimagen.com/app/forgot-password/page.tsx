"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { toast } = useToast()
  const { resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await resetPassword(email)

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
        })
        return
      }

      toast({
        title: "¡Email enviado!",
        description: "Revisa tu correo para restablecer tu contraseña",
      })
      
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container px-4 py-8 md:px-6 md:py-12 max-w-md mx-auto">
      <Card>
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo-publicidad-vial.svg"
              alt="Publicidad Vial Imagen"
              width={60}
              height={60}
              className="rounded-full"
            />
          </div>
          <CardTitle className="text-2xl text-center">Recuperar Contraseña</CardTitle>
          <CardDescription className="text-center">
            {sent 
              ? "Te hemos enviado un enlace a tu correo electrónico"
              : "Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña"
            }
          </CardDescription>
        </CardHeader>
        {!sent ? (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <Button 
                className="w-full" 
                size="lg"
                type="submit"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar Enlace
              </Button>
            </CardContent>
          </form>
        ) : (
          <CardContent className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              Si no encuentras el correo, revisa tu carpeta de spam o correo no deseado.
            </p>
            <Button 
              className="w-full" 
              size="lg"
              variant="outline"
              onClick={() => setSent(false)}
            >
              Enviar de nuevo
            </Button>
          </CardContent>
        )}
        <CardFooter className="flex flex-col">
          <p className="text-center text-sm text-muted-foreground">
            ¿Recuerdas tu contraseña?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Volver al inicio de sesión
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
