"use client"

import LibroComprasIVAReporte from "../components/LibroComprasIVAReporte"

export default function LibroComprasIVAPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Libro de Compras I.V.A.</h1>
        <p className="text-gray-600 mt-2">
          Generación del libro de compras con I.V.A.
        </p>
      </div>

      <LibroComprasIVAReporte />
    </div>
  )
}


