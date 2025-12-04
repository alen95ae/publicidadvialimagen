"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
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
import { ArrowLeft, Save, Trash2, Edit, Image as ImageIcon, Calculator, DollarSign, Plus, X, Palette, RotateCcw, Eye, Check, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useProductoVariantes } from "@/hooks/useProductoVariantes"
import { generarCombinacionesVariantes, convertirVariantesAFormato, parsearClaveVariante } from "@/lib/variantes/generarCombinaciones"
import { calcularDiferenciaCoste, calcularDiferenciaPrecio } from "@/lib/variantes/calcularPrecioVariante"
import { calcularCosteVariante } from "@/lib/variantes/calcularCosteVariante"

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
  const [imageError, setImageError] = useState("")
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
  const [isApplyingCost, setIsApplyingCost] = useState(false)
  const [costApplied, setCostApplied] = useState(false)
  const hasManualCostRef = useRef(false)
  const savedCostRef = useRef<number | null>(null)
  const lastCalculatedCostRef = useRef(0)
  
  // Estados para calculadora de precios (estructura estática)
  const defaultPriceRows = [
    { id: 1, campo: "Coste", porcentaje: null, valor: 0, editable: false, porcentajeConfig: null },
    { id: 2, campo: "Precio", porcentaje: null, valor: 0, editable: true, porcentajeConfig: null },
    { id: 3, campo: "Factura", porcentaje: 16, valor: 0, editable: true, porcentajeConfig: 16 },
    { id: 4, campo: "IUE", porcentaje: 2, valor: 0, editable: true, porcentajeConfig: 2 },
    { id: 5, campo: "Costos totales", porcentaje: null, valor: 0, editable: false, porcentajeConfig: null },
    { id: 6, campo: "Utilidad bruta", porcentaje: null, valor: 0, editable: false, porcentajeConfig: null },
    { id: 7, campo: "Comision", porcentaje: 12, valor: 0, editable: true, porcentajeConfig: 12 },
    { id: 8, campo: "Utilidad neta", porcentaje: null, valor: 0, editable: false, porcentajeConfig: null }
  ]
  const [priceRows, setPriceRows] = useState(defaultPriceRows)
  const [isApplyingPrice, setIsApplyingPrice] = useState(false)
  const [priceApplied, setPriceApplied] = useState(false)
  
  // Estados para variantes del producto (solo visualización, importadas de recursos)
  const [variantes, setVariantes] = useState<any[]>([])
  
  // Hook para gestionar variantes de productos
  const {
    variantes: variantesProducto,
    loading: loadingVariantes,
    saving: savingVariantes,
    getVariantes,
    saveVariante,
    resetVariante,
    recalcularTodas,
    regenerarVariantes
  } = useProductoVariantes(isNewProduct ? null : id)
  
  // Estados para edición inline de variantes
  const [editingVariante, setEditingVariante] = useState<Record<string, any>>({})
  
  // Estados para calculadora de precios por variante
  const [calculadoraVarianteOpen, setCalculadoraVarianteOpen] = useState(false)
  const [varianteCalculadora, setVarianteCalculadora] = useState<any>(null)
  const defaultPriceRowsVariante = [
    { id: 1, campo: "Coste", porcentaje: null, valor: 0, editable: false, porcentajeConfig: null },
    { id: 2, campo: "Precio", porcentaje: null, valor: 0, editable: true, porcentajeConfig: null },
    { id: 3, campo: "Factura", porcentaje: 16, valor: 0, editable: true, porcentajeConfig: 16 },
    { id: 4, campo: "IUE", porcentaje: 2, valor: 0, editable: true, porcentajeConfig: 2 },
    { id: 5, campo: "Costos totales", porcentaje: null, valor: 0, editable: false, porcentajeConfig: null },
    { id: 6, campo: "Utilidad bruta", porcentaje: null, valor: 0, editable: false, porcentajeConfig: null },
    { id: 7, campo: "Comision", porcentaje: 12, valor: 0, editable: true, porcentajeConfig: 12 },
    { id: 8, campo: "Utilidad neta", porcentaje: null, valor: 0, editable: false, porcentajeConfig: null }
  ]
  const [priceRowsVariante, setPriceRowsVariante] = useState(defaultPriceRowsVariante)
  const [isApplyingPriceVariante, setIsApplyingPriceVariante] = useState(false)
  const [priceAppliedVariante, setPriceAppliedVariante] = useState(false)
  
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
          mostrar_en_web: data.mostrar_en_web ?? false
        })
        // NOTA: Las variantes ahora se construyen desde los recursos activos en la receta (costRows)
        // después de que se carguen los costRows. Esto asegura que solo se usen variantes de recursos activos.
        // Inicializar variantes vacías por ahora, se actualizarán cuando se carguen los costRows
        setVariantes([])
        
        // Cargar variantes del producto desde la BD
        setTimeout(() => {
          getVariantes()
        }, 1000)
        
        // Cargar calculadora de precios desde el producto
        // Priorizar calculadora_precios (nuevo formato), luego calculadora_de_precios (formato antiguo)
        const calculadoraData = data.calculadora_precios || data.calculadora_de_precios
        if (calculadoraData) {
          try {
            const calcData = typeof calculadoraData === 'string' 
              ? JSON.parse(calculadoraData) 
              : calculadoraData
            
            if (calcData.priceRows && Array.isArray(calcData.priceRows)) {
              // Mapear filas cargadas a la estructura estática
              const loadedRows = defaultPriceRows.map(defaultRow => {
                // Manejar compatibilidad: "Fact" antiguo -> "Factura"
                let loadedRow = calcData.priceRows.find((r: any) => r.campo === defaultRow.campo)
                if (!loadedRow && defaultRow.campo === "Factura") {
                  loadedRow = calcData.priceRows.find((r: any) => r.campo === "Fact")
                }
                
                if (loadedRow) {
                  const result = {
                    ...defaultRow,
                    porcentaje: loadedRow.porcentaje ?? defaultRow.porcentaje,
                    valor: parseNum(loadedRow.valor ?? 0)
                  }
                  // Si tiene porcentajeConfig, mantenerlo
                  if (loadedRow.porcentajeConfig !== undefined) {
                    (result as any).porcentajeConfig = loadedRow.porcentajeConfig
                  } else if (["Factura", "IUE", "Comision"].includes(defaultRow.campo)) {
                    // Si no tiene porcentajeConfig pero es un campo editable, usar el porcentaje como config
                    (result as any).porcentajeConfig = loadedRow.porcentaje ?? defaultRow.porcentaje
                  }
                  return result
                }
                return defaultRow
              })
              
              setPriceRows(loadedRows)
              
              // Si hay un precio, recalcular todo
              const precioRow = loadedRows.find((r: any) => r.campo === "Precio")
              if (precioRow && precioRow.valor > 0) {
                setTimeout(() => {
                  setPriceRows(prev => recalcFromTargetPrice(precioRow.valor, prev))
                }, 100)
              }
            }
          } catch (e) {
            console.error('Error cargando calculadora de precios:', e)
          }
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
        // IMPORTANTE: Solo cargar recursos, NO proveedores
        // La receta puede venir como array o como objeto con items (compatibilidad)
        let recetaArray: any[] = []
        if (data.receta) {
          if (Array.isArray(data.receta)) {
            // Formato correcto: array directo
            recetaArray = data.receta
          } else if (typeof data.receta === 'object' && data.receta.items && Array.isArray(data.receta.items)) {
            // Formato antiguo: objeto con items (compatibilidad)
            console.warn('⚠️ Receta en formato antiguo (objeto), convirtiendo a array')
            recetaArray = data.receta.items
          }
        }
        
        if (recetaArray.length > 0) {
          console.log('📋 Cargando receta con', recetaArray.length, 'items')
          // Primero obtener los recursos completos desde la API
          const recursosResponse = await fetch('/api/recursos')
          if (recursosResponse.ok) {
            const recursosResult = await recursosResponse.json()
            const todosLosRecursos = recursosResult.data || []
            
            // Filtrar solo items que sean recursos (tienen recurso_id, no son proveedores)
            const itemsReceta = recetaArray.filter((item: any) => 
              item.recurso_id && !item.empresa // Excluir proveedores (que tienen empresa)
            )
            
            // Mapear la receta a costRows con los recursos completos
            let maxId = 0
            const recetaRows = itemsReceta.map((item: any, index: number) => {
              // Buscar el recurso completo por ID o código
              let recursoFromApi = todosLosRecursos.find((r: any) => 
                r.id === item.recurso_id || (r.codigo || r.id) === item.recurso_codigo
              )
              
              // MERGE REAL COMPLETO:
              // - Si no existe en API: crear recurso mínimo con datos de la receta
              // - Si existe pero coste es null/undefined: usar coste_unitario de la receta
              // - SIEMPRE garantizar que coste sea un número válido
              let recursoCompleto: any
              
              if (!recursoFromApi) {
                // Recurso no existe en API - usar datos guardados en receta
                console.warn(`⚠️ El recurso ${item.recurso_id} no existe en /api/recursos. Usando copia local.`)
                recursoCompleto = {
                  id: item.recurso_id,
                  codigo: item.recurso_codigo || item.recurso_id,
                  nombre: item.recurso_nombre || "",
                  unidad_medida: item.unidad || "",
                  coste: Number(item.coste_unitario) || 0,
                  variantes: []
                }
              } else {
                // Recurso existe en API - hacer merge con datos de receta como fallback
                const costeApi = recursoFromApi.coste
                const costeReceta = item.coste_unitario
                // Usar coste de API si es válido, sino usar coste guardado en receta
                const costeFinal = (typeof costeApi === 'number' && !isNaN(costeApi)) 
                  ? costeApi 
                  : (Number(costeReceta) || 0)
                
                recursoCompleto = {
                  ...recursoFromApi,
                  coste: costeFinal // Garantizar que coste siempre sea número válido
                }
              }
              
              const newId = index + 1
              maxId = Math.max(maxId, newId)
              
              return {
                id: newId,
                selectedRecurso: recursoCompleto,
                cantidad: item.cantidad || 1,
                unidad: item.unidad || recursoCompleto.unidad_medida || "",
                searchTerm: item.recurso_nombre || recursoCompleto.nombre || ""
              }
            })
            
            // Actualizar el contador de IDs para evitar duplicados
            if (recetaRows.length > 0) {
              costRowIdCounterRef.current = maxId + 1
              setCostRows(recetaRows)
              console.log('✅ Receta cargada en calculadora de costes:', recetaRows.length, 'filas')
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
          } else {
            console.error('❌ Error cargando recursos para restaurar receta')
            // Inicializar con fila vacía si no se pueden cargar los recursos
            setCostRows([{
              id: 1,
              selectedRecurso: null,
              cantidad: 1,
              unidad: "",
              searchTerm: ""
            }])
          }
        } else {
          // Si no hay receta, inicializar con una fila vacía
          console.log('📋 No hay receta guardada, inicializando calculadora vacía')
          setCostRows([{
            id: 1,
            selectedRecurso: null,
            cantidad: 1,
            unidad: "",
            searchTerm: ""
          }])
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

    // Limpiar error anterior
    setImageError("")

    if (file.size > 5 * 1024 * 1024) {
      const errorMsg = "La imagen no puede superar los 5MB"
      setImageError(errorMsg)
      e.target.value = ''
      return
    }

    if (!file.type.startsWith('image/')) {
      const errorMsg = "El archivo debe ser una imagen (JPG, PNG, GIF)"
      setImageError(errorMsg)
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

  // Handlers para variantes del producto
  const handleVarianteFieldChange = (varianteId: string, field: 'coste_override' | 'precio_override', value: string) => {
    setEditingVariante(prev => ({
      ...prev,
      [varianteId]: {
        ...prev[varianteId],
        [field]: value === '' ? null : parseFloat(value) || 0
      }
    }))
  }

  const handleSaveVariante = async (varianteId: string) => {
    const cambios = editingVariante[varianteId]
    if (!cambios) return

    const success = await saveVariante(varianteId, cambios)
    if (success) {
      setEditingVariante(prev => {
        const newState = { ...prev }
        delete newState[varianteId]
        return newState
      })
    }
  }

  const handleResetVariante = async (varianteId: string) => {
    const success = await resetVariante(varianteId)
    if (success) {
      setEditingVariante(prev => {
        const newState = { ...prev }
        delete newState[varianteId]
        return newState
      })
    }
  }

  // Función de cálculo para calculadora de variantes (idéntica a la del producto)
  const recalcFromTargetPriceVariante = (precioObjetivo: number, rowsIn: typeof priceRowsVariante) => {
    const rows = JSON.parse(JSON.stringify(rowsIn))
    const coste = parseNum(rows.find(r => r.campo === "Coste")?.valor ?? 0)

    // Obtener porcentajes configurables
    const facturaRow = rows.find(r => r.campo === "Factura")
    const iueRow = rows.find(r => r.campo === "IUE")
    const comisionRow = rows.find(r => r.campo === "Comision")
    
    const facturaPctConfig = parseNum(facturaRow?.porcentajeConfig ?? facturaRow?.porcentaje ?? 16)
    const iuePctConfig = parseNum(iueRow?.porcentajeConfig ?? iueRow?.porcentaje ?? 2)
    const comPctConfig = parseNum(comisionRow?.porcentajeConfig ?? comisionRow?.porcentaje ?? 12)

    const facturaPct = facturaPctConfig / 100
    const iuePct = iuePctConfig / 100

    const facturaVal = round2(precioObjetivo * facturaPct)
    const iueVal = round2(precioObjetivo * iuePct)

    const costosTotales = round2(coste + facturaVal + iueVal)
    const utilidadBruta = round2(precioObjetivo - costosTotales)
    const comPct = comPctConfig / 100
    const comisionVal = round2(utilidadBruta * comPct)
    const utilidadNeta = round2(utilidadBruta - comisionVal)

    // Calcular porcentajes sobre el precio para mostrar en la columna %
    const costePct = precioObjetivo > 0 ? round2((coste / precioObjetivo) * 100) : 0
    const facturaPctSobrePrecio = precioObjetivo > 0 ? round2((facturaVal / precioObjetivo) * 100) : 0
    const iuePctSobrePrecio = precioObjetivo > 0 ? round2((iueVal / precioObjetivo) * 100) : 0
    const costosTotalesPct = precioObjetivo > 0 ? round2((costosTotales / precioObjetivo) * 100) : 0
    const utilidadBrutaPct = precioObjetivo > 0 ? round2((utilidadBruta / precioObjetivo) * 100) : 0
    const comisionPctSobrePrecio = precioObjetivo > 0 ? round2((comisionVal / precioObjetivo) * 100) : 0
    const utilidadNetaPct = precioObjetivo > 0 ? round2((utilidadNeta / precioObjetivo) * 100) : 0

    rows.forEach(r => {
      if (r.campo === "Coste") {
        r.porcentaje = costePct
      }
      if (r.campo === "Precio") {
        r.valor = precioObjetivo
      }
      if (r.campo === "Factura") {
        r.valor = facturaVal
        r.porcentaje = facturaPctSobrePrecio
        r.porcentajeConfig = facturaPctConfig
      }
      if (r.campo === "IUE") {
        r.valor = iueVal
        r.porcentaje = iuePctSobrePrecio
        r.porcentajeConfig = iuePctConfig
      }
      if (r.campo === "Costos totales") {
        r.valor = costosTotales
        r.porcentaje = costosTotalesPct
      }
      if (r.campo === "Utilidad bruta") {
        r.valor = utilidadBruta
        r.porcentaje = utilidadBrutaPct
      }
      if (r.campo === "Comision") {
        r.valor = comisionVal
        r.porcentaje = comisionPctSobrePrecio
        r.porcentajeConfig = comPctConfig
      }
      if (r.campo === "Utilidad neta") {
        r.valor = utilidadNeta
        r.porcentaje = utilidadNetaPct
      }
    })

    return rows
  }

  // Funciones para calculadora de precios por variante
  const openCalculadoraVariante = (variante: any) => {
    setVarianteCalculadora(variante)
    
    // Inicializar calculadora con coste de la variante
    const costeVariante = getCosteFinal(variante)
    
    // Inicializar con estructura estática
    let rowsIniciales = JSON.parse(JSON.stringify(defaultPriceRowsVariante))
    
    // Establecer el coste
    const costeRow = rowsIniciales.find((r: any) => r.campo === "Coste")
    if (costeRow) {
      costeRow.valor = costeVariante
    }
    
    // Si hay precio_variante guardada, cargarla
    if (variante.precio_variante) {
      try {
        const calc = typeof variante.precio_variante === 'string' 
          ? JSON.parse(variante.precio_variante)
          : variante.precio_variante
        
        if (calc.priceRows && Array.isArray(calc.priceRows)) {
          // Mapear las filas guardadas a la estructura estática
          rowsIniciales = rowsIniciales.map((defaultRow: any) => {
            const savedRow = calc.priceRows.find((sr: any) => sr.campo === defaultRow.campo)
            if (savedRow) {
              return {
                ...defaultRow,
                valor: savedRow.valor ?? defaultRow.valor,
                porcentaje: savedRow.porcentaje ?? defaultRow.porcentaje,
                porcentajeConfig: savedRow.porcentajeConfig ?? defaultRow.porcentajeConfig
              }
            }
            return defaultRow
          })
          
          // Asegurar que el coste sea el actual
          const costeRow = rowsIniciales.find((r: any) => r.campo === "Coste")
          if (costeRow) {
            costeRow.valor = costeVariante
          }
          
          // Si hay precio guardado, recalcular todo
          const precioRow = rowsIniciales.find((r: any) => r.campo === "Precio")
          if (precioRow && precioRow.valor > 0) {
            rowsIniciales = recalcFromTargetPriceVariante(precioRow.valor, rowsIniciales)
          }
        }
      } catch (e) {
        console.error('Error parseando precio_variante:', e)
      }
    }
    
    setPriceRowsVariante(rowsIniciales)
    setCalculadoraVarianteOpen(true)
  }


  // Actualizar coste de la variante cuando cambia el coste final
  useEffect(() => {
    if (calculadoraVarianteOpen && varianteCalculadora) {
      const costeVariante = getCosteFinal(varianteCalculadora)
      setPriceRowsVariante(prev => {
        const updated = prev.map(row => 
          row.campo === "Coste" ? { ...row, valor: costeVariante } : row
        )
        const precio = parseNum(updated.find((r: any) => r.campo === "Precio")?.valor ?? 0)
        if (precio > 0) {
          return recalcFromTargetPriceVariante(precio, updated)
        }
        return updated
      })
    }
  }, [calculadoraVarianteOpen, varianteCalculadora, costRows, recursos])

  // Handlers para calculadora de variante
  const handlePricePorcentajeChangeVariante = (rowId: number, pctStr: string) => {
    setPriceRowsVariante(prev => {
      const rowsCopy = JSON.parse(JSON.stringify(prev))
      const row = rowsCopy.find((r: any) => r.id === rowId)
      if (!row || !row.editable) return prev

      if (pctStr === "") {
        row.porcentaje = null
        row.porcentajeConfig = null
        // Si porcentaje se borra, recalcular desde precio actual
        const precioActual = parseNum(rowsCopy.find((r: any) => r.campo === "Precio")?.valor ?? 0)
        if (precioActual > 0) {
          return recalcFromTargetPriceVariante(precioActual, rowsCopy)
        }
        return rowsCopy
      }

      const pct = parseNum(pctStr)
      
      if (["Factura", "IUE", "Comision"].includes(row.campo)) {
        row.porcentajeConfig = pct
        const precioActual = parseNum(rowsCopy.find((r: any) => r.campo === "Precio")?.valor ?? 0)
        if (precioActual > 0) {
          return recalcFromTargetPriceVariante(precioActual, rowsCopy)
        }
      } else {
        row.porcentaje = pct
      }

      return rowsCopy
    })
  }

  const handlePriceValorChangeVariante = (rowId: number, valStr: string) => {
    setPriceRowsVariante(prev => {
      const rowsCopy = JSON.parse(JSON.stringify(prev))
      const row = rowsCopy.find((r: any) => r.id === rowId)
      if (!row || !row.editable) return prev

      if (valStr === "") {
        row.valor = 0
        // Si valor se borra, recalcular desde precio actual
        const precioActual = parseNum(rowsCopy.find((r: any) => r.campo === "Precio")?.valor ?? 0)
        if (precioActual > 0) {
          return recalcFromTargetPriceVariante(precioActual, rowsCopy)
        }
        return rowsCopy
      }

      const val = parseNum(valStr)
      
      if (row.campo === "Precio") {
        return recalcFromTargetPriceVariante(val, rowsCopy)
      }

      return rowsCopy
    })
  }

  const handleApplyPriceVariante = async () => {
    setIsApplyingPriceVariante(true)
    setPriceAppliedVariante(false)
    
    try {
      if (!varianteCalculadora) {
        toast.error("No hay variante seleccionada")
        setIsApplyingPriceVariante(false)
        return
      }
      
      if (!id || id === 'nuevo' || id === 'new') {
        toast.error("El producto debe estar guardado primero")
        setIsApplyingPriceVariante(false)
        return
      }
      
      const precioRow = priceRowsVariante.find(r => r.campo === "Precio")
      const priceValue = parseNum(precioRow?.valor ?? 0)
      
      if (priceValue <= 0) {
        toast.error("El precio debe ser mayor a 0")
        setIsApplyingPriceVariante(false)
        return
      }

      // Preparar calculadora de precios para guardar
      const calculadoraDePrecios = {
        priceRows: priceRowsVariante,
        totalPrice: priceValue
      }

      console.log('💾 Guardando calculadora de precios variante:', {
        variante_id: varianteCalculadora.id,
        producto_id: id,
        calculadora: calculadoraDePrecios
      })

      // Guardar en precio_variante y también el precio_override
      const response = await fetch('/api/productos/variantes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variante_id: varianteCalculadora.id,
          producto_id: id,
          precio_variante: calculadoraDePrecios,
          precio_override: priceValue // Guardar también el precio final
        })
      })

      if (!response.ok) {
        const result = await response.json().catch(() => ({}))
        const errorMessage = result.error || result.message || 'Error al guardar la calculadora de precios'
        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log('📥 Respuesta de la API:', result)

      if (result.success) {
        setPriceAppliedVariante(true)
        toast.success(`Precio variante guardado: Bs ${priceValue.toFixed(2)}`)
        await getVariantes()
        
        // Resetear animación después de 1.8 segundos
        setTimeout(() => setPriceAppliedVariante(false), 1800)
      } else {
        const errorMessage = result.error || result.message || 'Error al guardar la calculadora de precios'
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error('❌ Error guardando calculadora de precios:', error)
      toast.error(error instanceof Error ? error.message : 'Error de conexión')
    } finally {
      setIsApplyingPriceVariante(false)
    }
  }

  // Limpiar nombre de variante eliminando duplicaciones
  const limpiarNombreVariante = (nombre: string): string => {
    if (!nombre) return nombre
    
    const nombreTrim = nombre.trim()
    
    // Caso 1: Detectar duplicación completa
    // Ejemplo: "Instalación en valla Instalación en valla" -> "Instalación en valla"
    const palabras = nombreTrim.split(/\s+/)
    if (palabras.length >= 2) {
      // Intentar dividir en dos mitades desde diferentes puntos
      for (let i = Math.floor(palabras.length / 2); i < palabras.length; i++) {
        const primeraParte = palabras.slice(0, i).join(' ')
        const segundaParte = palabras.slice(i).join(' ')
        if (primeraParte === segundaParte && primeraParte.length > 0) {
          return primeraParte
        }
      }
    }
    
    // Caso 2: Detectar patrones como "Grosor Lona frontligth" -> "Grosor"
    // Buscar tipos de variantes comunes al inicio
    const tiposVariantes = [
      'Grosor', 'Color', 'Tamaño', 'Material', 'Acabado', 
      'Instalación', 'Desinstalación', 'Montaje', 'Desmontaje',
      'Ancho', 'Alto', 'Espesor', 'Peso', 'Formato'
    ]
    
    for (const tipo of tiposVariantes) {
      // Verificar si el nombre empieza exactamente con el tipo
      if (nombreTrim === tipo) {
        return tipo
      }
      
      // Verificar si empieza con el tipo seguido de espacio
      if (nombreTrim.startsWith(tipo + ' ')) {
        const resto = nombreTrim.substring(tipo.length).trim()
        
        // Si el resto tiene 2 o más palabras, probablemente es información del recurso
        // Ejemplo: "Lona frontligth" -> devolver solo "Grosor"
        const palabrasResto = resto.split(/\s+/)
        if (palabrasResto.length >= 2) {
          return tipo
        }
        
        // Si el resto es una sola palabra, podría ser parte del nombre de la variante
        // Ejemplo: "Color Blanco" -> mantener "Color Blanco"
        // Pero si es algo como "Color Lona", probablemente es "Color"
        // Por ahora, si hay más de una palabra después del tipo, devolver solo el tipo
        return tipo
      }
    }
    
    // Si no se encontró patrón, devolver el nombre original
    return nombreTrim
  }

  // Formatear combinación para mostrar
  const formatearCombinacion = (combinacion: string): string => {
    const valores = parsearClaveVariante(combinacion)
    return Object.entries(valores)
      .map(([nombre, valor]) => {
        const nombreLimpio = limpiarNombreVariante(nombre)
        return `${nombreLimpio}: ${valor}`
      })
      .join(' | ')
  }

  // Obtener coste final (override o calculado desde control de stock)
  const getCosteFinal = (variante: any): number => {
    if (!variante) {
      console.log('⚠️ getCosteFinal: variante es null/undefined')
      return 0
    }
    
    // Si hay override, usar ese (tiene máxima prioridad)
    if (variante.coste_override !== null && variante.coste_override !== undefined) {
      console.log(`💵 Coste override: ${variante.coste_override}`)
      return variante.coste_override
    }
    
    // PRIORIDAD: Calcular coste desde control de stock usando la receta completa
    // Esto asegura que siempre se use el coste real:
    // - Para recursos SIN variantes → coste base
    // - Para recursos CON variantes → precio desde control_stock
    if (variante.combinacion && recursos.length > 0 && costRows.length > 0) {
      try {
        const valoresCombinacion = parsearClaveVariante(variante.combinacion)
        const sucursal = valoresCombinacion.Sucursal || valoresCombinacion.sucursal
        
        console.log(`🔍 Calculando coste para variante:`, {
          combinacion: variante.combinacion,
          valoresCombinacion,
          sucursal
        })
        
        // Construir receta desde costRows (la receta actual del producto)
        const receta = costRows
          .filter(row => row.selectedRecurso && row.selectedRecurso.id)
          .map(row => ({
            recurso_id: row.selectedRecurso.id,
            recurso_codigo: row.selectedRecurso.codigo || row.selectedRecurso.id,
            recurso_nombre: row.selectedRecurso.nombre,
            cantidad: row.cantidad,
            unidad: row.unidad
          }))
        
        if (receta.length > 0) {
          console.log(`📋 Receta construida:`, receta)
          console.log(`📦 Recursos disponibles: ${recursos.length}`)
          
          // Calcular coste desde control de stock
          // Esta función itera sobre cada recurso de la receta y:
          // - Si el recurso tiene variantes → busca el precio en control_stock
          // - Si no tiene variantes → usa su coste base
          const costeDesdeControlStock = calcularCosteVariante(
            receta,
            recursos,
            valoresCombinacion,
            sucursal || undefined
          )
          
          console.log(`💰 Coste calculado desde control_stock: ${costeDesdeControlStock}`)
          
          // Usar el coste calculado (incluso si es 0, es válido)
          return costeDesdeControlStock
        } else {
          console.log('⚠️ No hay receta válida para calcular coste')
        }
      } catch (error) {
        console.error('❌ Error calculando coste desde control de stock:', error)
        // Continuar con fallback si hay error
      }
    } else {
      console.log('⚠️ No se puede calcular coste:', {
        tieneCombinacion: !!variante.combinacion,
        recursosLength: recursos.length,
        costRowsLength: costRows.length
      })
    }
    
    // Fallback a coste calculado o base (solo si no se pudo calcular desde receta)
    const fallback = variante.coste_base || variante.coste_calculado || 0
    console.log(`📊 Usando fallback: ${fallback}`)
    return fallback
  }

  // Obtener precio final (override o calculado)
  const getPrecioFinal = (variante: any): number => {
    if (!variante) return 0
    return variante.precio_override !== null && variante.precio_override !== undefined
      ? variante.precio_override
      : variante.precio_base || variante.precio_calculado || 0
  }

  // Funciones helper para calculadora de precios (definidas antes de handleSave)
  const parseNum = (v: number | string) => {
    if (typeof v === "number") return v
    const s = (v ?? "").toString().replace(",", ".").replace(/^0+(?=\d)/, "")
    const n = parseFloat(s)
    return isFinite(n) ? n : 0
  }

  const handleSave = async () => {
    if (!formData.codigo || !formData.nombre) {
      toast.error("Código y nombre son requeridos")
      return
    }

    setSaving(true)
    
    try {
      // Construir receta (lista de recursos seleccionados en la calculadora de costes)
      // IMPORTANTE: Solo incluir recursos, NO proveedores
      const receta = costRows
        .filter(row => row.selectedRecurso && row.selectedRecurso.id) // Solo recursos válidos
        .map(row => {
          const coste = row.selectedRecurso.coste || 0
          const cantidad = row.cantidad || 0
          return {
            recurso_id: row.selectedRecurso.id,
            recurso_codigo: row.selectedRecurso.codigo || row.selectedRecurso.id,
            recurso_nombre: row.selectedRecurso.nombre,
            cantidad: cantidad,
            unidad: row.unidad,
            coste_unitario: coste,
            coste_total: coste * cantidad
          }
        })
        .filter(item => item.recurso_id) // Asegurar que solo hay recursos, no proveedores

      // Detectar si existe receta válida (rows con recurso asignado)
      const tieneReceta = receta && receta.length > 0

      // Calcular el coste real que se debe guardar
      // Si hay receta, usar totalCost (coste calculado desde la receta)
      // Si no hay receta, usar el coste manual del formulario
      // IMPORTANTE: Asegurar que nunca sea NaN, null o undefined
      let costeCalculado = tieneReceta ? totalCost : (parseFloat(formData.coste) || 0)
      // Validar que costeCalculado sea un número válido
      if (isNaN(costeCalculado) || !isFinite(costeCalculado) || costeCalculado < 0) {
        costeCalculado = 0
      }
      // Redondear a 2 decimales
      costeCalculado = Math.round(costeCalculado * 100) / 100

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
          } else if (imagenMeta?.publicUrl) {
            toast.success("Imagen subida a Supabase Storage correctamente", { id: 'upload-image' })
          } else if (imagenMeta?.attachmentId) {
            toast.success("Imagen subida correctamente", { id: 'upload-image' })
          } else {
            toast.success("Imagen subida correctamente", { id: 'upload-image' })
          }
          // Limpiar error al subir correctamente
          setImageError("")
        } catch (error) {
          console.error("❌ [FRONTEND] Error subiendo Imagen Principal:", error)
          const errorMsg = error instanceof Error ? error.message : "Error subiendo la imagen"
          setImageError(errorMsg)
          toast.error(errorMsg, { id: 'upload-image' })
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

      // Función auxiliar para sanitizar números
      const sanitizeNumber = (value: any): number | null => {
        if (value === null || value === undefined || value === '') return null
        const num = typeof value === 'string' ? parseFloat(value) : Number(value)
        if (isNaN(num) || !isFinite(num) || num < 0) return 0
        return Math.round(num * 100) / 100
      }

      // Función auxiliar para sanitizar strings
      // FIX 1: Filtrar valores "-", "–", "—" y strings vacíos
      const sanitizeString = (value: any): string | null => {
        if (value === null || value === undefined) return null
        const str = String(value).trim()
        // Filtrar strings vacíos, guiones y em-dash
        if (str === '' || str === '-' || str === '–' || str === '—') return null
        return str
      }

      // Preparar receta como ARRAY (formato que espera la API)
      // La receta debe ser un array de items, NO un objeto
      const recetaArray = receta.map(item => ({
        recurso_id: item.recurso_id || null,
        recurso_codigo: sanitizeString(item.recurso_codigo),
        recurso_nombre: sanitizeString(item.recurso_nombre),
        cantidad: sanitizeNumber(item.cantidad) || 0,
        unidad: sanitizeString(item.unidad),
        coste_unitario: sanitizeNumber(item.coste_unitario),
        coste_total: sanitizeNumber(item.coste_total)
      })).filter(item => item.recurso_id !== null) // Solo items con recurso válido

      // Preparar calculadora de precios UFC
      const precioFinal = parseNum(priceRows.find(r => r.campo === "Precio")?.valor ?? 0)
      const precioFinalValidado = sanitizeNumber(precioFinal) || 0
      
      // Sanitizar priceRows: eliminar valores "–" o strings no numéricos
      const priceRowsSanitizados = priceRows.map((row: any) => {
        const rowCopy: any = { ...row }
        // Sanitizar valor
        if (rowCopy.valor !== undefined && rowCopy.valor !== null) {
          if (typeof rowCopy.valor === 'string' && (rowCopy.valor === '–' || rowCopy.valor === '-' || rowCopy.valor.trim() === '')) {
            rowCopy.valor = 0
          } else {
            const valNum = sanitizeNumber(rowCopy.valor)
            rowCopy.valor = valNum !== null ? valNum : 0
          }
        }
        // Sanitizar porcentaje
        if (rowCopy.porcentaje !== undefined && rowCopy.porcentaje !== null) {
          if (typeof rowCopy.porcentaje === 'string' && (rowCopy.porcentaje === '–' || rowCopy.porcentaje === '-' || rowCopy.porcentaje.trim() === '')) {
            rowCopy.porcentaje = null
          } else {
            const pctNum = sanitizeNumber(rowCopy.porcentaje)
            rowCopy.porcentaje = pctNum !== null ? pctNum : null
          }
        }
        // Sanitizar porcentajeConfig
        if (rowCopy.porcentajeConfig !== undefined && rowCopy.porcentajeConfig !== null) {
          if (typeof rowCopy.porcentajeConfig === 'string' && (rowCopy.porcentajeConfig === '–' || rowCopy.porcentajeConfig === '-' || rowCopy.porcentajeConfig.trim() === '')) {
            rowCopy.porcentajeConfig = null
          } else {
            const pctConfigNum = sanitizeNumber(rowCopy.porcentajeConfig)
            rowCopy.porcentajeConfig = pctConfigNum !== null ? pctConfigNum : null
          }
        }
        return rowCopy
      })
      
      const calculadoraPrecios = {
        priceRows: priceRowsSanitizados,
        totalPrice: precioFinalValidado,
        objetivoUtilidadReal: null
      }
      
      // Preparar variantes (singular "variante" según el esquema)
      const varianteLimpia = variantes.length > 0 ? variantes.map(v => {
        const { recurso_id, recurso_nombre, ...varianteSinTracking } = v
        return varianteSinTracking
      }) : []
      
      // Preparar proveedores sanitizados
      const proveedoresSanitizados = proveedores.length > 0 ? proveedores.map(prov => ({
        empresa: sanitizeString(prov.empresa) || "",
        precio: sanitizeNumber(prov.precio) || 0,
        unidad: sanitizeString(prov.unidad) || "",
        plazos: sanitizeString(prov.plazos) || "",
        comentarios: sanitizeString(prov.comentarios) || ""
      })) : []
      
      // Preparar imagen_principal (según el esquema real)
      let imagenPrincipal: string | null = null
      if (imagenMeta?.publicUrl) {
        imagenPrincipal = imagenMeta.publicUrl
      } else if (cleanedImagenUrl) {
        imagenPrincipal = cleanedImagenUrl
      } else if (existingImagenUrl && !isNewProduct) {
        imagenPrincipal = existingImagenUrl
      }
      
      // Construir dataToSend según el esquema REAL de Supabase
      const dataToSend: Record<string, any> = {
        codigo: sanitizeString(formData.codigo) || "",
        nombre: sanitizeString(formData.nombre) || "",
        imagen_principal: imagenPrincipal,
        categoria: sanitizeString(formData.categoria),
        unidad_medida: sanitizeString(formData.unidad_medida),
        coste: sanitizeNumber(costeCalculado),
        precio_venta: sanitizeNumber(formData.precio_venta) || 0,
        responsable: sanitizeString(formData.responsable),
        descripcion: sanitizeString(formData.descripcion),
        mostrar_en_web: Boolean(formData.mostrar_en_web),
        variante: varianteLimpia.length > 0 ? varianteLimpia : null,
        receta: Array.isArray(recetaArray) ? recetaArray : [], // FIX 2: Receta SIEMPRE es array, nunca null
        calculadora_precios: calculadoraPrecios,
        proveedores: proveedoresSanitizados.length > 0 ? proveedoresSanitizados : null
      }
      
      // Limpiar campos null/undefined que no deben enviarse
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] === undefined) {
          delete dataToSend[key]
        }
      })

      console.log("💾 Guardando producto:", {
        id,
        isNewProduct,
        variantesCount: variantes.length,
        recetaCount: receta.length,
        imagen_principal: dataToSend.imagen_principal,
        variante: dataToSend.variante,
        receta: dataToSend.receta,
        calculadora_precios: dataToSend.calculadora_precios,
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
        
        // Si es un producto nuevo, actualizar el ID para que el hook funcione correctamente
        if (isNewProduct && updated.id) {
          // Actualizar el router para que el hook tenga el ID correcto
          router.replace(`/panel/inventario/${updated.id}`)
        }
        
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
        
        // Verificar si se guardaron las variantes y receta (pero no es crítico si no existen en Airtable)
        if ((variantes.length > 0 && !updated.variantes) || (receta.length > 0 && !updated.receta)) {
          console.warn("⚠️ ADVERTENCIA: Las variantes o receta no se guardaron (puede que los campos no existan en Airtable)")
          // No mostrar warning al usuario, el producto se guardó correctamente
        }
        
        // FIX 6: Validar receta antes de regenerar variantes
        // Regenerar variantes después de guardar
        // IMPORTANTE: Construir variantes SOLO desde los recursos activos en costRows (receta)
        // NO usar el estado 'variantes' que puede contener variantes de recursos eliminados
        if (updated.id) {
          // Validar que hay receta válida antes de regenerar
          const tieneRecetaValida = recetaArray.length > 0 && recetaArray.some(item => item.recurso_id)
          
          if (!tieneRecetaValida) {
            console.warn('⚠️ Receta vacía: no se regeneran variantes')
            // Si no hay receta válida, eliminar todas las variantes
            try {
              await fetch(`/api/productos/variantes`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  producto_id: updated.id,
                  action: 'regenerar',
                  variantes_definicion: []
                })
              })
              console.log('✅ Variantes eliminadas (no hay receta válida)')
            } catch (error) {
              console.error('Error eliminando variantes:', error)
            }
            // No continuar con la regeneración
          } else {
            try {
              // Construir variantes desde los recursos activos en la receta (costRows)
              const variantesDeRecursosActivos: any[] = []
              costRows.forEach(row => {
              if (row.selectedRecurso?.id && row.selectedRecurso?.variantes) {
                let variantesArray: any[] = []
                
                if (Array.isArray(row.selectedRecurso.variantes)) {
                  variantesArray = row.selectedRecurso.variantes
                } else if (typeof row.selectedRecurso.variantes === 'object' && row.selectedRecurso.variantes.variantes) {
                  if (Array.isArray(row.selectedRecurso.variantes.variantes)) {
                    variantesArray = row.selectedRecurso.variantes.variantes
                  }
                } else if (typeof row.selectedRecurso.variantes === 'string') {
                  try {
                    const parsed = JSON.parse(row.selectedRecurso.variantes)
                    if (Array.isArray(parsed)) {
                      variantesArray = parsed
                    } else if (parsed && parsed.variantes && Array.isArray(parsed.variantes)) {
                      variantesArray = parsed.variantes
                    }
                  } catch (e) {
                    console.error('Error parseando variantes del recurso:', e)
                  }
                }
                
                // Agregar variantes con el recurso_id para tracking
                variantesArray.forEach((v: any) => {
                  variantesDeRecursosActivos.push({
                    ...v,
                    recurso_id: row.selectedRecurso.id,
                    recurso_nombre: row.selectedRecurso.nombre
                  })
                })
              }
            })
            
            // Convertir variantes al formato correcto que espera el backend
            const variantesLimpias = variantesDeRecursosActivos.map(v => ({
              nombre: v.nombre,
              valores: v.posibilidades ?? v.valores ?? []
            }))
            
            console.log(">>> Variantes construidas desde recursos activos:", variantesLimpias)
            console.log(">>> Recursos activos en receta:", costRows.filter(r => r.selectedRecurso?.id).map(r => r.selectedRecurso?.nombre))
            
            // Llamar directamente a la API con el ID actualizado
            const regenerarResponse = await fetch(`/api/productos/variantes`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                producto_id: updated.id,
                action: 'regenerar',
                variantes_definicion: variantesLimpias
              })
            })
            
            const responseText = await regenerarResponse.text()
            console.log('>>> Respuesta del API (raw):', responseText)
            
            if (regenerarResponse.ok) {
              try {
                const regenerarData = JSON.parse(responseText)
                console.log('✅ Variantes regeneradas correctamente:', regenerarData)
                
                // Actualizar el estado de variantes con las variantes de los recursos activos
                setVariantes(variantesDeRecursosActivos)
                
                const variantesCreadas = regenerarData.variantes?.length || 0
                const variantesEliminadas = regenerarData.variantes_eliminadas || 0
                
                if (variantesEliminadas > 0) {
                  toast.success(`Variantes regeneradas: ${variantesCreadas} creadas, ${variantesEliminadas} eliminadas`)
                } else {
                  toast.success(`Variantes generadas correctamente (${variantesCreadas} variantes)`)
                }
                
                // Recargar variantes después de regenerar
                setTimeout(() => {
                  getVariantes()
                }, 500)
              } catch (parseError) {
                console.error('Error parseando respuesta:', parseError)
                toast.warning('Producto guardado, pero no se pudo parsear la respuesta de variantes')
              }
            } else {
              try {
                const errorData = JSON.parse(responseText)
                console.error('❌ Error regenerando variantes:', {
                  status: regenerarResponse.status,
                  statusText: regenerarResponse.statusText,
                  error: errorData.error,
                  details: errorData.details
                })
                toast.error(`Error al generar variantes: ${errorData.error || 'Error desconocido'}`)
              } catch (parseError) {
                console.error('❌ Error regenerando variantes (sin parsear):', {
                  status: regenerarResponse.status,
                  statusText: regenerarResponse.statusText,
                  responseText: responseText.substring(0, 200)
                })
                toast.error(`Error al generar variantes (${regenerarResponse.status})`)
              }
            }
          } catch (error: any) {
            console.error('❌ Error en catch regenerando variantes:', {
              message: error?.message,
              stack: error?.stack,
              error: error
            })
            toast.error(`Error de conexión al generar variantes: ${error?.message || 'Error desconocido'}`)
            // No bloquear el guardado si falla la regeneración
            }
          }
        }
        
        if (isNewProduct) {
          toast.success("Producto creado correctamente")
        } else {
          toast.success("Producto actualizado correctamente")
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

  // Los recursos se cargan bajo demanda cuando el usuario busca (handleCostSearchChange)
  // Ya no se necesita cargar todos los recursos al inicio

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
          // Si hay un precio, recalcular desde precio
          const precio = parseNum(updated.find((r: any) => r.campo === "Precio")?.valor ?? 0)
          if (precio > 0) {
            return recalcFromTargetPrice(precio, updated)
          }
        }
        return prev
      })
    }
  }, [totalCost, editing])

  // Función única fuente de verdad para obtener precio de recurso
  // NUNCA retorna null/undefined, siempre retorna un número (incluso si es 0)
  // Esta función debe usarse en TODOS los lugares donde se necesita el precio de un recurso
  const getPrecioRecurso = (recurso: any, sucursal: string = "La Paz"): number => {
    // Si no hay recurso, retornar 0 (no null)
    if (!recurso) return 0

    // Si no hay control_stock, usar coste base (siempre un número)
    if (!recurso.control_stock) {
      return recurso.coste || 0
    }

    // Parsear control_stock si es string
    let controlStock: any = null
    try {
      if (typeof recurso.control_stock === 'string') {
        controlStock = JSON.parse(recurso.control_stock)
      } else if (typeof recurso.control_stock === 'object' && recurso.control_stock !== null) {
        controlStock = recurso.control_stock
      }
    } catch (e) {
      console.error('Error parseando control_stock:', e)
      // Si falla el parseo, usar coste base
      return recurso.coste || 0
    }

    // Si control_stock está vacío o no es objeto válido, usar coste base
    if (!controlStock || typeof controlStock !== 'object' || Object.keys(controlStock).length === 0) {
      return recurso.coste || 0
    }

    const claves = Object.keys(controlStock)

    // 1. Intentar con la sucursal actual (clave directa)
    if (controlStock[sucursal] && typeof controlStock[sucursal] === 'object') {
      const stockData = controlStock[sucursal]
      // Priorizar precio_unitario (formato nuevo), luego precio (formato antiguo), luego otros
      if (typeof stockData.precio_unitario === "number") {
        return stockData.precio_unitario // Incluso si es 0, es válido
      }
      if (typeof stockData.precio === "number") {
        return stockData.precio // Formato antiguo, compatibilidad
      }
      if (typeof stockData.precioVariante === "number") {
        return stockData.precioVariante // Incluso si es 0
      }
      if (typeof stockData.diferenciaPrecio === "number") {
        const precioCalculado = (recurso.coste || 0) + stockData.diferenciaPrecio
        return precioCalculado // Incluso si es 0
      }
    }

    // 2. Buscar por coincidencia de nombre de sucursal en claves (formato "Sucursal:La Paz")
    const claveConSucursal = claves.find(key => {
      const keyLower = key.toLowerCase()
      const sucursalLower = sucursal.toLowerCase()
      return keyLower.includes(`sucursal:${sucursalLower}`) || 
             keyLower === sucursalLower ||
             keyLower.includes(sucursalLower)
    })

    if (claveConSucursal) {
      const datosVariante = controlStock[claveConSucursal]
      if (datosVariante && typeof datosVariante === 'object') {
        // Priorizar precio_unitario (formato nuevo), luego precioVariante, luego precio, luego diferenciaPrecio
        if (typeof datosVariante.precio_unitario === "number") {
          return datosVariante.precio_unitario // Incluso si es 0
        }
        if (typeof datosVariante.precioVariante === "number") {
          return datosVariante.precioVariante // Incluso si es 0
        }
        if (typeof datosVariante.precio === "number") {
          return datosVariante.precio // Incluso si es 0
        }
        if (typeof datosVariante.diferenciaPrecio === "number") {
          const precioCalculado = (recurso.coste || 0) + datosVariante.diferenciaPrecio
          return precioCalculado // Incluso si es 0
        }
      }
    }

    // 3. Fallback: primera clave válida disponible (cualquier sucursal)
    if (claves.length > 0) {
      const primeraClave = claves[0]
      const datosVariante = controlStock[primeraClave]
      if (datosVariante && typeof datosVariante === 'object') {
        // Priorizar precio_unitario (formato nuevo), luego precioVariante, luego precio
        if (typeof datosVariante.precio_unitario === "number") {
          return datosVariante.precio_unitario // Incluso si es 0
        }
        if (typeof datosVariante.precioVariante === "number") {
          return datosVariante.precioVariante // Incluso si es 0
        }
        if (typeof datosVariante.precio === "number") {
          return datosVariante.precio // Incluso si es 0
        }
        if (typeof datosVariante.diferenciaPrecio === "number") {
          const precioCalculado = (recurso.coste || 0) + datosVariante.diferenciaPrecio
          return precioCalculado // Incluso si es 0
        }
      }
    }

    // 4. Último fallback: coste base del recurso (nunca null/undefined)
    return recurso.coste || 0
  }

  // Alias para compatibilidad (mantiene el nombre anterior pero usa la nueva función)
  const obtenerPrecioRecurso = (recurso: any): number => {
    if (!recurso) return 0
    
    // Obtener sucursal del producto desde variantes o formData
    let sucursal = "La Paz" // Fallback seguro
    
    // Intentar obtener sucursal de las variantes del producto
    if (variantes && variantes.length > 0) {
      // Buscar variante de tipo "Sucursal"
      const sucursalVariante = variantes.find((v: any) => 
        v.nombre && (v.nombre.toLowerCase().includes('sucursal') || v.nombre === 'Sucursal')
      )
      if (sucursalVariante && sucursalVariante.posibilidades && sucursalVariante.posibilidades.length > 0) {
        // Tomar la primera posibilidad como sucursal por defecto
        sucursal = sucursalVariante.posibilidades[0]
      }
    }
    
    // Si no se encontró en variantes, usar fallback seguro
    // Nota: sucursal no está en formData ni producto, se obtiene de variantes
    if (sucursal === "La Paz") {
      // Mantener "La Paz" como fallback seguro
      sucursal = "La Paz"
    }
    
    return getPrecioRecurso(recurso, sucursal)
  }

  // Calcular total de costes
  useEffect(() => {
    const total = costRows.reduce((sum, row) => {
      if (row.selectedRecurso && row.cantidad > 0) {
        const coste = row.selectedRecurso.coste || 0
        const cantidad = row.cantidad || 0
        return sum + (coste * cantidad)
      }
      return sum
    }, 0)
    const formattedTotal = parseFloat(total.toFixed(2))
    setTotalCost(formattedTotal)
    
    // Si hay un coste guardado manualmente, verificar si la calculadora cambió significativamente
    if (hasManualCostRef.current && savedCostRef.current !== null) {
      // Solo verificar cambio si el último valor calculado no es 0 (ya se inicializó)
      if (lastCalculatedCostRef.current > 0) {
        const difference = Math.abs(formattedTotal - lastCalculatedCostRef.current)
        // Si la calculadora cambió significativamente (> 0.01), resetear el flag de guardado manual
        if (difference > 0.01) {
          hasManualCostRef.current = false
          savedCostRef.current = null
          // Actualizar el campo con el nuevo total calculado
          setEditableCost(formattedTotal.toFixed(2))
        }
      }
      // Si lastCalculatedCostRef.current es 0, es la primera carga, mantener el valor guardado
    } else {
      // No hay coste guardado manualmente, actualizar normalmente
      setEditableCost(formattedTotal.toFixed(2))
    }
    
    // Actualizar el último valor calculado solo si no es la primera vez (ya hay un valor previo)
    if (lastCalculatedCostRef.current > 0 || !hasManualCostRef.current) {
      lastCalculatedCostRef.current = formattedTotal
    }
  }, [costRows])

  // Función para cargar recursos de forma asíncrona según búsqueda
  const loadRecursos = async (input: string): Promise<any[]> => {
    try {
      if (!input || input.trim().length === 0) {
        return []
      }

      const response = await fetch(`/api/recursos/search?query=${encodeURIComponent(input)}`)
      if (response.ok) {
        const result = await response.json()
        return result.data || []
      }
      return []
    } catch (error) {
      console.error('❌ Error cargando recursos:', error)
      return []
    }
  }

  // Ya no se necesita fetch masivo de recursos
  // Los recursos se cargan bajo demanda cuando el usuario busca

  const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100


  // Función para cálculo inverso desde precio objetivo
  const recalcFromTargetPrice = (precioObjetivo: number, rowsIn: typeof priceRows) => {
    const rows = JSON.parse(JSON.stringify(rowsIn))
    const coste = parseNum(rows.find(r => r.campo === "Coste")?.valor ?? 0)

    // Obtener porcentajes configurables
    const facturaRow = rows.find(r => r.campo === "Factura")
    const iueRow = rows.find(r => r.campo === "IUE")
    const comisionRow = rows.find(r => r.campo === "Comision")
    
    const facturaPctConfig = parseNum(facturaRow?.porcentajeConfig ?? facturaRow?.porcentaje ?? 16)
    const iuePctConfig = parseNum(iueRow?.porcentajeConfig ?? iueRow?.porcentaje ?? 2)
    const comPctConfig = parseNum(comisionRow?.porcentajeConfig ?? comisionRow?.porcentaje ?? 12)

    const facturaPct = facturaPctConfig / 100
    const iuePct = iuePctConfig / 100

    const facturaVal = round2(precioObjetivo * facturaPct)
    const iueVal = round2(precioObjetivo * iuePct)

    const costosTotales = round2(coste + facturaVal + iueVal)
    const utilidadBruta = round2(precioObjetivo - costosTotales)
    const comPct = comPctConfig / 100
    const comisionVal = round2(utilidadBruta * comPct)
    const utilidadNeta = round2(utilidadBruta - comisionVal)

    // Calcular porcentajes sobre el precio para mostrar en la columna %
    const costePct = precioObjetivo > 0 ? round2((coste / precioObjetivo) * 100) : 0
    const facturaPctSobrePrecio = precioObjetivo > 0 ? round2((facturaVal / precioObjetivo) * 100) : 0
    const iuePctSobrePrecio = precioObjetivo > 0 ? round2((iueVal / precioObjetivo) * 100) : 0
    const costosTotalesPct = precioObjetivo > 0 ? round2((costosTotales / precioObjetivo) * 100) : 0
    const utilidadBrutaPct = precioObjetivo > 0 ? round2((utilidadBruta / precioObjetivo) * 100) : 0
    const comisionPctSobrePrecio = precioObjetivo > 0 ? round2((comisionVal / precioObjetivo) * 100) : 0
    const utilidadNetaPct = precioObjetivo > 0 ? round2((utilidadNeta / precioObjetivo) * 100) : 0

    rows.forEach(r => {
      if (r.campo === "Coste") {
        r.porcentaje = costePct
      }
      if (r.campo === "Factura") {
        r.valor = facturaVal
        r.porcentaje = facturaPctSobrePrecio
        r.porcentajeConfig = facturaPctConfig
      }
      if (r.campo === "IUE") {
        r.valor = iueVal
        r.porcentaje = iuePctSobrePrecio
        r.porcentajeConfig = iuePctConfig
      }
      if (r.campo === "Costos totales") {
        r.valor = costosTotales
        r.porcentaje = costosTotalesPct
      }
      if (r.campo === "Utilidad bruta") {
        r.valor = utilidadBruta
        r.porcentaje = utilidadBrutaPct
      }
      if (r.campo === "Comision") {
        r.valor = comisionVal
        r.porcentaje = comisionPctSobrePrecio
        r.porcentajeConfig = comPctConfig
      }
      if (r.campo === "Utilidad neta") {
        r.valor = utilidadNeta
        r.porcentaje = utilidadNetaPct
      }
      if (r.campo === "Precio") {
        r.valor = precioObjetivo
        // El porcentaje de Precio siempre es 100% (es el precio objetivo)
        r.porcentaje = 100
      }
    })

    return rows
  }

  // Handlers para calculadora de costes
  const handleCostSearchChange = async (rowId: number, searchTerm: string) => {
    setCostRows(prev => prev.map(row => 
      row.id === rowId 
        ? { ...row, searchTerm, selectedRecurso: null }
        : row
    ))
    
    if (searchTerm.trim().length > 0) {
      // Cargar recursos de forma asíncrona
      const recursosEncontrados = await loadRecursos(searchTerm)
      setFilteredRecursos(recursosEncontrados)
      setShowCostDropdown(rowId)
    } else {
      setFilteredRecursos([])
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
    
    // FIX 5: Mejorar parseo de variantes al seleccionar recurso
    // Si el recurso tiene variantes, importarlas automáticamente al producto
    // Manejar diferentes formatos de variantes:
    // 1. Array directo: recurso.variantes = [...]
    // 2. Objeto con variantes: recurso.variantes = { variantes: [...], datosVariantes: {...} }
    let variantesArray: any[] = []
    
    if (recurso.variantes) {
      try {
        if (Array.isArray(recurso.variantes)) {
          // Formato 1: Array directo
          variantesArray = recurso.variantes
        } else if (typeof recurso.variantes === 'object' && recurso.variantes.variantes) {
          // Formato 2: Objeto con propiedad variantes
          if (Array.isArray(recurso.variantes.variantes)) {
            variantesArray = recurso.variantes.variantes
          } else {
            console.warn(`⚠️ Recurso "${recurso.nombre}" tiene variantes.variantes pero no es array:`, typeof recurso.variantes.variantes)
          }
        } else if (typeof recurso.variantes === 'string') {
          // Formato 3: String JSON que necesita parsearse
          try {
            const parsed = JSON.parse(recurso.variantes)
            if (Array.isArray(parsed)) {
              variantesArray = parsed
            } else if (parsed && parsed.variantes && Array.isArray(parsed.variantes)) {
              variantesArray = parsed.variantes
            } else {
              console.warn(`⚠️ Recurso "${recurso.nombre}" tiene variantes en string pero formato no reconocido:`, parsed)
            }
          } catch (e) {
            console.error(`❌ Error parseando variantes del recurso "${recurso.nombre}":`, e)
          }
        } else {
          console.warn(`⚠️ Recurso "${recurso.nombre}" tiene variantes en formato no reconocido:`, typeof recurso.variantes, recurso.variantes)
        }
      } catch (error) {
        console.error(`❌ Error procesando variantes del recurso "${recurso.nombre}":`, error)
        variantesArray = []
      }
    } else {
      console.log(`ℹ️ Recurso "${recurso.nombre}" no tiene variantes definidas`)
    }
    
    // Asegurar que variantesArray nunca sea undefined
    if (!Array.isArray(variantesArray)) {
      console.warn(`⚠️ variantesArray no es array, normalizando a []`)
      variantesArray = []
    }
    
    if (variantesArray.length > 0) {
      setVariantes(prev => {
        // Agregar todas las variantes, incluso si tienen el mismo nombre (pueden venir de diferentes recursos)
        // Marcar las nuevas variantes con el recurso_id para poder eliminarlas después
        const nuevasVariantes = variantesArray.map((v: any) => ({ 
          ...v, 
          recurso_id: recurso.id, 
          recurso_nombre: recurso.nombre 
        }))
        // Agregar todas las nuevas variantes (no filtrar duplicados por nombre)
        return [...prev, ...nuevasVariantes]
      })
      toast.success(`${variantesArray.length} variante(s) importada(s) desde el recurso`)
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

  const handleRemoveCostRow = async (rowId: number) => {
    if (costRows.length > 1) {
      // Obtener el recurso que se va a eliminar
      const rowToRemove = costRows.find(row => row.id === rowId)
      const recursoIdToRemove = rowToRemove?.selectedRecurso?.id
      const recursoNombreToRemove = rowToRemove?.selectedRecurso?.nombre
      
      // Eliminar la fila de costRows
      const nuevasCostRows = costRows.filter(row => row.id !== rowId)
      setCostRows(nuevasCostRows)
      
      // Si el recurso tenía variantes importadas, eliminarlas también del estado local
      if (recursoIdToRemove) {
        setVariantes(prev => {
          const variantesRestantes = prev.filter(v => v.recurso_id !== recursoIdToRemove)
          const eliminadas = prev.filter(v => v.recurso_id === recursoIdToRemove)
          if (eliminadas.length > 0) {
            toast.info(`${eliminadas.length} variante(s) eliminada(s) al quitar el recurso "${recursoNombreToRemove}"`)
          }
          return variantesRestantes
        })
      }
      
      // Regenerar variantes basándose en los recursos que quedan en la receta
      // Obtener todas las variantes de los recursos restantes
      const variantesDeRecursosRestantes: any[] = []
      nuevasCostRows.forEach(row => {
        if (row.selectedRecurso?.id && row.selectedRecurso?.variantes) {
          let variantesArray: any[] = []
          
          if (Array.isArray(row.selectedRecurso.variantes)) {
            variantesArray = row.selectedRecurso.variantes
          } else if (typeof row.selectedRecurso.variantes === 'object' && row.selectedRecurso.variantes.variantes) {
            if (Array.isArray(row.selectedRecurso.variantes.variantes)) {
              variantesArray = row.selectedRecurso.variantes.variantes
            }
          } else if (typeof row.selectedRecurso.variantes === 'string') {
            try {
              const parsed = JSON.parse(row.selectedRecurso.variantes)
              if (Array.isArray(parsed)) {
                variantesArray = parsed
              } else if (parsed && parsed.variantes && Array.isArray(parsed.variantes)) {
                variantesArray = parsed.variantes
              }
            } catch (e) {
              console.error('Error parseando variantes del recurso:', e)
            }
          }
          
          // Agregar variantes con el recurso_id para tracking
          variantesArray.forEach((v: any) => {
            variantesDeRecursosRestantes.push({
              ...v,
              recurso_id: row.selectedRecurso.id,
              recurso_nombre: row.selectedRecurso.nombre
            })
          })
        }
      })
      
      // Actualizar el estado de variantes con las variantes de los recursos restantes
      setVariantes(variantesDeRecursosRestantes)
      
      // Si hay un producto guardado, regenerar variantes en la BD
      if (!isNewProduct && id) {
        try {
          // Convertir variantes al formato correcto
          const variantesLimpias = variantesDeRecursosRestantes.map(v => ({
            nombre: v.nombre,
            valores: v.posibilidades ?? v.valores ?? []
          }))
          
          // Regenerar variantes en la BD
          const regenerarResponse = await fetch(`/api/productos/variantes`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              producto_id: id,
              action: 'regenerar',
              variantes_definicion: variantesLimpias
            })
          })
          
          if (regenerarResponse.ok) {
            // Recargar variantes de la BD para actualizar la tabla
            setTimeout(() => {
              getVariantes()
            }, 500)
          } else {
            const errorData = await regenerarResponse.json().catch(() => ({}))
            console.error('Error regenerando variantes después de eliminar recurso:', errorData)
            toast.warning('Variantes eliminadas localmente, pero hubo un error al actualizar la base de datos')
          }
        } catch (error) {
          console.error('Error al regenerar variantes después de eliminar recurso:', error)
          toast.warning('Variantes eliminadas localmente, pero hubo un error al actualizar la base de datos')
        }
      }
    }
  }
  
  // Eliminar una variante individual
  const handleRemoveVariante = (varianteIndex: number) => {
    setVariantes(prev => {
      const varianteEliminada = prev[varianteIndex]
      const nuevasVariantes = prev.filter((_, index) => index !== varianteIndex)
      toast.success(`Variante "${varianteEliminada?.nombre || 'desconocida'}" eliminada`)
      return nuevasVariantes
    })
  }

  const handleApplyCost = async () => {
    setIsApplyingCost(true)
    setCostApplied(false)
    
    try {
      // Si es un producto nuevo, no se puede aplicar el coste hasta que esté guardado
      if (isNewProduct) {
        toast.error("Debes guardar el producto primero antes de aplicar el coste")
        setIsApplyingCost(false)
        return
      }

      const costValue = parseFloat(parseFloat(editableCost || "0").toFixed(2))
      if (costValue <= 0) {
        toast.error("El coste debe ser mayor a 0")
        setIsApplyingCost(false)
        return
      }

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
        // cantidad no se guarda en Supabase, se calcula desde receta
        mostrar_en_web: formData.mostrar_en_web
      }

      const response = await fetch(`/api/inventario/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || errorData.message || "Error al guardar el coste"
        throw new Error(errorMessage)
      }

      const result = await response.json()
      const updated = result.data || result
      setProducto(updated)
      
      // Marcar que hay un coste guardado manualmente
      hasManualCostRef.current = true
      savedCostRef.current = costValue
      lastCalculatedCostRef.current = totalCost
      
      setCostApplied(true)
      toast.success(`Coste aplicado y guardado: Bs ${costValue.toFixed(2)}`)
      
      // Resetear animación después de 1.8 segundos
      setTimeout(() => setCostApplied(false), 1800)
      
    } catch (error) {
      console.error("Error saving cost:", error)
      toast.error(error instanceof Error ? error.message : "Error de conexión al guardar el coste")
    } finally {
      setIsApplyingCost(false)
    }
  }

  // Handlers para calculadora de precios (nueva versión simplificada)
  const handlePricePorcentajeChange = (rowId: number, pctStr: string) => {
    setPriceRows(prev => {
      const rowsCopy = JSON.parse(JSON.stringify(prev))
      const row = rowsCopy.find((r: any) => r.id === rowId)
      if (!row || !row.editable) return prev

      if (pctStr === "") {
        row.porcentaje = null
        row.porcentajeConfig = null
        return rowsCopy
      }

      const pct = parseNum(pctStr)
      
      // Si cambian porcentajes de Factura, IUE o Comision, guardar en porcentajeConfig
      if (["Factura", "IUE", "Comision"].includes(row.campo)) {
        row.porcentajeConfig = pct
        const precioActual = parseNum(rowsCopy.find((r: any) => r.campo === "Precio")?.valor ?? 0)
        if (precioActual > 0) {
          return recalcFromTargetPrice(precioActual, rowsCopy)
        }
      } else {
        row.porcentaje = pct
      }

      return rowsCopy
    })
  }

  const handlePriceValorChange = (rowId: number, valStr: string) => {
    setPriceRows(prev => {
      const rowsCopy = JSON.parse(JSON.stringify(prev))
      const row = rowsCopy.find((r: any) => r.id === rowId)
      if (!row || !row.editable) return prev

      // Si el campo está vacío, mantener el valor actual sin recalcular
      if (valStr === "" || valStr.trim() === "") {
        // Para "Precio", no recalcular si está vacío (dejar que el usuario termine de escribir)
        if (row.campo === "Precio") {
          row.valor = ""
          return rowsCopy
        }
        row.valor = 0
        return rowsCopy
      }

      // Parsear el valor (maneja tanto "." como "," como separador decimal)
      const val = parseNum(valStr)
      
      // Proteger de NaN
      if (isNaN(val) || !isFinite(val)) {
        // Si no es un número válido, mantener el valor actual
        return prev
      }

      // Si se edita "Precio", usar cálculo inverso (precio objetivo → recalcular todo)
      if (row.campo === "Precio") {
        if (val > 0) {
          return recalcFromTargetPrice(val, rowsCopy)
        } else {
          // Si el precio es 0 o negativo, solo actualizar el valor sin recalcular
          row.valor = val
          return rowsCopy
        }
      }

      // Para otros campos, solo actualizar el valor
      row.valor = val
      return rowsCopy
    })
  }

  const handleApplyPrice = async () => {
    setIsApplyingPrice(true)
    setPriceApplied(false)
    
    try {
      // Si es un producto nuevo, no se puede aplicar el precio hasta que esté guardado
      if (isNewProduct) {
        toast.error("Debes guardar el producto primero antes de aplicar el precio")
        setIsApplyingPrice(false)
        return
      }

      const precioRow = priceRows.find(r => r.campo === "Precio")
      const priceValue = parseNum(precioRow?.valor ?? 0)
      
      if (priceValue <= 0) {
        toast.error("El precio debe ser mayor a 0")
        setIsApplyingPrice(false)
        return
      }

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
        mostrar_en_web: formData.mostrar_en_web
      }

      const response = await fetch(`/api/inventario/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || errorData.message || "Error al guardar el precio"
        throw new Error(errorMessage)
      }

      const result = await response.json()
      const updated = result.data || result
      setProducto(updated)
      
      setPriceApplied(true)
      toast.success(`Precio aplicado y guardado: Bs ${priceValue.toFixed(2)}`)
      
      setTimeout(() => setPriceApplied(false), 1800)
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error de conexión al guardar el precio")
    } finally {
      setIsApplyingPrice(false)
    }
  }


  // Inicializar calculadora de precios con coste actual cuando se entra en modo edición
  useEffect(() => {
    if (editing && !saving) {
      const coste = parseFloat(formData.coste) || (producto?.coste || 0)
      const precio = parseFloat(formData.precio_venta) || (producto?.precio_venta || 0)
      
      setPriceRows(prev => {
        let updated = prev.map(row => {
          if (row.campo === "Coste" && parseNum(row.valor) !== coste) {
            return { ...row, valor: coste }
          }
          if (row.campo === "Precio" && parseNum(row.valor) !== precio && precio > 0) {
            return { ...row, valor: precio }
          }
          return row
        })
        
        // Si hay un precio, recalcular desde precio
        if (precio > 0) {
          return recalcFromTargetPrice(precio, updated)
        }
        return updated
      })
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
                      {imageError && (
                        <p className="text-sm text-red-600 mt-1">{imageError}</p>
                      )}
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
                          <div className="aspect-square w-32 overflow-hidden rounded-md border-2 border-gray-200 bg-gray-100 relative">
                            <Image 
                              src={producto.imagen_portada} 
                              alt={producto.nombre} 
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

          {/* Variantes del Recurso (Solo visualización - importadas de recursos) */}
          {editing && variantes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Variantes del Recurso</CardTitle>
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
                      <div key={`variante-${variante.id || varianteIndex}-${variante.recurso_id || 'no-recurso'}-${varianteIndex}`} className={`flex items-center justify-between p-3 rounded-lg ${varianteIndex % 2 === 0 ? 'bg-blue-50' : 'bg-white'} border border-gray-200`}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="font-medium text-sm text-gray-900">{variante.nombre}</h4>
                            {isColorMode && (
                              <Badge variant="outline" className="text-xs">
                                <Palette className="w-3 h-3 mr-1" />
                                Color
                              </Badge>
                            )}
                            {variante.recurso_nombre && (
                              <Badge variant="secondary" className="text-xs">
                                De: {variante.recurso_nombre}
                              </Badge>
                            )}
                          </div>
                          {posibilidadesTexto && (
                            <p className="text-xs text-gray-600">{posibilidadesTexto}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveVariante(varianteIndex)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 ml-2"
                          title="Eliminar variante"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
                  Calculadora de Costes (Receta)
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
                            {row.selectedRecurso ? `Bs ${((row.selectedRecurso.coste || 0) * (row.cantidad || 0)).toFixed(2)}` : '-'}
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
                  Calculadora de Precios (UFC)
                </CardTitle>
                <CardDescription>Calcula el precio desde el precio objetivo del mercado</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-700 mb-2">
                    <div className="col-span-4">Campo</div>
                    <div className="col-span-3">%</div>
                    <div className="col-span-5">Valor (Bs)</div>
                  </div>
                  
                  {priceRows.map((row) => {
                    const isEditable = row.editable
                    const isPrecioRow = row.campo === "Precio"
                    // Para campos editables (Factura, IUE, Comision), siempre mostrar el campo
                    // Para campos no editables, solo mostrar si tienen porcentaje calculado
                    let showPorcentaje =
                      row.porcentaje != null ||
                      ((row.campo === "Factura" || row.campo === "IUE" || row.campo === "Comision" || row.campo === "Comisión" || row.campo === "Comisión (C)") &&
                       (row as any).porcentajeConfig != null)
                    // Para Comisión, SIEMPRE mostrar porcentajeConfig (valor original del usuario)
                    // Para Factura e IUE, mostrar porcentajeConfig si existe, sino porcentaje
                    // Para otros campos, mostrar porcentaje (calculado sobre precio)
                    let porcentajeToShow: number | string | null = row.porcentaje
                    if (row.campo === "Comision" || row.campo === "Comisión" || row.campo === "Comisión (C)") {
                      porcentajeToShow = (row as any).porcentajeConfig != null ? (row as any).porcentajeConfig : ""
                      showPorcentaje = true
                    } else if (row.campo === "Factura" || row.campo === "IUE") {
                      porcentajeToShow = (row as any).porcentajeConfig != null
                        ? (row as any).porcentajeConfig
                        : row.porcentaje
                    }
                    
                    return (
                      <div key={`price-row-${row.id}`} className="grid grid-cols-12 gap-2">
                        <div className="col-span-4">
                          <Input
                            value={row.campo}
                            disabled
                            className={`h-9 text-sm ${isPrecioRow ? "bg-green-100 cursor-not-allowed" : "bg-gray-100 cursor-not-allowed"}`}
                          />
                        </div>
                        <div className="col-span-3">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={isPrecioRow ? "" : (showPorcentaje ? (porcentajeToShow ?? "") : "")}
                            onChange={(e) => handlePricePorcentajeChange(row.id, e.target.value)}
                            disabled={!isEditable || !showPorcentaje || isPrecioRow}
                            placeholder={isPrecioRow ? "" : (showPorcentaje ? "0.00" : "")}
                            className={`h-9 text-sm ${!isEditable || !showPorcentaje || isPrecioRow ? (isPrecioRow ? "bg-green-100 cursor-not-allowed" : "bg-gray-100 cursor-not-allowed") : ""}`}
                          />
                        </div>
                        <div className="col-span-5">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={row.valor || ""}
                            onChange={(e) => handlePriceValorChange(row.id, e.target.value)}
                            disabled={!isEditable}
                            placeholder="0.00"
                            className={`h-9 text-sm ${!isEditable ? (isPrecioRow ? "bg-green-100 cursor-not-allowed" : "bg-gray-100 cursor-not-allowed") : (isPrecioRow ? "bg-green-50" : "")}`}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Precio Final:</span>
                    <span className="text-lg font-bold text-green-600">
                      Bs {parseNum(priceRows.find(r => r.campo === "Precio")?.valor ?? 0).toFixed(2)}
                    </span>
                  </div>
                            <Button
                    onClick={handleApplyPrice}
                    disabled={isApplyingPrice || parseNum(priceRows.find(r => r.campo === "Precio")?.valor ?? 0) <= 0}
                    className={`w-full mt-4 transition-all duration-300 transform ${
                      priceApplied
                        ? 'bg-green-500 hover:bg-green-600 scale-105 shadow-lg'
                        : 'bg-green-600 hover:bg-green-700'
                    } ${isApplyingPrice ? 'opacity-75 cursor-wait' : ''} text-white`}
                              size="sm"
                  >
                    {isApplyingPrice ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : priceApplied ? (
                      <>
                        <Check className="w-4 h-4 mr-2 animate-pulse" />
                        ¡Aplicado!
                      </>
                    ) : (
                      'Aplicar Precio'
                    )}
                  </Button>
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
                      onChange={(e) => {
                        // Si el usuario escribe manualmente, resetear el flag de guardado manual
                        hasManualCostRef.current = false
                        savedCostRef.current = null
                        setEditableCost(e.target.value)
                      }}
                      onBlur={(e) => {
                        const value = e.target.value
                        if (value && !isNaN(parseFloat(value))) {
                          setEditableCost(parseFloat(value).toFixed(2))
                        }
                      }}
                      className="w-24 h-9 text-sm font-semibold"
                      placeholder="0.00"
                    />
                    <Button
                      onClick={handleApplyCost}
                      disabled={isApplyingCost || !editableCost || parseFloat(editableCost) <= 0}
                      className={`ml-auto transition-all duration-300 transform ${
                        costApplied
                          ? 'bg-red-500 hover:bg-red-600 scale-105 shadow-lg'
                          : 'bg-red-600 hover:bg-red-700'
                      } ${isApplyingCost ? 'opacity-75 cursor-wait' : ''} text-white`}
                      size="sm"
                    >
                      {isApplyingCost ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Guardando...
                        </>
                      ) : costApplied ? (
                        <>
                          <Check className="w-4 h-4 mr-2 animate-pulse" />
                          ¡Aplicado!
                        </>
                      ) : (
                        'Aplicar Coste'
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>


            {/* Tabla de Variantes del Producto */}
            {variantes.length > 0 && (
              <Card className="lg:col-span-2 mt-8">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Variantes del Producto</CardTitle>
                      <CardDescription>
                        Gestiona costes y precios por variante. Los valores vacíos heredan del producto base.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingVariantes ? (
                    <div className="text-center py-8 text-gray-500">
                      Cargando variantes...
                    </div>
                  ) : variantesProducto.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No hay variantes generadas. Las variantes se generan automáticamente al guardar el producto.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[250px]">Variante</TableHead>
                            <TableHead className="w-[120px] text-right">Coste Variante</TableHead>
                            <TableHead className="w-[120px] text-right">Precio Variante</TableHead>
                            <TableHead className="w-[120px] text-right">Dif. Coste</TableHead>
                            <TableHead className="w-[120px] text-right">Dif. Precio</TableHead>
                            <TableHead className="w-[150px] text-center">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {variantesProducto.filter(v => v && v.id).map((variante, index) => {
                            const costeFinal = getCosteFinal(variante)
                            const precioFinal = getPrecioFinal(variante)
                            
                            // Calcular diferencia con respecto a la cifra base (primera variante)
                            const variantesVisibles = variantesProducto.filter(v => v && v.id)
                            let difCoste = 0
                            let difPrecio = 0
                            
                            if (index === 0) {
                              // Primera variante: siempre muestra 0.00 (es la base)
                              difCoste = 0
                              difPrecio = 0
                            } else {
                              // Resto de variantes: comparar con la primera variante (la base)
                              const varianteBase = variantesVisibles[0]
                              const costeBase = getCosteFinal(varianteBase)
                              const precioBase = getPrecioFinal(varianteBase)
                              difCoste = calcularDiferenciaCoste(costeFinal, costeBase)
                              difPrecio = calcularDiferenciaPrecio(precioFinal, precioBase)
                            }
                            
                            const isEditing = editingVariante[variante.id] !== undefined
                            const editData = editingVariante[variante.id] || {}

                            return (
                              <TableRow 
                                key={variante.id}
                                className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                              >
                                <TableCell className="font-medium">
                                  {formatearCombinacion(variante.combinacion)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {isEditing ? (
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={editData.coste_override !== undefined && editData.coste_override !== null 
                                        ? editData.coste_override 
                                        : ''}
                                      onChange={(e) => handleVarianteFieldChange(variante.id, 'coste_override', e.target.value)}
                                      placeholder={costeFinal.toFixed(2)}
                                      className="h-8 w-full text-sm"
                                    />
                                  ) : (
                                    <span>
                                      Bs {costeFinal.toFixed(2)}
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  {isEditing ? (
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={editData.precio_override !== undefined && editData.precio_override !== null 
                                        ? editData.precio_override 
                                        : ''}
                                      onChange={(e) => handleVarianteFieldChange(variante.id, 'precio_override', e.target.value)}
                                      placeholder={precioFinal.toFixed(2)}
                                      className="h-8 w-full text-sm"
                                    />
                                  ) : (
                                    <span>
                                      Bs {precioFinal.toFixed(2)}
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  {index === 0 ? (
                                    <span className="text-gray-900">0.00</span>
                                  ) : (
                                    <span className={difCoste !== 0 ? (difCoste > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium') : 'text-gray-500'}>
                                      {difCoste > 0 ? '+' : difCoste < 0 ? '-' : ''}{Math.abs(difCoste).toFixed(2)}
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  {index === 0 ? (
                                    <span className="text-gray-900">0.00</span>
                                  ) : (
                                    <span className={difPrecio !== 0 ? (difPrecio > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium') : 'text-gray-500'}>
                                      {difPrecio > 0 ? '+' : difPrecio < 0 ? '-' : ''}{Math.abs(difPrecio).toFixed(2)}
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openCalculadoraVariante(variante)}
                                    title="Abrir calculadora de precios"
                                    className="text-gray-600 hover:text-gray-800 hover:bg-gray-200"
                                  >
                                    <Calculator className="w-4 h-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

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

      {/* Modal Calculadora de Precios por Variante */}
      <Dialog open={calculadoraVarianteOpen} onOpenChange={setCalculadoraVarianteOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Calculadora de Precios - Variante
            </DialogTitle>
            <DialogDescription>
              {varianteCalculadora && formatearCombinacion(varianteCalculadora.combinacion)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Calculadora de Precios */}
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-700 mb-2">
                <div className="col-span-4">Campo</div>
                <div className="col-span-3">%</div>
                <div className="col-span-5">Valor (Bs)</div>
              </div>
              
              {priceRowsVariante.map((row) => {
                const isEditable = row.editable
                const isPrecioRow = row.campo === "Precio"
                // Para campos editables (Factura, IUE, Comision), siempre mostrar el campo
                // Para campos no editables, solo mostrar si tienen porcentaje calculado
                let showPorcentaje =
                  row.porcentaje != null ||
                  ((row.campo === "Factura" || row.campo === "IUE" || row.campo === "Comision" || row.campo === "Comisión" || row.campo === "Comisión (C)") &&
                   (row as any).porcentajeConfig != null)
                // Para Comisión, SIEMPRE mostrar porcentajeConfig (valor original del usuario)
                // Para Factura e IUE, mostrar porcentajeConfig si existe, sino porcentaje
                // Para otros campos, mostrar porcentaje (calculado sobre precio)
                let porcentajeToShow: number | string | null = row.porcentaje
                if (row.campo === "Comision" || row.campo === "Comisión" || row.campo === "Comisión (C)") {
                  porcentajeToShow = (row as any).porcentajeConfig != null ? (row as any).porcentajeConfig : ""
                  showPorcentaje = true
                } else if (row.campo === "Factura" || row.campo === "IUE") {
                  porcentajeToShow = (row as any).porcentajeConfig != null
                    ? (row as any).porcentajeConfig
                    : row.porcentaje
                }
                
                return (
                  <div key={`price-row-variante-${row.id}`} className="grid grid-cols-12 gap-2">
                    <div className="col-span-4">
                      <Input
                        value={row.campo}
                        disabled
                        className={`h-9 text-sm ${isPrecioRow ? "bg-green-100 cursor-not-allowed" : "bg-gray-100 cursor-not-allowed"}`}
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={isPrecioRow ? "" : (showPorcentaje ? (porcentajeToShow ?? "") : "")}
                        onChange={(e) => handlePricePorcentajeChangeVariante(row.id, e.target.value)}
                        disabled={!isEditable || !showPorcentaje || isPrecioRow}
                        placeholder={isPrecioRow ? "" : (showPorcentaje ? "0.00" : "")}
                        className={`h-9 text-sm ${!isEditable || !showPorcentaje || isPrecioRow ? (isPrecioRow ? "bg-green-100 cursor-not-allowed" : "bg-gray-100 cursor-not-allowed") : ""}`}
                      />
                    </div>
                    <div className="col-span-5">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.valor || ""}
                        onChange={(e) => handlePriceValorChangeVariante(row.id, e.target.value)}
                        disabled={!isEditable || isPrecioRow}
                        placeholder="0.00"
                        className={`h-9 text-sm ${!isEditable || isPrecioRow ? (isPrecioRow ? "bg-green-100 cursor-not-allowed" : "bg-gray-100 cursor-not-allowed") : ""}`}
                      />
                    </div>
                    </div>
                )
              })}
            </div>

            {/* Precio Final y Botón Aplicar */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">Precio Final:</span>
                  <span className="text-lg font-bold text-green-600">
                    Bs {priceRowsVariante.find(r => r.campo === "Precio")?.valor?.toFixed(2) || "0.00"}
                  </span>
                </div>
                <Button
                  onClick={handleApplyPriceVariante}
                  disabled={isApplyingPriceVariante || !priceRowsVariante.find(r => r.campo === "Precio")?.valor || parseNum(priceRowsVariante.find(r => r.campo === "Precio")?.valor ?? 0) <= 0}
                  className={`transition-all duration-300 transform ${
                    priceAppliedVariante
                      ? 'bg-green-500 hover:bg-green-600 scale-105 shadow-lg'
                      : 'bg-green-600 hover:bg-green-700'
                  } ${isApplyingPriceVariante ? 'opacity-75 cursor-wait' : ''} text-white`}
                  size="sm"
                >
                  {isApplyingPriceVariante ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : priceAppliedVariante ? (
                    <>
                      <Check className="w-4 h-4 mr-2 animate-pulse" />
                      ¡Aplicado!
                    </>
                  ) : (
                    'Aplicar Precio'
                  )}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCalculadoraVarianteOpen(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

