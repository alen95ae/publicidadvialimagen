"use client"

import BalanceSumasSaldosReporte from "../components/BalanceSumasSaldosReporte"

export default function BalanceSumasSaldosPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Balance de Sumas y Saldos</h1>
        <p className="text-gray-600 mt-2">
          Generación del balance de sumas y saldos contable
        </p>
      </div>

      <BalanceSumasSaldosReporte />
    </div>
  )
}






