"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Calculator, Loader2, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/fetcher"
import type { Empresa } from "@/lib/types/contabilidad"
import type { Sucursal } from "@/lib/types/contabilidad"

/** Formato YYYY-MM-DD para estado y backend (evita problemas de timezone usando fecha local). */
function formatDateToYYYYMMDD(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/** Primer y último día del mes actual, calculados dinámicamente (28, 29, 30 o 31 según el mes). */
function getFechasMesActual(): { desde: string; hasta: string } {
  const hoy = new Date()
  const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
  return {
    desde: formatDateToYYYYMMDD(primerDiaMes),
    hasta: formatDateToYYYYMMDD(ultimoDiaMes),
  }
}

interface ContabilizacionFilters {
  empresa: string
  sucursal: string
  desde_fecha: string
  a_fecha: string
  ventas: boolean
  notas_remision: boolean
  cobranzas: boolean
}

const CLASIFICADOR_FIJO = "CON-CEN"
const COTIZACION_FIJA = "6.96"

export default function ContabilizacionFacturas() {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [sucursales, setSucursales] = useState<Sucursal[]>([])

  const [filters, setFilters] = useState<ContabilizacionFilters>(() => {
    const { desde, hasta } = getFechasMesActual()
    return {
      empresa: "",
      sucursal: "",
      desde_fecha: desde,
      a_fecha: hasta,
      ventas: true,
      notas_remision: false,
      cobranzas: false,
    }
  })

  // Al montar: Desde = primer día del mes actual, A Fecha = último día (28/29/30/31 según mes)
  useEffect(() => {
    const { desde, hasta } = getFechasMesActual()
    setFilters((prev) => ({ ...prev, desde_fecha: desde, a_fecha: hasta }))
  }, [])

  useEffect(() => {
    const loadEmpresas = async () => {
      try {
        const res = await api("/api/contabilidad/empresas?limit=1000")
        if (res.ok) {
          const data = await res.json()
          const list = data.data || []
          setEmpresas(list)
          const defaultEmpresa = list.find((e: Empresa) => e.codigo === "001")
          if (defaultEmpresa) {
            setFilters((prev) => ({ ...prev, empresa: defaultEmpresa.id }))
          }
        }
      } catch {
        setEmpresas([])
      }
    }
    const loadSucursales = async () => {
      try {
        const res = await api("/api/contabilidad/sucursales?limit=1000")
        if (res.ok) {
          const data = await res.json()
          const list = data.data || []
          setSucursales(list)
          const defaultSucursal = list.find((s: Sucursal) => s.codigo === "001.1")
          if (defaultSucursal) {
            setFilters((prev) => ({ ...prev, sucursal: defaultSucursal.id }))
          }
        }
      } catch {
        setSucursales([])
      }
    }
    loadEmpresas()
    loadSucursales()
  }, [])

  const [info, setInfo] = useState({
    nro_comp_factura_iva: "0",
    nro_comp_notas_remision: "0",
    nro_comp_cobranzas: "0",
  })

  const [loading, setLoading] = useState(false)
  const [resumen, setResumen] = useState<{
    total: number
    contabilizadas: number
    errores: number
    comprobantes: { factura_numero: string | null; numero: string; tipo_comprobante?: string }[]
    errores_detalle: { factura_numero: string | null; error: string }[]
  } | null>(null)

  const handleFilterChange = (field: keyof ContabilizacionFilters, value: string | boolean) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
    if (field === "desde_fecha" || field === "a_fecha") setResumen(null)
  }

  const limpiarResumen = () => {
    setResumen(null)
    setInfo((prev) => ({ ...prev, nro_comp_factura_iva: "0" }))
  }

  const handleContabilizar = async () => {
    if (!filters.ventas && !filters.notas_remision && !filters.cobranzas) {
      toast.error("Seleccione al menos un tipo de documento (Ventas, Notas de remisión o Cobranzas)")
      return
    }
    if (new Date(filters.desde_fecha) > new Date(filters.a_fecha)) {
      toast.error("La fecha Desde debe ser menor o igual que la fecha A")
      return
    }
    if (!filters.ventas) {
      toast.error("En esta versión solo se contabilizan facturas manuales (Ventas). Marque Ventas.")
      return
    }

    setLoading(true)
    setResumen(null)
    try {
      const res = await api("/api/contabilidad/contabilizar-facturas", {
        method: "POST",
        body: JSON.stringify({
          desde_fecha: filters.desde_fecha,
          hasta_fecha: filters.a_fecha,
          ventas: filters.ventas,
          empresa_id: filters.empresa || null,
          sucursal_id: filters.sucursal || null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg = data.error || "Error al contabilizar"
        const detail = data.details ? ` ${data.details}` : ""
        toast.error(msg + detail)
        return
      }
      if (data.success) {
        setResumen({
          total: data.total ?? 0,
          contabilizadas: data.contabilizadas ?? 0,
          errores: data.errores ?? 0,
          comprobantes: (data.comprobantes ?? []).map((c: { factura_numero: string | null; numero: string; tipo_comprobante?: string }) => ({
            factura_numero: c.factura_numero,
            numero: c.numero,
            tipo_comprobante: c.tipo_comprobante ?? "Traspaso",
          })),
          errores_detalle: (data.errores_detalle ?? []).map((e: { factura_numero: string | null; error: string }) => ({
            factura_numero: e.factura_numero,
            error: e.error,
          })),
        })
        setInfo((prev) => ({
          ...prev,
          nro_comp_factura_iva: String(data.contabilizadas ?? 0),
        }))
        toast.success(data.message ?? `${data.contabilizadas ?? 0} factura(s) contabilizada(s)`)
      }
    } catch (e) {
      toast.error("Error de conexión al contabilizar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contabilización de Facturas</CardTitle>
        <CardDescription>
          Contabilizar facturas manuales en el periodo seleccionado.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filtros */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Filtros</h3>
          <div className="space-y-4">
            {/* Fila arriba: Empresa, Sucursal, Clasificador */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="empresa" className="text-xs text-gray-600">
                  Empresa
                </Label>
                <Select
                  value={filters.empresa}
                  onValueChange={(value) => handleFilterChange("empresa", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Seleccionar empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {empresas.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.codigo} - {e.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sucursal" className="text-xs text-gray-600">
                  Sucursal
                </Label>
                <Select
                  value={filters.sucursal}
                  onValueChange={(value) => handleFilterChange("sucursal", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Seleccionar sucursal" />
                  </SelectTrigger>
                <SelectContent>
                  {sucursales.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.codigo} - {s.sucursal ?? "—"}
                    </SelectItem>
                  ))}
                </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="clasificador" className="text-xs text-gray-600">
                  Clasificador
                </Label>
                <Input
                  id="clasificador"
                  value={CLASIFICADOR_FIJO}
                  readOnly
                  className="mt-1 bg-gray-50 font-mono"
                />
              </div>
            </div>
            {/* Fila abajo: Desde Fecha, A Fecha, Cotización (calendarios con valor YYYY-MM-DD) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="desde_fecha" className="text-xs text-gray-600">
                  Desde Fecha
                </Label>
                <Input
                  id="desde_fecha"
                  type="date"
                  value={filters.desde_fecha}
                  onChange={(e) => handleFilterChange("desde_fecha", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="a_fecha" className="text-xs text-gray-600">
                  A Fecha
                </Label>
                <Input
                  id="a_fecha"
                  type="date"
                  value={filters.a_fecha}
                  onChange={(e) => handleFilterChange("a_fecha", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="cotizacion" className="text-xs text-gray-600">
                  Cotización
                </Label>
                <Input
                  id="cotizacion"
                  type="text"
                  value={COTIZACION_FIJA}
                  readOnly
                  className="mt-1 bg-gray-50 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Tipos de Documentos: solo Ventas activo por defecto; Notas de Remisión y Cobranzas inertes */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Tipos de Documentos</h3>
          <div className="flex gap-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="ventas"
                checked={filters.ventas}
                onCheckedChange={(checked) => handleFilterChange("ventas", !!checked)}
              />
              <Label htmlFor="ventas" className="text-sm font-normal cursor-pointer">
                Ventas
              </Label>
            </div>
            <div className="flex items-center space-x-2 opacity-60">
              <Checkbox id="notas_remision" checked={false} disabled />
              <Label htmlFor="notas_remision" className="text-sm font-normal text-gray-500 cursor-not-allowed">
                Notas de Remisión
              </Label>
            </div>
            <div className="flex items-center space-x-2 opacity-60">
              <Checkbox id="cobranzas" checked={false} disabled />
              <Label htmlFor="cobranzas" className="text-sm font-normal text-gray-500 cursor-not-allowed">
                Cobranzas
              </Label>
            </div>
          </div>
        </div>

        <Separator />

        {/* Campos informativos: se actualizan con el resultado real del endpoint */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Información de Comprobantes</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="nro_comp_factura_iva" className="text-xs text-gray-600">
                Nº comprobantes generados (Ventas)
              </Label>
              <Input
                id="nro_comp_factura_iva"
                value={resumen !== null ? String(resumen.contabilizadas) : info.nro_comp_factura_iva}
                readOnly
                className="mt-1 bg-gray-50 font-mono"
              />
            </div>
            <div>
              <Label htmlFor="nro_comp_notas_remision" className="text-xs text-gray-600">
                Nro. de Comp. Notas de Remisión
              </Label>
              <Input
                id="nro_comp_notas_remision"
                value={info.nro_comp_notas_remision}
                readOnly
                className="mt-1 bg-gray-50 font-mono"
              />
            </div>
            <div>
              <Label htmlFor="nro_comp_cobranzas" className="text-xs text-gray-600">
                Nro. de Comp. Cobranzas
              </Label>
              <Input
                id="nro_comp_cobranzas"
                value={info.nro_comp_cobranzas}
                readOnly
                className="mt-1 bg-gray-50 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Resumen tras contabilizar: resultado real del endpoint */}
        {resumen !== null && (
          <>
            <Separator />
            <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50/50 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800">Resultado de la contabilización</h3>
                <Button type="button" variant="ghost" size="sm" onClick={limpiarResumen} className="text-gray-600">
                  Limpiar resumen
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-white border border-gray-200 shadow-sm">
                  <span className="text-xs font-medium text-gray-600">Facturas encontradas (pendientes)</span>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">{resumen.total}</p>
                  <p className="text-xs text-gray-500 mt-0.5">En el periodo, listas para contabilizar</p>
                </div>
                <div className="p-3 rounded-lg bg-white border border-green-200 shadow-sm bg-green-50/50">
                  <span className="text-xs font-medium text-green-700 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Contabilizadas
                  </span>
                  <p className="mt-1 text-2xl font-semibold text-green-800">{resumen.contabilizadas}</p>
                  <p className="text-xs text-green-600/80 mt-0.5">Comprobantes creados y aprobados</p>
                </div>
                <div className="p-3 rounded-lg bg-white border border-red-200 shadow-sm bg-red-50/50">
                  <span className="text-xs font-medium text-red-700 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> Fallaron
                  </span>
                  <p className="mt-1 text-2xl font-semibold text-red-800">{resumen.errores}</p>
                  <p className="text-xs text-red-600/80 mt-0.5">Con motivo indicado abajo</p>
                </div>
              </div>

              {resumen.comprobantes.length > 0 && (
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Comprobantes generados</p>
                  <ul className="text-sm text-gray-800 space-y-1">
                    {resumen.comprobantes.map((c, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="font-mono text-green-700 font-medium">Nº {c.numero} {c.tipo_comprobante ?? "Traspaso"}</span>
                        <span className="text-gray-500">← Factura {c.factura_numero ?? "—"}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {resumen.errores_detalle.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-white p-3">
                  <p className="text-xs font-semibold text-red-700 mb-2">Facturas que fallaron y por qué</p>
                  <ul className="text-sm space-y-2">
                    {resumen.errores_detalle.map((e, i) => (
                      <li key={i} className="flex flex-col gap-0.5 text-red-800">
                        <span className="font-medium">Factura {e.factura_numero ?? "—"}</span>
                        <span className="text-red-600/90 text-xs">{e.error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </>
        )}

        {/* Acción */}
        <div className="flex justify-end gap-4 pt-4">
          <Button
            onClick={handleContabilizar}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Calculator className="w-4 h-4 mr-2" />
            )}
            {loading ? "Contabilizando…" : "Contabilizar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}







