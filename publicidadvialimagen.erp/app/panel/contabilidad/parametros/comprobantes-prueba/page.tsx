"use client"

import NumeracionDocumentosGrid from "./components/NumeracionDocumentosGrid"
import TiposComprobanteGrid from "./components/TiposComprobanteGrid"

export default function ComprobantesPruebaPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Comprobantes de Prueba / Numeración de Documentos</h1>
        <p className="text-gray-600 mt-2">
          Configuración de numeración de documentos y tipos de comprobante
        </p>
      </div>

      {/* Bloque Superior: Numeración de Documentos */}
      <NumeracionDocumentosGrid />

      {/* Bloque Inferior: Tipos de Comprobante */}
      <TiposComprobanteGrid />
    </div>
  )
}



