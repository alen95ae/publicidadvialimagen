"use client"

import LibroAuxiliaresForm from "../components/LibroAuxiliaresForm"

export default function LibroAuxiliaresPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Libro de Auxiliares</h1>
        <p className="text-gray-600 mt-2">
          Generación de reportes de auxiliares contables
        </p>
      </div>

      <LibroAuxiliaresForm />
    </div>
  )
}
