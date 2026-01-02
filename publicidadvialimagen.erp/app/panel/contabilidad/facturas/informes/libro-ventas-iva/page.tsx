"use client"

import LibroVentasIVAReporte from "../components/LibroVentasIVAReporte"

export default function LibroVentasIVAPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Libro de Ventas - IVA</h1>
        <p className="text-gray-600 mt-2">
          Generar libro de ventas con IVA para reportes fiscales
        </p>
      </div>

      <LibroVentasIVAReporte />
    </div>
  )
}






