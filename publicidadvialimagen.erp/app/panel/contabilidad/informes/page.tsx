"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import PlanCuentasInforme from "./components/PlanCuentasInforme"
import LibroDiarioInforme from "./components/LibroDiarioInforme"

export default function InformesContabilidadPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Informes de Contabilidad</h1>
        <p className="text-gray-600 mt-2">
          Generación de reportes y estados financieros
        </p>
      </div>

      {/* Tabs de Informes */}
      <Tabs defaultValue="plan-cuentas" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="plan-cuentas">Plan de Cuentas</TabsTrigger>
          <TabsTrigger value="libro-diario">Libro Diario</TabsTrigger>
        </TabsList>

        <TabsContent value="plan-cuentas" className="mt-6">
          <PlanCuentasInforme />
        </TabsContent>

        <TabsContent value="libro-diario" className="mt-6">
          <LibroDiarioInforme />
        </TabsContent>
      </Tabs>
    </div>
  )
}
