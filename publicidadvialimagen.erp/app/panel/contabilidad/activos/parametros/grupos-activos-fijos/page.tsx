import { Card, CardContent } from "@/components/ui/card"
import GruposActivosFijosTab from "../components/GruposActivosFijosTab"

export default function GruposActivosFijosPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Grupos de Activos Fijos</h1>
        <p className="text-gray-600 mt-2">
          Configuración de grupos para activos fijos (mock)
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <GruposActivosFijosTab />
        </CardContent>
      </Card>
    </div>
  )
}


