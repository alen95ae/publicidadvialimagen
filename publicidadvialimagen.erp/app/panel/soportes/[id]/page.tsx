"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { ArrowLeft, Save, MapPin, Trash2, Edit, Eye, Calculator, ImageIcon } from "lucide-react"
import { toast } from "sonner"
import SupportMap from "@/components/support-map"
import dynamic from "next/dynamic";
import { PermisoEditar, PermisoEliminar } from "@/components/permiso"
import { usePermisosContext } from "@/hooks/permisos-provider"

const EditableLeafletMap = dynamic(() => import("@/components/maps/EditableLeafletMap"), { ssr: false });
const GmapsLinkPaste = dynamic(() => import("@/components/maps/GmapsLinkPaste"), { ssr: false });

// Constantes para selects y colores
const TYPE_OPTIONS = [
  'Unipolar', 'Bipolar', 'Tripolar', 'Mural', 'Mega Valla', 'Cartelera', 'Paleta'
] as const

const STATUS_META = {
  'Disponible':     { label: 'Disponible',    className: 'bg-green-100 text-green-800' },
  'Reservado':      { label: 'Reservado',     className: 'bg-yellow-100 text-yellow-800' },
  'Ocupado':        { label: 'Ocupado',       className: 'bg-red-100 text-red-800' },
  'No disponible':  { label: 'No disponible', className: 'bg-gray-100 text-gray-800' },
  'A Consultar':    { label: 'A Consultar',   className: 'bg-blue-100 text-blue-800' },
} as const

interface Support {
  id: string
  code: string
  title: string
  type: string
  status: keyof typeof STATUS_META
  widthM: number | null
  heightM: number | null
  areaM2: number | null
  iluminacion: boolean | null
  owner: string | null
  images: string[]
  googleMapsLink: string | null
  latitude: number | null
  longitude: number | null
  address: string | null
  city: string | null
  zona: string | null
  country: string | null
  impactosDiarios: number | null
  priceMonth: number | null
  available: boolean
  company?: { name: string }
  createdAt: string
  updatedAt: string
}

export default function SoporteDetailPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params.id as string
  const shouldEdit = searchParams.get('edit') === 'true'
  const { tieneFuncionTecnica } = usePermisosContext()
  
  const [support, setSupport] = useState<Support | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [uploadingImages, setUploadingImages] = useState({
    principal: false,
    secundaria1: false,
    secundaria2: false
  })
  const [formData, setFormData] = useState({
    code: "",
    title: "",
    type: "",
    status: "Disponible" as keyof typeof STATUS_META,
    widthM: "",
    heightM: "",
    areaM2: "",
    iluminacion: null as boolean | null,
    owner: "",
    imagen_principal: "" as string,
    imagen_secundaria_1: "" as string,
    imagen_secundaria_2: "" as string,
    imagen_principal_file: null as File | null,
    imagen_secundaria_1_file: null as File | null,
    imagen_secundaria_2_file: null as File | null,
    googleMapsLink: "",
    latitude: null as number | null,
    longitude: null as number | null,
    address: "",
    city: "",
    zona: "",
    country: "",
    impactosDiarios: "",
    priceMonth: "",
    sustrato_id: null as string | null,
    sustrato_nombre: "" as string,
    available: true
  })
  
  // Estado para el buscador de sustrato
  const [openSustrato, setOpenSustrato] = useState(false)
  const [todosLosProductos, setTodosLosProductos] = useState<any[]>([])
  const [cargandoProductos, setCargandoProductos] = useState(false)
  const [filteredProductos, setFilteredProductos] = useState<any[]>([])

  useEffect(() => {
    if (id) {
      fetchSupport()
    }
  }, [id])

  useEffect(() => {
    if (shouldEdit && support) {
      setEditing(true)
    }
  }, [shouldEdit, support])

  const fetchSupport = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/soportes/${id}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        console.log('📥 Soporte recibido del API:', data)
        console.log('🖼️ Imágenes en el soporte:', data.images)
        setSupport(data)
        // Si no hay coordenadas, establecer por defecto La Paz para mostrar chincheta
        const defaultLat = -16.5000
        const defaultLng = -68.1500
        const latitude = data.latitude || defaultLat
        const longitude = data.longitude || defaultLng
        
        // Generar Google Maps link si hay coordenadas pero no link
        let googleMapsLink = data.googleMapsLink || ""
        if (!googleMapsLink && (data.latitude && data.longitude)) {
          googleMapsLink = generateGoogleMapsLink(data.latitude, data.longitude)
        } else if (!googleMapsLink) {
          // Si no hay coordenadas ni link, generar link con coordenadas por defecto
          googleMapsLink = generateGoogleMapsLink(defaultLat, defaultLng)
        }

        // Extraer imágenes del array o de campos separados
        const images = data.images || []
        
        // Cargar nombre del sustrato si existe sustrato_id
        let sustratoNombre = ""
        if (data.sustrato_id) {
          try {
            const productoRes = await fetch(`/api/inventario/${data.sustrato_id}`)
            if (productoRes.ok) {
              const productoData = await productoRes.json()
              const producto = productoData.data || productoData
              sustratoNombre = `${producto.codigo} - ${producto.nombre}`
            }
          } catch (error) {
            console.error('Error cargando producto sustrato:', error)
          }
        }
        
        setFormData({
          code: data.code || "",
          title: data.title || "",
          type: data.type || "",
          status: data.status || "Disponible",
          widthM: data.widthM?.toString() || "",
          heightM: data.heightM?.toString() || "",
          areaM2: data.areaM2 ? parseFloat(data.areaM2.toString()).toFixed(2) : "",
          iluminacion: data.iluminacion ?? null,
          owner: data.owner || "",
          imagen_principal: images[0] || data.imagen_principal || "",
          imagen_secundaria_1: images[1] || data.imagen_secundaria_1 || "",
          imagen_secundaria_2: images[2] || data.imagen_secundaria_2 || "",
          imagen_principal_file: null,
          imagen_secundaria_1_file: null,
          imagen_secundaria_2_file: null,
          googleMapsLink,
          latitude,
          longitude,
          address: data.address || "",
          city: data.city || "",
          zona: data.zona || "",
          country: data.country || "",
          impactosDiarios: data.impactosDiarios?.toString() || "",
          priceMonth: data.priceMonth?.toString() || "",
          sustrato_id: data.sustrato_id || null,
          sustrato_nombre: sustratoNombre,
          available: data.available ?? true
        })
      } else {
        toast.error("Soporte no encontrado")
        router.push("/panel/soportes")
      }
    } catch (error) {
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  // Cálculos automáticos
  const widthM = Number(formData.widthM) || 0
  const heightM = Number(formData.heightM) || 0

  const areaM2 = useMemo(() => {
    const calculated = Number(widthM) * Number(heightM)
    return parseFloat(calculated.toFixed(2))
  }, [widthM, heightM])
  
  useEffect(() => {
    if (editing) {
      const formattedArea = areaM2.toFixed(2)
      setFormData(prev => ({ ...prev, areaM2: formattedArea }))
    }
  }, [areaM2, editing])

  // Cargar productos para el sustrato
  useEffect(() => {
    const cargarProductos = async () => {
      setCargandoProductos(true)
      try {
        const response = await fetch('/api/inventario?limit=1000')
        const data = await response.json()
        
        const productosList = (data.data || []).map((p: any) => ({
          id: p.id,
          codigo: p.codigo,
          nombre: p.nombre,
          precio_venta: p.precio_venta || 0
        }))
        
        setTodosLosProductos(productosList)
        setFilteredProductos(productosList.slice(0, 20))
      } catch (error) {
        console.error('Error cargando productos:', error)
      } finally {
        setCargandoProductos(false)
      }
    }
    
    cargarProductos()
  }, [])
  
  // Establecer sustrato por defecto si no hay uno seleccionado (solo una vez después de cargar productos)
  useEffect(() => {
    if (todosLosProductos.length > 0 && !formData.sustrato_id && editing) {
      const sustratoDefault = todosLosProductos.find((p: any) => {
        const nombreUpper = (p.nombre || '').toUpperCase()
        return nombreUpper.includes('LONA') && 
               nombreUpper.includes('13') && 
               (nombreUpper.includes('OZ') || nombreUpper.includes('OZ.')) &&
               (nombreUpper.includes('IMPRESIÓN') || nombreUpper.includes('IMPRESION'))
      })
      
      if (sustratoDefault) {
        setFormData(prev => ({
          ...prev,
          sustrato_id: sustratoDefault.id,
          sustrato_nombre: `${sustratoDefault.codigo} - ${sustratoDefault.nombre}`
        }))
      }
    }
  }, [todosLosProductos.length, editing]) // Solo cuando se cargan los productos o se entra en modo edición

  // Filtrar productos
  const filtrarProductos = (searchValue: string) => {
    if (!searchValue || searchValue.trim() === '') {
      setFilteredProductos(todosLosProductos.slice(0, 20))
      return
    }

    const search = searchValue.toLowerCase().trim()
    const filtered = todosLosProductos.filter((item: any) => {
      const codigo = (item.codigo || '').toLowerCase()
      const nombre = (item.nombre || '').toLowerCase()
      return codigo.startsWith(search) || nombre.startsWith(search)
    }).slice(0, 15)
    
    setFilteredProductos(filtered)
  }

  // Seleccionar sustrato
  const seleccionarSustrato = (producto: any) => {
    setFormData(prev => ({
      ...prev,
      sustrato_id: producto.id,
      sustrato_nombre: `${producto.codigo} - ${producto.nombre}`
    }))
    setOpenSustrato(false)
    setFilteredProductos(todosLosProductos.slice(0, 20))
  }

  // Función para generar Google Maps link desde coordenadas
  const generateGoogleMapsLink = (lat: number, lng: number): string => {
    return `https://www.google.com/maps?q=${lat},${lng}&z=15`
  }


  const handleChange = (field: string, value: string | boolean | string[] | null) => {
    console.log(`handleChange called: ${field} = ${value}`)
    
    setFormData(prev => {
      console.log('Previous formData:', prev)
      const newData = { ...prev, [field]: value }
      
      console.log('Final newData:', newData)
      return newData
    })
  }

  // Handlers para subir imágenes
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, imageType: 'principal' | 'secundaria1' | 'secundaria2') => {
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

    // Mostrar preview local
    const previewUrl = URL.createObjectURL(file)
    
    // Actualizar estado de carga
    setUploadingImages(prev => ({ ...prev, [imageType === 'principal' ? 'principal' : imageType === 'secundaria1' ? 'secundaria1' : 'secundaria2']: true }))
    
    try {
      toast.loading("Subiendo imagen...", { id: `upload-${imageType}` })
      
      const imageFormData = new FormData()
      imageFormData.append('file', file)
      
      const uploadResponse = await fetch(`/api/soportes/${id || 'new'}/image`, {
        method: 'POST',
        body: imageFormData
      })

      const uploadData = await uploadResponse.json()

      if (!uploadResponse.ok || !uploadData.success) {
        throw new Error(uploadData.error || 'Error subiendo la imagen')
      }

      const publicUrl = uploadData.data.publicUrl
      
      // Actualizar formData con la URL pública
      const fieldName = imageType === 'principal' ? 'imagen_principal' : imageType === 'secundaria1' ? 'imagen_secundaria_1' : 'imagen_secundaria_2'
      const fileFieldName = imageType === 'principal' ? 'imagen_principal_file' : imageType === 'secundaria1' ? 'imagen_secundaria_1_file' : 'imagen_secundaria_2_file'
      
      setFormData(prev => ({
        ...prev,
        [fieldName]: publicUrl,
        [fileFieldName]: file
      }))

      toast.success("Imagen subida correctamente", { id: `upload-${imageType}` })
    } catch (error) {
      console.error(`Error subiendo imagen ${imageType}:`, error)
      toast.error(error instanceof Error ? error.message : "Error subiendo la imagen", { id: `upload-${imageType}` })
      URL.revokeObjectURL(previewUrl)
    } finally {
      setUploadingImages(prev => ({ ...prev, [imageType === 'principal' ? 'principal' : imageType === 'secundaria1' ? 'secundaria1' : 'secundaria2']: false }))
      e.target.value = ''
    }
  }

  const handleRemoveImage = (imageType: 'principal' | 'secundaria1' | 'secundaria2') => {
    const fieldName = imageType === 'principal' ? 'imagen_principal' : imageType === 'secundaria1' ? 'imagen_secundaria_1' : 'imagen_secundaria_2'
    const fileFieldName = imageType === 'principal' ? 'imagen_principal_file' : imageType === 'secundaria1' ? 'imagen_secundaria_1_file' : 'imagen_secundaria_2_file'
    
    setFormData(prev => ({
      ...prev,
      [fieldName]: "",
      [fileFieldName]: null
    }))
  }


  const handleSave = async () => {
    if (!formData.code || !formData.title) {
      toast.error("Código y título son requeridos")
      return
    }

    setSaving(true)
    
    try {
      // Preparar datos para envío, convirtiendo strings vacíos a null donde corresponda
      // Construir array de imágenes para compatibilidad con buildSupabasePayload
      const imagesArray = [
        formData.imagen_principal || null,
        formData.imagen_secundaria_1 || null,
        formData.imagen_secundaria_2 || null
      ].filter(Boolean) as string[]
      
      const dataToSend = {
        ...formData,
        images: imagesArray, // Para compatibilidad con buildSupabasePayload
        widthM: formData.widthM ? parseFloat(formData.widthM) : null,
        heightM: formData.heightM ? parseFloat(formData.heightM) : null,
        areaM2: formData.areaM2 ? parseFloat(formData.areaM2) : null,
        priceMonth: formData.priceMonth ? parseFloat(formData.priceMonth) : null,
        impactosDiarios: formData.impactosDiarios ? parseInt(formData.impactosDiarios) : null,
        googleMapsLink: formData.googleMapsLink || null,
        latitude: formData.latitude,
        longitude: formData.longitude,
        address: formData.address || null,
        city: formData.city || null,
        zona: formData.zona || null,
        country: formData.country || null,
        owner: formData.owner || null,
        sustrato_id: formData.sustrato_id || null,
      }
      
      // Remover campos de archivos del payload (no se envían al servidor)
      delete (dataToSend as any).imagen_principal_file
      delete (dataToSend as any).imagen_secundaria_1_file
      delete (dataToSend as any).imagen_secundaria_2_file

      console.log('💾 Saving support with data:', {
        googleMapsLink: dataToSend.googleMapsLink,
        latitude: dataToSend.latitude,
        longitude: dataToSend.longitude,
        fullData: dataToSend
      });

      const response = await fetch(`/api/soportes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend)
      })

      if (response.ok) {
        const updated = await response.json()
        setSupport(updated)
        setEditing(false)
        console.log('✅ Soporte guardado exitosamente:', {
          googleMapsLink: updated.googleMapsLink,
          latitude: updated.latitude,
          longitude: updated.longitude
        });
        toast.success(`Soporte actualizado correctamente${dataToSend.googleMapsLink ? ' con enlace de Google Maps' : ''}`)
        fetchSupport() // Recargar datos
      } else {
        console.error('❌ Error response status:', response.status);
        console.error('❌ Error response headers:', response.headers);
        
        let errorMessage = "Error al actualizar el soporte";
        let errorDetails = "";
        
        try {
          const error = await response.json()
          console.error('❌ Error al guardar soporte:', error);
          errorMessage = error.error || error.message || `Error ${response.status}: ${response.statusText}`;
          errorDetails = error.details || "";
        } catch (parseError) {
          console.error('❌ Error parsing response:', parseError);
          errorMessage = `Error ${response.status}: ${response.statusText}`;
        }
        
        // Mostrar error más específico
        const fullErrorMessage = errorDetails ? `${errorMessage} - ${errorDetails}` : errorMessage;
        console.error('❌ Error completo:', fullErrorMessage);
        toast.error(fullErrorMessage);
      }
    } catch (error) {
      console.error("Error saving support:", error)
      toast.error("Error de conexión")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/soportes/${id}`, { method: "DELETE" })
      if (response.ok) {
        toast.success("Soporte eliminado correctamente")
        router.push("/panel/soportes")
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-500">Cargando...</div>
      </div>
    )
  }

  if (!support) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-500">Soporte no encontrado</div>
      </div>
    )
  }

  const owner = formData.owner?.trim()
  const ownerIsImagen = owner?.toLowerCase() === 'imagen'
  const ownerClass = owner
    ? ownerIsImagen ? 'bg-pink-100 text-pink-800' : 'bg-blue-100 text-blue-800'
    : 'hidden'

  return (
    <div className="p-6">
      <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              {editing ? "Editar Soporte" : support.title}
            </h1>
            <p className="text-gray-600">
              {editing ? "Modifica la información del soporte" : "Detalles del soporte publicitario"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {!editing ? (
              <>
                <PermisoEditar modulo="soportes">
                  <Button
                    variant="outline"
                    onClick={() => setEditing(true)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                </PermisoEditar>
                <PermisoEliminar modulo="soportes">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="bg-[#D54644] hover:bg-[#B03A38]">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar soporte?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Se eliminará permanentemente el soporte "{support.title}".
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
                </PermisoEliminar>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditing(false)
                    // Generar Google Maps link si hay coordenadas pero no link
                    let googleMapsLink = support.googleMapsLink || ""
                    if (!googleMapsLink && support.latitude && support.longitude) {
                      googleMapsLink = generateGoogleMapsLink(support.latitude, support.longitude)
                    }

                    setFormData({
                      code: support.code || "",
                      title: support.title || "",
                      type: support.type || "",
                      status: support.status || "Disponible",
                      widthM: support.widthM?.toString() || "",
                      heightM: support.heightM?.toString() || "",
                      areaM2: support.areaM2?.toString() || "",
                      iluminacion: support.iluminacion ?? null,
                      owner: support.owner || "",
                      images: support.images || [],
                      googleMapsLink,
                      latitude: support.latitude || null,
                      longitude: support.longitude || null,
                      address: support.address || "",
                      city: support.city || "",
                      country: support.country || "",
                      impactosDiarios: support.impactosDiarios?.toString() || "",
                      priceMonth: support.priceMonth?.toString() || "",
                      available: support.available ?? true
                    })
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSave}
                  className="bg-[#D54644] hover:bg-[#B03A38]"
                  disabled={saving}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Guardando..." : "Guardar"}
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
              <CardDescription>Datos principales del soporte</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {editing ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="code">Código *</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => handleChange("code", e.target.value)}
                      className="bg-neutral-100 border-neutral-200 text-gray-900 font-mono"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleChange("title", e.target.value)}
                      required
                    />
                  </div>
                  

                  <div className="space-y-2">
                    <Label htmlFor="status">Estado *</Label>
                    <Select value={formData.status} onValueChange={(value) => handleChange("status", value as keyof typeof STATUS_META)}>
                      <SelectTrigger className="bg-white dark:bg-white text-gray-900 border border-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-md">
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

                  {tieneFuncionTecnica("ver propietario soportes") && (
                    <div className="space-y-2">
                      <Label htmlFor="owner">Propietario</Label>
                      <Input
                        id="owner"
                        value={formData.owner}
                        onChange={(e) => handleChange("owner", e.target.value)}
                        placeholder="Propietario del soporte"
                      />
                      {owner && (
                        <div className={`mt-2 inline-flex rounded-md px-3 py-1 text-sm pointer-events-none select-none ${ownerClass}`}>
                          {owner}
                        </div>
                      )}
                    </div>
                  )}

                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Código</Label>
                      <p className="font-mono font-medium">{support.code}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Tipo de soporte</Label>
                      <Badge variant="secondary">{support.type}</Badge>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Estado</Label>
                    <span className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${STATUS_META[support.status]?.className || 'bg-gray-100 text-gray-800'}`}>
                      {STATUS_META[support.status]?.label || support.status}
                    </span>
                  </div>

                  {support.owner && tieneFuncionTecnica("ver propietario soportes") && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Propietario</Label>
                      <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ${
                        support.owner.trim().toLowerCase() === 'imagen' ? 'bg-pink-100 text-pink-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {support.owner}
                      </span>
                    </div>
                  )}

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Imágenes</Label>
                    {support.images && support.images.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {support.images.map((image, index) => (
                          <div key={index} className="relative h-32">
                            <Image 
                              src={image} 
                              alt={`Imagen ${index + 1}`} 
                              fill
                              className="object-cover rounded-md border"
                              sizes="(max-width: 768px) 50vw, 25vw"
                              loading="lazy"
                              onError={(e) => {
                                console.error(`❌ Error cargando imagen ${index + 1}:`, image)
                                e.currentTarget.style.display = 'none'
                              }}
                              onLoad={() => {
                                console.log(`✅ Imagen ${index + 1} cargada correctamente:`, image)
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 mt-1">Sin imágenes</p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Características Técnicas */}
          <Card>
            <CardHeader>
              <CardTitle>Características Técnicas</CardTitle>
              <CardDescription>Especificaciones técnicas del soporte</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {editing ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo de soporte *</Label>
                    <Select value={formData.type} onValueChange={(value) => handleChange("type", value)}>
                      <SelectTrigger className="bg-white dark:bg-white text-gray-900 border border-gray-200">
                        <SelectValue placeholder="Selecciona el tipo" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-md">
                        {TYPE_OPTIONS.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="widthM">Ancho (m)</Label>
                      <Input
                        id="widthM"
                        type="number"
                        step="0.1"
                        value={formData.widthM}
                        onChange={(e) => handleChange("widthM", e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="heightM">Alto (m)</Label>
                      <Input
                        id="heightM"
                        type="number"
                        step="0.1"
                        value={formData.heightM}
                        onChange={(e) => handleChange("heightM", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="areaM2">Área total (m²)</Label>
                    <Input
                      id="areaM2"
                      value={formData.areaM2 ? parseFloat(formData.areaM2).toFixed(2) : ""}
                      readOnly
                      aria-readonly="true"
                      className="bg-gray-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="iluminacion">Iluminación</Label>
                    <Select value={formData.iluminacion === null ? "" : formData.iluminacion.toString()} onValueChange={(value) => handleChange("iluminacion", value === "" ? null : value === "true")}>
                      <SelectTrigger className="bg-white dark:bg-white text-gray-900 border border-gray-200">
                        <SelectValue placeholder="Selecciona una opción" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-md">
                        <SelectItem value="true">Sí</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sustrato">Seleccionar sustrato</Label>
                    <Popover open={openSustrato} onOpenChange={(open) => {
                      setOpenSustrato(open)
                      if (open) {
                        setFilteredProductos(todosLosProductos.slice(0, 20))
                      }
                    }}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-start",
                            !formData.sustrato_nombre && "text-muted-foreground"
                          )}
                        >
                          <span className="truncate">
                            {formData.sustrato_nombre || "Buscar producto sustrato..."}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput 
                            placeholder="Escribe código o nombre..."
                            className="h-9 border-0 focus:ring-0"
                            onValueChange={filtrarProductos}
                          />
                          <CommandList>
                            <CommandEmpty>
                              {cargandoProductos ? "Cargando..." : "No se encontraron productos."}
                            </CommandEmpty>
                            {filteredProductos.length > 0 && (
                              <CommandGroup heading="Productos">
                                {filteredProductos.map((producto: any) => (
                                  <CommandItem
                                    key={producto.id}
                                    value={`${producto.codigo} ${producto.nombre}`}
                                    onSelect={() => seleccionarSustrato(producto)}
                                    className="cursor-pointer"
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        formData.sustrato_id === producto.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <span className="text-xs truncate">
                                      [{producto.codigo}] {producto.nombre}
                                    </span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            )}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Ancho</Label>
                      <p>{support.widthM ? `${support.widthM}m` : "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Alto</Label>
                      <p>{support.heightM ? `${support.heightM}m` : "N/A"}</p>
                    </div>
                  </div>
                  
                  {support.areaM2 && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Área total</Label>
                      <p className="font-semibold">{support.areaM2} m²</p>
                    </div>
                  )}

                  {support.iluminacion !== null && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Iluminación</Label>
                      <p className="font-semibold">{support.iluminacion ? "Sí" : "No"}</p>
                    </div>
                  )}

                </>
              )}
            </CardContent>
          </Card>

          {/* Ubicación */}
          <Card>
            <CardHeader>
              <CardTitle>Ubicación</CardTitle>
              <CardDescription>Información de localización</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {editing ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="address">Descripción</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleChange("address", e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">Ciudad</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleChange("city", e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="country">País</Label>
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) => handleChange("country", e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="zona">Zona</Label>
                    <Input
                      id="zona"
                      value={formData.zona}
                      onChange={(e) => handleChange("zona", e.target.value)}
                      placeholder="Zona norte, centro, etc."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="googleMapsLink">Enlace de Google Maps</Label>
                    <GmapsLinkPaste 
                      onCoords={(coords) => {
                        console.log('🎯 Coordinates received from URL paste:', coords);
                        const newGoogleMapsLink = `https://www.google.com/maps?q=${coords.lat},${coords.lng}&z=15`;
                        console.log('🔗 Generated new Google Maps link from paste:', newGoogleMapsLink);
                        
                        setFormData(prev => ({
                          ...prev,
                          latitude: coords.lat,
                          longitude: coords.lng,
                          googleMapsLink: newGoogleMapsLink
                        }));
                        toast.success(`¡Ubicación encontrada! ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
                      }}
                    />
                    <p className="text-xs text-gray-500">
                      💡 Pega cualquier enlace de Google Maps y la chincheta se moverá automáticamente
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Ubicación en el mapa</Label>
                    <EditableLeafletMap
                      lat={formData.latitude || -16.5000}
                      lng={formData.longitude || -68.1500}
                      onChange={(coords) => {
                        console.log('🎯 Map coordinates changed:', coords);
                        const newGoogleMapsLink = `https://www.google.com/maps?q=${coords.lat},${coords.lng}&z=15`;
                        console.log('🔗 Generated new Google Maps link:', newGoogleMapsLink);
                        
                        setFormData(prev => {
                          const newData = {
                            ...prev,
                            latitude: coords.lat,
                            longitude: coords.lng,
                            googleMapsLink: newGoogleMapsLink
                          };
                          console.log('📝 Updated formData:', {
                            latitude: newData.latitude,
                            longitude: newData.longitude,
                            googleMapsLink: newData.googleMapsLink
                          });
                          return newData;
                        });
                        
                        toast.success(`Ubicación actualizada: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
                      }}
                      height={420}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Descripción</Label>
                    <p>{support.address || "No especificada"}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Ciudad</Label>
                      <p>{support.city || "No especificada"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">País</Label>
                      <p>{support.country || "No especificado"}</p>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Zona</Label>
                    <p>{support.zona || "No especificada"}</p>
                  </div>
                  
                  {support.googleMapsLink && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Ubicación</Label>
                      <div className="flex flex-col gap-1">
                        <a 
                          href={support.googleMapsLink} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-600 hover:text-blue-800 underline text-sm"
                        >
                          Ver en Google Maps
                        </a>
                        {(support.latitude && support.longitude) && (
                          <a 
                            href={`https://www.openstreetmap.org/?mlat=${support.latitude}&mlon=${support.longitude}&zoom=15`}
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-600 hover:text-blue-800 underline text-sm"
                          >
                            Ver en OpenStreetMap
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
              
              {/* Mapa de ubicación */}
              {!editing && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Ubicación</Label>
                  <EditableLeafletMap
                    lat={support.latitude || -16.5000}
                    lng={support.longitude || -68.1500}
                    onChange={() => {}} // No editable en modo visualización
                    height={300}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Precios */}
          <Card>
            <CardHeader>
              <CardTitle>Precios</CardTitle>
              <CardDescription>Información de tarifas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {editing ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="impactosDiarios">Impactos Diarios</Label>
                    <Input
                      id="impactosDiarios"
                      type="number"
                      value={formData.impactosDiarios}
                      onChange={(e) => handleChange("impactosDiarios", e.target.value)}
                      placeholder="1000"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="priceMonth">Precio por Mes (Bs)</Label>
                    <Input
                      id="priceMonth"
                      type="number"
                      step="0.01"
                      value={formData.priceMonth}
                      onChange={(e) => handleChange("priceMonth", e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <Label>Imágenes del soporte (máximo 3, 5MB cada una)</Label>
                    
                    {/* Imagen Principal */}
                    <div className="space-y-2">
                      <Label htmlFor="imagen_principal" className="text-sm font-medium">Imagen Principal</Label>
                      <div className="flex items-center gap-3">
                        {formData.imagen_principal ? (
                          <div className="relative group">
                            <div className="relative h-24 w-40 overflow-hidden rounded-md border-2 border-gray-200 bg-gray-100">
                              <Image 
                                src={formData.imagen_principal} 
                                alt="Imagen principal" 
                                fill
                                className="object-cover"
                                sizes="160px"
                                loading="lazy"
                              />
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="absolute top-1 right-1 opacity-90 hover:opacity-100 h-6 px-2"
                              onClick={() => handleRemoveImage('principal')}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="aspect-square w-24 flex flex-col items-center justify-center rounded-md border-2 border-dashed border-gray-300 bg-gray-50">
                            <ImageIcon className="w-6 h-6 text-gray-400 mb-1" />
                            <p className="text-xs text-gray-500">Sin imagen</p>
                          </div>
                        )}
                        <div className="flex-1">
                          <input
                            id="imagen_principal"
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageChange(e, 'principal')}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            disabled={uploadingImages.principal}
                            onClick={() => {
                              const input = document.getElementById('imagen_principal') as HTMLInputElement
                              input?.click()
                            }}
                          >
                            <ImageIcon className="w-4 h-4 mr-2" />
                            {uploadingImages.principal 
                              ? 'Subiendo...' 
                              : formData.imagen_principal 
                                ? 'Cambiar imagen' 
                                : 'Seleccionar imagen'
                            }
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Imagen Secundaria 1 */}
                    <div className="space-y-2">
                      <Label htmlFor="imagen_secundaria_1" className="text-sm font-medium">Imagen Secundaria 1</Label>
                      <div className="flex items-center gap-3">
                        {formData.imagen_secundaria_1 ? (
                          <div className="relative group">
                            <div className="relative h-24 w-40 overflow-hidden rounded-md border-2 border-gray-200 bg-gray-100">
                              <Image 
                                src={formData.imagen_secundaria_1} 
                                alt="Imagen secundaria 1" 
                                fill
                                className="object-cover"
                                sizes="160px"
                                loading="lazy"
                              />
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="absolute top-1 right-1 opacity-90 hover:opacity-100 h-6 px-2"
                              onClick={() => handleRemoveImage('secundaria1')}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="aspect-square w-24 flex flex-col items-center justify-center rounded-md border-2 border-dashed border-gray-300 bg-gray-50">
                            <ImageIcon className="w-6 h-6 text-gray-400 mb-1" />
                            <p className="text-xs text-gray-500">Sin imagen</p>
                          </div>
                        )}
                        <div className="flex-1">
                          <input
                            id="imagen_secundaria_1"
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageChange(e, 'secundaria1')}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            disabled={uploadingImages.secundaria1}
                            onClick={() => {
                              const input = document.getElementById('imagen_secundaria_1') as HTMLInputElement
                              input?.click()
                            }}
                          >
                            <ImageIcon className="w-4 h-4 mr-2" />
                            {uploadingImages.secundaria1 
                              ? 'Subiendo...' 
                              : formData.imagen_secundaria_1 
                                ? 'Cambiar imagen' 
                                : 'Seleccionar imagen'
                            }
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Imagen Secundaria 2 */}
                    <div className="space-y-2">
                      <Label htmlFor="imagen_secundaria_2" className="text-sm font-medium">Imagen Secundaria 2</Label>
                      <div className="flex items-center gap-3">
                        {formData.imagen_secundaria_2 ? (
                          <div className="relative group">
                            <div className="relative h-24 w-40 overflow-hidden rounded-md border-2 border-gray-200 bg-gray-100">
                              <Image 
                                src={formData.imagen_secundaria_2} 
                                alt="Imagen secundaria 2" 
                                fill
                                className="object-cover"
                                sizes="160px"
                                loading="lazy"
                              />
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="absolute top-1 right-1 opacity-90 hover:opacity-100 h-6 px-2"
                              onClick={() => handleRemoveImage('secundaria2')}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="aspect-square w-24 flex flex-col items-center justify-center rounded-md border-2 border-dashed border-gray-300 bg-gray-50">
                            <ImageIcon className="w-6 h-6 text-gray-400 mb-1" />
                            <p className="text-xs text-gray-500">Sin imagen</p>
                          </div>
                        )}
                        <div className="flex-1">
                          <input
                            id="imagen_secundaria_2"
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageChange(e, 'secundaria2')}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            disabled={uploadingImages.secundaria2}
                            onClick={() => {
                              const input = document.getElementById('imagen_secundaria_2') as HTMLInputElement
                              input?.click()
                            }}
                          >
                            <ImageIcon className="w-4 h-4 mr-2" />
                            {uploadingImages.secundaria2 
                              ? 'Subiendo...' 
                              : formData.imagen_secundaria_2 
                                ? 'Cambiar imagen' 
                                : 'Seleccionar imagen'
                            }
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-500">Máximo 5MB. Formatos: JPG, PNG, GIF</p>
                  </div>
                </>
              ) : (
                <>
                  {support.impactosDiarios && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Impactos Diarios</Label>
                      <p className="text-lg font-semibold">{support.impactosDiarios.toLocaleString()}</p>
                    </div>
                  )}
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Precio por Mes</Label>
                    <p className="text-lg font-semibold">{formatPrice(support.priceMonth)}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Información del Sistema */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Información del Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <Label className="text-sm font-medium text-gray-700">Creado</Label>
                <p>{formatDate(support.createdAt)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Última actualización</Label>
                <p>{formatDate(support.updatedAt)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Empresa</Label>
                <p>{support.company?.name || "No asignada"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      </div>
    </div>
  )
}
