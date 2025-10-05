"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, UserPlus } from "lucide-react";
import { LoginLink, RegisterLink } from "@kinde-oss/kinde-auth-nextjs/components";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Image src="/logo-publicidad-vial-imagen.svg" alt="Publicidad Vial Imagen" width={200} height={60} className="h-16 w-auto" priority />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Acceso ERP</CardTitle>
            <CardDescription className="mt-2">Autenticación segura con Kinde</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <LoginLink postLoginRedirectURL="/panel">
            <Button className="w-full h-11 text-base font-medium" size="lg">
              <LogIn className="mr-2 h-5 w-5" />
              Iniciar sesión
            </Button>
          </LoginLink>

          <RegisterLink postLoginRedirectURL="/panel">
            <Button variant="outline" className="w-full h-11 text-base font-medium" size="lg">
              <UserPlus className="mr-2 h-5 w-5" />
              Registrarse
            </Button>
          </RegisterLink>
        </CardContent>
      </Card>
    </div>
  );
}
