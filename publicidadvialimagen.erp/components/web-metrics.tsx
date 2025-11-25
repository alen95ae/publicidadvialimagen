"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Eye, Users, MousePointerClick, DollarSign } from "lucide-react";

export default function WebMetrics() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Globe className="mr-2 h-5 w-5" />
          Datos de Página Web
        </CardTitle>
        <CardDescription>
          Métricas de rendimiento del sitio web corporativo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-lg">
            <Eye className="w-8 h-8 text-red-600 mb-2" />
            <p className="text-3xl font-bold text-gray-900">24,847</p>
            <p className="text-sm text-gray-600 mt-1">Visitas totales</p>
            <p className="text-xs text-green-600 mt-1">↗ +18.5%</p>
          </div>

          <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
            <Users className="w-8 h-8 text-blue-600 mb-2" />
            <p className="text-3xl font-bold text-gray-900">8,542</p>
            <p className="text-sm text-gray-600 mt-1">Usuarios únicos</p>
            <p className="text-xs text-green-600 mt-1">↗ +12.3%</p>
          </div>

          <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
            <MousePointerClick className="w-8 h-8 text-green-600 mb-2" />
            <p className="text-3xl font-bold text-gray-900">3.8%</p>
            <p className="text-sm text-gray-600 mt-1">Tasa de conversión</p>
            <p className="text-xs text-green-600 mt-1">↗ +0.5%</p>
          </div>

          <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg">
            <DollarSign className="w-8 h-8 text-amber-600 mb-2" />
            <p className="text-3xl font-bold text-gray-900">325</p>
            <p className="text-sm text-gray-600 mt-1">Cotizaciones</p>
            <p className="text-xs text-green-600 mt-1">↗ +22.7%</p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600">Tiempo promedio en sitio</p>
              <p className="text-xl font-bold text-gray-900">4m 32s</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Páginas por sesión</p>
              <p className="text-xl font-bold text-gray-900">5.2</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tasa de rebote</p>
              <p className="text-xl font-bold text-gray-900">42.3%</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

