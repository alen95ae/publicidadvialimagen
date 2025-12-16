"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { api } from "@/lib/fetcher"
import type { Comprobante } from "@/lib/types/contabilidad"

interface ComprobantesListProps {
  onSelect: (comprobante: Comprobante | null) => void
  selectedId?: number
}

export default function ComprobantesList({ onSelect, selectedId }: ComprobantesListProps) {
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchComprobantes()
  }, [])

  const fetchComprobantes = async () => {
    try {
      setLoading(true)
      const response = await api("/api/contabilidad/comprobantes")
      if (response.ok) {
        const data = await response.json()
        setComprobantes(data.data || [])
      } else {
        setComprobantes([])
      }
    } catch (error) {
      console.error("Error fetching comprobantes:", error)
      setComprobantes([])
    } finally {
      setLoading(false)
    }
  }

  const filteredComprobantes = comprobantes.filter((comp) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      comp.numero.toLowerCase().includes(search) ||
      comp.glosa?.toLowerCase().includes(search) ||
      comp.beneficiario?.toLowerCase().includes(search)
    )
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de Comprobantes</CardTitle>
        <CardDescription>Selecciona un comprobante para ver o editar</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Buscador */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por número, glosa o beneficiario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Tabla */}
        {loading ? (
          <div className="text-center py-8 text-gray-500">Cargando...</div>
        ) : (
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Glosa</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredComprobantes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                      No hay comprobantes registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredComprobantes.map((comprobante) => (
                    <TableRow
                      key={comprobante.id}
                      onClick={() => onSelect(comprobante)}
                      className={`cursor-pointer ${
                        selectedId === comprobante.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <TableCell className="font-mono font-semibold">
                        {comprobante.numero}
                      </TableCell>
                      <TableCell>
                        {new Date(comprobante.fecha).toLocaleDateString("es-BO")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{comprobante.origen}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{comprobante.tipo_comprobante}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {comprobante.glosa || "—"}
                      </TableCell>
                      <TableCell>
                        {comprobante.estado === "APROBADO" ? (
                          <Badge className="bg-green-100 text-green-800">Aprobado</Badge>
                        ) : (
                          <Badge variant="secondary">Borrador</Badge>
                        )}
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
  )
}


