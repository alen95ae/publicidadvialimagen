"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, UserPlus } from "lucide-react";
import LoginForm from "@/components/auth/LoginForm";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const next = searchParams.get('next');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Image src="/logo-publicidad-vial-imagen.svg" alt="Publicidad Vial Imagen" width={200} height={60} className="h-16 w-auto" priority />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Acceso ERP</CardTitle>
            <CardDescription className="mt-2">Sistema de gestión empresarial</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <LoginForm next={next} />
          
          <div className="text-center">
            <p className="text-sm text-gray-600">¿No tienes cuenta?</p>
            <Button variant="outline" className="w-full h-11 text-base font-medium mt-2" size="lg" asChild>
              <a href="/register">
                <UserPlus className="mr-2 h-5 w-5" />
                Registrarse
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}