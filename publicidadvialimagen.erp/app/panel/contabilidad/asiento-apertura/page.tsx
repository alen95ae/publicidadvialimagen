"use client"

import { Toaster } from "sonner"
import AsientoAperturaForm from "./components/AsientoAperturaForm"

export default function AsientoAperturaPage() {
  return (
    <>
      <Toaster position="top-right" />
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Asiento de Apertura Contable</h1>
          <p className="text-gray-600 mt-2">
            Proceso contable para generar el asiento de apertura de ejercicio
          </p>
        </div>

        {/* Formulario */}
        <AsientoAperturaForm />
      </div>
    </>
  )
}


