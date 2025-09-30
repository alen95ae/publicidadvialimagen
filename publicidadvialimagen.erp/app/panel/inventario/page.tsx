"use client"

import type React from "react"
import Link from "next/link"
import { 
  Plus, 
  Search, 
  Filter, 
  Package, 
  Edit, 
  Trash2, 
  Eye,
  MoreHorizontal,
  Download,
  Upload,
  ArrowLeft
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useState, useEffect } from "react"

// Categorías disponibles (ordenadas alfabéticamente)
const categorias = [
  "Categoria general",
  "Corte y grabado", 
  "Displays",
  "Impresion digital",
  "Insumos",
  "Mano de obra"
]

// Unidades de medida disponibles
const unidadesMedida = [
  "unidad",
  "m²",
  "kg",
  "hora",
  "metro",
  "litro",
  "pieza",
  "rollo",
  "pliego"
]

// Función para calcular el porcentaje de utilidad
function calcularPorcentajeUtilidad(coste: number, precioVenta: number): number {
  if (coste === 0) return 0
  return ((precioVenta - coste) / coste) * 100
}

// Datos de ejemplo para el inventario
const inventarioItems = [
  {
    id: 1,
    codigo: "INV-001",
    nombre: "Soporte Publicitario 6x3",
    responsable: "Juan Pérez",
    unidadMedida: "unidad",
    coste: 150.00,
    precioVenta: 250.00,
    categoria: "Displays",
    cantidad: 25,
    disponibilidad: "Disponible",
  },
  {
    id: 2,
    codigo: "INV-002", 
    nombre: "Banner Vinilo 2x1",
    responsable: "María García",
    unidadMedida: "m²",
    coste: 45.00,
    precioVenta: 75.00,
    categoria: "Impresion digital",
    cantidad: 0,
    disponibilidad: "Agotado"
  },
  {
    id: 3,
    codigo: "INV-003",
    nombre: "Estructura Metálica Base",
    responsable: "Carlos López",
    unidadMedida: "unidad",
    coste: 320.00,
    precioVenta: 450.00,
    categoria: "Categoria general",
    cantidad: 8,
    disponibilidad: "Bajo Stock"
  },
  {
    id: 4,
    codigo: "INV-004",
    nombre: "Tornillos Anclaje M8",
    responsable: "Ana Martínez",
    unidadMedida: "kg",
    coste: 12.50,
    precioVenta: 18.00,
    categoria: "Insumos",
    cantidad: 150,
    disponibilidad: "Disponible"
  },
  {
    id: 5,
    codigo: "INV-005",
    nombre: "Servicio de Corte Láser",
    responsable: "Pedro Ruiz",
    unidadMedida: "hora",
    coste: 25.00,
    precioVenta: 40.00,
    categoria: "Corte y grabado",
    cantidad: 0,
    disponibilidad: "Disponible"
  },
  {
    id: 6,
    codigo: "INV-006",
    nombre: "Instalación Publicitaria",
    responsable: "Laura Sánchez",
    unidadMedida: "hora",
    coste: 30.00,
    precioVenta: 50.00,
    categoria: "Mano de obra",
    cantidad: 0,
    disponibilidad: "Disponible"
  }
]

function getDisponibilidadBadge(disponibilidad: string) {
  switch (disponibilidad) {
    case "Disponible":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Disponible</Badge>
    case "Bajo Stock":
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Bajo Stock</Badge>
    case "Agotado":
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Agotado</Badge>
    default:
      return <Badge variant="secondary">{disponibilidad}</Badge>
  }
}


export default function InventarioPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [openImport, setOpenImport] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })

  // Cargar datos de la API al inicializar
  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async (page: number = currentPage) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.set('q', searchTerm)
      if (selectedCategory) params.set('categoria', selectedCategory)
      params.set('page', page.toString())
      params.set('limit', '25')
      
      console.log('Fetching inventario from:', `/api/inventario?${params.toString()}`)
      const response = await fetch(`/api/inventario?${params.toString()}`)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Received data:', result)
        setItems(result.data || [])
        setPagination(result.pagination || pagination)
        setCurrentPage(page)
      } else {
        const errorData = await response.json()
        console.error('Error al cargar inventario:', errorData)
        setItems([])
      }
    } catch (error) {
      console.error('Error de conexión:', error)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  // Recargar datos cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1)
    fetchItems(1)
  }, [searchTerm, selectedCategory])
  
  // Estados para edición masiva
  const [nombreDraft, setNombreDraft] = useState("")
  const [responsableDraft, setResponsableDraft] = useState("")
  const [costeDraft, setCosteDraft] = useState("")
  const [precioVentaDraft, setPrecioVentaDraft] = useState("")
  const [categoriaDraft, setCategoriaDraft] = useState<string | undefined>(undefined)
  const [cantidadDraft, setCantidadDraft] = useState("")
  const [disponibilidadDraft, setDisponibilidadDraft] = useState<string | undefined>(undefined)
  const [unidadDraft, setUnidadDraft] = useState("")
  
  // Estados para controlar popovers
  const [nombreOpen, setNombreOpen] = useState(false)
  const [responsableOpen, setResponsableOpen] = useState(false)
  const [costeOpen, setCosteOpen] = useState(false)
  const [precioVentaOpen, setPrecioVentaOpen] = useState(false)
  const [categoriaOpen, setCategoriaOpen] = useState(false)
  const [cantidadOpen, setCantidadOpen] = useState(false)
  const [disponibilidadOpen, setDisponibilidadOpen] = useState(false)
  const [unidadOpen, setUnidadOpen] = useState(false)

  // Filtrar items basado en búsqueda y categoría
  const filteredItems = items.filter(item => {
    const matchesSearch = searchTerm === "" || 
      item.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.categoria.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = selectedCategory === "" || item.categoria === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const handleClearFilters = () => {
    setSearchTerm("")
    setSelectedCategory("")
  }

  const handleResetData = () => {
    if (confirm("¿Estás seguro de que quieres resetear todos los datos del inventario a los valores por defecto?")) {
      // En una implementación real, aquí harías una llamada a la API para resetear
      fetchItems()
    }
  }

  // Funciones para edición masiva
  const ids = filteredItems.map(i => i.id)
  const allSelected = ids.length > 0 && ids.every(id => selected[id])
  const someSelected = ids.some(id => selected[id]) || allSelected
  const selectedIds = Object.keys(selected).filter(id => selected[id])

  function toggleAll(checked: boolean) {
    const next: Record<string, boolean> = {}
    ids.forEach(id => { next[id] = checked })
    setSelected(next)
  }

  async function bulkUpdate(patch: any) {
    const ids = Object.keys(selected).filter(id => selected[id])
    
    try {
      const response = await fetch('/api/inventario/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action: 'update', data: patch })
      })

      if (response.ok) {
        // Recargar los datos después de la actualización
        await fetchItems()
        setSelected({})
        
        // Limpiar los drafts
        setNombreDraft('')
        setResponsableDraft('')
        setCosteDraft('')
        setPrecioVentaDraft('')
        setCategoriaDraft(undefined)
        setCantidadDraft('')
        setDisponibilidadDraft(undefined)
        setUnidadDraft('')
      } else {
        console.error('Error al actualizar items')
      }
    } catch (error) {
      console.error('Error de conexión:', error)
    }
  }

  async function bulkDelete() {
    const ids = Object.keys(selected).filter(id => selected[id])
    if (!confirm(`¿Eliminar ${ids.length} items del inventario?`)) return
    
    try {
      const response = await fetch('/api/inventario/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action: 'delete' })
      })

      if (response.ok) {
        await fetchItems(currentPage)
        setSelected({})
      } else {
        console.error('Error al eliminar items')
      }
    } catch (error) {
      console.error('Error de conexión:', error)
    }
  }

  // Función para exportar datos
  const handleExport = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.set('q', searchTerm)
      if (selectedCategory) params.set('categoria', selectedCategory)
      
      const response = await fetch(`/api/inventario/export?${params.toString()}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `inventario_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('Error al exportar los datos')
      }
    } catch (error) {
      console.error('Error al exportar:', error)
      alert('Error al exportar los datos')
    }
  }

  // Funciones de paginación
  const handlePageChange = (page: number) => {
    fetchItems(page)
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

  // Función para manejar la importación de CSV
  const handleCsvImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    console.log('Iniciando importación de CSV:', file.name, file.size)
    setImportLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/inventario/import', {
        method: 'POST',
        body: formData
      })

      console.log('Respuesta del servidor:', response.status, response.statusText)
      const result = await response.json()
      console.log('Resultado:', result)
      
      if (response.ok) {
        alert(`Importación completada: ${result.created} creados, ${result.updated} actualizados${result.errors > 0 ? `, ${result.errors} errores` : ''}`)
        if (result.errorMessages && result.errorMessages.length > 0) {
          console.log('Errores detallados:', result.errorMessages)
          alert(`Errores encontrados:\n${result.errorMessages.slice(0, 5).join('\n')}`)
        }
        await fetchItems(currentPage)
        setOpenImport(false)
      } else {
        console.error('Error en la respuesta:', result)
        alert(`Error: ${result.error || 'Error desconocido'}`)
      }
    } catch (error) {
      console.error('Error al importar:', error)
      alert(`Error al importar el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setImportLoading(false)
      // Limpiar el input
      event.target.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/panel">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <Package className="h-6 w-6 text-[#D54644]" />
            <h1 className="text-2xl font-bold text-slate-800">Inventario</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleResetData}>
              Resetear Datos
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
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
                  <DialogTitle>Importar inventario (CSV)</DialogTitle>
                  <DialogDescription>
                    Columnas: codigo, nombre, descripcion, categoria, cantidad, unidad_medida, coste, precio_venta, responsable, disponibilidad
                    <br/>
                    <a href="/api/inventario/import/template" className="underline">Descargar plantilla</a>
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
            <Button className="bg-[#D54644] hover:bg-[#B73E3A]">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Item
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Filtros y búsqueda */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filtros y Búsqueda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por código, nombre o categoría..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filtrar por categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((categoria) => (
                      <SelectItem key={categoria} value={categoria}>
                        {categoria}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={handleClearFilters}>
                  Limpiar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de inventario */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Inventario ({filteredItems.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Barra de acciones masivas */}
            {someSelected && (
              <div className="mb-4 rounded-xl border bg-white p-3 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {selectedIds.length} seleccionados
                  </span>

                  {/* Cambiar nombre */}
                  <Popover open={nombreOpen} onOpenChange={setNombreOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="secondary">Cambiar nombre</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-2">
                        <Label>Nuevo nombre</Label>
                        <Input value={nombreDraft} onChange={e => setNombreDraft(e.target.value)} />
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => { setNombreDraft(''); setNombreOpen(false) }}>Cancelar</Button>
                          <Button size="sm" onClick={async () => { await bulkUpdate({ nombre: nombreDraft }); setNombreOpen(false) }}>Aplicar</Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Cambiar responsable */}
                  <Popover open={responsableOpen} onOpenChange={setResponsableOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="secondary">Cambiar responsable</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64">
                      <div className="space-y-2">
                        <Label>Nuevo responsable</Label>
                        <Input value={responsableDraft} onChange={e => setResponsableDraft(e.target.value)} />
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => { setResponsableDraft(''); setResponsableOpen(false) }}>Cancelar</Button>
                          <Button size="sm" onClick={async () => { await bulkUpdate({ responsable: responsableDraft }); setResponsableOpen(false) }}>Aplicar</Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Cambiar coste */}
                  <Popover open={costeOpen} onOpenChange={setCosteOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="secondary">Cambiar coste</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64">
                      <div className="space-y-2">
                        <Label>Nuevo coste (Bs)</Label>
                        <Input type="number" step="0.01" value={costeDraft} onChange={e => setCosteDraft(e.target.value)} />
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => { setCosteDraft(''); setCosteOpen(false) }}>Cancelar</Button>
                          <Button size="sm" onClick={async () => { await bulkUpdate({ coste: Number(costeDraft) }); setCosteOpen(false) }}>Aplicar</Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Cambiar precio de venta */}
                  <Popover open={precioVentaOpen} onOpenChange={setPrecioVentaOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="secondary">Cambiar precio venta</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64">
                      <div className="space-y-2">
                        <Label>Nuevo precio venta (Bs)</Label>
                        <Input type="number" step="0.01" value={precioVentaDraft} onChange={e => setPrecioVentaDraft(e.target.value)} />
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => { setPrecioVentaDraft(''); setPrecioVentaOpen(false) }}>Cancelar</Button>
                          <Button size="sm" onClick={async () => { await bulkUpdate({ precioVenta: Number(precioVentaDraft) }); setPrecioVentaOpen(false) }}>Aplicar</Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Cambiar categoría */}
                  <Popover open={categoriaOpen} onOpenChange={setCategoriaOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="secondary">Cambiar categoría</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64">
                      <div className="space-y-2">
                        <Label>Categoría</Label>
                        <Select value={categoriaDraft ?? ''} onValueChange={setCategoriaDraft}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona categoría" />
                          </SelectTrigger>
                          <SelectContent>
                            {categorias.map(cat => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => { setCategoriaDraft(undefined); setCategoriaOpen(false) }}>Cancelar</Button>
                          <Button size="sm" onClick={async () => { if(categoriaDraft){ await bulkUpdate({ categoria: categoriaDraft }); setCategoriaOpen(false) } }}>Aplicar</Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Cambiar cantidad */}
                  <Popover open={cantidadOpen} onOpenChange={setCantidadOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="secondary">Cambiar cantidad</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64">
                      <div className="space-y-2">
                        <Label>Nueva cantidad</Label>
                        <Input type="number" value={cantidadDraft} onChange={e => setCantidadDraft(e.target.value)} />
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => { setCantidadDraft(''); setCantidadOpen(false) }}>Cancelar</Button>
                          <Button size="sm" onClick={async () => { await bulkUpdate({ cantidad: Number(cantidadDraft) }); setCantidadOpen(false) }}>Aplicar</Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Cambiar disponibilidad */}
                  <Popover open={disponibilidadOpen} onOpenChange={setDisponibilidadOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="secondary">Cambiar disponibilidad</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64">
                      <div className="space-y-2">
                        <Label>Disponibilidad</Label>
                        <Select value={disponibilidadDraft ?? ''} onValueChange={setDisponibilidadDraft}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona disponibilidad" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Disponible">Disponible</SelectItem>
                            <SelectItem value="Bajo Stock">Bajo Stock</SelectItem>
                            <SelectItem value="Agotado">Agotado</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => { setDisponibilidadDraft(undefined); setDisponibilidadOpen(false) }}>Cancelar</Button>
                          <Button size="sm" onClick={async () => { if(disponibilidadDraft){ await bulkUpdate({ disponibilidad: disponibilidadDraft }); setDisponibilidadOpen(false) } }}>Aplicar</Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Cambiar unidad de medida */}
                  <Popover open={unidadOpen} onOpenChange={setUnidadOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="secondary">Cambiar unidad</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64">
                      <div className="space-y-2">
                        <Label>Unidad de medida</Label>
                        <Select value={unidadDraft} onValueChange={setUnidadDraft}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona unidad" />
                          </SelectTrigger>
                          <SelectContent>
                            {unidadesMedida.map(unidad => (
                              <SelectItem key={unidad} value={unidad}>{unidad}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => { setUnidadDraft(''); setUnidadOpen(false) }}>Cancelar</Button>
                          <Button size="sm" onClick={async () => { if(unidadDraft){ await bulkUpdate({ unidadMedida: unidadDraft }); setUnidadOpen(false) } }}>Aplicar</Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Button variant="destructive" onClick={bulkDelete}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </Button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-center py-8 text-gray-500">Cargando inventario...</div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm || selectedCategory ? "No se encontraron items" : "No hay items en el inventario"}
              </div>
            ) : (
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
                    <TableHead>Nombre</TableHead>
                    <TableHead>Responsable</TableHead>
                    <TableHead>Unidad</TableHead>
                    <TableHead>Coste</TableHead>
                    <TableHead>Precio Venta</TableHead>
                    <TableHead>% Utilidad</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Disponibilidad</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="w-10">
                        <Checkbox
                          checked={!!selected[item.id]}
                          onCheckedChange={(v) =>
                            setSelected(prev => ({ ...prev, [item.id]: Boolean(v) }))
                          }
                          aria-label={`Seleccionar ${item.codigo}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{item.codigo}</TableCell>
                      <TableCell>{item.nombre}</TableCell>
                      <TableCell>{item.responsable}</TableCell>
                      <TableCell>{item.unidad_medida}</TableCell>
                      <TableCell>Bs {item.coste.toFixed(2)}</TableCell>
                      <TableCell>Bs {item.precio_venta.toFixed(2)}</TableCell>
                      <TableCell>
                        <span className={`font-medium ${
                          calcularPorcentajeUtilidad(item.coste, item.precio_venta) >= 50 
                            ? 'text-green-600' 
                            : calcularPorcentajeUtilidad(item.coste, item.precio_venta) >= 20 
                            ? 'text-yellow-600' 
                            : 'text-red-600'
                        }`}>
                          {calcularPorcentajeUtilidad(item.coste, item.precio_venta).toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>{item.categoria}</TableCell>
                      <TableCell>
                        <span className="font-medium">{item.cantidad}</span>
                        <span className="text-gray-400 text-sm ml-1">{item.unidad_medida}</span>
                      </TableCell>
                      <TableCell>{getDisponibilidadBadge(item.disponibilidad)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
    </div>
  )
}
