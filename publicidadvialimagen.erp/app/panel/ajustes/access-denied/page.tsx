"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, ArrowLeft, User, Settings } from "lucide-react";
import Link from "next/link";

interface UserInfo {
  id: string;
  email: string;
  role: string;
  name: string;
}

export default function AccessDeniedPage() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch("/api/debug/user-role");
        const data = await response.json();
        
        if (response.ok) {
          setUserInfo(data.user);
        }
      } catch (error) {
        console.error("Error fetching user info:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-100 rounded-full">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Acceso Denegado
          </CardTitle>
          <CardDescription className="text-gray-600">
            No tienes permisos para acceder al módulo de Ajustes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Settings className="h-4 w-4" />
            <AlertDescription>
              El módulo de Ajustes está restringido únicamente a usuarios con rol de <strong>Administrador</strong>.
            </AlertDescription>
          </Alert>

          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Verificando tu información...</p>
            </div>
          ) : userInfo ? (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <User className="h-4 w-4 mr-2" />
                Tu información de usuario:
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Nombre:</span> {userInfo.name}
                </div>
                <div>
                  <span className="font-medium text-gray-700">Email:</span> {userInfo.email}
                </div>
                <div>
                  <span className="font-medium text-gray-700">Rol actual:</span> 
                  <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                    userInfo.role === "admin" 
                      ? "bg-green-100 text-green-800" 
                      : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {userInfo.role}
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">¿Cómo obtener acceso?</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Contacta al administrador del sistema</li>
              <li>• Solicita que tu rol sea cambiado a "Administrador"</li>
              <li>• Una vez actualizado tu rol, podrás acceder al módulo</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild className="flex-1">
              <Link href="/panel">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Panel Principal
              </Link>
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <Link href="/panel/perfil">
                <User className="h-4 w-4 mr-2" />
                Ver Mi Perfil
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
