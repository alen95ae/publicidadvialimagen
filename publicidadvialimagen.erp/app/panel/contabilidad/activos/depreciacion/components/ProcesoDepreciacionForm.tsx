"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Calculator, RotateCcw, FileText, Trash2 } from "lucide-react"
import { toast } from "sonner"

export default function ProcesoDepreciacionForm() {
  const [datosOrganizativos, setDatosOrganizativos] = useState({
    empresa: "001",
    regional: "01",
    sucursal: "001",
    clasificador: "CONTABILIDAD",
  })

  const [parametros, setParametros] = useState({
    gestion: new Date().getFullYear().toString(),
    desde_fecha: new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0],
    hasta_fecha: new Date().toISOString().split("T")[0],
    moneda: "BS",
    cotizacion_inicial: "1.00",
    cotizacion_final: "1.00",
  })

  const [estadoProceso, setEstadoProceso] = useState("Pendiente")
  const [cotizacionUSD, setCotizacionUSD] = useState("6.95")

  const [comprobantes, setComprobantes] = useState({
    nro_comprobante_depreciacion: "",
    nro_comprobante_aitb: "",
  })

  const handleDatosOrganizativosChange = (field: string, value: string) => {
    setDatosOrganizativos((prev) => ({ ...prev, [field]: value }))
  }

  const handleParametrosChange = (field: string, value: string) => {
    setParametros((prev) => ({ ...prev, [field]: value }))
  }

  const handleProcesarDepreciacion = () => {
    toast.info("Procesando depreciación (mock)...")
    setTimeout(() => {
      setEstadoProceso("Depreciado")
      setComprobantes({
        nro_comprobante_depreciacion: "COMP-DEP-001",
        nro_comprobante_aitb: "",
      })
      toast.success("Depreciación procesada correctamente (mock)")
    }, 1000)
  }

  const handleRevertirProceso = () => {
    toast.info("Revirtiendo proceso (mock)...")
    setTimeout(() => {
      setEstadoProceso("Pendiente")
      setComprobantes({
        nro_comprobante_depreciacion: "",
        nro_comprobante_aitb: "",
      })
      toast.success("Proceso revertido (mock)")
    }, 500)
  }

  const handleContabilizar = () => {
    if (estadoProceso !== "Depreciado") {
      toast.error("Debe procesar la depreciación primero")
      return
    }
    toast.info("Contabilizando (mock)...")
    setTimeout(() => {
      setEstadoProceso("Contabilizado")
      setComprobantes({
        nro_comprobante_depreciacion: "COMP-DEP-001",
        nro_comprobante_aitb: "COMP-AITB-001",
      })
      toast.success("Depreciación contabilizada correctamente (mock)")
    }, 1000)
  }

  const handleLimpiar = () => {
    setParametros({
      gestion: new Date().getFullYear().toString(),
      desde_fecha: new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0],
      hasta_fecha: new Date().toISOString().split("T")[0],
      moneda: "BS",
      cotizacion_inicial: "1.00",
      cotizacion_final: "1.00",
    })
    setEstadoProceso("Pendiente")
    setCotizacionUSD("6.95")
    setComprobantes({
      nro_comprobante_depreciacion: "",
      nro_comprobante_aitb: "",
    })
    toast.info("Formulario limpiado")
  }

  return (
    <div className="space-y-6">
      {/* Cabecera - Datos Organizativos */}
      <Card>
        <CardHeader>
          <CardTitle>Datos Organizativos</CardTitle>
          <CardDescription>Información de la empresa y área contable</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="empresa" className="text-xs text-gray-600">
                Empresa
              </Label>
              <Select
                value={datosOrganizativos.empresa}
                onValueChange={(value) => handleDatosOrganizativosChange("empresa", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="001">Empresa 001</SelectItem>
                  <SelectItem value="002">Empresa 002</SelectItem>
                  <SelectItem value="003">Empresa 003</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="regional" className="text-xs text-gray-600">
                Regional
              </Label>
              <Select
                value={datosOrganizativos.regional}
                onValueChange={(value) => handleDatosOrganizativosChange("regional", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="01">Regional 01</SelectItem>
                  <SelectItem value="02">Regional 02</SelectItem>
                  <SelectItem value="03">Regional 03</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sucursal" className="text-xs text-gray-600">
                Sucursal
              </Label>
              <Select
                value={datosOrganizativos.sucursal}
                onValueChange={(value) => handleDatosOrganizativosChange("sucursal", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="001">Sucursal 001</SelectItem>
                  <SelectItem value="002">Sucursal 002</SelectItem>
                  <SelectItem value="003">Sucursal 003</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="clasificador" className="text-xs text-gray-600">
                Clasificador / Área Contable
              </Label>
              <Select
                value={datosOrganizativos.clasificador}
                onValueChange={(value) => handleDatosOrganizativosChange("clasificador", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONTABILIDAD">CONTABILIDAD</SelectItem>
                  <SelectItem value="VENTAS">VENTAS</SelectItem>
                  <SelectItem value="TESORERIA">TESORERIA</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parámetros de Depreciación y Estado del Proceso */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bloque Izquierdo - Parámetros de Depreciación */}
        <Card>
          <CardHeader>
            <CardTitle>Parámetros de Depreciación</CardTitle>
            <CardDescription>Configuración del proceso de depreciación</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="gestion" className="text-xs text-gray-600">
                Gestión
              </Label>
              <Select
                value={parametros.gestion}
                onValueChange={(value) => handleParametrosChange("gestion", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="desde_fecha" className="text-xs text-gray-600">
                Desde Fecha
              </Label>
              <Input
                id="desde_fecha"
                type="date"
                value={parametros.desde_fecha}
                onChange={(e) => handleParametrosChange("desde_fecha", e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="hasta_fecha" className="text-xs text-gray-600">
                Hasta Fecha
              </Label>
              <Input
                id="hasta_fecha"
                type="date"
                value={parametros.hasta_fecha}
                onChange={(e) => handleParametrosChange("hasta_fecha", e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="moneda" className="text-xs text-gray-600">
                Moneda
              </Label>
              <Select
                value={parametros.moneda}
                onValueChange={(value) => handleParametrosChange("moneda", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BS">Bs</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="cotizacion_inicial" className="text-xs text-gray-600">
                Cotización Inicial
              </Label>
              <Input
                id="cotizacion_inicial"
                type="number"
                step="0.01"
                value={parametros.cotizacion_inicial}
                onChange={(e) => handleParametrosChange("cotizacion_inicial", e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="cotizacion_final" className="text-xs text-gray-600">
                Cotización Final
              </Label>
              <Input
                id="cotizacion_final"
                type="number"
                step="0.01"
                value={parametros.cotizacion_final}
                onChange={(e) => handleParametrosChange("cotizacion_final", e.target.value)}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Bloque Derecho - Estado del Proceso */}
        <Card>
          <CardHeader>
            <CardTitle>Estado del Proceso</CardTitle>
            <CardDescription>Estado actual del proceso de depreciación</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                Estado
              </Label>
              <RadioGroup
                value={estadoProceso}
                onValueChange={setEstadoProceso}
                className="space-y-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Pendiente" id="estado-pendiente" />
                  <Label
                    htmlFor="estado-pendiente"
                    className="cursor-pointer flex items-center gap-2"
                  >
                    Pendiente
                    {estadoProceso === "Pendiente" && (
                      <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">
                        Actual
                      </span>
                    )}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Depreciado" id="estado-depreciado" />
                  <Label
                    htmlFor="estado-depreciado"
                    className="cursor-pointer flex items-center gap-2"
                  >
                    Depreciado
                    {estadoProceso === "Depreciado" && (
                      <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                        Actual
                      </span>
                    )}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Contabilizado" id="estado-contabilizado" />
                  <Label
                    htmlFor="estado-contabilizado"
                    className="cursor-pointer flex items-center gap-2"
                  >
                    Contabilizado
                    {estadoProceso === "Contabilizado" && (
                      <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                        Actual
                      </span>
                    )}
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <Separator />
            <div>
              <Label htmlFor="cotizacion_usd" className="text-xs text-gray-600">
                Cotización USD
              </Label>
              <Input
                id="cotizacion_usd"
                type="number"
                step="0.01"
                value={cotizacionUSD}
                onChange={(e) => setCotizacionUSD(e.target.value)}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Datos de Comprobantes */}
      <Card>
        <CardHeader>
          <CardTitle>Datos de Comprobantes</CardTitle>
          <CardDescription>Números de comprobantes generados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nro_comprobante_depreciacion" className="text-xs text-gray-600">
                Nro. Comprobante Depreciación
              </Label>
              <Input
                id="nro_comprobante_depreciacion"
                value={comprobantes.nro_comprobante_depreciacion}
                readOnly
                className="mt-1 bg-gray-50 font-mono"
                placeholder="Se generará al procesar"
              />
            </div>
            <div>
              <Label htmlFor="nro_comprobante_aitb" className="text-xs text-gray-600">
                Nro. Comprobante A.I.T.B.
              </Label>
              <Input
                id="nro_comprobante_aitb"
                value={comprobantes.nro_comprobante_aitb}
                readOnly
                className="mt-1 bg-gray-50 font-mono"
                placeholder="Se generará al contabilizar"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Acciones */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones</CardTitle>
          <CardDescription>Operaciones disponibles del proceso</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={handleProcesarDepreciacion}
              disabled={estadoProceso === "Depreciado" || estadoProceso === "Contabilizado"}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Calculator className="w-4 h-4 mr-2" />
              Procesar Depreciación
            </Button>
            <Button
              onClick={handleRevertirProceso}
              disabled={estadoProceso === "Pendiente"}
              variant="outline"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Revertir Proceso
            </Button>
            <Button
              onClick={handleContabilizar}
              disabled={estadoProceso !== "Depreciado"}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <FileText className="w-4 h-4 mr-2" />
              Contabilizar
            </Button>
            <Button onClick={handleLimpiar} variant="outline" className="border-gray-300">
              <Trash2 className="w-4 h-4 mr-2" />
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}






