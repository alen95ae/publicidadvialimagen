"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ClasifCuentasTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Clasificación de Cuentas</CardTitle>
        <CardDescription>
          Configuración de clasificación de cuentas contables
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



