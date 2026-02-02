"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import FacturasManuales, { type InitialDataFromCotizacion } from "@/app/panel/facturas/components/FacturasManuales"

export default function NuevaFacturaManualPage() {
  const searchParams = useSearchParams()
  const cotizacionId = searchParams.get("cotizacion_id")
  const [guardarProps, setGuardarProps] = useState<{ guardar: () => void; guardando: boolean } | null>(null)
  const [initialDataFromCotizacion, setInitialDataFromCotizacion] = useState<InitialDataFromCotizacion | null>(null)
  const [cargandoCotizacion, setCargandoCotizacion] = useState(false)

  useEffect(() => {
    if (!cotizacionId) return
    let cancelled = false
    setCargandoCotizacion(true)
    Promise.all([
      fetch(`/api/cotizaciones/${cotizacionId}`, { credentials: "include" }).then((r) => r.json()),
      fetch("/api/public/comerciales", { credentials: "include" }).then((r) => r.json()),
    ])
      .then(([cotRes, comercialesRes]) => {
        if (cancelled) return
        if (!cotRes.success || !cotRes.data?.cotizacion) {
          setCargandoCotizacion(false)
          return
        }
        const cot = cotRes.data.cotizacion
        const lineas = cotRes.data.lineas || []
        const comerciales = comercialesRes.users || []
        const vendedorId = comerciales.find((c: any) => c.nombre === cot.vendedor)?.id ?? ""

        const itemsLineas = lineas.filter(
          (l: any) => (l.tipo === "producto" || l.codigo_producto) && (l.cantidad ?? 0) > 0
        )
        const items = itemsLineas.map((l: any) => {
          const cantidad = Number(l.cantidad) || 0
          const precioUnit = l.precio_unitario != null ? Number(l.precio_unitario) : (l.subtotal_linea != null && cantidad > 0 ? Number(l.subtotal_linea) / cantidad : 0)
          const subtotal = l.subtotal_linea != null ? Number(l.subtotal_linea) : cantidad * precioUnit
          return {
            codigo_producto: l.codigo_producto ?? "",
            descripcion: [l.nombre_producto, l.descripcion].filter(Boolean).join(" - ") || "",
            cantidad,
            unidad_medida: l.unidad_medida ?? "m²",
            precio_unitario: precioUnit,
            descuento: 0,
            importe: Math.round(subtotal * 100) / 100,
          }
        })

        setInitialDataFromCotizacion({
          clienteId: cot.cliente ?? "",
          vendedorId,
          cotizacionId: cot.id,
          cotizacionCodigoDisplay: cot.codigo ?? "",
          items,
        })
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setCargandoCotizacion(false)
      })
    return () => {
      cancelled = true
    }
  }, [cotizacionId])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nueva Factura Manual</h1>
          <p className="text-gray-600 mt-2">Crear una nueva factura manual</p>
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
      {cargandoCotizacion ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        </div>
      ) : (
        <FacturasManuales
          initialDataFromCotizacion={initialDataFromCotizacion}
          onGuardarProps={setGuardarProps}
        />
      )}
    </div>
  )
}
