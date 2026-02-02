"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronsUpDown, Trash2, Save, FileDown, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { api } from "@/lib/fetcher"
import { toast } from "sonner"

const TIPO_CAMBIO_DEFAULT = 6.96

interface ProductoInventario {
  id: string
  codigo: string
  nombre: string
  descripcion?: string
  unidad_medida?: string
}

interface FacturaItem {
  id: number
  item: string
  codigo_producto: string
  cantidad: number
  unidad_medida: string
  descripcion: string
  precio_unitario: number
  descuento: number
  /** Subtotal de línea: cantidad * precio_unitario - descuento (se envía como importe al API) */
  importe_bs: number
}

export interface InitialDataFromCotizacion {
  clienteId: string
  vendedorId: string
  nit?: string
  /** Si se abre desde "Crear factura" en cotizaciones, completar el campo Cotización */
  cotizacionId?: string
  cotizacionCodigoDisplay?: string
  items: Array<{
    codigo_producto: string
    descripcion: string
    cantidad: number
    unidad_medida: string
    precio_unitario: number
    descuento: number
    importe: number
  }>
}

interface FacturasManualesProps {
  initialFacturaId?: string | null
  /** Datos pre-cargados desde una cotización (vendedor, cliente, ítems). Fecha se fija a hoy; número queda para la factura. */
  initialDataFromCotizacion?: InitialDataFromCotizacion | null
  onFacturaLoad?: (data: { estado: string }) => void
  onEstadoChange?: (estado: string) => void
  /** Si se proporciona, el botón Guardar no se muestra en la card y la página puede mostrarlo en el header (p. ej. a la derecha de Volver) */
  onGuardarProps?: (props: { guardar: () => void; guardando: boolean }) => void
}

export default function FacturasManuales({ initialFacturaId = null, initialDataFromCotizacion = null, onFacturaLoad, onEstadoChange, onGuardarProps }: FacturasManualesProps) {
  const [numero, setNumero] = useState("")
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0])
  const [vendedorId, setVendedorId] = useState("")
  const [cliente, setCliente] = useState("")
  const [nit, setNit] = useState("")
  const [detalle, setDetalle] = useState("")
  const [moneda, setMoneda] = useState("BOB")
  const [contactos, setContactos] = useState<any[]>([])
  const [filteredContactos, setFilteredContactos] = useState<any[]>([])
  const [openClienteCombobox, setOpenClienteCombobox] = useState(false)
  const [openNitCombobox, setOpenNitCombobox] = useState(false)
  const [filteredContactosPorNit, setFilteredContactosPorNit] = useState<any[]>([])
  const [cargandoContactos, setCargandoContactos] = useState(false)
  const [vendedores, setVendedores] = useState<any[]>([])
  const [filteredVendedores, setFilteredVendedores] = useState<any[]>([])
  const [openVendedorCombobox, setOpenVendedorCombobox] = useState(false)
  const [cargandoVendedores, setCargandoVendedores] = useState(false)
  const [facturaId, setFacturaId] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [cargandoFactura, setCargandoFactura] = useState(false)
  const [descargandoPDF, setDescargandoPDF] = useState(false)
  const [productos, setProductos] = useState<ProductoInventario[]>([])
  const [filteredProductos, setFilteredProductos] = useState<Record<number, ProductoInventario[]>>({})
  const [cargandoProductos, setCargandoProductos] = useState(false)
  const [openCodigoProductoCombobox, setOpenCodigoProductoCombobox] = useState<Record<number, boolean>>({})
  const [estado, setEstado] = useState<string>("BORRADOR")
  const [tipoCambio, setTipoCambio] = useState<number>(TIPO_CAMBIO_DEFAULT)
  const [cotizacionId, setCotizacionId] = useState<string>("")
  const [cotizacionCodigoDisplay, setCotizacionCodigoDisplay] = useState<string>("")
  const [cotizaciones, setCotizaciones] = useState<any[]>([])
  const [filteredCotizaciones, setFilteredCotizaciones] = useState<any[]>([])
  const [openCotizacionCombobox, setOpenCotizacionCombobox] = useState(false)
  const [cargandoCotizaciones, setCargandoCotizaciones] = useState(false)
  const [items, setItems] = useState<FacturaItem[]>([
    {
      id: 1,
      item: "1",
      codigo_producto: "",
      cantidad: 0,
      unidad_medida: "",
      descripcion: "",
      precio_unitario: 0,
      descuento: 0,
      importe_bs: 0,
    },
  ])

  const recalcSubtotal = (item: FacturaItem): number => {
    const subtotal = item.cantidad * item.precio_unitario - item.descuento
    return Math.max(0, Math.round(subtotal * 100) / 100)
  }

  const handleItemChange = (id: number, field: keyof FacturaItem, value: string | number) => {
    setItems(
      items.map((item) => {
        if (item.id !== id) return item
        const updated = { ...item, [field]: value }
        if (field === "cantidad" || field === "precio_unitario" || field === "descuento") {
          updated.importe_bs = recalcSubtotal(updated)
        }
        return updated
      })
    )
  }

  const handleAddItem = () => {
    const newId = items.length > 0 ? Math.max(...items.map((i) => i.id)) + 1 : 1
    setItems([
      ...items,
      {
        id: newId,
        item: newId.toString(),
        codigo_producto: "",
        cantidad: 0,
        unidad_medida: "",
        descripcion: "",
        precio_unitario: 0,
        descuento: 0,
        importe_bs: 0,
      },
    ])
  }

  const handleRemoveItem = (id: number) => {
    setItems(items.filter((item) => item.id !== id))
  }

  const total = items.reduce((sum, item) => sum + item.importe_bs, 0)

  const handleGuardar = async () => {
    if (!cliente.trim()) {
      toast.error("Cliente es requerido")
      return
    }
    if (items.length === 0 || items.every((i) => !i.descripcion?.trim() && !i.codigo_producto?.trim() && i.cantidad === 0 && i.precio_unitario === 0)) {
      toast.error("Agregue al menos un ítem con código/descripción y monto")
      return
    }
    setGuardando(true)
    try {
      const payload = {
        numero: numero.trim() || null,
        fecha: fecha || new Date().toISOString().split("T")[0],
        vendedor_id: vendedorId || null,
        cliente_nombre: cliente.trim(),
        cliente_nit: nit.trim(),
        glosa: detalle.trim() || null,
        moneda,
        cotizacion: cotizacionId || null,
        tipo_cambio: tipoCambio,
        estado: facturaId ? estado : undefined,
        items: items.map((it) => {
          const sinUnidad = (it.codigo_producto ?? "").trim().toUpperCase() === "PRO-001"
          return {
            codigo_producto: it.codigo_producto?.trim() || null,
            descripcion: it.descripcion?.trim() || "",
            cantidad: Number(it.cantidad) || 0,
            unidad_medida: sinUnidad ? null : (it.unidad_medida?.trim() || null),
            precio_unitario: Number(it.precio_unitario) || 0,
            descuento: Number(it.descuento) || 0,
            importe: Number(it.importe_bs) || 0,
          }
        }),
      }
      if (facturaId) {
        const res = await api(`/api/contabilidad/facturas-manuales/${facturaId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
        const result = await res.json().catch(() => ({}))
        if (res.ok) {
          toast.success("Factura actualizada correctamente")
          cargarListaFacturas()
        } else {
          toast.error(result.error || "Error al actualizar la factura")
        }
      } else {
        const res = await api("/api/contabilidad/facturas-manuales", {
          method: "POST",
          body: JSON.stringify(payload),
        })
        const result = await res.json().catch(() => ({}))
        if (res.ok && result.data?.id) {
          setFacturaId(result.data.id)
          toast.success("Factura guardada correctamente")
        } else {
          toast.error(result.error || "Error al guardar la factura")
        }
      }
    } catch (e) {
      console.error("Error guardando factura:", e)
      toast.error("Error de conexión")
    } finally {
      setGuardando(false)
    }
  }

  const handleGuardarRef = useRef(handleGuardar)
  handleGuardarRef.current = handleGuardar
  useEffect(() => {
    onGuardarProps?.({ guardar: () => handleGuardarRef.current(), guardando })
  }, [guardando, onGuardarProps])

  const handleNuevaFactura = () => {
    setFacturaId(null)
    setNumero("")
    setFecha(new Date().toISOString().split("T")[0])
    setVendedorId("")
    setCliente("")
    setNit("")
    setDetalle("")
    setItems([
      {
        id: 1,
        item: "1",
        codigo_producto: "",
        cantidad: 0,
        unidad_medida: "",
        descripcion: "",
        precio_unitario: 0,
        descuento: 0,
        importe_bs: 0,
      },
    ])
  }

  const cargarContactos = useCallback(async () => {
    setCargandoContactos(true)
    try {
      const response = await fetch("/api/contactos")
      const data = await response.json()
      const list = data.data || []
      setContactos(list)
      setFilteredContactos(list.slice(0, 50))
      setFilteredContactosPorNit(list.slice(0, 50))
    } catch (error) {
      console.error("Error cargando contactos:", error)
    } finally {
      setCargandoContactos(false)
    }
  }, [])

  const cargarVendedores = useCallback(async () => {
    setCargandoVendedores(true)
    try {
      const response = await fetch("/api/public/comerciales")
      const data = await response.json()
      const list = data.users || []
      setVendedores(list)
      setFilteredVendedores(list.slice(0, 50))
    } catch (error) {
      console.error("Error cargando vendedores:", error)
    } finally {
      setCargandoVendedores(false)
    }
  }, [])

  const [facturasLista, setFacturasLista] = useState<any[]>([])
  const [cargandoLista, setCargandoLista] = useState(false)

  const cargarListaFacturas = useCallback(async () => {
    setCargandoLista(true)
    try {
      const res = await api("/api/contabilidad/facturas-manuales")
      const json = await res.json().catch(() => ({}))
      const list = json.data || []
      setFacturasLista(list)
    } catch (error) {
      console.error("Error cargando lista de facturas:", error)
    } finally {
      setCargandoLista(false)
    }
  }, [])

  const cargarProductos = useCallback(async () => {
    setCargandoProductos(true)
    try {
      const [resInv, resSop] = await Promise.all([
        fetch("/api/inventario?limit=500&page=1"),
        fetch("/api/soportes?limit=500&page=1"),
      ])
      const jsonInv = await resInv.json().catch(() => ({}))
      const jsonSop = await resSop.json().catch(() => ({}))
      const fromInv = (jsonInv.data || []).map((p: any) => {
        const codigo = (p.codigo ?? "").trim().toUpperCase()
        const sinUnidad = codigo === "PRO-001"
        return {
          id: p.id,
          codigo: p.codigo ?? "",
          nombre: p.nombre ?? "",
          descripcion: p.descripcion ?? "",
          unidad_medida: sinUnidad ? "" : (p.unidad_medida ?? ""),
        }
      })
      const fromSop = (jsonSop.data || []).map((s: any) => ({
        id: `sop-${s.id}`,
        codigo: s.code ?? "",
        nombre: s.title ?? "",
        descripcion: s.address ?? "",
        unidad_medida: "mes",
      }))
      const list = [...fromInv, ...fromSop]
      setProductos(list)
    } catch (error) {
      console.error("Error cargando productos/soportes:", error)
    } finally {
      setCargandoProductos(false)
    }
  }, [])

  const cargarCotizacionesPorBusqueda = useCallback(async (search: string) => {
    setCargandoCotizaciones(true)
    try {
      const params = new URLSearchParams({ pageSize: "30", page: "1", estado: "Aprobada" })
      if (search.trim()) params.set("search", search.trim())
      const res = await fetch(`/api/cotizaciones?${params.toString()}`, { credentials: "include" })
      const json = await res.json().catch(() => ({}))
      const list = json.data || []
      setCotizaciones(list)
      setFilteredCotizaciones(list)
    } catch (error) {
      console.error("Error cargando cotizaciones:", error)
      setFilteredCotizaciones([])
    } finally {
      setCargandoCotizaciones(false)
    }
  }, [])

  const filtrarCotizaciones = (value: string) => {
    cargarCotizacionesPorBusqueda(value)
  }

  /** Al seleccionar una cotización en el autocompletar, cargar todos sus datos en la factura */
  const cargarDatosDesdeCotizacion = useCallback(async (id: string, codigo: string) => {
    setCotizacionId(id)
    setCotizacionCodigoDisplay(codigo || "")
    setOpenCotizacionCombobox(false)
    try {
      const [cotRes, comercialesRes] = await Promise.all([
        fetch(`/api/cotizaciones/${id}`, { credentials: "include" }).then((r) => r.json()),
        fetch("/api/public/comerciales", { credentials: "include" }).then((r) => r.json()),
      ])
      if (!cotRes.success || !cotRes.data?.cotizacion) {
        toast.error("No se pudo cargar la cotización")
        return
      }
      const cot = cotRes.data.cotizacion
      const lineas = cotRes.data.lineas || []
      const comerciales = comercialesRes.users || []
      const vendedorIdResuelto = comerciales.find((c: any) => c.nombre === cot.vendedor)?.id ?? ""

      setCliente(cot.cliente ?? "")
      setVendedorId(vendedorIdResuelto)

      const itemsLineas = lineas.filter(
        (l: any) => (l.tipo === "producto" || l.codigo_producto) && (l.cantidad ?? 0) > 0
      )
      const mapped = itemsLineas.map((l: any, i: number) => {
        const cantidad = Number(l.cantidad) || 0
        const precioUnit = l.precio_unitario != null ? Number(l.precio_unitario) : (l.subtotal_linea != null && cantidad > 0 ? Number(l.subtotal_linea) / cantidad : 0)
        const subtotal = l.subtotal_linea != null ? Number(l.subtotal_linea) : cantidad * precioUnit
        return {
          id: i + 1,
          item: String(i + 1),
          codigo_producto: l.codigo_producto ?? "",
          descripcion: [l.nombre_producto, l.descripcion].filter(Boolean).join(" - ") || "",
          cantidad,
          unidad_medida: l.unidad_medida ?? "m²",
          precio_unitario: precioUnit,
          descuento: 0,
          importe_bs: Math.round(subtotal * 100) / 100,
        }
      })
      setItems(mapped.length > 0 ? mapped : [
        { id: 1, item: "1", codigo_producto: "", cantidad: 0, unidad_medida: "", descripcion: "", precio_unitario: 0, descuento: 0, importe_bs: 0 },
      ])
      toast.success("Datos de la cotización cargados")
    } catch (_) {
      toast.error("Error al cargar los datos de la cotización")
    }
  }, [])

  const filtrarProductosPorItem = (itemId: number, value: string) => {
    if (!value.trim()) {
      setFilteredProductos((prev) => ({ ...prev, [itemId]: productos.slice(0, 50) }))
      return
    }
    const v = value.toLowerCase()
    const filtered = productos.filter(
      (p) =>
        (p.codigo || "").toLowerCase().includes(v) ||
        (p.nombre || "").toLowerCase().includes(v)
    )
    setFilteredProductos((prev) => ({ ...prev, [itemId]: filtered.slice(0, 50) }))
  }

  const cargarFacturaPorId = useCallback(async (id: string) => {
    setCargandoFactura(true)
    try {
      const res = await api(`/api/contabilidad/facturas-manuales/${id}`)
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(json.error || "Error al cargar la factura")
        return
      }
      const data = json.data
      if (!data) return
      setFacturaId(data.id)
      const estadoFactura = (data.estado ?? "BORRADOR") as string
      setEstado(estadoFactura)
      onFacturaLoad?.({ estado: estadoFactura })
      setNumero(data.numero ?? "")
      setFecha(data.fecha ?? new Date().toISOString().split("T")[0])
      setVendedorId(data.vendedor_id ?? "")
      setCliente(data.cliente_nombre ?? "")
      setNit(data.cliente_nit ?? "")
      setDetalle(data.glosa ?? "")
      setMoneda(data.moneda ?? "BOB")
      setTipoCambio(Number(data.tipo_cambio) || TIPO_CAMBIO_DEFAULT)
      setCotizacionId(data.cotizacion ?? "")
      setCotizacionCodigoDisplay("")
      if (data.cotizacion) {
        try {
          const resCot = await fetch(`/api/cotizaciones/${data.cotizacion}`, { credentials: "include" })
          const jsonCot = await resCot.json().catch(() => ({}))
          if (jsonCot.success && jsonCot.data?.cotizacion?.codigo) {
            setCotizacionCodigoDisplay(jsonCot.data.cotizacion.codigo)
          }
        } catch (_) {}
      }
      const itemsData = Array.isArray(data.items) ? data.items : []
      setItems(
        itemsData.length > 0
          ? itemsData.map((it: any, i: number) => {
              const cant = Number(it.cantidad) ?? 0
              const pUnit = Number(it.precio_unitario) ?? 0
              const desc = Number(it.descuento) ?? 0
              const imp = Number(it.importe) ?? cant * pUnit - desc
              const sinUnidad = ((it.codigo_producto ?? "").trim().toUpperCase() === "PRO-001")
              return {
                id: i + 1,
                item: String(i + 1),
                codigo_producto: it.codigo_producto ?? "",
                cantidad: cant,
                unidad_medida: sinUnidad ? "" : (it.unidad_medida ?? ""),
                descripcion: it.descripcion ?? "",
                precio_unitario: pUnit,
                descuento: desc,
                importe_bs: imp,
              }
            })
          : [
              {
                id: 1,
                item: "1",
                codigo_producto: "",
                cantidad: 0,
                unidad_medida: "",
                descripcion: "",
                precio_unitario: 0,
                descuento: 0,
                importe_bs: 0,
              },
            ]
      )
    } catch (error) {
      console.error("Error cargando factura:", error)
      toast.error("Error de conexión al cargar factura")
    } finally {
      setCargandoFactura(false)
    }
  }, [onFacturaLoad])

  useEffect(() => {
    cargarContactos()
  }, [cargarContactos])

  useEffect(() => {
    cargarVendedores()
  }, [cargarVendedores])

  useEffect(() => {
    cargarProductos()
  }, [cargarProductos])

  useEffect(() => {
    if (initialFacturaId) {
      cargarFacturaPorId(initialFacturaId)
    }
  }, [initialFacturaId, cargarFacturaPorId])

  useEffect(() => {
    if (initialDataFromCotizacion && !initialFacturaId) {
      setCliente(initialDataFromCotizacion.clienteId)
      setVendedorId(initialDataFromCotizacion.vendedorId)
      setNit(initialDataFromCotizacion.nit ?? "")
      setFecha(new Date().toISOString().split("T")[0])
      if (initialDataFromCotizacion.cotizacionId) {
        setCotizacionId(initialDataFromCotizacion.cotizacionId)
        setCotizacionCodigoDisplay(initialDataFromCotizacion.cotizacionCodigoDisplay ?? "")
      }
      const mapped = initialDataFromCotizacion.items.map((it, i) => ({
        id: i + 1,
        item: String(i + 1),
        codigo_producto: it.codigo_producto ?? "",
        cantidad: it.cantidad ?? 0,
        unidad_medida: it.unidad_medida ?? "",
        descripcion: it.descripcion ?? "",
        precio_unitario: it.precio_unitario ?? 0,
        descuento: it.descuento ?? 0,
        importe_bs: it.importe ?? 0,
      }))
      setItems(mapped.length > 0 ? mapped : [
        { id: 1, item: "1", codigo_producto: "", cantidad: 0, unidad_medida: "", descripcion: "", precio_unitario: 0, descuento: 0, importe_bs: 0 },
      ])
    }
  }, [initialDataFromCotizacion, initialFacturaId])

  // Cargar siguiente número FAC-0001 al abrir nueva factura (editable como referencia en registro de movimiento)
  useEffect(() => {
    if (initialFacturaId) return
    const cargarSiguienteNumero = async () => {
      try {
        const res = await api("/api/contabilidad/facturas-manuales/generar-numero")
        const data = await res.json().catch(() => ({}))
        if (data.success && data.codigo) setNumero(data.codigo)
      } catch (_) {}
    }
    cargarSiguienteNumero()
  }, [initialFacturaId])

  const filtrarContactos = (value: string) => {
    if (!value) {
      setFilteredContactos(contactos.slice(0, 50))
      return
    }
    const v = value.toLowerCase()
    const filtered = contactos.filter(
      (c: any) =>
        (c.displayName || c.nombre || "").toLowerCase().includes(v) ||
        (c.legalName || "").toLowerCase().includes(v) ||
        (c.taxId || c.nit || "").toLowerCase().includes(v)
    )
    setFilteredContactos(filtered.slice(0, 50))
  }

  const filtrarContactosPorNit = (value: string) => {
    if (!value) {
      setFilteredContactosPorNit(contactos.slice(0, 50))
      return
    }
    const v = value.toLowerCase()
    const filtered = contactos.filter(
      (c: any) =>
        (String(c.taxId ?? c.nit ?? "").toLowerCase().includes(v) ||
          (c.displayName || c.nombre || "").toLowerCase().includes(v) ||
          (c.legalName || "").toLowerCase().includes(v))
    )
    setFilteredContactosPorNit(filtered.slice(0, 50))
  }

  const filtrarVendedores = (value: string) => {
    if (!value) {
      setFilteredVendedores(vendedores.slice(0, 50))
      return
    }
    const v = value.toLowerCase()
    const filtered = vendedores.filter(
      (u: any) =>
        (u.nombre || "").toLowerCase().includes(v) ||
        (u.email || "").toLowerCase().includes(v)
    )
    setFilteredVendedores(filtered.slice(0, 50))
  }

  const actualizarEstadoFactura = async (nuevoEstado: string) => {
    if (!facturaId) return
    setGuardando(true)
    try {
      const payload = {
        numero: numero.trim() || null,
        fecha: fecha || new Date().toISOString().split("T")[0],
        vendedor_id: vendedorId || null,
        cliente_nombre: cliente.trim(),
        cliente_nit: nit.trim(),
        glosa: detalle.trim() || null,
        moneda,
        cotizacion: cotizacionId || null,
        tipo_cambio: tipoCambio,
        estado: nuevoEstado,
        items: items.map((it) => {
          const sinUnidad = (it.codigo_producto ?? "").trim().toUpperCase() === "PRO-001"
          return {
            codigo_producto: it.codigo_producto?.trim() || null,
            descripcion: it.descripcion?.trim() || "",
            cantidad: Number(it.cantidad) || 0,
            unidad_medida: sinUnidad ? null : (it.unidad_medida?.trim() || null),
            precio_unitario: Number(it.precio_unitario) || 0,
            descuento: Number(it.descuento) || 0,
            importe: Number(it.importe_bs) || 0,
          }
        }),
      }
      const res = await api(`/api/contabilidad/facturas-manuales/${facturaId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      })
      const result = await res.json().catch(() => ({}))
      if (res.ok) {
        setEstado(nuevoEstado)
        onEstadoChange?.(nuevoEstado)
        toast.success(nuevoEstado === "ANULADA" ? "Factura anulada" : "Factura aprobada")
      } else {
        toast.error(result.error || "Error al actualizar estado")
      }
    } catch (e) {
      console.error("Error actualizando estado:", e)
      toast.error("Error de conexión")
    } finally {
      setGuardando(false)
    }
  }

  const handleAnularFactura = () => {
    if (!facturaId) {
      toast.error("No hay factura cargada")
      return
    }
    actualizarEstadoFactura("ANULADA")
  }

  const handleAprobarFactura = () => {
    if (!facturaId) {
      toast.error("No hay factura cargada")
      return
    }
    actualizarEstadoFactura("FACTURADA")
  }

  const handleDescargarFactura = async () => {
    if (!facturaId || descargandoPDF) return
    setDescargandoPDF(true)
    try {
      const res = await fetch(`/api/contabilidad/facturas-manuales/${facturaId}/pdf`, { credentials: "include" })
      if (!res.ok) {
        toast.error("Error al descargar el PDF")
        return
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const codigo = (numero || "").trim() || facturaId.slice(0, 8)
      a.download = `${codigo.replace(/[/\\?%*:|"<>]/g, "-")}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success("Factura descargada")
    } catch (_) {
      toast.error("Error al descargar el PDF")
    } finally {
      setDescargandoPDF(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle>Factura Manual</CardTitle>
            <CardDescription>
              Crear y gestionar facturas manuales
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={handleAnularFactura}
              variant="outline"
              size="sm"
              disabled={guardando || estado === "ANULADA"}
              className="text-red-600 hover:text-red-700 border-red-600 hover:bg-red-50"
            >
              Anular factura
            </Button>
            <Button
              onClick={handleAprobarFactura}
              variant="outline"
              size="sm"
              disabled={guardando || estado === "FACTURADA"}
              className="text-green-600 hover:text-green-700 border-green-600 hover:bg-green-50"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Aprobar factura
            </Button>
            {facturaId && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDescargarFactura}
                disabled={descargandoPDF}
              >
                <FileDown className="w-4 h-4 mr-2" />
                {descargandoPDF ? "Descargando..." : "Descargar factura"}
              </Button>
            )}
            {!onGuardarProps && (
              <Button
                onClick={handleGuardar}
                disabled={guardando}
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {guardando ? "Guardando..." : "Guardar"}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Campos principales */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Datos de la Factura</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="numero" className="text-xs text-gray-600">
                Número
              </Label>
              <Input
                id="numero"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder="Número de factura"
                className="mt-1 font-mono"
              />
            </div>
            <div className="w-fit">
              <Label htmlFor="fecha" className="text-xs text-gray-600">
                Fecha
              </Label>
              <Input
                id="fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="mt-1 w-[10.5rem] min-w-0"
              />
            </div>
            <div className="w-[8.5rem]">
              <Label htmlFor="moneda" className="text-xs text-gray-600">
                Moneda
              </Label>
              <Select value={moneda} onValueChange={setMoneda}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BOB">Bolivianos</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-[8.5rem]">
              <Label htmlFor="tipo_cambio" className="text-xs text-gray-600">
                Tipo de cambio
              </Label>
              <Input
                id="tipo_cambio"
                type="number"
                step="0.01"
                min="0"
                value={tipoCambio}
                onChange={(e) => setTipoCambio(Number(e.target.value) || 0)}
                className="mt-1 w-full font-mono"
              />
            </div>
            <div>
              <Label htmlFor="cliente" className="text-xs text-gray-600">
                Cliente
              </Label>
              <Popover open={openClienteCombobox} onOpenChange={setOpenClienteCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "mt-1 w-full justify-between font-normal",
                      !cliente && "text-muted-foreground"
                    )}
                  >
                    <span className="truncate">
                      {cliente || "Buscar cliente..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Buscar por nombre o NIT..."
                      className="h-9 border-0 focus:ring-0"
                      onValueChange={filtrarContactos}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {cargandoContactos ? "Cargando..." : "No se encontraron contactos."}
                      </CommandEmpty>
                      <CommandGroup>
                        {filteredContactos.map((contacto: any) => (
                          <CommandItem
                            key={contacto.id}
                            value={contacto.displayName || contacto.nombre}
                            onSelect={() => {
                              const nombre =
                                contacto.displayName || contacto.nombre || contacto.legalName || ""
                              const nitVal =
                                (contacto.taxId ?? contacto.nit ?? "") !== ""
                                  ? String(contacto.taxId ?? contacto.nit)
                                  : ""
                              setCliente(nombre)
                              setNit(nitVal)
                              setOpenClienteCombobox(false)
                              setOpenNitCombobox(false)
                            }}
                            className="cursor-pointer"
                          >
                            <Check className="mr-2 h-4 w-4 opacity-0" />
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {contacto.displayName || contacto.nombre}
                              </span>
                              {contacto.legalName && (
                                <span className="text-xs text-gray-500">{contacto.legalName}</span>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="nit" className="text-xs text-gray-600">
                NIT
              </Label>
              <Popover open={openNitCombobox} onOpenChange={setOpenNitCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "mt-1 w-full justify-between font-normal",
                      !nit && "text-muted-foreground"
                    )}
                  >
                    <span className="truncate">
                      {nit || "Buscar por NIT..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Buscar por NIT o nombre..."
                      className="h-9 border-0 focus:ring-0"
                      onValueChange={filtrarContactosPorNit}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {cargandoContactos ? "Cargando..." : "No se encontraron contactos."}
                      </CommandEmpty>
                      <CommandGroup>
                        {filteredContactosPorNit.map((contacto: any) => {
                          const nitVal =
                            (contacto.taxId ?? contacto.nit ?? "") !== ""
                              ? String(contacto.taxId ?? contacto.nit)
                              : ""
                          const nombre =
                            contacto.displayName || contacto.nombre || contacto.legalName || ""
                          return (
                            <CommandItem
                              key={contacto.id}
                              value={nitVal || nombre || contacto.id}
                              onSelect={() => {
                                setNit(nitVal)
                                setCliente(nombre)
                                setOpenNitCombobox(false)
                                setOpenClienteCombobox(false)
                              }}
                              className="cursor-pointer"
                            >
                              <Check className="mr-2 h-4 w-4 opacity-0" />
                              <div className="flex flex-col">
                                <span className="font-medium">{nitVal || "—"}</span>
                                <span className="text-xs text-gray-500">
                                  {contacto.displayName || contacto.nombre}
                                </span>
                              </div>
                            </CommandItem>
                          )
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="vendedor" className="text-xs text-gray-600">
                Vendedor
              </Label>
              <Popover open={openVendedorCombobox} onOpenChange={setOpenVendedorCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "mt-1 w-full justify-between font-normal",
                      !vendedorId && "text-muted-foreground"
                    )}
                  >
                    <span className="truncate">
                      {vendedorId
                        ? vendedores.find((v: any) => v.id === vendedorId)?.nombre || vendedorId
                        : "Buscar vendedor..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Buscar por nombre..."
                      className="h-9 border-0 focus:ring-0"
                      onValueChange={filtrarVendedores}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {cargandoVendedores ? "Cargando..." : "No se encontraron vendedores."}
                      </CommandEmpty>
                      <CommandGroup>
                        {filteredVendedores.map((user: any) => (
                          <CommandItem
                            key={user.id}
                            value={user.nombre || user.id}
                            onSelect={() => {
                              setVendedorId(user.id)
                              setOpenVendedorCombobox(false)
                            }}
                            className="cursor-pointer"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                vendedorId === user.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <span className="font-medium">{user.nombre}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="min-w-0 flex-1">
              <Label className="text-xs text-gray-600">Cotización</Label>
              <Popover
                open={openCotizacionCombobox}
                onOpenChange={(open) => {
                  setOpenCotizacionCombobox(open)
                  if (open) cargarCotizacionesPorBusqueda("")
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "mt-1 w-full justify-between font-normal",
                      !cotizacionCodigoDisplay && "text-muted-foreground"
                    )}
                  >
                    <span className="truncate">
                      {cotizacionCodigoDisplay || "Buscar por código..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Buscar por código..."
                      className="h-9 border-0 focus:ring-0"
                      onValueChange={filtrarCotizaciones}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {cargandoCotizaciones ? "Cargando..." : "No se encontraron cotizaciones."}
                      </CommandEmpty>
                      <CommandGroup>
                        {filteredCotizaciones.map((c: any) => (
                          <CommandItem
                            key={c.id}
                            value={c.codigo || c.id}
                            onSelect={() => cargarDatosDesdeCotizacion(c.id, c.codigo || "")}
                            className="cursor-pointer"
                          >
                            <Check className="mr-2 h-4 w-4 opacity-0" />
                            <span className="font-mono">{c.codigo}</span>
                            {c.cliente && (
                              <span className="ml-2 text-xs text-gray-500 truncate">{c.cliente}</span>
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div>
            <Label htmlFor="glosa" className="text-xs text-gray-600">
              Glosa
            </Label>
            <Textarea
              id="glosa"
              value={detalle}
              onChange={(e) => setDetalle(e.target.value)}
              placeholder="Ej.: Venta de mercadería según pedido Nº 001 - Cliente Juan Pérez"
              className="mt-1"
              rows={3}
            />
          </div>
        </div>

        <Separator />

        {/* Tabla de ítems */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Ítems de la Factura</h3>
            <Button onClick={handleAddItem} variant="outline" size="sm">
              Agregar Ítem
            </Button>
          </div>
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Item</TableHead>
                  <TableHead className="w-28">Código</TableHead>
                  <TableHead className="w-20">Cantidad</TableHead>
                  <TableHead className="w-20">Unidad</TableHead>
                  <TableHead className="min-w-[180px]">Descripción</TableHead>
                  <TableHead className="w-28">P. unit.</TableHead>
                  <TableHead className="w-24">Descuento</TableHead>
                  <TableHead className="w-28 text-right">Subtotal</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-gray-500 py-8">
                      No hay ítems. Click en "Agregar Ítem" para comenzar.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item, idx) => {
                    const listForItem = filteredProductos[item.id] ?? productos.slice(0, 50)
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{idx + 1}</TableCell>
                        <TableCell>
                          <Popover
                            open={!!openCodigoProductoCombobox[item.id]}
                            onOpenChange={(open) =>
                              setOpenCodigoProductoCombobox((prev) => ({ ...prev, [item.id]: open }))
                            }
                          >
                            <PopoverTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full max-w-[7rem] justify-between font-mono text-xs",
                                  !item.codigo_producto && "text-muted-foreground"
                                )}
                              >
                                <span className="truncate">
                                  {item.codigo_producto || "Código..."}
                                </span>
                                <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[320px] p-0" align="start">
                              <Command shouldFilter={false}>
                                <CommandInput
                                  placeholder="Buscar por código o nombre..."
                                  className="h-9 border-0"
                                  onValueChange={(val) => filtrarProductosPorItem(item.id, val)}
                                />
                                <CommandList>
                                  <CommandEmpty>
                                    {cargandoProductos ? "Cargando..." : "No hay productos."}
                                  </CommandEmpty>
                                  <CommandGroup>
                                    {listForItem.map((prod) => (
                                      <CommandItem
                                        key={prod.id}
                                        value={`${prod.codigo} ${prod.nombre}`}
                                        onSelect={() => {
                                          const descBase = [prod.nombre, prod.descripcion].filter(Boolean).join(" - ")
                                          const sinUnidad = (prod.codigo ?? "").trim().toUpperCase() === "PRO-001"
                                          setItems((prev) =>
                                            prev.map((it) => {
                                              if (it.id !== item.id) return it
                                              const updated = {
                                                ...it,
                                                codigo_producto: prod.codigo,
                                                unidad_medida: sinUnidad ? "" : (prod.unidad_medida ?? ""),
                                                descripcion: descBase,
                                              }
                                              updated.importe_bs = recalcSubtotal(updated)
                                              return updated
                                            })
                                          )
                                          setOpenCodigoProductoCombobox((prev) => ({ ...prev, [item.id]: false }))
                                        }}
                                        className="cursor-pointer"
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            item.codigo_producto === prod.codigo ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        <div className="flex flex-col">
                                          <span className="font-mono font-medium">{prod.codigo}</span>
                                          <span className="text-xs text-muted-foreground truncate">
                                            {prod.nombre}
                                            {prod.unidad_medida ? ` · ${prod.unidad_medida}` : ""}
                                          </span>
                                        </div>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            step={1}
                            value={item.cantidad}
                            onChange={(e) =>
                              handleItemChange(item.id, "cantidad", parseFloat(e.target.value) || 0)
                            }
                            className="w-20 text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={(item.codigo_producto?.trim().toUpperCase() === "PRO-001" ? "" : item.unidad_medida) ?? ""}
                            readOnly
                            placeholder="—"
                            className="w-20 bg-muted/50 cursor-default"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.descripcion}
                            onChange={(e) => handleItemChange(item.id, "descripcion", e.target.value)}
                            placeholder="Descripción (editable)"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={item.precio_unitario}
                            onChange={(e) =>
                              handleItemChange(
                                item.id,
                                "precio_unitario",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-28 text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={item.descuento}
                            onChange={(e) =>
                              handleItemChange(item.id, "descuento", parseFloat(e.target.value) || 0)
                            }
                            className="w-24 text-right"
                          />
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {item.importe_bs.toLocaleString("es-ES", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-600 hover:text-red-700"
                            title="Eliminar línea"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <Separator />

        {/* Footer */}
        <div className="flex items-center justify-end pt-4">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-semibold">Total:</Label>
            <span className="text-lg font-bold font-mono">
              {total.toLocaleString("es-ES", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              {moneda === "BOB" ? "Bs." : "$"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}







