"use client"

import { Toaster } from "sonner"
import PresupuestosTable from "./components/PresupuestosTable"

export default function PresupuestosPage() {
  return (
    <>
      <Toaster position="top-right" />
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Presupuestos</h1>
          <p className="text-gray-600 mt-2">
            Gestión de presupuestos por cuenta y gestión
          </p>
        </div>

        {/* Contenido principal */}
        <PresupuestosTable />
      </div>
    </>
  )
}



