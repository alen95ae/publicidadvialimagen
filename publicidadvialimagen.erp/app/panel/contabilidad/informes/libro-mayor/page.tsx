"use client"

import LibroMayorForm from "../components/LibroMayorForm"

export default function LibroMayorPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Libro Mayor</h1>
        <p className="text-gray-600 mt-2">
          Generación de reportes del libro mayor contable
        </p>
      </div>

      <LibroMayorForm />
    </div>
  )
}
