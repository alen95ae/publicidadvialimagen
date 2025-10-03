"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
import { Plus, Search, Eye, Edit, Trash2, MapPin, Euro, Download, Filter, Home, Monitor, DollarSign, Calendar, Copy, Upload } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "sonner"
import Sidebar from "@/components/sidebar"

// Constantes para colores de estado
const STATUS_META = {
  DISPONIBLE:   { label: 'Disponible',    className: 'bg-green-100 text-green-800' },
  RESERVADO:    { label: 'Reservado',     className: 'bg-yellow-100 text-yellow-800' },
  OCUPADO:      { label: 'Ocupado',       className: 'bg-red-100 text-red-800' },
  NO_DISPONIBLE:{ label: 'No disponible', className: 'bg-gray-100 text-gray-800' },
} as const

// Opciones de tipo
const TYPE_OPTIONS = ['Vallas Publicitarias','Pantallas LED','Murales','Publicidad Móvil'] as const

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
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })
  const [ownerDraft, setOwnerDraft] = useState("")
  const [priceMonthDraft, setPriceMonthDraft] = useState("")
  const [titleDraft, setTitleDraft] = useState("")
  const [typeDraft, setTypeDraft] = useState<string | undefined>(undefined)
  const [codeDraft, setCodeDraft] = useState("")
  
  // Estados para controlar popovers
  const [ownerOpen, setOwnerOpen] = useState(false)
  const [priceOpen, setPriceOpen] = useState(false)
  const [titleOpen, setTitleOpen] = useState(false)
  const [typeOpen, setTypeOpen] = useState(false)
  const [codeOpen, setCodeOpen] = useState(false)
  const [openImport, setOpenImport] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchSupports(q, 1)
  }, [q, statusFilter])

  const fetchSupports = async (query = "", page: number = currentPage) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (query) params.set('q', query)
      if (statusFilter.length) params.set('status', statusFilter.join(','))
      params.set('page', page.toString())
      params.set('limit', '25')
      
      const response = await fetch(`/api/soportes?${params}`)
      if (response.ok) {
        const result = await response.json()
        // Asegurar que supports sea siempre un array
        const supportsData = result.data || result
        setSupports(Array.isArray(supportsData) ? supportsData : [])
        setPagination(result.pagination || pagination)
        setCurrentPage(page)
      } else {
        toast.error("Error al cargar los soportes")
        setSupports([]) // Establecer array vacío en caso de error
      }
    } catch (error) {
      console.error("Error fetching supports:", error)
      toast.error("Error de conexión")
      setSupports([]) // Establecer array vacío en caso de error
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este soporte?")) return
    
    try {
      const response = await fetch(`/api/soportes/${id}`, { method: "DELETE" })
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
      const response = await fetch('/api/soportes/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    
    await fetch('/api/soportes/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, action: 'delete' })
    })
    fetchSupports()
    setSelected({})
    toast.success(`${ids.length} soportes eliminados`)
  }

  async function bulkDuplicate() {
    const ids = Object.keys(selected).filter(id => selected[id])
    
    try {
      const response = await fetch('/api/soportes/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  async function exportPDF() {
    const ids = Object.keys(selected).filter(id => selected[id])
    if (!ids.length) return
    const url = `/api/soportes/export/pdf?ids=${ids.join(',')}`
    window.open(url, '_blank')
  }

  // Kanban helpers
  async function changeStatus(id: string, newStatus: keyof typeof STATUS_META) {
    try {
      await fetch('/api/soportes/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

      const response = await fetch('/api/soportes/import', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      
      if (response.ok && result.success) {
        toast.success(`Importación completada: ${result.created} creados, ${result.updated} actualizados${result.skipped > 0 ? `, ${result.skipped} saltados` : ''}${result.errors > 0 ? `, ${result.errors} errores` : ''}`)
        if (result.errorMessages && result.errorMessages.length > 0) {
          console.log('Errores:', result.errorMessages)
        }
        await fetchSupports(q, currentPage)
        setOpenImport(false)
      } else {
        toast.error(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error al importar:', error)
      toast.error('Error al importar el archivo')
    } finally {
      setImportLoading(false)
      // Limpiar el input
      event.target.value = ''
    }
  }


  return (
    <Sidebar>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/panel" 
              className="bg-[#D54644] hover:bg-[#D54644]/90 text-white p-2 rounded-lg transition-colors"
              title="Ir al panel principal"
            >
              <Home className="w-5 h-5" />
            </Link>
            <div className="text-xl font-bold text-slate-800">Soportes</div>
            <div className="flex items-center gap-6 ml-4">
              <Link 
                href="/panel/soportes/gestion" 
                className="text-sm font-medium text-[#D54644] hover:text-[#D54644]/80 transition-colors"
              >
                Soportes
              </Link>
              <Link 
                href="/panel/soportes/costes" 
                className="text-sm font-medium text-gray-600 hover:text-[#D54644] transition-colors"
              >
                Costes
              </Link>
              <Link 
                href="/panel/soportes/planificacion" 
                className="text-sm font-medium text-gray-600 hover:text-[#D54644] transition-colors"
              >
                Planificación
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
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Buscar soportes
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Buscar por código, título, ciudad, tipo o propietario..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="max-w-md"
                  />
                  
                  {/* Filtros avanzados */}
                  <Select
                    value={statusFilter.length ? statusFilter.join(',') : 'all'}
                    onValueChange={(value) => setStatusFilter(value === 'all' ? [] : (value ? value.split(',') : []))}
                  >
                    <SelectTrigger className="max-w-48">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Disponibilidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
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
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={exportPDF}
                  disabled={!someSelected}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Catálogo PDF
                </Button>
                
                <Dialog open={openImport} onOpenChange={setOpenImport}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Importar CSV
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
                  <Button className="bg-[#D54644] hover:bg-[#B03A38]">
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Soporte
                  </Button>
                </Link>
              </div>
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
            {/* Barra de acciones masivas */}
            {(someSelected || allSelected) && (
              <div className="mb-3 rounded-xl border bg-white p-3 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {Object.keys(selected).filter(id => selected[id]).length} seleccionados
                  </span>

                  {/* Disponibilidad */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary">Cambiar disponibilidad</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {Object.keys(STATUS_META).map(k => (
                        <DropdownMenuItem key={k} onClick={() => bulkUpdate({ status: k })}>
                          {STATUS_META[k as keyof typeof STATUS_META].label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Cambiar propietario - POPOVER inline */}
                  <Popover open={ownerOpen} onOpenChange={setOwnerOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="secondary">Cambiar propietario</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64">
                      <div className="space-y-2">
                        <Label>Nuevo propietario</Label>
                        <Input 
                          value={ownerDraft} 
                          onChange={e => setOwnerDraft(e.target.value)} 
                          placeholder="Ej: Imagen" 
                        />
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => { setOwnerDraft(''); setOwnerOpen(false) }}>Cancelar</Button>
                          <Button size="sm" onClick={async () => { await bulkUpdate({ owner: ownerDraft }); setOwnerOpen(false) }}>Aplicar</Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Cambiar precio/mes - POPOVER inline */}
                  <Popover open={priceOpen} onOpenChange={setPriceOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="secondary">Cambiar precio/mes</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64">
                      <div className="space-y-2">
                        <Label>Nuevo precio/mes (€)</Label>
                        <Input 
                          type="number" 
                          step="0.01" 
                          className="no-spinner"
                          value={priceMonthDraft} 
                          onChange={e => setPriceMonthDraft(e.target.value)} 
                        />
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => { setPriceMonthDraft(''); setPriceOpen(false) }}>Cancelar</Button>
                          <Button size="sm" onClick={async () => { await bulkUpdate({ priceMonth: Number(priceMonthDraft) }); setPriceOpen(false) }}>Aplicar</Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Cambiar título */}
                  <Popover open={titleOpen} onOpenChange={setTitleOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="secondary">Cambiar título</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-2">
                        <Label>Nuevo título</Label>
                        <Input value={titleDraft} onChange={e => setTitleDraft(e.target.value)} />
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => { setTitleDraft(''); setTitleOpen(false) }}>Cancelar</Button>
                          <Button size="sm" onClick={async () => { await bulkUpdate({ title: titleDraft }); setTitleOpen(false) }}>Aplicar</Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Cambiar tipo (select con opciones) */}
                  <Popover open={typeOpen} onOpenChange={setTypeOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="secondary">Cambiar tipo</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64">
                      <div className="space-y-2">
                        <Label>Tipo de soporte</Label>
                        <select
                          className="w-full rounded-md border border-gray-200 bg-white p-2 text-sm"
                          value={typeDraft ?? ''}
                          onChange={(e) => setTypeDraft(e.target.value)}
                        >
                          <option value="" disabled>Selecciona…</option>
                          {TYPE_OPTIONS.map(op => <option key={op} value={op}>{op}</option>)}
                        </select>
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => { setTypeDraft(undefined); setTypeOpen(false) }}>Cancelar</Button>
                          <Button size="sm" onClick={async () => { if(typeDraft){ await bulkUpdate({ type: typeDraft }); setTypeOpen(false) } }}>Aplicar</Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Cambiar código (solo 1 seleccionado) */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Popover open={codeOpen} onOpenChange={setCodeOpen}>
                            <PopoverTrigger asChild>
                              <Button variant="secondary" disabled={!singleSelected}>
                                Cambiar código
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64">
                              <div className="space-y-2">
                                <Label>Nuevo código</Label>
                                <Input value={codeDraft} onChange={e => setCodeDraft(e.target.value)} placeholder="Ej: SM-009" />
                                <div className="flex justify-end gap-2">
                                  <Button size="sm" variant="outline" onClick={() => { setCodeDraft(''); setCodeOpen(false) }}>Cancelar</Button>
                                  <Button size="sm" onClick={async () => { await bulkUpdate({ __codeSingle: codeDraft }); setCodeOpen(false) }}>Aplicar</Button>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </span>
                      </TooltipTrigger>
                      {!singleSelected && <TooltipContent>Selecciona exactamente 1 soporte para cambiar el código.</TooltipContent>}
                    </Tooltip>
                  </TooltipProvider>

                  <div className="flex-1" />
                  <Button variant="outline" onClick={bulkDuplicate} disabled={!someSelected}>
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicar
                  </Button>
                  <Button variant="destructive" onClick={bulkDelete}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </Button>
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
                    <TableHead>Dimensiones (m)</TableHead>
                    <TableHead>Precio/Mes</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Propietario</TableHead>
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
                        <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-1 font-mono text-xs text-gray-800 border border-neutral-200">
                          {support.code}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[42ch]">
                        {support.title?.length > 40 ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger className="text-left">
                                {support.title.slice(0,40) + '…'}
                              </TooltipTrigger>
                              <TooltipContent className="max-w-sm">{support.title}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (support.title || '—')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{support.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="w-3 h-3" />
                          {support.city}, {support.country}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {support.widthM && support.heightM ? (
                            <span>{support.widthM} × {support.heightM}</span>
                          ) : (
                            <span className="text-gray-500">N/A</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {formatPrice(support.priceMonth)} Bs
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${STATUS_META[support.status]?.className || 'bg-gray-100 text-gray-800'}`}>
                          {STATUS_META[support.status]?.label || support.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {support.owner ? (
                          <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ${
                            support.owner.trim().toLowerCase() === 'imagen' ? 'bg-pink-100 text-pink-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {support.owner}
                          </span>
                        ) : (
                          <span className="text-gray-500">—</span>
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
              Mostrando {((currentPage - 1) * 25) + 1} - {Math.min(currentPage * 25, pagination.total)} de {pagination.total} items
            </div>
          </div>
        )}
      </main>
    </Sidebar>
  )
}
