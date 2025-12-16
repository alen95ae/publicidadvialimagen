"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import EmpresasTab from "./components/EmpresasTab"
import RegionalesTab from "./components/RegionalesTab"
import ClasifCuentasTab from "./components/ClasifCuentasTab"
import GestionesTab from "./components/GestionesTab"
import ContabilizacionesTab from "./components/ContabilizacionesTab"
import CotizacionesTab from "./components/CotizacionesTab"

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
            <TabsList className="mb-6 w-full grid grid-cols-3 lg:grid-cols-6 gap-2">
              <TabsTrigger value="empresas" className="text-xs lg:text-sm">Empresas</TabsTrigger>
              <TabsTrigger value="regionales" className="text-xs lg:text-sm">Regionales</TabsTrigger>
              <TabsTrigger value="clasificacion" className="text-xs lg:text-sm">Clasificación de Cuentas</TabsTrigger>
              <TabsTrigger value="gestiones" className="text-xs lg:text-sm">Gestiones</TabsTrigger>
              <TabsTrigger value="contabilizaciones" className="text-xs lg:text-sm">Contabilizaciones</TabsTrigger>
              <TabsTrigger value="cotizaciones" className="text-xs lg:text-sm">Cotizaciones</TabsTrigger>
            </TabsList>

            <TabsContent value="empresas" className="mt-0">
              <EmpresasTab />
            </TabsContent>

            <TabsContent value="regionales" className="mt-0">
              <RegionalesTab />
            </TabsContent>

            <TabsContent value="clasificacion" className="mt-0">
              <ClasifCuentasTab />
            </TabsContent>

            <TabsContent value="gestiones" className="mt-0">
              <GestionesTab />
            </TabsContent>

            <TabsContent value="contabilizaciones" className="mt-0">
              <ContabilizacionesTab />
            </TabsContent>

            <TabsContent value="cotizaciones" className="mt-0">
              <CotizacionesTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

