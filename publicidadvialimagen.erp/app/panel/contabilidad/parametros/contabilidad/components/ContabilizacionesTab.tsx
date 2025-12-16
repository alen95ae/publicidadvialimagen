"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ContabilizacionesTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contabilizaciones</CardTitle>
        <CardDescription>
          Configuración de contabilizaciones automáticas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500 text-lg">Sección en construcción</p>
        </div>
      </CardContent>
    </Card>
  )
}



