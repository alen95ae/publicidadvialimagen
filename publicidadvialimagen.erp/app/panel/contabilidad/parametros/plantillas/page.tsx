"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Plus, Trash2, Power, PowerOff } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/fetcher"

interface Plantilla {
  id: string
  codigo: string
  nombre: string
  descripcion: string | null
  tipo_comprobante: string
  activa: boolean
}

export default function PlantillasContablesPage() {
  const router = useRouter()
  const [plantillas, setPlantillas] = useState<Plantilla[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarPlantillas()
  }, [])

  const cargarPlantillas = async () => {
    try {
      setLoading(true)
      const response = await api("/api/contabilidad/plantillas?solo_activas=false")
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

  const nuevaPlantilla = () => {
    router.push("/panel/contabilidad/parametros/plantillas/nueva")
  }

  const editarPlantilla = (plantilla: Plantilla) => {
    router.push(`/panel/contabilidad/parametros/plantillas/editar/${plantilla.id}`)
  }

  const toggleActiva = async (plantilla: Plantilla) => {
    try {
      const response = await api(`/api/contabilidad/plantillas/${plantilla.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activa: !plantilla.activa }),
      })

      if (response.ok) {
        toast.success(plantilla.activa ? "Plantilla desactivada" : "Plantilla activada")
        cargarPlantillas()
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al cambiar estado")
      }
    } catch (error) {
      console.error("Error cambiando estado:", error)
      toast.error("Error de conexión")
    }
  }

  const eliminarPlantilla = async (plantilla: Plantilla) => {
    if (!confirm(`¿Eliminar la plantilla "${plantilla.nombre}"?`)) return

    try {
      const response = await api(`/api/contabilidad/plantillas/${plantilla.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Plantilla eliminada")
        cargarPlantillas()
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al eliminar")
      }
    } catch (error) {
      console.error("Error eliminando plantilla:", error)
      toast.error("Error de conexión")
    }
  }

  return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Plantillas de Comprobantes</h1>
          <p className="text-gray-600 mt-2">
            Plantillas predefinidas para generar asientos contables automáticamente.
          </p>
        </div>

        <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Plantillas de Comprobantes</CardTitle>
            <CardDescription>
              Gestiona las plantillas para generar comprobantes automáticamente
            </CardDescription>
          </div>
          <Button onClick={nuevaPlantilla} className="bg-red-600 hover:bg-red-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Plantilla
          </Button>
          </CardHeader>
          <CardContent>
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
                    {loading ? "Cargando..." : "No hay plantillas configuradas"}
                  </TableCell>
                </TableRow>
              ) : (
                plantillas.map((plantilla) => (
                      <TableRow key={plantilla.id}>
                        <TableCell className="font-medium">{plantilla.codigo}</TableCell>
                    <TableCell>{plantilla.nombre}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{plantilla.tipo_comprobante}</Badge>
                        </TableCell>
                        <TableCell>
                      <Badge variant={plantilla.activa ? "default" : "secondary"}>
                            {plantilla.activa ? "Sí" : "No"}
                          </Badge>
                        </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => editarPlantilla(plantilla)}
                          title="Editar plantilla"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Editar Plantilla
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActiva(plantilla)}
                          title={plantilla.activa ? "Desactivar" : "Activar"}
                        >
                          {plantilla.activa ? (
                            <PowerOff className="w-4 h-4 text-orange-500" />
                          ) : (
                            <Power className="w-4 h-4 text-green-500" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => eliminarPlantilla(plantilla)}
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                      </div>
                        </TableCell>
                      </TableRow>
                ))
              )}
                  </TableBody>
                </Table>
          </CardContent>
        </Card>
    </div>
  )
}
