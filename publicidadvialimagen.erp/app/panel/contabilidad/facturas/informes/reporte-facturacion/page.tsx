"use client"

import FacturacionReporte from "../components/FacturacionReporte"

export default function ReporteFacturacionPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reporte de Facturación</h1>
        <p className="text-gray-600 mt-2">
          Generar reportes de facturación por período y tipo de documento
        </p>
      </div>

      <FacturacionReporte />
    </div>
  )
}






