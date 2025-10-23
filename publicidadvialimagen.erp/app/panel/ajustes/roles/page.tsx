"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import AjustesHeader from "../components/AjustesHeader";
import RolesSection from "../components/RolesSection";

export default function RolesPage() {
  return (
    <div className="p-6">
      <AjustesHeader />

      {/* Main Content */}
      <main className="w-full max-w-full px-4 sm:px-6 py-8 overflow-hidden">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Roles y Permisos</h1>
          <p className="text-gray-600">Configura roles y define permisos para cada módulo del sistema</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Gestión de Roles</span>
            </CardTitle>
            <CardDescription>
              Define roles personalizados y configura permisos granulares por módulo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RolesSection />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
