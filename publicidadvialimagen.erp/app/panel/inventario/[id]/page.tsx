"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, Save, Trash2, Edit, Image as ImageIcon, Calculator, DollarSign, Plus, X, Palette } from "lucide-react"
import { toast } from "sonner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Categorías disponibles
const categoriasProductos = [
  "Categoria general",
  "Impresion Digital",
  "Corte y Grabado",
  "Displays"
]

// Unidades de medida disponibles
const unidadesProductos = [
  "m2",
  "unidad"
]


interface Producto {
  id: string
  codigo: string
  nombre: string
  descripcion?: string
  imagen_portada?: string
  imagen_attachment_id?: string | null
  categoria: string
  responsable: string
  unidad_medida: string
  coste: number
  precio_venta: number
  cantidad: number
  mostrar_en_web?: boolean
}

type ProductoFormState = {
  codigo: string
  nombre: string
  descripcion: string
  imagen_portada: string
  imagen_attachment_id: string | null
  imagenFile: File | null
  categoria: string
  responsable: string
  unidad_medida: string
  coste: string
  precio_venta: string
  cantidad: string
  mostrar_en_web: boolean
}

export default function ProductoDetailPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const id = (params?.id || '') as string
  const shouldEdit = searchParams?.get('edit') === 'true'
  
  const [producto, setProducto] = useState<Producto | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [editing, setEditing] = useState(false)
  
  // Detectar si es un nuevo producto
  const isNewProduct = id === 'nuevo' || id === 'new'
  
  // Estados para calculadora de costes
  const [recursos, setRecursos] = useState<any[]>([])
  const costRowIdCounterRef = useRef(2) // Usar ref para mantener el contador entre renders
  const [costRows, setCostRows] = useState([{
    id: 1,
    selectedRecurso: null as any,
    cantidad: 1,
    unidad: "",
    searchTerm: ""
  }])
  const [filteredRecursos, setFilteredRecursos] = useState<any[]>([])
  const [showCostDropdown, setShowCostDropdown] = useState<number | null>(null)
  const [totalCost, setTotalCost] = useState(0)
  const [editableCost, setEditableCost] = useState<string>("")
  
  // Estados para calculadora de precios
  const [priceRowIdCounter, setPriceRowIdCounter] = useState(5)
  const [priceRows, setPriceRows] = useState([
    { id: 1, campo: "Coste", porcentaje: 0, valor: 0 },
    { id: 2, campo: "Utilidad (U)", porcentaje: 28, valor: 0 },
    { id: 3, campo: "Comisión (C)", porcentaje: 8, valor: 0 },
    { id: 4, campo: "Factura (F)", porcentaje: 16, valor: 0 }
  ])
  const [totalPrice, setTotalPrice] = useState(0)
  const [editablePrice, setEditablePrice] = useState<string>("")
  
  // Estados para variantes del producto (solo visualización, importadas de recursos)
  const [variantes, setVariantes] = useState<any[]>([])
  
  // Estados para tabla de proveedores
  const [proveedorIdCounter, setProveedorIdCounter] = useState(1)
  const [proveedores, setProveedores] = useState<Array<{
    id: number
    empresa: string
    precio: string
    unidad: string
    plazos: string
    comentarios: string
  }>>([])
  
  const [formData, setFormData] = useState<ProductoFormState>({
    codigo: "",
    nombre: "",
    descripcion: "",
    imagen_portada: "",
    imagen_attachment_id: null,
    imagenFile: null,
    categoria: "Categoria general",
    responsable: "",
    unidad_medida: "unidad",
    coste: "0",
    precio_venta: "0",
    cantidad: "0",
    mostrar_en_web: false
  })
  const previewUrlRef = useRef<string | null>(null)

  useEffect(() => {
    if (isNewProduct) {
      // Si es un nuevo producto, no cargar datos y activar modo edición directamente
      setLoading(false)
      setEditing(true)
    } else if (id) {
      fetchProducto()
    }
  }, [id, isNewProduct])

  useEffect(() => {
    if (producto && !isNewProduct) {
      // Siempre activar modo edición (eliminando la vista de solo lectura)
      setEditing(true)
    }
  }, [producto, isNewProduct])

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
      }
    }
  }, [])

  const fetchProducto = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/inventario/${id}`)
      if (response.ok) {
        const result = await response.json()
        const data = result.data || result
        setProducto(data)
        setFormData({
          codigo: data.codigo || "",
          nombre: data.nombre || "",
          descripcion: data.descripcion || "",
          imagen_portada: data.imagen_portada || "",
          imagen_attachment_id: null,
          imagenFile: null,
          categoria: data.categoria || "Categoria general",
          responsable: data.responsable || "",
          unidad_medida: data.unidad_medida || "unidad",
          coste: data.coste?.toString() || "0",
          precio_venta: data.precio_venta?.toString() || "0",
          cantidad: data.cantidad?.toString() || "0",
          mostrar_en_web: data.mostrar_en_web ?? false
        })
        // Cargar variantes desde el producto
        if (data.variantes && Array.isArray(data.variantes)) {
          setVariantes(data.variantes)
        } else {
          setVariantes([])
        }
        
        // Cargar proveedores desde el producto
        if (data.proveedores && Array.isArray(data.proveedores)) {
          let maxProveedorId = 0
          const proveedoresData = data.proveedores.map((prov: any, index: number) => {
            // Usar el ID del proveedor si existe, sino generar uno único
            const provId = prov.id || (index + 1)
            maxProveedorId = Math.max(maxProveedorId, provId)
            return {
              id: provId,
              empresa: prov.empresa || "",
              precio: prov.precio?.toString() || "",
              unidad: prov.unidad || "",
              plazos: prov.plazos || "",
              comentarios: prov.comentarios || ""
            }
          })
          setProveedorIdCounter(maxProveedorId + 1)
          setProveedores(proveedoresData)
        } else {
          setProveedores([])
          setProveedorIdCounter(1)
        }

        // Cargar receta y restaurar recursos en la calculadora de costes
        if (data.receta && Array.isArray(data.receta) && data.receta.length > 0) {
          // Primero obtener los recursos completos desde la API
          const recursosResponse = await fetch('/api/recursos')
          if (recursosResponse.ok) {
            const recursosResult = await recursosResponse.json()
            const todosLosRecursos = recursosResult.data || []
            
            // Mapear la receta a costRows con los recursos completos
            let maxId = 0
            const recetaRows = data.receta.map((item: any, index: number) => {
              // Buscar el recurso completo por ID o código
              const recursoCompleto = todosLosRecursos.find((r: any) => 
                r.id === item.recurso_id || (r.codigo || r.id) === item.recurso_codigo
              )
              
              const newId = index + 1
              maxId = Math.max(maxId, newId)
              
              return {
                id: newId,
                selectedRecurso: recursoCompleto || null,
                cantidad: item.cantidad || 1,
                unidad: item.unidad || (recursoCompleto?.unidad_medida || ""),
                searchTerm: item.recurso_nombre || recursoCompleto?.nombre || ""
              }
            })
            
            // Actualizar el contador de IDs para evitar duplicados
            if (recetaRows.length > 0) {
              costRowIdCounterRef.current = maxId + 1
              setCostRows(recetaRows)
            } else {
              costRowIdCounterRef.current = 2
              setCostRows([{
                id: 1,
                selectedRecurso: null,
                cantidad: 1,
                unidad: "",
                searchTerm: ""
              }])
            }
          }
        }
      } else {
        toast.error("Producto no encontrado")
        router.push("/panel/inventario")
      }
    } catch (error) {
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = <K extends keyof ProductoFormState>(field: K, value: ProductoFormState[K]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleRemoveImage = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
    setFormData(prev => ({
      ...prev,
      imagen_portada: "",
      imagenFile: null,
      imagen_attachment_id: null
    }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no puede superar los 5MB")
      e.target.value = ''
      return
    }

    if (!file.type.startsWith('image/')) {
      toast.error("El archivo debe ser una imagen (JPG, PNG, GIF)")
      e.target.value = ''
      return
    }

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
    }
    const previewUrl = URL.createObjectURL(file)
    previewUrlRef.current = previewUrl

    setFormData(prev => ({
      ...prev,
      imagen_portada: previewUrl,
      imagenFile: file,
      imagen_attachment_id: null
    }))

    e.target.value = ''
  }

  const handleSave = async () => {
    if (!formData.codigo || !formData.nombre) {
      toast.error("Código y nombre son requeridos")
      return
    }

    setSaving(true)
    
    try {
      // Construir receta (lista de recursos seleccionados en la calculadora de costes)
      const receta = costRows
        .filter(row => row.selectedRecurso)
        .map(row => ({
          recurso_id: row.selectedRecurso.id,
          recurso_codigo: row.selectedRecurso.codigo || row.selectedRecurso.id,
          recurso_nombre: row.selectedRecurso.nombre,
          cantidad: row.cantidad,
          unidad: row.unidad,
          coste_unitario: row.selectedRecurso.coste,
          coste_total: row.selectedRecurso.coste * row.cantidad
        }))

      let imagenMeta: { attachmentId?: string; publicUrl?: string } | undefined

      if (formData.imagenFile) {
        setUploadingImage(true)
        toast.loading("Subiendo imagen...", { id: 'upload-image' })
        const imageFormData = new FormData()
        imageFormData.append('file', formData.imagenFile)
        if (!isNewProduct && id) {
          imageFormData.append('recordId', id)
        }

        const uploadTargetId = isNewProduct ? 'new' : id

        try {
          const uploadResponse = await fetch(`/api/inventario/${uploadTargetId}/image`, {
            method: 'POST',
            body: imageFormData
          })
          const uploadData = await uploadResponse.json().catch(() => ({}))
          
          console.log("📤 [FRONTEND] Upload response:", {
            ok: uploadResponse.ok,
            status: uploadResponse.status,
            data: uploadData
          })
          
          if (!uploadResponse.ok || uploadData.success === false) {
            const errorMessage = uploadData.error || `Error subiendo imagen (status ${uploadResponse.status})`
            console.error("❌ [FRONTEND] Error en respuesta de upload:", errorMessage)
            throw new Error(errorMessage)
          }
          
          if (!uploadData.data) {
            console.error("❌ [FRONTEND] No se recibió data en la respuesta")
            throw new Error("No se recibieron datos de la subida de imagen")
          }
          
          imagenMeta = uploadData.data
          console.log("✅ [FRONTEND] Imagen subida correctamente:", imagenMeta)
          
          // Si hay warning, mostrarlo
          if (uploadData.warning) {
            toast.warning(uploadData.warning, { id: 'upload-image' })
          } else if (imagenMeta?.attachmentId) {
            toast.success("Imagen subida a Airtable correctamente", { id: 'upload-image' })
          } else if (imagenMeta?.publicUrl) {
            toast.warning("Imagen guardada localmente (fallback). Configura AIRTABLE_API_KEY para subir directamente a Airtable.", { id: 'upload-image', duration: 5000 })
          } else {
            toast.success("Imagen subida correctamente", { id: 'upload-image' })
          }
        } catch (error) {
          console.error("❌ [FRONTEND] Error subiendo Imagen Principal:", error)
          toast.error(error instanceof Error ? error.message : "Error subiendo la imagen", { id: 'upload-image' })
          setSaving(false)
          return
        } finally {
          setUploadingImage(false)
        }
      }

      const existingImagenUrl = producto?.imagen_portada || null
      let cleanedImagenUrl: string | null = null

      if (formData.imagen_portada) {
        const trimmed = formData.imagen_portada.trim()
        if (trimmed && !trimmed.startsWith('blob:')) {
          cleanedImagenUrl = trimmed
        }
      }

      const dataToSend: Record<string, any> = {
        codigo: formData.codigo.trim(),
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion?.trim() || "",
        categoria: formData.categoria,
        responsable: formData.responsable.trim(),
        unidad_medida: formData.unidad_medida,
        coste: parseFloat(formData.coste) || 0,
        precio_venta: parseFloat(formData.precio_venta) || 0,
        cantidad: parseInt(formData.cantidad) || 0,
        mostrar_en_web: formData.mostrar_en_web,
        variantes: variantes.length > 0 ? variantes : [],
        receta: receta.length > 0 ? receta : [],
        proveedores: proveedores.length > 0 ? proveedores.map(prov => ({
          empresa: prov.empresa,
          precio: parseFloat(prov.precio) || 0,
          unidad: prov.unidad,
          plazos: prov.plazos,
          comentarios: prov.comentarios
        })) : []
      }

      if (imagenMeta?.attachmentId) {
        dataToSend.imagen_attachment_id = imagenMeta.attachmentId
        dataToSend.imagen_portada = null
      } else if (imagenMeta?.publicUrl) {
        dataToSend.imagen_portada = imagenMeta.publicUrl as string
        dataToSend.imagen_attachment_id = null
      } else {
        if (isNewProduct) {
          if (cleanedImagenUrl) {
            dataToSend.imagen_portada = cleanedImagenUrl
          } else {
            dataToSend.imagen_portada = null
            dataToSend.imagen_attachment_id = null
          }
        } else {
          if (!cleanedImagenUrl && existingImagenUrl) {
            dataToSend.imagen_portada = null
            dataToSend.imagen_attachment_id = null
          } else if (cleanedImagenUrl && cleanedImagenUrl !== existingImagenUrl) {
            dataToSend.imagen_portada = cleanedImagenUrl
            dataToSend.imagen_attachment_id = null
          }
        }
      }

      console.log("💾 Guardando producto:", {
        id,
        isNewProduct,
        variantesCount: variantes.length,
        recetaCount: receta.length,
        imagen_attachment_id: dataToSend.imagen_attachment_id,
        imagen_portada: dataToSend.imagen_portada,
        variantes,
        receta,
        dataToSend
      })

      // Si es un nuevo producto, usar POST, si no, usar PUT
      const url = isNewProduct ? '/api/inventario' : `/api/inventario/${id}`
      const method = isNewProduct ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend)
      })

      const responseData = await response.json().catch(() => ({}))

      if (response.ok && responseData.success !== false) {
        const updated = responseData.data || responseData
        setProducto(updated)
        console.log("✅ Producto guardado correctamente:", updated)
        console.log("✅ Variantes guardadas:", updated.variantes)
        console.log("✅ Receta guardada:", updated.receta)

        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current)
          previewUrlRef.current = null
        }
        setFormData(prev => ({
          ...prev,
          imagen_portada: updated.imagen_portada || "",
          imagen_attachment_id: null,
          imagenFile: null
        }))
        
        // Verificar si se guardaron las variantes y receta
        if ((variantes.length > 0 && !updated.variantes) || (receta.length > 0 && !updated.receta)) {
          console.warn("⚠️ ADVERTENCIA: Las variantes o receta no se guardaron correctamente")
          toast.warning("Producto guardado, pero algunos campos pueden no haberse actualizado")
        } else {
          if (isNewProduct) {
            toast.success("Producto creado correctamente")
          } else {
            toast.success("Producto actualizado correctamente")
          }
        }
        
        // Esperar un momento antes de redirigir para asegurar que el toast se muestre
        await new Promise(resolve => setTimeout(resolve, 300))
        router.push("/panel/inventario")
      } else {
        const errorMessage = responseData.error || responseData.message || `Error ${response.status}: ${response.statusText}`
        console.error("❌ Error guardando producto:", errorMessage, responseData)
        
        // Verificar si es error de campos faltantes
        if (errorMessage.includes('Variante') || errorMessage.includes('Receta') || errorMessage.includes('no existe')) {
          toast.warning("Producto guardado, pero los campos Variante/Receta no existen en Airtable. Crea estos campos para guardarlos.")
        } else {
          toast.error(errorMessage || "Error al guardar el producto")
        }
        setSaving(false)
      }
    } catch (error) {
      console.error("❌ Error saving producto:", error)
      toast.error(error instanceof Error ? error.message : "Error de conexión al guardar")
      setUploadingImage(false)
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/inventario/${id}`, { method: "DELETE" })
      if (response.ok) {
        toast.success("Producto eliminado correctamente")
        router.push("/panel/inventario")
      } else {
        toast.error("Error al eliminar el producto")
      }
    } catch (error) {
      toast.error("Error de conexión")
    }
  }

  // Cargar recursos para calculadora de costes
  useEffect(() => {
    if (editing) {
      fetchRecursos()
    }
  }, [editing])

  // Cerrar dropdown cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.dropdown-container')) {
        setShowCostDropdown(null)
      }
    }

    if (editing) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [editing])

  // Actualizar fila de coste en calculadora de precios cuando cambie el coste calculado
  useEffect(() => {
    if (editing && totalCost > 0) {
      setPriceRows(prev => {
        const costeRow = prev.find(r => r.campo === "Coste")
        if (costeRow && parseNum(costeRow.valor) !== totalCost) {
          const updated = prev.map(row => 
            row.campo === "Coste" ? { ...row, valor: totalCost } : row
          )
          return recalcAllPrices(updated)
        }
        return prev
      })
    }
  }, [totalCost, editing])

  // Calcular total de precios
  useEffect(() => {
    const total = priceRows.reduce((sum, row) => sum + (typeof row.valor === 'number' ? row.valor : parseFloat(String(row.valor)) || 0), 0)
    setTotalPrice(total)
    // Sincronizar el valor editable cuando cambia el total calculado
    setEditablePrice(total.toFixed(2))
  }, [priceRows])

  // Calcular total de costes
  useEffect(() => {
    const total = costRows.reduce((sum, row) => {
      if (row.selectedRecurso && row.cantidad > 0) {
        return sum + (row.selectedRecurso.coste * row.cantidad)
      }
      return sum
    }, 0)
    setTotalCost(total)
    // Sincronizar el valor editable cuando cambia el total calculado
    setEditableCost(total.toFixed(2))
  }, [costRows])

  const fetchRecursos = async () => {
    try {
      const response = await fetch('/api/recursos')
      if (response.ok) {
        const result = await response.json()
        setRecursos(result.data || [])
      }
    } catch (error) {
      console.error('Error al cargar recursos:', error)
    }
  }

  // Funciones helper para calculadora de precios
  const parseNum = (v: number | string) => {
    if (typeof v === "number") return v
    const s = (v ?? "").toString().replace(",", ".").replace(/^0+(?=\d)/, "")
    const n = parseFloat(s)
    return isFinite(n) ? n : 0
  }

  const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

  const recalcAllPrices = (rowsIn: typeof priceRows) => {
    const rows = JSON.parse(JSON.stringify(rowsIn))
    const coste = parseNum(rows.find((r: any) => r.campo === "Coste")?.valor ?? 0)
    
    const adicionales = rows
      .filter((r: any) => !["Coste", "Utilidad (U)", "Factura (F)", "Comisión (C)"].includes(r.campo))
      .reduce((sum: number, r: any) => sum + parseNum(r.valor), 0)

    const utilRow = rows.find((r: any) => r.campo === "Utilidad (U)")
    if (utilRow) {
      const p = parseNum(utilRow.porcentaje) || 28
      utilRow.porcentaje = p
      utilRow.valor = round2(coste * (p / 100))
    }
    const utilidad = utilRow ? parseNum(utilRow.valor) : 0

    const comRow = rows.find((r: any) => r.campo === "Comisión (C)")
    if (comRow) {
      const base = coste + utilidad + adicionales
      const p = parseNum(comRow.porcentaje) || 8
      comRow.porcentaje = p
      comRow.valor = round2(base * (p / 100))
    }

    const facRow = rows.find((r: any) => r.campo === "Factura (F)")
    if (facRow) {
      const base = coste + utilidad + adicionales
      const p = parseNum(facRow.porcentaje) || 16
      facRow.porcentaje = p
      facRow.valor = round2(base * (p / 100))
    }

    rows.forEach((r: any) => {
      if (!["Coste", "Utilidad (U)", "Factura (F)", "Comisión (C)"].includes(r.campo)) {
        const p = parseNum(r.porcentaje)
        if (p !== 0 && r.porcentaje !== "") {
          r.valor = round2(coste * (p / 100))
        } else {
          const v = parseNum(r.valor)
          const pct = coste > 0 ? (v / coste) * 100 : 0
          r.porcentaje = round2(pct)
        }
      }
    })

    return rows
  }

  const recalcDependientesPrices = (rowsIn: typeof priceRows) => {
    const rows = JSON.parse(JSON.stringify(rowsIn))
    const coste = parseNum(rows.find((r: any) => r.campo === "Coste")?.valor ?? 0)
    const utilidad = parseNum(rows.find((r: any) => r.campo === "Utilidad (U)")?.valor ?? 0)
    const adicionales = rows
      .filter((r: any) => !["Coste", "Utilidad (U)", "Factura (F)", "Comisión (C)"].includes(r.campo))
      .reduce((sum: number, r: any) => sum + parseNum(r.valor), 0)
    const base = coste + utilidad + adicionales

    const com = rows.find((r: any) => r.campo === "Comisión (C)")
    if (com) {
      const p = parseNum(com.porcentaje) || 8
      com.valor = round2(base * (p / 100))
    }

    const fac = rows.find((r: any) => r.campo === "Factura (F)")
    if (fac) {
      const p = parseNum(fac.porcentaje) || 16
      fac.valor = round2(base * (p / 100))
    }

    return rows
  }

  // Handlers para calculadora de costes
  const handleCostSearchChange = (rowId: number, searchTerm: string) => {
    setCostRows(prev => prev.map(row => 
      row.id === rowId 
        ? { ...row, searchTerm, selectedRecurso: null }
        : row
    ))
    
    if (searchTerm.trim().length > 0) {
      const filtered = recursos.filter((recurso: any) => 
        recurso.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (recurso.codigo || recurso.id || "").toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredRecursos(filtered)
      setShowCostDropdown(rowId)
    } else {
      setShowCostDropdown(null)
    }
  }

  const handleRecursoSelect = (rowId: number, recurso: any) => {
    setCostRows(prev => prev.map(row => 
      row.id === rowId 
        ? { 
            ...row, 
            selectedRecurso: recurso, 
            unidad: recurso.unidad_medida,
            searchTerm: recurso.nombre
          }
        : row
    ))
    setShowCostDropdown(null)
    
    // Si el recurso tiene variantes, importarlas automáticamente al producto
    if (recurso.variantes && Array.isArray(recurso.variantes) && recurso.variantes.length > 0) {
      setVariantes(prev => {
        // Combinar las variantes existentes con las nuevas, evitando duplicados por nombre
        const existingNames = new Set(prev.map(v => v.nombre))
        const nuevasVariantes = recurso.variantes.filter((v: any) => !existingNames.has(v.nombre))
        return [...prev, ...nuevasVariantes]
      })
      toast.success(`${recurso.variantes.length} variante(s) importada(s) desde el recurso`)
    }
  }

  const handleCostRowChange = (rowId: number, field: string, value: any) => {
    setCostRows(prev => prev.map(row => 
      row.id === rowId 
        ? { ...row, [field]: value }
        : row
    ))
  }

  const handleAddCostRow = () => {
    // Usar el ref para obtener un ID único de forma síncrona
    const newRowId = costRowIdCounterRef.current
    costRowIdCounterRef.current += 1 // Incrementar para el próximo uso
    
    console.log('🔵 handleAddCostRow - Usando ID del ref:', newRowId)
    console.log('🔵 handleAddCostRow - Próximo ID será:', costRowIdCounterRef.current)
    
    setCostRows(prev => {
      console.log('🔵 handleAddCostRow - IDs existentes:', prev.map(r => r.id))
      
      const newRows = [...prev, {
        id: newRowId,
        selectedRecurso: null,
        cantidad: 1,
        unidad: "",
        searchTerm: ""
      }]
      
      console.log('🔵 handleAddCostRow - IDs después de agregar:', newRows.map(r => r.id))
      
      return newRows
    })
  }

  const handleRemoveCostRow = (rowId: number) => {
    if (costRows.length > 1) {
      setCostRows(prev => prev.filter(row => row.id !== rowId))
    }
  }

  const handleApplyCost = async () => {
    const costValue = parseFloat(editableCost) || 0
    if (costValue <= 0) {
      toast.error("El coste debe ser mayor a 0")
      return
    }

    try {
      // Actualizar el formData local
      handleChange("coste", costValue.toString())
      
      // Guardar directamente en la base de datos
      const dataToSend = {
        codigo: formData.codigo.trim(),
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion?.trim() || "",
        imagen_portada: formData.imagen_portada || null,
        categoria: formData.categoria,
        responsable: formData.responsable.trim(),
        unidad_medida: formData.unidad_medida,
        coste: costValue,
        precio_venta: parseFloat(formData.precio_venta) || 0,
        cantidad: parseInt(formData.cantidad) || 0,
        mostrar_en_web: formData.mostrar_en_web
      }

      const response = await fetch(`/api/inventario/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend)
      })

      if (response.ok) {
        const result = await response.json()
        const updated = result.data || result
        setProducto(updated)
        toast.success(`Coste aplicado y guardado: Bs ${costValue.toFixed(2)}`)
      } else {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || errorData.message || "Error al guardar el coste"
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error("Error saving cost:", error)
      toast.error("Error de conexión al guardar el coste")
    }
  }

  // Handlers para calculadora de precios
  const handlePriceCampoChange = (rowId: number, campo: string) => {
    setPriceRows(prev => prev.map(r => (r.id === rowId ? { ...r, campo } : r)))
  }

  const handlePricePorcentajeChange = (rowId: number, pctStr: string) => {
    setPriceRows(prev => {
      const rowsCopy = JSON.parse(JSON.stringify(prev))
      const row = rowsCopy.find((r: any) => r.id === rowId)
      if (!row) return prev

      if (pctStr === "") {
        row.porcentaje = ""
        return rowsCopy
      }

      const pct = parseNum(pctStr)
      row.porcentaje = pct
      const coste = parseNum(rowsCopy.find((r: any) => r.campo === "Coste")?.valor ?? 0)

      if (row.campo === "Utilidad (U)") {
        row.valor = round2(coste * (pct / 100))
        return recalcDependientesPrices(rowsCopy)
      }

      if (row.campo === "Factura (F)" || row.campo === "Comisión (C)") {
        return recalcDependientesPrices(rowsCopy.map((r: any) => (r.id === rowId ? { ...row } : r)))
      }

      row.valor = round2(coste * (pct / 100))
      return recalcDependientesPrices(rowsCopy)
    })
  }

  const handlePriceValorChange = (rowId: number, valStr: string) => {
    setPriceRows(prev => {
      const rowsCopy = JSON.parse(JSON.stringify(prev))
      const row = rowsCopy.find((r: any) => r.id === rowId)
      if (!row) return prev

      if (valStr === "") {
        row.valor = ""
        return rowsCopy
      }

      const val = parseNum(valStr)
      row.valor = val
      const coste = parseNum(rowsCopy.find((r: any) => r.campo === "Coste")?.valor ?? 0)

      if (row.campo === "Utilidad (U)") {
        const pct = coste > 0 ? (val / coste) * 100 : 0
        row.porcentaje = round2(pct)
        return recalcDependientesPrices(rowsCopy)
      }

      if (row.campo === "Factura (F)" || row.campo === "Comisión (C)") {
        const utilidad = parseNum(rowsCopy.find((r: any) => r.campo === "Utilidad (U)")?.valor ?? 0)
        const adicionales = rowsCopy
          .filter((r: any) => !["Coste", "Utilidad (U)", "Factura (F)", "Comisión (C)"].includes(r.campo))
          .reduce((s: number, r: any) => s + parseNum(r.valor), 0)
        const base = coste + utilidad + adicionales
        const pct = base > 0 ? (val / base) * 100 : 0
        row.porcentaje = round2(pct)
        return recalcDependientesPrices(rowsCopy)
      }

      const pct = coste > 0 ? (val / coste) * 100 : 0
      row.porcentaje = round2(pct)
      return recalcDependientesPrices(rowsCopy)
    })
  }

  const handleAddPriceRow = () => {
    setPriceRows(prev => {
      const newId = priceRowIdCounter
      setPriceRowIdCounter(prevCounter => prevCounter + 1)
      const newRow = { id: newId, campo: "", porcentaje: 0, valor: 0 }
      const copy = JSON.parse(JSON.stringify(prev))
      const utilIdx = copy.findIndex((r: any) => r.campo === "Utilidad (U)")
      const insertAt = utilIdx > -1 ? utilIdx : copy.length
      copy.splice(insertAt, 0, newRow)
      return copy
    })
  }

  const handleRemovePriceRow = (rowId: number) => {
    setPriceRows(prev => {
      const row = prev.find(r => r.id === rowId)
      if (!row || row.campo === "Coste") return prev
      const filtered = prev.filter(r => r.id !== rowId)
      return recalcDependientesPrices(filtered)
    })
  }

  const handleApplyPrice = async () => {
    const priceValue = parseFloat(editablePrice) || 0
    if (priceValue <= 0) {
      toast.error("El precio debe ser mayor a 0")
      return
    }

    try {
      // Actualizar el formData local
      handleChange("precio_venta", priceValue.toString())
      
      // Guardar directamente en la base de datos
      const dataToSend = {
        codigo: formData.codigo.trim(),
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion?.trim() || "",
        imagen_portada: formData.imagen_portada || null,
        categoria: formData.categoria,
        responsable: formData.responsable.trim(),
        unidad_medida: formData.unidad_medida,
        coste: parseFloat(formData.coste) || 0,
        precio_venta: priceValue,
        cantidad: parseInt(formData.cantidad) || 0,
        mostrar_en_web: formData.mostrar_en_web
      }

      const response = await fetch(`/api/inventario/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend)
      })

      if (response.ok) {
        const result = await response.json()
        const updated = result.data || result
        setProducto(updated)
        toast.success(`Precio aplicado y guardado: Bs ${priceValue.toFixed(2)}`)
      } else {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || errorData.message || "Error al guardar el precio"
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error("Error saving price:", error)
      toast.error("Error de conexión al guardar el precio")
    }
  }


  // Inicializar calculadora de precios con coste actual cuando se entra en modo edición
  useEffect(() => {
    if (editing && !saving) {
      const coste = parseFloat(formData.coste) || (producto?.coste || 0)
      setPriceRows(prev => {
        const costeRow = prev.find(r => r.campo === "Coste")
        if (costeRow && parseNum(costeRow.valor) !== coste) {
          const updated = prev.map(row => 
            row.campo === "Coste" ? { ...row, valor: coste } : row
          )
          return recalcAllPrices(updated)
        }
        return prev
      })
      // Inicializar el campo editable con el coste actual si no hay costRows o si está vacío
      if (costRows.length === 1 && !costRows[0].selectedRecurso) {
        setEditableCost(coste.toFixed(2))
      }
      // Inicializar el campo editable de precio con el precio actual
      const precio = parseFloat(formData.precio_venta) || (producto?.precio_venta || 0)
      setEditablePrice(precio.toFixed(2))
    }
  }, [editing, producto?.id, isNewProduct])

  // Calcular porcentaje de utilidad
  const calcularPorcentajeUtilidad = (coste: number, precioVenta: number): number => {
    if (coste === 0) return 0
    return ((precioVenta - coste) / coste) * 100
  }

  // Handlers para tabla de proveedores
  const handleAddProveedor = () => {
    const newId = proveedorIdCounter
    setProveedorIdCounter(prev => prev + 1)
    setProveedores(prev => [...prev, {
      id: newId,
      empresa: "",
      precio: "",
      unidad: "",
      plazos: "",
      comentarios: ""
    }])
  }

  const handleRemoveProveedor = (id: number) => {
    setProveedores(prev => prev.filter(p => p.id !== id))
  }

  const handleProveedorChange = (id: number, field: string, value: string) => {
    setProveedores(prev => prev.map(prov => 
      prov.id === id ? { ...prov, [field]: value } : prov
    ))
  }

  const utilidad = calcularPorcentajeUtilidad(
    parseFloat(formData.coste) || 0,
    parseFloat(formData.precio_venta) || 0
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-500">Cargando...</div>
      </div>
    )
  }

  // Solo mostrar error si no es un nuevo producto y no hay producto cargado
  if (!isNewProduct && !producto && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-500">Producto no encontrado</div>
      </div>
    )
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-500">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-xl font-bold text-slate-800">Inventario</div>
            <div className="flex items-center gap-6 ml-4">
              <Link 
                href="/panel/inventario" 
                className="text-sm font-medium text-[#D54644] hover:text-[#D54644]/80 transition-colors"
              >
                Productos
              </Link>
              <Link 
                href="/panel/recursos" 
                className="text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
              >
                Recursos
              </Link>
              <Link 
                href="/panel/ajustes-inventario" 
                className="text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
              >
                Control de Stock
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => {
                router.push("/panel/inventario")
              }}
            >
              Cancelar
            </Button>
            {!isNewProduct && producto && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Se eliminará permanentemente el producto "{producto.nombre}".
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button 
              onClick={handleSave}
              className="bg-[#D54644] hover:bg-[#B03A38]"
              disabled={saving}
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Guardando..." : "Guardar"}
            </Button>
            <span className="text-gray-600">Buscar</span>
            <span className="text-gray-800 font-medium">admin</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              {isNewProduct ? 'Nuevo Producto' : 'Editar Producto'}
            </h1>
            <p className="text-gray-600">
              {isNewProduct ? 'Crea un nuevo producto en el inventario' : 'Modifica la información del producto'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Columna Izquierda */}
          <div className="space-y-8">
            {/* Información Básica */}
            <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
              <CardDescription>Datos principales del producto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {editing ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="codigo">Código *</Label>
                    <Input
                      id="codigo"
                      value={formData.codigo}
                      onChange={(e) => handleChange("codigo", e.target.value)}
                      className="bg-neutral-100 border-neutral-200 text-gray-900 font-mono"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => handleChange("nombre", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descripcion">Descripción</Label>
                    <Textarea
                      id="descripcion"
                      value={formData.descripcion}
                      onChange={(e) => handleChange("descripcion", e.target.value)}
                      rows={4}
                      placeholder="Descripción detallada del producto"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="categoria">Categoría</Label>
                      <Select 
                        value={formData.categoria} 
                        onValueChange={(value) => handleChange("categoria", value)}
                      >
                        <SelectTrigger className="bg-white dark:bg-white text-gray-900 border border-gray-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-md">
                          {categoriasProductos.map((categoria) => (
                            <SelectItem key={categoria} value={categoria}>
                              {categoria}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cantidad">Stock</Label>
                      <Input
                        id="cantidad"
                        type="number"
                        min="0"
                        value={formData.cantidad}
                        onChange={(e) => handleChange("cantidad", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="responsable">Responsable</Label>
                    <Input
                      id="responsable"
                      value={formData.responsable}
                      onChange={(e) => handleChange("responsable", e.target.value)}
                      placeholder="Nombre del responsable"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="unidad_medida">Unidad de Medida</Label>
                      <Select 
                        value={formData.unidad_medida} 
                        onValueChange={(value) => handleChange("unidad_medida", value)}
                      >
                        <SelectTrigger className="bg-white dark:bg-white text-gray-900 border border-gray-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-md">
                          {unidadesProductos.map((unidad) => (
                            <SelectItem key={unidad} value={unidad}>
                              {unidad}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between pt-6">
                        <Label htmlFor="mostrar_en_web">Mostrar en Web</Label>
                        <Switch
                          id="mostrar_en_web"
                          checked={formData.mostrar_en_web}
                          onCheckedChange={(checked) => handleChange("mostrar_en_web", checked)}
                          className="data-[state=checked]:bg-red-500"
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {producto && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Código</Label>
                          <p className="font-mono font-medium">{producto.codigo}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Categoría</Label>
                          <Badge variant="secondary">{producto.categoria || 'Sin categoría'}</Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Stock</Label>
                          <p className="font-semibold">{producto.cantidad}</p>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Responsable</Label>
                        <p>{producto.responsable || "No asignado"}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Unidad de Medida</Label>
                          <Badge variant="outline">{producto.unidad_medida || 'Sin unidad'}</Badge>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Mostrar en Web</Label>
                          <div className="mt-1">
                            {producto.mostrar_en_web ? (
                              <Badge className="bg-green-100 text-green-800">Sí</Badge>
                            ) : (
                              <Badge variant="secondary">No</Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {producto.descripcion && (
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Descripción</Label>
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">{producto.descripcion}</p>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
          </div>

          {/* Columna Derecha */}
          <div className="space-y-8">
            {/* Imagen Principal */}
            <Card>
            <CardHeader>
              <CardTitle>Imagen Principal</CardTitle>
              <CardDescription>Agrega una imagen de portada</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pb-4">
              {editing ? (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-center">
                      {formData.imagen_portada ? (
                        <div className="relative group">
                          <div className="aspect-square w-32 overflow-hidden rounded-md border-2 border-gray-200 bg-gray-100">
                            <img 
                              src={formData.imagen_portada} 
                              alt="Imagen de portada" 
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                const target = e.currentTarget
                                target.style.display = 'none'
                                const parent = target.parentElement
                                if (parent) {
                                  parent.innerHTML = '<div class="flex items-center justify-center h-full"><span class="text-gray-400 text-xs">Error</span></div>'
                                }
                              }}
                            />
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 opacity-90 hover:opacity-100 h-6 px-2"
                            onClick={handleRemoveImage}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="aspect-square w-32 flex flex-col items-center justify-center rounded-md border-2 border-dashed border-gray-300 bg-gray-50 hover:border-gray-400 transition-colors">
                          <ImageIcon className="w-8 h-8 text-gray-400 mb-1" />
                          <p className="text-xs text-gray-500">Sin imagen</p>
                        </div>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        id="imagen_portada"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        disabled={uploadingImage}
                        onClick={() => {
                          const input = document.getElementById('imagen_portada') as HTMLInputElement
                          input?.click()
                        }}
                      >
                        <ImageIcon className="w-4 h-4 mr-2" />
                        {uploadingImage 
                          ? 'Subiendo...' 
                          : formData.imagen_portada 
                            ? 'Cambiar imagen' 
                            : 'Seleccionar imagen'
                        }
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 text-center">Máximo 5MB. Formatos: JPG, PNG, GIF</p>
                  </div>
                </>
              ) : (
                <>
                  {producto && (
                    <div>
                      <div className="flex justify-center">
                        {producto.imagen_portada ? (
                          <div className="aspect-square w-32 overflow-hidden rounded-md border-2 border-gray-200 bg-gray-100">
                            <img 
                              src={producto.imagen_portada} 
                              alt={producto.nombre} 
                              className="h-full w-full object-cover"
                            onError={(e) => {
                              const target = e.currentTarget
                              target.style.display = 'none'
                              const parent = target.parentElement
                              if (parent) {
                                parent.innerHTML = '<div class="flex items-center justify-center h-full"><span class="text-gray-400 text-xs">Error</span></div>'
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <div className="aspect-square w-32 flex items-center justify-center rounded-md border-2 border-dashed border-gray-300 bg-gray-50">
                          <div className="text-center">
                            <ImageIcon className="w-8 h-8 mx-auto text-gray-400 mb-1" />
                            <p className="text-xs text-gray-500">Sin imagen</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                    )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Variantes del Producto (Solo visualización - importadas de recursos) */}
          {editing && variantes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Variantes del Producto</CardTitle>
                <CardDescription>Variantes importadas desde los recursos de la receta</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {variantes.map((variante, varianteIndex) => {
                    const isColorMode = variante.modo === "color"
                    const posibilidadesTexto = variante.posibilidades && variante.posibilidades.length > 0
                      ? variante.posibilidades.map((pos: string) => {
                          if (isColorMode && pos.includes(":")) {
                            const [nombre] = pos.split(":")
                            return nombre
                          }
                          return pos
                        }).join(", ")
                      : ""
                    
                    return (
                      <div key={`variante-${variante.id}-${varianteIndex}`} className={`flex items-center justify-between p-3 rounded-lg ${varianteIndex % 2 === 0 ? 'bg-blue-50' : 'bg-white'} border border-gray-200`}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm text-gray-900">{variante.nombre}</h4>
                            {isColorMode && (
                              <Badge variant="outline" className="text-xs">
                                <Palette className="w-3 h-3 mr-1" />
                                Color
                              </Badge>
                            )}
                          </div>
                          {posibilidadesTexto && (
                            <p className="text-xs text-gray-600">{posibilidadesTexto}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
          </div>
        </div>

        {/* Calculadoras - Solo en modo edición */}
        {editing && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            {/* Calculadora de Costes */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Calculadora de Costes
                </CardTitle>
                <CardDescription>Añade recursos y calcula el coste total</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-600 mb-2">
                  Producto: {producto?.nombre || formData.nombre || 'Nuevo producto'}
                </div>
                
                <div className="space-y-3">
                  {costRows.map((row, index) => {
                    console.log(`🟢 Renderizando costRow con ID: ${row.id}`)
                    return (
                    <div key={`cost-row-${row.id}-${index}`} className="space-y-2">
                      <div className="grid grid-cols-12 gap-2">
                        <div className="col-span-4 relative dropdown-container">
                          {index === 0 && <Label className="text-xs">Recurso</Label>}
                          <Input
                            placeholder="Buscar recurso..."
                            value={row.searchTerm}
                            onChange={(e) => handleCostSearchChange(row.id, e.target.value)}
                            onFocus={() => setShowCostDropdown(row.id)}
                            className="h-9 text-sm"
                          />
                          {showCostDropdown === row.id && filteredRecursos.length > 0 && (
                            <div className="absolute z-[999] w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                              {filteredRecursos.map((recurso: any) => (
                                <div
                                  key={recurso.id}
                                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 text-sm"
                                  onClick={() => handleRecursoSelect(row.id, recurso)}
                                >
                                  <div className="font-medium">{recurso.nombre}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="col-span-2">
                          {index === 0 && <Label className="text-xs">Cantidad</Label>}
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={row.cantidad}
                            onChange={(e) => handleCostRowChange(row.id, 'cantidad', parseFloat(e.target.value) || 0)}
                            className="h-9 text-sm"
                          />
                        </div>
                        <div className="col-span-2">
                          {index === 0 && <Label className="text-xs">Unidad</Label>}
                          <div className="flex h-9 w-full rounded-md border border-input bg-gray-50 px-3 py-2 text-sm items-center">
                            {row.unidad || '-'}
                          </div>
                        </div>
                        <div className="col-span-3">
                          {index === 0 && <Label className="text-xs">Total</Label>}
                          <div className="flex h-9 w-full rounded-md border border-input bg-gray-50 px-3 py-2 text-sm items-center">
                            {row.selectedRecurso ? `Bs ${(row.selectedRecurso.coste * row.cantidad).toFixed(2)}` : '-'}
                          </div>
                        </div>
                        <div className="col-span-1">
                          {index === 0 && <div className="h-5"></div>}
                          {costRows.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveCostRow(row.id)}
                              className="h-9 w-9 p-0 text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )})}
                  
                  <Button onClick={handleAddCostRow} variant="outline" size="sm" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Añadir Línea
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Calculadora de Precios */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Calculadora de Precios
                </CardTitle>
                <CardDescription>Añade campos y calcula el precio total</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-700 mb-2">
                    <div className="col-span-4">Campo</div>
                    <div className="col-span-3">%</div>
                    <div className="col-span-3">Valor (Bs)</div>
                    <div className="col-span-2"></div>
                  </div>
                  
                  {priceRows.map((row, priceIndex) => (
                    <div key={`price-row-${row.id}-${priceIndex}`}>
                      {row.campo === "Coste" && (
                        <div className="mb-3">
                          <Button onClick={handleAddPriceRow} variant="outline" size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Añadir Línea
                          </Button>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-12 gap-2">
                        <div className="col-span-4">
                          <Input
                            placeholder="Campo..."
                            value={row.campo}
                            onChange={(e) => handlePriceCampoChange(row.id, e.target.value)}
                            disabled={row.campo === "Coste"}
                            className={`h-9 text-sm ${row.campo === "Coste" ? "bg-gray-100 cursor-not-allowed" : ""}`}
                          />
                        </div>
                        <div className="col-span-3">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={row.campo === "Coste" ? "" : row.porcentaje}
                            onChange={(e) => handlePricePorcentajeChange(row.id, e.target.value)}
                            disabled={row.campo === "Coste"}
                            placeholder={row.campo === "Coste" ? "" : "0.00"}
                            className={`h-9 text-sm ${row.campo === "Coste" ? "bg-gray-100 cursor-not-allowed" : ""}`}
                          />
                        </div>
                        <div className="col-span-3">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={row.valor}
                            onChange={(e) => handlePriceValorChange(row.id, e.target.value)}
                            disabled={row.campo === "Coste"}
                            placeholder="0.00"
                            className={`h-9 text-sm ${row.campo === "Coste" ? "bg-gray-100 cursor-not-allowed" : ""}`}
                          />
                        </div>
                        <div className="col-span-2">
                          {priceRows.length > 1 && row.campo !== "Coste" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemovePriceRow(row.id)}
                              className="h-9 w-9 p-0 text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Totales de las calculadoras - Fuera de las Cards, a la misma altura */}
            {/* Total Calculadora de Costes */}
            <Card className="lg:col-span-1">
              <CardContent className="pt-6">
                <div className="border-t pt-4">
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-bold flex items-center gap-2">
                      Total: <span className="text-red-600">Bs {totalCost.toFixed(2)}</span>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editableCost}
                      onChange={(e) => setEditableCost(e.target.value)}
                      className="w-24 h-9 text-sm font-semibold"
                      placeholder="0.00"
                    />
                    <Button
                      onClick={handleApplyCost}
                      disabled={!editableCost || parseFloat(editableCost) <= 0}
                      className="bg-red-600 hover:bg-red-700 text-white ml-auto"
                      size="sm"
                    >
                      Aplicar Coste
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Calculadora de Precios */}
            <Card className="lg:col-span-1">
              <CardContent className="pt-6">
                <div className="border-t pt-4">
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-bold flex items-center gap-2">
                      Total: <span className="text-green-600">Bs {totalPrice.toFixed(2)}</span>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editablePrice}
                      onChange={(e) => setEditablePrice(e.target.value)}
                      className="w-24 h-9 text-sm font-semibold"
                      placeholder="0.00"
                    />
                    <Button
                      onClick={handleApplyPrice}
                      disabled={!editablePrice || parseFloat(editablePrice) <= 0}
                      className="bg-green-600 hover:bg-green-700 text-white ml-auto"
                      size="sm"
                    >
                      Aplicar Precio
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabla de Proveedores */}
            <Card className="lg:col-span-2 mt-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Proveedores</CardTitle>
                    <CardDescription>Gestiona los proveedores para este producto</CardDescription>
                  </div>
                  <Button onClick={handleAddProveedor} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Añadir Proveedor
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {proveedores.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No hay proveedores. Haz clic en "Añadir Proveedor" para agregar uno.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Empresa</TableHead>
                        <TableHead className="w-[120px]">Precio</TableHead>
                        <TableHead className="w-[120px]">Unidad</TableHead>
                        <TableHead className="w-[150px]">Plazos</TableHead>
                        <TableHead>Comentarios</TableHead>
                        <TableHead className="w-[80px] text-center">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {proveedores.map((proveedor, proveedorIndex) => (
                        <TableRow key={`proveedor-${proveedor.id}-${proveedorIndex}`}>
                          <TableCell>
                            <Input
                              value={proveedor.empresa}
                              onChange={(e) => handleProveedorChange(proveedor.id, 'empresa', e.target.value)}
                              placeholder="Nombre de la empresa"
                              className="h-9"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={proveedor.precio}
                              onChange={(e) => handleProveedorChange(proveedor.id, 'precio', e.target.value)}
                              placeholder="0.00"
                              className="h-9"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={proveedor.unidad}
                              onChange={(e) => handleProveedorChange(proveedor.id, 'unidad', e.target.value)}
                              placeholder="unidad, m², etc."
                              className="h-9"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={proveedor.plazos}
                              onChange={(e) => handleProveedorChange(proveedor.id, 'plazos', e.target.value)}
                              placeholder="7 días, etc."
                              className="h-9"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={proveedor.comentarios}
                              onChange={(e) => handleProveedorChange(proveedor.id, 'comentarios', e.target.value)}
                              placeholder="Comentarios adicionales"
                              className="h-9"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveProveedor(proveedor.id)}
                              className="h-9 w-9 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
