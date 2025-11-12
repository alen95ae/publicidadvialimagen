"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import UsersSection from "../components/UsersSection";

export default function UsuariosPage() {
  return (
    <div className="p-6">
      {/* Main Content */}
      <main className="w-full max-w-full px-4 sm:px-6 py-8 overflow-hidden">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Gestión de Usuarios</h1>
          <p className="text-gray-600">Administra los usuarios del sistema, sus roles y estados</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Usuarios del Sistema</span>
            </CardTitle>
            <CardDescription>
              Gestiona usuarios, roles, permisos y configuraciones del ERP
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UsersSection />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

