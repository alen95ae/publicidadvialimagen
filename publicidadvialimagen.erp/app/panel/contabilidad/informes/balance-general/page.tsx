"use client"

import BalanceGeneralReporte from "../components/BalanceGeneralReporte"

export default function BalanceGeneralPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Balance General</h1>
        <p className="text-gray-600 mt-2">
          Generación del balance general contable
        </p>
      </div>

      <BalanceGeneralReporte />
    </div>
  )
}







