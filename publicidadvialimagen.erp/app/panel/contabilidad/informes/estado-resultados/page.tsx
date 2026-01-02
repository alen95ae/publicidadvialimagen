"use client"

import EstadoResultadosReporte from "../components/EstadoResultadosReporte"

export default function EstadoResultadosPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Estado de Resultados</h1>
        <p className="text-gray-600 mt-2">
          Generación del estado de resultados contable
        </p>
      </div>

      <EstadoResultadosReporte />
    </div>
  )
}






