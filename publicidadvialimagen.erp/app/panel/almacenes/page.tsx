"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import AlmacenesTab from "./components/AlmacenesTab"
import GruposItemsTab from "./components/GruposItemsTab"
import ItemsInventarioTab from "./components/ItemsInventarioTab"

export default function AlmacenesPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Almacenes</h1>
        <p className="text-gray-600 mt-2">
          Gestión completa de almacenes, grupos de ítems e inventario
        </p>
      </div>

      {/* Contenido principal con pestañas */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="almacenes" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="almacenes">Almacenes</TabsTrigger>
              <TabsTrigger value="grupos">Grupos de Ítems</TabsTrigger>
              <TabsTrigger value="items">Ítems de Inventario</TabsTrigger>
            </TabsList>

            <TabsContent value="almacenes" className="mt-0">
              <AlmacenesTab />
            </TabsContent>

            <TabsContent value="grupos" className="mt-0">
              <GruposItemsTab />
            </TabsContent>

            <TabsContent value="items" className="mt-0">
              <ItemsInventarioTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}






