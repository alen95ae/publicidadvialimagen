"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, Save, Trash2, Image as ImageIcon, Plus, X, Info, List, Palette, Check, Edit } from "lucide-react"
import { toast } from "sonner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UNIDADES_MEDIDA_AIRTABLE, CATEGORIAS_RECURSOS_AIRTABLE } from "@/lib/constants"

interface Recurso {
  id: string
  codigo: string
  nombre: string
  imagen_portada?: string
  categoria: string
  responsable: string
  unidad_medida: string
  coste: number
  variantes?: any[]
}

export default function RecursoDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id || '')
  
  // Detectar si es un nuevo recurso
  const isNewRecurso = id === 'nuevo' || id === 'new'
  
  const [recurso, setRecurso] = useState<Recurso | null>(null)
  const [loading, setLoading] = useState(!isNewRecurso) // No cargar si es nuevo
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [editing, setEditing] = useState(true)
  
  // Estados para variantes del recurso
  const [variantes, setVariantes] = useState<any[]>([])
  
  // Estados para tabla de proveedores
  const [proveedores, setProveedores] = useState<Array<{
    id: number
    empresa: string
    precio: string
    unidad: string
    plazos: string
    comentarios: string
  }>>([])
  
  const [openVarianteDialog, setOpenVarianteDialog] = useState(false)
  const [editingVarianteId, setEditingVarianteId] = useState<number | null>(null)
  const [varianteModo, setVarianteModo] = useState<"lista" | "color">("lista")
  const [varianteNombre, setVarianteNombre] = useState("")
  const [variantePosibilidades, setVariantePosibilidades] = useState<string[]>([])
  const [varianteInputValue, setVarianteInputValue] = useState("")
  const [openColorPicker, setOpenColorPicker] = useState(false)
  const [selectedColor, setSelectedColor] = useState("#000000")
  const [colorFormat, setColorFormat] = useState<"HEX" | "RGB" | "HSB">("HEX")
  const [hue, setHue] = useState(0)
  const [saturation, setSaturation] = useState(100)
  const [brightness, setBrightness] = useState(0)
  
  const [formData, setFormData] = useState({
    codigo: "",
    nombre: "",
    imagen_portada: "",
    categoria: "Insumos",
    responsable: "",
    unidad_medida: "unidad",
    coste: "0"
  })
  
  // Estado para códigos existentes (solo para validación en nuevo recurso)
  const [codigosExistentes, setCodigosExistentes] = useState<Set<string>>(new Set())
  const [codigoDuplicado, setCodigoDuplicado] = useState(false)

  const fetchRecurso = useCallback(async () => {
    try {
      setLoading(true)
      console.log('🔍 Fetching recurso with ID:', id)
      
      if (!id || id === 'undefined' || id === 'null') {
        throw new Error('ID de recurso inválido')
      }
      
      const response = await fetch(`/api/recursos/${id}`)
      console.log('📡 Response status:', response.status, response.statusText)
      
      let result
      try {
        const text = await response.text()
        result = text ? JSON.parse(text) : {}
      } catch (parseError) {
        console.error('❌ Error parseando respuesta JSON:', parseError)
        throw new Error('Error al parsear respuesta del servidor')
      }
      
      console.log('📦 Response data:', result)
      
      if (response.ok && result.success !== false && result.data) {
        const data = result.data || result
        console.log('✅ Recurso encontrado:', data)
        console.log('📦 [FRONTEND] Campo variantes del recurso:', data.variantes)
        console.log('📦 [FRONTEND] Tipo de variantes:', typeof data.variantes)
        
        setRecurso(data)
        // Redondear coste a 2 decimales
        const costeRedondeado = data.coste ? Math.round(data.coste * 100) / 100 : 0
        setFormData({
          codigo: data.codigo || "",
          nombre: data.nombre || "",
          imagen_portada: data.imagen_portada || "",
          categoria: data.categoria || "Insumos",
          responsable: data.responsable || "",
          unidad_medida: data.unidad_medida || "unidad",
          coste: costeRedondeado.toFixed(2)
        })
        // Cargar variantes desde el recurso
        let variantesData = []
        if (data.variantes) {
          console.log('🔍 [FRONTEND] Procesando variantes...')
          console.log('🔍 [FRONTEND] Tipo de data.variantes:', typeof data.variantes)
          console.log('🔍 [FRONTEND] data.variantes completo:', JSON.stringify(data.variantes, null, 2))
          
          if (typeof data.variantes === 'string') {
            console.log('🔍 [FRONTEND] Variantes es un string, parseando...')
            try {
              const parsed = JSON.parse(data.variantes)
              console.log('🔍 [FRONTEND] Parsed result:', parsed)
              if (Array.isArray(parsed)) {
                variantesData = parsed
              } else if (parsed && typeof parsed === 'object') {
                // Si es un objeto con propiedad variantes
                if (parsed.variantes && Array.isArray(parsed.variantes)) {
                  variantesData = parsed.variantes
                } else {
                  // Si el objeto mismo contiene las variantes directamente
                  variantesData = []
                }
              }
              console.log('✅ [FRONTEND] Variantes parseadas:', variantesData)
            } catch (e) {
              console.error('❌ [FRONTEND] Error parseando variantes:', e)
              variantesData = []
            }
          } else if (Array.isArray(data.variantes)) {
            console.log('✅ [FRONTEND] Variantes ya es un array')
            variantesData = data.variantes
          } else if (data.variantes && typeof data.variantes === 'object') {
            // Si es un objeto, intentar extraer el array de variantes
            if (data.variantes.variantes && Array.isArray(data.variantes.variantes)) {
              console.log('✅ [FRONTEND] Variantes está en objeto.variantes')
              variantesData = data.variantes.variantes
            } else {
              console.log('⚠️ [FRONTEND] Objeto variantes no tiene estructura esperada')
              variantesData = []
            }
          }
        } else {
          console.log('⚠️ [FRONTEND] No hay variantes en el recurso')
        }
        console.log('📦 [FRONTEND] Variantes finales a setear:', JSON.stringify(variantesData, null, 2))
        console.log('📦 [FRONTEND] Cantidad de variantes:', variantesData.length)
        // Asegurar que cada variante tenga un id único
        const variantesConId = variantesData.map((v, idx) => ({
          ...v,
          id: v.id || idx + 1 // Asignar id si no existe
        }))
        // Verificar cada variante
        variantesConId.forEach((v, idx) => {
          console.log(`📦 [FRONTEND] Variante ${idx}:`, {
            id: v.id,
            nombre: v.nombre,
            modo: v.modo,
            posibilidades: v.posibilidades,
            cantidadPosibilidades: v.posibilidades?.length || 0
          })
        })
        setVariantes(variantesConId)
        
        // Cargar proveedores desde el recurso
        if (data.proveedores && Array.isArray(data.proveedores)) {
          const proveedoresData = data.proveedores.map((prov: any, index: number) => ({
            id: prov.id || index + 1,
            empresa: prov.empresa || "",
            precio: prov.precio?.toString() || "",
            unidad: prov.unidad || "",
            plazos: prov.plazos || "",
            comentarios: prov.comentarios || ""
          }))
          setProveedores(proveedoresData)
        } else {
          setProveedores([])
        }
      } else {
        console.error('❌ Error en respuesta:', result)
        const errorMessage = result?.error || result?.message || "Recurso no encontrado"
        toast.error(errorMessage)
        setTimeout(() => {
          router.push("/panel/recursos")
        }, 2000)
      }
    } catch (error) {
      console.error('❌ Error fetching recurso:', error)
      const errorMessage = error instanceof Error ? error.message : "Error de conexión"
      toast.error(errorMessage)
      setTimeout(() => {
        router.push("/panel/recursos")
      }, 2000)
    } finally {
      setLoading(false)
    }
  }, [id, router])

  // Cargar códigos existentes cuando es un nuevo recurso
  const fetchCodigosExistentes = useCallback(async () => {
    if (!isNewRecurso) return
    
    try {
      const response = await fetch('/api/recursos?limit=10000')
      if (response.ok) {
        const result = await response.json()
        // El código viene del campo 'id' de Airtable (mapeado a codigo)
        const codigos = new Set((result.data || []).map((r: any) => r.codigo?.toLowerCase().trim()).filter(Boolean))
        setCodigosExistentes(codigos)
      }
    } catch (error) {
      console.error('Error cargando códigos existentes:', error)
    }
  }, [isNewRecurso])
  
  // Cargar códigos existentes excluyendo el recurso actual cuando se edita
  const fetchCodigosExistentesParaEdicion = useCallback(async () => {
    if (isNewRecurso || !recurso) return
    
    try {
      const response = await fetch('/api/recursos?limit=10000')
      if (response.ok) {
        const result = await response.json()
        // Excluir el código del recurso actual
        const codigos = new Set(
          (result.data || [])
            .filter((r: any) => r.id !== recurso.id) // Excluir el recurso actual
            .map((r: any) => r.codigo?.toLowerCase().trim())
            .filter(Boolean)
        )
        setCodigosExistentes(codigos)
      }
    } catch (error) {
      console.error('Error cargando códigos existentes:', error)
    }
  }, [isNewRecurso, recurso])

  useEffect(() => {
    if (id && !isNewRecurso) {
      fetchRecurso()
    } else if (isNewRecurso) {
      // Si es un nuevo recurso, inicializar en blanco
      setLoading(false)
      setEditing(true)
      fetchCodigosExistentes()
    }
  }, [id, isNewRecurso, fetchRecurso, fetchCodigosExistentes])

  useEffect(() => {
    if (recurso) {
      setEditing(true)
      // Cargar códigos existentes para validación (excluyendo el actual)
      if (!isNewRecurso) {
        fetchCodigosExistentesParaEdicion()
      }
    }
  }, [recurso, isNewRecurso, fetchCodigosExistentesParaEdicion])

  const handleChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Validar código duplicado
    if (field === "codigo") {
      const codigoNormalizado = String(value).toLowerCase().trim()
      const existe = codigosExistentes.has(codigoNormalizado)
      setCodigoDuplicado(existe && codigoNormalizado.length > 0)
    }
  }

  const handleSave = async () => {
    if (!formData.codigo || !formData.nombre) {
      toast.error("Código y nombre son requeridos")
      return
    }
    
    // Validar código duplicado antes de guardar
    const codigoNormalizado = formData.codigo.toLowerCase().trim()
    if (codigosExistentes.has(codigoNormalizado)) {
      toast.error("Este código ya existe. Por favor, usa un código diferente.")
      setCodigoDuplicado(true)
      return
    }

    setSaving(true)
    
    try {
      const dataToSend = {
        codigo: formData.codigo.trim(),
        nombre: formData.nombre.trim(),
        imagen_portada: formData.imagen_portada || null,
        categoria: formData.categoria,
        responsable: formData.responsable.trim(),
        unidad_medida: formData.unidad_medida,
        coste: Math.round((parseFloat(formData.coste) || 0) * 100) / 100,
        variantes: variantes.length > 0 ? variantes : [],
        proveedores: proveedores.length > 0 ? proveedores.map(prov => ({
          empresa: prov.empresa,
          precio: parseFloat(prov.precio) || 0,
          unidad: prov.unidad,
          plazos: prov.plazos,
          comentarios: prov.comentarios
        })) : []
      }

      console.log("💾 Guardando recurso:", { id, isNewRecurso, dataToSend })

      let response
      if (isNewRecurso) {
        // Crear nuevo recurso
        response = await fetch(`/api/recursos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataToSend)
        })
      } else {
        // Actualizar recurso existente
        response = await fetch(`/api/recursos/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataToSend)
        })
      }

      const responseData = await response.json().catch(() => ({}))

      if (response.ok && responseData.success !== false) {
        const updated = responseData.data || responseData
        setRecurso(updated)
        console.log("✅ Recurso guardado correctamente:", updated)
        toast.success(isNewRecurso ? "Recurso creado correctamente" : "Recurso actualizado correctamente")
        
        await new Promise(resolve => setTimeout(resolve, 300))
        router.push("/panel/recursos")
      } else {
        const errorMessage = responseData.error || responseData.message || `Error ${response.status}: ${response.statusText}`
        console.error("❌ Error guardando recurso:", errorMessage, responseData)
        toast.error(errorMessage || "Error al guardar el recurso")
        setSaving(false)
      }
    } catch (error) {
      console.error("❌ Error saving recurso:", error)
      toast.error(error instanceof Error ? error.message : "Error de conexión al guardar")
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/recursos/${id}`, { method: "DELETE" })
      if (response.ok) {
        toast.success("Recurso eliminado correctamente")
        router.push("/panel/recursos")
      } else {
        toast.error("Error al eliminar el recurso")
      }
    } catch (error) {
      toast.error("Error de conexión")
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setUploadingImage(true)
    try {
      const formDataUpload = new FormData()
      formDataUpload.set('file', file)
      
      toast.loading("Subiendo imagen...", { id: 'upload-image' })
      
      const uploadTargetId = isNewRecurso ? 'new' : id
      const response = await fetch(`/api/recursos/${uploadTargetId}/image`, { 
        method: 'POST', 
        body: formDataUpload 
      })
      
      const responseData = await response.json().catch(() => ({}))
      
      if (response.ok && responseData.success !== false) {
        const publicUrl = responseData.data?.publicUrl
        if (publicUrl) {
          handleChange("imagen_portada", publicUrl)
          toast.success("Imagen subida a Supabase Storage correctamente", { id: 'upload-image' })
        } else {
          throw new Error("No se recibió la URL de la imagen")
        }
      } else {
        const errorMessage = responseData.error || "Error al cargar la imagen"
        console.error("❌ [FRONTEND] Error en respuesta de upload:", errorMessage)
        toast.error(errorMessage, { id: 'upload-image' })
      }
    } catch (error) {
      console.error("Error uploading image:", error)
      toast.error("Error de conexión al subir la imagen", { id: 'upload-image' })
    } finally {
      setUploadingImage(false)
      e.target.value = ''
    }
  }

  // Handlers para variantes del recurso
  const handleOpenVarianteDialog = (varianteId?: number) => {
    if (varianteId !== undefined) {
      // Modo edición
      const variante = variantes.find(v => v.id === varianteId)
      if (variante) {
        setEditingVarianteId(varianteId)
        setVarianteNombre(variante.nombre || "")
        setVariantePosibilidades([...variante.posibilidades] || [])
        setVarianteInputValue("")
        setVarianteModo(variante.modo || "lista")
      }
    } else {
      // Modo nuevo
      setEditingVarianteId(null)
      setVarianteNombre("")
      setVariantePosibilidades([])
      setVarianteInputValue("")
      setVarianteModo("lista")
    }
    setOpenVarianteDialog(true)
  }

  const handleCloseVarianteDialog = () => {
    setOpenVarianteDialog(false)
    setEditingVarianteId(null)
    setVarianteNombre("")
    setVariantePosibilidades([])
    setVarianteInputValue("")
    setVarianteModo("lista")
    setOpenColorPicker(false)
  }

  // Funciones para convertir entre formatos de color
  const hsbToRgb = (h: number, s: number, b: number): [number, number, number] => {
    s /= 100
    b /= 100
    const k = (n: number) => (n + h / 60) % 6
    const f = (n: number) => b * (1 - s * Math.max(0, Math.min(k(n), 4 - k(n), 1)))
    return [
      Math.round(255 * f(5)),
      Math.round(255 * f(3)),
      Math.round(255 * f(1))
    ]
  }

  const rgbToHex = (r: number, g: number, b: number): string => {
    return "#" + [r, g, b].map(x => {
      const hex = x.toString(16)
      return hex.length === 1 ? "0" + hex : hex
    }).join("")
  }

  const hexToHsb = (hex: string): [number, number, number] => {
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0
    let s = 0
    const brightness = max

    const d = max - min
    s = max === 0 ? 0 : d / max

    if (max === min) {
      h = 0
    } else {
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
        case g: h = ((b - r) / d + 2) / 6; break
        case b: h = ((r - g) / d + 4) / 6; break
      }
    }

    return [h * 360, s * 100, brightness * 100]
  }

  useEffect(() => {
    if (openColorPicker) {
      const [r, g, b] = hsbToRgb(hue, saturation, brightness)
      const newHex = rgbToHex(r, g, b)
      if (newHex !== selectedColor) {
        setSelectedColor(newHex)
      }
    }
  }, [hue, saturation, brightness, openColorPicker])

  const updateColorFromHex = (hex: string) => {
    if (/^#[0-9A-F]{6}$/i.test(hex)) {
      const [h, s, b] = hexToHsb(hex)
      setHue(Math.round(h))
      setSaturation(Math.round(s))
      setBrightness(Math.round(b))
      setSelectedColor(hex)
    }
  }

  const handleAddPosibilidad = () => {
    const trimmed = varianteInputValue.trim()
    if (trimmed && !variantePosibilidades.includes(trimmed)) {
      setVariantePosibilidades(prev => [...prev, trimmed])
      setVarianteInputValue("")
    }
  }

  const handleRemovePosibilidad = (posibilidad: string) => {
    setVariantePosibilidades(prev => prev.filter(p => p !== posibilidad))
  }

  const handleEditColor = (posibilidad: string) => {
    // Extraer nombre y color hex del formato "nombre:#hex"
    if (varianteModo === "color" && posibilidad.includes(":")) {
      const [nombre, colorHex] = posibilidad.split(":")
      if (colorHex && /^#[0-9A-F]{6}$/i.test(colorHex)) {
        // Establecer el nombre en el input
        setVarianteInputValue(nombre)
        // Actualizar el color picker con el color existente
        updateColorFromHex(colorHex)
        // Remover la posibilidad actual (se agregará de nuevo con el color editado)
        setVariantePosibilidades(prev => prev.filter(p => p !== posibilidad))
        // Abrir el color picker
        setOpenColorPicker(true)
      }
    }
  }

  const handleVarianteInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (varianteModo === 'color' && varianteInputValue.trim()) {
        // Abrir color picker cuando es modo color
        // Inicializar el color picker con color negro por defecto
        setHue(0)
        setSaturation(100)
        setBrightness(0)
        setSelectedColor("#000000")
        setColorFormat("HEX")
        setOpenColorPicker(true)
      } else {
        handleAddPosibilidad()
      }
    }
  }

  const handleVarianteInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setVarianteInputValue(value)
    // Si el usuario escribe una coma, agregar la posibilidad (solo en modo lista)
    if (varianteModo === 'lista' && value.endsWith(',')) {
      const trimmed = value.slice(0, -1).trim()
      if (trimmed && !variantePosibilidades.includes(trimmed)) {
        setVariantePosibilidades(prev => [...prev, trimmed])
        setVarianteInputValue("")
      }
    }
  }

  const handleConfirmColor = () => {
    if (varianteInputValue.trim()) {
      // Agregar el color con el nombre y el código hex
      const colorEntry = `${varianteInputValue.trim()}:${selectedColor}`
      if (!variantePosibilidades.includes(colorEntry)) {
        setVariantePosibilidades(prev => [...prev, colorEntry])
        setVarianteInputValue("")
      }
    }
    setOpenColorPicker(false)
  }

  const handleApplyVariante = () => {
    if (!varianteNombre.trim()) {
      toast.error("El nombre de la variante es requerido")
      return
    }
    if (variantePosibilidades.length === 0) {
      toast.error("Debes agregar al menos una posibilidad")
      return
    }

    if (editingVarianteId !== null) {
      // Modo edición
      setVariantes(prev => prev.map(v => 
        v.id === editingVarianteId 
          ? {
              ...v,
              nombre: varianteNombre.trim(),
              modo: varianteModo,
              posibilidades: variantePosibilidades
            }
          : v
      ))
      toast.success("Variante actualizada correctamente")
    } else {
      // Modo nuevo
      const newId = variantes.length > 0 ? Math.max(...variantes.map(v => v.id)) + 1 : 1
      setVariantes(prev => [...prev, {
        id: newId,
        nombre: varianteNombre.trim(),
        modo: varianteModo,
        posibilidades: variantePosibilidades
      }])
      toast.success("Variante agregada correctamente")
    }
    
    handleCloseVarianteDialog()
  }

  const handleRemoveVariante = async (varianteId: number) => {
    const nuevasVariantes = variantes.filter(v => v.id !== varianteId)
    setVariantes(nuevasVariantes)
    
    // Guardar inmediatamente en Airtable (solo si no es un recurso nuevo)
    if (!isNewRecurso) {
      try {
        const dataToSend = {
          codigo: formData.codigo.trim(),
          nombre: formData.nombre.trim(),
          imagen_portada: formData.imagen_portada || null,
          categoria: formData.categoria,
          responsable: formData.responsable.trim(),
          unidad_medida: formData.unidad_medida,
          coste: Math.round((parseFloat(formData.coste) || 0) * 100) / 100,
          variantes: nuevasVariantes,
          proveedores: proveedores.length > 0 ? proveedores.map(prov => ({
            empresa: prov.empresa,
            precio: parseFloat(prov.precio) || 0,
            unidad: prov.unidad,
            plazos: prov.plazos,
            comentarios: prov.comentarios
          })) : []
        }

        const response = await fetch(`/api/recursos/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataToSend)
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success !== false) {
            const updated = result.data || result
            setRecurso(updated)
            toast.success("Variante eliminada correctamente")
          }
        }
      } catch (error) {
        console.error("Error eliminando variante:", error)
        toast.error("Error al eliminar la variante")
      }
    } else {
      toast.success("Variante eliminada")
    }
  }

  // Handlers para tabla de proveedores
  const handleAddProveedor = () => {
    const newId = proveedores.length > 0 ? Math.max(...proveedores.map(p => p.id)) + 1 : 1
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-500">Cargando...</div>
      </div>
    )
  }

  if (!isNewRecurso && !recurso) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-500">Recurso no encontrado</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              {isNewRecurso ? "Nuevo Recurso" : "Editar Recurso"}
            </h1>
            <p className="text-gray-600">
              {isNewRecurso ? "Crea un nuevo recurso" : "Modifica la información del recurso"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => {
                router.push("/panel/recursos")
              }}
            >
              Cancelar
            </Button>
            {!isNewRecurso && recurso && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar recurso?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Se eliminará permanentemente el recurso "{recurso.nombre}".
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
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Columna Izquierda */}
          <div className="space-y-8">
            {/* Información Básica */}
            <Card>
              <CardHeader>
                <CardTitle>Información Básica</CardTitle>
                <CardDescription>Datos principales del recurso</CardDescription>
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
                        className={`bg-neutral-100 border-neutral-200 text-gray-900 font-mono ${
                          codigoDuplicado ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                        }`}
                        required
                      />
                      {codigoDuplicado && (
                        <p className="text-sm text-red-600 mt-1">
                          Este código ya existe. Por favor, usa un código diferente.
                        </p>
                      )}
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
                            {CATEGORIAS_RECURSOS_AIRTABLE.map((categoria) => (
                              <SelectItem key={categoria} value={categoria}>
                                {categoria}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                            {UNIDADES_MEDIDA_AIRTABLE.map((unidad) => (
                              <SelectItem key={unidad} value={unidad}>
                                {unidad}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="coste">Coste (Bs)</Label>
                        <Input
                          id="coste"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.coste}
                          onChange={(e) => handleChange("coste", e.target.value)}
                          onBlur={(e) => {
                            const value = parseFloat(e.target.value) || 0
                            const rounded = Math.round(value * 100) / 100
                            handleChange("coste", rounded.toFixed(2))
                          }}
                        />
                      </div>
                    </div>
                  </>
                ) : null}
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
                            <div className="aspect-square w-32 overflow-hidden rounded-md border-2 border-gray-200 bg-gray-100 relative">
                              <Image 
                                src={formData.imagen_portada} 
                                alt="Imagen de portada" 
                                fill
                                className="object-cover"
                                sizes="128px"
                                loading="lazy"
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
                              onClick={() => handleChange("imagen_portada", "")}
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
                          onChange={handleImageUpload}
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
                ) : null}
              </CardContent>
            </Card>

            {/* Variantes del Recurso */}
            {editing && (
              <Card>
                <CardHeader>
                  <CardTitle>Variantes del Recurso</CardTitle>
                  <CardDescription>Gestiona las variantes de este recurso</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {variantes.length > 0 && (
                    <div className="space-y-3">
                      {variantes.map((variante, index) => {
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
                        
                        // Usar id si existe, sino usar índice combinado con nombre para unicidad
                        const uniqueKey = variante.id || `variante-${variante.nombre}-${index}`
                        
                        return (
                          <div key={uniqueKey} className={`flex items-center justify-between p-3 rounded-lg ${index % 2 === 0 ? 'bg-blue-50' : 'bg-white'} border border-gray-200`}>
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
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenVarianteDialog(variante.id)}
                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveVariante(variante.id)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  <Button onClick={handleOpenVarianteDialog} variant="outline" size="sm" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar variante
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Tabla de Proveedores */}
        {editing && (
          <Card className="mt-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Proveedores</CardTitle>
                  <CardDescription>Gestiona los proveedores para este recurso</CardDescription>
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
                    {proveedores.map((proveedor) => (
                      <TableRow key={proveedor.id}>
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
        )}

        {/* Dialog para agregar variante */}
        <Dialog open={openVarianteDialog} onOpenChange={setOpenVarianteDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingVarianteId !== null ? "Editar variante" : "Definir variante"}</DialogTitle>
              <DialogDescription>
                {editingVarianteId !== null 
                  ? "Modifica la información de la variante"
                  : "Crea una nueva variante para este recurso"
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Selector de modo Lista/Color */}
              <div className="space-y-2">
                <Label>Mostrar en página de producto como:</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={varianteModo === "lista" ? "default" : "outline"}
                    onClick={() => setVarianteModo("lista")}
                    className={`flex-1 ${varianteModo === "lista" ? "bg-[#D54644] hover:bg-[#B03A38] text-white" : ""}`}
                  >
                    <List className="w-4 h-4 mr-2" />
                    Lista
                  </Button>
                  <Button
                    type="button"
                    variant={varianteModo === "color" ? "default" : "outline"}
                    onClick={() => setVarianteModo("color")}
                    className={`flex-1 ${varianteModo === "color" ? "bg-[#D54644] hover:bg-[#B03A38] text-white" : ""}`}
                  >
                    <Palette className="w-4 h-4 mr-2" />
                    Color
                  </Button>
                </div>
              </div>

              {/* Campo de nombre de la variante */}
              <div className="space-y-2">
                <Label htmlFor="variante-nombre">Escribe el nombre de la opción</Label>
                <Input
                  id="variante-nombre"
                  placeholder="Ej: Grosor, Tamaño, Color..."
                  value={varianteNombre}
                  onChange={(e) => setVarianteNombre(e.target.value)}
                />
              </div>

              {/* Campo de posibilidades */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="variante-posibilidades">
                    Escribe las posibilidades para esta opción
                  </Label>
                  <div className="relative group">
                    <Info className="h-4 w-4 text-gray-400 cursor-help" />
                    <div className="absolute left-0 top-6 w-64 p-2 bg-gray-900 text-white text-xs rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                      {varianteModo === "lista" 
                        ? "Presiona Enter o agrega una coma después de cada opción."
                        : "Escribe el nombre del color y presiona Enter para seleccionar el color."}
                    </div>
                  </div>
                </div>
                
                {/* Input con chips */}
                <div className="min-h-[80px] w-full rounded-md border border-red-200 bg-white p-3 focus-within:ring-2 focus-within:ring-[#D54644] focus-within:ring-offset-2">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {variantePosibilidades.map((posibilidad, index) => {
                      // Si es modo color, parsear el formato "nombre:hex"
                      const isColor = varianteModo === "color" && posibilidad.includes(":")
                      const [nombre, colorHex] = isColor ? posibilidad.split(":") : [posibilidad, null]
                      
                      // Usar una key única basada en el contenido y el índice
                      const uniqueKey = `posibilidad-${nombre}-${index}-${posibilidad}`
                      
                      return (
                        <div
                          key={uniqueKey}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-sm ${
                            isColor 
                              ? "bg-white border border-gray-300 cursor-pointer hover:border-[#D54644] hover:shadow-sm transition-all" 
                              : "bg-red-100 text-[#D54644]"
                          }`}
                          onClick={isColor ? () => handleEditColor(posibilidad) : undefined}
                          title={isColor ? "Haz clic para editar el color" : undefined}
                        >
                          {isColor && colorHex && (
                            <div 
                              className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
                              style={{ backgroundColor: colorHex }}
                            />
                          )}
                          <span>{nombre}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemovePosibilidad(posibilidad)
                            }}
                            className="ml-1 hover:bg-gray-200 rounded-full p-0.5 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )
                    })}
                    <input
                      id="variante-posibilidades"
                      type="text"
                      value={varianteInputValue}
                      onChange={handleVarianteInputChange}
                      onKeyDown={handleVarianteInputKeyDown}
                      placeholder={variantePosibilidades.length === 0 
                        ? (varianteModo === "lista" ? "Escribe y presiona Enter..." : "Escribe el nombre del color y presiona Enter...")
                        : ""}
                      className="flex-1 min-w-[120px] outline-none bg-transparent text-sm"
                    />
                  </div>
                </div>
                
                <p className="text-xs text-gray-500">
                  {varianteModo === "lista"
                    ? "Presiona Enter o agrega una coma después de cada opción."
                    : "Escribe el nombre del color y presiona Enter para seleccionar el color."}
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseVarianteDialog}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleApplyVariante}
                className="bg-[#D54644] hover:bg-[#B03A38] text-white"
              >
                Aplicar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog para selector de color */}
        <Dialog open={openColorPicker} onOpenChange={setOpenColorPicker}>
          <DialogContent className="sm:max-w-[400px] p-0">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle>Seleccionar color</DialogTitle>
              <DialogDescription>
                Elige el color para esta variante
              </DialogDescription>
            </DialogHeader>
            <div className="p-6 space-y-4">
              {/* Área principal de selección de color (Saturación y Brillo) */}
              <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-gray-300 cursor-crosshair"
                style={{
                  background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hue}, 100%, 50%))`
                }}
                onMouseDown={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
                  const y = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height))
                  setSaturation(Math.round(x * 100))
                  setBrightness(Math.round(y * 100))
                  
                  const handleMove = (moveEvent: MouseEvent) => {
                    const newX = Math.max(0, Math.min(1, (moveEvent.clientX - rect.left) / rect.width))
                    const newY = Math.max(0, Math.min(1, 1 - (moveEvent.clientY - rect.top) / rect.height))
                    setSaturation(Math.round(newX * 100))
                    setBrightness(Math.round(newY * 100))
                  }
                  
                  const handleUp = () => {
                    document.removeEventListener('mousemove', handleMove)
                    document.removeEventListener('mouseup', handleUp)
                  }
                  
                  document.addEventListener('mousemove', handleMove)
                  document.addEventListener('mouseup', handleUp)
                }}
              >
                <div
                  className="absolute w-4 h-4 rounded-full border-2 border-white shadow-lg pointer-events-none"
                  style={{
                    left: `${saturation}%`,
                    bottom: `${brightness}%`,
                    transform: 'translate(-50%, 50%)'
                  }}
                />
              </div>

              {/* Slider de matiz (Hue) */}
              <div className="relative h-6 rounded-md overflow-hidden cursor-pointer"
                style={{
                  background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)'
                }}
                onMouseDown={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
                  setHue(Math.round(x * 360))
                  
                  const handleMove = (moveEvent: MouseEvent) => {
                    const newX = Math.max(0, Math.min(1, (moveEvent.clientX - rect.left) / rect.width))
                    setHue(Math.round(newX * 360))
                  }
                  
                  const handleUp = () => {
                    document.removeEventListener('mousemove', handleMove)
                    document.removeEventListener('mouseup', handleUp)
                  }
                  
                  document.addEventListener('mousemove', handleMove)
                  document.addEventListener('mouseup', handleUp)
                }}
              >
                <div
                  className="absolute top-0 w-1 h-full bg-white border border-gray-400 pointer-events-none"
                  style={{
                    left: `${(hue / 360) * 100}%`,
                    transform: 'translateX(-50%)'
                  }}
                />
              </div>

              {/* Tabs para formatos de color */}
              <div className="flex gap-2 border-b">
                <button
                  type="button"
                  onClick={() => setColorFormat("HEX")}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    colorFormat === "HEX" 
                      ? "border-[#D54644] text-[#D54644]" 
                      : "border-transparent text-gray-600 hover:text-gray-800"
                  }`}
                >
                  HEX
                </button>
                <button
                  type="button"
                  onClick={() => setColorFormat("RGB")}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    colorFormat === "RGB" 
                      ? "border-[#D54644] text-[#D54644]" 
                      : "border-transparent text-gray-600 hover:text-gray-800"
                  }`}
                >
                  RGB
                </button>
                <button
                  type="button"
                  onClick={() => setColorFormat("HSB")}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    colorFormat === "HSB" 
                      ? "border-[#D54644] text-[#D54644]" 
                      : "border-transparent text-gray-600 hover:text-gray-800"
                  }`}
                >
                  HSB
                </button>
              </div>

              {/* Input del formato seleccionado */}
              <div className="flex items-center gap-2">
                {colorFormat === "HEX" && (
                  <>
                    <Input
                      type="text"
                      value={selectedColor.toUpperCase()}
                      onChange={(e) => updateColorFromHex(e.target.value)}
                      className="flex-1 font-mono"
                      placeholder="#000000"
                    />
                    <div
                      className="w-12 h-12 rounded-md border-2 border-gray-300"
                      style={{ backgroundColor: selectedColor }}
                    />
                  </>
                )}
                {colorFormat === "RGB" && (() => {
                  const [r, g, b] = hsbToRgb(hue, saturation, brightness)
                  return (
                    <>
                      <Input
                        type="number"
                        min="0"
                        max="255"
                        value={r}
                        onChange={(e) => {
                          const newR = parseInt(e.target.value) || 0
                          // Convertir RGB a HSB
                          const hex = rgbToHex(newR, g, b)
                          updateColorFromHex(hex)
                        }}
                        className="flex-1"
                        placeholder="R"
                      />
                      <Input
                        type="number"
                        min="0"
                        max="255"
                        value={g}
                        onChange={(e) => {
                          const newG = parseInt(e.target.value) || 0
                          const hex = rgbToHex(r, newG, b)
                          updateColorFromHex(hex)
                        }}
                        className="flex-1"
                        placeholder="G"
                      />
                      <Input
                        type="number"
                        min="0"
                        max="255"
                        value={b}
                        onChange={(e) => {
                          const newB = parseInt(e.target.value) || 0
                          const hex = rgbToHex(r, g, newB)
                          updateColorFromHex(hex)
                        }}
                        className="flex-1"
                        placeholder="B"
                      />
                      <div
                        className="w-12 h-12 rounded-md border-2 border-gray-300"
                        style={{ backgroundColor: `rgb(${r}, ${g}, ${b})` }}
                      />
                    </>
                  )
                })()}
                {colorFormat === "HSB" && (
                  <>
                    <Input
                      type="number"
                      min="0"
                      max="360"
                      value={Math.round(hue)}
                      onChange={(e) => setHue(parseInt(e.target.value) || 0)}
                      className="flex-1"
                      placeholder="H"
                    />
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={Math.round(saturation)}
                      onChange={(e) => setSaturation(parseInt(e.target.value) || 0)}
                      className="flex-1"
                      placeholder="S"
                    />
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={Math.round(brightness)}
                      onChange={(e) => setBrightness(parseInt(e.target.value) || 0)}
                      className="flex-1"
                      placeholder="B"
                    />
                    <div
                      className="w-12 h-12 rounded-md border-2 border-gray-300"
                      style={{ backgroundColor: selectedColor }}
                    />
                  </>
                )}
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpenColorPicker(false)}
                className="rounded-full w-10 h-10 p-0"
              >
                <X className="w-5 h-5" />
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirmColor}
                className="bg-[#D54644] hover:bg-[#B03A38] text-white rounded-full w-10 h-10 p-0"
              >
                <Check className="w-5 h-5" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
