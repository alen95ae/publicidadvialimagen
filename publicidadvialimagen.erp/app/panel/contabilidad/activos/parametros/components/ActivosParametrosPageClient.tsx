"use client"

import { useMemo, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import GruposActivosFijosTab from "./GruposActivosFijosTab"
import GestionesDepreciacionActivosTab from "./GestionesDepreciacionActivosTab"

const TAB_GRUPOS = "grupos-activos-fijos"
const TAB_GESTIONES = "gestiones-depreciacion-activos"

export default function ActivosParametrosPageClient({
  initialTab,
}: {
  initialTab?: string
}) {
  const initialValue = useMemo(() => {
    if (initialTab === TAB_GESTIONES) return TAB_GESTIONES
    return TAB_GRUPOS
  }, [initialTab])

  const [value, setValue] = useState<string>(initialValue)

  return (
    <Tabs value={value} onValueChange={setValue} className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value={TAB_GRUPOS}>Grupos de Activos Fijos</TabsTrigger>
        <TabsTrigger value={TAB_GESTIONES}>Gestiones para la Depreciación de Activos</TabsTrigger>
      </TabsList>

      <TabsContent value={TAB_GRUPOS} className="mt-0">
        <GruposActivosFijosTab />
      </TabsContent>

      <TabsContent value={TAB_GESTIONES} className="mt-0">
        <GestionesDepreciacionActivosTab />
      </TabsContent>
    </Tabs>
  )
}


