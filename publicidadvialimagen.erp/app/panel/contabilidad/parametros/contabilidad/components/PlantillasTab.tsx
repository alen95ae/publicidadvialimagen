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

export default function PlantillasTab() {
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

  const verDetalle = async (plantilla: Plantilla) => {
    setPlantillaSeleccionada(plantilla)
    try {
      const response = await fetch(`/api/contabilidad/plantillas/${plantilla.id}/detalles`)
      if (response.ok) {
        const data = await response.json()
        setDetallesPlantilla(data.data || [])
        setDialogAbierto(true)
      }
    } catch (error) {
      console.error("Error cargando detalles:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-gray-500">Cargando plantillas...</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 mb-4">
            Plantillas contables configuradas en el sistema. Estas plantillas se usan para generar comprobantes automáticamente.
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo de Comprobante</TableHead>
              <TableHead>Activa</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plantillas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                  No hay plantillas configuradas
                </TableCell>
              </TableRow>
            ) : (
              plantillas.map((plantilla) => (
                <TableRow key={plantilla.id}>
                  <TableCell className="font-mono text-sm">{plantilla.codigo}</TableCell>
                  <TableCell className="font-medium">{plantilla.nombre}</TableCell>
                  <TableCell>{plantilla.tipo_comprobante}</TableCell>
                  <TableCell>
                    <Badge variant={plantilla.activa ? "default" : "secondary"}>
                      {plantilla.activa ? "Sí" : "No"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => verDetalle(plantilla)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog de detalle */}
      <Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{plantillaSeleccionada?.nombre}</DialogTitle>
            <DialogDescription>
              Detalle de la plantilla contable
            </DialogDescription>
          </DialogHeader>

          {plantillaSeleccionada && (
            <div className="space-y-6">
              {/* Información general */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Información General</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Código</p>
                      <p className="font-mono">{plantillaSeleccionada.codigo}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Tipo de Comprobante</p>
                      <p>{plantillaSeleccionada.tipo_comprobante}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Estado</p>
                      <Badge variant={plantillaSeleccionada.activa ? "default" : "secondary"}>
                        {plantillaSeleccionada.activa ? "Activa" : "Inactiva"}
                      </Badge>
                    </div>
                  </div>
                  {plantillaSeleccionada.descripcion && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Descripción</p>
                      <p className="text-sm">{plantillaSeleccionada.descripcion}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Detalles de líneas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Líneas de la Plantilla</CardTitle>
                  <CardDescription>Estructura contable generada por esta plantilla</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Orden</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Lado</TableHead>
                        <TableHead className="w-24">Porcentaje</TableHead>
                        <TableHead className="w-32">Cuenta Fija</TableHead>
                        <TableHead className="w-32">Seleccionar Cuenta</TableHead>
                        <TableHead className="w-32">Permite Auxiliar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detallesPlantilla.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-gray-500 py-4">
                            No hay detalles configurados
                          </TableCell>
                        </TableRow>
                      ) : (
                        detallesPlantilla
                          .sort((a, b) => a.orden - b.orden)
                          .map((detalle) => (
                            <TableRow key={detalle.id}>
                              <TableCell className="font-medium">{detalle.orden}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{detalle.rol}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={detalle.lado === "DEBE" ? "default" : "secondary"}>
                                  {detalle.lado}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {detalle.porcentaje ? `${detalle.porcentaje}%` : "—"}
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {detalle.cuenta_fija || "—"}
                              </TableCell>
                              <TableCell>
                                <Badge variant={detalle.permite_seleccionar_cuenta ? "default" : "secondary"}>
                                  {detalle.permite_seleccionar_cuenta ? "Sí" : "No"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={detalle.permite_auxiliar ? "default" : "secondary"}>
                                  {detalle.permite_auxiliar ? "Sí" : "No"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

