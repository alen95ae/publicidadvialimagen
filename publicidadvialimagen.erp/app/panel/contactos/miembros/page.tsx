"use client";

import { Card, CardContent } from "@/components/ui/card";
import MembersSection from "../components/MembersSection";

export default function MiembrosPage() {
  return (
    <div className="p-6">
      {/* Main Content */}
      <main className="w-full max-w-full px-4 sm:px-6 py-8 overflow-hidden">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Gestión de Miembros</h1>
          <p className="text-gray-600">Administra los miembros del sitio web</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <MembersSection />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

