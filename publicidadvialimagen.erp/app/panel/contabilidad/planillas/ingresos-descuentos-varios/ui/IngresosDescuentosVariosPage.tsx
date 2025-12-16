"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { Toaster, toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save, XCircle, Eraser } from "lucide-react"
import PlanillasMensualesHeader from "../../_components/PlanillasMensualesHeader"
import EditableGridERP, { type ERPGridColumn } from "../../_components/EditableGridERP"
import {
  cabeceraVariosMockInicial,
  catalogosVarios,
  ingresosDescuentosVariosMockInicial,
  type IngresosDescuentosVariosRow,
} from "@/lib/planillas/variosMock"
import { type CabeceraPlanillasMensuales } from "@/lib/planillas/mensualesMock"

export default function IngresosDescuentosVariosPage() {
  const router = useRouter()
  const [cabecera, setCabecera] = useState<CabeceraPlanillasMensuales>(cabeceraVariosMockInicial)
  const [rows, setRows] = useState<IngresosDescuentosVariosRow[]>(ingresosDescuentosVariosMockInicial)

  const columns: ERPGridColumn<IngresosDescuentosVariosRow>[] = useMemo(
    () => [
      { key: "codigo_empleado", label: "Código", width: 140, readonly: true },
      { key: "nombre_empleado", label: "Nombre", width: 280, readonly: true },
      { key: "detalle", label: "Detalle", width: 320, type: "text" },
      { key: "monto", label: "Monto", width: 160, type: "number", align: "right" },
      {
        key: "tipo",
        label: "Tipo",
        width: 170,
        type: "select",
        options: catalogosVarios.tiposMovimiento.map((t) => ({ value: t, label: t })),
      },
    ],
    []
  )

  const rowClassName = (row: IngresosDescuentosVariosRow) => {
    // solo visual (sin lógica): verde para ingresos, rojo suave para descuentos
    if (row.tipo === "INGRESOS") return "bg-emerald-50/40"
    if (row.tipo === "DESCUENTOS") return "bg-red-50/40"
    return ""
  }

  const handleGuardar = () => toast.success("Mock: guardado correctamente")
  const handleCancelar = () => {
    toast.info("Mock: cancelado")
    router.back()
  }
  const handleLimpiar = () => {
    if (confirm("¿Está seguro de limpiar los registros?")) {
      setRows([])
      toast.info("Mock: datos limpiados")
    }
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="p-6 space-y-6">
        <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3">
          <h1 className="text-lg font-bold text-blue-900 tracking-wide">
            REGISTRO DE INGRESOS Y DESCUENTOS VARIOS
          </h1>
          <p className="text-xs text-blue-800 mt-1">
            Pantalla mock (sin cálculos reales), lista para futura integración con nómina/contabilidad.
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button size="sm" className="gap-2" onClick={handleGuardar}>
            <Save className="h-4 w-4" />
            Guardar
          </Button>
          <Button size="sm" variant="outline" className="gap-2" onClick={handleCancelar}>
            <XCircle className="h-4 w-4" />
            Cancelar
          </Button>
          <Button size="sm" variant="outline" className="gap-2" onClick={handleLimpiar}>
            <Eraser className="h-4 w-4" />
            Limpiar
          </Button>
          <Button size="sm" variant="outline" className="gap-2 ml-auto" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        </div>

        <PlanillasMensualesHeader value={cabecera} onChange={setCabecera} />

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Detalle (grid ERP)</CardTitle>
          </CardHeader>
          <CardContent>
            <EditableGridERP
              rows={rows}
              columns={columns}
              onChange={setRows}
              maxHeight={520}
              rowKey={(r) => `${r.codigo_empleado}-${r.detalle}`}
              rowClassName={rowClassName}
            />
          </CardContent>
        </Card>
      </div>
    </>
  )
}


