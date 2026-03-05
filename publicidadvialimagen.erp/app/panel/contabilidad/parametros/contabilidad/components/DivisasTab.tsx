"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/fetcher"
import type { Divisa } from "@/lib/types/contabilidad"
import DivisaModal from "./DivisaModal"

export default function DivisasTab() {
  const [divisas, setDivisas] = useState<Divisa[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingDivisa, setEditingDivisa] = useState<Divisa | null>(null)

  useEffect(() => {
    fetchDivisas()
  }, [])

  const fetchDivisas = async () => {
    try {
      setLoading(true)
      const response = await api("/api/contabilidad/divisas?limit=1000")
      if (response.ok) {
        const data = await response.json()
        setDivisas(data.data || [])
      } else {
        setDivisas([])
      }
    } catch (error) {
      console.error("Error fetching divisas:", error)
      setDivisas([])
    } finally {
      setLoading(false)
    }
  }

  const handleNew = () => {
    setEditingDivisa(null)
    setModalOpen(true)
  }

  const handleEdit = (divisa: Divisa) => {
    setEditingDivisa(divisa)
    setModalOpen(true)
  }

  const handleDelete = async (divisa: Divisa) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar la divisa "${divisa.nombre}" (${divisa.codigo})?`)) {
      return
    }

    try {
      const response = await api(`/api/contabilidad/divisas/${divisa.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Divisa eliminada correctamente")
        fetchDivisas()
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al eliminar la divisa")
      }
    } catch (error) {
      console.error("Error deleting divisa:", error)
      toast.error("Error de conexión")
    }
  }

  const formatTipoCambio = (n: number) =>
    Number(n).toLocaleString("es-BO", { minimumFractionDigits: 4, maximumFractionDigits: 4 })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Divisas</CardTitle>
              <CardDescription>Gestión de monedas y tipos de cambio</CardDescription>
            </div>
            <Button
              size="sm"
              onClick={handleNew}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Divisa
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Cargando...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Símbolo</TableHead>
                    <TableHead className="text-right">Tipo de Cambio</TableHead>
                    <TableHead className="text-center">Moneda Base</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {divisas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                        No hay divisas registradas
                      </TableCell>
                    </TableRow>
                  ) : (
                    divisas.map((divisa) => (
                      <TableRow key={divisa.id}>
                        <TableCell className="font-mono font-semibold">{divisa.codigo}</TableCell>
                        <TableCell className="font-semibold">{divisa.nombre}</TableCell>
                        <TableCell className="font-mono">{divisa.simbolo}</TableCell>
                        <TableCell className="text-right tabular-nums font-mono">
                          {formatTipoCambio(divisa.tipo_cambio)}
                        </TableCell>
                        <TableCell className="text-center">
                          {divisa.es_base ? (
                            <Badge variant="default" className="bg-green-600 hover:bg-green-700">Sí</Badge>
                          ) : (
                            <Badge variant="secondary">No</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {divisa.estado === "ACTIVO" ? (
                            <Badge variant="outline" className="border-green-500 text-green-700">ACTIVO</Badge>
                          ) : (
                            <Badge variant="outline" className="border-gray-400 text-gray-500">INACTIVO</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(divisa)}
                              title="Editar"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(divisa)}
                              title="Eliminar"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <DivisaModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        divisa={editingDivisa}
        onSaved={fetchDivisas}
      />
    </div>
  )
}
