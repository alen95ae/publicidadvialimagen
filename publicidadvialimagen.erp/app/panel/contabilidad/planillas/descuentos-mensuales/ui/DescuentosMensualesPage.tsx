"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast, Toaster } from "sonner"
import { ArrowLeft, Database, Save, Trash2 } from "lucide-react"
import PlanillasMensualesHeader from "../../_components/PlanillasMensualesHeader"
import EditableEmpleadoTabla, { type GridColumn } from "../../_components/EditableEmpleadoTabla"
import {
  cabeceraMockInicial,
  empleadosMock,
  descuentosMensualesMockInicial,
  type CabeceraPlanillasMensuales,
  type DescuentosMensualesRow,
} from "@/lib/planillas/mensualesMock"

export default function DescuentosMensualesPage() {
  const router = useRouter()
  const [cabecera, setCabecera] = useState<CabeceraPlanillasMensuales>(cabeceraMockInicial)
  const [rows, setRows] = useState<DescuentosMensualesRow[]>(descuentosMensualesMockInicial)

  const columns: GridColumn<DescuentosMensualesRow>[] = [
    { key: "codigo_empleado", label: "Código Empleado", width: 160, readonly: true },
    { key: "nombre_empleado", label: "Nombre del Empleado", width: 280, readonly: true },
    { key: "rc_iva_13", label: "13% Formulario RC-IVA", width: 220, type: "number" },
    { key: "faltas_dias", label: "Faltas (días)", width: 150, type: "number" },
    { key: "atrasos", label: "Atrasos (hh:mm)", width: 170, type: "time" },
    { key: "anticipos", label: "Anticipos", width: 160, type: "number" },
    { key: "prestamos", label: "Préstamos", width: 160, type: "number" },
    { key: "retencion_judicial", label: "Retención Judicial", width: 190, type: "number" },
  ]

  const handleGuardar = () => {
    toast.success("Mock: Descuentos mensuales guardados")
  }

  const handleCargarEmpleados = () => {
    toast.info("Mock: Empleados cargados")
    setRows(descuentosMensualesMockInicial.length ? descuentosMensualesMockInicial : [])
    if (!descuentosMensualesMockInicial.length) {
      setRows(
        empleadosMock.map((e) => ({
          ...e,
          rc_iva_13: 0,
          faltas_dias: 0,
          atrasos: "00:00",
          anticipos: 0,
          prestamos: 0,
          retencion_judicial: 0,
        }))
      )
    }
  }

  const handleLimpiar = () => {
    if (confirm("¿Está seguro de limpiar los descuentos mensuales?")) {
      setRows([])
      toast.info("Mock: Datos limpiados")
    }
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Descuentos Mensuales</h1>
            <p className="text-gray-600 mt-2">Edición inline por empleado (mock, sin cálculos reales)</p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleGuardar} className="gap-2">
              <Save className="h-4 w-4" />
              Guardar
            </Button>
            <Button variant="outline" size="sm" onClick={handleCargarEmpleados} className="gap-2">
              <Database className="h-4 w-4" />
              Cargar Empleados
            </Button>
            <Button variant="outline" size="sm" onClick={handleLimpiar} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Limpiar
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.back()} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
          </div>
        </div>

        <PlanillasMensualesHeader value={cabecera} onChange={setCabecera} />

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Tabla Principal</CardTitle>
          </CardHeader>
          <CardContent>
            <EditableEmpleadoTabla rows={rows} columns={columns} onChange={setRows} maxHeight={520} />
          </CardContent>
        </Card>
      </div>
    </>
  )
}


