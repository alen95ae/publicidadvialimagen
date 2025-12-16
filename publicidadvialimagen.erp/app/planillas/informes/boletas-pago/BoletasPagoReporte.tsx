"use client"

import { useState } from "react"
import { Toaster, toast } from "sonner"
import PlanillasInformesFiltros, { type InformesPlanillasFiltrosValue } from "@/components/planillas/informes/PlanillasInformesFiltros"
import PlanillasInformesAcciones from "@/components/planillas/informes/PlanillasInformesAcciones"

export default function BoletasPagoReporte() {
  const [filtros, setFiltros] = useState<InformesPlanillasFiltrosValue>({
    empresa: "001",
    regional: "01",
    sucursal: "001",
    periodo: 202503,
  })
  const [empleado, setEmpleado] = useState<string>("% TODOS")

  return (
    <>
      <Toaster position="top-right" />
      <div className="p-6 space-y-6">
        <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3">
          <h1 className="text-lg font-bold text-blue-900 tracking-wide">BOLETAS DE PAGO</h1>
          <p className="text-xs text-blue-800 mt-1">Pensado para boletas individuales o masivas (mock).</p>
        </div>

        <PlanillasInformesFiltros
          value={filtros}
          onChange={setFiltros}
          showEmpleado
          empleadoValue={empleado}
          onEmpleadoChange={setEmpleado}
        />

        <PlanillasInformesAcciones onGenerar={() => toast.info("Mock: Generar boletas de pago")} />
      </div>
    </>
  )
}


