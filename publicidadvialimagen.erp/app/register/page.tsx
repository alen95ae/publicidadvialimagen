"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn } from "lucide-react";
import RegisterForm from "@/components/auth/RegisterForm";
import { useSearchParams } from "next/navigation";

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const invite = searchParams.get('invite');
  const email = searchParams.get('email');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Image src="/logo-publicidad-vial-imagen.svg" alt="Publicidad Vial Imagen" width={200} height={60} className="h-16 w-auto" priority />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Registro ERP</CardTitle>
            <CardDescription className="mt-2">Crear cuenta de acceso</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <RegisterForm invite={invite} presetEmail={email} />
          
          <div className="text-center">
            <p className="text-sm text-gray-600">¿Ya tienes cuenta?</p>
            <Button variant="outline" className="w-full h-11 text-base font-medium mt-2" size="lg" asChild>
              <a href="/login">
                <LogIn className="mr-2 h-5 w-5" />
                Iniciar sesión
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
