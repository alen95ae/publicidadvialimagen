"use client"

import { Toaster } from "sonner"
import { Button } from "@/components/ui/button"
import { Plus, Save } from "lucide-react"
import ComprobantesList from "./components/ComprobantesList"
import ComprobanteForm from "./components/ComprobanteForm"
import { useState } from "react"
import type { Comprobante } from "@/lib/types/contabilidad"

export default function ComprobantesPage() {
  const [selectedComprobante, setSelectedComprobante] = useState<Comprobante | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [exportingPDF, setExportingPDF] = useState(false)
  const [formSaving, setFormSaving] = useState(false)
  const [triggerSave, setTriggerSave] = useState(0)

  const handleComprobanteSelect = (comprobante: Comprobante | null) => {
    setSelectedComprobante(comprobante)
  }

  const handleNew = () => {
    setSelectedComprobante(null)
  }

  const handleSave = (comprobanteGuardado?: Comprobante | null) => {
    if (comprobanteGuardado != null) {
      setSelectedComprobante(comprobanteGuardado)
    }
    setRefreshKey(prev => prev + 1)
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
        {/* Header: título a la izquierda, Nuevo y Guardar a la derecha (siempre visibles) */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Comprobantes</h1>
            <p className="text-gray-600 mt-2">
              Gestión de asientos contables y comprobantes
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={handleNew}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo
            </Button>
            <Button
              size="sm"
              onClick={() => setTriggerSave((s) => s + 1)}
              disabled={formSaving || selectedComprobante?.estado === "APROBADO"}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {formSaving ? "Guardando..." : "Guardar"}
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
              onAprobado={(comp) => setSelectedComprobante(comp)}
              onExportPDF={handleExportPDF}
              exportingPDF={exportingPDF}
              triggerSave={triggerSave}
              onSavingChange={setFormSaving}
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



