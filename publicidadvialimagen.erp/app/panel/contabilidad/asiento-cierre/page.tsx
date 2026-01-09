"use client"

import { Toaster } from "sonner"
import AsientoCierreForm from "./components/AsientoCierreForm"

export default function AsientoCierrePage() {
  return (
    <>
      <Toaster position="top-right" />
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Asiento de Cierre Contable</h1>
          <p className="text-gray-600 mt-2">
            Proceso contable para generar el asiento de cierre de ejercicio
          </p>
        </div>

        {/* Formulario */}
        <AsientoCierreForm />
      </div>
    </>
  )
}








