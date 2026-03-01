"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Save, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { UNIDADES_MEDIDA_AIRTABLE } from "@/lib/constants"
import { useCategorias } from "@/hooks/use-categorias"
import { CuentaContableSelect } from "@/components/contabilidad/CuentaContableSelect"
import type { Cuenta } from "@/lib/types/contabilidad"

interface Consumible {
  id: string
  codigo: string
  nombre: string
  categoria: string
  formato?: string | null
  responsable: string
  unidad_medida: string
  coste: number
  cuenta_venta?: number | null
  cuenta_compra?: number | null
}

export default function ConsumibleDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id || '')
  
  // Detectar si es un nuevo consumible
  const isNewConsumible = id === 'nuevo' || id === 'new'
  
  const [consumible, setConsumible] = useState<Consumible | null>(null)
  const [loading, setLoading] = useState(!isNewConsumible)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(true)
  
  // Cargar categorías dinámicamente
  const { categorias, loading: categoriasLoading } = useCategorias("Inventario", "Consumibles")
  // Cargar formatos
  const [formatos, setFormatos] = useState<Array<{ id: string; formato: string; cantidad: number; unidad_medida: string }>>([])
  const [formatosLoading, setFormatosLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    codigo: "",
    nombre: "",
    categoria: "",
    formato: [] as Array<{ formato: string; cantidad: number; unidad_medida: string }>,
    responsable: "",
    unidad_medida: "unidad",
    coste: "0",
    cuenta_venta: "112001001",
    cuenta_compra: ""
  })
  
  // Estado para el input de formato
  const [formatoInputValue, setFormatoInputValue] = useState("")
  const [openFormatoPopover, setOpenFormatoPopover] = useState(false)
  
  // Estado para códigos existentes
  const [codigosExistentes, setCodigosExistentes] = useState<Set<string>>(new Set())
  const [codigoDuplicado, setCodigoDuplicado] = useState(false)
  
  // Lista de cuentas contables (para mapear id <-> codigo)
  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  useEffect(() => {
    let cancelled = false
    fetch('/api/contabilidad/cuentas?limit=10000')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data?.data) setCuentas(data.data)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  // Sincronizar cuenta_venta/cuenta_compra (id -> codigo) una vez cuando tengamos consumible y cuentas
  const lastSyncedConsumibleIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (!consumible || cuentas.length === 0) return
    if (lastSyncedConsumibleIdRef.current === consumible.id) return
    lastSyncedConsumibleIdRef.current = consumible.id
    const cvCodigo = consumible.cuenta_venta != null ? (cuentas.find((c) => c.id === consumible.cuenta_venta)?.cuenta ?? "112001001") : "112001001"
    const ccCodigo = consumible.cuenta_compra != null ? (cuentas.find((c) => c.id === consumible.cuenta_compra)?.cuenta ?? "") : ""
    setFormData((prev) => ({ ...prev, cuenta_venta: cvCodigo, cuenta_compra: ccCodigo }))
  }, [consumible, cuentas])

  // Cargar formatos al montar
  useEffect(() => {
    const fetchFormatos = async () => {
      try {
        setFormatosLoading(true)
        const response = await fetch('/api/formatos')
        if (response.ok) {
          const result = await response.json()
          setFormatos(result.data || [])
        }
      } catch (error) {
        console.error('Error cargando formatos:', error)
      } finally {
        setFormatosLoading(false)
      }
    }
    fetchFormatos()
  }, [])

  // Inicializar categoría cuando se carguen las categorías
  useEffect(() => {
    if (!categoriasLoading && categorias.length > 0 && !formData.categoria) {
      setFormData(prev => ({ ...prev, categoria: categorias[0] }))
    }
  }, [categoriasLoading, categorias, formData.categoria])

  const fetchConsumible = useCallback(async () => {
    try {
      setLoading(true)
      console.log('🔍 Fetching consumible with ID:', id)
      
      if (!id || id === 'undefined' || id === 'null') {
        throw new Error('ID de consumible inválido')
      }
      
      const response = await fetch(`/api/consumibles/${id}`)
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
        console.log('✅ Consumible encontrado:', data)
        
        setConsumible(data)
        const costeRedondeado = data.coste ? Math.round(data.coste * 100) / 100 : 0
        
        // Parsear formato: puede ser null, objeto único, o array
        let formatosArray: Array<{ formato: string; cantidad: number; unidad_medida: string }> = []
        if (data.formato) {
          if (Array.isArray(data.formato)) {
            formatosArray = data.formato
          } else if (typeof data.formato === 'string') {
            try {
              const parsed = JSON.parse(data.formato)
              formatosArray = Array.isArray(parsed) ? parsed : (parsed ? [parsed] : [])
            } catch {
              try {
                const obj = typeof data.formato === 'object' ? data.formato : JSON.parse(data.formato)
                formatosArray = obj ? [obj] : []
              } catch {
                formatosArray = []
              }
            }
          } else if (typeof data.formato === 'object') {
            formatosArray = [data.formato]
          }
        }
        
        setFormData({
          codigo: data.codigo || "",
          nombre: data.nombre || "",
          categoria: data.categoria || (categorias.length > 0 ? categorias[0] : ""),
          formato: formatosArray,
          responsable: data.responsable || "",
          unidad_medida: data.unidad_medida || "unidad",
          coste: costeRedondeado.toFixed(2)
        })
      } else {
        console.error('❌ Error en respuesta:', result)
        const errorMessage = result?.error || result?.message || "Consumible no encontrado"
        toast.error(errorMessage)
        setTimeout(() => {
          router.push("/panel/consumibles")
        }, 2000)
      }
    } catch (error) {
      console.error('❌ Error fetching consumible:', error)
      const errorMessage = error instanceof Error ? error.message : "Error de conexión"
      toast.error(errorMessage)
      setTimeout(() => {
        router.push("/panel/consumibles")
      }, 2000)
    } finally {
      setLoading(false)
    }
  }, [id, router])

  // Cargar códigos existentes cuando es un nuevo consumible
  const fetchCodigosExistentes = useCallback(async () => {
    if (!isNewConsumible) return
    
    try {
      const response = await fetch('/api/consumibles?limit=10000')
      if (response.ok) {
        const result = await response.json()
        const codigos = new Set((result.data || []).map((r: any) => r.codigo?.toLowerCase().trim()).filter(Boolean))
        setCodigosExistentes(codigos)
      }
    } catch (error) {
      console.error('Error cargando códigos existentes:', error)
    }
  }, [isNewConsumible])
  
  // Cargar códigos existentes excluyendo el consumible actual cuando se edita
  const fetchCodigosExistentesParaEdicion = useCallback(async () => {
    if (isNewConsumible || !consumible) return
    
    try {
      const response = await fetch('/api/consumibles?limit=10000')
      if (response.ok) {
        const result = await response.json()
        const codigos = new Set(
          (result.data || [])
            .filter((r: any) => r.id !== consumible.id)
            .map((r: any) => r.codigo?.toLowerCase().trim())
            .filter(Boolean)
        )
        setCodigosExistentes(codigos)
      }
    } catch (error) {
      console.error('Error cargando códigos existentes:', error)
    }
  }, [isNewConsumible, consumible])

  useEffect(() => {
    if (id && !isNewConsumible && !categoriasLoading) {
      fetchConsumible()
    } else if (isNewConsumible && !categoriasLoading) {
      setLoading(false)
      setEditing(true)
      fetchCodigosExistentes()
    }
  }, [id, isNewConsumible, categoriasLoading, fetchConsumible, fetchCodigosExistentes])

  useEffect(() => {
    if (consumible) {
      setEditing(true)
      if (!isNewConsumible) {
        fetchCodigosExistentesParaEdicion()
      }
    }
  }, [consumible, isNewConsumible, fetchCodigosExistentesParaEdicion])

  const handleChange = (field: string, value: string | boolean | number | { formato: string; cantidad: number; unidad_medida: string } | null | Array<{ formato: string; cantidad: number; unidad_medida: string }>) => {
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
  
  // Funciones para manejar múltiples formatos
  const handleFormatoInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && formatoInputValue.trim()) {
      e.preventDefault()
      const formatoSeleccionado = formatos.find(f => {
        const displayText = `${f.formato} ${f.cantidad} ${f.unidad_medida}`
        return displayText.toLowerCase().includes(formatoInputValue.toLowerCase().trim())
      })
      
      if (formatoSeleccionado) {
        const nuevoFormato = {
          formato: formatoSeleccionado.formato,
          cantidad: formatoSeleccionado.cantidad,
          unidad_medida: formatoSeleccionado.unidad_medida
        }
        
        const yaExiste = formData.formato.some(f => 
          f.formato === nuevoFormato.formato && 
          f.cantidad === nuevoFormato.cantidad && 
          f.unidad_medida === nuevoFormato.unidad_medida
        )
        
        if (!yaExiste) {
          handleChange("formato", [...formData.formato, nuevoFormato])
        }
        setFormatoInputValue("")
      }
    }
  }
  
  const handleRemoveFormato = (formatoToRemove: { formato: string; cantidad: number; unidad_medida: string }) => {
    handleChange("formato", formData.formato.filter(f => 
      !(f.formato === formatoToRemove.formato && 
        f.cantidad === formatoToRemove.cantidad && 
        f.unidad_medida === formatoToRemove.unidad_medida)
    ))
  }
  
  const handleFormatoSelectChange = (value: string) => {
    if (value === "__sin_formato__") {
      handleChange("formato", [])
      setFormatoInputValue("")
    } else {
      const formatoSeleccionado = formatos.find(f => f.id === value)
      if (formatoSeleccionado) {
        const nuevoFormato = {
          formato: formatoSeleccionado.formato,
          cantidad: formatoSeleccionado.cantidad,
          unidad_medida: formatoSeleccionado.unidad_medida
        }
        const yaExiste = formData.formato.some(f => 
          f.formato === nuevoFormato.formato && 
          f.cantidad === nuevoFormato.cantidad && 
          f.unidad_medida === nuevoFormato.unidad_medida
        )
        if (!yaExiste) {
          handleChange("formato", [...formData.formato, nuevoFormato])
        }
        setFormatoInputValue("")
      }
    }
  }

  const handleSave = async () => {
    if (!formData.codigo || !formData.nombre) {
      toast.error("Código y nombre son requeridos")
      return
    }
    
    // Validar categoría
    if (!formData.categoria || !categorias.includes(formData.categoria)) {
      toast.error("Debe seleccionar una categoría válida")
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
      const cuentaVentaId = (formData.cuenta_venta?.trim() && cuentas.length > 0)
        ? (cuentas.find((c) => String(c.cuenta).trim() === formData.cuenta_venta.trim())?.id ?? null)
        : null
      const cuentaCompraId = (formData.cuenta_compra?.trim() && cuentas.length > 0)
        ? (cuentas.find((c) => String(c.cuenta).trim() === formData.cuenta_compra.trim())?.id ?? null)
        : null
      const dataToSend = {
        codigo: formData.codigo.trim(),
        nombre: formData.nombre.trim(),
        categoria: formData.categoria,
        formato: formData.formato,
        responsable: formData.responsable.trim() || null,
        unidad_medida: formData.unidad_medida,
        coste: Math.round((parseFloat(formData.coste) || 0) * 100) / 100,
        cuenta_venta: cuentaVentaId,
        cuenta_compra: cuentaCompraId
      }

      console.log("💾 Guardando consumible:", { id, isNewConsumible, dataToSend })

      let response
      if (isNewConsumible) {
        response = await fetch(`/api/consumibles`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataToSend)
        })
      } else {
        response = await fetch(`/api/consumibles/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataToSend)
        })
      }

      const responseData = await response.json().catch(() => ({}))

      if (response.ok && responseData.success !== false) {
        const updated = responseData.data || responseData
        setConsumible(updated)
        console.log("✅ Consumible guardado correctamente:", updated)
        toast.success(isNewConsumible ? "Consumible creado correctamente" : "Consumible actualizado correctamente")
        
        await new Promise(resolve => setTimeout(resolve, 300))
        router.push("/panel/consumibles")
      } else {
        const errorMessage = responseData.error || responseData.message || `Error ${response.status}: ${response.statusText}`
        console.error("❌ Error guardando consumible:", errorMessage, responseData)
        toast.error(errorMessage || "Error al guardar el consumible")
        setSaving(false)
      }
    } catch (error) {
      console.error("❌ Error saving consumible:", error)
      toast.error(error instanceof Error ? error.message : "Error de conexión al guardar")
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/consumibles/${id}`, { method: "DELETE" })
      if (response.ok) {
        toast.success("Consumible eliminado correctamente")
        router.push("/panel/consumibles")
      } else {
        toast.error("Error al eliminar el consumible")
      }
    } catch (error) {
      toast.error("Error de conexión")
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-gray-500">Cargando consumible...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isNewConsumible ? "Nuevo Consumible" : "Editar Consumible"}
          </h1>
          <p className="text-gray-600 mt-1">
            {isNewConsumible ? "Crear un nuevo consumible para uso interno" : "Modificar los datos del consumible"}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => {
              router.push("/panel/consumibles")
            }}
          >
            Cancelar
          </Button>
          {!isNewConsumible && consumible && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-red-600 hover:text-red-700">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar consumible?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Se eliminará permanentemente el consumible "{consumible.nombre}".
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
            disabled={saving || codigoDuplicado}
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario principal */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
              <CardDescription>Datos principales del consumible</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo">
                    Código <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="codigo"
                    value={formData.codigo}
                    onChange={(e) => handleChange("codigo", e.target.value)}
                    placeholder="Ej: CONS-001"
                    className={codigoDuplicado ? "border-red-500" : ""}
                  />
                  {codigoDuplicado && (
                    <p className="text-sm text-red-500">Este código ya existe</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nombre">
                    Nombre <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => handleChange("nombre", e.target.value)}
                    placeholder="Nombre del consumible"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoría</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(value) => handleChange("categoria", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {!categoriasLoading && categorias.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unidad_medida">Unidad de Medida</Label>
                  <Select
                    value={formData.unidad_medida}
                    onValueChange={(value) => handleChange("unidad_medida", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIDADES_MEDIDA_AIRTABLE.map((unidad) => (
                        <SelectItem key={unidad} value={unidad}>
                          {unidad}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="formato">Formato</Label>
                  <Popover open={openFormatoPopover} onOpenChange={setOpenFormatoPopover}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openFormatoPopover}
                        className="w-full justify-between"
                      >
                        Agregar formato
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start" side="top">
                      <div className="max-h-[300px] overflow-y-auto">
                        <div
                          className={`px-3 py-2 cursor-pointer hover:bg-accent text-sm ${
                            formData.formato.length === 0 ? 'bg-accent font-medium' : ''
                          }`}
                          onClick={() => {
                            handleChange("formato", [])
                            setOpenFormatoPopover(false)
                          }}
                        >
                          Sin formato
                        </div>
                        {!formatosLoading && formatos.map((formato) => {
                          const displayText = `${formato.formato} ${formato.cantidad} ${formato.unidad_medida}`
                          const yaExiste = formData.formato.some(f => 
                            f.formato === formato.formato && 
                            f.cantidad === formato.cantidad && 
                            f.unidad_medida === formato.unidad_medida
                          )
                          return (
                            <div
                              key={formato.id}
                              className={`px-3 py-2 cursor-pointer hover:bg-accent text-sm ${
                                yaExiste ? 'bg-accent font-medium' : ''
                              }`}
                              onClick={() => {
                                if (!yaExiste) {
                                  const nuevoFormato = {
                                    formato: formato.formato,
                                    cantidad: formato.cantidad,
                                    unidad_medida: formato.unidad_medida
                                  }
                                  handleChange("formato", [...formData.formato, nuevoFormato])
                                }
                                setOpenFormatoPopover(false)
                              }}
                            >
                              {displayText}
                            </div>
                          )
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>
                  
                  {/* Chips de formatos seleccionados */}
                  {formData.formato && formData.formato.length > 0 && (
                    <div className="min-h-[60px] w-full rounded-md border border-gray-200 bg-white p-3">
                      <div className="flex flex-wrap gap-2">
                        {formData.formato.map((formato, index) => {
                          const displayText = formato.formato === "Unidad suelta" 
                            ? "Unidad suelta"
                            : `${formato.formato} ${formato.cantidad} ${formato.unidad_medida}`
                          return (
                            <div
                              key={index}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-sm bg-gray-100 text-gray-800"
                            >
                              <span>{displayText}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveFormato(formato)}
                                className="ml-1 hover:bg-gray-200 rounded-full p-0.5 transition-colors"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coste">Coste (Bs)</Label>
                  <Input
                    id="coste"
                    type="number"
                    step="0.01"
                    value={formData.coste}
                    onChange={(e) => handleChange("coste", e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contabilidad */}
          <Card>
            <CardHeader>
              <CardTitle>Contabilidad</CardTitle>
              <CardDescription>Cuentas contables para contabilización automática de facturas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cuenta_venta">Cuenta de Venta</Label>
                  <CuentaContableSelect
                    value={formData.cuenta_venta ?? "112001001"}
                    onChange={(v) => setFormData({ ...formData, cuenta_venta: v })}
                    placeholder="Seleccionar cuenta..."
                  />
                </div>
                <div>
                  <Label htmlFor="cuenta_compra">Cuenta de Compra</Label>
                  <CuentaContableSelect
                    value={formData.cuenta_compra ?? ""}
                    onChange={(v) => setFormData({ ...formData, cuenta_compra: v })}
                    placeholder="Seleccionar cuenta (opcional)"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel lateral */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Código:</span>
                <span className="font-mono text-sm">{formData.codigo || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Categoría:</span>
                <Badge variant="secondary">{formData.categoria}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Unidad:</span>
                <span>{formData.unidad_medida}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Coste:</span>
                <span className="font-semibold">Bs {parseFloat(formData.coste || "0").toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
