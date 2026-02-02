"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
  ArrowLeft,
  Check,
  ChevronUp,
  ChevronDown,
  GripVertical,
  X,
  Hammer,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  Copy,
  Building2,
  User
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Toaster } from "sonner"
import { generarPDFCotizacion, generarPDFOT } from "@/lib/pdfCotizacion"
import { calcularTotalM2, calcularTotal, calcularPrecioConVariantes } from '@/lib/calculosInternos'
import {
  subirImagenes,
  prepararLineas,
  prepararPayload,
  guardarCotizacionNueva,
  actualizarEstadoCotizacion,
  crearAlquileres,
  generarDatosParaModalAprobacion,
  sincronizarLineas,
  type ProductoItem as ProductoItemType
} from '@/hooks/useCotizacionFlujo'
import { usePermisosContext } from '@/hooks/permisos-provider'
import { normalizarAccion } from '@/lib/permisos-utils'

// Datos de ejemplo para los desplegables
const clientes = [
  { id: "1", nombre: "Empresa ABC S.A." },
  { id: "2", nombre: "Comercial XYZ Ltda." },
  { id: "3", nombre: "Industrias DEF S.A.S." },
  { id: "4", nombre: "Servicios GHI S.A." },
  { id: "5", nombre: "Distribuidora JKL Ltda." }
]

const sucursales = [
  { id: "1", nombre: "La Paz" },
  { id: "2", nombre: "Santa Cruz" }
]

const productos = [
  {
    id: "ADH-001",
    nombre: "ADHESIVO + INSTALACIÓN",
    descripcion: "Material: Adhesivo blanco con protección uv y anti hongos Calidad: 1440 dpi's Acabado: Corte a diseño con adhesivo impreso",
    precio: 95.00,
    unidad: "m²"
  },
  {
    id: "VIN-002",
    nombre: "VINILO AUTOMOTRIZ",
    descripcion: "Material: Vinilo automotriz de alta calidad con adhesivo profesional. Resistente a la intemperie y fácil aplicación.",
    precio: 120.00,
    unidad: "m²"
  },
  {
    id: "LON-003",
    nombre: "LONA PUBLICITARIA",
    descripcion: "Material: Lona de PVC 440g con ojetes metálicos. Ideal para publicidad exterior y eventos.",
    precio: 85.00,
    unidad: "m²"
  },
  {
    id: "COR-004",
    nombre: "CORPLAST",
    descripcion: "Material: Coroplast 3mm con impresión digital. Perfecto para señalización y publicidad.",
    precio: 75.00,
    unidad: "m²"
  }
]

interface ProductoItem {
  id: string
  tipo: 'producto'
  producto: string
  producto_id?: string // ID del producto en la BD (para obtener precios por variante)
  imagen?: string // URL de la imagen (para mostrar preview o URL de Supabase)
  imagenFile?: File // Archivo temporal que se subirá al guardar
  descripcion: string
  cantidad: number
  ancho: number
  alto: number
  totalM2: number
  udm: string
  precio: number // Precio por m² o precio base
  comision: number
  conIVA: boolean
  conIT: boolean
  total: number
  totalManual?: number | null // Total manual editado por el usuario
  esSoporte?: boolean
  dimensionesBloqueadas?: boolean
  variantes?: Record<string, string> | null
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

export default function NuevaCotizacionPage() {
  const router = useRouter()
  const { tieneFuncionTecnica, permisos } = usePermisosContext()
  const [cliente, setCliente] = useState("")
  const [sucursal, setSucursal] = useState("")
  const [vigencia, setVigencia] = useState("30")
  const [plazo, setPlazo] = useState("")
  const [vendedor, setVendedor] = useState("")
  const [guardando, setGuardando] = useState(false)
  const [cotizacionId, setCotizacionId] = useState<string>("")
  const [codigoCotizacion, setCodigoCotizacion] = useState<string>("")
  const [estadoCotizacion, setEstadoCotizacion] = useState<"Pendiente" | "Aprobada" | "Rechazada" | "Vencida">("Pendiente")
  const [totalManual, setTotalManual] = useState<number | null>(null) // Total manual editado por el usuario
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

  const duplicarItem = (index: number) => {
    const item = productosList[index]
    if (!item) return

    // Crear una copia completa del item con nuevo ID
    const itemDuplicado: ItemLista = {
      ...item,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    }

    // Si es un producto, asegurar que se copien todas las propiedades
    if (item.tipo === 'producto') {
      const producto = item as ProductoItem
      const productoDuplicado: ProductoItem = {
        ...producto,
        id: itemDuplicado.id,
        // Copiar todas las propiedades específicas del producto
        imagen: producto.imagen,
        imagenOriginalUrl: producto.imagenOriginalUrl,
        variantes: producto.variantes ? { ...producto.variantes } : null,
        totalManual: producto.totalManual
      }
      // Insertar después del item actual
      const newList = [...productosList]
      newList.splice(index + 1, 0, productoDuplicado)
      setProductosList(newList)
    } else {
      // Para notas y secciones, simplemente duplicar
      const newList = [...productosList]
      newList.splice(index + 1, 0, itemDuplicado)
      setProductosList(newList)
    }

    toast.success("Item duplicado")
  }

  // Estados para drag and drop
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  // Estados para el combobox de clientes
  const [openClienteCombobox, setOpenClienteCombobox] = useState(false)
  const [todosLosClientes, setTodosLosClientes] = useState<any[]>([])
  const [filteredClientes, setFilteredClientes] = useState<any[]>([])
  const [cargandoClientes, setCargandoClientes] = useState(false)
  const [clienteSearchValue, setClienteSearchValue] = useState("")

  // Estados para el modal de nuevo cliente
  const [openNuevoClienteModal, setOpenNuevoClienteModal] = useState(false)
  const [nuevoClienteFormData, setNuevoClienteFormData] = useState({
    kind: "COMPANY" as "INDIVIDUAL" | "COMPANY",
    relation: "CUSTOMER" as "CUSTOMER" | "SUPPLIER" | "BOTH",
    displayName: "",
    company: "",
    companyId: "",
    razonSocial: "",
    personaContacto: [] as Array<{ id: string; nombre: string }>,
    taxId: "",
    phone: "",
    email: "",
    website: "",
    address1: "",
    city: "",
    country: "Bolivia",
    salesOwnerId: "none",
    notes: "",
  })
  const [nuevoClienteLoading, setNuevoClienteLoading] = useState(false)
  const [nuevoClienteTodosLosContactos, setNuevoClienteTodosLosContactos] = useState<any[]>([])
  const [nuevoClienteFilteredEmpresas, setNuevoClienteFilteredEmpresas] = useState<any[]>([])
  const [nuevoClienteOpenEmpresaCombobox, setNuevoClienteOpenEmpresaCombobox] = useState(false)
  const [nuevoClienteFilteredPersonasContacto, setNuevoClienteFilteredPersonasContacto] = useState<any[]>([])
  const [nuevoClienteOpenPersonaContactoCombobox, setNuevoClienteOpenPersonaContactoCombobox] = useState(false)
  const [nuevoClientePersonaContactoInputValue, setNuevoClientePersonaContactoInputValue] = useState("")
  const [nuevoClienteSalesOwners, setNuevoClienteSalesOwners] = useState<any[]>([])

  // Estados para el combobox de comerciales
  const [openComercialCombobox, setOpenComercialCombobox] = useState(false)
  const [todosLosComerciales, setTodosLosComerciales] = useState<any[]>([])
  const [filteredComerciales, setFilteredComerciales] = useState<any[]>([])
  const [cargandoComerciales, setCargandoComerciales] = useState(false)

  // Estado para el popover de meses en el modal de fechas
  const [openMeses, setOpenMeses] = useState(false)

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
    // Detectar si se está cambiando un campo que afecta el total
    const campoAfectaTotal = ['cantidad', 'ancho', 'alto', 'precio', 'comision', 'conIVA', 'conIT', 'udm', 'total'].includes(campo)

    // ERROR #7: Evitar race condition usando prevList dentro del callback
    // Usar forma funcional de setState para preservar referencias a URLs blob
    setProductosList(prevList => {
      const nuevaLista = prevList.map(item => {
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
          // Solo recalcular si no es el campo 'total' (para permitir edición manual)
          if (['cantidad', 'ancho', 'alto', 'precio', 'comision', 'conIVA', 'conIT', 'udm'].includes(campo)) {
            // Detectar unidades (case-insensitive y considerar singular/plural)
            const udmLower = productoActualizado.udm?.toLowerCase().trim() || ''
            const esUnidades = udmLower === 'unidad' || udmLower === 'unidades' || udmLower === 'unidade'
            // Detectar si es PRO-001 (servicio general con comportamiento dinámico)
            const esPRO001 = productoActualizado.producto?.includes('PRO-001') || productoActualizado.producto_id === 'PRO-001'
            // PRO-001: Si tiene ancho y alto > 0, funciona como m², sino como unidades
            const anchoVal = typeof productoActualizado.ancho === 'string' ? (productoActualizado.ancho === '' ? 0 : parseFloat(productoActualizado.ancho) || 0) : productoActualizado.ancho
            const altoVal = typeof productoActualizado.alto === 'string' ? (productoActualizado.alto === '' ? 0 : parseFloat(productoActualizado.alto) || 0) : productoActualizado.alto
            const esPRO001ConDimensiones = esPRO001 && anchoVal > 0 && altoVal > 0
            const esPRO001SinDimensiones = esPRO001 && (anchoVal === 0 || altoVal === 0)
            const totalCalculado = calcularTotal(
              productoActualizado.cantidad === '' ? 0 : productoActualizado.cantidad,
              productoActualizado.totalM2,
              productoActualizado.precio === '' ? 0 : productoActualizado.precio,
              productoActualizado.comision === '' ? 0 : productoActualizado.comision,
              productoActualizado.conIVA,
              productoActualizado.conIT,
              productoActualizado.esSoporte || esUnidades || esPRO001SinDimensiones, // Tratar PRO-001 sin dimensiones como unidades
              productoActualizado.udm
            )
            // Recalcular automáticamente el total cuando cambian los campos
            productoActualizado.total = totalCalculado
            // Resetear total manual del producto para que use el calculado
            productoActualizado.totalManual = null
          }
          // Si se está editando el campo 'total' manualmente
          else if (campo === 'total') {
            const valorNum = typeof valor === 'string' ? (valor === '' ? 0 : parseFloat(valor) || 0) : valor
            productoActualizado.total = valorNum
            productoActualizado.totalManual = valorNum
          }

          return productoActualizado
        }
        return item
      })

      // MEJORA A6: Solo resetear totalManual del Total General si se cambia un campo
      // que afecta el total de un producto, PERO solo si no hay totalManual en ese producto.
      // Si el producto tiene totalManual, respetarlo y NO resetear el total general.
      // Esto evita que se pierda la edición manual del usuario.
      // ERROR #7: Usar nuevaLista (prevList actualizado) en lugar de productosList para evitar race condition
      if (campoAfectaTotal && campo !== 'total') {
        // Solo resetear si el producto no tiene totalManual (para evitar inconsistencias)
        const producto = nuevaLista.find(item => item.id === id && item.tipo === 'producto') as ProductoItem | undefined
        if (producto && (producto.totalManual === null || producto.totalManual === undefined)) {
          // Solo resetear totalManual del Total General si ningún producto tiene totalManual
          const tieneAlgunTotalManual = nuevaLista.some(item => 
            item.tipo === 'producto' && (item as ProductoItem).totalManual !== null && (item as ProductoItem).totalManual !== undefined
          )
          if (!tieneAlgunTotalManual) {
            setTotalManual(null)
          }
        }
      }

      return nuevaLista
    })
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

  // Cargar todos los productos y soportes al inicio
  useEffect(() => {
    const cargarItems = async () => {
      setCargandoItems(true)
      try {
        // Cargar productos y soportes en paralelo (sin límite para obtener todos)
        const [productosRes, soportesRes] = await Promise.all([
          fetch('/api/inventario?limit=10000'),
          fetch('/api/soportes?limit=10000')
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
          unidad: p.unidad_medida === 'm2' ? 'm²' : (p.unidad_medida || 'm²'),
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
          tipo: 'soporte',
          imagenPrincipal: s.images && s.images.length > 0 ? s.images[0] : null
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

  // Cargar todos los clientes al inicio
  useEffect(() => {
    const cargarClientes = async () => {
      setCargandoClientes(true)
      try {
        const response = await fetch('/api/contactos?relation=Cliente')
        const data = await response.json()
        setTodosLosClientes(data.data || [])
      } catch (error) {
        console.error('Error cargando clientes:', error)
      } finally {
        setCargandoClientes(false)
      }
    }

    cargarClientes()
  }, [])

  // Cargar todos los comerciales al inicio y predefinir el usuario actual
  useEffect(() => {
    const cargarComerciales = async () => {
      setCargandoComerciales(true)
      try {
        const response = await fetch('/api/public/comerciales')

        if (!response.ok) {
          console.error('❌ Error en respuesta de comerciales:', response.status, response.statusText)
          setTodosLosComerciales([])
          return
        }

        const data = await response.json()
        console.log('✅ Comerciales recibidos:', data.users?.length || 0)

        // El endpoint ya filtra solo usuarios con vendedor=true
        const vendedores = data.users || []
        setTodosLosComerciales(vendedores)
        setFilteredComerciales(vendedores.slice(0, 20))

        // Predefinir el usuario actual si es vendedor
        if (!vendedor) {
          try {
            const userRes = await fetch('/api/auth/me')
            if (userRes.ok) {
              const userData = await userRes.json()
              if (userData.success && userData.user) {
                const currentUser = vendedores.find((v: any) => v.id === userData.user.id)
                if (currentUser) {
                  console.log('✅ Usuario actual encontrado en comerciales, estableciendo como vendedor:', currentUser.nombre)
                  setVendedor(currentUser.id)
                } else {
                  console.log('⚠️ Usuario actual no está en la lista de comerciales')
                }
              }
            }
          } catch (error) {
            console.error('Error obteniendo usuario actual:', error)
          }
        }
      } catch (error) {
        console.error('❌ Error cargando comerciales:', error)
        setTodosLosComerciales([])
      } finally {
        setCargandoComerciales(false)
      }
    }

    cargarComerciales()
  }, [])

  // Cleanup: Revocar URLs blob al desmontar el componente
  useEffect(() => {
    return () => {
      // Revocar todas las URLs blob cuando el componente se desmonte
      setProductosList(currentList => {
        const blobUrls: string[] = []
        currentList.forEach((item) => {
          if (item.tipo === 'producto') {
            const producto = item as ProductoItem
            if (producto.imagen && producto.imagen.startsWith('blob:')) {
              blobUrls.push(producto.imagen)
            }
          }
        })
        // Revocar todas las URLs blob
        blobUrls.forEach(url => URL.revokeObjectURL(url))
        return currentList // No cambiar el estado, solo limpiar URLs
      })
    }
  }, []) // Solo al desmontar

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

      // Buscar solo al inicio del código o del nombre
      return codigo.startsWith(search) || nombre.startsWith(search)
    }).slice(0, 15) // Limitar a 15 resultados máximo

    setFilteredItems(prev => ({ ...prev, [productoId]: filtered }))
  }

  // Función de filtrado para clientes
  const filtrarClientes = (query: string) => {
    setClienteSearchValue(query)
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
    }).slice(0, 100) // Limitar a 100 resultados coincidentes

    setFilteredClientes(filtered)
  }

  // Cargar contactos para el modal de nuevo cliente
  useEffect(() => {
    if (openNuevoClienteModal) {
      const cargarDatos = async () => {
        try {
          // Cargar contactos
          const contactosRes = await fetch('/api/contactos')
          if (contactosRes.ok) {
            const contactosData = await contactosRes.json()
            const contactos = contactosData.data || []
            setNuevoClienteTodosLosContactos(contactos)
            const empresas = contactos.filter((c: any) => c.kind === 'COMPANY')
            setNuevoClienteFilteredEmpresas(empresas.slice(0, 50))
            setNuevoClienteFilteredPersonasContacto(contactos.slice(0, 50))
          }
          
          // Cargar comerciales
          const comercialesRes = await fetch('/api/public/comerciales')
          if (comercialesRes.ok) {
            const comercialesData = await comercialesRes.json()
            setNuevoClienteSalesOwners(comercialesData.users || [])
          }
        } catch (error) {
          console.error('Error cargando datos para nuevo cliente:', error)
        }
      }
      cargarDatos()
    }
  }, [openNuevoClienteModal])

  // Filtrar empresas para el modal
  const nuevoClienteFiltrarEmpresas = (query: string) => {
    if (!query || query.trim() === '') {
      const empresas = nuevoClienteTodosLosContactos.filter((c: any) => c.kind === 'COMPANY')
      setNuevoClienteFilteredEmpresas(empresas.slice(0, 50))
      return
    }
    const search = query.toLowerCase().trim()
    const empresas = nuevoClienteTodosLosContactos.filter((c: any) => {
      if (c.kind !== 'COMPANY') return false
      const nombre = (c.displayName || '').toLowerCase()
      const empresa = (c.legalName || c.company || '').toLowerCase()
      return nombre.includes(search) || empresa.includes(search)
    }).slice(0, 100)
    setNuevoClienteFilteredEmpresas(empresas)
  }

  // Filtrar personas de contacto para el modal
  const nuevoClienteFiltrarPersonasContacto = (query: string) => {
    if (!query || query.trim() === '') {
      setNuevoClienteFilteredPersonasContacto(nuevoClienteTodosLosContactos.slice(0, 50))
      return
    }
    const search = query.toLowerCase().trim()
    const filtered = nuevoClienteTodosLosContactos.filter((c: any) => {
      const nombre = (c.displayName || '').toLowerCase()
      const empresa = (c.legalName || c.company || '').toLowerCase()
      return nombre.includes(search) || empresa.includes(search)
    }).slice(0, 100)
    setNuevoClienteFilteredPersonasContacto(filtered)
  }

  // Agregar persona de contacto en el modal
  const nuevoClienteAgregarPersonaContacto = (contacto: any) => {
    const yaExiste = nuevoClienteFormData.personaContacto.some(p => p.id === contacto.id)
    if (!yaExiste) {
      setNuevoClienteFormData(prev => ({
        ...prev,
        personaContacto: [...prev.personaContacto, { id: contacto.id, nombre: contacto.displayName }]
      }))
    }
    setNuevoClientePersonaContactoInputValue("")
    setNuevoClienteOpenPersonaContactoCombobox(false)
  }

  // Remover persona de contacto en el modal
  const nuevoClienteRemoverPersonaContacto = (id: string) => {
    setNuevoClienteFormData(prev => ({
      ...prev,
      personaContacto: prev.personaContacto.filter(p => p.id !== id)
    }))
  }

  // Guardar nuevo cliente
  const guardarNuevoCliente = async () => {
    if (!nuevoClienteFormData.displayName) {
      toast.error("El nombre es requerido")
      return
    }

    setNuevoClienteLoading(true)
    try {
      const submitData = {
        ...nuevoClienteFormData,
        salesOwnerId: nuevoClienteFormData.salesOwnerId === "none" ? null : nuevoClienteFormData.salesOwnerId,
        ...(nuevoClienteFormData.kind === "INDIVIDUAL" 
          ? { 
              companyId: nuevoClienteFormData.companyId || null,
              company: nuevoClienteFormData.company || null
            }
          : { personaContacto: nuevoClienteFormData.personaContacto.length > 0 ? nuevoClienteFormData.personaContacto : null }
        )
      }

      const response = await fetch("/api/contactos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData)
      })

      if (response.ok) {
        const nuevoContacto = await response.json()
        toast.success("Cliente creado correctamente")
        
        // Recargar lista de clientes
        const clientesRes = await fetch('/api/contactos?relation=Cliente')
        const clientesData = await clientesRes.json()
        setTodosLosClientes(clientesData.data || [])
        
        // Seleccionar el nuevo cliente
        setCliente(nuevoContacto.id)
        setOpenClienteCombobox(false)
        setOpenNuevoClienteModal(false)
        
        // Limpiar formulario
        setNuevoClienteFormData({
          kind: "COMPANY",
          relation: "CUSTOMER",
          displayName: "",
          company: "",
          companyId: "",
          razonSocial: "",
          personaContacto: [],
          taxId: "",
          phone: "",
          email: "",
          website: "",
          address1: "",
          city: "",
          country: "Bolivia",
          salesOwnerId: "none",
          notes: "",
        })
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al crear el cliente")
      }
    } catch (error) {
      console.error("Error guardando nuevo cliente:", error)
      toast.error("Error de conexión")
    } finally {
      setNuevoClienteLoading(false)
    }
  }

  // Abrir modal de nuevo cliente (con nombre prellenado si viene de búsqueda)
  const abrirModalNuevoCliente = (nombrePrellenado?: string) => {
    console.log('🚀 Abriendo modal de nuevo cliente, nombre prellenado:', nombrePrellenado)
    setNuevoClienteFormData(prev => {
      const nuevoEstado = {
        ...prev,
        displayName: nombrePrellenado || "",
        relation: "CUSTOMER" as "CUSTOMER" | "SUPPLIER" | "BOTH" // Asegurar valor por defecto
      }
      console.log('📝 Estado inicial del formulario:', nuevoEstado)
      return nuevoEstado
    })
    setOpenNuevoClienteModal(true)
    setOpenClienteCombobox(false)
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

      // Buscar al inicio del nombre
      return nombre.startsWith(search)
    }).slice(0, 15) // Limitar a 15 resultados máximo

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
      // Para soportes: código + título + fechas
      descripcionFinal = `[${item.codigo}] ${item.nombre} - Del ${fechaInicio} al ${fechaFin}`
    } else if (Object.keys(variantes).length > 0) {
      // Para productos con variantes
      const variantesTexto = Object.entries(variantes)
        .map(([nombre, valor]) => {
          // Limpiar el nombre de la variante (eliminar repeticiones y texto redundante)
          let nombreLimpio = nombre
            .replace(/Lona frontligth/gi, '')
            .replace(/LONA FRONTLIGTH/gi, '')
            // Eliminar frases completas repetidas
            .replace(/Instalación en valla\s+Instalación en valla/gi, 'Instalación en valla')
            .replace(/Desinstalación en valla\s+Desinstalación en valla/gi, 'Desinstalación en valla')
            // Eliminar palabras individuales repetidas
            .replace(/\b(\w+)\s+\1\b/gi, '$1')
            .trim()

          // Si después de limpiar queda vacío o muy corto, usar el original simplificado
          if (!nombreLimpio || nombreLimpio.length < 3) {
            nombreLimpio = nombre.split(' ').slice(0, 2).join(' ')
          }

          // Limpiar el valor (eliminar códigos de color como #ffffff y dos puntos al final)
          let valorLimpio = valor
            .replace(/#[0-9a-fA-F]{6}/g, '')
            .replace(/:+\s*$/g, '') // Eliminar dos puntos al final
            .trim()

          return `${nombreLimpio}: ${valorLimpio}`
        })
        .join(', ')
      descripcionFinal = `[${item.codigo}] ${item.nombre} - ${variantesTexto}`
    }

    // Calcular precio base
    let precioFinal = item.precio || 0

    // Si hay variantes y no es soporte, calcular precio ajustado según variantes de mano de obra
    if (!esSoporte && Object.keys(variantes).length > 0 && item.receta) {
      precioFinal = await calcularPrecioConVariantes(
        precioFinal,
        item,
        variantes,
        sucursal || undefined,
        (message) => toast.warning(message) // Callback para mostrar warnings
      )
    }

    // Si es soporte, cargar la imagen principal del soporte
    let imagenUrl: string | undefined = undefined

    if (esSoporte && item.imagenPrincipal) {
      imagenUrl = item.imagenPrincipal
    }

    // Crear un objeto con todas las actualizaciones
    setProductosList(productosList.map(itemLista => {
      if (itemLista.id === id && itemLista.tipo === 'producto') {
        const producto = itemLista as ProductoItem
        const ancho = esSoporte && item.ancho ? parseFloat(item.ancho) : producto.ancho
        const alto = esSoporte && item.alto ? parseFloat(item.alto) : producto.alto
        const totalM2 = calcularTotalM2(ancho, alto)

        // Para soportes, la cantidad es el número de meses
        const cantidad = esSoporte && mesesAlquiler ? mesesAlquiler : (producto.cantidad || 1)

        const udmFinal = esSoporte ? 'mes' : (item.unidad === 'm2' ? 'm²' : (item.unidad || 'm²'))
        // Detectar unidades (case-insensitive y considerar singular/plural)
        const udmLower = udmFinal.toLowerCase().trim()
        const esUnidades = udmLower === 'unidad' || udmLower === 'unidades' || udmLower === 'unidade'

        const productoActualizado: ProductoItem = {
          ...producto,
          producto: `${item.codigo} - ${item.nombre}`,  // Guardar en formato "CODIGO - NOMBRE"
          producto_id: item.id, // Guardar ID del producto para obtener precios por variante
          descripcion: descripcionFinal,
          precio: precioFinal,
          udm: udmFinal,
          esSoporte: esSoporte,
          dimensionesBloqueadas: esSoporte,
          ancho: ancho,
          alto: alto,
          totalM2: totalM2,
          cantidad: cantidad,
          variantes: Object.keys(variantes).length > 0 ? variantes : null
        }

        // Cargar imagen del soporte si está disponible
        if (esSoporte && imagenUrl) {
          productoActualizado.imagen = imagenUrl
        }

        // Detectar si es PRO-001 (servicio general con comportamiento dinámico)
        const esPRO001 = item.codigo === 'PRO-001' || item.id === 'PRO-001' || producto.producto?.includes('PRO-001')
        
        // PRO-001: Si tiene ancho y alto > 0, funciona como m², sino como unidades
        const esPRO001ConDimensiones = esPRO001 && productoActualizado.ancho > 0 && productoActualizado.alto > 0
        const esPRO001SinDimensiones = esPRO001 && (productoActualizado.ancho === 0 || productoActualizado.alto === 0)
        
        // Recalcular total automáticamente al seleccionar producto
        // Para unidades: total = cantidad × precio (como en soportes)
        // Para PRO-001 sin dimensiones: total = cantidad × precio
        // Para PRO-001 con dimensiones: total = cantidad × totalM2 × precio (como m²)
        const totalCalculado = calcularTotal(
          productoActualizado.cantidad,
          productoActualizado.totalM2,
          productoActualizado.precio,
          productoActualizado.comision,
          productoActualizado.conIVA,
          productoActualizado.conIT,
          esSoporte || esUnidades || esPRO001SinDimensiones, // Tratar PRO-001 sin dimensiones como unidades
          productoActualizado.udm
        )
        productoActualizado.total = totalCalculado
        productoActualizado.totalManual = null // Resetear total manual al seleccionar nuevo producto

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
    
    // Si es 0.5 meses, agregar 15 días
    if (meses === 0.5) {
      fecha.setDate(fecha.getDate() + 15)
    } else {
      fecha.setMonth(fecha.getMonth() + meses)
    }

    // Formatear a YYYY-MM-DD
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

  // Función para recalcular precio de un item según la sucursal actual
  const recalcularPrecioConSucursal = async (item: ProductoItem): Promise<ProductoItem> => {
    // Si no es producto, no tiene variantes, o no tiene producto_id, retornar sin cambios
    if (
      item.tipo !== 'producto' ||
      !item.variantes ||
      !item.producto_id
    ) {
      return item
    }

    // Buscar el item completo en todosLosItems para obtener la receta
    const itemCompleto = todosLosItems.find((i: any) => i.id === item.producto_id)
    if (!itemCompleto || !itemCompleto.receta) {
      return item
    }

    try {
      // Obtener precio base del item completo
      const precioBase = itemCompleto.precio || item.precio || 0

      // Recalcular precio según variantes y sucursal
      const precioRecalculado = await calcularPrecioConVariantes(
        precioBase,
        itemCompleto,
        item.variantes,
        sucursal || undefined,
        (message) => console.warn(message) // Solo loguear warnings, no mostrar toast
      )

      // Recalcular total con el nuevo precio
      const udmLower = item.udm?.toLowerCase().trim() || ''
      const esUnidades = udmLower === 'unidad' || udmLower === 'unidades' || udmLower === 'unidade'
      const totalRecalculado = calcularTotal(
        item.cantidad,
        item.totalM2,
        precioRecalculado,
        item.comision,
        item.conIVA,
        item.conIT,
        item.esSoporte || esUnidades,
        item.udm
      )

      // Retornar item actualizado solo con precio y total
      return {
        ...item,
        precio: precioRecalculado,
        total: totalRecalculado,
        totalManual: null // Resetear total manual al recalcular
      }
    } catch (error) {
      console.error('Error recalculando precio con sucursal:', error)
      return item // Retornar sin cambios si hay error
    }
  }

  // Efecto para recalcular precios cuando cambia la sucursal
  useEffect(() => {
    if (!sucursal) return

    // Recalcular precios de todos los productos con variantes
    const recalcularTodos = async () => {
      // Obtener la lista actual
      const listaActual = productosList

      // Crear promesas para todos los items
      const promesas = listaActual.map(async (item) => {
        if (
          item.tipo !== 'producto' ||
          !item.variantes ||
          !item.producto_id
        ) {
          return item
        }

        // Recalcular precio según sucursal actual
        const actualizado = await recalcularPrecioConSucursal(item as ProductoItem)
        return actualizado
      })

      // Esperar todas las promesas y actualizar
      const itemsActualizados = await Promise.all(promesas)
      setProductosList(itemsActualizados)
    }

    recalcularTodos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sucursal])

  // Calcular total de cada producto para validación
  const productosConTotal = productosList
    .filter((item): item is ProductoItem => item.tipo === 'producto')
    .map(producto => {
      const udmLower = producto.udm?.toLowerCase().trim() || ''
      const esUnidades = udmLower === 'unidad' || udmLower === 'unidades' || udmLower === 'unidade'
      // Detectar si es PRO-001 (servicio general con comportamiento dinámico)
      const esPRO001 = producto.producto?.includes('PRO-001') || producto.producto_id === 'PRO-001'
      // PRO-001: Si tiene ancho y alto > 0, funciona como m², sino como unidades
      const anchoVal = typeof producto.ancho === 'string' ? (producto.ancho === '' ? 0 : parseFloat(producto.ancho) || 0) : producto.ancho
      const altoVal = typeof producto.alto === 'string' ? (producto.alto === '' ? 0 : parseFloat(producto.alto) || 0) : producto.alto
      const esPRO001SinDimensiones = esPRO001 && (anchoVal === 0 || altoVal === 0)

      // Total calculado es el subtotal sin impuestos (precio mínimo por línea)
      const totalCalculado = calcularTotal(
        producto.cantidad,
        producto.totalM2,
        producto.precio,
        producto.comision,
        producto.conIVA,
        producto.conIT,
        producto.esSoporte || esUnidades || esPRO001SinDimensiones, // Tratar PRO-001 sin dimensiones como unidades
        producto.udm
      )
      return {
        ...producto,
        totalCalculado
      }
    })

  // Total calculado mínimo: suma de totales calculados (para validación)
  const totalCalculado = productosConTotal.reduce((sum, producto) => sum + (producto.totalCalculado || 0), 0)

  // ============================================================================
  // REGLA PRINCIPAL: producto.total YA incluye impuestos si IVA/IT están activos
  // Total General = suma de producto.total (valores finales que ve el usuario)
  // ============================================================================
  // Total general real: suma de los totales de cada línea (que YA incluyen impuestos si están activos)
  // Redondear a 2 decimales para evitar números con muchos decimales
  const totalGeneralReal = Math.round(productosConTotal.reduce((sum, producto) => sum + (producto.total || 0), 0) * 100) / 100

  // REGLA 6: totalGeneral SIEMPRE respeta totalManual si existe
  // totalGeneralReal SOLO se usa como fallback en cotizaciones nuevas sin total_final
  // Si totalManual es null, usar totalGeneralReal (suma automática de productos)
  // Cuando cambian los productos, setTotalManual(null) resetea el total manual
  // para que el total general se recalcule automáticamente desde totalGeneralReal
  const totalGeneral = totalManual !== null && totalManual !== undefined ? totalManual : totalGeneralReal

  // Logs para depuración (solo en desarrollo)
  if (process.env.NODE_ENV === 'development' && totalManual !== null && totalManual !== undefined) {
    console.log('🎯 totalManual final:', totalManual)
    console.log('📦 totalGeneralReal:', totalGeneralReal)
    console.log('💰 totalGeneral mostrado:', totalGeneral)
  }

  // Handler para cambio del total manual (permite cualquier valor, validación en onBlur)
  const handleTotalChange = (valor: string) => {
    const valorNum = parseFloat(valor) || 0
    console.log('📝 handleTotalChange:', valor, '→', valorNum)
    setTotalManual(valorNum)
  }

  // Handler para onBlur del total general
  const handleTotalBlur = (valor: string) => {
    const valorNum = parseFloat(valor) || totalCalculado
    console.log('📝 handleTotalBlur:', valor, '→', valorNum)
    if (valorNum < totalCalculado) {
      toast.warning("El total ingresado es menor al precio calculado. Se mantendrá el valor ingresado.")
    }
    setTotalManual(valorNum)
  }

  const handleGuardar = async (redirigir: boolean = true) => {
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

      // Verificar que haya al menos un producto
      const productos = productosList.filter((item): item is ProductoItem => item.tipo === 'producto')
      if (productos.length === 0 || !productos.some(p => p.producto)) {
        toast.error("Por favor agrega al menos un producto a la cotización")
        return
      }

      // Verificar si el usuario tiene permiso para modificar precio cotización
      const puedeModificarPrecio = tieneFuncionTecnica("modificar precio cotización")
      
      // Log de depuración para validaciones
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 [Validaciones Guardar] Debug:', {
          puedeModificarPrecio,
          permisosTecnico: permisos["tecnico"],
          valorPermiso: permisos["tecnico"]?.[normalizarAccion("modificar precio cotización")]
        })
      }

      // Validar cada producto individualmente
      for (const producto of productos) {
        const esUnidades = producto.udm?.toLowerCase().trim() === 'unidad' || producto.udm?.toLowerCase().trim() === 'unidades' || producto.udm?.toLowerCase().trim() === 'unidade'
        const subtotalCalculado = calcularTotal(
          producto.cantidad,
          producto.totalM2,
          producto.precio,
          producto.comision,
          producto.conIVA,
          producto.conIT,
          producto.esSoporte || esUnidades,
          producto.udm
        )

        // Tolerancia del 1% para redondeos
        // IMPORTANTE: Solo permitir precios inferiores si tiene el permiso explícitamente
        // Si NO tiene permiso, bloquear cualquier valor menor al calculado
        if (!puedeModificarPrecio && producto.total < subtotalCalculado * 0.99) {
          toast.error(`El producto "${producto.producto}" tiene un subtotal (${producto.total.toFixed(2)}) menor al calculado (${subtotalCalculado.toFixed(2)}). Por favor corrige antes de guardar.`)
          setGuardando(false)
          return
        }
      }

      // Validar que el subtotal general no sea menor al calculado
      // IMPORTANTE: Solo permitir precios inferiores si tiene el permiso explícitamente
      // Si NO tiene permiso, bloquear cualquier valor menor al calculado
      if (!puedeModificarPrecio && totalGeneralReal < totalCalculado * 0.99) {
        toast.error(`El subtotal general (${totalGeneralReal.toFixed(2)}) es menor al calculado (${totalCalculado.toFixed(2)}). Por favor corrige antes de guardar.`)
        setGuardando(false)
        return
      }

      setGuardando(true)

      // MEJORA B3: Subir imágenes ANTES de preparar líneas, evitando race conditions
      const urlsImagenesActualizadas = await subirImagenes(
        productos,
        (productoId, error) => {
          const producto = productos.find(p => p.id === productoId)
          toast.error(`Error al subir imagen del producto ${producto?.producto || productoId}`)
        }
      )

      // MEJORA B3: Actualizar estado de productos con URLs nuevas (sin setTimeout)
      if (urlsImagenesActualizadas.size > 0) {
        const productosListActualizados = sincronizarLineas(productosList, urlsImagenesActualizadas)
        setProductosList(productosListActualizados)
      }

      // MEJORA B3: Preparar líneas usando las URLs actualizadas (sin esperar setTimeout)
      const lineas = prepararLineas(
        urlsImagenesActualizadas.size > 0 ? sincronizarLineas(productosList, urlsImagenesActualizadas) : productosList,
        urlsImagenesActualizadas
      )

      // Obtener nombres de cliente y vendedor (actualmente guardamos IDs)
      const clienteSeleccionado = todosLosClientes.find(c => c.id === cliente)
      const vendedorSeleccionado = todosLosComerciales.find(c => c.id === vendedor)

      if (!clienteSeleccionado) {
        toast.error("Cliente no encontrado")
        setGuardando(false)
        return
      }
      if (!vendedorSeleccionado) {
        toast.error("Vendedor no encontrado")
        setGuardando(false)
        return
      }

      // MEJORA B5: Preparar payload usando función unificada
      const cotizacionData = prepararPayload(
        lineas,
        {
          cliente: clienteSeleccionado.displayName || clienteSeleccionado.legalName || '',
          vendedor: vendedorSeleccionado.nombre || '',
          sucursal,
          vigencia,
          plazo,
          totalManual,
          totalGeneralReal,
          totalGeneral
        }
      )

      console.log('📝 Guardando cotización:', JSON.stringify(cotizacionData, null, 2))

      // MEJORA B1, B5: Guardar usando función unificada (sin setTimeout)
      const cotizacionCreada = await guardarCotizacionNueva(cotizacionData)

      // Actualizar estado con la cotización creada
      setCotizacionId(cotizacionCreada.id)
      setCodigoCotizacion(cotizacionCreada.codigo)
      setEstadoCotizacion('Pendiente')

      toast.success(`Cotización ${cotizacionCreada.codigo} guardada exitosamente`)

      // MEJORA B1: Redirigir sin setTimeout (usar router directamente)
      if (redirigir) {
        router.push('/panel/ventas/cotizaciones')
      }

    } catch (error) {
      console.error('Error guardando cotización:', error)
      toast.error(error instanceof Error ? error.message : 'Error al guardar la cotización')
    } finally {
      setGuardando(false)
    }
  }

  // Estado para el modal de confirmación de aprobación
  const [modalAprobacion, setModalAprobacion] = useState<{
    open: boolean
    soportesInfo: Array<{
      soporte: { codigo: string | null; titulo: string | null }
      fechaInicio: string
      fechaFin: string
      meses: number
      importe: number
    }>
    cargando: boolean
  }>({
    open: false,
    soportesInfo: [],
    cargando: false
  })

  // MEJORA B4: Función para cargar información de soportes con datos frescos
  const cargarSoportesParaAprobacion = async () => {
    if (!cotizacionId) {
      toast.error("Debes guardar la cotización primero")
      return
    }

    try {
      setModalAprobacion(prev => ({ ...prev, cargando: true, open: false }))

      // MEJORA B4: Generar datos frescos basados en el estado actual
      const productos = productosList.filter((item): item is ProductoItem => item.tipo === 'producto')
      const lineas = prepararLineas(productosList)
      const soportesInfo = await generarDatosParaModalAprobacion(cotizacionId, lineas)

      if (soportesInfo.length > 0) {
        // VALIDACIÓN PREVENTIVA: Verificar solapes antes de mostrar el modal
        try {
          const response = await fetch('/api/alquileres/validar-solapes', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              alquileres: soportesInfo.map(info => ({
                soporte_codigo: info.soporte.codigo,
                fechaInicio: info.fechaInicio,
                fechaFin: info.fechaFin
              }))
            })
          })

          const data = await response.json()

          if (!data.success || data.haySolapes) {
            // Hay solapes, mostrar error y NO abrir el modal
            const mensajeError = data.mensaje || 'Hay alquileres que se solapan con fechas existentes'
            toast.error(mensajeError)
            setModalAprobacion(prev => ({ ...prev, cargando: false, open: false }))
            return
          }

          // No hay solapes, mostrar modal de confirmación
          setModalAprobacion({
            open: true,
            soportesInfo,
            cargando: false
          })
        } catch (errorValidacion) {
          console.error('Error validando solapes:', errorValidacion)
          // Si falla la validación, mostrar el modal de todas formas (no bloquear)
          setModalAprobacion({
            open: true,
            soportesInfo,
            cargando: false
          })
        }
      } else {
        // No hay soportes, aprobar directamente sin modal
        await confirmarAprobacionSinSoportes()
      }
    } catch (error) {
      console.error('Error cargando información de soportes:', error)
      toast.error(error instanceof Error ? error.message : 'Error al cargar información de soportes')
      setModalAprobacion(prev => ({ ...prev, cargando: false, open: false }))
    }
  }

  // MEJORA B1, B2: Función para aprobar sin soportes (sin setTimeout)
  const confirmarAprobacionSinSoportes = async () => {
    if (!cotizacionId) {
      toast.error("Debes guardar la cotización primero")
      return
    }

    try {
      setGuardando(true)

      // Guardar la cotización (sin redirigir)
      await handleGuardar(false)

      // MEJORA B1, B2: Actualizar estado a Aprobada sin setTimeout
      await actualizarEstadoCotizacion(cotizacionId, 'Aprobada')

      setEstadoCotizacion('Aprobada')
      toast.success('Cotización guardada y aprobada exitosamente')
    } catch (error) {
      console.error('Error aprobando cotización:', error)
      toast.error(error instanceof Error ? error.message : 'Error al aprobar la cotización')
    } finally {
      setGuardando(false)
    }
  }

  // MEJORA B1, B2, B4: Función para confirmar la aprobación y crear alquileres (sin setTimeout, datos frescos)
  const confirmarAprobacion = async () => {
    if (!cotizacionId) {
      toast.error("Debes guardar la cotización primero")
      return
    }

    try {
      setGuardando(true)
      setModalAprobacion(prev => ({ ...prev, open: false }))

      // Guardar la cotización (sin redirigir)
      await handleGuardar(false)

      // MEJORA B1, B2: Actualizar estado a Aprobada sin setTimeout
      await actualizarEstadoCotizacion(cotizacionId, 'Aprobada')

      // MEJORA B4: Obtener datos frescos de soportes (no usar modalAprobacion.soportesInfo que puede estar desactualizado)
      const productos = productosList.filter((item): item is ProductoItem => item.tipo === 'producto')
      const lineas = prepararLineas(productosList)
      const tieneSoportes = productos.some(p => p.esSoporte)

      // Crear alquileres si hay soportes
      if (tieneSoportes) {
        try {
          const resultado = await crearAlquileres(cotizacionId)
          toast.success(`Cotización guardada, aprobada y ${resultado.alquileresCreados.length} alquiler(es) creado(s) exitosamente`)
        } catch (error) {
          // Revertir el estado de la cotización si falla la creación de alquileres
          await actualizarEstadoCotizacion(cotizacionId, estadoCotizacion as 'Pendiente' | 'Aprobada' | 'Rechazada' | 'Vencida')
          throw error
        }
      } else {
        toast.success('Cotización guardada y aprobada exitosamente')
      }

      setEstadoCotizacion('Aprobada')
    } catch (error) {
      console.error('Error aprobando cotización:', error)
      toast.error(error instanceof Error ? error.message : 'Error al aprobar la cotización')
    } finally {
      setGuardando(false)
    }
  }

  // MEJORA B1: Función para actualizar el estado de la cotización (sin setTimeout)
  const actualizarEstado = async (nuevoEstado: "Aprobada" | "Rechazada") => {
    try {
      // Si no hay cotizacionId, guardar primero (sin redirigir)
      if (!cotizacionId) {
        await handleGuardar(false)
        // El handleGuardar actualiza el cotizacionId, no necesitamos setTimeout
      }

      if (nuevoEstado === "Aprobada") {
        // Si se aprueba, cargar información de soportes (sin guardar todavía)
        // El guardado se hará cuando se confirme en el modal
        await cargarSoportesParaAprobacion()
      } else {
        // Si se rechaza, guardar primero y luego actualizar estado
        if (cotizacionId) {
          await handleGuardar(false)
        }

        setGuardando(true)

        // MEJORA B1: Usar función unificada sin setTimeout
        await actualizarEstadoCotizacion(cotizacionId || '', nuevoEstado)

        setEstadoCotizacion(nuevoEstado)
        toast.success(`Cotización guardada y marcada como ${nuevoEstado}`)
      }
    } catch (error) {
      console.error('Error actualizando estado:', error)
      toast.error(error instanceof Error ? error.message : 'Error al actualizar el estado')
    } finally {
      setGuardando(false)
    }
  }

  const descargarCotizacionPDF = async () => {
    try {
      if (!cotizacionId) {
        toast.error("Por favor guarda la cotización antes de descargarla")
        return
      }

      if (!cliente) {
        toast.error("Por favor selecciona un cliente")
        return
      }

      // ============================================================================
      // VALIDACIÓN DE CONSISTENCIA INTERNA
      // ============================================================================
      // Si la cotización ya está guardada, validar contra datos almacenados
      // Si es nueva, validar consistencia del estado actual
      
      if (cotizacionId) {
        // Cotización guardada: validar contra datos almacenados
        try {
          const response = await fetch(`/api/cotizaciones/${cotizacionId}`)
          if (response.ok) {
            const data = await response.json()
            if (data.success) {
              const cotizacion = data.data.cotizacion
              const lineas = data.data.lineas || []
              
              const lineasProductos = lineas.filter((linea: any) => 
                linea.tipo === 'Producto' || linea.tipo === 'producto' || (linea.nombre_producto || linea.codigo_producto)
              )
              
              const sumaSubtotales = lineasProductos.reduce((sum: number, linea: any) => {
                return sum + (linea.subtotal_linea || 0)
              }, 0)
              
              const totalFinal = cotizacion.total_final || 0
              const TOLERANCIA_CONSISTENCIA = 0.05
              const diferencia = Math.abs(totalFinal - sumaSubtotales)
              
              if (diferencia > TOLERANCIA_CONSISTENCIA) {
                toast.error(
                  `No se puede descargar. Inconsistencia en los totales: ` +
                  `Suma de líneas (${sumaSubtotales.toFixed(2)}) vs Total final (${totalFinal.toFixed(2)}). ` +
                  `Diferencia: ${diferencia.toFixed(2)} Bs. Por favor corrige antes de descargar.`
                )
                return
              }
            }
          }
        } catch (error) {
          console.error('Error validando consistencia:', error)
          // Continuar si falla la validación (no bloquear por error técnico)
        }
      } else {
        // Cotización nueva: validar consistencia del estado actual
        // Sumar totales de productos actuales
        const sumaTotales = productosList
          .filter((item): item is ProductoItem => item.tipo === 'producto')
          .reduce((sum, producto) => sum + (producto.total || 0), 0)
        
        const TOLERANCIA_CONSISTENCIA = 0.05
        const diferencia = Math.abs(totalGeneralReal - sumaTotales)
        
        if (diferencia > TOLERANCIA_CONSISTENCIA) {
          toast.error(
            `No se puede descargar. Inconsistencia en los totales: ` +
            `Suma de productos (${sumaTotales.toFixed(2)}) vs Total general (${totalGeneralReal.toFixed(2)}). ` +
            `Diferencia: ${diferencia.toFixed(2)} Bs. Por favor corrige antes de descargar.`
          )
          return
        }
      }

      const clienteSeleccionado = todosLosClientes.find(c => c.id === cliente)

      // Obtener el email y número del comercial asignado desde la API (igual que en el listado)
      let vendedorEmail: string | undefined = undefined
      let vendedorNumero: string | null = null
      let nombreVendedor: string = ''
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      
      try {
        // Obtener datos del comercial desde la API (igual que en el listado)
        const comercialesResponse = await fetch(`/api/public/comerciales`)
        if (comercialesResponse.ok) {
          const comercialesData = await comercialesResponse.json()
          
          // Buscar por ID (UUID) o por nombre
          let comercialEncontrado = null
          if (vendedor && uuidRegex.test(vendedor)) {
            comercialEncontrado = comercialesData.users?.find((u: any) => u.id === vendedor)
          } else if (vendedor) {
            // Buscar por nombre
            comercialEncontrado = comercialesData.users?.find((u: any) => 
              u.nombre?.toLowerCase().includes(vendedor.toLowerCase())
            )
          }
          
          if (comercialEncontrado) {
            vendedorEmail = comercialEncontrado.email
            vendedorNumero = comercialEncontrado.numero || null
            nombreVendedor = comercialEncontrado.nombre || ''
            console.log('✅ Email del comercial asignado encontrado:', vendedorEmail)
            console.log('✅ Número del comercial asignado encontrado:', vendedorNumero)
            console.log('✅ Nombre del comercial encontrado:', nombreVendedor)
          } else {
            console.log('⚠️ No se encontró comercial asignado en comerciales')
          }
        }
      } catch (error) {
        console.error('Error obteniendo datos del comercial asignado:', error)
      }

      // Si no se encontró el nombre del vendedor, intentar obtenerlo de todosLosComerciales como fallback
      if (!nombreVendedor && vendedor) {
        const comercialFallback = todosLosComerciales.find(c => c.id === vendedor)
        if (comercialFallback) {
          nombreVendedor = comercialFallback.nombre || ''
        } else if (!uuidRegex.test(vendedor)) {
          // Si no es UUID, buscar por nombre
          const comercialFallback2 = todosLosComerciales.find(c =>
            c.nombre?.toLowerCase().includes(vendedor.toLowerCase())
          )
          if (comercialFallback2) {
            nombreVendedor = comercialFallback2.nombre || ''
          }
        }
      }

      // Determinar qué mostrar como información secundaria del cliente
      let clienteInfoSecundaria = ''
      if (clienteSeleccionado) {
        if (clienteSeleccionado.kind === 'INDIVIDUAL' && clienteSeleccionado.legalName) {
          clienteInfoSecundaria = clienteSeleccionado.legalName
        } else if (clienteSeleccionado.kind === 'COMPANY' && clienteSeleccionado.personaContacto && clienteSeleccionado.personaContacto.length > 0) {
          clienteInfoSecundaria = clienteSeleccionado.personaContacto[0].nombre
        }
      }

      await generarPDFCotizacion({
        codigo: codigoCotizacion || 'NUEVA',
        cliente: clienteSeleccionado?.displayName || '',
        clienteNombreCompleto: clienteInfoSecundaria || clienteSeleccionado?.displayName,
        sucursal: sucursal || '',
        vendedor: nombreVendedor || vendedor || '',
        vendedorEmail: vendedorEmail,
        vendedorNumero: vendedorNumero, // Usar el número del comercial asignado, no del usuario que descarga
        productos: productosList,
        totalGeneral: totalGeneral,
        vigencia: vigencia ? parseInt(vigencia) : 30,
        plazo: plazo || null
      })

      toast.success("Cotización descargada exitosamente")
    } catch (error) {
      console.error("Error generando PDF:", error)
      toast.error("Error al generar el PDF")
    }
  }

  const descargarOTPDF = async () => {
    try {
      if (!cotizacionId) {
        toast.error("Por favor guarda la cotización antes de descargar la OT")
        return
      }

      if (!cliente) {
        toast.error("Por favor selecciona un cliente")
        return
      }

      const clienteSeleccionado = todosLosClientes.find(c => c.id === cliente)

      console.log('🔍 Buscando vendedor:', vendedor)
      console.log('🔍 Total comerciales:', todosLosComerciales.length)

      // Buscar comercial por ID (UUID) o por nombre
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      let comercialSeleccionado = todosLosComerciales.find(c => c.id === vendedor)

      // Si no se encuentra y el vendedor no es un UUID, buscar por nombre
      if (!comercialSeleccionado && vendedor && !uuidRegex.test(vendedor)) {
        console.log('🔍 Buscando por nombre:', vendedor)
        comercialSeleccionado = todosLosComerciales.find(c =>
          c.nombre?.toLowerCase().includes(vendedor.toLowerCase())
        )
      }

      console.log('📧 Comercial final seleccionado:', comercialSeleccionado)
      console.log('📧 Email del comercial:', comercialSeleccionado?.email)

      await generarPDFOT({
        codigo: codigoCotizacion || 'NUEVA',
        cliente: clienteSeleccionado?.displayName || '',
        clienteNombreCompleto: clienteSeleccionado?.legalName || clienteSeleccionado?.displayName,
        sucursal: sucursal || '',
        vendedor: comercialSeleccionado?.nombre || vendedor || '',
        vendedorEmail: comercialSeleccionado?.email || undefined,
        productos: productosList,
        totalGeneral: totalGeneral
      })

      toast.success("OT descargada exitosamente")
    } catch (error) {
      console.error("Error generando PDF OT:", error)
      toast.error("Error al generar el PDF OT")
    }
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gray-50">
        {/* Main Content */}
        <main className="container mx-auto px-6 py-8">
          {/* Barra de botones */}
          <div className="flex justify-end gap-2 mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/panel/ventas/cotizaciones')}
              disabled={guardando}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Descartar
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleGuardar}
              disabled={guardando}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {guardando ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Nuevo</h1>
          </div>

          {/* Información General */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Información General</CardTitle>
                {/* Botones de estado y descarga */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => actualizarEstado("Rechazada")}
                    disabled={guardando || !cotizacionId || estadoCotizacion === "Rechazada"}
                    className="text-red-600 hover:text-red-700 border-red-600 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Rechazada
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-green-600 hover:text-green-700 border-green-600 hover:bg-green-50"
                    onClick={() => actualizarEstado("Aprobada")}
                    disabled={guardando || !cotizacionId || estadoCotizacion === "Aprobada"}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Aprobada
                  </Button>
                  {tieneFuncionTecnica("descargar ot") && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!cotizacionId}
                      onClick={descargarOTPDF}
                      title={!cotizacionId ? "Guarda la cotización antes de descargar la OT" : ""}
                    >
                      <Hammer className="w-4 h-4 mr-2" />
                      Descargar OT
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={descargarCotizacionPDF}
                    disabled={!cotizacionId}
                    title={!cotizacionId ? "Guarda la cotización antes de descargarla" : ""}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Descargar Cotización
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Todos los campos y botones de descarga en una sola fila */}
              <div className="flex gap-4">
                {/* Cliente */}
                <div className="flex-1 space-y-2">
                  <Label htmlFor="cliente">Cliente</Label>
                  <Popover open={openClienteCombobox} onOpenChange={(open) => {
                    setOpenClienteCombobox(open)
                    if (open) {
                      setFilteredClientes(todosLosClientes.slice(0, 50))
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
                            ? todosLosClientes.find(c => c.id === cliente)?.displayName || "Seleccionar cliente"
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
                                  {/* Mostrar empresa si es Individual, o primera persona de contacto si es Compañía */}
                                  {c.kind === 'INDIVIDUAL' && c.legalName && (
                                    <span className="text-xs text-gray-500">{c.legalName}</span>
                                  )}
                                  {c.kind === 'COMPANY' && c.personaContacto && c.personaContacto.length > 0 && (
                                    <span className="text-xs text-gray-500">{c.personaContacto[0].nombre}</span>
                                  )}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                      {/* Botón "Nuevo cliente" o "Crear [texto]" */}
                      <div className="border-t p-2">
                        {clienteSearchValue && clienteSearchValue.trim() && filteredClientes.length === 0 && !cargandoClientes ? (
                          <button
                            type="button"
                            onClick={() => abrirModalNuevoCliente(clienteSearchValue)}
                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors font-medium"
                          >
                            Crear {clienteSearchValue}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => abrirModalNuevoCliente()}
                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors font-medium"
                          >
                            Nuevo cliente
                          </button>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Comercial */}
                <div className="flex-1 space-y-2">
                  <Label htmlFor="vendedor">Comercial</Label>
                  <Popover open={openComercialCombobox} onOpenChange={(open) => {
                    setOpenComercialCombobox(open)
                    if (open) {
                      setFilteredComerciales(todosLosComerciales.slice(0, 20))
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
                            ? todosLosComerciales.find(c => c.id === vendedor)?.nombre || "Seleccionar comercial"
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

                {/* Validez */}
                <div className="flex-1 space-y-2">
                  <Label htmlFor="vigencia">Validez</Label>
                  <Select value={vigencia} onValueChange={setVigencia}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar validez" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 días</SelectItem>
                      <SelectItem value="15">15 días</SelectItem>
                      <SelectItem value="30">30 días</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Plazo */}
                <div className="flex-1 space-y-2">
                  <Label htmlFor="plazo">Plazo de Entrega</Label>
                  <Input
                    id="plazo"
                    value={plazo}
                    onChange={(e) => setPlazo(e.target.value)}
                    placeholder="Ej: 5 días hábiles"
                    className="h-9"
                  />
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
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => duplicarItem(index)}
                                className="h-3 w-3 p-0 hover:bg-transparent ml-0.5"
                                title="Duplicar item"
                              >
                                <Copy className="w-2.5 h-2.5 text-gray-400" />
                              </Button>
                            </div>
                          </td>
                          <td className="py-2 px-2">
                            <Popover
                              open={openCombobox[producto.id] || false}
                              onOpenChange={(open) => {
                                setOpenCombobox(prev => ({ ...prev, [producto.id]: open }))
                                if (open) {
                                  // Al abrir, mostrar los primeros 20 items
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
                            <div className="relative w-16 h-16 border border-gray-300 rounded-md overflow-hidden bg-gray-50 flex items-center justify-center">
                              {producto.imagen ? (
                                <>
                                  <img
                                    src={producto.imagen}
                                    alt="Producto"
                                    className="w-full h-full object-cover"
                                    onError={async (e) => {
                                      console.error('❌ Error cargando imagen:', producto.imagen)

                                      // Si la imagen es blob, intentar subirla automáticamente
                                      if (producto.imagen?.startsWith('blob:')) {
                                        console.log('🔄 Detectada URL blob, intentando subir imagen...')
                                        try {
                                          // Obtener el blob desde la URL
                                          const blobResponse = await fetch(producto.imagen)
                                          const blob = await blobResponse.blob()

                                          // Crear un File desde el blob
                                          const file = new File([blob], 'imagen.jpg', { type: blob.type })

                                          // Subir a Supabase
                                          const formData = new FormData()
                                          formData.append('file', file)

                                          const uploadResponse = await fetch('/api/cotizaciones/image', {
                                            method: 'POST',
                                            body: formData
                                          })

                                          const uploadData = await uploadResponse.json()

                                          if (uploadData.success && uploadData.data.publicUrl) {
                                            console.log('✅ Imagen blob subida correctamente:', uploadData.data.publicUrl)
                                            actualizarProducto(producto.id, 'imagen', uploadData.data.publicUrl)
                                            actualizarProducto(producto.id, 'imagenOriginalUrl', uploadData.data.publicUrl)
                                            // Revocar la URL blob
                                            URL.revokeObjectURL(producto.imagen)
                                          } else {
                                            throw new Error(uploadData.error || 'Error al subir imagen')
                                          }
                                        } catch (uploadError) {
                                          console.error('❌ Error subiendo imagen blob:', uploadError)
                                          // Si falla, intentar con File si existe
                                          const productoConFile = productosList.find(
                                            (item): item is ProductoItem =>
                                              item.id === producto.id &&
                                              item.tipo === 'producto' &&
                                              !!(item as ProductoItem).imagenFile
                                          ) as ProductoItem | undefined

                                          if (productoConFile?.imagenFile) {
                                            const newBlobUrl = URL.createObjectURL(productoConFile.imagenFile)
                                            actualizarProducto(producto.id, 'imagen', newBlobUrl)
                                          } else {
                                            e.currentTarget.style.display = 'none'
                                          }
                                        }
                                      } else if (producto.imagenFile) {
                                        // Si hay un File pero no se ha subido, subirlo
                                        try {
                                          const formData = new FormData()
                                          formData.append('file', producto.imagenFile)

                                          const uploadResponse = await fetch('/api/cotizaciones/image', {
                                            method: 'POST',
                                            body: formData
                                          })

                                          const uploadData = await uploadResponse.json()

                                          if (uploadData.success && uploadData.data.publicUrl) {
                                            actualizarProducto(producto.id, 'imagen', uploadData.data.publicUrl)
                                            actualizarProducto(producto.id, 'imagenOriginalUrl', uploadData.data.publicUrl)
                                            actualizarProducto(producto.id, 'imagenFile', undefined)
                                          }
                                        } catch (uploadError) {
                                          console.error('❌ Error subiendo imagenFile:', uploadError)
                                        }
                                      } else if (producto.imagenOriginalUrl && producto.imagenOriginalUrl !== producto.imagen && !producto.imagenOriginalUrl.startsWith('blob:')) {
                                        // Si hay una URL original diferente y válida, intentar usarla
                                        console.log('🔄 Intentando cargar URL original:', producto.imagenOriginalUrl)
                                        actualizarProducto(producto.id, 'imagen', producto.imagenOriginalUrl)
                                      } else {
                                        // Si no hay File ni URL original válida, ocultar
                                        console.warn('⚠️ No se pudo cargar la imagen, ocultando')
                                        e.currentTarget.style.display = 'none'
                                      }
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      // Si es una URL temporal (blob), revocarla
                                      if (producto.imagen && producto.imagen.startsWith('blob:')) {
                                        URL.revokeObjectURL(producto.imagen)
                                      }
                                      actualizarProducto(producto.id, 'imagen', undefined)
                                      actualizarProducto(producto.id, 'imagenFile', undefined)
                                    }}
                                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs hover:bg-red-600"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </>
                              ) : (
                                <label className="cursor-pointer w-full h-full flex items-center justify-center">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0]
                                      if (!file) return

                                      // Validar tamaño (máximo 5MB)
                                      const maxSize = 5 * 1024 * 1024 // 5MB
                                      if (file.size > maxSize) {
                                        toast.error('Tamaño máximo de 5MB superado')
                                        e.target.value = '' // Limpiar el input
                                        return
                                      }

                                      // Crear URL temporal para preview
                                      const previewUrl = URL.createObjectURL(file)

                                      // Guardar el File y la URL temporal
                                      actualizarProducto(producto.id, 'imagenFile', file)
                                      actualizarProducto(producto.id, 'imagen', previewUrl)
                                    }}
                                  />
                                  <Camera className="w-5 h-5 text-gray-400" />
                                </label>
                              )}
                            </div>
                          </td>

                          <td className="py-2 px-2">
                            <Textarea
                              value={producto.descripcion}
                              onChange={(e) => actualizarProducto(producto.id, 'descripcion', e.target.value)}
                              className="w-48 h-16 resize-none text-xs"
                              placeholder="Descripción del producto"
                              disabled={producto.esSoporte === true}
                            />
                          </td>

                          <td className="py-2 px-2">
                            <Input
                              type="number"
                              value={producto.cantidad}
                              onChange={(e) => actualizarProducto(producto.id, 'cantidad', e.target.value === '' ? '' : parseFloat(e.target.value) || 1)}
                              onBlur={(e) => {
                                const valor = parseFloat(e.target.value)
                                if (e.target.value === '' || (valor < 0.5 && valor !== 0.5)) {
                                  actualizarProducto(producto.id, 'cantidad', 1)
                                }
                              }}
                              className="w-16 h-8 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              step="0.5"
                              min="0.5"
                              disabled={producto.esSoporte === true}
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
                              disabled={producto.dimensionesBloqueadas || producto.udm !== "m²"}
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
                              disabled={producto.dimensionesBloqueadas || producto.udm !== "m²"}
                            />
                          </td>

                          <td className="py-2 px-2">
                            <div className="flex items-center gap-1 h-8">
                              {producto.udm === "m²" ? (
                                <>
                                  <span className="font-medium text-xs">{Number(producto.totalM2 || 0).toFixed(2)} m<sup>2</sup></span>
                                  <div className="flex items-center justify-center h-6 w-6">
                                    <Calculator className="w-3 h-3 text-red-500" />
                                  </div>
                                </>
                              ) : (
                                <span className="font-medium text-xs text-gray-400">-</span>
                              )}
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
                            {(() => {
                              // Detectar si es PRO-001
                              const esPRO001 = producto.producto?.includes('PRO-001') || producto.producto_id === 'PRO-001'
                              // Verificar permiso
                              const tienePermiso = tieneFuncionTecnica("modificar precio cotización")
                              // El campo precio está habilitado si tiene el permiso O si es PRO-001
                              const precioHabilitado = tienePermiso || esPRO001
                              
                              // Log de depuración (solo en desarrollo)
                              if (process.env.NODE_ENV === 'development' && !esPRO001) {
                                console.log('🔍 [Precio Campo] Debug:', {
                                  producto: producto.producto,
                                  tienePermiso,
                                  esPRO001,
                                  precioHabilitado,
                                  permisosTecnico: permisos["tecnico"],
                                  todasLasClaves: permisos["tecnico"] ? Object.keys(permisos["tecnico"]) : []
                                })
                              }
                              
                              return (
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
                                  disabled={!precioHabilitado}
                                />
                              )
                            })()}
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
                                <div className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 rounded-full px-2 py-1 text-xs">
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
                                <div className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 rounded-full px-2 py-1 text-xs">
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
                              {(() => {
                                // Detectar unidades (case-insensitive y considerar singular/plural)
                                const udmLower = producto.udm?.toLowerCase().trim() || ''
                                const esUnidades = udmLower === 'unidad' || udmLower === 'unidades' || udmLower === 'unidade'
                                const totalCalculado = calcularTotal(
                                  producto.cantidad,
                                  producto.totalM2,
                                  producto.precio,
                                  producto.comision,
                                  producto.conIVA,
                                  producto.conIT,
                                  producto.esSoporte || esUnidades, // Tratar unidades como soportes
                                  producto.udm
                                )
                                // Mostrar siempre el valor que el usuario está editando (total o totalManual)
                                // Permitir edición libre, solo avisar en onBlur si es menor
                                const valorActual = producto.total !== undefined && producto.total !== null
                                  ? producto.total
                                  : (producto.totalManual !== null && producto.totalManual !== undefined
                                    ? producto.totalManual
                                    : totalCalculado)

                                return (
                                  <Input
                                    type="number"
                                    value={valorActual}
                                    onChange={(e) => {
                                      const valor = e.target.value === '' ? '' : parseFloat(e.target.value)
                                      // Permitir editar cualquier valor libremente (validación solo en onBlur)
                                      if (valor === '') {
                                        actualizarProducto(producto.id, 'total', 0)
                                      } else {
                                        actualizarProducto(producto.id, 'total', valor)
                                      }
                                    }}
                                    onBlur={(e) => {
                                      const valor = parseFloat(e.target.value) || 0
                                      // Solo avisar si es menor al calculado, pero permitir el valor
                                      if (valor < totalCalculado) {
                                        toast.warning("El total ingresado es menor al precio calculado.")
                                      }
                                      // Guardar el valor (ya se guardó en onChange, pero asegurarnos)
                                      actualizarProducto(producto.id, 'total', valor)
                                    }}
                                    className="w-24 h-8 text-xs font-medium text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    step="0.01"
                                  />
                                )
                              })()}
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
                <div className="flex justify-between items-center gap-4">
                  <span className="text-sm font-semibold">Total General:</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={totalGeneral}
                      onChange={(e) => {
                        const val = e.target.value
                        console.log('📝 Input onChange:', val)
                        handleTotalChange(val)
                      }}
                      onBlur={(e) => {
                        const val = e.target.value
                        console.log('📝 Input onBlur:', val)
                        handleTotalBlur(val)
                      }}
                      className="w-32 h-10 text-lg font-bold text-[#D54644] text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      step="0.01"
                    />
                    <span className="text-lg font-bold text-[#D54644]">Bs</span>
                  </div>
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
            <div className="grid gap-2 py-4">
              {modalVariantes.itemData?.variantes && Array.isArray(modalVariantes.itemData.variantes) && modalVariantes.itemData.variantes.length > 0 ? (
                modalVariantes.itemData.variantes
                  // Filtrar la variante "Sucursal" porque se toma automáticamente de la cotización
                  .filter((variante: any) => variante.nombre !== 'Sucursal' && variante.nombre !== 'sucursal')
                  .map((variante: any, index: number) => {
                    // Limpiar el nombre de la variante
                    let nombreLimpio = variante.nombre
                      // Eliminar nombre del producto (ej: "Lona frontligth")
                      .replace(/Lona frontligth/gi, '')
                      .replace(/LONA FRONTLIGTH/gi, '')
                      // Eliminar frases completas repetidas (ej: "Instalación en valla Instalación en valla")
                      .replace(/Instalación en valla\s+Instalación en valla/gi, 'Instalación en valla')
                      .replace(/Desinstalación en valla\s+Desinstalación en valla/gi, 'Desinstalación en valla')
                      // Eliminar palabras individuales repetidas
                      .replace(/\b(\w+)\s+\1\b/gi, '$1')
                      .trim()

                    // Si queda vacío, usar el original
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
                          <SelectTrigger id={`variante-${index}`} className="w-full h-12 text-base">
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent>
                            {(() => {
                              const opciones = variante.valores ?? variante.posibilidades ?? []
                              console.log("Opciones variante:", nombreLimpio, opciones)
                              return Array.isArray(opciones) && opciones.length > 0 ? opciones.map((opcion: string, pIndex: number) => (
                                <SelectItem key={pIndex} value={String(opcion).trim()}>
                                  {String(opcion).trim()}
                                </SelectItem>
                              )) : null
                            })()}
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
                  modalVariantes.itemData?.variantes
                    ?.filter((v: any) => v.nombre !== 'Sucursal' && v.nombre !== 'sucursal') // Excluir Sucursal de la validación
                    ?.some((v: any) =>
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
        <Dialog open={modalFechasSoporte.open} onOpenChange={(open) => {
          if (!open) {
            setModalFechasSoporte({ open: false, productoId: '', itemData: null, fechaInicio: '', fechaFin: '', meses: 1 })
            setOpenMeses(false)
          }
        }}>
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
                <Popover open={openMeses} onOpenChange={setOpenMeses}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openMeses}
                      className="w-full justify-between"
                      id="meses"
                    >
                      {modalFechasSoporte.meses === 0.5 
                        ? "15 días" 
                        : `${modalFechasSoporte.meses} ${modalFechasSoporte.meses === 1 ? 'Mes' : 'Meses'}`}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start" side="top" onWheel={(e) => e.stopPropagation()}>
                    <div className="max-h-[300px] overflow-y-auto overscroll-contain" onWheel={(e) => e.stopPropagation()}>
                      <div
                        className={`px-3 py-2 cursor-pointer hover:bg-accent text-sm ${
                          modalFechasSoporte.meses === 0.5 ? 'bg-accent font-medium' : ''
                        }`}
                        onClick={() => {
                          setModalFechasSoporte(prev => ({ ...prev, meses: 0.5 }))
                          setOpenMeses(false)
                        }}
                      >
                        15 días
                      </div>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((mes) => (
                        <div
                          key={mes}
                          className={`px-3 py-2 cursor-pointer hover:bg-accent text-sm ${
                            modalFechasSoporte.meses === mes ? 'bg-accent font-medium' : ''
                          }`}
                          onClick={() => {
                            setModalFechasSoporte(prev => ({ ...prev, meses: mes }))
                            setOpenMeses(false)
                          }}
                        >
                          {mes} {mes === 1 ? 'Mes' : 'Meses'}
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
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

        {/* Modal de confirmación de aprobación con alquileres */}
        <Dialog open={modalAprobacion.open} onOpenChange={(open) => !open && setModalAprobacion(prev => ({ ...prev, open: false }))}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>¿Seguro que quiere aprobar esta cotización?</DialogTitle>
              <DialogDescription>
                Se efectuarán las siguientes órdenes de alquiler:
              </DialogDescription>
            </DialogHeader>

            {modalAprobacion.soportesInfo.length > 0 ? (
              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-medium">Soporte</th>
                      <th className="text-left py-2 px-3 font-medium">Fechas</th>
                      <th className="text-right py-2 px-3 font-medium">Importe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalAprobacion.soportesInfo.map((info, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2 px-3">
                          <div>
                            <div className="font-medium">{info.soporte.codigo}</div>
                            <div className="text-xs text-gray-500">{info.soporte.titulo}</div>
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <div className="text-xs">
                            <div>Inicio: {new Date(info.fechaInicio).toLocaleDateString('es-ES')}</div>
                            <div>Fin: {new Date(info.fechaFin).toLocaleDateString('es-ES')}</div>
                            <div className="text-gray-500">
                              ({info.meses === 0.5 ? '15 días' : `${info.meses} mes${info.meses !== 1 ? 'es' : ''}`})
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="font-medium">
                            Bs {Number(info.importe || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-4 text-center text-gray-500">
                No hay soportes en esta cotización
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setModalAprobacion(prev => ({ ...prev, open: false }))}
                disabled={guardando}
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmarAprobacion}
                disabled={guardando || modalAprobacion.cargando}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {guardando ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  'Confirmar y Aprobar'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Nuevo Cliente */}
        <Dialog open={openNuevoClienteModal} onOpenChange={setOpenNuevoClienteModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Cliente</DialogTitle>
              <DialogDescription>Completa los datos del nuevo cliente</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Tipo de contacto */}
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="nuevo-kind-company"
                    name="nuevo-kind"
                    value="COMPANY"
                    checked={nuevoClienteFormData.kind === "COMPANY"}
                    onChange={(e) => setNuevoClienteFormData(prev => ({ ...prev, kind: e.target.value as "INDIVIDUAL" | "COMPANY" }))}
                    className="w-4 h-4 text-[#D54644]"
                  />
                  <Label htmlFor="nuevo-kind-company" className="flex items-center gap-2 cursor-pointer">
                    <Building2 className="w-4 h-4" />
                    Compañía
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="nuevo-kind-individual"
                    name="nuevo-kind"
                    value="INDIVIDUAL"
                    checked={nuevoClienteFormData.kind === "INDIVIDUAL"}
                    onChange={(e) => setNuevoClienteFormData(prev => ({ ...prev, kind: e.target.value as "INDIVIDUAL" | "COMPANY" }))}
                    className="w-4 h-4 text-[#D54644]"
                  />
                  <Label htmlFor="nuevo-kind-individual" className="flex items-center gap-2 cursor-pointer">
                    <User className="w-4 h-4" />
                    Individual
                  </Label>
                </div>
              </div>

              {/* Nombre del contacto */}
              <div>
                <Label htmlFor="nuevo-displayName">Nombre del Contacto *</Label>
                <Input
                  id="nuevo-displayName"
                  value={nuevoClienteFormData.displayName}
                  onChange={(e) => setNuevoClienteFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder={nuevoClienteFormData.kind === "COMPANY" ? "Nombre de la empresa" : "Nombre completo"}
                  required
                />
              </div>

              {/* Empresa (Individual) o Persona de Contacto (Compañía) */}
              {nuevoClienteFormData.kind === "INDIVIDUAL" ? (
                <div>
                  <Label htmlFor="nuevo-company">Empresa</Label>
                  <Popover open={nuevoClienteOpenEmpresaCombobox} onOpenChange={setNuevoClienteOpenEmpresaCombobox}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between",
                          !nuevoClienteFormData.companyId && "text-muted-foreground"
                        )}
                      >
                        <span className="truncate">
                          {nuevoClienteFormData.company || nuevoClienteFormData.companyId
                            ? (nuevoClienteFormData.company || nuevoClienteTodosLosContactos.find(c => c.id === nuevoClienteFormData.companyId && c.kind === 'COMPANY')?.displayName || "Seleccionar empresa")
                            : "Seleccionar empresa"}
                        </span>
                        <Check className={cn("ml-2 h-4 w-4 shrink-0", nuevoClienteFormData.companyId ? "opacity-100" : "opacity-0")} />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <Command shouldFilter={false} className="overflow-visible">
                        <CommandInput
                          placeholder="Buscar empresa..."
                          className="h-9 border-0 focus:ring-0"
                          onValueChange={nuevoClienteFiltrarEmpresas}
                        />
                        <CommandList>
                          <CommandEmpty>No se encontraron empresas.</CommandEmpty>
                          <CommandGroup>
                            {nuevoClienteFilteredEmpresas.map((c) => (
                              <CommandItem
                                key={c.id}
                                value={c.displayName}
                                onSelect={async () => {
                                  // Cargar datos completos de la empresa
                                  try {
                                    const empresaRes = await fetch(`/api/contactos/${c.id}`)
                                    if (empresaRes.ok) {
                                      const empresaData = await empresaRes.json()
                                      console.log('📋 Datos RAW de empresa:', JSON.stringify(empresaData, null, 2))
                                      
                                      // Importar datos de la empresa al nuevo contacto
                                      setNuevoClienteFormData(prev => {
                                        const nuevosDatos = {
                                          ...prev,
                                          companyId: c.id,
                                          company: c.displayName,
                                          // Importar razón social: solo si el campo actual está vacío
                                          razonSocial: prev.razonSocial?.trim() 
                                            ? prev.razonSocial 
                                            : (empresaData.razonSocial || empresaData.razon_social || ""),
                                          // Importar NIT: mapear nit → taxId
                                          taxId: prev.taxId?.trim() 
                                            ? prev.taxId 
                                            : (empresaData.taxId || empresaData.nit || ""),
                                          // Importar sitio web: mapear sitio_web → website
                                          website: prev.website?.trim() 
                                            ? prev.website 
                                            : (empresaData.website || empresaData.sitio_web || ""),
                                          // Importar dirección: mapear address/direccion → address1
                                          address1: prev.address1?.trim() 
                                            ? prev.address1 
                                            : (empresaData.address || empresaData.address1 || empresaData.direccion || ""),
                                          // Importar ciudad: mapear ciudad → city
                                          city: prev.city?.trim() 
                                            ? prev.city 
                                            : (empresaData.city || empresaData.ciudad || "")
                                        }
                                        console.log('✅ Datos importados al formulario:', {
                                          razonSocial: nuevosDatos.razonSocial,
                                          taxId: nuevosDatos.taxId,
                                          website: nuevosDatos.website,
                                          address1: nuevosDatos.address1,
                                          city: nuevosDatos.city
                                        })
                                        
                                        // Forzar re-render después de un pequeño delay para asegurar que los campos se actualicen
                                        setTimeout(() => {
                                          console.log('🔄 Verificando estado después de importación:', {
                                            razonSocial: nuevosDatos.razonSocial,
                                            taxId: nuevosDatos.taxId,
                                            website: nuevosDatos.website,
                                            address1: nuevosDatos.address1,
                                            city: nuevosDatos.city
                                          })
                                        }, 100)
                                        
                                        return nuevosDatos
                                      })
                                    } else {
                                      console.error('❌ Error cargando empresa:', empresaRes.status)
                                      // Si no se puede cargar, al menos guardar el ID y nombre
                                      setNuevoClienteFormData(prev => ({
                                        ...prev,
                                        companyId: c.id,
                                        company: c.displayName
                                      }))
                                    }
                                  } catch (error) {
                                    console.error('❌ Error cargando datos de empresa:', error)
                                    // En caso de error, al menos guardar el ID y nombre
                                    setNuevoClienteFormData(prev => ({
                                      ...prev,
                                      companyId: c.id,
                                      company: c.displayName
                                    }))
                                  }
                                  setNuevoClienteOpenEmpresaCombobox(false)
                                }}
                                className="cursor-pointer"
                              >
                                <Check className={cn("mr-2 h-4 w-4", nuevoClienteFormData.companyId === c.id ? "opacity-100" : "opacity-0")} />
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
              ) : (
                <div>
                  <Label>Persona de Contacto</Label>
                  <Popover open={nuevoClienteOpenPersonaContactoCombobox} onOpenChange={setNuevoClienteOpenPersonaContactoCombobox}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        <span className="text-muted-foreground">Buscar y agregar persona de contacto...</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <Command shouldFilter={false} className="overflow-visible">
                        <CommandInput
                          placeholder="Buscar contacto..."
                          className="h-9 border-0 focus:ring-0"
                          value={nuevoClientePersonaContactoInputValue}
                          onValueChange={(value) => {
                            setNuevoClientePersonaContactoInputValue(value)
                            nuevoClienteFiltrarPersonasContacto(value)
                          }}
                        />
                        <CommandList>
                          <CommandEmpty>No se encontraron contactos.</CommandEmpty>
                          <CommandGroup>
                            {nuevoClienteFilteredPersonasContacto.map((c) => {
                              const yaExiste = nuevoClienteFormData.personaContacto.some(p => p.id === c.id)
                              return (
                                <CommandItem
                                  key={c.id}
                                  value={c.displayName}
                                  onSelect={() => nuevoClienteAgregarPersonaContacto(c)}
                                  className={cn("cursor-pointer", yaExiste && "opacity-50")}
                                  disabled={yaExiste}
                                >
                                  <Check className={cn("mr-2 h-4 w-4", yaExiste ? "opacity-100" : "opacity-0")} />
                                  <div className="flex flex-col">
                                    <span className="font-medium">{c.displayName}</span>
                                    {c.legalName && <span className="text-xs text-gray-500">{c.legalName}</span>}
                                  </div>
                                </CommandItem>
                              )
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  
                  {/* Chips de personas de contacto */}
                  {nuevoClienteFormData.personaContacto && nuevoClienteFormData.personaContacto.length > 0 && (
                    <div className="min-h-[60px] w-full rounded-md border border-gray-200 bg-white p-3 mt-2">
                      <div className="flex flex-wrap gap-2">
                        {nuevoClienteFormData.personaContacto.map((persona) => (
                          <div
                            key={persona.id}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-sm bg-gray-100 text-gray-800"
                          >
                            <span>{persona.nombre}</span>
                            <button
                              type="button"
                              onClick={() => nuevoClienteRemoverPersonaContacto(persona.id)}
                              className="ml-1 hover:bg-gray-200 rounded-full p-0.5 transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Razón Social */}
              <div>
                <Label htmlFor="nuevo-razonSocial">Razón Social</Label>
                <Input
                  id="nuevo-razonSocial"
                  value={nuevoClienteFormData.razonSocial}
                  onChange={(e) => setNuevoClienteFormData(prev => ({ ...prev, razonSocial: e.target.value }))}
                  placeholder="Razón social"
                />
              </div>

              {/* NIT y Relación */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nuevo-taxId">NIT</Label>
                  <Input
                    id="nuevo-taxId"
                    value={nuevoClienteFormData.taxId}
                    onChange={(e) => setNuevoClienteFormData(prev => ({ ...prev, taxId: e.target.value }))}
                    placeholder="Número de identificación tributaria"
                  />
                </div>
                <div>
                  <Label htmlFor="nuevo-relation">Relación *</Label>
                  <Select 
                    value={nuevoClienteFormData.relation || "CUSTOMER"} 
                    onValueChange={(value) => {
                      console.log('🔄 Cambiando relación a:', value)
                      setNuevoClienteFormData(prev => ({ ...prev, relation: value as "CUSTOMER" | "SUPPLIER" | "BOTH" }))
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar relación" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CUSTOMER">Cliente</SelectItem>
                      <SelectItem value="SUPPLIER">Proveedor</SelectItem>
                      <SelectItem value="BOTH">Ambos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
              </div>

              {/* Información de contacto */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nuevo-phone">Teléfono</Label>
                  <Input
                    id="nuevo-phone"
                    value={nuevoClienteFormData.phone}
                    onChange={(e) => setNuevoClienteFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+591 2 123456"
                  />
                </div>
                <div>
                  <Label htmlFor="nuevo-email">Email</Label>
                  <Input
                    id="nuevo-email"
                    type="email"
                    value={nuevoClienteFormData.email}
                    onChange={(e) => setNuevoClienteFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="contacto@empresa.com"
                  />
                </div>
                <div>
                  <Label htmlFor="nuevo-website">Sitio Web</Label>
                  <Input
                    id="nuevo-website"
                    value={nuevoClienteFormData.website}
                    onChange={(e) => setNuevoClienteFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://www.empresa.com"
                  />
                </div>
                <div>
                  <Label htmlFor="nuevo-salesOwnerId">Comercial Asignado</Label>
                  <Select value={nuevoClienteFormData.salesOwnerId} onValueChange={(value) => setNuevoClienteFormData(prev => ({ ...prev, salesOwnerId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar comercial" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin asignar</SelectItem>
                      {nuevoClienteSalesOwners.map(owner => (
                        <SelectItem key={owner.id} value={owner.id}>{owner.nombre || owner.name || ""}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Dirección */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="nuevo-address1">Dirección</Label>
                  <Input
                    id="nuevo-address1"
                    value={nuevoClienteFormData.address1}
                    onChange={(e) => setNuevoClienteFormData(prev => ({ ...prev, address1: e.target.value }))}
                    placeholder="Calle y número"
                  />
                </div>
                <div>
                  <Label htmlFor="nuevo-city">Ciudad</Label>
                  <Input
                    id="nuevo-city"
                    value={nuevoClienteFormData.city}
                    onChange={(e) => setNuevoClienteFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Ciudad"
                  />
                </div>
                <div>
                  <Label htmlFor="nuevo-country">País</Label>
                  <Input
                    id="nuevo-country"
                    value={nuevoClienteFormData.country}
                    onChange={(e) => setNuevoClienteFormData(prev => ({ ...prev, country: e.target.value }))}
                    placeholder="País"
                  />
                </div>
              </div>

              {/* Notas */}
              <div>
                <Label htmlFor="nuevo-notes">Notas</Label>
                <Textarea
                  id="nuevo-notes"
                  placeholder="Escribe notas adicionales sobre este contacto..."
                  value={nuevoClienteFormData.notes}
                  onChange={(e) => setNuevoClienteFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setOpenNuevoClienteModal(false)
                  setNuevoClienteFormData({
                    kind: "COMPANY",
                    relation: "CUSTOMER",
                    displayName: "",
                    company: "",
                    companyId: "",
                    razonSocial: "",
                    personaContacto: [],
                    taxId: "",
                    phone: "",
                    email: "",
                    website: "",
                    address1: "",
                    city: "",
                    country: "Bolivia",
                    salesOwnerId: "none",
                    notes: "",
                  })
                }}
                disabled={nuevoClienteLoading}
              >
                Cancelar
              </Button>
              <Button
                onClick={guardarNuevoCliente}
                disabled={nuevoClienteLoading || !nuevoClienteFormData.displayName}
                className="bg-[#D54644] hover:bg-[#B03A38]"
              >
                {nuevoClienteLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
