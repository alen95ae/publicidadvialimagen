"use client"

import { Toaster } from "sonner"
import AjusteUFVForm from "./components/AjusteUFVForm"

export default function AjusteUFVPage() {
  return (
    <>
      <Toaster position="top-right" />
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ajuste UFV (A.I.T.B.)</h1>
          <p className="text-gray-600 mt-2">
            Proceso contable para ajuste por Unidad de Fomento a la Vivienda
          </p>
        </div>

        {/* Formulario */}
        <AjusteUFVForm />
      </div>
    </>
  )
}
