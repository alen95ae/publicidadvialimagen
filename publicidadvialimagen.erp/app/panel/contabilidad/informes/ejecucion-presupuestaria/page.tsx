"use client"

import EjecucionPresupuestariaReporte from "../components/EjecucionPresupuestariaReporte"

export default function EjecucionPresupuestariaPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Ejecución Presupuestaria</h1>
        <p className="text-gray-600 mt-2">
          Generación del reporte de ejecución presupuestaria
        </p>
      </div>

      <EjecucionPresupuestariaReporte />
    </div>
  )
}


