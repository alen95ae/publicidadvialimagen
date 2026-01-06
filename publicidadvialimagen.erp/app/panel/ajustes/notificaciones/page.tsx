"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from "lucide-react";
import NotificationsSection from "../components/NotificationsSection";

export default function NotificacionesPage() {
  return (
    <div className="p-6">
      {/* Main Content */}
      <main className="w-full max-w-full px-4 sm:px-6 py-8 overflow-hidden">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Configuración de Notificaciones</h1>
          <p className="text-gray-600">
            Configura qué roles reciben cada tipo de notificación del sistema
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Gestión de Notificaciones</span>
            </CardTitle>
            <CardDescription>
              Activa o desactiva tipos de notificación y configura los roles que las reciben
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NotificationsSection />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

