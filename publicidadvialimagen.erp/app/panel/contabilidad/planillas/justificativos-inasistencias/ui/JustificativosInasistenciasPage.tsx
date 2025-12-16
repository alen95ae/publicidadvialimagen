"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { Toaster, toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save, Eraser } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import EditableGridERP, { type ERPGridColumn } from "../../_components/EditableGridERP"
import {
  justificativosInasistenciasMockInicial,
  catalogosVarios,
  type JustificativoInasistenciaRow,
} from "@/lib/planillas/variosMock"

export default function JustificativosInasistenciasPage() {
  const router = useRouter()
  const [periodo, setPeriodo] = useState<number>(202503)
  const [rows, setRows] = useState<JustificativoInasistenciaRow[]>(justificativosInasistenciasMockInicial)

  const columns: ERPGridColumn<JustificativoInasistenciaRow>[] = useMemo(
    () => [
      { key: "codigo_empleado", label: "Código", width: 140, readonly: true },
      { key: "nombre_empleado", label: "Nombre", width: 280, readonly: true },
      { key: "de_fecha", label: "De Fecha", width: 160, type: "date" },
      { key: "a_fecha", label: "A Fecha", width: 160, type: "date" },
      {
        key: "tipo_inasistencia",
        label: "Tipo de Inasistencia",
        width: 220,
        type: "select",
        options: catalogosVarios.tiposInasistencia.map((t) => ({ value: t, label: t })),
      },
    ],
    []
  )

  const handleGuardar = () => toast.success("Mock: guardado correctamente")
  const handleLimpiar = () => {
    if (confirm("¿Está seguro de limpiar los justificativos?")) {
      setRows([])
      toast.info("Mock: datos limpiados")
    }
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="p-6 space-y-6">
        <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-lg font-bold text-blue-900 tracking-wide">
                REGISTRO DE JUSTIFICATIVOS DE INASISTENCIAS
              </h1>
              <p className="text-xs text-blue-800 mt-1">Periodo: {periodo}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-blue-900">Periodo (YYYYMM)</Label>
                <Input
                  type="number"
                  value={periodo}
                  onChange={(e) => setPeriodo(parseInt(e.target.value || "0", 10))}
                  className="h-8 w-[140px] bg-white"
                  placeholder="202503"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button size="sm" className="gap-2" onClick={handleGuardar}>
            <Save className="h-4 w-4" />
            Guardar
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

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Detalle (grid ERP)</CardTitle>
          </CardHeader>
          <CardContent>
            <EditableGridERP rows={rows} columns={columns} onChange={setRows} maxHeight={520} />
          </CardContent>
        </Card>
      </div>
    </>
  )
}


