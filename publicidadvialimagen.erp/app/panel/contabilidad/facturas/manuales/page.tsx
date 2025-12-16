"use client"

import FacturasManuales from "../../../facturas/components/FacturasManuales"

export default function FacturasManualesPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Facturas Manuales</h1>
        <p className="text-gray-600 mt-2">
          Crear y gestionar facturas manuales
        </p>
      </div>

      {/* Contenido */}
      <FacturasManuales />
    </div>
  )
}


