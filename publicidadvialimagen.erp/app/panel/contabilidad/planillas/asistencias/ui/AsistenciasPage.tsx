"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Toaster, toast } from "sonner"
import { ArrowLeft, Eraser, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import EditableGridERP, { type ERPGridColumn } from "../../_components/EditableGridERP"
import {
  asistenciaMockInicial,
  biometricoMockInicial,
  catalogosAsistencias,
  filtrosAsistenciaMockInicial,
  type AsistenciaRow,
  type BiometricoLogRow,
} from "@/lib/planillas/asistenciasMock"
import { empleadosMock } from "@/lib/planillas/mensualesMock"

export default function AsistenciasPage() {
  const router = useRouter()
  const [filtros, setFiltros] = useState(filtrosAsistenciaMockInicial)
  const [rows, setRows] = useState<AsistenciaRow[]>(asistenciaMockInicial)
  const [biometrico] = useState<BiometricoLogRow[]>(biometricoMockInicial)

  const columnsAsistencia: ERPGridColumn<AsistenciaRow>[] = useMemo(
    () => [
      { key: "fecha", label: "Fecha", width: 160, type: "date" },
      { key: "hora", label: "Hora", width: 120, type: "number", align: "right" },
      { key: "minuto", label: "Minuto", width: 120, type: "number", align: "right" },
      {
        key: "marca",
        label: "Marca",
        width: 170,
        type: "select",
        options: catalogosAsistencias.marcas.map((m) => ({ value: m, label: m })),
      },
      {
        key: "es",
        label: "E/S",
        width: 120,
        type: "select",
        options: catalogosAsistencias.es.map((v) => ({ value: v, label: v })),
        align: "center",
      },
    ],
    []
  )

  const columnsBiometrico: ERPGridColumn<BiometricoLogRow>[] = useMemo(
    () => [
      { key: "codigo", label: "Código", width: 140, readonly: true },
      { key: "marcado", label: "Marcado", width: 140, readonly: true },
      { key: "fecha", label: "Fecha", width: 160, readonly: true },
      { key: "hora", label: "Hora", width: 120, readonly: true, align: "right", type: "number" },
      { key: "minuto", label: "Minuto", width: 120, readonly: true, align: "right", type: "number" },
    ],
    []
  )

  const handleGuardar = () => toast.success("Mock: asistencias guardadas")
  const handleLimpiar = () => {
    if (confirm("¿Está seguro de limpiar el grid de asistencias?")) {
      setRows([])
      toast.info("Mock: datos limpiados")
    }
  }

  const nombreEmpleado = empleadosMock.find((e) => e.codigo_empleado === filtros.codigo_empleado)?.nombre_empleado

  return (
    <>
      <Toaster position="top-right" />
      <div className="p-6 space-y-6">
        <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3">
          <h1 className="text-lg font-bold text-blue-900 tracking-wide">REGISTRO DE ASISTENCIAS</h1>
          <p className="text-xs text-blue-800 mt-1">Mock (sin validaciones complejas). {nombreEmpleado || ""}</p>
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

        <Tabs defaultValue="asistencia" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="asistencia">Asistencia</TabsTrigger>
            <TabsTrigger value="biometrico">Biométrico</TabsTrigger>
          </TabsList>

          <TabsContent value="asistencia" className="mt-0 space-y-4">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle>Filtros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Código de Empleado</Label>
                    <Input
                      value={filtros.codigo_empleado}
                      onChange={(e) => setFiltros((p) => ({ ...p, codigo_empleado: e.target.value }))}
                      placeholder="EMP-001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>De Fecha</Label>
                    <Input
                      type="date"
                      value={filtros.de_fecha}
                      onChange={(e) => setFiltros((p) => ({ ...p, de_fecha: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>A Fecha</Label>
                    <Input
                      type="date"
                      value={filtros.a_fecha}
                      onChange={(e) => setFiltros((p) => ({ ...p, a_fecha: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle>Grid de Marcaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <EditableGridERP rows={rows} columns={columnsAsistencia} onChange={setRows} maxHeight={520} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="biometrico" className="mt-0 space-y-4">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle>Log Biométrico (solo lectura)</CardTitle>
              </CardHeader>
              <CardContent>
                <EditableGridERP rows={biometrico} columns={columnsBiometrico} onChange={() => {}} readonly maxHeight={520} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}


