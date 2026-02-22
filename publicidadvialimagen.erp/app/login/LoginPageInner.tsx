"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn } from "lucide-react";
import LoginForm from "@/components/auth/LoginForm";
import { useSearchParams } from "next/navigation";

export default function LoginPageInner() {
  const searchParams = useSearchParams();
  const next = searchParams.get('next');
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Fondo: imagen B/N + cortina 50% */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/la-paz-city2.png')",
          filter: "grayscale(100%)",
        }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-black/50" aria-hidden />
      <Card className="w-full max-w-md shadow-lg relative z-10">
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
          
        </CardContent>
      </Card>
    </div>
  );
}
