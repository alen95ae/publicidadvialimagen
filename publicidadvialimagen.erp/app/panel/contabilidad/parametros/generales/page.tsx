"use client"

import EntidadesGrid from "./components/EntidadesGrid"
import ParametrosGrid from "./components/ParametrosGrid"

export default function ParametrosGeneralesPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Parámetros Generales</h1>
        <p className="text-gray-600 mt-2">
          Configuración de entidades y parámetros generales del sistema
        </p>
      </div>

      {/* Bloque 1: Entidades */}
      <EntidadesGrid />

      {/* Bloque 2: Parámetros */}
      <ParametrosGrid />
    </div>
  )
}



