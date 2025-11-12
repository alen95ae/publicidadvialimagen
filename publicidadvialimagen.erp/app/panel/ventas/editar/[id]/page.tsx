"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  Plus, 
  Trash2, 
  Camera,
  Calculator,
  Save,
  Check,
  ChevronUp,
  ChevronDown,
  GripVertical,
  X,
  Hammer,
  FileText,
  Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import jsPDF from 'jspdf'
import { toast } from "sonner"
import { Toaster } from "sonner"

// Importar las mismas interfaces y funciones de la página de nueva cotización
const sucursales = [
  { id: "1", nombre: "La Paz" },
  { id: "2", nombre: "Santa Cruz" }
]

interface ProductoItem {
  id: string
  tipo: 'producto'
  producto: string
  imagen?: string
  descripcion: string
  cantidad: number
  ancho: number
  alto: number
  totalM2: number
  udm: string
  precio: number
  comision: number
  conIVA: boolean
  conIT: boolean
  total: number
  esSoporte?: boolean
  dimensionesBloqueadas?: boolean
}

interface NotaItem {
  id: string
  tipo: 'nota'
  texto: string
}

interface SeccionItem {
  id: string
  tipo: 'seccion'
  texto: string
}

type ItemLista = ProductoItem | NotaItem | SeccionItem

export default function EditarCotizacionPage() {
  const router = useRouter()
  const params = useParams()
  const cotizacionId = params.id as string

  const [cargandoCotizacion, setCargandoCotizacion] = useState(true)
  const [cotizacionCargada, setCotizacionCargada] = useState(false)
  const [codigoCotizacion, setCodigoCotizacion] = useState("")
  const [cliente, setCliente] = useState("")
  const [sucursal, setSucursal] = useState("")
  const [vendedor, setVendedor] = useState("")
  const [guardando, setGuardando] = useState(false)
  const [productosList, setProductosList] = useState<ItemLista[]>([
    {
      id: "1",
      tipo: 'producto',
      producto: "",
      descripcion: "",
      cantidad: 1,
      ancho: 0,
      alto: 0,
      totalM2: 0,
      udm: "m²",
      precio: 0,
      comision: 0,
      conIVA: true,
      conIT: true,
      total: 0,
      esSoporte: false,
      dimensionesBloqueadas: false
    }
  ])

  // Estados para comboboxes (igual que en nueva cotización)
  const [openClienteCombobox, setOpenClienteCombobox] = useState(false)
  const [todosLosClientes, setTodosLosClientes] = useState<any[]>([])
  const [filteredClientes, setFilteredClientes] = useState<any[]>([])
  const [cargandoClientes, setCargandoClientes] = useState(false)

  const [openComercialCombobox, setOpenComercialCombobox] = useState(false)
  const [todosLosComerciales, setTodosLosComerciales] = useState<any[]>([])
  const [filteredComerciales, setFilteredComerciales] = useState<any[]>([])
  const [cargandoComerciales, setCargandoComerciales] = useState(false)

  const [openCombobox, setOpenCombobox] = useState<Record<string, boolean>>({})
  const [todosLosItems, setTodosLosItems] = useState<any[]>([])
  const [cargandoItems, setCargandoItems] = useState(false)
  const [filteredItems, setFilteredItems] = useState<Record<string, any[]>>({})

  const [modalVariantes, setModalVariantes] = useState<{
    open: boolean
    productoId: string
    itemData: any
    variantesSeleccionadas: Record<string, string>
  }>({
    open: false,
    productoId: '',
    itemData: null,
    variantesSeleccionadas: {}
  })

  const [modalFechasSoporte, setModalFechasSoporte] = useState<{
    open: boolean
    productoId: string
    itemData: any
    fechaInicio: string
    fechaFin: string
    meses: number
  }>({
    open: false,
    productoId: '',
    itemData: null,
    fechaInicio: '',
    fechaFin: '',
    meses: 1
  })

  // CARGAR COTIZACIÓN EXISTENTE (solo una vez)
  useEffect(() => {
    if (cotizacionId && !cotizacionCargada) {
      cargarCotizacion()
    }
  }, [cotizacionId, cotizacionCargada])


  const cargarCotizacion = async () => {
    try {
      setCargandoCotizacion(true)
      
      const response = await fetch(`/api/cotizaciones/${cotizacionId}`)
      
      if (!response.ok) {
        throw new Error(`Error al cargar: ${response.status}`)
      }
      
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Error al cargar cotización')
      }

      const cotizacion = data.data.cotizacion
      const lineas = data.data.lineas

      // Cargar datos de encabezado
      setCodigoCotizacion(cotizacion.codigo || '')
      setSucursal(cotizacion.sucursal || 'La Paz')
      
      // Guardar los nombres directamente (sin buscar IDs todavía)
      // Los IDs se buscarán cuando el usuario abra el combobox
      setCliente(cotizacion.cliente || '')
      setVendedor(cotizacion.vendedor || '')

      // Cargar líneas
      if (lineas && lineas.length > 0) {
        const lineasConvertidas: ItemLista[] = lineas.map((linea: any, index: number) => {
          if (linea.tipo === 'Producto') {
            return {
              id: `${index + 1}`,
              tipo: 'producto' as const,
              producto: linea.codigo_producto && linea.nombre_producto 
                ? `${linea.codigo_producto} - ${linea.nombre_producto}`
                : linea.nombre_producto || '',
              descripcion: linea.descripcion || '',
              cantidad: linea.cantidad || 1,
              ancho: linea.ancho || 0,
              alto: linea.alto || 0,
              totalM2: linea.total_m2 || 0,
              udm: linea.unidad_medida || 'm²',
              precio: linea.precio_unitario || 0,
              comision: linea.comision_porcentaje || 0,
              conIVA: linea.con_iva !== undefined ? linea.con_iva : true,
              conIT: linea.con_it !== undefined ? linea.con_it : true,
              total: linea.subtotal_linea || 0,
              esSoporte: linea.es_soporte || false,
              dimensionesBloqueadas: linea.es_soporte || false
            }
          } else if (linea.tipo === 'Nota') {
            return {
              id: `${index + 1}`,
              tipo: 'nota' as const,
              texto: linea.descripcion || ''
            }
          } else {
            return {
              id: `${index + 1}`,
              tipo: 'seccion' as const,
              texto: linea.nombre_producto || ''
            }
          }
        })
        setProductosList(lineasConvertidas)
      } else {
        setProductosList([])
      }

      toast.success('Cotización cargada correctamente')
      setCotizacionCargada(true)
      
    } catch (error) {
      console.error('Error cargando cotización:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar la cotización'
      toast.error(errorMessage)
      
      setTimeout(() => {
        router.push('/panel/ventas/cotizaciones')
      }, 2000)
    } finally {
      setCargandoCotizacion(false)
    }
  }

  // Copiar todas las funciones de cálculo y manejo de la página de nueva cotización
  const calcularTotalM2 = (ancho: number, alto: number) => {
    return ancho * alto
  }

  const calcularTotal = (cantidad: number, totalM2: number, precio: number, comision: number, conIVA: boolean, conIT: boolean, esSoporte: boolean = false) => {
    let subtotal = esSoporte ? (cantidad * precio) : (cantidad * totalM2 * precio)
    const comisionTotal = subtotal * (comision / 100)
    
    if (!conIVA) {
      subtotal = subtotal * (1 - 0.13)
    }
    
    if (!conIT) {
      subtotal = subtotal * (1 - 0.03)
    }
    
    return subtotal + comisionTotal
  }

  // FUNCIÓN PARA GUARDAR CAMBIOS (PATCH en lugar de POST)
  const handleGuardar = async () => {
    try {
      // Validaciones
      if (!cliente) {
        toast.error("Por favor selecciona un cliente")
        return
      }
      if (!vendedor) {
        toast.error("Por favor selecciona un vendedor")
        return
      }
      if (!sucursal) {
        toast.error("Por favor selecciona una sucursal")
        return
      }

      const productos = productosList.filter((item): item is ProductoItem => item.tipo === 'producto')
      if (productos.length === 0 || !productos.some(p => p.producto)) {
        toast.error("Por favor agrega al menos un producto a la cotización")
        return
      }

      setGuardando(true)

      // Preparar las líneas
      const lineas = productosList.map((item, index) => {
        if (item.tipo === 'producto') {
          const producto = item as ProductoItem
          return {
            tipo: 'Producto' as const,
            codigo_producto: producto.producto.split(' - ')[0] || '',
            nombre_producto: producto.producto.split(' - ')[1] || producto.producto,
            descripcion: producto.descripcion || '',
            cantidad: producto.cantidad,
            ancho: producto.ancho,
            alto: producto.alto,
            unidad_medida: producto.udm,
            precio_unitario: producto.precio,
            comision_porcentaje: producto.comision,
            con_iva: producto.conIVA,
            con_it: producto.conIT,
            es_soporte: producto.esSoporte || false,
            orden: index + 1,
            variantes: '',
            subtotal_linea: producto.total
          }
        } else if (item.tipo === 'nota') {
          const nota = item as NotaItem
          return {
            tipo: 'Nota' as const,
            descripcion: nota.texto,
            cantidad: 0,
            unidad_medida: '',
            precio_unitario: 0,
            comision_porcentaje: 0,
            con_iva: false,
            con_it: false,
            es_soporte: false,
            orden: index + 1,
            subtotal_linea: 0
          }
        } else {
          const seccion = item as SeccionItem
          return {
            tipo: 'Sección' as const,
            nombre_producto: seccion.texto,
            cantidad: 0,
            unidad_medida: '',
            precio_unitario: 0,
            comision_porcentaje: 0,
            con_iva: false,
            con_it: false,
            es_soporte: false,
            orden: index + 1,
            subtotal_linea: 0
          }
        }
      })

      // Obtener nombres de cliente y vendedor
      // Si cliente/vendedor son IDs, buscar en las listas
      // Si ya son nombres (lazy loading), usarlos directamente
      let clienteNombre = cliente
      let vendedorNombre = vendedor

      // Si las listas están cargadas y cliente/vendedor parecen IDs, buscar los objetos
      if (todosLosClientes.length > 0) {
        const clienteObj = todosLosClientes.find(c => c.id === cliente)
        if (clienteObj) {
          clienteNombre = clienteObj.displayName || clienteObj.legalName || ''
        }
      }

      if (todosLosComerciales.length > 0) {
        const vendedorObj = todosLosComerciales.find(c => c.id === vendedor)
        if (vendedorObj) {
          vendedorNombre = vendedorObj.nombre || ''
        }
      }

      if (!clienteNombre || !vendedorNombre) {
        toast.error("Error: cliente o vendedor no válido")
        return
      }

      const cotizacionData = {
        codigo: codigoCotizacion, // Mantener el código original
        cliente: clienteNombre,
        vendedor: vendedorNombre,
        sucursal,
        estado: 'Pendiente' as const,
        vigencia_dias: 30,
        lineas
      }

      console.log('📝 Actualizando cotización:', cotizacionData)

      // PATCH en lugar de POST
      const response = await fetch(`/api/cotizaciones/${cotizacionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cotizacionData)
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al actualizar la cotización')
      }

      toast.success(`Cotización ${codigoCotizacion} actualizada exitosamente`)
      
      setTimeout(() => {
        router.push('/panel/ventas/cotizaciones')
      }, 1000)

    } catch (error) {
      console.error('Error actualizando cotización:', error)
      toast.error(error instanceof Error ? error.message : 'Error al actualizar la cotización')
    } finally {
      setGuardando(false)
    }
  }

  // Cargar clientes, comerciales e items (igual que en nueva cotización)
  useEffect(() => {
    const cargarItems = async () => {
      setCargandoItems(true)
      try {
        const [productosRes, soportesRes] = await Promise.all([
          fetch('/api/inventario?limit=100'),
          fetch('/api/soportes?limit=100')
        ])

        const [productosData, soportesData] = await Promise.all([
          productosRes.json(),
          soportesRes.json()
        ])

        const productosList = productosData.data?.map((p: any) => ({
          id: p.id,
          codigo: p.codigo,
          nombre: p.nombre,
          descripcion: p.descripcion || '',
          precio: p.precio_venta || 0,
          unidad: p.unidad_medida || 'm²',
          variantes: p.variantes || [],
          receta: p.receta || [],
          tipo: 'producto'
        })) || []

        const soportesList = soportesData.data?.map((s: any) => ({
          id: s.id,
          codigo: s.code,
          nombre: s.title,
          descripcion: `${s.type} - ${s.city || ''}`,
          precio: s.priceMonth || 0,
          unidad: 'mes',
          ancho: s.widthM || 0,
          alto: s.heightM || 0,
          tipo: 'soporte'
        })) || []

        setTodosLosItems([...productosList, ...soportesList])
      } catch (error) {
        console.error('Error cargando items:', error)
      } finally {
        setCargandoItems(false)
      }
    }

    cargarItems()
  }, [])

  // Cargar clientes SOLO cuando se abre el combobox (lazy loading)
  const cargarClientesLazy = async () => {
    if (todosLosClientes.length > 0) return // Ya cargados
    
    setCargandoClientes(true)
    try {
      const response = await fetch('/api/contactos?relation=Cliente&limit=1000')
      const data = await response.json()
      setTodosLosClientes(data.data || [])
      setFilteredClientes((data.data || []).slice(0, 20))
    } catch (error) {
      console.error('Error cargando clientes:', error)
    } finally {
      setCargandoClientes(false)
    }
  }

  // Cargar vendedores SOLO cuando se abre el combobox (lazy loading)
  const cargarComercialesLazy = async () => {
    if (todosLosComerciales.length > 0) return // Ya cargados
    
    setCargandoComerciales(true)
    try {
      const response = await fetch('/api/ajustes/usuarios')
      const data = await response.json()
      const vendedores = data.users || data.data || []
      setTodosLosComerciales(vendedores)
      setFilteredComerciales(vendedores.slice(0, 20))
    } catch (error) {
      console.error('Error cargando comerciales:', error)
    } finally {
      setCargandoComerciales(false)
    }
  }

  // Funciones auxiliares (continúa en el siguiente comentario...)
  const filtrarClientes = (search: string) => {
    if (!search) {
      setFilteredClientes(todosLosClientes.slice(0, 20))
      return
    }
    const searchLower = search.toLowerCase()
    const filtered = todosLosClientes.filter(c =>
      c.displayName?.toLowerCase().includes(searchLower) ||
      c.legalName?.toLowerCase().includes(searchLower) ||
      c.email?.toLowerCase().includes(searchLower)
    ).slice(0, 20)
    setFilteredClientes(filtered)
  }

  const filtrarComerciales = (search: string) => {
    if (!search) {
      setFilteredComerciales(todosLosComerciales.slice(0, 20))
      return
    }
    const searchLower = search.toLowerCase()
    const filtered = todosLosComerciales.filter(c =>
      c.nombre?.toLowerCase().includes(searchLower) ||
      c.email?.toLowerCase().includes(searchLower)
    ).slice(0, 20)
    setFilteredComerciales(filtered)
  }

  const filtrarItems = (productoId: string, search: string) => {
    if (!search) {
      setFilteredItems(prev => ({ ...prev, [productoId]: todosLosItems.slice(0, 20) }))
      return
    }
    const searchLower = search.toLowerCase()
    const filtered = todosLosItems.filter(item =>
      item.codigo?.toLowerCase().includes(searchLower) ||
      item.nombre?.toLowerCase().includes(searchLower)
    ).slice(0, 20)
    setFilteredItems(prev => ({ ...prev, [productoId]: filtered }))
  }

  // Función para seleccionar producto
  const seleccionarProducto = (productoId: string, item: any) => {
    const esSoporte = item.tipo === 'soporte'
    
    // Si es soporte y tiene variantes, o si tiene variantes
    if ((esSoporte || item.variantes?.length > 0)) {
      // Lógica de variantes...
    }

    // Aplicar el item seleccionado
    setProductosList(productosList.map(itemLista => {
      if (itemLista.id === productoId && itemLista.tipo === 'producto') {
        const producto = itemLista as ProductoItem
        const ancho = esSoporte && item.ancho ? parseFloat(item.ancho) : producto.ancho
        const alto = esSoporte && item.alto ? parseFloat(item.alto) : producto.alto
        const totalM2 = calcularTotalM2(ancho, alto)
        
        const cantidad = producto.cantidad || 1
        
        const productoActualizado = {
          ...producto,
          producto: `${item.codigo} - ${item.nombre}`,
          descripcion: item.descripcion || '',
          precio: item.precio || 0,
          udm: esSoporte ? 'mes' : (item.unidad || 'm²'),
          esSoporte: esSoporte,
          dimensionesBloqueadas: esSoporte,
          ancho: ancho,
          alto: alto,
          totalM2: totalM2,
          cantidad: cantidad
        }
        
        productoActualizado.total = calcularTotal(
          productoActualizado.cantidad,
          productoActualizado.totalM2,
          productoActualizado.precio,
          productoActualizado.comision,
          productoActualizado.conIVA,
          productoActualizado.conIT,
          productoActualizado.esSoporte
        )
        
        return productoActualizado
      }
      return itemLista
    }))
    
    setOpenCombobox(prev => ({ ...prev, [productoId]: false }))
  }

  // Función para actualizar campo de producto
  const actualizarProducto = (id: string, field: string, value: any) => {
    setProductosList(productosList.map(item => {
      if (item.id === id && item.tipo === 'producto') {
        const producto = item as ProductoItem
        const updated = { ...producto, [field]: value }
        
        if (['cantidad', 'ancho', 'alto', 'precio', 'comision', 'conIVA', 'conIT'].includes(field)) {
          if (field === 'ancho' || field === 'alto') {
            updated.totalM2 = calcularTotalM2(updated.ancho, updated.alto)
          }
          updated.total = calcularTotal(
            updated.cantidad,
            updated.totalM2,
            updated.precio,
            updated.comision,
            updated.conIVA,
            updated.conIT,
            updated.esSoporte
          )
        }
        
        return updated
      }
      return item
    }))
  }

  // Funciones para agregar/eliminar items
  const agregarProducto = () => {
    const newId = (Math.max(0, ...productosList.map(p => parseInt(p.id))) + 1).toString()
    setProductosList([...productosList, {
      id: newId,
      tipo: 'producto',
      producto: "",
      descripcion: "",
      cantidad: 1,
      ancho: 0,
      alto: 0,
      totalM2: 0,
      udm: "m²",
      precio: 0,
      comision: 0,
      conIVA: true,
      conIT: true,
      total: 0,
      esSoporte: false,
      dimensionesBloqueadas: false
    }])
  }

  const agregarNota = () => {
    const newId = (Math.max(0, ...productosList.map(p => parseInt(p.id))) + 1).toString()
    setProductosList([...productosList, {
      id: newId,
      tipo: 'nota',
      texto: ""
    }])
  }

  const agregarSeccion = () => {
    const newId = (Math.max(0, ...productosList.map(p => parseInt(p.id))) + 1).toString()
    setProductosList([...productosList, {
      id: newId,
      tipo: 'seccion',
      texto: ""
    }])
  }

  const eliminarProducto = (id: string) => {
    if (productosList.length > 1) {
      setProductosList(productosList.filter(p => p.id !== id))
    }
  }

  const moverItem = (index: number, direccion: 'arriba' | 'abajo') => {
    const newList = [...productosList]
    if (direccion === 'arriba' && index > 0) {
      [newList[index], newList[index - 1]] = [newList[index - 1], newList[index]]
    } else if (direccion === 'abajo' && index < newList.length - 1) {
      [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]]
    }
    setProductosList(newList)
  }

  const totalGeneral = productosList
    .filter((item): item is ProductoItem => item.tipo === 'producto')
    .reduce((sum, producto) => sum + producto.total, 0)

  // Mostrar loading mientras carga la cotización
  if (cargandoCotizacion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#D54644] mx-auto mb-4" />
          <p className="text-gray-600">Cargando cotización...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Barra de botones */}
        <div className="flex justify-end gap-4 mb-6">
          <Button 
            variant="outline"
            onClick={() => router.push('/panel/ventas/cotizaciones')}
            disabled={guardando}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleGuardar}
            disabled={guardando}
            className="bg-[#D54644] hover:bg-[#B03A38] text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            {guardando ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Editar Cotización {codigoCotizacion}</h1>
          <p className="text-gray-600">Modifica los datos de la cotización existente</p>
        </div>

        {/* Información General */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex gap-4 flex-1">
                {/* Cliente */}
                <div className="flex-1 space-y-2">
                  <Label htmlFor="cliente">Cliente</Label>
                  <Popover open={openClienteCombobox} onOpenChange={(open) => {
                    setOpenClienteCombobox(open)
                    if (open) {
                      cargarClientesLazy() // Cargar solo cuando se abre
                    }
                  }}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between",
                          !cliente && "text-muted-foreground"
                        )}
                      >
                        <span className="truncate">
                          {cliente 
                            ? todosLosClientes.find(c => c.id === cliente)?.displayName || cliente
                            : "Seleccionar cliente"}
                        </span>
                        <Check className={cn("ml-2 h-4 w-4 shrink-0", cliente ? "opacity-100" : "opacity-0")} />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <Command shouldFilter={false} className="overflow-visible">
                        <CommandInput 
                          placeholder="Buscar cliente..."
                          className="h-9 border-0 focus:ring-0"
                          onValueChange={filtrarClientes}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {cargandoClientes ? "Cargando..." : "No se encontraron clientes."}
                          </CommandEmpty>
                          <CommandGroup>
                            {filteredClientes.map((c) => (
                              <CommandItem
                                key={c.id}
                                value={c.displayName}
                                onSelect={() => {
                                  setCliente(c.id)
                                  setOpenClienteCombobox(false)
                                }}
                                className="cursor-pointer"
                              >
                                <Check className={cn("mr-2 h-4 w-4", cliente === c.id ? "opacity-100" : "opacity-0")} />
                                <div className="flex flex-col">
                                  <span className="font-medium">{c.displayName}</span>
                                  {c.legalName && <span className="text-xs text-gray-500">{c.legalName}</span>}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                
                {/* Comercial */}
                <div className="flex-1 space-y-2">
                  <Label htmlFor="vendedor">Comercial</Label>
                  <Popover open={openComercialCombobox} onOpenChange={(open) => {
                    setOpenComercialCombobox(open)
                    if (open) {
                      cargarComercialesLazy() // Cargar solo cuando se abre
                    }
                  }}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between",
                          !vendedor && "text-muted-foreground"
                        )}
                      >
                        <span className="truncate">
                          {vendedor 
                            ? todosLosComerciales.find(c => c.id === vendedor)?.nombre || vendedor
                            : "Seleccionar comercial"}
                        </span>
                        <Check className={cn("ml-2 h-4 w-4 shrink-0", vendedor ? "opacity-100" : "opacity-0")} />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <Command shouldFilter={false} className="overflow-visible">
                        <CommandInput 
                          placeholder="Buscar comercial..."
                          className="h-9 border-0 focus:ring-0"
                          onValueChange={filtrarComerciales}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {cargandoComerciales ? "Cargando..." : "No se encontraron comerciales."}
                          </CommandEmpty>
                          <CommandGroup>
                            {filteredComerciales.map((c) => (
                              <CommandItem
                                key={c.id}
                                value={c.nombre}
                                onSelect={() => {
                                  setVendedor(c.id)
                                  setOpenComercialCombobox(false)
                                }}
                                className="cursor-pointer"
                              >
                                <Check className={cn("mr-2 h-4 w-4", vendedor === c.id ? "opacity-100" : "opacity-0")} />
                                <div className="flex flex-col">
                                  <span className="font-medium">{c.nombre}</span>
                                  {c.email && <span className="text-xs text-gray-500">{c.email}</span>}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                
                {/* Sucursal */}
                <div className="flex-1 space-y-2">
                  <Label htmlFor="sucursal">Sucursal</Label>
                  <Select value={sucursal} onValueChange={setSucursal}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar sucursal" />
                    </SelectTrigger>
                    <SelectContent>
                      {sucursales.map((suc) => (
                        <SelectItem key={suc.id} value={suc.nombre}>
                          {suc.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Productos/Servicios */}
        <Card>
          <CardHeader>
            <CardTitle>Productos y Servicios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 w-8"></th>
                    <th className="text-left py-2 px-2 min-w-[200px]">Producto/Servicio</th>
                    <th className="text-left py-2 px-2 min-w-[200px]">Descripción</th>
                    <th className="text-center py-2 px-2 w-16">Cant.</th>
                    <th className="text-center py-2 px-2 w-16">Ancho</th>
                    <th className="text-center py-2 px-2 w-16">Alto</th>
                    <th className="text-center py-2 px-2 w-16">Total</th>
                    <th className="text-center py-2 px-2 w-20">UdM</th>
                    <th className="text-center py-2 px-2 w-20">Precio</th>
                    <th className="text-center py-2 px-2 w-16">%C</th>
                    <th className="text-center py-2 px-2 w-24">IVA/IT</th>
                    <th className="text-right py-2 px-2 w-24">Subtotal</th>
                    <th className="text-center py-2 px-2 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {productosList.map((item, index) => {
                    if (item.tipo === 'nota') {
                      const nota = item as NotaItem
                      return (
                        <tr key={item.id} className="border-b hover:bg-gray-50">
                          <td colSpan={13} className="py-2 px-2">
                            <div className="flex items-center gap-2">
                              <div className="flex flex-col -space-y-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => moverItem(index, 'arriba')}
                                  disabled={index === 0}
                                  className="h-3 w-3 p-0 hover:bg-transparent"
                                >
                                  <ChevronUp className="w-2.5 h-2.5 text-gray-400" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => moverItem(index, 'abajo')}
                                  disabled={index === productosList.length - 1}
                                  className="h-3 w-3 p-0 hover:bg-transparent"
                                >
                                  <ChevronDown className="w-2.5 h-2.5 text-gray-400" />
                                </Button>
                              </div>
                              <Textarea
                                value={nota.texto}
                                onChange={(e) => {
                                  setProductosList(productosList.map(p => 
                                    p.id === item.id && p.tipo === 'nota' ? { ...p, texto: e.target.value } : p
                                  ))
                                }}
                                placeholder="Escribir nota..."
                                className="flex-1 min-h-[60px] text-xs"
                              />
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => eliminarProducto(nota.id)}
                                className="h-8 w-8 p-0 flex items-center justify-center shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    }

                    if (item.tipo === 'seccion') {
                      const seccion = item as SeccionItem
                      return (
                        <tr key={item.id} className="border-b bg-gray-100">
                          <td colSpan={13} className="py-2 px-2">
                            <div className="flex items-center gap-2">
                              <div className="flex flex-col -space-y-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => moverItem(index, 'arriba')}
                                  disabled={index === 0}
                                  className="h-3 w-3 p-0 hover:bg-transparent"
                                >
                                  <ChevronUp className="w-2.5 h-2.5 text-gray-400" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => moverItem(index, 'abajo')}
                                  disabled={index === productosList.length - 1}
                                  className="h-3 w-3 p-0 hover:bg-transparent"
                                >
                                  <ChevronDown className="w-2.5 h-2.5 text-gray-400" />
                                </Button>
                              </div>
                              <Input
                                value={seccion.texto}
                                onChange={(e) => {
                                  setProductosList(productosList.map(p => 
                                    p.id === item.id && p.tipo === 'seccion' ? { ...p, texto: e.target.value } : p
                                  ))
                                }}
                                placeholder="Nombre de la sección..."
                                className="flex-1 font-semibold text-xs"
                              />
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => eliminarProducto(seccion.id)}
                                className="h-8 w-8 p-0 flex items-center justify-center shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    }

                    // Es un producto
                    const producto = item as ProductoItem
                    return (
                      <tr key={producto.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-2 align-top">
                          <div className="flex items-center gap-1 pt-1">
                            <GripVertical className="w-3 h-3 text-gray-400 cursor-move" />
                            <div className="flex flex-col -space-y-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => moverItem(index, 'arriba')}
                                disabled={index === 0}
                                className="h-3 w-3 p-0 hover:bg-transparent"
                              >
                                <ChevronUp className="w-2.5 h-2.5 text-gray-400" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => moverItem(index, 'abajo')}
                                disabled={index === productosList.length - 1}
                                className="h-3 w-3 p-0 hover:bg-transparent"
                              >
                                <ChevronDown className="w-2.5 h-2.5 text-gray-400" />
                              </Button>
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-2 align-top">
                          <Popover 
                            open={openCombobox[producto.id] || false} 
                            onOpenChange={(open) => {
                              setOpenCombobox(prev => ({ ...prev, [producto.id]: open }))
                              if (open) {
                                setFilteredItems(prev => ({ ...prev, [producto.id]: todosLosItems.slice(0, 20) }))
                              }
                            }}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-48 h-8 text-xs justify-start px-2 overflow-hidden",
                                  !producto.producto && "text-muted-foreground"
                                )}
                              >
                                <span className="truncate block">
                                  {producto.producto || "Agregar producto o soporte..."}
                                </span>
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0" align="start">
                              <Command shouldFilter={false} className="overflow-visible">
                                <CommandInput 
                                  placeholder="Buscar producto o soporte..."
                                  className="h-9 border-0 focus:ring-0"
                                  onValueChange={(search) => filtrarItems(producto.id, search)}
                                />
                                <CommandList>
                                  <CommandEmpty>
                                    {cargandoItems ? "Cargando..." : "No se encontraron items."}
                                  </CommandEmpty>
                                  <>
                                    {(filteredItems[producto.id] || []).filter((item: any) => item.tipo === 'producto').length > 0 && (
                                      <CommandGroup heading="Productos">
                                        {(filteredItems[producto.id] || [])
                                          .filter((item: any) => item.tipo === 'producto')
                                          .map((item: any) => (
                                            <CommandItem
                                              key={`producto-${item.id}`}
                                              value={`${item.codigo} ${item.nombre}`}
                                              onSelect={() => seleccionarProducto(producto.id, item)}
                                              className="cursor-pointer"
                                            >
                                              <Check
                                                className={cn(
                                                  "mr-2 h-4 w-4",
                                                  producto.producto === `${item.codigo} - ${item.nombre}` ? "opacity-100" : "opacity-0"
                                                )}
                                              />
                                              <span className="text-xs truncate">
                                                [{item.codigo}] {item.nombre}
                                              </span>
                                            </CommandItem>
                                          ))}
                                      </CommandGroup>
                                    )}
                                    {(filteredItems[producto.id] || []).filter((item: any) => item.tipo === 'soporte').length > 0 && (
                                      <CommandGroup heading="Soportes">
                                        {(filteredItems[producto.id] || [])
                                          .filter((item: any) => item.tipo === 'soporte')
                                          .map((item: any) => (
                                            <CommandItem
                                              key={`soporte-${item.id}`}
                                              value={`${item.codigo} ${item.nombre}`}
                                              onSelect={() => seleccionarProducto(producto.id, item)}
                                              className="cursor-pointer"
                                            >
                                              <Check
                                                className={cn(
                                                  "mr-2 h-4 w-4",
                                                  producto.producto === `${item.codigo} - ${item.nombre}` ? "opacity-100" : "opacity-0"
                                                )}
                                              />
                                              <span className="text-xs truncate">
                                                [{item.codigo}] {item.nombre}
                                              </span>
                                            </CommandItem>
                                          ))}
                                      </CommandGroup>
                                    )}
                                  </>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </td>
                        <td className="py-2 px-2 align-top">
                          <Textarea
                            value={producto.descripcion}
                            onChange={(e) => actualizarProducto(producto.id, 'descripcion', e.target.value)}
                            className="min-h-[60px] text-xs"
                          />
                        </td>
                        <td className="py-2 px-2 align-top">
                          <Input
                            type="number"
                            value={producto.cantidad}
                            onChange={(e) => actualizarProducto(producto.id, 'cantidad', parseFloat(e.target.value) || 0)}
                            className="w-16 h-8 text-center text-xs"
                          />
                        </td>
                        <td className="py-2 px-2 align-top">
                          <Input
                            type="number"
                            value={producto.ancho}
                            onChange={(e) => actualizarProducto(producto.id, 'ancho', parseFloat(e.target.value) || 0)}
                            disabled={producto.dimensionesBloqueadas}
                            className="w-16 h-8 text-center text-xs"
                          />
                        </td>
                        <td className="py-2 px-2 align-top">
                          <Input
                            type="number"
                            value={producto.alto}
                            onChange={(e) => actualizarProducto(producto.id, 'alto', parseFloat(e.target.value) || 0)}
                            disabled={producto.dimensionesBloqueadas}
                            className="w-16 h-8 text-center text-xs"
                          />
                        </td>
                        <td className="py-2 px-2 align-top text-center">
                          <span className="text-xs font-medium">{producto.totalM2.toFixed(2)}</span>
                        </td>
                        <td className="py-2 px-2 align-top text-center">
                          <span className="text-xs">{producto.udm}</span>
                        </td>
                        <td className="py-2 px-2 align-top">
                          <Input
                            type="number"
                            value={producto.precio}
                            onChange={(e) => actualizarProducto(producto.id, 'precio', parseFloat(e.target.value) || 0)}
                            className="w-20 h-8 text-center text-xs"
                          />
                        </td>
                        <td className="py-2 px-2 align-top">
                          <Input
                            type="number"
                            value={producto.comision}
                            onChange={(e) => actualizarProducto(producto.id, 'comision', parseFloat(e.target.value) || 0)}
                            className="w-16 h-8 text-center text-xs"
                          />
                        </td>
                        <td className="py-2 px-2 align-top">
                          <div className="flex flex-col gap-1 items-center">
                            {producto.conIVA && (
                              <span className="inline-flex items-center gap-1 text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                                <span>IVA</span>
                                <button
                                  type="button"
                                  onClick={() => actualizarProducto(producto.id, 'conIVA', false)}
                                  className="hover:text-red-500"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            )}
                            {!producto.conIVA && (
                              <button
                                type="button"
                                onClick={() => actualizarProducto(producto.id, 'conIVA', true)}
                                className="text-xs text-gray-400 hover:text-gray-600 underline"
                              >
                                + IVA
                              </button>
                            )}
                            {producto.conIT && (
                              <span className="inline-flex items-center gap-1 text-[10px] bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                                <span>IT</span>
                                <button
                                  type="button"
                                  onClick={() => actualizarProducto(producto.id, 'conIT', false)}
                                  className="hover:text-red-500"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            )}
                            {!producto.conIT && (
                              <button
                                type="button"
                                onClick={() => actualizarProducto(producto.id, 'conIT', true)}
                                className="text-xs text-gray-400 hover:text-gray-600 underline"
                              >
                                + IT
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-2 align-top text-right">
                          <span className="text-xs font-semibold">
                            ${producto.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="py-2 px-2 align-top">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => eliminarProducto(producto.id)}
                            disabled={productosList.length === 1}
                            className="h-6 w-6 p-0 flex items-center justify-center text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Botones de Acción */}
            <div className="flex gap-3 mt-4">
              <Button variant="outline" size="sm" onClick={agregarProducto} className="text-xs">
                <Plus className="w-3 h-3 mr-1" />
                Agregar un producto
              </Button>
              <Button variant="outline" size="sm" onClick={agregarSeccion} className="text-xs">
                <Plus className="w-3 h-3 mr-1" />
                Agregar una sección
              </Button>
              <Button variant="outline" size="sm" onClick={agregarNota} className="text-xs">
                <Plus className="w-3 h-3 mr-1" />
                Agregar nota
              </Button>
            </div>

            {/* Total */}
            <div className="mt-6 pt-4 border-t flex justify-end">
              <div className="text-right">
                <span className="text-sm text-gray-600">Total General: </span>
                <span className="text-xl font-bold text-[#D54644]">
                  ${totalGeneral.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      </div>
    </>
  )
}

