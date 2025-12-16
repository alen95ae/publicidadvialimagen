"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Toaster } from "sonner"
import CuentasTab from "./components/CuentasTab"
import AuxiliaresTab from "./components/AuxiliaresTab"

export default function PlanCuentasPage() {
  return (
    <>
      <Toaster position="top-right" />
      <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Plan de Cuentas / Auxiliares</h1>
        </div>
        <p className="text-gray-600 mt-2">
          Gestión completa del plan de cuentas contables y auxiliares
        </p>
      </div>

      {/* Contenido principal con pestañas */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="cuentas" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="cuentas">Cuentas</TabsTrigger>
              <TabsTrigger value="auxiliares">Auxiliares</TabsTrigger>
            </TabsList>

            <TabsContent value="cuentas" className="mt-0">
              <CuentasTab />
            </TabsContent>

            <TabsContent value="auxiliares" className="mt-0">
              <AuxiliaresTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      </div>
    </>
  )
}

