"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import EmpresasTab from "./components/EmpresasTab"
import SucursalesTab from "./components/SucursalesTab"
import DivisasTab from "./components/DivisasTab"

export default function ParametrosContabilidadPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Parámetros de Contabilidad</h1>
        <p className="text-gray-600 mt-2">
          Configuración de parámetros del sistema contable
        </p>
      </div>

      {/* Contenido principal con pestañas */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="empresas" className="w-full">
            <TabsList className="mb-6 w-full grid grid-cols-1 sm:grid-cols-3 gap-2">
              <TabsTrigger value="empresas" className="text-xs lg:text-sm">Empresas</TabsTrigger>
              <TabsTrigger value="sucursales" className="text-xs lg:text-sm">Sucursales</TabsTrigger>
              <TabsTrigger value="divisas" className="text-xs lg:text-sm">Divisas</TabsTrigger>
            </TabsList>

            <TabsContent value="empresas" className="mt-0">
              <EmpresasTab />
            </TabsContent>

            <TabsContent value="sucursales" className="mt-0">
              <SucursalesTab />
            </TabsContent>

            <TabsContent value="divisas" className="mt-0">
              <DivisasTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

