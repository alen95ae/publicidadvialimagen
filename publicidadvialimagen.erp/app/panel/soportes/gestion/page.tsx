"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { api } from "@/lib/fetcher"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Plus, Search, Eye, Edit, Trash2, MapPin, Euro, Download, Filter, Monitor, DollarSign, Calendar, Copy, Upload } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "sonner"

// Constantes para colores de estado (formato Airtable)
const STATUS_META = {
  'Disponible':     { label: 'Disponible',    className: 'bg-green-100 text-green-800' },
  'Reservado':      { label: 'Reservado',     className: 'bg-yellow-100 text-yellow-800' },
  'Ocupado':        { label: 'Ocupado',       className: 'bg-red-100 text-red-800' },
  'No disponible':  { label: 'No disponible', className: 'bg-gray-100 text-gray-800' },
} as const

// Opciones de tipo
const TYPE_OPTIONS = ['Unipolar','Bipolar','Tripolar','Mural','Mega Valla','Cartelera','Paleta'] as const

interface Support {
  id: string
  code: string
  title: string
  type: string
  status: keyof typeof STATUS_META
  widthM: number | null
  heightM: number | null
  city: string
  country: string
  priceMonth: number | null
  available: boolean
  areaM2: number | null
  pricePerM2: number | null
  productionCost: number | null
  owner: string | null
  imageUrl: string | null
  company?: { name: string }
}

export default function SoportesPage() {
  const [supports, setSupports] = useState<Support[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")
  const [searchQuery, setSearchQuery] = useState("") // Para debounce
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [cityFilter, setCityFilter] = useState<string>("")
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })
  const [openImport, setOpenImport] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  
  // Estados para edición en línea
  const [editedSupports, setEditedSupports] = useState<Record<string, Partial<Support>>>({})
  const [savingChanges, setSavingChanges] = useState(false)
  const router = useRouter()

  const fetchSupports = async (query = "", page: number = currentPage) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (query) params.set('q', query)
      if (statusFilter.length) params.set('status', statusFilter.join(','))
      if (cityFilter) params.set('city', cityFilter)
      params.set('page', page.toString())
      params.set('limit', '50')
      
      console.log('🔍 Fetching supports with params:', params.toString())
      const response = await api(`/api/soportes?${params}`)
      console.log('📡 Response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('📊 Response data:', result)
        console.log('📊 Data length:', result.data?.length)
        
        // Asegurar que supports sea siempre un array
        const supportsData = result.data || result
        console.log('📊 Supports data:', supportsData)
        console.log('📊 Is array:', Array.isArray(supportsData))
        
        setSupports(Array.isArray(supportsData) ? supportsData : [])
        setPagination(result.pagination || pagination)
        setCurrentPage(page)
      } else {
        console.error('❌ Response not ok:', response.status, response.statusText)
        toast.error("Error al cargar los soportes")
        setSupports([]) // Establecer array vacío en caso de error
      }
    } catch (error) {
      console.error("❌ Error fetching supports:", error)
      toast.error("Error de conexión")
      setSupports([]) // Establecer array vacío en caso de error
    } finally {
      setLoading(false)
    }
  }

  // Debounce para la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(q)
    }, 300) // 300ms de delay

    return () => clearTimeout(timer)
  }, [q])

  // Efecto para hacer la búsqueda cuando cambie searchQuery
  useEffect(() => {
    fetchSupports(searchQuery, 1)
  }, [searchQuery, statusFilter, cityFilter])

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este soporte?")) return
    
    try {
      const response = await api(`/api/soportes/${id}`, { method: "DELETE" })
      if (response.ok) {
        toast.success("Soporte eliminado correctamente")
        fetchSupports()
      } else {
        toast.error("Error al eliminar el soporte")
      }
    } catch (error) {
      toast.error("Error de conexión")
    }
  }

  const formatPrice = (price: number | null) => {
    if (!price) return "N/A"
    return new Intl.NumberFormat("es-ES", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price)
  }

  // Asegurar que supports sea un array antes de usar métodos de array
  const supportsArray = Array.isArray(supports) ? supports : []
  const ids = supportsArray.map(i => i.id)
  
  // Debug logs
  console.log('🔍 Current supports state:', supports)
  console.log('🔍 Supports array length:', supportsArray.length)
  console.log('🔍 Loading state:', loading)
  const allSelected = ids.length > 0 && ids.every(id => selected[id])
  const someSelected = ids.some(id => selected[id]) && !allSelected
  const selectedIds = Object.keys(selected).filter(id => selected[id])
  const singleSelected = selectedIds.length === 1

  // Funciones de paginación
  const handlePageChange = (page: number) => {
    fetchSupports(q, page)
  }

  const handlePrevPage = () => {
    if (pagination.hasPrev) {
      handlePageChange(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (pagination.hasNext) {
      handlePageChange(currentPage + 1)
    }
  }


  function toggleAll(checked: boolean) {
    const next: Record<string, boolean> = {}
    ids.forEach(id => { next[id] = checked })
    setSelected(next)
  }

  async function bulkUpdate(patch: any) {
    const ids = Object.keys(selected).filter(id => selected[id])
    
    try {
      const response = await api('/api/soportes/bulk', {
        method: 'POST',
        body: JSON.stringify({ ids, action: 'update', data: patch })
      })
      
      if (response.ok) {
        const result = await response.json()
        toast.success(`${result.count || ids.length} soportes actualizados correctamente`)
        fetchSupports()
        setSelected({})
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Error al actualizar los soportes')
      }
    } catch (error) {
      console.error('Error en actualización masiva:', error)
      toast.error('Error de conexión al actualizar')
    }
  }

  async function bulkDelete() {
    const ids = Object.keys(selected).filter(id => selected[id])
    if (!confirm(`¿Eliminar ${ids.length} soportes?`)) return
    
    await api('/api/soportes/bulk', {
      method: 'POST',
      body: JSON.stringify({ ids, action: 'delete' })
    })
    fetchSupports()
    setSelected({})
    toast.success(`${ids.length} soportes eliminados`)
  }

  async function bulkDuplicate() {
    const ids = Object.keys(selected).filter(id => selected[id])
    
    try {
      const response = await api('/api/soportes/bulk', {
        method: 'POST',
        body: JSON.stringify({ ids, action: 'duplicate' })
      })
      
      if (response.ok) {
        const result = await response.json()
        fetchSupports()
        setSelected({})
        toast.success(`${result.duplicated} soportes duplicados correctamente`)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Error al duplicar los soportes')
      }
    } catch (error) {
      console.error('Error duplicando soportes:', error)
      toast.error('Error de conexión')
    }
  }

  // Edición inline: actualizar campo de un soporte
  const handleFieldChange = (supportId: string, field: keyof Support, value: any) => {
    setEditedSupports(prev => ({
      ...prev,
      [supportId]: {
        ...prev[supportId],
        [field]: value
      }
    }))
  }

  // Guardar cambios editados
  const handleSaveChanges = async () => {
    if (Object.keys(editedSupports).length === 0) return

    setSavingChanges(true)
    try {
      const count = Object.keys(editedSupports).length
      const promises = Object.entries(editedSupports).map(async ([id, changes]) => {
        // Primero obtener el soporte completo para hacer PUT
        const support = supportsArray.find(s => s.id === id)
        if (!support) {
          throw new Error(`Soporte ${id} no encontrado`)
        }
        
        // Combinar datos existentes con cambios
        const updatedData = { ...support, ...changes }
        
        return api(`/api/soportes/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedData)
        })
      })

      await Promise.all(promises)
      setEditedSupports({})
      setSelected({})
      fetchSupports()
      toast.success(`${count} soporte(s) actualizado(s)`)
    } catch (error) {
      console.error('Error al guardar cambios:', error)
      toast.error("Error al guardar cambios")
    } finally {
      setSavingChanges(false)
    }
  }

  // Descartar cambios
  const handleDiscardChanges = () => {
    setEditedSupports({})
    toast.info("Cambios descartados")
  }

  // Aplicar cambio masivo a seleccionados
  const handleBulkFieldChange = (field: keyof Support, value: any) => {
    const updates: Record<string, Partial<Support>> = {}
    Object.keys(selected).filter(id => selected[id]).forEach(id => {
      updates[id] = {
        ...(editedSupports[id] || {}),
        [field]: value
      }
    })
    setEditedSupports(prev => ({ ...prev, ...updates }))
    toast.info(`Campo ${field} actualizado para ${Object.keys(selected).filter(id => selected[id]).length} soporte(s)`)
  }

  async function exportPDF() {
    const ids = Object.keys(selected).filter(id => selected[id])
    if (!ids.length) {
      toast.error("Selecciona al menos un soporte para generar el catálogo")
      return
    }
    
    try {
      const url = `/api/soportes/export/pdf?ids=${ids.join(',')}`
      
      // Crear un enlace temporal para descargar el PDF
      const link = document.createElement('a')
      link.href = url
      link.download = `catalogo-soportes-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success(`Catálogo PDF generado para ${ids.length} soporte(s)`)
    } catch (error) {
      console.error('Error generando PDF:', error)
      toast.error("Error al generar el catálogo PDF")
    }
  }

  // Kanban helpers
  async function changeStatus(id: string, newStatus: keyof typeof STATUS_META) {
    try {
      await api('/api/soportes/bulk', {
        method: 'POST',
        body: JSON.stringify({ ids: [id], action: 'update', data: { status: newStatus } })
      })
      await fetchSupports()
    } catch (_) {
      toast.error('No se pudo actualizar el estado')
    }
  }

  function onDragStart(e: React.DragEvent<HTMLDivElement>, id: string) {
    e.dataTransfer.setData('text/plain', id)
    e.dataTransfer.effectAllowed = 'move'
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>, newStatus: keyof typeof STATUS_META) {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    if (id) changeStatus(id, newStatus)
  }

  // Función para manejar la importación de CSV
  const handleCsvImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImportLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await api('/api/soportes/import', {
        method: 'POST',
        body: formData
      })

      // Verificar si la respuesta es JSON válido
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('Respuesta no es JSON:', text)
        toast.error('Error: Respuesta del servidor no válida')
        return
      }

      const result = await response.json()
      
      if (response.ok && result.success) {
        toast.success(`Importación completada: ${result.created} creados, ${result.updated} actualizados${result.skipped > 0 ? `, ${result.skipped} saltados` : ''}${result.errors > 0 ? `, ${result.errors} errores` : ''}`)
        if (result.errorMessages && result.errorMessages.length > 0) {
          console.log('Errores:', result.errorMessages)
          // Mostrar algunos errores en el toast si hay muchos
          if (result.errorMessages.length > 3) {
            toast.error(`Algunos errores: ${result.errorMessages.slice(0, 3).join(', ')}...`)
          }
        }
        await fetchSupports(q, currentPage)
        setOpenImport(false)
      } else {
        toast.error(`Error: ${result.error || 'Error desconocido'}`)
        if (result.details) {
          console.error('Detalles del error:', result.details)
        }
      }
    } catch (error) {
      console.error('Error al importar:', error)
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        toast.error('Error: Respuesta del servidor no válida. Verifica que el archivo CSV tenga el formato correcto.')
      } else {
        toast.error('Error al importar el archivo')
      }
    } finally {
      setImportLoading(false)
      // Limpiar el input
      event.target.value = ''
    }
  }

  // Función para exportar a CSV
  const handleCsvExport = () => {
    try {
      // Construir CSV con todos los soportes actuales
      const headers = ['Código', 'Título', 'Tipo', 'Estado', 'Ciudad', 'Ancho', 'Alto', 'Precio/Mes', 'Propietario']
      const rows = supportsArray.map(s => [
        s.code || '',
        s.title || '',
        s.type || '',
        s.status || '',
        s.city || '',
        s.widthM || '',
        s.heightM || '',
        s.priceMonth || '',
        s.owner || ''
      ])
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n')
      
      // Crear blob y descargar
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `soportes_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success('CSV exportado correctamente')
    } catch (error) {
      console.error('Error al exportar CSV:', error)
      toast.error('Error al exportar el archivo')
    }
  }

  // Lista fija de ciudades (las mismas que en la web)
  const ciudadesBolivia = ["La Paz", "Santa Cruz", "Cochabamba", "El Alto", "Sucre", "Potosí", "Tarija", "Oruro", "Beni", "Pando"]

  return (
    <div className="p-6">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-xl font-bold text-slate-800">Soportes</div>
            <div className="flex items-center gap-6 ml-4">
              <Link 
                href="/panel/soportes/gestion" 
                className="text-sm font-medium text-[#D54644] hover:text-[#D54644]/80 transition-colors"
              >
                Soportes
              </Link>
              <Link 
                href="/panel/soportes/alquileres" 
                className="text-sm font-medium text-gray-600 hover:text-[#D54644] transition-colors"
              >
                Alquileres
              </Link>
              <Link 
                href="/panel/soportes/planificacion" 
                className="text-sm font-medium text-gray-600 hover:text-[#D54644] transition-colors"
              >
                Planificación
              </Link>
              <Link 
                href="/panel/soportes/costes" 
                className="text-sm font-medium text-gray-600 hover:text-[#D54644] transition-colors"
              >
                Costes
              </Link>
              <Link 
                href="/panel/soportes/mantenimiento" 
                className="text-sm font-medium text-gray-600 hover:text-[#D54644] transition-colors"
              >
                Mantenimiento
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Buscar</span>
            <span className="text-gray-800 font-medium">admin</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-full px-4 sm:px-6 py-8 overflow-hidden">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Gestión de Soportes</h1>
          <p className="text-gray-600">Administra los soportes publicitarios disponibles</p>
        </div>

        {/* Search and Actions */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-2 items-center">
              {/* Buscador */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar código, título, ciudad..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              
              {/* Filtro de disponibilidad */}
              <Select
                value={statusFilter.length ? statusFilter.join(',') : 'all'}
                onValueChange={(value) => setStatusFilter(value === 'all' ? [] : (value ? value.split(',') : []))}
              >
                <SelectTrigger className="w-40 [&>span]:text-black">
                  <SelectValue placeholder="Disponibilidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Disponibilidad</SelectItem>
                  {Object.entries(STATUS_META).map(([key, meta]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <span className={`inline-block w-3 h-3 rounded-full ${meta.className}`}></span>
                        {meta.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Filtro de ciudad */}
              <Select
                value={cityFilter || "all"}
                onValueChange={(value) => setCityFilter(value === 'all' ? '' : value)}
              >
                <SelectTrigger className="w-40 [&>span]:text-black">
                  <SelectValue placeholder="Ciudad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Ciudad</SelectItem>
                  {ciudadesBolivia.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex-1" />
              
              {/* Botones de acción */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleCsvExport}
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
              
              <Dialog open={openImport} onOpenChange={setOpenImport}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Importar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Importar soportes (CSV)</DialogTitle>
                    <DialogDescription>
                      Columnas: Ciudad, Disponibilidad, Titulo, Precio por mes, Codigo, Ancho, Alto, Impactos dia, Ubicación, Tipo
                      <br/>
                      <a href="/api/soportes/import/template" className="underline">Descargar plantilla</a>
                    </DialogDescription>
                  </DialogHeader>
                  <input 
                    type="file" 
                    accept=".csv,text/csv" 
                    onChange={handleCsvImport}
                    disabled={importLoading}
                  />
                  {importLoading && <p>Importando...</p>}
                </DialogContent>
              </Dialog>
              
              <Link href="/panel/soportes/nuevo">
                <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Soporte
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Soportes ({supportsArray.length})</CardTitle>
            <CardDescription>
              Lista de todos los soportes publicitarios
            </CardDescription>
          </CardHeader>
          <CardContent>

            {/* Barra azul unificada de acciones masivas */}
            {((someSelected || allSelected) || Object.keys(editedSupports).length > 0) && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-blue-800">
                      {Object.keys(selected).filter(id => selected[id]).length} seleccionados
                    </span>
                    
                    {/* Solo mostrar desplegables cuando hay más de 1 seleccionado */}
                    {!singleSelected && Object.keys(selected).filter(id => selected[id]).length > 1 && (
                      <>
                        {/* Cambiar tipo de soporte */}
                        <Select onValueChange={(value) => handleBulkFieldChange('type', value)}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Cambiar tipo de soporte" />
                          </SelectTrigger>
                          <SelectContent>
                            {TYPE_OPTIONS.map((type) => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                     {/* Cambiar estado */}
                     <Select onValueChange={(value) => handleBulkFieldChange('status', value)}>
                       <SelectTrigger className="w-48">
                         <SelectValue placeholder="Cambiar estado" />
                       </SelectTrigger>
                       <SelectContent>
                         {Object.keys(STATUS_META).map((status) => (
                           <SelectItem key={status} value={status}>
                             {STATUS_META[status as keyof typeof STATUS_META].label}
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </>
                 )}

                 {/* Catálogo PDF - Siempre visible cuando hay soportes seleccionados */}
                 {Object.keys(selected).filter(id => selected[id]).length > 0 && (
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={exportPDF}
                   >
                     <Download className="w-4 h-4 mr-2" />
                     Catálogo PDF
                   </Button>
                 )}
                  </div>
                  
                  <div className="flex gap-2">
                    {Object.keys(editedSupports).length > 0 && (
                      <>
                        <Button 
                          size="sm" 
                          onClick={handleSaveChanges}
                          disabled={savingChanges}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          {savingChanges ? "Guardando..." : `Guardar cambios (${Object.keys(editedSupports).length})`}
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
                    
                    {singleSelected && (
                      <Button variant="outline" size="sm" onClick={bulkDuplicate}>
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicar
                      </Button>
                    )}
                    
                    <Button 
                      size="sm" 
                      onClick={bulkDelete}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-center py-8 text-gray-500">Cargando...</div>
            ) : supportsArray.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {q ? "No se encontraron soportes" : "No hay soportes registrados"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allSelected ? true : (someSelected ? 'indeterminate' : false)}
                        onCheckedChange={(v) => toggleAll(Boolean(v))}
                        aria-label="Seleccionar todo"
                      />
                    </TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Tipo de soporte</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead className="text-center">Dimensiones (m)</TableHead>
                    <TableHead>Precio/Mes</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supportsArray.map((support) => (
                    <TableRow key={support.id}>
                      <TableCell className="w-10">
                        <Checkbox
                          checked={!!selected[support.id]}
                          onCheckedChange={(v) =>
                            setSelected(prev => ({ ...prev, [support.id]: Boolean(v) }))
                          }
                          aria-label={`Seleccionar ${support.code}`}
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {selected[support.id] ? (
                          <Input
                            value={editedSupports[support.id]?.code ?? support.code}
                            onChange={(e) => handleFieldChange(support.id, 'code', e.target.value)}
                            className="h-8 font-mono text-xs"
                          />
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-1 font-mono text-xs text-gray-800 border border-neutral-200">
                            {support.code}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[42ch]">
                        {selected[support.id] ? (
                          <Input
                            value={editedSupports[support.id]?.title ?? support.title ?? ''}
                            onChange={(e) => handleFieldChange(support.id, 'title', e.target.value)}
                            className="h-8"
                            placeholder="Título del soporte"
                          />
                        ) : (
                          support.title?.length > 40 ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger className="text-left">
                                  {support.title.slice(0,40) + '…'}
                                </TooltipTrigger>
                                <TooltipContent className="max-w-sm">{support.title}</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (support.title || '—')
                        )}
                      </TableCell>
                      <TableCell>
                        {selected[support.id] ? (
                          <Select 
                            value={editedSupports[support.id]?.type ?? support.type}
                            onValueChange={(value) => handleFieldChange(support.id, 'type', value)}
                          >
                            <SelectTrigger className="h-8 w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TYPE_OPTIONS.map((type) => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="secondary">{support.type}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="w-3 h-3" />
                          {support.city}{support.country ? `, ${support.country}` : ', BO'}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="text-sm">
                          {support.widthM && support.heightM ? (
                            <span>{support.widthM} × {support.heightM}</span>
                          ) : (
                            <span className="text-gray-500">N/A</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {selected[support.id] ? (
                          <Input
                            type="number"
                            value={editedSupports[support.id]?.priceMonth ?? support.priceMonth ?? ''}
                            onChange={(e) => handleFieldChange(support.id, 'priceMonth', parseFloat(e.target.value) || null)}
                            className="h-8 w-24"
                            placeholder="0.00"
                          />
                        ) : (
                          <div className="flex items-center gap-1">
                            {formatPrice(support.priceMonth)} Bs
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {selected[support.id] ? (
                          <Select 
                            value={editedSupports[support.id]?.status ?? support.status}
                            onValueChange={(value) => handleFieldChange(support.id, 'status', value)}
                          >
                            <SelectTrigger className="h-8 w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.keys(STATUS_META).map((status) => (
                                <SelectItem key={status} value={status}>{STATUS_META[status as keyof typeof STATUS_META].label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${STATUS_META[support.status]?.className || 'bg-gray-100 text-gray-800'}`}>
                            {STATUS_META[support.status]?.label || support.status}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/panel/soportes/${support.id}`)}
                            title="Ver soporte"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/panel/soportes/${support.id}?edit=true`)}
                            title="Editar soporte"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(support.id)}
                            className="text-red-600 hover:text-red-700"
                            title="Eliminar soporte"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
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
                onClick={handlePrevPage}
                disabled={!pagination.hasPrev || loading}
              >
                Anterior
              </Button>
              
              {/* Mostrar páginas */}
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
                onClick={handleNextPage}
                disabled={!pagination.hasNext || loading}
              >
                Siguiente
              </Button>
            </div>
            
            {/* Información de paginación */}
            <div className="ml-4 text-sm text-gray-600">
              Mostrando {((currentPage - 1) * 50) + 1} - {Math.min(currentPage * 50, pagination.total)} de {pagination.total} items
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
