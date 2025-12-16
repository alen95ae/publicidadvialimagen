"use client"

import { Toaster } from "sonner"
import AITBForm from "./components/AITBForm"

export default function AITBPage() {
  return (
    <>
      <Toaster position="top-right" />
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ajuste de Saldos (A.I.T.B.)</h1>
          <p className="text-gray-600 mt-2">
            Proceso contable para generar el ajuste de saldos AITB
          </p>
        </div>

        {/* Formulario */}
        <AITBForm />
      </div>
    </>
  )
}
