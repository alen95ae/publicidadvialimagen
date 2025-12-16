import { Card, CardContent } from "@/components/ui/card"
import GestionesDepreciacionActivosTab from "../components/GestionesDepreciacionActivosTab"

export default function GestionesDepreciacionActivosPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gestiones para la Depreciación de Activos</h1>
        <p className="text-gray-600 mt-2">
          Configuración de gestiones para el proceso de depreciación (mock)
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <GestionesDepreciacionActivosTab />
        </CardContent>
      </Card>
    </div>
  )
}


