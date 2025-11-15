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

  // ESTADOS ESPECÍFICOS DE EDITAR
  const [cargandoCotizacion, setCargandoCotizacion] = useState(true)
  const [cotizacionCargada, setCotizacionCargada] = useState(false)
  const [codigoCotizacion, setCodigoCotizacion] = useState("")

  // Estados comunes con nueva cotización
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

  const calcularTotalM2 = (ancho: number, alto: number) => {
    return ancho * alto
  }

  const calcularTotal = (cantidad: number, totalM2: number, precio: number, comision: number, conIVA: boolean, conIT: boolean, esSoporte: boolean = false) => {
    // Para soportes: cantidad × precio (sin totalM2)
    // Para productos: cantidad × totalM2 × precio
    let subtotal = esSoporte ? (cantidad * precio) : (cantidad * totalM2 * precio)
    const comisionTotal = subtotal * (comision / 100)
    
    // Si no tiene IVA, descontar 13%
    if (!conIVA) {
      subtotal = subtotal * (1 - 0.13)
    }
    
    // Si no tiene IT, descontar 3%
    if (!conIT) {
      subtotal = subtotal * (1 - 0.03)
    }
    
    return subtotal + comisionTotal
  }

  // Función para calcular el precio ajustado según variantes de mano de obra
  const calcularPrecioConVariantes = async (precioBase: number, item: any, variantes: Record<string, string>): Promise<number> => {
    // Si no hay variantes, retornar el precio base
    if (!variantes || Object.keys(variantes).length === 0) {
      return precioBase
    }

    // Si no hay receta, retornar el precio base
    if (!item.receta || !Array.isArray(item.receta) || item.receta.length === 0) {
      return precioBase
    }

    try {
      // Cargar recursos para obtener información de categoría
      const recursosRes = await fetch('/api/recursos')
      if (!recursosRes.ok) {
        return precioBase
      }
      const recursosData = await recursosRes.json()
      const recursos = recursosData.data || []

      // Crear un mapa de recursos por ID para acceso rápido
      const recursosMap = new Map(recursos.map((r: any) => [r.id, r]))

      let precioAjustado = precioBase
      let precioManoObraTotal = 0

      // Recorrer la receta para encontrar recursos de mano de obra
      for (const itemReceta of item.receta) {
        const recursoId = itemReceta.recurso_id || itemReceta.recursoId
        if (!recursoId) continue

        const recurso = recursosMap.get(recursoId)
        if (!recurso) continue

        // Verificar si el recurso es de categoría "Mano de Obra"
        const categoria = (recurso.categoria || '').toLowerCase().trim()
        if (categoria !== 'mano de obra') {
          continue
        }

        // Buscar si hay una variante que corresponda a este recurso
        const nombreRecurso = (recurso.nombre || '').toLowerCase()
        const codigoRecurso = (recurso.codigo || '').toLowerCase()

        let varianteEncontrada: { nombre: string; valor: string } | null = null
        for (const [nombreVariante, valorVariante] of Object.entries(variantes)) {
          const nombreVarianteLower = nombreVariante.toLowerCase()
          if (nombreVarianteLower.includes(nombreRecurso) || 
              nombreRecurso.includes(nombreVarianteLower) ||
              nombreVarianteLower.includes(codigoRecurso) ||
              codigoRecurso.includes(nombreVarianteLower)) {
            varianteEncontrada = { nombre: nombreVariante, valor: valorVariante as string }
            break
          }
        }

        if (!varianteEncontrada && itemReceta.recurso_nombre) {
          const recursoNombreReceta = (itemReceta.recurso_nombre || '').toLowerCase()
          for (const [nombreVariante, valorVariante] of Object.entries(variantes)) {
            const nombreVarianteLower = nombreVariante.toLowerCase()
            if (nombreVarianteLower.includes(recursoNombreReceta) || 
                recursoNombreReceta.includes(nombreVarianteLower)) {
              varianteEncontrada = { nombre: nombreVariante, valor: valorVariante as string }
              break
            }
          }
        }

        if (varianteEncontrada) {
          const valorVariante = varianteEncontrada.valor.toLowerCase().trim()
          if (valorVariante === 'no') {
            const cantidadReceta = parseFloat(itemReceta.cantidad) || 0
            const costeRecurso = parseFloat(recurso.coste) || 0
            const precioRecurso = cantidadReceta * costeRecurso
            precioManoObraTotal += precioRecurso
          }
        }
      }

      precioAjustado = precioBase - precioManoObraTotal
      return Math.max(0, precioAjustado)
    } catch (error) {
      console.error('Error calculando precio con variantes:', error)
      return precioBase
    }
  }

  const agregarProducto = () => {
    const nuevoProducto: ProductoItem = {
      id: Date.now().toString(),
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
    setProductosList([...productosList, nuevoProducto])
  }

  const agregarNota = () => {
    const nuevaNota: NotaItem = {
      id: Date.now().toString(),
      tipo: 'nota',
      texto: ""
    }
    setProductosList([...productosList, nuevaNota])
  }

  const agregarSeccion = () => {
    const nuevaSeccion: SeccionItem = {
      id: Date.now().toString(),
      tipo: 'seccion',
      texto: ""
    }
    setProductosList([...productosList, nuevaSeccion])
  }

  const eliminarProducto = (id: string) => {
    if (productosList.length > 1) {
      setProductosList(productosList.filter(p => p.id !== id))
    }
  }

  const actualizarNota = (id: string, texto: string) => {
    setProductosList(productosList.map(item => {
      if (item.id === id && item.tipo === 'nota') {
        return { ...item, texto }
      }
      return item
    }))
  }

  const actualizarSeccion = (id: string, texto: string) => {
    setProductosList(productosList.map(item => {
      if (item.id === id && item.tipo === 'seccion') {
        return { ...item, texto }
      }
      return item
    }))
  }

  const moverItem = (index: number, direccion: 'arriba' | 'abajo') => {
    const newIndex = direccion === 'arriba' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= productosList.length) return
    
    const newList = [...productosList]
    const [movedItem] = newList.splice(index, 1)
    newList.splice(newIndex, 0, movedItem)
    setProductosList(newList)
  }

  // Estados para drag and drop
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  // Estados para el combobox de clientes
  const [openClienteCombobox, setOpenClienteCombobox] = useState(false)
  const [todosLosClientes, setTodosLosClientes] = useState<any[]>([])
  const [filteredClientes, setFilteredClientes] = useState<any[]>([])
  const [cargandoClientes, setCargandoClientes] = useState(false)

  // Estados para el combobox de comerciales
  const [openComercialCombobox, setOpenComercialCombobox] = useState(false)
  const [todosLosComerciales, setTodosLosComerciales] = useState<any[]>([])
  const [filteredComerciales, setFilteredComerciales] = useState<any[]>([])
  const [cargandoComerciales, setCargandoComerciales] = useState(false)

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === dropIndex) return
    
    const newList = [...productosList]
    const [movedItem] = newList.splice(draggedIndex, 1)
    newList.splice(dropIndex, 0, movedItem)
    setProductosList(newList)
    setDraggedIndex(null)
  }

  const actualizarProducto = (id: string, campo: keyof ProductoItem, valor: any) => {
    setProductosList(productosList.map(item => {
      if (item.id === id && item.tipo === 'producto') {
        const producto = item as ProductoItem
        // No permitir cambiar ancho/alto si están bloqueadas (dimensiones de soporte)
        if ((campo === 'ancho' || campo === 'alto') && producto.dimensionesBloqueadas) {
          return producto
        }
        
        // Asegurar que cantidad sea mínimo 1 (solo si no es string vacío)
        if (campo === 'cantidad' && valor !== '' && valor < 1) {
          valor = 1
        }
        
        const productoActualizado = { ...producto, [campo]: valor }
        
        // Recalcular totalM2 si cambian ancho o alto (solo si no son strings vacíos)
        if (campo === 'ancho' || campo === 'alto') {
          const anchoVal = campo === 'ancho' ? (valor === '' ? 0 : valor) : producto.ancho
          const altoVal = campo === 'alto' ? (valor === '' ? 0 : valor) : producto.alto
          productoActualizado.totalM2 = calcularTotalM2(anchoVal, altoVal)
        }
        
        // Recalcular total si cambian los valores relevantes (convertir strings vacíos a 0)
        if (['cantidad', 'ancho', 'alto', 'precio', 'comision', 'conIVA', 'conIT'].includes(campo)) {
          productoActualizado.total = calcularTotal(
            productoActualizado.cantidad === '' ? 0 : productoActualizado.cantidad,
            productoActualizado.totalM2,
            productoActualizado.precio === '' ? 0 : productoActualizado.precio,
            productoActualizado.comision === '' ? 0 : productoActualizado.comision,
            productoActualizado.conIVA,
            productoActualizado.conIT,
            productoActualizado.esSoporte || false
          )
        }
        
        return productoActualizado
      }
      return item
    }))
  }

  // Estado para el combobox de productos/soportes
  const [openCombobox, setOpenCombobox] = useState<Record<string, boolean>>({})
  const [todosLosItems, setTodosLosItems] = useState<any[]>([])
  const [cargandoItems, setCargandoItems] = useState(false)
  const [filteredItems, setFilteredItems] = useState<Record<string, any[]>>({})
  
  // Estado para el modal de variantes
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
  
  // Estado para el modal de fechas de soporte
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

  // FUNCIÓN ESPECÍFICA DE EDITAR: Cargar cotización existente
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
      // Las líneas ahora vienen desde JSON (lineas_json o data.lineas)
      const lineas = data.data.lineas || cotizacion.lineas_json || []

      // Cargar datos de encabezado
      setCodigoCotizacion(cotizacion.codigo || '')
      setSucursal(cotizacion.sucursal || 'La Paz')
      
      // Guardar los nombres directamente (lazy loading)
      setCliente(cotizacion.cliente || '')
      setVendedor(cotizacion.vendedor || '')

      // Cargar líneas desde JSON (ya vienen parseadas)
      if (lineas && lineas.length > 0) {
        const lineasConvertidas: ItemLista[] = lineas.map((linea: any, index: number) => {
          // Compatibilidad: si viene del formato antiguo (tabla separada), convertir
          if (linea.tipo === 'Producto' || linea.tipo === 'producto') {
            // Formato antiguo: tiene codigo_producto, nombre_producto, etc.
            if (linea.codigo_producto || linea.nombre_producto) {
              return {
                id: linea.id || `${index + 1}`,
                tipo: 'producto' as const,
                producto: linea.codigo_producto && linea.nombre_producto 
                  ? `${linea.codigo_producto} - ${linea.nombre_producto}`
                  : linea.producto || linea.nombre_producto || '',
                descripcion: linea.descripcion || '',
                cantidad: linea.cantidad || 1,
                ancho: linea.ancho || 0,
                alto: linea.alto || 0,
                totalM2: linea.total_m2 || linea.totalM2 || 0,
                udm: linea.unidad_medida || linea.udm || 'm²',
                precio: linea.precio_unitario || linea.precio || 0,
                comision: linea.comision_porcentaje || linea.comision || 0,
                conIVA: linea.con_iva !== undefined ? linea.con_iva : (linea.conIVA !== undefined ? linea.conIVA : true),
                conIT: linea.con_it !== undefined ? linea.con_it : (linea.conIT !== undefined ? linea.conIT : true),
                total: linea.subtotal_linea || linea.total || 0,
                esSoporte: linea.es_soporte || linea.esSoporte || false,
                dimensionesBloqueadas: linea.es_soporte || linea.esSoporte || false
              }
            }
            // Formato nuevo: ya viene como ProductoItem desde JSON
            return {
              id: linea.id || `${index + 1}`,
              tipo: 'producto' as const,
              producto: linea.producto || '',
              descripcion: linea.descripcion || '',
              cantidad: linea.cantidad || 1,
              ancho: linea.ancho || 0,
              alto: linea.alto || 0,
              totalM2: linea.totalM2 || 0,
              udm: linea.udm || 'm²',
              precio: linea.precio || 0,
              comision: linea.comision || 0,
              conIVA: linea.conIVA !== undefined ? linea.conIVA : true,
              conIT: linea.conIT !== undefined ? linea.conIT : true,
              total: linea.total || 0,
              esSoporte: linea.esSoporte || false,
              dimensionesBloqueadas: linea.dimensionesBloqueadas || linea.esSoporte || false
            }
          } else if (linea.tipo === 'Nota' || linea.tipo === 'nota') {
            return {
              id: linea.id || `${index + 1}`,
              tipo: 'nota' as const,
              texto: linea.texto || linea.descripcion || ''
            }
          } else {
            // Sección
            return {
              id: linea.id || `${index + 1}`,
              tipo: 'seccion' as const,
              texto: linea.texto || linea.nombre_producto || ''
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

  // Cargar todos los productos y soportes al inicio
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

  // Lazy loading de clientes (ESPECÍFICO DE EDITAR)
  const cargarClientesLazy = async () => {
    if (todosLosClientes.length > 0) return
    
    setCargandoClientes(true)
    try {
      const response = await fetch('/api/contactos?relation=Cliente')
      const data = await response.json()
      setTodosLosClientes(data.data || [])
      setFilteredClientes((data.data || []).slice(0, 50))
    } catch (error) {
      console.error('Error cargando clientes:', error)
    } finally {
      setCargandoClientes(false)
    }
  }

  // Lazy loading de comerciales (ESPECÍFICO DE EDITAR)
  const cargarComercialesLazy = async () => {
    if (todosLosComerciales.length > 0) return
    
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

  // Función de filtrado preciso: busca solo al inicio del código o nombre
  const filtrarItems = (productoId: string, searchValue: string) => {
    if (!searchValue || searchValue.trim() === '') {
      setFilteredItems(prev => ({ ...prev, [productoId]: todosLosItems.slice(0, 20) }))
      return
    }

    const search = searchValue.toLowerCase().trim()
    
    const filtered = todosLosItems.filter((item: any) => {
      const codigo = (item.codigo || '').toLowerCase()
      const nombre = (item.nombre || '').toLowerCase()
      
      return codigo.startsWith(search) || nombre.startsWith(search)
    }).slice(0, 15)
    
    setFilteredItems(prev => ({ ...prev, [productoId]: filtered }))
  }

  // Función de filtrado para clientes
  const filtrarClientes = (query: string) => {
    if (!query || query.trim() === '') {
      setFilteredClientes(todosLosClientes.slice(0, 50))
      return
    }
    
    const search = query.toLowerCase().trim()
    const filtered = todosLosClientes.filter((cliente: any) => {
      const nombre = (cliente.displayName || '').toLowerCase()
      const empresa = (cliente.legalName || '').toLowerCase()
      
      // Buscar en cualquier parte del nombre o empresa (no solo al inicio)
      return nombre.includes(search) || empresa.includes(search)
    }).slice(0, 100)
    
    setFilteredClientes(filtered)
  }

  // Función de filtrado para comerciales
  const filtrarComerciales = (query: string) => {
    if (!query || query.trim() === '') {
      setFilteredComerciales(todosLosComerciales.slice(0, 20))
      return
    }
    
    const search = query.toLowerCase().trim()
    const filtered = todosLosComerciales.filter((comercial: any) => {
      const nombre = (comercial.nombre || '').toLowerCase()
      
      return nombre.startsWith(search)
    }).slice(0, 15)
    
    setFilteredComerciales(filtered)
  }

  const seleccionarProducto = (id: string, item: any) => {
    const esSoporte = item.tipo === 'soporte'
    
    // Si es soporte, abrir modal de fechas
    if (esSoporte) {
      setModalFechasSoporte({
        open: true,
        productoId: id,
        itemData: item,
        fechaInicio: '',
        fechaFin: '',
        meses: 1
      })
      setOpenCombobox(prev => ({ ...prev, [id]: false }))
      setFilteredItems(prev => ({ ...prev, [id]: [] }))
      return
    }
    
    const tieneVariantes = item.variantes && Array.isArray(item.variantes) && item.variantes.length > 0
    
    // Si tiene variantes, abrir el modal
    if (tieneVariantes) {
      setModalVariantes({
        open: true,
        productoId: id,
        itemData: item,
        variantesSeleccionadas: {}
      })
      setOpenCombobox(prev => ({ ...prev, [id]: false }))
      setFilteredItems(prev => ({ ...prev, [id]: [] }))
      return
    }
    
    // Si no tiene variantes ni es soporte, continuar normalmente
    aplicarSeleccionProducto(id, item, {}, '', '', undefined).catch(err => {
      console.error('Error aplicando selección de producto:', err)
    })
    setOpenCombobox(prev => ({ ...prev, [id]: false }))
    setFilteredItems(prev => ({ ...prev, [id]: [] }))
  }
  
  const aplicarSeleccionProducto = async (id: string, item: any, variantes: Record<string, string>, fechaInicio: string, fechaFin: string, mesesAlquiler?: number) => {
    const esSoporte = item.tipo === 'soporte'
    
    // Generar descripción con variantes o fechas
    let descripcionFinal = item.descripcion || ''
    
    if (esSoporte && fechaInicio && fechaFin) {
      descripcionFinal = `[${item.codigo}] ${item.nombre} - Del ${fechaInicio} al ${fechaFin}`
    } else if (Object.keys(variantes).length > 0) {
      const variantesTexto = Object.entries(variantes)
        .map(([nombre, valor]) => {
          let nombreLimpio = nombre
            .replace(/Lona frontligth/gi, '')
            .replace(/LONA FRONTLIGTH/gi, '')
            .replace(/Instalación en valla\s+Instalación en valla/gi, 'Instalación en valla')
            .replace(/Desinstalación en valla\s+Desinstalación en valla/gi, 'Desinstalación en valla')
            .replace(/\b(\w+)\s+\1\b/gi, '$1')
            .trim()
          
          if (!nombreLimpio || nombreLimpio.length < 3) {
            nombreLimpio = nombre.split(' ').slice(0, 2).join(' ')
          }
          
          let valorLimpio = valor
            .replace(/#[0-9a-fA-F]{6}/g, '')
            .replace(/:+\s*$/g, '')
            .trim()
          
          return `${nombreLimpio}: ${valorLimpio}`
        })
        .join(', ')
      descripcionFinal = `[${item.codigo}] ${item.nombre} - ${variantesTexto}`
    }
    
    let precioFinal = item.precio || 0
    
    if (!esSoporte && Object.keys(variantes).length > 0 && item.receta) {
      precioFinal = await calcularPrecioConVariantes(precioFinal, item, variantes)
    }
    
    setProductosList(productosList.map(itemLista => {
      if (itemLista.id === id && itemLista.tipo === 'producto') {
        const producto = itemLista as ProductoItem
        const ancho = esSoporte && item.ancho ? parseFloat(item.ancho) : producto.ancho
        const alto = esSoporte && item.alto ? parseFloat(item.alto) : producto.alto
        const totalM2 = calcularTotalM2(ancho, alto)
        
        const cantidad = esSoporte && mesesAlquiler ? mesesAlquiler : (producto.cantidad || 1)
        
        const productoActualizado = {
          ...producto,
          producto: `${item.codigo} - ${item.nombre}`,
          descripcion: descripcionFinal,
          precio: precioFinal,
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
          esSoporte
        )
        
        return productoActualizado
      }
      return itemLista
    }))
  }
  
  const confirmarVariantes = async () => {
    await aplicarSeleccionProducto(
      modalVariantes.productoId,
      modalVariantes.itemData,
      modalVariantes.variantesSeleccionadas,
      '',
      '',
      undefined
    )
    setModalVariantes({ open: false, productoId: '', itemData: null, variantesSeleccionadas: {} })
  }
  
  const confirmarFechasSoporte = async () => {
    await aplicarSeleccionProducto(
      modalFechasSoporte.productoId,
      modalFechasSoporte.itemData,
      {},
      modalFechasSoporte.fechaInicio,
      modalFechasSoporte.fechaFin,
      modalFechasSoporte.meses
    )
    setModalFechasSoporte({ open: false, productoId: '', itemData: null, fechaInicio: '', fechaFin: '', meses: 1 })
  }
  
  // Función para calcular la fecha fin basada en fecha inicio y meses
  const calcularFechaFin = (fechaInicio: string, meses: number): string => {
    if (!fechaInicio) return ''
    
    const fecha = new Date(fechaInicio)
    fecha.setMonth(fecha.getMonth() + meses)
    
    const year = fecha.getFullYear()
    const month = String(fecha.getMonth() + 1).padStart(2, '0')
    const day = String(fecha.getDate()).padStart(2, '0')
    
    return `${year}-${month}-${day}`
  }
  
  // Efecto para calcular automáticamente la fecha fin
  useEffect(() => {
    if (modalFechasSoporte.fechaInicio && modalFechasSoporte.meses) {
      const nuevaFechaFin = calcularFechaFin(modalFechasSoporte.fechaInicio, modalFechasSoporte.meses)
      setModalFechasSoporte(prev => ({ ...prev, fechaFin: nuevaFechaFin }))
    }
  }, [modalFechasSoporte.fechaInicio, modalFechasSoporte.meses])

  const totalGeneral = productosList
    .filter((item): item is ProductoItem => item.tipo === 'producto')
    .reduce((sum, producto) => sum + producto.total, 0)

  // FUNCIÓN ESPECÍFICA DE EDITAR: Guardar cambios con PATCH
  const handleGuardar = async () => {
    try {
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
            variantes: producto.variantes ? JSON.stringify(producto.variantes) : '',
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

      // Obtener nombres de cliente y vendedor (con lazy loading)
      let clienteNombre = cliente
      let vendedorNombre = vendedor

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
        codigo: codigoCotizacion,
        cliente: clienteNombre,
        vendedor: vendedorNombre,
        sucursal,
        estado: 'Pendiente' as const,
        vigencia_dias: 30,
        lineas
      }

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

  const descargarCotizacionPDF = () => {
    try {
      if (!cliente) {
        toast.error("Por favor selecciona un cliente")
        return
      }

      const pdf = new jsPDF('p', 'mm', 'a4')
      const primaryColor: [number, number, number] = [213, 70, 68]
      const currentDate = new Date().toLocaleDateString('es-ES')
      
      let yPosition = 20

      // Encabezado
      pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
      pdf.rect(0, 0, 210, 40, 'F')
      
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(24)
      pdf.setFont('helvetica', 'bold')
      pdf.text('COTIZACIÓN', 105, 20, { align: 'center' })
      
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Fecha: ${currentDate}`, 105, 30, { align: 'center' })

      yPosition = 50

      // Información del cliente
      pdf.setTextColor(0, 0, 0)
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Información del Cliente', 20, yPosition)
      
      yPosition += 7
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      
      const clienteSeleccionado = todosLosClientes.find(c => c.id === cliente)
      if (clienteSeleccionado) {
        pdf.text(`Cliente: ${clienteSeleccionado.displayName}`, 20, yPosition)
        yPosition += 5
        if (clienteSeleccionado.legalName) {
          pdf.text(`Empresa: ${clienteSeleccionado.legalName}`, 20, yPosition)
          yPosition += 5
        }
      }

      if (sucursal) {
        pdf.text(`Sucursal: ${sucursal}`, 20, yPosition)
        yPosition += 5
      }

      const comercialSeleccionado = todosLosComerciales.find(c => c.id === vendedor)
      if (comercialSeleccionado) {
        pdf.text(`Comercial: ${comercialSeleccionado.nombre}`, 20, yPosition)
        yPosition += 5
      }

      yPosition += 5

      // Tabla de productos
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Detalle de Productos y Servicios', 20, yPosition)
      yPosition += 7

      pdf.setFillColor(240, 240, 240)
      pdf.rect(20, yPosition, 170, 8, 'F')
      
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Descripción', 22, yPosition + 5)
      pdf.text('Cant.', 120, yPosition + 5)
      pdf.text('Precio', 140, yPosition + 5)
      pdf.text('Total', 165, yPosition + 5)
      
      yPosition += 10

      pdf.setFont('helvetica', 'normal')
      productosList.forEach((item) => {
        if (yPosition > 270) {
          pdf.addPage()
          yPosition = 20
        }

        if (item.tipo === 'producto') {
          const producto = item as ProductoItem
          
          const descripcionLineas = pdf.splitTextToSize(producto.descripcion || producto.producto, 95)
          const alturaTexto = descripcionLineas.length * 5
          
          pdf.text(descripcionLineas, 22, yPosition)
          pdf.text(producto.cantidad.toString(), 120, yPosition)
          pdf.text(`Bs ${producto.precio.toFixed(2)}`, 140, yPosition)
          pdf.text(`Bs ${producto.total.toFixed(2)}`, 165, yPosition)
          
          yPosition += Math.max(alturaTexto, 5) + 2
        } else if (item.tipo === 'nota') {
          const nota = item as NotaItem
          pdf.setFont('helvetica', 'italic')
          const notaLineas = pdf.splitTextToSize(`Nota: ${nota.texto}`, 165)
          pdf.text(notaLineas, 22, yPosition)
          yPosition += notaLineas.length * 5 + 2
          pdf.setFont('helvetica', 'normal')
        } else if (item.tipo === 'seccion') {
          const seccion = item as SeccionItem
          pdf.setFont('helvetica', 'bold')
          pdf.text(seccion.texto, 22, yPosition)
          yPosition += 7
          pdf.setFont('helvetica', 'normal')
        }
      })

      yPosition += 5
      pdf.setDrawColor(200, 200, 200)
      pdf.line(20, yPosition, 190, yPosition)
      yPosition += 8

      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('TOTAL:', 140, yPosition)
      pdf.text(`Bs ${totalGeneral.toFixed(2)}`, 165, yPosition)

      const footerY = 280
      pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
      pdf.rect(0, footerY, 210, 17, 'F')
      
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`© ${new Date().getFullYear()} Publicidad Vial Imagen | Generado el ${currentDate}`, 105, footerY + 10, { align: 'center' })

      const nombreArchivo = `cotizacion-${clienteSeleccionado?.displayName || 'cliente'}-${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(nombreArchivo)
      
      toast.success("Cotización descargada exitosamente")
    } catch (error) {
      console.error("Error generando PDF:", error)
      toast.error("Error al generar el PDF")
    }
  }

  // Mostrar loading mientras carga la cotización (ESPECÍFICO DE EDITAR)
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
            Descartar
          </Button>
          <Button 
            onClick={handleGuardar}
            disabled={guardando}
            className="bg-[#D54644] hover:bg-[#B03A38] text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            {guardando ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Editar Cotización {codigoCotizacion}</h1>
        </div>

        {/* Información General */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Todos los campos en una sola fila */}
            <div className="flex gap-4">
              {/* Grupo de campos de información */}
              <div className="flex gap-4 flex-1">
                {/* Cliente */}
                <div className="flex-1 space-y-2">
                  <Label htmlFor="cliente">Cliente</Label>
                  <Popover open={openClienteCombobox} onOpenChange={(open) => {
                    setOpenClienteCombobox(open)
                    if (open) {
                      cargarClientesLazy()
                      if (todosLosClientes.length > 0) {
                        setFilteredClientes(todosLosClientes.slice(0, 50))
                      }
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
                      cargarComercialesLazy()
                      if (todosLosComerciales.length > 0) {
                        setFilteredComerciales(todosLosComerciales.slice(0, 20))
                      }
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

              {/* Grupo de botones de acción */}
              <div className="flex gap-4">
                {/* Descargar OT */}
                <div className="space-y-2 w-48">
                  <Label>&nbsp;</Label>
                  <Button variant="outline" className="w-full">
                    <Hammer className="w-4 h-4 mr-2" />
                    Descargar OT
                  </Button>
                </div>

                {/* Descargar Cotización */}
                <div className="space-y-2 w-48">
                  <Label>&nbsp;</Label>
                  <Button 
                    onClick={descargarCotizacionPDF}
                    className="w-full bg-[#D54644] hover:bg-[#B03A38] text-white"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Descargar Cotización
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Productos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Productos y Servicios</CardTitle>
            <CardDescription className="text-sm">
              Agrega los productos y servicios para esta cotización
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-2 text-xs font-medium text-gray-900 w-16"></th>
                    <th className="text-left py-2 px-2 text-xs font-medium text-gray-900">Producto/Soporte</th>
                    <th className="text-left py-2 px-2 text-xs font-medium text-gray-900">Imagen</th>
                    <th className="text-left py-2 px-2 text-xs font-medium text-gray-900">Descripción</th>
                    <th className="text-left py-2 px-2 text-xs font-medium text-gray-900">Cantidad</th>
                    <th className="text-left py-2 px-2 text-xs font-medium text-gray-900">Ancho</th>
                    <th className="text-left py-2 px-2 text-xs font-medium text-gray-900">Altura</th>
                    <th className="text-left py-2 px-2 text-xs font-medium text-gray-900">Totales en m²</th>
                    <th className="text-left py-2 px-2 text-xs font-medium text-gray-900">UdM</th>
                    <th className="text-left py-2 px-2 text-xs font-medium text-gray-900">Precio</th>
                    <th className="text-left py-2 px-2 text-xs font-medium text-gray-900 whitespace-nowrap">Comisión %</th>
                    <th className="text-left py-2 px-2 text-xs font-medium text-gray-900">Impuestos</th>
                    <th className="text-left py-2 px-2 text-xs font-medium text-gray-900">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {productosList.map((item, index) => {
                    // Renderizar nota
                    if (item.tipo === 'nota') {
                      const nota = item as NotaItem
                      return (
                        <tr 
                          key={nota.id} 
                          className="border-b border-gray-100"
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDrop={(e) => handleDrop(e, index)}
                        >
                          <td className="py-1 px-2">
                            <div className="flex items-center gap-0.5">
                              <div
                                draggable
                                onDragStart={() => handleDragStart(index)}
                                className="cursor-move"
                              >
                                <GripVertical className="w-3 h-3 text-gray-300" />
                              </div>
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
                          <td colSpan={12} className="py-1 px-2">
                            <div className="flex items-center gap-2">
                              <Input
                                placeholder="Escribe una nota..."
                                value={nota.texto}
                                onChange={(e) => actualizarNota(nota.id, e.target.value)}
                                className="w-full h-8 text-xs bg-white italic"
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
                    
                    // Renderizar sección
                    if (item.tipo === 'seccion') {
                      const seccion = item as SeccionItem
                      return (
                        <tr 
                          key={seccion.id} 
                          className="border-b border-gray-100"
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDrop={(e) => handleDrop(e, index)}
                        >
                          <td className="py-1 px-2">
                            <div className="flex items-center gap-0.5">
                              <div
                                draggable
                                onDragStart={() => handleDragStart(index)}
                                className="cursor-move"
                              >
                                <GripVertical className="w-3 h-3 text-gray-300" />
                              </div>
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
                          <td colSpan={12} className="py-1 px-2">
                            <div className="flex items-center gap-2">
                              <Input
                                placeholder="Escribe una sección..."
                                value={seccion.texto}
                                onChange={(e) => actualizarSeccion(seccion.id, e.target.value)}
                                className="w-full h-8 text-xs bg-gray-100 font-bold"
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
                    
                    // Renderizar producto
                    const producto = item as ProductoItem
                    return (
                    <tr 
                      key={producto.id} 
                      className="border-b border-gray-100"
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                    >
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-0.5">
                          <div
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            className="cursor-move"
                          >
                            <GripVertical className="w-3 h-3 text-gray-300" />
                          </div>
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
                      <td className="py-2 px-2">
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
                                placeholder="Escribe código o nombre..."
                                className="h-9 border-0 focus:ring-0"
                                onValueChange={(value) => filtrarItems(producto.id, value)}
                              />
                              <CommandList>
                                <CommandEmpty>
                                  {cargandoItems ? "Cargando..." : "No se encontraron resultados."}
                                </CommandEmpty>
                                {(filteredItems[producto.id] || []).length > 0 && (
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
                                )}
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </td>
                      
                      <td className="py-2 px-2">
                        <Button variant="outline" size="sm" className="w-8 h-8 p-0">
                          <Camera className="w-3 h-3" />
                        </Button>
                      </td>
                      
                      <td className="py-2 px-2">
                        <Textarea
                          value={producto.descripcion}
                          onChange={(e) => actualizarProducto(producto.id, 'descripcion', e.target.value)}
                          className="w-48 h-16 resize-none text-xs"
                          placeholder="Descripción del producto"
                        />
                      </td>
                      
                      <td className="py-2 px-2">
                        <Input
                          type="number"
                          value={producto.cantidad}
                          onChange={(e) => actualizarProducto(producto.id, 'cantidad', e.target.value === '' ? '' : parseFloat(e.target.value) || 1)}
                          onBlur={(e) => {
                            if (e.target.value === '' || parseFloat(e.target.value) < 1) {
                              actualizarProducto(producto.id, 'cantidad', 1)
                            }
                          }}
                          className="w-16 h-8 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          step="0.01"
                          min="1"
                        />
                      </td>
                      
                      <td className="py-2 px-2">
                        <Input
                          type="number"
                          value={producto.ancho}
                          onChange={(e) => actualizarProducto(producto.id, 'ancho', e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                          onBlur={(e) => {
                            if (e.target.value === '') {
                              actualizarProducto(producto.id, 'ancho', 0)
                            }
                          }}
                          className="w-16 h-8 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          step="0.01"
                          disabled={producto.dimensionesBloqueadas}
                        />
                      </td>
                      
                      <td className="py-2 px-2">
                        <Input
                          type="number"
                          value={producto.alto}
                          onChange={(e) => actualizarProducto(producto.id, 'alto', e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                          onBlur={(e) => {
                            if (e.target.value === '') {
                              actualizarProducto(producto.id, 'alto', 0)
                            }
                          }}
                          className="w-16 h-8 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          step="0.01"
                          disabled={producto.dimensionesBloqueadas}
                        />
                      </td>
                      
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-1 h-8">
                          <span className="font-medium text-xs">{producto.totalM2.toFixed(2)}</span>
                          <div className="flex items-center justify-center h-6 w-6">
                            <Calculator className="w-3 h-3 text-red-500" />
                          </div>
                        </div>
                      </td>
                      
                      <td className="py-2 px-2">
                        <Input
                          value={producto.udm}
                          onChange={(e) => actualizarProducto(producto.id, 'udm', e.target.value)}
                          className="w-20 h-8 text-xs"
                          disabled
                        />
                      </td>
                      
                      <td className="py-2 px-2">
                        <Input
                          type="number"
                          value={producto.precio}
                          onChange={(e) => actualizarProducto(producto.id, 'precio', e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                          onBlur={(e) => {
                            if (e.target.value === '') {
                              actualizarProducto(producto.id, 'precio', 0)
                            }
                          }}
                          className="w-20 h-8 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          step="0.01"
                        />
                      </td>
                      
                      <td className="py-2 px-2">
                        <Input
                          type="number"
                          value={producto.comision}
                          onChange={(e) => actualizarProducto(producto.id, 'comision', e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                          onBlur={(e) => {
                            if (e.target.value === '') {
                              actualizarProducto(producto.id, 'comision', 0)
                            }
                          }}
                          className="w-16 h-8 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          step="0.01"
                        />
                      </td>
                      
                      <td className="py-2 px-2">
                        <div className="flex gap-1">
                          {producto.conIVA && (
                            <div className="flex items-center gap-1 bg-blue-100 hover:bg-blue-200 rounded-full px-2 py-1 text-xs">
                              <span>IVA</span>
                              <button
                                type="button"
                                onClick={() => actualizarProducto(producto.id, 'conIVA', false)}
                                className="hover:text-red-500"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
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
                            <div className="flex items-center gap-1 bg-green-100 hover:bg-green-200 rounded-full px-2 py-1 text-xs">
                              <span>IT</span>
                              <button
                                type="button"
                                onClick={() => actualizarProducto(producto.id, 'conIT', false)}
                                className="hover:text-red-500"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
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
                      
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-1 h-8">
                          <span className="font-medium text-xs">Bs {producto.total.toFixed(2)}</span>
                          <div className="flex items-center justify-center h-6 w-6">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => eliminarProducto(producto.id)}
                          disabled={productosList.length === 1}
                              className="h-6 w-6 p-0 flex items-center justify-center text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                              <Trash2 className="w-3 h-3" />
                        </Button>
                          </div>
                        </div>
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
            
            {/* Total General */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold">Total General:</span>
                <span className="text-lg font-bold text-[#D54644]">
                  Bs {totalGeneral.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Modal de selección de variantes */}
      <Dialog open={modalVariantes.open} onOpenChange={(open) => !open && setModalVariantes({ open: false, productoId: '', itemData: null, variantesSeleccionadas: {} })}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Seleccionar variantes</DialogTitle>
            <DialogDescription>
              Producto: {modalVariantes.itemData?.nombre}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {modalVariantes.itemData?.variantes && Array.isArray(modalVariantes.itemData.variantes) && modalVariantes.itemData.variantes.length > 0 ? (
              modalVariantes.itemData.variantes.map((variante: any, index: number) => {
                let nombreLimpio = variante.nombre
                  .replace(/Lona frontligth/gi, '')
                  .replace(/LONA FRONTLIGTH/gi, '')
                  .replace(/Instalación en valla\s+Instalación en valla/gi, 'Instalación en valla')
                  .replace(/Desinstalación en valla\s+Desinstalación en valla/gi, 'Desinstalación en valla')
                  .replace(/\b(\w+)\s+\1\b/gi, '$1')
                  .trim()
                
                if (!nombreLimpio) {
                  nombreLimpio = variante.nombre
                }
                
                return (
                  <div key={index} className="grid gap-2">
                    <Label htmlFor={`variante-${index}`}>{nombreLimpio}</Label>
                  <Select
                    value={modalVariantes.variantesSeleccionadas[variante.nombre] || ''}
                    onValueChange={(value) => 
                      setModalVariantes(prev => ({
                        ...prev,
                        variantesSeleccionadas: {
                          ...prev.variantesSeleccionadas,
                          [variante.nombre]: value
                        }
                      }))
                    }
                  >
                    <SelectTrigger id={`variante-${index}`}>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {variante.posibilidades && Array.isArray(variante.posibilidades) && variante.posibilidades.map((posibilidad: string, pIndex: number) => (
                        <SelectItem key={pIndex} value={posibilidad}>
                          {posibilidad}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                )
              })
            ) : (
              <p className="text-sm text-muted-foreground">No hay variantes disponibles</p>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setModalVariantes({ open: false, productoId: '', itemData: null, variantesSeleccionadas: {} })}
            >
              Cancelar
            </Button>
            <Button 
              onClick={confirmarVariantes}
              className="bg-[#D54644] hover:bg-[#B03A38]"
              disabled={
                modalVariantes.itemData?.variantes?.some((v: any) => 
                  !modalVariantes.variantesSeleccionadas[v.nombre]
                )
              }
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de selección de fechas para soportes */}
      <Dialog open={modalFechasSoporte.open} onOpenChange={(open) => !open && setModalFechasSoporte({ open: false, productoId: '', itemData: null, fechaInicio: '', fechaFin: '', meses: 1 })}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Seleccionar fechas de alquiler</DialogTitle>
            <DialogDescription>
              Soporte: {modalFechasSoporte.itemData?.nombre}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="fecha-inicio">Fecha de inicio</Label>
              <Input
                id="fecha-inicio"
                type="date"
                value={modalFechasSoporte.fechaInicio}
                onChange={(e) => setModalFechasSoporte(prev => ({ ...prev, fechaInicio: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="meses">Meses</Label>
              <Select
                value={modalFechasSoporte.meses.toString()}
                onValueChange={(value) => setModalFechasSoporte(prev => ({ ...prev, meses: parseInt(value) }))}
              >
                <SelectTrigger id="meses">
                  <SelectValue placeholder="Seleccionar meses" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((mes) => (
                    <SelectItem key={mes} value={mes.toString()}>
                      {mes} {mes === 1 ? 'Mes' : 'Meses'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fecha-fin">Fecha de fin</Label>
              <Input
                id="fecha-fin"
                type="date"
                value={modalFechasSoporte.fechaFin}
                disabled
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setModalFechasSoporte({ open: false, productoId: '', itemData: null, fechaInicio: '', fechaFin: '', meses: 1 })}
            >
              Cancelar
            </Button>
            <Button 
              onClick={confirmarFechasSoporte}
              className="bg-[#D54644] hover:bg-[#B03A38]"
              disabled={!modalFechasSoporte.fechaInicio || !modalFechasSoporte.fechaFin}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </>
  )
}
