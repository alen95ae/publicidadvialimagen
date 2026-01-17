"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Search, Filter, Download, Building2, User, Edit, Trash2, Users, Merge, AlertTriangle, X } from "lucide-react"
import { toast } from "sonner"
import { usePermisosContext } from "@/hooks/permisos-provider"
import { PermisoEliminar } from "@/components/permiso"

interface Contact {
  id: string
  displayName: string
  legalName?: string
  taxId?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  postalCode?: string
  country?: string
  relation: string
  status: string
  notes?: string
  salesOwnerId?: string | null
  createdAt?: string
  updatedAt?: string
  kind?: string
}

interface ContactFilters {
  q: string
  relation: string
  kind: string
}

export default function ContactosPage() {
  const { tieneFuncionTecnica, puedeEliminar, puedeEditar, esAdmin } = usePermisosContext()
  const router = useRouter()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
  const [selectAllMode, setSelectAllMode] = useState<'none' | 'page' | 'all'>('none')
  const [allContactIds, setAllContactIds] = useState<string[]>([])
  const [editedContacts, setEditedContacts] = useState<Record<string, Partial<Contact>>>({})
  const [savingChanges, setSavingChanges] = useState(false)
  const [duplicates, setDuplicates] = useState<any[]>([])
  const [showDuplicates, setShowDuplicates] = useState(false)
  const [duplicatesLoading, setDuplicatesLoading] = useState(false)
  const [selectedPrimary, setSelectedPrimary] = useState<Record<number, string>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [salesOwners, setSalesOwners] = useState<Record<string, string>>({})
  const [salesOwnersData, setSalesOwnersData] = useState<Record<string, any>>({})
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })
  const [filters, setFilters] = useState<ContactFilters>({
    q: "",
    relation: "ALL",
    kind: "ALL"
  })
  const [filtersLoaded, setFiltersLoaded] = useState(false)

  // 1) Cargar los filtros una sola vez al montar
  useEffect(() => {
    const saved = sessionStorage.getItem("contactos_filtros")
    
    if (saved) {
      try {
        const f = JSON.parse(saved)
        setFilters({
          q: f.q ?? "",
          relation: f.relation ?? "ALL",
          kind: f.kind ?? "ALL"
        })
      } catch (error) {
        console.error('❌ Error parseando filtros guardados:', error)
      }
    }
    
    setFiltersLoaded(true)
  }, [])

  // 2) Guardar los filtros cuando cambien
  useEffect(() => {
    if (!filtersLoaded) return
    
    sessionStorage.setItem("contactos_filtros", JSON.stringify({
      q: filters.q,
      relation: filters.relation,
      kind: filters.kind
    }))
  }, [filters, filtersLoaded])

  // Función para eliminar un filtro específico
  const eliminarFiltro = (tipo: 'busqueda' | 'relacion' | 'tipo') => {
    switch (tipo) {
      case 'busqueda':
        setFilters(prev => ({ ...prev, q: "" }))
        break
      case 'relacion':
        setFilters(prev => ({ ...prev, relation: "ALL" }))
        break
      case 'tipo':
        setFilters(prev => ({ ...prev, kind: "ALL" }))
        break
    }
  }

  // Función para limpiar todos los filtros
  const limpiarTodosFiltros = () => {
    setFilters({
      q: "",
      relation: "ALL",
      kind: "ALL"
    })
    sessionStorage.removeItem('contactos_filtros')
  }

  useEffect(() => {
    if (filtersLoaded) {
      fetchContacts(1)
      fetchSalesOwners()
    }
  }, [filters, filtersLoaded])

  const fetchSalesOwners = async () => {
    try {
      const response = await fetch("/api/public/comerciales")
      if (response.ok) {
        const data = await response.json()
        const users = data.users || []
        // El endpoint ya filtra solo vendedores, no necesitamos filtrar de nuevo
        const ownersMap: Record<string, string> = {}
        const ownersDataMap: Record<string, any> = {}
        users.forEach((user: any) => {
          ownersMap[user.id] = user.nombre || user.name || ""
          ownersDataMap[user.id] = user
        })
        setSalesOwners(ownersMap)
        setSalesOwnersData(ownersDataMap)
      }
    } catch (error) {
      console.error("Error fetching sales owners:", error)
    }
  }

  const getSalesOwnerImage = (ownerId: string) => {
    const owner = salesOwnersData[ownerId];
    if (owner?.imagen_usuario) {
      const imagenData = typeof owner.imagen_usuario === 'string' 
        ? JSON.parse(owner.imagen_usuario) 
        : owner.imagen_usuario;
      return imagenData?.url || null;
    }
    return null;
  }

  const fetchContacts = async (page: number = currentPage) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.q) params.append("q", filters.q)
      if (filters.relation && filters.relation !== "ALL") params.append("relation", filters.relation)
      if (filters.kind && filters.kind !== "ALL") params.append("kind", filters.kind)
      params.set('page', page.toString())
      params.set('limit', '100')

      const response = await fetch(`/api/contactos?${params}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setContacts(data.data || [])
        if (data.pagination) {
          setPagination(data.pagination)
          setCurrentPage(data.pagination.page)
        }
      } else {
        const errorText = await response.text()
        console.error('❌ Error response:', errorText)
        toast.error("Error al cargar los contactos")
      }
    } catch (error) {
      console.error('❌ Error fetching contacts:', error)
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  // Obtener todos los IDs de contactos
  const fetchAllContactIds = async () => {
    try {
      const params = new URLSearchParams()
      if (filters.q) params.append("q", filters.q)
      if (filters.relation && filters.relation !== "ALL") params.append("relation", filters.relation)
      if (filters.kind && filters.kind !== "ALL") params.append("kind", filters.kind)
      params.set('allIds', 'true')

      const response = await fetch(`/api/contactos/all-ids?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAllContactIds(data.ids || [])
        return data.ids || []
      }
      return []
    } catch (error) {
      console.error('Error fetching all contact IDs:', error)
      return []
    }
  }

  // Paginación
  const handlePageChange = (page: number) => {
    fetchContacts(page)
    setSelectAllMode('none')
    setSelectedContacts(new Set())
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
      // Exportar TODOS los contactos sin filtros
      const response = await fetch(`/api/contactos/export`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `contactos_todos_${new Date().toISOString().split('T')[0]}.csv`
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
    if (selectedContacts.size === 0) return
    
    try {
      const ids = Array.from(selectedContacts).join(',')
      const response = await fetch(`/api/contactos/export?ids=${encodeURIComponent(ids)}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `contactos_seleccionados_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success(`${selectedContacts.size} contacto(s) exportado(s)`)
      } else {
        toast.error("Error al exportar selección")
      }
    } catch (error) {
      toast.error("Error de conexión")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este contacto?")) return

    try {
      const response = await fetch(`/api/contactos/${id}`, { method: "DELETE" })
      if (response.ok) {
        fetchContacts()
        toast.success("Contacto eliminado correctamente")
      } else {
        toast.error("Error al eliminar el contacto")
      }
    } catch (error) {
      toast.error("Error de conexión")
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedContacts.size === 0) return

    try {
      const count = selectedContacts.size
      const promises = Array.from(selectedContacts).map(id =>
        fetch(`/api/contactos/${id}`, { method: "DELETE" })
      )

      await Promise.all(promises)
      setSelectedContacts(new Set())
      setSelectAllMode('none')
      fetchContacts()
      toast.success(`${count} contacto(s) eliminado(s)`)
    } catch (error) {
      toast.error("Error al eliminar contactos")
    }
  }

  const handleBulkRelationChange = async (relation: string) => {
    if (selectedContacts.size === 0) return

    try {
      const count = selectedContacts.size
      const promises = Array.from(selectedContacts).map(id =>
        fetch(`/api/contactos/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ relation })
        })
      )

      await Promise.all(promises)
      setSelectedContacts(new Set())
      setSelectAllMode('none')
      fetchContacts()
      toast.success(`Relación actualizada para ${count} contacto(s)`)
    } catch (error) {
      toast.error("Error al actualizar relaciones")
    }
  }

  const handleBulkSalesOwnerChange = async (salesOwnerId: string) => {
    if (selectedContacts.size === 0) return

    try {
      const count = selectedContacts.size
      const value = salesOwnerId === "none" ? null : salesOwnerId
      const promises = Array.from(selectedContacts).map(id =>
        fetch(`/api/contactos/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ salesOwnerId: value })
        })
      )

      await Promise.all(promises)
      setSelectedContacts(new Set())
      setSelectAllMode('none')
      fetchContacts()
      toast.success(`Comercial actualizado para ${count} contacto(s)`)
    } catch (error) {
      toast.error("Error al actualizar comerciales")
    }
  }

  // Edición inline: actualizar campo de un contacto
  const handleFieldChange = (contactId: string, field: keyof Contact, value: any) => {
    setEditedContacts(prev => ({
      ...prev,
      [contactId]: {
        ...prev[contactId],
        [field]: value
      }
    }))
  }

  // Guardar cambios editados
  const handleSaveChanges = async () => {
    if (Object.keys(editedContacts).length === 0) return

    setSavingChanges(true)
    try {
      const count = Object.keys(editedContacts).length
      const promises = Object.entries(editedContacts).map(([id, changes]) =>
        fetch(`/api/contactos/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(changes)
        })
      )

      await Promise.all(promises)
      setEditedContacts({})
      setSelectAllMode('none')
      setSelectedContacts(new Set())
      fetchContacts()
      toast.success(`${count} contacto(s) actualizado(s)`)
    } catch (error) {
      toast.error("Error al guardar cambios")
    } finally {
      setSavingChanges(false)
    }
  }

  // Descartar cambios
  const handleDiscardChanges = () => {
    setEditedContacts({})
    toast.info("Cambios descartados")
  }

  // Aplicar cambio masivo a seleccionados
  const handleBulkFieldChange = (field: keyof Contact, value: any) => {
    const updates: Record<string, Partial<Contact>> = {}
    selectedContacts.forEach(id => {
      updates[id] = {
        ...(editedContacts[id] || {}),
        [field]: value
      }
    })
    setEditedContacts(prev => ({ ...prev, ...updates }))
    toast.info(`Campo ${field} actualizado para ${selectedContacts.size} contacto(s)`)
  }


  // Duplicados: detectar
  const detectDuplicates = async () => {
    setDuplicatesLoading(true)
    try {
      const response = await fetch('/api/contactos/duplicates')
      if (!response.ok) {
        toast.error('Error al detectar duplicados')
        return
      }
      const data = await response.json()
      setDuplicates(data.duplicates || [])
      const mapping: Record<number, string> = {}
      ;(data.duplicates || []).forEach((g: any, i: number) => { mapping[i] = g.primary?.id })
      setSelectedPrimary(mapping)
      setShowDuplicates(true)
      toast.success(`Se encontraron ${data.duplicates?.length || 0} grupos de duplicados`)
    } catch (e) {
      toast.error('Error de conexión')
    } finally {
      setDuplicatesLoading(false)
    }
  }

  // Duplicados: fusionar
  const mergeContacts = async (primaryId: string, duplicateIds: string[], groupIndex: number) => {
    console.log('🔄 Frontend merge request:', { primaryId, duplicateIds, groupIndex })
    
    try {
      // Para enviar mergedFields al backend REST, construimos campos fusionados en el front
      const group = duplicates[groupIndex]
      const allContacts = [group.primary, ...(group.duplicates || [])]
      const primary = allContacts.find((c: any) => c.id === primaryId) || group.primary

      // Sencillo merge superficial: prioriza campos del seleccionado si están presentes
      const mergedFields: any = {}
      const fields = ['Nombre','Empresa','Email','Teléfono','Telefono','NIT','CIF','Dirección','Direccion','Ciudad','Código Postal','País','Relación','Sitio Web','Notas','Tipo de Contacto']
      for (const f of fields) mergedFields[f] = undefined

      // Nota: El front no tiene todos los campos internos; el backend debería aceptar los que existan
      // Enviamos solo Email, Teléfono, NIT, Nombre si disponibles desde el modal (summary)
      mergedFields['Nombre'] = primary.displayName || undefined
      mergedFields['Email'] = primary.email || undefined
      mergedFields['Teléfono'] = primary.phone || undefined
      mergedFields['NIT'] = primary.taxId || undefined

      const response = await fetch('/api/contactos/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mainId: primaryId, duplicates: duplicateIds, mergedFields })
      })
      
      console.log('📡 Response status:', response.status)
      const result = await response.json().catch(() => ({}))
      console.log('📡 Response data:', result)
      
      if (response.ok) {
        toast.success(`Fusión completada: ${result.merged || duplicateIds.length + 1} fusionados, ${result.deleted || duplicateIds.length} eliminados`)
        
        // Remover solo el grupo fusionado de la lista
        setDuplicates(prev => prev.filter((_, index) => index !== groupIndex))
        
        // Limpiar selección del grupo eliminado
        setSelectedPrimary(prev => {
          const newSelected = { ...prev }
          delete newSelected[groupIndex]
          // Reindexar las claves para los grupos restantes
          const reindexed: Record<number, string> = {}
          Object.entries(newSelected).forEach(([key, value]) => {
            const oldIndex = parseInt(key)
            if (oldIndex > groupIndex) {
              reindexed[oldIndex - 1] = value
            } else if (oldIndex < groupIndex) {
              reindexed[oldIndex] = value
            }
          })
          return reindexed
        })
        
        fetchContacts()
      } else {
        console.error('❌ Merge failed:', result)
        toast.error(`Error: ${result.error || 'No se pudo fusionar'}`)
      }
    } catch (e) {
      console.error('❌ Network error:', e)
      toast.error('Error de conexión')
    }
  }

  const filteredContacts = useMemo(() => {
    if (!contacts || contacts.length === 0) return []
    
    // Filtrar por tipo (kind)
    let filtered = contacts
    if (filters.kind && filters.kind !== "ALL") {
      filtered = filtered.filter(contact => contact.kind === filters.kind)
    }
    
    return filtered
  }, [contacts, filters.kind])

  const getRelationLabel = (relation: string) => {
    switch (relation) {
      case "CUSTOMER": return "Cliente"
      case "SUPPLIER": return "Proveedor"
      case "BOTH": return "Ambos"
      default: return relation
    }
  }

  const getRelationColor = (relation: string) => {
    switch (relation) {
      case "CUSTOMER": 
      case "Cliente": 
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "SUPPLIER": 
      case "Proveedor": 
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "BOTH": 
      case "Ambos": 
        return "bg-green-100 text-green-800 border-green-200"
      default: 
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="p-6">
      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Gestión de Contactos</h1>
          <p className="text-gray-600">Administra tu base de datos de contactos comerciales</p>
        </div>

        {/* Barra superior sticky */}
        <div className="sticky top-0 z-10 bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
          {/* Etiquetas de filtros activos */}
          {(filters.q || filters.relation !== "ALL" || filters.kind !== "ALL") && (
            <div className="flex flex-wrap gap-2 items-center mb-4 pb-4 border-b">
              {filters.q && (
                <div className="flex items-center gap-1 bg-blue-100 hover:bg-blue-200 rounded-full px-3 py-1 text-sm">
                  <span className="font-medium">Búsqueda:</span>
                  <span className="text-gray-700">{filters.q}</span>
                  <button
                    type="button"
                    onClick={() => eliminarFiltro('busqueda')}
                    className="ml-1 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              
              {filters.relation !== "ALL" && (
                <div className="flex items-center gap-1 bg-green-100 hover:bg-green-200 rounded-full px-3 py-1 text-sm">
                  <span className="font-medium">Relación:</span>
                  <span className="text-gray-700">{getRelationLabel(filters.relation)}</span>
                  <button
                    type="button"
                    onClick={() => eliminarFiltro('relacion')}
                    className="ml-1 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              
              {filters.kind !== "ALL" && (
                <div className="flex items-center gap-1 bg-purple-100 hover:bg-purple-200 rounded-full px-3 py-1 text-sm">
                  <span className="font-medium">Tipo:</span>
                  <span className="text-gray-700">{filters.kind === "INDIVIDUAL" ? "Individual" : "Compañía"}</span>
                  <button
                    type="button"
                    onClick={() => eliminarFiltro('tipo')}
                    className="ml-1 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              
              {/* Botón para limpiar todos */}
              <button
                type="button"
                onClick={limpiarTodosFiltros}
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
                placeholder="Buscar contactos..."
                value={filters.q}
                onChange={(e) => setFilters(prev => ({ ...prev, q: e.target.value }))}
                className="w-full"
              />
            </div>

            {/* Filtro Relación */}
            <Select value={filters.relation} onValueChange={(value) => setFilters(prev => ({ ...prev, relation: value }))}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Relación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Relación</SelectItem>
                <SelectItem value="Cliente">Cliente</SelectItem>
                <SelectItem value="Proveedor">Proveedor</SelectItem>
                <SelectItem value="Ambos">Ambos</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro Tipo */}
            <Select value={filters.kind} onValueChange={(value) => setFilters(prev => ({ ...prev, kind: value }))}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tipo</SelectItem>
                <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                <SelectItem value="COMPANY">Compañía</SelectItem>
              </SelectContent>
            </Select>

            {/* Espacio flexible */}
            <div className="flex-1"></div>

            {/* Botones - Derecha */}
            <div className="flex gap-2">
              {tieneFuncionTecnica("detectar duplicados contactos") && (
                <Button variant="outline" onClick={detectDuplicates} disabled={duplicatesLoading}>
                  <Users className="w-4 h-4 mr-2" />
                  {duplicatesLoading ? 'Detectando...' : 'Detectar duplicados'}
                </Button>
              )}
              {tieneFuncionTecnica("ver boton exportar") && (
                <Button variant="outline" onClick={handleExport}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              )}
              <Link href="/panel/contactos/nuevo">
                <Button className="bg-[#D54644] hover:bg-[#B03A38]">
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo
                </Button>
              </Link>
            </div>
          </div>

          {/* Acciones masivas */}
          {selectedContacts.size > 0 && puedeEditar("contactos") && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-blue-800">
                    {selectAllMode === 'all' 
                      ? `${allContactIds.length} contacto(s) seleccionado(s) (todos)` 
                      : `${selectedContacts.size} contacto(s) seleccionado(s)`
                    }
                  </span>
                  <Select onValueChange={(value) => handleBulkFieldChange('relation', value)}>
                    <SelectTrigger className="h-8 w-40">
                      <SelectValue placeholder="Relación" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cliente">Cliente</SelectItem>
                      <SelectItem value="Proveedor">Proveedor</SelectItem>
                      <SelectItem value="Ambos">Ambos</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select onValueChange={handleBulkSalesOwnerChange}>
                    <SelectTrigger className="h-8 w-48">
                      <SelectValue placeholder="Comercial" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin asignar</SelectItem>
                      {Object.entries(salesOwners).map(([id, name]) => (
                        <SelectItem key={id} value={id}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  {Object.keys(editedContacts).length > 0 && (
                    <>
                      <Button 
                        size="sm" 
                        onClick={handleSaveChanges}
                        disabled={savingChanges}
                        className="bg-[#D54644] hover:bg-[#B73E3A] text-white"
                      >
                        {savingChanges ? "Guardando..." : `Guardar cambios (${Object.keys(editedContacts).length})`}
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
                  {tieneFuncionTecnica("ver boton exportar") && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleExportSelected}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Exportar selección
                    </Button>
                  )}
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
                        <AlertDialogTitle>¿Eliminar contactos?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción eliminará {selectedContacts.size} contacto(s) seleccionado(s).
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
          {contacts.length > 0 && 
           contacts.every(c => selectedContacts.has(c.id)) && 
           selectAllMode !== 'all' &&
           allContactIds.length > contacts.length && (
            <div className="mt-2 p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-cyan-900">
                  Los {contacts.length} contactos de esta página están seleccionados.
                </span>
                <Button
                  variant="link"
                  size="sm"
                  className="text-cyan-700 hover:text-cyan-900 underline font-semibold"
                  onClick={() => {
                    setSelectedContacts(new Set(allContactIds))
                    setSelectAllMode('all')
                    toast.success(`${allContactIds.length} contactos seleccionados`)
                  }}
                >
                  Seleccionar los {allContactIds.length} contactos
                </Button>
              </div>
            </div>
          )}

          {selectAllMode === 'all' && (
            <div className="mt-2 p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-cyan-900">
                  Los {allContactIds.length} contactos están seleccionados.
                </span>
                <Button
                  variant="link"
                  size="sm"
                  className="text-cyan-700 hover:text-cyan-900 underline"
                  onClick={() => {
                    setSelectedContacts(new Set())
                    setSelectAllMode('none')
                  }}
                >
                  Limpiar selección
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Tabla de contactos */}
        <div className="mb-3 text-sm text-slate-700">
          Contactos ({pagination.total || contacts.length})
        </div>
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Cargando...</div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  {filters.q || filters.relation !== "ALL" || filters.kind !== "ALL" ? (
                    "No se encontraron contactos con los filtros aplicados"
                  ) : (
                    "No hay contactos registrados"
                  )}
                </div>
                <Link href="/panel/contactos/nuevo">
                  <Button className="bg-[#D54644] hover:bg-[#B03A38]">
                    <Plus className="w-4 h-4 mr-2" />
                    Crear primer contacto
                  </Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    {puedeEditar("contactos") ? (
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          contacts.length > 0 && 
                          contacts.every(c => selectedContacts.has(c.id))
                        }
                        onCheckedChange={async (checked) => {
                          if (checked) {
                            const pageIds = new Set(contacts.map(c => c.id))
                            setSelectedContacts(pageIds)
                            setSelectAllMode('page')
                            await fetchAllContactIds()
                          } else {
                            setSelectedContacts(new Set())
                            setSelectAllMode('none')
                          }
                        }}
                      />
                    </TableHead>
                    ) : null}
                    <TableHead>Nombre</TableHead>
                    <TableHead>NIT</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Comercial</TableHead>
                    <TableHead>Relación</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map((contact) => (
                      <TableRow key={contact.id} className="hover:bg-gray-50">
                        {puedeEditar("contactos") ? (
                        <TableCell>
                          <Checkbox
                            checked={selectedContacts.has(contact.id)}
                            onCheckedChange={(checked) => {
                              const newSelected = new Set(selectedContacts)
                              if (checked) {
                                newSelected.add(contact.id)
                              } else {
                                newSelected.delete(contact.id)
                                // Si deselecciona uno, salir del modo "all"
                                if (selectAllMode === 'all') {
                                  setSelectAllMode('page')
                                }
                              }
                              setSelectedContacts(newSelected)
                            }}
                          />
                        </TableCell>
                        ) : null}
                        <TableCell>
                          {selectedContacts.has(contact.id) && puedeEditar("contactos") ? (
                            <Input
                              value={editedContacts[contact.id]?.displayName ?? contact.displayName}
                              onChange={(e) => handleFieldChange(contact.id, 'displayName', e.target.value)}
                              className="h-8"
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              {contact.kind === "COMPANY" ? (
                                <Building2 className="w-4 h-4 text-gray-500" />
                              ) : (
                                <User className="w-4 h-4 text-gray-500" />
                              )}
                              <div>
                                {contact.displayName && contact.displayName.length > 25 ? (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger className="text-left font-medium">
                                        {contact.displayName.slice(0, 25) + '…'}
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-sm">{contact.displayName}</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                ) : (
                                  <div className="font-medium">{contact.displayName || "-"}</div>
                                )}
                                {contact.kind === "INDIVIDUAL" && contact.legalName && (
                                  contact.legalName.length > 25 ? (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger className="text-left text-sm text-gray-500">
                                          {contact.legalName.slice(0, 25) + '…'}
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-sm">{contact.legalName}</TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  ) : (
                                    <div className="text-sm text-gray-500">{contact.legalName}</div>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {selectedContacts.has(contact.id) && puedeEditar("contactos") ? (
                            <Input
                              value={editedContacts[contact.id]?.taxId ?? contact.taxId ?? ''}
                              onChange={(e) => handleFieldChange(contact.id, 'taxId', e.target.value)}
                              className="h-8 font-mono"
                            />
                          ) : (
                            contact.taxId || "-"
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {selectedContacts.has(contact.id) && puedeEditar("contactos") ? (
                            <Input
                              value={editedContacts[contact.id]?.phone ?? contact.phone ?? ''}
                              onChange={(e) => handleFieldChange(contact.id, 'phone', e.target.value)}
                              className="h-8 font-mono"
                            />
                          ) : (
                            contact.phone || "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {selectedContacts.has(contact.id) && puedeEditar("contactos") ? (
                            <Input
                              value={editedContacts[contact.id]?.email ?? contact.email ?? ''}
                              onChange={(e) => handleFieldChange(contact.id, 'email', e.target.value)}
                              className="h-8"
                            />
                          ) : (
                            contact.email || "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {selectedContacts.has(contact.id) && puedeEditar("contactos") ? (
                            <Select 
                              value={editedContacts[contact.id]?.salesOwnerId ?? contact.salesOwnerId ?? 'none'}
                              onValueChange={(value) => handleFieldChange(contact.id, 'salesOwnerId', value === 'none' ? null : value)}
                            >
                              <SelectTrigger className="h-8 w-40">
                                <SelectValue placeholder="Comercial" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Sin asignar</SelectItem>
                                {Object.entries(salesOwners).map(([id, name]) => (
                                  <SelectItem key={id} value={id}>{name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <div 
                              onClick={() => {
                                if (puedeEditar("contactos") && !selectedContacts.has(contact.id)) {
                                  const newSelected = new Set(selectedContacts)
                                  newSelected.add(contact.id)
                                  setSelectedContacts(newSelected)
                                }
                              }}
                              className={puedeEditar("contactos") ? "cursor-pointer" : ""}
                            >
                              {contact.salesOwnerId && salesOwners[contact.salesOwnerId] ? (
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={getSalesOwnerImage(contact.salesOwnerId) || ""} alt={salesOwners[contact.salesOwnerId]} />
                                    <AvatarFallback className="bg-[#D54644] text-white text-[10px] font-medium">
                                      {salesOwners[contact.salesOwnerId]
                                        .split(" ")
                                        .map(n => n[0])
                                        .join("")
                                        .toUpperCase()
                                        .slice(0, 2)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm text-gray-900">{salesOwners[contact.salesOwnerId]}</span>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400">-</span>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {selectedContacts.has(contact.id) && puedeEditar("contactos") ? (
                            <Select 
                              value={editedContacts[contact.id]?.relation ?? contact.relation}
                              onValueChange={(value) => handleFieldChange(contact.id, 'relation', value)}
                            >
                              <SelectTrigger className="h-8 w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Cliente">Cliente</SelectItem>
                                <SelectItem value="Proveedor">Proveedor</SelectItem>
                                <SelectItem value="Ambos">Ambos</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge className={getRelationColor(contact.relation)}>
                              {getRelationLabel(contact.relation)}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {puedeEditar("contactos") && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/panel/contactos/${contact.id}`)}
                              title="Editar contacto"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            )}
                            <PermisoEliminar modulo="contactos">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(contact.id)}
                                title="Eliminar contacto"
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
        {/* Modal de duplicados */}
        <Dialog open={showDuplicates} onOpenChange={setShowDuplicates}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                Contactos duplicados detectados ({duplicates.length} grupos)
              </DialogTitle>
              <DialogDescription>
                Se encontraron grupos de contactos con similitudes en Nombre, NIT, Teléfono o Email.
+                Elige el principal de cada grupo y fusiona los demás.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {duplicates.length === 0 && (
                <div className="text-sm text-gray-500">No se detectaron duplicados.</div>
              )}

              {duplicates.map((group: any, index: number) => {
                const allContacts = [group.primary, ...(group.duplicates || [])]
                const value = selectedPrimary[index] || group.primary?.id
                return (
                  <Card key={index} className="border-yellow-200 bg-yellow-50">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="font-medium text-sm text-yellow-800">
                          Grupo {index + 1} - Contactos similares (elige el principal)
                        </div>

                        <RadioGroup
                          value={value}
                          onValueChange={(v) => setSelectedPrimary(prev => ({ ...prev, [index]: v }))}
                          className="gap-2"
                        >
                          {allContacts.map((c: any, idx: number) => (
                            <div key={c.id} className="bg-white p-3 rounded border flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <RadioGroupItem value={c.id} id={`g${index}-c${idx}`} />
                                <label htmlFor={`g${index}-c${idx}`} className="cursor-pointer">
                                  <div className="font-medium">{c.displayName || '-'}</div>
                                  <div className="text-sm text-gray-600">
                                    {c.email && `Email: ${c.email}`}
                                    {c.phone && ` | Tel: ${c.phone}`}
                                    {c.taxId && ` | NIT: ${c.taxId}`}
                                  </div>
                                </label>
                              </div>
                              <Badge className={value === c.id ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-red-50 text-red-700 border-red-200"}>
                                {value === c.id ? 'Principal' : 'Duplicado'}
                              </Badge>
                            </div>
                          ))}
                        </RadioGroup>

                        <Button
                          onClick={() => {
                            const primaryId = selectedPrimary[index] || group.primary?.id
                            const duplicateIds = allContacts.map((c: any) => c.id).filter((id: string) => id !== primaryId)
                            mergeContacts(primaryId, duplicateIds, index)
                          }}
                          className="w-full bg-yellow-600 hover:bg-yellow-700"
                        >
                          <Merge className="w-4 h-4 mr-2" />
                          Fusionar (mantener seleccionado)
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
