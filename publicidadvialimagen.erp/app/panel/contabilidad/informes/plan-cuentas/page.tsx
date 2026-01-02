"use client"

import PlanCuentasInforme from "../components/PlanCuentasInforme"

export default function PlanCuentasInformePage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Plan de Cuentas</h1>
        <p className="text-gray-600 mt-2">
          Visualización jerárquica del plan de cuentas contable
        </p>
      </div>

      <PlanCuentasInforme />
    </div>
  )
}






