"use client"

import { Toaster } from "sonner"
import ComprobantesList from "./components/ComprobantesList"
import ComprobanteForm from "./components/ComprobanteForm"
import { useState } from "react"
import type { Comprobante } from "@/lib/types/contabilidad"

export default function ComprobantesPage() {
  const [selectedComprobante, setSelectedComprobante] = useState<Comprobante | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleComprobanteSelect = (comprobante: Comprobante | null) => {
    setSelectedComprobante(comprobante)
  }

  const handleNew = () => {
    setSelectedComprobante(null)
  }

  const handleSave = () => {
    setRefreshKey(prev => prev + 1)
    // Si se guardó correctamente, el formulario manejará la actualización
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Comprobantes</h1>
          <p className="text-gray-600 mt-2">
            Gestión de asientos contables y comprobantes
          </p>
        </div>

        {/* Contenido principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de comprobantes (2/3) */}
          <div className="lg:col-span-2">
            <ComprobantesList
              key={refreshKey}
              onSelect={handleComprobanteSelect}
              selectedId={selectedComprobante?.id}
            />
          </div>

          {/* Formulario de comprobante (1/3) */}
          <div className="lg:col-span-1">
            <ComprobanteForm
              comprobante={selectedComprobante}
              onNew={handleNew}
              onSave={handleSave}
            />
          </div>
        </div>
      </div>
    </>
  )
}



