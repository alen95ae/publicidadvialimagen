"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Search, Download, Edit, Trash2, X, Trash, RotateCcw, UserPlus } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { usePermisosContext } from "@/hooks/permisos-provider"
import { PermisoEliminar } from "@/components/permiso"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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
  created_at?: string
  updated_at?: string
}

interface LeadFilters {
  q: string
  sector: string
  interes: string
  origen: string
}

export default function LeadsPage() {
  const router = useRouter()
  const { puedeEliminar, puedeEditar } = usePermisosContext()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set())
  const [selectAllMode, setSelectAllMode] = useState<'none' | 'page' | 'all'>('none')
  const [allLeadIds, setAllLeadIds] = useState<string[]>([])
  const [editedLeads, setEditedLeads] = useState<Record<string, Partial<Lead>>>({})
  const [savingChanges, setSavingChanges] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })
  const [filters, setFilters] = useState<LeadFilters>({
    q: "",
    sector: "ALL",
    interes: "ALL",
    origen: "ALL"
  })
  const [searchQuery, setSearchQuery] = useState("") // Para debounce
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [formData, setFormData] = useState({
    nombre: "",
    empresa: "",
    email: "",
    telefono: "",
    ciudad: "",
    sector: "",
    interes: "",
    origen: ""
  })
  const [filtersLoaded, setFiltersLoaded] = useState(false)
  const [uniqueSectors, setUniqueSectors] = useState<string[]>([])
  const [uniqueIntereses, setUniqueIntereses] = useState<string[]>([])
  const [uniqueOrigenes, setUniqueOrigenes] = useState<string[]>([])

  // 1) Cargar los filtros una sola vez al montar
  useEffect(() => {
    const saved = sessionStorage.getItem("leads_filtros")
    
    if (saved) {
      try {
        const f = JSON.parse(saved)
        const qValue = f.q ?? ""
        setFilters({
          q: qValue,
          sector: f.sector ?? "ALL",
          interes: f.interes ?? "ALL",
          origen: f.origen ?? "ALL"
        })
        setSearchQuery(qValue)
      } catch (error) {
        console.error('❌ Error parseando filtros guardados:', error)
      }
    }
    
    // Garantizamos que SOLO ahora los filtros están listos
    setFiltersLoaded(true)
  }, [])

  // 2) Guardar los filtros cuando cambien
  useEffect(() => {
    if (!filtersLoaded) return
    
    sessionStorage.setItem("leads_filtros", JSON.stringify({
      q: searchQuery,
      sector: filters.sector,
      interes: filters.interes,
      origen: filters.origen
    }))
  }, [searchQuery, filters.sector, filters.interes, filters.origen, filtersLoaded])

  // 3) Cargar valores únicos de toda la BD para los filtros
  useEffect(() => {
    const loadUniqueValues = async () => {
      try {
        const [sectorsRes, interesesRes, origenesRes] = await Promise.all([
          fetch('/api/leads/unique-values?field=sector', { credentials: 'include' }),
          fetch('/api/leads/unique-values?field=interes', { credentials: 'include' }),
          fetch('/api/leads/unique-values?field=origen', { credentials: 'include' })
        ])

        if (sectorsRes.ok) {
          const data = await sectorsRes.json()
          setUniqueSectors(data.values || [])
        }
        if (interesesRes.ok) {
          const data = await interesesRes.json()
          setUniqueIntereses(data.values || [])
        }
        if (origenesRes.ok) {
          const data = await origenesRes.json()
          setUniqueOrigenes(data.values || [])
        }
      } catch (error) {
        console.error('Error cargando valores únicos:', error)
      }
    }
    loadUniqueValues()
  }, [])

  // 4) Debounce para la búsqueda
  useEffect(() => {
    if (!filtersLoaded) return
    
    const timer = setTimeout(() => setSearchQuery(filters.q), 300)
    return () => clearTimeout(timer)
  }, [filters.q, filtersLoaded])

  // 5) Cargar leads cuando cambien los filtros (después de que estén cargados)
  useEffect(() => {
    if (!filtersLoaded) return
    fetchLeads(1)
  }, [searchQuery, filters.sector, filters.interes, filters.origen, filtersLoaded])

  const fetchLeads = async (page: number = currentPage) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchQuery) params.append("q", searchQuery)
      if (filters.sector && filters.sector !== "ALL") params.append("sector", filters.sector)
      if (filters.interes && filters.interes !== "ALL") params.append("interes", filters.interes)
      if (filters.origen && filters.origen !== "ALL") params.append("origen", filters.origen)
      params.set('page', page.toString())
      params.set('limit', '100')

      const response = await fetch(`/api/leads?${params}`, {
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
        const errorText = await response.text()
        console.error('❌ Error response:', errorText)
        toast.error("Error al cargar los leads")
      }
    } catch (error) {
      console.error('❌ Error fetching leads:', error)
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  // Obtener todos los IDs de leads
  const fetchAllLeadIds = async () => {
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append("q", searchQuery)
      if (filters.sector && filters.sector !== "ALL") params.append("sector", filters.sector)
      if (filters.interes && filters.interes !== "ALL") params.append("interes", filters.interes)
      if (filters.origen && filters.origen !== "ALL") params.append("origen", filters.origen)

      const response = await fetch(`/api/leads/all-ids?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAllLeadIds(data.ids || [])
        return data.ids || []
      }
      return []
    } catch (error) {
      console.error('Error fetching all lead IDs:', error)
      return []
    }
  }

  // Paginación
  const handlePageChange = (page: number) => {
    fetchLeads(page)
    setSelectAllMode('none')
    setSelectedLeads(new Set())
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

  const handleExport = async () => {
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append("q", searchQuery)
      if (filters.sector && filters.sector !== "ALL") params.append("sector", filters.sector)
      if (filters.interes && filters.interes !== "ALL") params.append("interes", filters.interes)
      if (filters.origen && filters.origen !== "ALL") params.append("origen", filters.origen)

      const response = await fetch(`/api/leads/export?${params}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `leads_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success("Exportación completada")
      } else {
        toast.error("Error al exportar")
      }
    } catch (error) {
      toast.error("Error de conexión")
    }
  }

  const handleExportSelected = async () => {
    if (selectedLeads.size === 0) return
    
    try {
      const ids = Array.from(selectedLeads).join(',')
      const response = await fetch(`/api/leads/export?ids=${encodeURIComponent(ids)}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `leads_seleccionados_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success(`${selectedLeads.size} lead(s) exportado(s)`)
      } else {
        toast.error("Error al exportar selección")
      }
    } catch (error) {
      toast.error("Error de conexión")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este lead?")) return

    try {
      const response = await fetch(`/api/leads/${id}`, { 
        method: "DELETE",
        credentials: 'include'
      })
      if (response.ok) {
        fetchLeads()
        toast.success("Lead eliminado correctamente")
      } else {
        toast.error("Error al eliminar el lead")
      }
    } catch (error) {
      toast.error("Error de conexión")
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedLeads.size === 0) return

    try {
      const count = selectedLeads.size
      const promises = Array.from(selectedLeads).map(id =>
        fetch(`/api/leads/${id}`, { 
          method: "DELETE",
          credentials: 'include'
        })
      )

      await Promise.all(promises)
      setSelectedLeads(new Set())
      setSelectAllMode('none')
      fetchLeads()
      toast.success(`${count} lead(s) eliminado(s)`)
    } catch (error) {
      toast.error("Error al eliminar leads")
    }
  }

  // Edición inline: actualizar campo de un lead
  const handleFieldChange = (leadId: string, field: keyof Lead, value: any) => {
    setEditedLeads(prev => ({
      ...prev,
      [leadId]: {
        ...prev[leadId],
        [field]: value
      }
    }))
  }

  // Guardar cambios editados
  const handleSaveChanges = async () => {
    if (Object.keys(editedLeads).length === 0) return

    setSavingChanges(true)
    try {
      const count = Object.keys(editedLeads).length
      const promises = Object.entries(editedLeads).map(([id, changes]) =>
        fetch(`/api/leads/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: 'include',
          body: JSON.stringify(changes)
        })
      )

      await Promise.all(promises)
      setEditedLeads({})
      setSelectAllMode('none')
      setSelectedLeads(new Set())
      fetchLeads()
      toast.success(`${count} lead(s) actualizado(s)`)
    } catch (error) {
      toast.error("Error al guardar cambios")
    } finally {
      setSavingChanges(false)
    }
  }

  // Descartar cambios
  const handleDiscardChanges = () => {
    setEditedLeads({})
    toast.info("Cambios descartados")
  }

  // Aplicar cambio masivo a seleccionados
  const handleBulkFieldChange = (field: keyof Lead, value: any) => {
    const updates: Record<string, Partial<Lead>> = {}
    selectedLeads.forEach(id => {
      updates[id] = {
        ...(editedLeads[id] || {}),
        [field]: value
      }
    })
    setEditedLeads(prev => ({ ...prev, ...updates }))
    toast.info(`Campo ${field} actualizado para ${selectedLeads.size} lead(s)`)
  }

  // Convertir leads seleccionados a contactos
  const handleConvertToContact = async () => {
    if (selectedLeads.size === 0) return

    const count = selectedLeads.size
    const confirmMessage = `¿Estás seguro de convertir ${count} lead(s) en contacto(s)?`
    if (!confirm(confirmMessage)) return

    try {
      const leadIds = Array.from(selectedLeads)
      const response = await fetch('/api/leads/convert-to-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ leadIds })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`${result.count || count} lead(s) convertido(s) a contacto(s)`)
        setSelectedLeads(new Set())
        setSelectAllMode('none')
        fetchLeads()
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al convertir leads")
      }
    } catch (error) {
      console.error('Error al convertir leads:', error)
      toast.error("Error de conexión")
    }
  }

  // Matar leads seleccionados
  const handleKillLeads = async () => {
    if (selectedLeads.size === 0) return

    const count = selectedLeads.size
    const confirmMessage = `¿Estás seguro de matar ${count} lead(s)? Los leads se moverán a la papelera.`
    if (!confirm(confirmMessage)) return

    try {
      const leadIds = Array.from(selectedLeads)
      const response = await fetch('/api/leads/kill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ leadIds })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`${result.count || count} lead(s) movido(s) a la papelera`)
        setSelectedLeads(new Set())
        setSelectAllMode('none')
        fetchLeads()
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al matar leads")
      }
    } catch (error) {
      console.error('Error al matar leads:', error)
      toast.error("Error de conexión")
    }
  }

  // Crear nuevo lead
  const handleCreate = () => {
    setFormData({
      nombre: "",
      empresa: "",
      email: "",
      telefono: "",
      ciudad: "",
      sector: "",
      interes: "",
      origen: ""
    })
    setShowCreateModal(true)
  }

  const handleSubmitCreate = async () => {
    if (!formData.nombre.trim()) {
      toast.error("El nombre es requerido")
      return
    }

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success("Lead creado correctamente")
        setShowCreateModal(false)
        fetchLeads()
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al crear el lead")
      }
    } catch (error) {
      toast.error("Error de conexión")
    }
  }

  // Editar lead
  const handleEdit = (lead: Lead) => {
    setEditingLead(lead)
    setFormData({
      nombre: lead.nombre || "",
      empresa: lead.empresa || "",
      email: lead.email || "",
      telefono: lead.telefono || "",
      ciudad: lead.ciudad || "",
      sector: lead.sector || "",
      interes: lead.interes || "",
      origen: lead.origen || ""
    })
    setShowEditModal(true)
  }

  const handleSubmitEdit = async () => {
    if (!editingLead || !formData.nombre.trim()) {
      toast.error("El nombre es requerido")
      return
    }

    try {
      const response = await fetch(`/api/leads/${editingLead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success("Lead actualizado correctamente")
        setShowEditModal(false)
        setEditingLead(null)
        fetchLeads()
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al actualizar el lead")
      }
    } catch (error) {
      toast.error("Error de conexión")
    }
  }


  return (
    <div className="p-6">
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Gestión de Leads</h1>
          <p className="text-gray-600">Administra tu base de datos de leads comerciales</p>
        </div>

        {/* Barra superior sticky */}
        <div className="sticky top-0 z-10 bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
          {/* Etiquetas de filtros activos */}
          {(searchQuery || filters.sector !== "ALL" || filters.interes !== "ALL" || filters.origen !== "ALL") && (
            <div className="flex flex-wrap gap-2 items-center mb-4 pb-4 border-b">
              {searchQuery && (
                <div className="flex items-center gap-1 bg-blue-100 hover:bg-blue-200 rounded-full px-3 py-1 text-sm">
                  <span className="font-medium">Búsqueda:</span>
                  <span className="text-gray-700">{searchQuery}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setFilters(prev => ({ ...prev, q: "" }))
                      setSearchQuery("")
                    }}
                    className="ml-1 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              
              {filters.sector !== "ALL" && (
                <div className="flex items-center gap-1 bg-green-100 hover:bg-green-200 rounded-full px-3 py-1 text-sm">
                  <span className="font-medium">Sector:</span>
                  <span className="text-gray-700">{filters.sector}</span>
                  <button
                    type="button"
                    onClick={() => setFilters(prev => ({ ...prev, sector: "ALL" }))}
                    className="ml-1 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              
              {filters.interes !== "ALL" && (
                <div className="flex items-center gap-1 bg-purple-100 hover:bg-purple-200 rounded-full px-3 py-1 text-sm">
                  <span className="font-medium">Interés:</span>
                  <span className="text-gray-700">{filters.interes}</span>
                  <button
                    type="button"
                    onClick={() => setFilters(prev => ({ ...prev, interes: "ALL" }))}
                    className="ml-1 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              
              {filters.origen !== "ALL" && (
                <div className="flex items-center gap-1 bg-amber-100 hover:bg-amber-200 rounded-full px-3 py-1 text-sm">
                  <span className="font-medium">Origen:</span>
                  <span className="text-gray-700">{filters.origen}</span>
                  <button
                    type="button"
                    onClick={() => setFilters(prev => ({ ...prev, origen: "ALL" }))}
                    className="ml-1 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              
              {/* Botón para limpiar todos */}
              <button
                type="button"
                onClick={() => {
                  setFilters({
                    q: "",
                    sector: "ALL",
                    interes: "ALL",
                    origen: "ALL"
                  })
                  setSearchQuery("")
                  sessionStorage.removeItem('leads_filtros')
                }}
                className="text-sm text-gray-500 hover:text-gray-700 underline ml-2"
              >
                Limpiar todo
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-3 items-center">
            {/* Búsqueda - Izquierda */}
            <div className="flex-1 min-w-[200px] max-w-md">
              <Input
                placeholder="Buscar leads..."
                value={filters.q}
                onChange={(e) => setFilters(prev => ({ ...prev, q: e.target.value }))}
                className="w-full"
              />
            </div>

            {/* Filtro Sector */}
            <Select value={filters.sector} onValueChange={(value) => setFilters(prev => ({ ...prev, sector: value }))}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Sector" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Sector</SelectItem>
                {uniqueSectors.map(sector => (
                  <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro Interés */}
            <Select value={filters.interes} onValueChange={(value) => setFilters(prev => ({ ...prev, interes: value }))}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Interés" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Interés</SelectItem>
                {uniqueIntereses.map(interes => (
                  <SelectItem key={interes} value={interes}>{interes}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro Origen */}
            <Select value={filters.origen} onValueChange={(value) => setFilters(prev => ({ ...prev, origen: value }))}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Origen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Origen</SelectItem>
                {uniqueOrigenes.map(origen => (
                  <SelectItem key={origen} value={origen}>{origen}</SelectItem>
                ))}
              </SelectContent>
            </Select>


            {/* Espacio flexible */}
            <div className="flex-1"></div>

            {/* Botones - Derecha */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => router.push('/panel/contactos/leads/papelera')}
              >
                <Trash className="w-4 h-4 mr-2" />
                Papelera
              </Button>
              <Button variant="outline" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
              <Button className="bg-[#D54644] hover:bg-[#B03A38]" onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo
              </Button>
            </div>
          </div>

          {/* Acciones masivas */}
          {selectedLeads.size > 0 && puedeEditar("contactos") && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-blue-800">
                    {selectAllMode === 'all' 
                      ? `${allLeadIds.length} lead(s) seleccionado(s) (todos)` 
                      : `${selectedLeads.size} lead(s) seleccionado(s)`
                    }
                  </span>
                  <Select onValueChange={(value) => handleBulkFieldChange('origen', value)}>
                    <SelectTrigger className="h-8 w-40">
                      <SelectValue placeholder="Origen" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueOrigenes.map(origen => (
                        <SelectItem key={origen} value={origen}>{origen}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  {Object.keys(editedLeads).length > 0 && (
                    <>
                      <Button 
                        size="sm" 
                        onClick={handleSaveChanges}
                        disabled={savingChanges}
                        className="bg-[#D54644] hover:bg-[#B73E3A] text-white"
                      >
                        {savingChanges ? "Guardando..." : `Guardar cambios (${Object.keys(editedLeads).length})`}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleDiscardChanges}
                      >
                        Descartar
                      </Button>
                    </>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleExportSelected}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar selección
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleConvertToContact}
                    className="border-green-500 text-green-700 hover:bg-green-50"
                  >
                    <UserPlus className="w-4 h-4 mr-1" />
                    Convertir en contacto
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleKillLeads}
                    className="border-orange-500 text-orange-700 hover:bg-orange-50"
                  >
                    <Trash className="w-4 h-4 mr-1" />
                    Matar lead
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
                          <AlertDialogTitle>¿Eliminar leads?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción eliminará {selectedLeads.size} lead(s) seleccionado(s).
                            Esta acción no se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteSelected} className="bg-red-600 hover:bg-red-700">
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </PermisoEliminar>
                </div>
              </div>
            </div>
          )}

          {/* Banner de selección total */}
          {leads.length > 0 && 
           leads.every(l => selectedLeads.has(l.id)) && 
           selectAllMode !== 'all' &&
           allLeadIds.length > leads.length && (
            <div className="mt-2 p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-cyan-900">
                  Los {leads.length} leads de esta página están seleccionados.
                </span>
                <Button
                  variant="link"
                  size="sm"
                  className="text-cyan-700 hover:text-cyan-900 underline font-semibold"
                  onClick={() => {
                    setSelectedLeads(new Set(allLeadIds))
                    setSelectAllMode('all')
                    toast.success(`${allLeadIds.length} leads seleccionados`)
                  }}
                >
                  Seleccionar los {allLeadIds.length} leads
                </Button>
              </div>
            </div>
          )}

          {selectAllMode === 'all' && (
            <div className="mt-2 p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-cyan-900">
                  Los {allLeadIds.length} leads están seleccionados.
                </span>
                <Button
                  variant="link"
                  size="sm"
                  className="text-cyan-700 hover:text-cyan-900 underline"
                  onClick={() => {
                    setSelectedLeads(new Set())
                    setSelectAllMode('none')
                  }}
                >
                  Limpiar selección
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Tabla de leads */}
        <div className="mb-3 text-sm text-slate-700">
          Leads ({pagination.total || leads.length})
        </div>
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Cargando...</div>
            ) : leads.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  {searchQuery || filters.sector !== "ALL" || filters.interes !== "ALL" || filters.origen !== "ALL" ? (
                    "No se encontraron leads con los filtros aplicados"
                  ) : (
                    "No hay leads registrados"
                  )}
                </div>
                <Button className="bg-[#D54644] hover:bg-[#B03A38]" onClick={handleCreate}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear primer lead
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    {puedeEditar("contactos") ? (
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          leads.length > 0 && 
                          leads.every(l => selectedLeads.has(l.id))
                        }
                        onCheckedChange={async (checked) => {
                          if (checked) {
                            const pageIds = new Set(leads.map(l => l.id))
                            setSelectedLeads(pageIds)
                            setSelectAllMode('page')
                            await fetchAllLeadIds()
                          } else {
                            setSelectedLeads(new Set())
                            setSelectAllMode('none')
                          }
                        }}
                      />
                    </TableHead>
                    ) : null}
                    <TableHead>Nombre</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead>Interés</TableHead>
                    <TableHead>Origen</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                      <TableRow key={lead.id} className="hover:bg-gray-50">
                        {puedeEditar("contactos") ? (
                        <TableCell>
                          <Checkbox
                            checked={selectedLeads.has(lead.id)}
                            onCheckedChange={(checked) => {
                              const newSelected = new Set(selectedLeads)
                              if (checked) {
                                newSelected.add(lead.id)
                              } else {
                                newSelected.delete(lead.id)
                                if (selectAllMode === 'all') {
                                  setSelectAllMode('page')
                                }
                              }
                              setSelectedLeads(newSelected)
                            }}
                          />
                        </TableCell>
                        ) : null}
                        <TableCell>
                          {selectedLeads.has(lead.id) && puedeEditar("contactos") ? (
                            <Input
                              value={editedLeads[lead.id]?.nombre ?? lead.nombre}
                              onChange={(e) => handleFieldChange(lead.id, 'nombre', e.target.value)}
                              className="h-8"
                            />
                          ) : (
                            lead.nombre && lead.nombre.length > 35 ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger className="text-left">
                                    <div className="font-medium">{lead.nombre.slice(0, 35) + '…'}</div>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-sm">{lead.nombre}</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              <div className="font-medium">{lead.nombre || "-"}</div>
                            )
                          )}
                        </TableCell>
                        <TableCell>
                          {selectedLeads.has(lead.id) && puedeEditar("contactos") ? (
                            <Input
                              value={editedLeads[lead.id]?.empresa ?? lead.empresa ?? ''}
                              onChange={(e) => handleFieldChange(lead.id, 'empresa', e.target.value)}
                              className="h-8"
                            />
                          ) : (
                            lead.empresa || "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {selectedLeads.has(lead.id) && puedeEditar("contactos") ? (
                            <Input
                              value={editedLeads[lead.id]?.email ?? lead.email ?? ''}
                              onChange={(e) => handleFieldChange(lead.id, 'email', e.target.value)}
                              className="h-8"
                            />
                          ) : (
                            lead.email || "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {selectedLeads.has(lead.id) && puedeEditar("contactos") ? (
                            <Input
                              value={editedLeads[lead.id]?.telefono ?? lead.telefono ?? ''}
                              onChange={(e) => handleFieldChange(lead.id, 'telefono', e.target.value)}
                              className="h-8"
                            />
                          ) : (
                            lead.telefono || "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {selectedLeads.has(lead.id) && puedeEditar("contactos") ? (
                            <Input
                              value={editedLeads[lead.id]?.sector ?? lead.sector ?? ''}
                              onChange={(e) => handleFieldChange(lead.id, 'sector', e.target.value)}
                              className="h-8"
                            />
                          ) : (
                            lead.sector || "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {selectedLeads.has(lead.id) && puedeEditar("contactos") ? (
                            <Input
                              value={editedLeads[lead.id]?.interes ?? lead.interes ?? ''}
                              onChange={(e) => handleFieldChange(lead.id, 'interes', e.target.value)}
                              className="h-8"
                            />
                          ) : (
                            lead.interes || "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {selectedLeads.has(lead.id) && puedeEditar("contactos") ? (
                            <Input
                              value={editedLeads[lead.id]?.origen ?? lead.origen ?? ''}
                              onChange={(e) => handleFieldChange(lead.id, 'origen', e.target.value)}
                              className="h-8"
                            />
                          ) : (
                            lead.origen || "-"
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {puedeEditar("contactos") && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(lead)}
                              title="Editar lead"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            )}
                            <PermisoEliminar modulo="contactos">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(lead.id)}
                                title="Eliminar lead"
                                className="text-red-600 hover:text-red-700 hover:border-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
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
          <div className="flex justify-center mt-8">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleFirstPage}
                disabled={loading || currentPage === 1}
              >
                Primera
              </Button>

              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    disabled={loading}
                    className={currentPage === pageNum ? "bg-[#D54644] text-white hover:bg-[#B73E3A]" : ""}
                  >
                    {pageNum}
                  </Button>
                );
              })}

              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLastPage}
                disabled={loading || currentPage === pagination.totalPages}
              >
                Última
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Modal Crear Lead */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Lead</DialogTitle>
            <DialogDescription>
              Completa los datos del nuevo lead. El nombre es obligatorio.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                placeholder="Nombre completo"
                required
              />
            </div>
            <div>
              <Label htmlFor="empresa">Empresa</Label>
              <Input
                id="empresa"
                value={formData.empresa}
                onChange={(e) => setFormData(prev => ({ ...prev, empresa: e.target.value }))}
                placeholder="Nombre de la empresa"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@ejemplo.com"
              />
            </div>
            <div>
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={formData.telefono}
                onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                placeholder="Teléfono"
              />
            </div>
            <div>
              <Label htmlFor="ciudad">Ciudad</Label>
              <Input
                id="ciudad"
                value={formData.ciudad}
                onChange={(e) => setFormData(prev => ({ ...prev, ciudad: e.target.value }))}
                placeholder="Ciudad"
              />
            </div>
            <div>
              <Label htmlFor="sector">Sector</Label>
              <Input
                id="sector"
                value={formData.sector}
                onChange={(e) => setFormData(prev => ({ ...prev, sector: e.target.value }))}
                placeholder="Sector"
              />
            </div>
            <div>
              <Label htmlFor="interes">Interés</Label>
              <Input
                id="interes"
                value={formData.interes}
                onChange={(e) => setFormData(prev => ({ ...prev, interes: e.target.value }))}
                placeholder="Interés"
              />
            </div>
            <div>
              <Label htmlFor="origen">Origen</Label>
              <Input
                id="origen"
                value={formData.origen}
                onChange={(e) => setFormData(prev => ({ ...prev, origen: e.target.value }))}
                placeholder="Origen"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitCreate} className="bg-[#D54644] hover:bg-[#B03A38]">
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Lead */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Lead</DialogTitle>
            <DialogDescription>
              Modifica los datos del lead. El nombre es obligatorio.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-nombre">Nombre *</Label>
              <Input
                id="edit-nombre"
                value={formData.nombre}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                placeholder="Nombre completo"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-empresa">Empresa</Label>
              <Input
                id="edit-empresa"
                value={formData.empresa}
                onChange={(e) => setFormData(prev => ({ ...prev, empresa: e.target.value }))}
                placeholder="Nombre de la empresa"
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@ejemplo.com"
              />
            </div>
            <div>
              <Label htmlFor="edit-telefono">Teléfono</Label>
              <Input
                id="edit-telefono"
                value={formData.telefono}
                onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                placeholder="Teléfono"
              />
            </div>
            <div>
              <Label htmlFor="edit-ciudad">Ciudad</Label>
              <Input
                id="edit-ciudad"
                value={formData.ciudad}
                onChange={(e) => setFormData(prev => ({ ...prev, ciudad: e.target.value }))}
                placeholder="Ciudad"
              />
            </div>
            <div>
              <Label htmlFor="edit-sector">Sector</Label>
              <Input
                id="edit-sector"
                value={formData.sector}
                onChange={(e) => setFormData(prev => ({ ...prev, sector: e.target.value }))}
                placeholder="Sector"
              />
            </div>
            <div>
              <Label htmlFor="edit-interes">Interés</Label>
              <Input
                id="edit-interes"
                value={formData.interes}
                onChange={(e) => setFormData(prev => ({ ...prev, interes: e.target.value }))}
                placeholder="Interés"
              />
            </div>
            <div>
              <Label htmlFor="edit-origen">Origen</Label>
              <Input
                id="edit-origen"
                value={formData.origen}
                onChange={(e) => setFormData(prev => ({ ...prev, origen: e.target.value }))}
                placeholder="Origen"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowEditModal(false)
              setEditingLead(null)
            }}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitEdit} className="bg-[#D54644] hover:bg-[#B03A38]">
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

