"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function RegionalesTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Regionales</CardTitle>
        <CardDescription>
          Gestión de regionales del sistema contable
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



