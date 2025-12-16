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
  ingresosMensualesMockInicial,
  type CabeceraPlanillasMensuales,
  type IngresosMensualesRow,
} from "@/lib/planillas/mensualesMock"

export default function IngresosMensualesPage() {
  const router = useRouter()
  const [cabecera, setCabecera] = useState<CabeceraPlanillasMensuales>(cabeceraMockInicial)
  const [rows, setRows] = useState<IngresosMensualesRow[]>(ingresosMensualesMockInicial)

  const columns: GridColumn<IngresosMensualesRow>[] = [
    { key: "codigo_empleado", label: "Código Empleado", width: 160, readonly: true },
    { key: "nombre_empleado", label: "Nombre del Empleado", width: 280, readonly: true },
    { key: "dias_trabajados", label: "Días Trabajados", width: 160, type: "number" },
    { key: "horas_extras", label: "Horas Extras (hh:mm)", width: 180, type: "time" },
    { key: "horas_dominical", label: "Horas Dominical (hh:mm)", width: 210, type: "time" },
    { key: "bono_produccion", label: "Bono de Producción", width: 190, type: "number" },
    { key: "otros_ingresos", label: "Otros Ingresos", width: 170, type: "number" },
    { key: "subsidio_prenatal", label: "Subsidio Prenatal", width: 180, type: "number" },
    { key: "subsidio_natalidad", label: "Subsidio Natalidad", width: 190, type: "number" },
    { key: "subsidio_lactancia", label: "Subsidio Lactancia", width: 190, type: "number" },
  ]

  const handleGuardar = () => {
    toast.success("Mock: Ingresos mensuales guardados")
  }

  const handleCargarEmpleados = () => {
    toast.info("Mock: Empleados cargados")
    setRows(ingresosMensualesMockInicial.length ? ingresosMensualesMockInicial : [])
    // En caso de querer recargar desde catálogo:
    if (!ingresosMensualesMockInicial.length) {
      setRows(
        empleadosMock.map((e) => ({
          ...e,
          dias_trabajados: 30,
          horas_extras: "00:00",
          horas_dominical: "00:00",
          bono_produccion: 0,
          otros_ingresos: 0,
          subsidio_prenatal: 0,
          subsidio_natalidad: 0,
          subsidio_lactancia: 0,
        }))
      )
    }
  }

  const handleLimpiar = () => {
    if (confirm("¿Está seguro de limpiar los ingresos mensuales?")) {
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
            <h1 className="text-3xl font-bold text-gray-900">Ingresos Mensuales</h1>
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


