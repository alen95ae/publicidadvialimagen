"use client"

import { Card, CardContent } from "@/components/ui/card"
import ProcesoDepreciacionForm from "./components/ProcesoDepreciacionForm"

export default function ProcesoDepreciacionPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Proceso de Depreciación de Activos</h1>
        <p className="text-gray-600 mt-2">
          Procesar y contabilizar la depreciación de activos fijos
        </p>
      </div>

      {/* Contenido principal */}
      <Card>
        <CardContent className="pt-6">
          <ProcesoDepreciacionForm />
        </CardContent>
      </Card>
    </div>
  )
}


