"use client"

import ContabilizacionFacturas from "../../../facturas/components/ContabilizacionFacturas"

export default function ContabilizacionFacturasPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Contabilización de Facturas</h1>
        <p className="text-gray-600 mt-2">
          Contabilizar facturas, notas de remisión y cobranzas
        </p>
      </div>

      {/* Contenido */}
      <ContabilizacionFacturas />
    </div>
  )
}


