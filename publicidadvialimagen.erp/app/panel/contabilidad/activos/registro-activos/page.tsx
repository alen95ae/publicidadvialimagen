"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import ActivoRegistroTab from "./components/ActivoRegistroTab"
import ActivoTransaccionesBSTab from "./components/ActivoTransaccionesBSTab"
import ActivoTransaccionesUSDTab from "./components/ActivoTransaccionesUSDTab"

export default function RegistroActivosPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Registro de Activos Fijos</h1>
        <p className="text-gray-600 mt-2">
          Gestión completa de activos fijos, registro y transacciones
        </p>
      </div>

      {/* Contenido principal con pestañas */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="registro" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="registro">Registro</TabsTrigger>
              <TabsTrigger value="transacciones-bs">Transacciones Bs.</TabsTrigger>
              <TabsTrigger value="transacciones-usd">Transacciones USD</TabsTrigger>
            </TabsList>

            <TabsContent value="registro" className="mt-0">
              <ActivoRegistroTab />
            </TabsContent>

            <TabsContent value="transacciones-bs" className="mt-0">
              <ActivoTransaccionesBSTab />
            </TabsContent>

            <TabsContent value="transacciones-usd" className="mt-0">
              <ActivoTransaccionesUSDTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}






