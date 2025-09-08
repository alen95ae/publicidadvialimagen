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
import { Plus, Search, Eye, Edit, Trash2, MapPin, Euro, Upload, Download, Filter, List, PanelsTopLeft } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "sonner"

// Constantes para colores de estado
const STATUS_META = {
  DISPONIBLE:   { label: 'Disponible',    className: 'bg-emerald-600 text-white' },
  RESERVADO:    { label: 'Reservado',     className: 'bg-amber-500 text-black' },
  OCUPADO:      { label: 'Ocupado',       className: 'bg-red-600 text-white' },
  NO_DISPONIBLE:{ label: 'No disponible', className: 'bg-neutral-900 text-white' },
} as const

// Opciones de tipo
const TYPE_OPTIONS = ['valla','pantalla','totem','parada de bus','mural','pasacalles'] as const

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
  const [viewMode, setViewMode] = useState<'table'|'kanban'>("table")
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [openImport, setOpenImport] = useState(false)
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
  const router = useRouter()

  useEffect(() => {
    const ctrl = new AbortController()
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (statusFilter.length) params.set('status', statusFilter.join(','))
    
    fetch(`/api/soportes?${params.toString()}`, { signal: ctrl.signal })
      .then(r => r.json())
      .then(setSupports)
      .catch(() => {})
    
    return () => ctrl.abort()
  }, [q, statusFilter])

  useEffect(() => {
    fetchSupports()
  }, [])

  const fetchSupports = async (query = "") => {
    try {
      setLoading(true)
      const response = await fetch(`/api/soportes?q=${encodeURIComponent(query)}`)
      if (response.ok) {
        const data = await response.json()
        setSupports(data)
      } else {
        toast.error("Error al cargar los soportes")
      }
    } catch (error) {
      toast.error("Error de conexión")
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
      style: "currency",
      currency: "EUR"
    }).format(price)
  }

  const ids = supports.map(i => i.id)
  const allSelected = ids.length > 0 && ids.every(id => selected[id])
  const someSelected = ids.some(id => selected[id]) && !allSelected
  const selectedIds = Object.keys(selected).filter(id => selected[id])
  const singleSelected = selectedIds.length === 1

  function toggleAll(checked: boolean) {
    const next: Record<string, boolean> = {}
    ids.forEach(id => { next[id] = checked })
    setSelected(next)
  }

  async function bulkUpdate(patch: any) {
    const ids = Object.keys(selected).filter(id => selected[id])
    await fetch('/api/soportes/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, action: 'update', data: patch })
    })
    fetchSupports()
    setSelected({})
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

  async function handleCsv(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    
    const fd = new FormData()
    fd.set('file', f)
    
    try {
      const response = await fetch('/api/soportes/import', { method: 'POST', body: fd })
      const result = await response.json()
      
      if (result.ok) {
        toast.success(`Importación completada: ${result.created} creados, ${result.updated} actualizados`)
        fetchSupports()
      } else {
        toast.error('Error en la importación')
      }
    } catch (error) {
      toast.error('Error en la importación')
    }
    
    setOpenImport(false)
    // Reset file input
    e.target.value = ''
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/panel/soportes" className="text-gray-600 hover:text-gray-800 mr-4">
              ← Soportes
            </Link>
            <div className="text-xl font-bold text-slate-800">Soportes</div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Buscar</span>
            <span className="text-gray-800 font-medium">admin</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
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
                  />
                  
                  {/* Filtros avanzados */}
                  <Select
                    value={statusFilter.length ? statusFilter.join(',') : 'all'}
                    onValueChange={(value) => setStatusFilter(value === 'all' ? [] : (value ? value.split(',') : []))}
                  >
                    <SelectTrigger className="w-48">
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
                <Dialog open={openImport} onOpenChange={setOpenImport}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Upload className="w-4 h-4 mr-2" />
                      Importar CSV
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Importar soportes (CSV)</DialogTitle>
                      <DialogDescription>
                        Columnas: code,title,type,widthM,heightM,city,country,priceMonth,status,owner,pricePerM2,imageUrl
                        <br/>
                        <a href="/api/soportes/import/template" className="underline">Descargar plantilla</a>
                      </DialogDescription>
                    </DialogHeader>
                    <input type="file" accept=".csv,text/csv" onChange={handleCsv} />
                  </DialogContent>
                </Dialog>
                
                <Button
                  variant="outline"
                  onClick={exportPDF}
                  disabled={!someSelected}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Catálogo PDF
                </Button>
                
                <Link href="/panel/soportes/nuevo">
                  <Button className="bg-[#D54644] hover:bg-[#B03A38]">
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Soporte
                  </Button>
                </Link>
                <div className="ml-2 inline-flex rounded-md border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-3 py-2 text-sm flex items-center gap-1 ${viewMode==='table' ? 'bg-gray-100 text-gray-900' : 'bg-white text-gray-600'}`}
                    aria-pressed={viewMode==='table'}
                  >
                    <List className="w-4 h-4" /> Tabla
                  </button>
                  <button
                    onClick={() => setViewMode('kanban')}
                    className={`px-3 py-2 text-sm flex items-center gap-1 border-l border-gray-200 ${viewMode==='kanban' ? 'bg-gray-100 text-gray-900' : 'bg-white text-gray-600'}`}
                    aria-pressed={viewMode==='kanban'}
                  >
                    <PanelsTopLeft className="w-4 h-4" /> Kanban
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Soportes ({supports.length})</CardTitle>
            <CardDescription>
              Lista de todos los soportes publicitarios
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Barra de acciones masivas */}
            {someSelected && (
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
                        <Label>Tipo</Label>
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
                  <Button variant="outline" onClick={exportPDF} disabled={!someSelected}>
                    <Download className="w-4 h-4 mr-2" />
                    Catálogo PDF
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
            ) : supports.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {q ? "No se encontraron soportes" : "No hay soportes registrados"}
              </div>
            ) : (
              viewMode === 'table' ? (
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
                    <TableHead>Tipo</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Dimensiones</TableHead>
                    <TableHead>Precio/Mes</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Propietario</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supports.map((support) => (
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
                            <span>{support.widthM}m × {support.heightM}m</span>
                          ) : (
                            <span className="text-gray-500">N/A</span>
                          )}
                          {support.areaM2 && (
                            <div className="text-xs text-gray-600">{support.areaM2} m²</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Euro className="w-3 h-3" />
                          {formatPrice(support.priceMonth)}
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
                            support.owner.trim().toLowerCase() === 'imagen' ? 'bg-rose-900 text-white' : 'bg-sky-700 text-white'
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
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Ver
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/panel/soportes/${support.id}`)}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(support.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Borrar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {Object.keys(STATUS_META).map((statusKey) => {
                  const status = statusKey as keyof typeof STATUS_META
                  const items = supports.filter(s => s.status === status)
                  return (
                    <div key={status} className="bg-white border rounded-lg">
                      <div className={`px-4 py-3 border-b text-sm font-semibold flex items-center justify-between ${STATUS_META[status].className}`}>
                        <span>{STATUS_META[status].label}</span>
                        <span className="text-xs opacity-80">{items.length}</span>
                      </div>
                      <div
                        className="p-3 min-h-[180px] space-y-3"
                        onDragOver={onDragOver}
                        onDrop={(e) => onDrop(e, status)}
                      >
                        {items.map(item => (
                          <div
                            key={item.id}
                            draggable
                            onDragStart={(e) => onDragStart(e, item.id)}
                            className="rounded-md border border-gray-200 bg-white shadow-sm p-3 cursor-move hover:shadow-md transition-shadow"
                            title={`${item.code} - ${item.title}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-0.5 font-mono text-xs text-gray-800 border border-neutral-200">
                                {item.code}
                              </span>
                              <span className="text-xs text-gray-500">{item.type}</span>
                            </div>
                            <div className="text-sm font-medium line-clamp-2">{item.title}</div>
                            <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {item.city}
                              </div>
                              <div className="flex items-center gap-1">
                                <Euro className="w-3 h-3" /> {formatPrice(item.priceMonth)}
                              </div>
                            </div>
                          </div>
                        ))}
                        {items.length === 0 && (
                          <div className="text-xs text-gray-400 text-center py-6">Sin elementos</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              )
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
