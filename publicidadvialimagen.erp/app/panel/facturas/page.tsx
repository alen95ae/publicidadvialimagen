"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import FacturasManuales from "./components/FacturasManuales"
import ContabilizacionFacturas from "./components/ContabilizacionFacturas"

export default function FacturasPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Facturas</h1>
        <p className="text-gray-600 mt-2">
          Gestión de facturas manuales y contabilización
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="manuales" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="manuales">Facturas Manuales</TabsTrigger>
          <TabsTrigger value="contabilizacion">Contabilización de Facturas</TabsTrigger>
        </TabsList>

        <TabsContent value="manuales" className="mt-6">
          <FacturasManuales />
        </TabsContent>

        <TabsContent value="contabilizacion" className="mt-6">
          <ContabilizacionFacturas />
        </TabsContent>
      </Tabs>
    </div>
  )
}

