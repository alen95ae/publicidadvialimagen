"use client"

import ConfiguracionNumeracionGrid from "./components/ConfiguracionNumeracionGrid"
import TiposComprobanteNumeracionGrid from "./components/TiposComprobanteNumeracionGrid"

export default function NumeracionComprobantesPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Numeración de Comprobantes</h1>
        <p className="text-gray-600 mt-2">
          Configuración de numeración de documentos y tipos de comprobante
        </p>
      </div>

      {/* Bloque Superior: Configuración de Numeración */}
      <ConfiguracionNumeracionGrid />

      {/* Bloque Inferior: Tipos de Comprobante */}
      <TiposComprobanteNumeracionGrid />
    </div>
  )
}



