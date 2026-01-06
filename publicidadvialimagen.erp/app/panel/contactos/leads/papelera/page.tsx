"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { RotateCcw, Trash2, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { usePermisosContext } from "@/hooks/permisos-provider"
import { PermisoEliminar } from "@/components/permiso"

interface Lead {
  id: string
  nombre: string
  empresa?: string
  email?: string
  telefono?: string
  ciudad?: string
  sector?: string
  interes?: string
  origen?: string
  deleted_at?: string
  created_at?: string
  updated_at?: string
}

export default function PapeleraLeadsPage() {
  const router = useRouter()
  const { puedeEliminar } = usePermisosContext()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeads(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    fetchLeads(currentPage)
  }, [currentPage])

  const fetchLeads = async (page: number = currentPage) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchQuery) params.append("q", searchQuery)
      params.set('page', page.toString())
      params.set('limit', '100')
      params.set('includeDeleted', 'true')

      const response = await fetch(`/api/leads/papelera?${params}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setLeads(data.data || [])
        if (data.pagination) {
          setPagination(data.pagination)
          setCurrentPage(data.pagination.page)
        }
      } else {
        toast.error("Error al cargar los leads")
      }
    } catch (error) {
      console.error('Error fetching leads:', error)
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    fetchLeads(page)
  }

  const handleFirstPage = () => {
    if (currentPage !== 1) {
      handlePageChange(1)
    }
  }

  const handleLastPage = () => {
    if (pagination.totalPages > 0 && currentPage !== pagination.totalPages) {
      handlePageChange(pagination.totalPages)
    }
  }

  const handleRestore = async (id: string) => {
    try {
      const response = await fetch('/api/leads/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ leadIds: [id] })
      })

      if (response.ok) {
        toast.success("Lead restaurado correctamente")
        fetchLeads(currentPage)
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al restaurar el lead")
      }
    } catch (error) {
      console.error('Error al restaurar lead:', error)
      toast.error("Error de conexión")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/leads/${id}`, { 
        method: "DELETE",
        credentials: 'include'
      })
      if (response.ok) {
        fetchLeads(currentPage)
        toast.success("Lead eliminado correctamente")
      } else {
        toast.error("Error al eliminar el lead")
      }
    } catch (error) {
      toast.error("Error de conexión")
    }
  }

  return (
    <div className="p-6">
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/panel/contactos/leads')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <h1 className="text-3xl font-bold text-slate-800">Papelera de Leads</h1>
          </div>
          <p className="text-gray-600">Leads eliminados (matados)</p>
        </div>

        {/* Barra superior sticky */}
        <div className="sticky top-0 z-10 bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Búsqueda */}
            <div className="flex-1 min-w-[200px] max-w-md">
              <Input
                placeholder="Buscar leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Tabla de leads */}
        <div className="mb-3 text-sm text-slate-700">
          Leads eliminados ({pagination.total || leads.length})
        </div>
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Cargando...</div>
            ) : leads.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  {searchQuery ? (
                    "No se encontraron leads con la búsqueda aplicada"
                  ) : (
                    "No hay leads en la papelera"
                  )}
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Ciudad</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead>Interés</TableHead>
                    <TableHead>Origen</TableHead>
                    <TableHead>Eliminado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{lead.nombre}</TableCell>
                      <TableCell>{lead.empresa || '-'}</TableCell>
                      <TableCell>{lead.email || '-'}</TableCell>
                      <TableCell>{lead.telefono || '-'}</TableCell>
                      <TableCell>{lead.ciudad || '-'}</TableCell>
                      <TableCell>{lead.sector || '-'}</TableCell>
                      <TableCell>{lead.interes || '-'}</TableCell>
                      <TableCell>{lead.origen || '-'}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {lead.deleted_at ? new Date(lead.deleted_at).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRestore(lead.id)}
                            className="border-green-500 text-green-700 hover:bg-green-50"
                          >
                            <RotateCcw className="w-4 h-4 mr-1" />
                            Restaurar
                          </Button>
                          <PermisoEliminar modulo="contactos">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" className="bg-[#D54644] hover:bg-[#B73E3A] text-white">
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Eliminar
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar lead permanentemente?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción eliminará permanentemente el lead "{lead.nombre}".
                                    Esta acción no se puede deshacer.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(lead.id)} className="bg-red-600 hover:bg-red-700">
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </PermisoEliminar>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Paginación */}
        {pagination.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Página {pagination.page} de {pagination.totalPages} ({pagination.total} leads)
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleFirstPage}
                disabled={!pagination.hasPrev}
              >
                Primera
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!pagination.hasPrev}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!pagination.hasNext}
              >
                Siguiente
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLastPage}
                disabled={!pagination.hasNext}
              >
                Última
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

