"use client"

import { Toaster } from "sonner"
import { Button } from "@/components/ui/button"
import { Plus, Download } from "lucide-react"
import ComprobantesList from "./components/ComprobantesList"
import ComprobanteForm from "./components/ComprobanteForm"
import { useState } from "react"
import type { Comprobante } from "@/lib/types/contabilidad"

export default function ComprobantesPage() {
  const [selectedComprobante, setSelectedComprobante] = useState<Comprobante | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [exportingPDF, setExportingPDF] = useState(false)
  const [plantillaParaAplicar, setPlantillaParaAplicar] = useState<string | undefined>(undefined)

  const handleComprobanteSelect = (comprobante: Comprobante | null) => {
    setSelectedComprobante(comprobante)
    // Limpiar plantillaParaAplicar al seleccionar otro comprobante
    setPlantillaParaAplicar(undefined)
  }

  const handleNew = () => {
    setSelectedComprobante(null)
  }

  const handleSave = () => {
    setRefreshKey(prev => prev + 1)
    // Si se guardó correctamente, el formulario manejará la actualización
  }

  const handleExportPDF = async () => {
    if (!selectedComprobante?.id || selectedComprobante.estado !== "APROBADO") {
      return
    }

    try {
      setExportingPDF(true)
      const response = await fetch(`/api/contabilidad/comprobantes/${selectedComprobante.id}/pdf`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Error al generar el PDF" }))
        throw new Error(errorData.error || "Error al generar el PDF")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `comprobante_${selectedComprobante.tipo_comprobante}_${selectedComprobante.numero}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error: any) {
      console.error("Error exporting PDF:", error)
      // toast.error(error.message || "Error al exportar el PDF")
    } finally {
      setExportingPDF(false)
    }
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Comprobantes</h1>
            <p className="text-gray-600 mt-2">
              Gestión de asientos contables y comprobantes
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExportPDF}
              disabled={!selectedComprobante || selectedComprobante.estado !== "APROBADO" || exportingPDF}
            >
              <Download className="w-4 h-4 mr-2" />
              {exportingPDF ? "Exportando..." : "Exportar PDF"}
            </Button>
            <Button
              variant="outline"
              onClick={handleNew}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo
            </Button>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="space-y-6">
          {/* Formulario de comprobante + detalle (ancho completo) */}
          <div className="w-full">
            <ComprobanteForm
              comprobante={selectedComprobante}
              onNew={handleNew}
              onSave={handleSave}
              plantillaParaAplicar={plantillaParaAplicar}
            />
          </div>

          {/* Lista de comprobantes (ancho completo) */}
          <div className="w-full">
            <ComprobantesList
              key={refreshKey}
              onSelect={handleComprobanteSelect}
              selectedId={selectedComprobante?.id}
            />
          </div>
        </div>
      </div>
    </>
  )
}



