"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"

interface Plantilla {
  id: string
  codigo: string
  nombre: string
  descripcion: string | null
  tipo_comprobante: string
  activa: boolean
}

interface PlantillaDetalle {
  id: string
  orden: number
  rol: string
  lado: string
  porcentaje: number | null
  permite_seleccionar_cuenta: boolean
  cuenta_fija: string | null
  permite_auxiliar: boolean
}

export default function PlantillasContablesPage() {
  const [plantillas, setPlantillas] = useState<Plantilla[]>([])
  const [loading, setLoading] = useState(true)
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState<Plantilla | null>(null)
  const [detallesPlantilla, setDetallesPlantilla] = useState<PlantillaDetalle[]>([])
  const [dialogAbierto, setDialogAbierto] = useState(false)

  useEffect(() => {
    cargarPlantillas()
  }, [])

  const cargarPlantillas = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/contabilidad/plantillas")
      if (response.ok) {
        const data = await response.json()
        setPlantillas(data.data || [])
      }
    } catch (error) {
      console.error("Error cargando plantillas:", error)
    } finally {
      setLoading(false)
    }
  }

  const verDetallePlantilla = async (plantilla: Plantilla) => {
    setPlantillaSeleccionada(plantilla)
    try {
      const response = await fetch(`/api/contabilidad/plantillas/${plantilla.id}/detalles`)
      if (response.ok) {
        const data = await response.json()
        setDetallesPlantilla(data.data || [])
        setDialogAbierto(true)
      } else {
        console.error("Error cargando detalles de plantilla:", response.statusText)
      }
    } catch (error) {
      console.error("Error cargando detalles de plantilla:", error)
    }
  }

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Plantillas Contables</h1>
          <p className="text-gray-600 mt-2">
            Plantillas predefinidas para generar asientos contables automáticamente.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Plantillas Contables</CardTitle>
            <CardDescription>
              Plantillas predefinidas para generar asientos contables automáticamente.
              (Solo lectura)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Cargando plantillas...</p>
            ) : plantillas.length === 0 ? (
              <p>No hay plantillas contables activas.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Tipo Comprobante</TableHead>
                      <TableHead>Activa</TableHead>
                      <TableHead className="w-20">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plantillas.map((plantilla) => (
                      <TableRow key={plantilla.id}>
                        <TableCell className="font-mono">{plantilla.codigo}</TableCell>
                        <TableCell>{plantilla.nombre}</TableCell>
                        <TableCell>{plantilla.tipo_comprobante}</TableCell>
                        <TableCell>
                          <Badge variant={plantilla.activa ? "default" : "destructive"}>
                            {plantilla.activa ? "Sí" : "No"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => verDetallePlantilla(plantilla)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogo de detalle de plantilla */}
      <Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de Plantilla: {plantillaSeleccionada?.nombre}</DialogTitle>
            <DialogDescription>
              Información y líneas contables de la plantilla seleccionada.
            </DialogDescription>
          </DialogHeader>
          {plantillaSeleccionada && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold">Código:</p>
                  <p className="font-mono">{plantillaSeleccionada.codigo}</p>
                </div>
                <div>
                  <p className="font-semibold">Tipo de Comprobante:</p>
                  <p>{plantillaSeleccionada.tipo_comprobante}</p>
                </div>
                <div className="col-span-2">
                  <p className="font-semibold">Descripción:</p>
                  <p>{plantillaSeleccionada.descripcion || "N/A"}</p>
                </div>
                <div>
                  <p className="font-semibold">Activa:</p>
                  <Badge variant={plantillaSeleccionada.activa ? "default" : "destructive"}>
                    {plantillaSeleccionada.activa ? "Sí" : "No"}
                  </Badge>
                </div>
              </div>

              <h3 className="text-lg font-semibold mt-6">Líneas de la Plantilla</h3>
              {detallesPlantilla.length === 0 ? (
                <p>Esta plantilla no tiene líneas de detalle configuradas.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Orden</TableHead>
                        <TableHead className="w-24">Rol</TableHead>
                        <TableHead className="w-24">Lado</TableHead>
                        <TableHead className="w-24 text-right">Porcentaje</TableHead>
                        <TableHead>Cuenta Fija</TableHead>
                        <TableHead className="w-24 text-center">Sel. Cuenta</TableHead>
                        <TableHead className="w-24 text-center">Auxiliar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detallesPlantilla.map((detalle) => (
                        <TableRow key={detalle.id}>
                          <TableCell>{detalle.orden}</TableCell>
                          <TableCell>{detalle.rol}</TableCell>
                          <TableCell>
                            <Badge variant={detalle.lado === "DEBE" ? "secondary" : "outline"}>
                              {detalle.lado}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{detalle.porcentaje ? `${detalle.porcentaje}%` : "N/A"}</TableCell>
                          <TableCell className="font-mono">{detalle.cuenta_fija || "N/A"}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={detalle.permite_seleccionar_cuenta ? "default" : "outline"}>
                              {detalle.permite_seleccionar_cuenta ? "Sí" : "No"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={detalle.permite_auxiliar ? "default" : "outline"}>
                              {detalle.permite_auxiliar ? "Sí" : "No"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

