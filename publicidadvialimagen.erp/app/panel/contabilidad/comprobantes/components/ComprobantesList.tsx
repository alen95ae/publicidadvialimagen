"use client"

import { useState, useEffect, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { api } from "@/lib/fetcher"
import type { Comprobante } from "@/lib/types/contabilidad"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

/** Normaliza texto para búsqueda: minúsculas y sin acentos/ñ, para que sea flexible e insensible a tildes. */
function normalizeForSearch(s: string | null | undefined): string {
  if (s == null || typeof s !== "string") return ""
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/ñ/g, "n")
}

const TIPOS_COMPROBANTE: string[] = [
  "Ingreso",
  "Egreso",
  "Diario",
  "Traspaso",
  "Ctas por Pagar",
  "Apertura",
]
/** Valor usado para "Todos" en Select (Radix no permite value=""). */
const ALL_VALUE = "__all__"

const ESTADOS: { value: string; label: string }[] = [
  { value: ALL_VALUE, label: "Estado" },
  { value: "BORRADOR", label: "Borrador" },
  { value: "APROBADO", label: "Aprobado" },
]

const PAGE_SIZE = 50

interface ComprobantesListProps {
  onSelect: (comprobante: Comprobante | null) => void
  selectedId?: number
}

export default function ComprobantesList({ onSelect, selectedId }: ComprobantesListProps) {
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterTipo, setFilterTipo] = useState(ALL_VALUE)
  const [filterEstado, setFilterEstado] = useState(ALL_VALUE)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchComprobantes()
  }, [])

  // Reset a página 1 cuando cambian búsqueda o filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterTipo, filterEstado])

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

  const filteredComprobantes = useMemo(() => {
    const normalizedSearch = normalizeForSearch(searchTerm)
    return comprobantes.filter((comp) => {
      if (normalizedSearch) {
        const matchNumero = normalizeForSearch(comp.numero ?? "").includes(normalizedSearch)
        const matchConcepto = normalizeForSearch(comp.concepto).includes(normalizedSearch)
        const matchBeneficiario = normalizeForSearch(comp.beneficiario).includes(normalizedSearch)
        if (!matchNumero && !matchConcepto && !matchBeneficiario) return false
      }
      if (filterTipo !== ALL_VALUE && comp.tipo_comprobante !== filterTipo) return false
      if (filterEstado !== ALL_VALUE && comp.estado !== filterEstado) return false
      return true
    })
  }, [comprobantes, searchTerm, filterTipo, filterEstado])

  const totalFiltered = filteredComprobantes.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE))
  const paginatedComprobantes = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredComprobantes.slice(start, start + PAGE_SIZE)
  }, [filteredComprobantes, currentPage])

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de Comprobantes</CardTitle>
        <CardDescription>Selecciona un comprobante para ver o editar</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Buscador + Filtros Tipo y Estado (estilo gestión de soportes) */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por número, concepto o beneficiario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>Tipo</SelectItem>
                {TIPOS_COMPROBANTE.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS.map((e) => (
                  <SelectItem key={e.value} value={e.value}>
                    {e.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                  <TableHead>Concepto</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedComprobantes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                      No hay comprobantes registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedComprobantes.map((comprobante) => (
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
                      <TableCell className="max-w-md">
                        {comprobante.concepto && String(comprobante.concepto).trim() !== "" ? (
                          <span className="block truncate" title={String(comprobante.concepto)}>
                            {String(comprobante.concepto)}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
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

        {/* Paginación (50 por página, mismo estilo que gestión de soportes) */}
        {!loading && totalFiltered > 0 && totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                Anterior
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                return (
                  <Button
                    key={pageNum}
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className={currentPage === pageNum ? "bg-[#D54644] text-white hover:bg-[#B73E3A]" : ""}
                  >
                    {pageNum}
                  </Button>
                )
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                Siguiente
              </Button>
            </div>
            <div className="text-sm text-gray-600">
              Mostrando {((currentPage - 1) * PAGE_SIZE) + 1} - {Math.min(currentPage * PAGE_SIZE, totalFiltered)} de {totalFiltered} comprobantes
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}



