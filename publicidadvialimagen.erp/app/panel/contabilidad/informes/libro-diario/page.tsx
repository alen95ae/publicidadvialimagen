"use client"

import LibroDiarioInforme from "../components/LibroDiarioInforme"

export default function LibroDiarioInformePage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Libro Diario</h1>
        <p className="text-gray-600 mt-2">
          Registro cronológico de todos los comprobantes contables
        </p>
      </div>

      <LibroDiarioInforme />
    </div>
  )
}


