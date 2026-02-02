"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, AlertCircle, CheckCircle, XCircle, Save } from "lucide-react"
import FacturasManuales from "@/app/panel/facturas/components/FacturasManuales"

const ESTADO_META: Record<string, { label: string; className: string }> = {
  BORRADOR: { label: "Borrador", className: "bg-gray-100 text-gray-800" },
  FACTURADA: { label: "Facturada", className: "bg-green-100 text-green-800" },
  ANULADA: { label: "Anulada", className: "bg-red-100 text-red-800" },
}

const getEstadoIcon = (estado: string) => {
  const iconClass = "w-4 h-4 shrink-0"
  switch (estado) {
    case "FACTURADA":
      return <CheckCircle className={iconClass} />
    case "ANULADA":
      return <XCircle className={iconClass} />
    case "BORRADOR":
    default:
      return <AlertCircle className={iconClass} />
  }
}

export default function EditarFacturaManualPage() {
  const params = useParams()
  const id = typeof params?.id === "string" ? params.id : null
  const [estado, setEstado] = useState<string | null>(null)
  const [guardarProps, setGuardarProps] = useState<{ guardar: () => void; guardando: boolean } | null>(null)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-900">Editar Factura Manual</h1>
          {estado != null && (
            <Badge
              className={`${ESTADO_META[estado]?.className ?? "bg-gray-100 text-gray-800"} text-sm px-3 py-1.5 rounded-full flex items-center gap-2 w-fit shrink-0 font-medium`}
            >
              {getEstadoIcon(estado)}
              {ESTADO_META[estado]?.label ?? estado}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/panel/contabilidad/facturas/manuales">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a facturas
            </Link>
          </Button>
          {guardarProps && (
            <Button
              variant="default"
              size="sm"
              onClick={guardarProps.guardar}
              disabled={guardarProps.guardando}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {guardarProps.guardando ? "Guardando..." : "Guardar"}
            </Button>
          )}
        </div>
      </div>
      <p className="text-gray-600 -mt-4">Modificar factura manual</p>
      <FacturasManuales
        initialFacturaId={id}
        onFacturaLoad={({ estado: e }) => setEstado(e)}
        onEstadoChange={setEstado}
        onGuardarProps={setGuardarProps}
      />
    </div>
  )
}
