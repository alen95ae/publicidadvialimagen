"use client"

import EstadoAuxiliaresReporte from "../components/EstadoAuxiliaresReporte"

export default function EstadoAuxiliaresPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Estado de Auxiliares</h1>
        <p className="text-gray-600 mt-2">
          Generación del estado de auxiliares contables
        </p>
      </div>

      <EstadoAuxiliaresReporte />
    </div>
  )
}






