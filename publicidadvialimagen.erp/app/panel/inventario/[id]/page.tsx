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
import { Checkbox } from "@/components/ui/checkbox"
import { useProductoVariantes } from "@/hooks/useProductoVariantes"
import { generarCombinacionesVariantes, convertirVariantesAFormato, parsearClaveVariante } from "@/lib/variantes/generarCombinaciones"
import { calcularDiferenciaCoste, calcularDiferenciaPrecio } from "@/lib/variantes/calcularPrecioVariante"
import { calcularCosteVariante } from "@/lib/variantes/calcularCosteVariante"
import { findResourceVariantPrice } from "@/lib/variantes/variantEngine"
import { useCategorias } from "@/hooks/use-categorias"

// Helper para fusionar variantes sin duplicados
function mergeVariantes(prev: any[], nuevas: any[]) {
  const map = new Map<string, Set<string>>();

  // Insertar previas
  prev.forEach(v => {
    if (!map.has(v.nombre)) map.set(v.nombre, new Set());
    v.valores?.forEach((val: string) => map.get(v.nombre)!.add(val));
  });

  // Insertar nuevas
  nuevas.forEach(v => {
    if (!map.has(v.nombre)) map.set(v.nombre, new Set());
    v.valores?.forEach((val: string) => map.get(v.nombre)!.add(val));
  });

  return Array.from(map.entries()).map(([nombre, valores]) => ({
    nombre,
    valores: Array.from(valores)
  }));
}


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
  
  // Cargar categorías y unidades dinámicamente
  const { categorias: categoriasProductos, loading: categoriasLoading } = useCategorias("Inventario", "Productos")
  const { categorias: unidadesMedida, loading: unidadesLoading } = useCategorias("Inventario", "Productos_unidades")

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

  // Estados para selección múltiple y edición masiva
  const [selectedVariantes, setSelectedVariantes] = useState<Record<string, boolean>>({})
  const [pendingChangesVariantes, setPendingChangesVariantes] = useState<Record<string, { precio_override?: number, dif_precio?: number }>>({})
  const [savingBulkVariantes, setSavingBulkVariantes] = useState(false)
  // FIX variantes: flag para asegurar que la regeneración automática solo se ejecute una vez por producto
  const [autoRegeneracionVariantesRealizada, setAutoRegeneracionVariantesRealizada] = useState(false)

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

  // FIX variantes: resetear bandera de auto-regeneración cuando cambia el producto
  useEffect(() => {
    setAutoRegeneracionVariantesRealizada(false)
  }, [id])

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

  // FIX variantes: regeneración automática fiable de variantes del producto al cargar
  // IMPORTANTE: Solo regenerar si el producto NO tiene variantes guardadas
  useEffect(() => {
    // Solo para productos existentes
    if (isNewProduct || !id || id === 'nuevo' || id === 'new') return
    if (autoRegeneracionVariantesRealizada) return

    // CRÍTICO: Verificar si el producto ya tiene variantes guardadas
    // Si ya tiene variantes, NO regenerar automáticamente para no sobrescribir las migradas
    if (variantes.length > 0) {
      console.log('✅ [VARIANTES] Producto ya tiene variantes guardadas, saltando regeneración automática')
      setAutoRegeneracionVariantesRealizada(true)
      return
    }

    // Necesitamos tener al menos un recurso seleccionado en la receta
    const recursosConVariantes = costRows.filter(row => {
      const recurso = row.selectedRecurso
      if (!recurso || !recurso.id) return false

      if (Array.isArray(recurso.variantes) && recurso.variantes.length > 0) return true
      if (
        recurso.variantes &&
        typeof recurso.variantes === 'object' &&
        Array.isArray(recurso.variantes.variantes) &&
        recurso.variantes.variantes.length > 0
      ) {
        return true
      }
      return false
    })

    if (recursosConVariantes.length === 0) {
      console.log('⚠️ [VARIANTES] No hay recursos con variantes en costRows, saltando regeneración automática')
      setAutoRegeneracionVariantesRealizada(true)
      return
    }

    const run = async () => {
      try {
        const variantesDefinicion: { nombre: string; valores: any[] }[] = []

        recursosConVariantes.forEach(row => {
          const recurso = row.selectedRecurso
          if (!recurso?.variantes) return

          let variantesArray: any[] = []
          if (Array.isArray(recurso.variantes)) {
            variantesArray = recurso.variantes
          } else if (
            typeof recurso.variantes === 'object' &&
            Array.isArray(recurso.variantes.variantes)
          ) {
            variantesArray = recurso.variantes.variantes
          } else if (typeof recurso.variantes === 'string') {
            try {
              const parsed = JSON.parse(recurso.variantes)
              if (Array.isArray(parsed)) {
                variantesArray = parsed
              } else if (parsed && Array.isArray(parsed.variantes)) {
                variantesArray = parsed.variantes
              }
            } catch {
              // ignorar errores de parseo
            }
          }

          variantesArray.forEach((v: any) => {
            if (!v || !v.nombre) return
            const nombre = String(v.nombre)
            const valores = v.posibilidades ?? v.valores ?? []
            if (!Array.isArray(valores) || valores.length === 0) return

            const claveNombre = nombre.toLowerCase().trim()
            let existente = variantesDefinicion.find(
              d => d.nombre.toLowerCase().trim() === claveNombre
            )
            if (!existente) {
              variantesDefinicion.push({ nombre, valores: [...valores] })
            } else {
              valores.forEach((val: any) => {
                if (!existente!.valores.includes(val)) {
                  existente!.valores.push(val)
                }
              })
            }
          })
        })

        if (variantesDefinicion.length === 0) {
          console.log('⚠️ [VARIANTES] No se pudieron extraer variantes de los recursos, saltando regeneración')
          setAutoRegeneracionVariantesRealizada(true)
          return
        }

        console.log('🔄 [VARIANTES] Regeneración automática con definición:', variantesDefinicion)
        await regenerarVariantes(variantesDefinicion)
        await getVariantes()
      } catch (error) {
        console.error('❌ [VARIANTES] Error en regeneración automática:', error)
      } finally {
        setAutoRegeneracionVariantesRealizada(true)
      }
    }

    run()
  }, [isNewProduct, id, costRows, autoRegeneracionVariantesRealizada, regenerarVariantes, getVariantes, variantes])

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

        // Cargar variantes desde el producto guardado en Supabase
        // IMPORTANTE: Verificar también el campo 'variante' (singular) que es el que se guarda en Supabase
        const variantesDelProducto = data.variante || data.variantes || []
        const tieneVariantes = Array.isArray(variantesDelProducto) && variantesDelProducto.length > 0

        if (tieneVariantes) {
          console.log('📦 Cargando variantes desde el producto:', variantesDelProducto.length, 'variante(s)')
          // Convertir variantes del formato migrado (valores) al formato esperado (posibilidades)
          const variantesConvertidas = variantesDelProducto.map((v: any) => {
            const valores = v.valores ?? []
            const posibilidades = v.posibilidades ?? []
            const valoresArray = Array.isArray(valores) ? valores : []
            const posibilidadesArray = Array.isArray(posibilidades) ? posibilidades : []

            // Usar el array que tenga datos
            const valoresFinales = valoresArray.length > 0 ? valoresArray : posibilidadesArray

            // Detectar si es modo color: si algún valor contiene un código hexadecimal
            const esColorMode = valoresFinales.some((val: string) =>
              typeof val === 'string' && val.includes(':') && /^#[0-9A-Fa-f]{6}$/i.test(val.split(':')[1]?.trim())
            )

            return {
              ...v,
              nombre: v.nombre,
              valores: valoresFinales,
              posibilidades: valoresFinales,
              modo: v.modo || (esColorMode ? 'color' : 'lista')
            }
          })
          setVariantes(variantesConvertidas)
        } else {
          // Si no tiene variantes pero tiene receta, intentar regenerarlas automáticamente
          const tieneReceta = data.receta && (
            (Array.isArray(data.receta) && data.receta.length > 0) ||
            (typeof data.receta === 'object' && data.receta.items && Array.isArray(data.receta.items) && data.receta.items.length > 0)
          )

          if (tieneReceta) {
            console.log('⚠️ Producto tiene receta pero no variantes. Se regenerarán automáticamente cuando se carguen los recursos.')
          }
          setVariantes([])
        }

        // Cargar variantes del producto desde la BD
        // FIX variantes: carga directa sin setTimeout; la regeneración automática se gestiona en un useEffect dedicado
        await getVariantes()

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

  // Funciones para selección múltiple de variantes
  const variantesVisibles = variantesProducto.filter(v => v && v.id)
  const variantesIds = variantesVisibles.map(v => String(v.id))
  const allVariantesSelected = variantesIds.length > 0 && variantesIds.every(id => selectedVariantes[id])
  const someVariantesSelected = variantesIds.some(id => selectedVariantes[id])
  const selectedVariantesIds = Object.keys(selectedVariantes).filter(id => selectedVariantes[id])
  const selectedVariantesCount = selectedVariantesIds.length

  const toggleAllVariantes = (checked: boolean) => {
    const next: Record<string, boolean> = {}
    variantesIds.forEach(id => { next[String(id)] = checked })
    setSelectedVariantes(next)
  }

  const toggleVariante = (varianteId: string, checked: boolean) => {
    setSelectedVariantes(prev => ({ ...prev, [String(varianteId)]: checked }))
  }

  // Función auxiliar para redondear a 2 decimales
  const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

  // Función para calcular utilidad neta usando los mismos parámetros de la calculadora principal
  // Devuelve { valor, porcentaje }
  const calcularUtilidadNeta = (costeVariante: number, precioVariante: number): { valor: number, porcentaje: number } => {
    // Obtener porcentajes de la calculadora principal
    const facturaRow = priceRows.find(r => r.campo === "Factura")
    const iueRow = priceRows.find(r => r.campo === "IUE")
    const comisionRow = priceRows.find(r => r.campo === "Comision")

    const facturaPctConfig = parseNum(facturaRow?.porcentajeConfig ?? facturaRow?.porcentaje ?? 16)
    const iuePctConfig = parseNum(iueRow?.porcentajeConfig ?? iueRow?.porcentaje ?? 2)
    const comPctConfig = parseNum(comisionRow?.porcentajeConfig ?? comisionRow?.porcentaje ?? 12)

    const facturaPct = facturaPctConfig / 100
    const iuePct = iuePctConfig / 100

    const facturaVal = round2(precioVariante * facturaPct)
    const iueVal = round2(precioVariante * iuePct)

    const costosTotales = round2(costeVariante + facturaVal + iueVal)
    const utilidadBruta = round2(precioVariante - costosTotales)
    const comPct = comPctConfig / 100
    const comisionVal = round2(utilidadBruta * comPct)
    const utilidadNeta = round2(utilidadBruta - comisionVal)

    // Calcular porcentaje sobre el precio
    const utilidadNetaPct = precioVariante > 0 ? round2((utilidadNeta / precioVariante) * 100) : 0

    return { valor: utilidadNeta, porcentaje: utilidadNetaPct }
  }

  // Función para manejar cambios en una SOLA variante (edición individual en la tabla)
  const handleSingleVarianteFieldChange = (varianteId: string, field: 'precio_override' | 'dif_precio', value: number) => {
    const precioBaseProducto = parseFloat(formData.precio_venta) || (producto?.precio_venta || 0)

    let update: { precio_override?: number, dif_precio?: number } = {}

    if (field === 'precio_override') {
      // Si cambia precio_override, calcular dif_precio
      const nuevoPrecio = value
      const nuevaDif = nuevoPrecio - precioBaseProducto
      update = {
        ...(pendingChangesVariantes[varianteId] || {}),
        precio_override: nuevoPrecio,
        dif_precio: nuevaDif
      }
    } else if (field === 'dif_precio') {
      // Si cambia dif_precio, calcular precio_override
      const nuevaDif = value
      const nuevoPrecio = precioBaseProducto + nuevaDif
      update = {
        ...(pendingChangesVariantes[varianteId] || {}),
        dif_precio: nuevaDif,
        precio_override: nuevoPrecio
      }
    }

    setPendingChangesVariantes(prev => ({ ...prev, [varianteId]: update }))
  }

  // Función para manejar cambios MASIVOS en Precio Variante y Dif. Precio (desde la barra azul)
  const handleBulkVarianteFieldChange = (field: 'precio_override' | 'dif_precio', value: number) => {
    const precioBaseProducto = parseFloat(formData.precio_venta) || (producto?.precio_venta || 0)
    const updates: Record<string, { precio_override?: number, dif_precio?: number }> = {}

    selectedVariantesIds.forEach(varianteId => {
      // Buscar variante comparando como string
      const variante = variantesVisibles.find(v => String(v.id) === varianteId)
      if (!variante) return

      if (field === 'precio_override') {
        // Si cambia precio_override, calcular dif_precio
        const nuevoPrecio = value
        const nuevaDif = nuevoPrecio - precioBaseProducto
        updates[varianteId] = {
          ...(pendingChangesVariantes[varianteId] || {}),
          precio_override: nuevoPrecio,
          dif_precio: nuevaDif
        }
      } else if (field === 'dif_precio') {
        // Si cambia dif_precio, calcular precio_override
        const nuevaDif = value
        const nuevoPrecio = precioBaseProducto + nuevaDif
        updates[varianteId] = {
          ...(pendingChangesVariantes[varianteId] || {}),
          dif_precio: nuevaDif,
          precio_override: nuevoPrecio
        }
      }
    })

    setPendingChangesVariantes(prev => ({ ...prev, ...updates }))
    toast.info(`Campo ${field === 'precio_override' ? 'Precio Variante' : 'Dif. Precio'} actualizado para ${selectedVariantesCount} variante(s)`)
  }

  // Función para guardar cambios masivos
  const handleSaveBulkVariantes = async () => {
    if (Object.keys(pendingChangesVariantes).length === 0) {
      toast.warning('No hay cambios pendientes para guardar')
      return
    }

    setSavingBulkVariantes(true)
    console.log('💾 [GUARDAR VARIANTES] Iniciando guardado...')
    console.log('💾 [GUARDAR VARIANTES] Cambios pendientes:', pendingChangesVariantes)

    try {
      const results = await Promise.all(
        Object.entries(pendingChangesVariantes).map(async ([varianteId, changes]) => {
          if (!id || id === 'nuevo' || id === 'new') {
            throw new Error('El producto debe estar guardado primero')
          }

          const payload: {
            variante_id: string
            producto_id: string
            precio_override: number | null
            dif_precio?: number | null
          } = {
            variante_id: varianteId,
            producto_id: id,
            precio_override: changes.precio_override !== undefined ? changes.precio_override : null,
            // FIX variantes: guardar también dif_precio en producto_variantes
            dif_precio: changes.dif_precio !== undefined ? changes.dif_precio : null
          }

          console.log('💾 [GUARDAR VARIANTES] Enviando:', payload)

          const response = await fetch('/api/productos/variantes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })

          const result = await response.json()
          console.log('💾 [GUARDAR VARIANTES] Respuesta:', result)

          if (!response.ok) {
            if (result.code === 'VARIANTE_NOT_FOUND') {
              throw new Error('Las variantes no existen en la base de datos. Guarda el producto primero para generarlas.')
            }
            throw new Error(result.error || 'Error al guardar variante')
          }

          return result
        })
      )

      console.log('💾 [GUARDAR VARIANTES] Todos los resultados:', results)

      toast.success(`${Object.keys(pendingChangesVariantes).length} variante(s) actualizada(s) correctamente`)
      setPendingChangesVariantes({})
      setSelectedVariantes({})
      await getVariantes()
    } catch (error) {
      console.error('❌ Error guardando cambios masivos:', error)
      toast.error(error instanceof Error ? error.message : 'Error al guardar cambios')
    } finally {
      setSavingBulkVariantes(false)
    }
  }

  // Función para descartar cambios pendientes
  const handleDiscardBulkVariantes = () => {
    setPendingChangesVariantes({})
    toast.info('Cambios descartados')
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

      // Si el campo está vacío, para Factura e IUE poner 0 en lugar de null
      if (pctStr === "" || pctStr.trim() === "") {
        if (["Factura", "IUE", "Comision"].includes(row.campo)) {
          // Para campos editables, poner 0 en lugar de null para mantener el campo editable
          row.porcentajeConfig = 0
          row.porcentaje = 0
          // Recalcular si hay un precio
          const precioActual = parseNum(rowsCopy.find((r: any) => r.campo === "Precio")?.valor ?? 0)
          if (precioActual > 0) {
            return recalcFromTargetPriceVariante(precioActual, rowsCopy)
          }
        } else {
          row.porcentaje = null
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
  function capitalizar(str: string = "") {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  const formatearCombinacion = (key: string): string => {
    if (!key || typeof key !== 'string') return key || '';
    
    return key
      .split("|")
      .map(parte => {
        if (!parte || !parte.includes(":")) return parte.trim();
        const [k, v] = parte.split(":");
        const keyPart = (k || '').trim();
        const valuePart = (v || '').trim();
        if (!keyPart || !valuePart) return parte.trim();
        return `${capitalizar(keyPart)}: ${capitalizar(valuePart)}`;
      })
      .filter(part => part && part.length > 0)
      .join(" | ");
  }

  /**
   * Normaliza la combinación del producto para que coincida con las claves de control_stock del recurso.
   * 
   * FIX variantes:
   * - Toma SOLO las variantes que pertenecen a este recurso (según recurso.variantes)
   * - Para cada variante del recurso, usa SOLO el VALOR (A, B, 1, 2...), ignorando el nombre ("tamaño", "grosor", etc.)
   * - Elimina duplicados como "Grosor: 1" y "Grosor: 10 Oz" quedándose solo con la posibilidad válida
   *   (la que existe en las posibilidades/valores del recurso)
   * - Mantiene siempre la sucursal (SOLO el valor, sin "Sucursal:")
   * - Devuelve una clave en el mismo formato que control_stock:
   *     "<valor variante> | <nombre sucursal>"
   * 
   * Ejemplo de entrada:
   *   "tamaño: A | Grosor: 1 | Sucursal: La Paz"
   * Ejemplo de salida:
   *   "A | La Paz"
   */
  const normalizarCombinacionParaRecurso = (combinacionProducto: string, recurso: any): string => {
    if (!combinacionProducto || !recurso) {
      return combinacionProducto
    }

    try {
      // 1. Separar la combinación en partes "Nombre: Valor"
      const partes = combinacionProducto
        .split('|')
        .map(p => p.trim())
        .filter(p => p.length > 0 && p.includes(':'))

      // 2. Obtener la definición de variantes del recurso en TODOS los formatos soportados
      let variantesArray: any[] = []
      if (Array.isArray(recurso.variantes)) {
        variantesArray = recurso.variantes
      } else if (
        recurso.variantes &&
        typeof recurso.variantes === 'object' &&
        Array.isArray(recurso.variantes.variantes)
      ) {
        variantesArray = recurso.variantes.variantes
      } else if (typeof recurso.variantes === 'string') {
        try {
          const parsed = JSON.parse(recurso.variantes)
          if (Array.isArray(parsed)) {
            variantesArray = parsed
          } else if (parsed && Array.isArray(parsed.variantes)) {
            variantesArray = parsed.variantes
          }
        } catch {
          // Ignorar errores de parseo: en ese caso no tendremos variantes definidas
        }
      }

      // Mapa: nombreVariante -> lista de posibilidades válidas (como strings limpias)
      const mapaVariantes = new Map<string, string[]>()
      variantesArray.forEach((v: any) => {
        if (!v || !v.nombre) return
        const nombre = String(v.nombre).trim()
        const posibilidades = Array.isArray(v.posibilidades)
          ? v.posibilidades
          : Array.isArray(v.valores)
            ? v.valores
            : []
        const valoresLimpios = posibilidades
          .map((val: any) => String(val).trim())
          .filter(val => val.length > 0)
        if (valoresLimpios.length > 0) {
          mapaVariantes.set(nombre, valoresLimpios)
        }
      })

      const nombresVariantes = Array.from(mapaVariantes.keys())

      // 3. Recoger SOLO los VALORES seleccionados para cada variante del recurso
      const valoresSeleccionados: string[] = []

      // Helper para obtener nombre y valor de una parte "Nombre: Valor"
      const parseParte = (parte: string): { nombre: string; valor: string } | null => {
        const [nombreRaw, ...resto] = parte.split(':')
        if (!nombreRaw || resto.length === 0) return null
        const nombre = nombreRaw.trim()
        const valor = resto.join(':').trim()
        if (!nombre || !valor) return null
        return { nombre, valor }
      }

      // Primero, localizar los valores que corresponden a variantes del recurso
      nombresVariantes.forEach(nombreVariante => {
        const posibilidadesValidas = mapaVariantes.get(nombreVariante) || []
        const nombreVarianteLower = nombreVariante.toLowerCase().trim()

        // Buscar todas las partes cuya clave coincide con este nombre de variante
        const partesCandidatas = partes
          .map(p => ({ raw: p, parsed: parseParte(p) }))
          .filter(item => {
            if (!item.parsed) return false
            const nombreParteLower = item.parsed.nombre.toLowerCase()
            return nombreParteLower === nombreVarianteLower
          })

        if (partesCandidatas.length === 0) {
          return
        }

        // Entre las candidatas, quedarnos SOLO con las cuyo valor está en las posibilidades del recurso
        const candidatasValidas = partesCandidatas.filter(item => {
          if (!item.parsed) return false
          const valorParte = item.parsed.valor.trim()
          // Comparación case-insensitive
          return posibilidadesValidas.some(
            pos => pos.toLowerCase() === valorParte.toLowerCase()
          )
        })

        let seleccion: string | null = null

        if (candidatasValidas.length > 0) {
          // Si hay varias válidas, elegir la más larga (más específica)
          seleccion = candidatasValidas
            .map(c => c.raw)
            .reduce((prev, curr) => (curr.length > prev.length ? curr : prev))
        } else {
          // Si ninguna coincide con posibilidades, como fallback usar la más larga de las candidatas originales
          seleccion = partesCandidatas
            .map(c => c.raw)
            .reduce((prev, curr) => (curr.length > prev.length ? curr : prev))
        }

        if (seleccion) {
          const parsedSel = parseParte(seleccion)
          if (parsedSel && parsedSel.valor.trim().length > 0) {
            // Guardar SOLO el valor (ej: "A", "B", "12 Oz")
            valoresSeleccionados.push(parsedSel.valor.trim())
          }
        }
      })

      // 4. Siempre incluir Sucursal si existe en la combinación original
      // IMPORTANTE: Solo el VALOR de la sucursal, SIN el texto "Sucursal:"
      let sucursalValor: string | null = null
      const parteSucursal = partes.find(p => {
        const parsed = parseParte(p)
        if (!parsed) return false
        return parsed.nombre.toLowerCase() === 'sucursal'
      })
      if (parteSucursal) {
        const parsedSucursal = parseParte(parteSucursal)
        if (parsedSucursal && parsedSucursal.valor.trim().length > 0) {
          // Solo el valor: "La Paz", "Santa Cruz", NO "Sucursal: La Paz"
          sucursalValor = parsedSucursal.valor.trim()
        }
      }

      // 5. Reconstruir clave limpia en el formato EXACTO que usa control_stock:
      //    "<valor variante> | <nombre sucursal>"
      //    Ejemplo: "A | La Paz", "B | Santa Cruz"
      const partesClave: string[] = []
      partesClave.push(...valoresSeleccionados)
      if (sucursalValor) {
        // Añadir solo el valor de la sucursal, sin prefijo
        partesClave.push(sucursalValor)
      }

      if (partesClave.length === 0) {
        // Si no se pudo normalizar, devolver la combinación original para no romper nada
        return combinacionProducto
      }

      const claveFinal = partesClave.join(' | ')
      console.log('🔍 [NORMALIZAR] Combinación original:', combinacionProducto)
      console.log('🔍 [NORMALIZAR] Recurso:', recurso?.nombre)
      console.log('🔍 [NORMALIZAR] Clave normalizada generada:', claveFinal)
      return claveFinal
    } catch (error) {
      console.error('❌ Error normalizando combinación:', error)
      return combinacionProducto
    }
  }

  /**
   * Obtiene el precioVariante de un recurso específico desde su control_stock
   * para una combinación de variantes dada.
   * 
   * REGLAS:
   * - Si el recurso NO tiene variantes → usar recurso.coste como precioVariante
   * - Si el recurso SÍ tiene variantes:
   *    - Normalizar combinación y buscar coincidencia EXACTA en control_stock
   *    - Si hay coincidencia → usar precioVariante
   *    - Si NO hay coincidencia o no hay control_stock válido → usar coste base como fallback seguro
   * 
   * // FIX variantes: distinguir recursos con/sin variantes y usar control_stock cuando exista
   */
  /**
   * Obtiene el precioVariante de un recurso específico usando el VariantEngine
   */
  const getDatosRecursoVariante = (
    recurso: any,
    combinacionProducto: string
  ): { precioVariante: number, diferenciaPrecio: number } => {
    // Parsear combinación string a objeto
    const valores = parsearClaveVariante(combinacionProducto)

    // Usar engine para encontrar el precio correcto
    const precio = findResourceVariantPrice(recurso, valores)
    const costeBase = Number(recurso.coste) || 0

    return {
      precioVariante: precio,
      diferenciaPrecio: precio - costeBase
    }
  }

  /**
   * Calcula el coste de la variante y la diferencia con el coste base.
   * 
   * FÓRMULA solicitada:
   * coste_variante = Σ( costes_recursos_SIN_variantes ) + Σ( precioVariante_recursos_CON_variantes )
   * dif_coste = coste_variante - coste_base_producto
   * 
   * @param variante - Variante del producto con su combinación
   * @returns { costeVariante, difCoste }
   */
  const calcularCosteVariante = (variante: any): { costeVariante: number, difCoste: number } => {
    const costeBaseProducto = totalCost || 0
    const defaultResult = { costeVariante: Math.round(costeBaseProducto * 100) / 100, difCoste: 0 }

    if (!variante || !variante.combinacion || costRows.length === 0) {
      return defaultResult
    }

    try {
      const combinacionProducto = variante.combinacion
      let costeRecursosSinVariantes = 0
      let costeRecursosConVariantes = 0

      costRows.forEach(row => {
        if (!row.selectedRecurso || !row.selectedRecurso.id) {
          return
        }

        const recurso = row.selectedRecurso
        const cantidad = Number(row.cantidad) || 1
        const costeBaseRecurso = Number(recurso.coste) || 0

        let controlStock: any = null
        if (typeof recurso.control_stock === 'string') {
          try {
            controlStock = JSON.parse(recurso.control_stock)
          } catch {
            controlStock = null
          }
        } else if (typeof recurso.control_stock === 'object' && recurso.control_stock !== null) {
          controlStock = recurso.control_stock
        }

        // Detectar recursos con variantes por variantes[] O control_stock
        // Intentar parsear si es string JSON
        let variantesParsed: any = null
        if (typeof recurso.variantes === 'string') {
          try {
            variantesParsed = JSON.parse(recurso.variantes)
          } catch {
            variantesParsed = null
          }
        } else {
          variantesParsed = recurso.variantes
        }

        const tieneVariantesPorDefinicion =
          (Array.isArray(recurso.variantes) && recurso.variantes.length > 0) ||
          (Array.isArray(variantesParsed) && variantesParsed.length > 0) ||
          (recurso.variantes &&
            typeof recurso.variantes === 'object' &&
            Array.isArray(recurso.variantes.variantes) &&
            recurso.variantes.variantes.length > 0) ||
          (variantesParsed &&
            typeof variantesParsed === 'object' &&
            Array.isArray(variantesParsed.variantes) &&
            variantesParsed.variantes.length > 0)

        const tieneVariantesPorControlStock =
          controlStock && typeof controlStock === 'object' && Object.keys(controlStock).length > 0

        const tieneVariantes = tieneVariantesPorDefinicion || tieneVariantesPorControlStock

        // DEBUG: Log para ver qué está pasando
        console.log(`🔍 [DETECTAR] Recurso: ${recurso?.nombre}`)
        console.log(`🔍 [DETECTAR]   - recurso.variantes (raw):`, recurso.variantes)
        console.log(`🔍 [DETECTAR]   - variantesParsed:`, variantesParsed)
        console.log(`🔍 [DETECTAR]   - tieneVariantesPorDefinicion:`, tieneVariantesPorDefinicion)
        console.log(`🔍 [DETECTAR]   - controlStock keys:`, controlStock ? Object.keys(controlStock) : 'null')
        console.log(`🔍 [DETECTAR]   - tieneVariantesPorControlStock:`, tieneVariantesPorControlStock)
        console.log(`🔍 [DETECTAR]   - tieneVariantes (FINAL):`, tieneVariantes)

        if (tieneVariantes) {
          // Recurso CON variantes: obtener precioVariante del control_stock (con fallback a coste base)
          const datos = getDatosRecursoVariante(recurso, combinacionProducto)
          const precioVarianteRecurso = Number.isFinite(datos.precioVariante)
            ? datos.precioVariante
            : costeBaseRecurso
          console.log(`💰 [CALCULAR] Recurso CON variantes: ${recurso?.nombre}`)
          console.log(`💰 [CALCULAR]   - costeBase: ${costeBaseRecurso}, precioVariante: ${precioVarianteRecurso}, cantidad: ${cantidad}`)
          costeRecursosConVariantes += precioVarianteRecurso * cantidad
        } else {
          // Recurso SIN variantes: usar siempre su coste base
          console.log(`💰 [CALCULAR] Recurso SIN variantes: ${recurso?.nombre}`)
          console.log(`💰 [CALCULAR]   - costeBase: ${costeBaseRecurso}, cantidad: ${cantidad}`)
          costeRecursosSinVariantes += costeBaseRecurso * cantidad
        }
      })

      const costeVariante = Math.round((costeRecursosSinVariantes + costeRecursosConVariantes) * 100) / 100
      const difCoste = Math.round((costeVariante - costeBaseProducto) * 100) / 100

      console.log("💰 [CALCULAR] RESULTADO FINAL:")
      console.log("💰 [CALCULAR]   - costeRecursosSinVariantes:", costeRecursosSinVariantes)
      console.log("💰 [CALCULAR]   - costeRecursosConVariantes:", costeRecursosConVariantes)
      console.log("💰 [CALCULAR]   - costeBaseProducto (totalCost):", costeBaseProducto)
      console.log("[VARIANTE] Coste calculado:", costeVariante, "para combinación:", combinacionProducto)
      return { costeVariante, difCoste }
    } catch (error) {
      console.error('❌ Error calculando coste de variante:', error)
      return defaultResult
    }
  }

  /**
   * Función legacy para compatibilidad - usa calcularCosteVariante internamente
   */
  const getDiferenciaControlStock = (variante: any): number => {
    return calcularCosteVariante(variante).difCoste
  }

  /**
   * Calcula el coste final de una variante del producto.
   * 
   * FÓRMULA: coste_variante = Σ(costes_sin_variantes) + Σ(precioVariante_con_variantes)
   * 
   * @param variante - Variante del producto
   * @returns Coste final de la variante
   */
  const getCosteFinal = (variante: any): number => {
    if (!variante) {
      return totalCost || 0
    }

    // Si hay override, usar ese (tiene máxima prioridad)
    if (variante.coste_override !== null && variante.coste_override !== undefined) {
      return variante.coste_override
    }

    // Usar la nueva función que calcula correctamente
    return calcularCosteVariante(variante).costeVariante
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
      // FIX variantes: usar las variantes que ya están guardadas en el producto (estado "variantes")
      //                y solo reconstruirlas desde costRows si no hay variantes guardadas
      let variantesDefinicionProducto: { nombre: string; valores: any[] }[] = []

      // PRIORIDAD 1: Usar las variantes que ya están en el estado (cargadas desde el producto)
      if (variantes.length > 0) {
        console.log('💾 [GUARDAR] Usando variantes del estado:', variantes.length, 'variante(s)')
        variantesDefinicionProducto = variantes.map((v: any) => {
          const valores = v.valores ?? v.posibilidades ?? []
          return {
            nombre: v.nombre,
            valores: Array.isArray(valores) ? valores : []
          }
        }).filter((v: any) => v.nombre && v.valores.length > 0)
      }

      // PRIORIDAD 2: Si no hay variantes en el estado, construir desde costRows
      if (variantesDefinicionProducto.length === 0) {
        console.log('💾 [GUARDAR] No hay variantes en estado, construyendo desde costRows...')
        costRows.forEach(row => {
          const recurso = row.selectedRecurso
          if (!recurso?.variantes) return

          let variantesArray: any[] = []
          if (Array.isArray(recurso.variantes)) {
            variantesArray = recurso.variantes
          } else if (
            typeof recurso.variantes === 'object' &&
            Array.isArray(recurso.variantes.variantes)
          ) {
            variantesArray = recurso.variantes.variantes
          } else if (typeof recurso.variantes === 'string') {
            try {
              const parsed = JSON.parse(recurso.variantes)
              if (Array.isArray(parsed)) {
                variantesArray = parsed
              } else if (parsed && Array.isArray(parsed.variantes)) {
                variantesArray = parsed.variantes
              }
            } catch {
              // ignorar errores de parseo
            }
          }

          variantesArray.forEach((v: any) => {
            if (!v || !v.nombre) return
            const nombre = String(v.nombre)
            const valores = v.posibilidades ?? v.valores ?? []
            if (!Array.isArray(valores) || valores.length === 0) return

            const claveNombre = nombre.toLowerCase().trim()
            let existente = variantesDefinicionProducto.find(
              d => d.nombre.toLowerCase().trim() === claveNombre
            )
            if (!existente) {
              variantesDefinicionProducto.push({ nombre, valores: [...valores] })
            } else {
              valores.forEach((val: any) => {
                if (!existente!.valores.includes(val)) {
                  existente!.valores.push(val)
                }
              })
            }
          })
        })
      }

      const varianteLimpia = variantesDefinicionProducto

      console.log('💾 [GUARDAR] Variantes finales a guardar:', varianteLimpia.length, 'variante(s)', JSON.stringify(varianteLimpia, null, 2))

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
        receta: Array.isArray(recetaArray) ? recetaArray : [], // FIX 2: Receta SIEMPRE es array, nunca null
        calculadora_precios: calculadoraPrecios,
        proveedores: proveedoresSanitizados.length > 0 ? proveedoresSanitizados : null
      }

      // FIX variantes: Solo enviar variante si hay variantes para guardar
      // Si está vacío pero es un producto existente, no enviar el campo para no sobrescribir las existentes
      if (varianteLimpia.length > 0) {
        dataToSend.variante = varianteLimpia
        console.log('💾 [GUARDAR] Enviando variantes:', varianteLimpia.length, 'variante(s)')
      } else if (isNewProduct) {
        // Si es un producto nuevo y no hay variantes, enviar null
        dataToSend.variante = null
        console.log('💾 [GUARDAR] Producto nuevo sin variantes, enviando null')
      } else {
        // Si es un producto existente y no hay variantes, NO enviar el campo para no sobrescribir
        console.log('💾 [GUARDAR] Producto existente sin variantes nuevas, NO enviando campo variante para preservar las existentes')
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

        // FIX 6: Sincronizar variantes después de guardar usando syncProductVariants
        // Esto asegura que las variantes se reconstruyan desde la receta guardada en la BD
        if (updated.id) {
          try {
            console.log("🔄 [SYNC] Sincronizando variantes para producto:", updated.id)
            const syncResponse = await fetch(`/api/productos/variantes`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                producto_id: updated.id,
                action: 'sync'
              })
            })

            if (syncResponse.ok) {
              const syncData = await syncResponse.json()
              console.log('✅ Variantes sincronizadas correctamente:', syncData)
              
              // Recargar variantes después de sincronizar
              setTimeout(() => {
                getVariantes()
              }, 500)
            } else {
              const errorData = await syncResponse.json().catch(() => ({}))
              console.warn('⚠️ No se pudieron sincronizar variantes automáticamente:', errorData.error || 'Error desconocido')
            }
          } catch (syncError) {
            console.error('❌ Error sincronizando variantes:', syncError)
            // No bloquear el guardado si falla la sincronización
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
    // 1. Actualizar la fila de coste
    setCostRows(prev =>
      prev.map(row =>
        row.id === rowId
          ? {
              ...row,
              selectedRecurso: recurso,
              unidad: recurso.unidad_medida,
              searchTerm: recurso.nombre
            }
          : row
      )
    );
    setShowCostDropdown(null);

    // 2. Normalizar variantes del recurso (ya limpiadas en backend)
    let variantesArray = Array.isArray(recurso.variantes)
      ? recurso.variantes
      : [];

    // Asegurar estructura consistente
    variantesArray = variantesArray
      .filter(v => v && v.nombre && Array.isArray(v.valores))
      .map(v => ({
        nombre: v.nombre.trim(),
        valores: v.valores.map((valor: any) => String(valor).trim())
      }));

    if (variantesArray.length === 0) {
      console.log(`ℹ️ Recurso "${recurso.nombre}" no tiene variantes válidas`);
      return;
    }

    // 3. Agregar variantes sin duplicar dimensiones
    setVariantes(prev => {
      const map = new Map<string, Set<string>>();

      // Insertar las existentes
      prev.forEach(v => {
        if (!map.has(v.nombre)) map.set(v.nombre, new Set());
        v.valores?.forEach((val: string) => map.get(v.nombre)!.add(val));
      });

      // Insertar las nuevas
      variantesArray.forEach(v => {
        if (!map.has(v.nombre)) map.set(v.nombre, new Set());
        v.valores.forEach((val: string) => map.get(v.nombre)!.add(val));
      });

      // Convertir a lista normalizada
      const finalList = Array.from(map.entries()).map(([nombre, valores]) => ({
        nombre,
        valores: Array.from(valores)
      }));

      toast.success(`${variantesArray.length} variante(s) importada(s) desde el recurso`);
      return finalList;
    });
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

      // Regenerar variantes basándose en los recursos que quedan en la receta
      // IMPORTANTE: Preservar las variantes que NO tienen recurso_id (las importadas del producto)
      let variantesFinalesParaBD: any[] = []
      
      setVariantes(prev => {
        // Si el recurso tenía variantes importadas, eliminarlas también del estado local
        let variantesActualizadas = prev
        if (recursoIdToRemove) {
          const eliminadas = prev.filter(v => v.recurso_id === recursoIdToRemove)
          if (eliminadas.length > 0) {
            toast.info(`${eliminadas.length} variante(s) eliminada(s) al quitar el recurso "${recursoNombreToRemove}"`)
          }
          variantesActualizadas = prev.filter(v => v.recurso_id !== recursoIdToRemove)
        }
        
        // Obtener las variantes que NO tienen recurso_id (las importadas del producto)
        const variantesDelProducto = variantesActualizadas.filter(v => !v.recurso_id)
        
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

        // Normalizar variantes de recursos restantes
        const variantesDeRecursosNormalizadas = variantesDeRecursosRestantes
          .filter(v => v && v.nombre && (Array.isArray(v.valores) || Array.isArray(v.posibilidades)))
          .map(v => ({
            nombre: v.nombre.trim(),
            valores: (v.valores || v.posibilidades || []).map((val: any) => String(val).trim()),
            recurso_id: v.recurso_id,
            recurso_nombre: v.recurso_nombre
          }))

        // Combinar variantes del producto con variantes de recursos restantes
        // Usar un Map para evitar duplicados por nombre, priorizando las del producto
        const map = new Map<string, any>()
        
        // Primero agregar las variantes del producto (sin recurso_id)
        variantesDelProducto.forEach(v => {
          const nombre = v.nombre?.trim()
          if (nombre) {
            map.set(nombre, {
              nombre,
              valores: Array.isArray(v.valores) ? v.valores : (Array.isArray(v.posibilidades) ? v.posibilidades : [])
            })
          }
        })
        
        // Luego agregar/actualizar con variantes de recursos (solo si no existe ya)
        variantesDeRecursosNormalizadas.forEach(v => {
          const nombre = v.nombre?.trim()
          if (nombre && !map.has(nombre)) {
            map.set(nombre, {
              nombre,
              valores: v.valores,
              recurso_id: v.recurso_id,
              recurso_nombre: v.recurso_nombre
            })
          }
        })

        // Convertir a lista final
        const variantesFinales = Array.from(map.values())
        
        // Guardar variantes finales para usar en la regeneración de BD
        variantesFinalesParaBD = variantesFinales.map(v => ({
          nombre: v.nombre,
          valores: Array.isArray(v.valores) ? v.valores : []
        }))
        
        return variantesFinales
      })

      // Si hay un producto guardado, regenerar variantes en la BD
      if (!isNewProduct && id) {
        try {
          // Usar las variantes finales (que incluyen las del producto)
          const variantesLimpias = variantesFinalesParaBD.filter(v => v && v.nombre && v.valores && v.valores.length > 0)

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

      // Si el campo está vacío, para Factura e IUE poner 0 en lugar de null
      if (pctStr === "" || pctStr.trim() === "") {
        if (["Factura", "IUE", "Comision"].includes(row.campo)) {
          // Para campos editables, poner 0 en lugar de null para mantener el campo editable
          row.porcentajeConfig = 0
          row.porcentaje = 0
          // Recalcular si hay un precio
          const precioActual = parseNum(rowsCopy.find((r: any) => r.campo === "Precio")?.valor ?? 0)
          if (precioActual > 0) {
            return recalcFromTargetPrice(precioActual, rowsCopy)
          }
        } else {
          row.porcentaje = null
        }
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
                            {!categoriasLoading && categoriasProductos.map((categoria) => (
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
                            {!unidadesLoading && unidadesMedida.map((unidad) => (
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
                      // Buscar valores en ambos campos para compatibilidad (valores es el formato migrado, posibilidades es el formato antiguo)
                      const valoresArray = variante.valores ?? variante.posibilidades ?? []
                      const posibilidadesTexto = Array.isArray(valoresArray) && valoresArray.length > 0
                        ? valoresArray.map((pos: string) => {
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
                    )
                  })}

                  <Button onClick={handleAddCostRow} variant="outline" size="sm" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Añadir Línea
                  </Button>
                </div>

                {/* Total y Aplicar Coste */}
                <div className="border-t pt-4 mt-4">
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
                      className={`ml-auto transition-all duration-300 transform ${costApplied
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
                    // Para campos editables (Factura, IUE, Comision), SIEMPRE mostrar el campo
                    const esCampoEditablePorcentaje = ["Factura", "IUE", "Comision", "Comisión", "Comisión (C)"].includes(row.campo)
                    let showPorcentaje =
                      esCampoEditablePorcentaje || // Siempre mostrar para campos editables
                      row.porcentaje != null      // Para otros campos, mostrar solo si tienen porcentaje
                    // Para Comisión, SIEMPRE mostrar porcentajeConfig (valor original del usuario)
                    // Para Factura e IUE, mostrar porcentajeConfig si existe, sino porcentaje, sino 0
                    // Para otros campos, mostrar porcentaje (calculado sobre precio)
                    let porcentajeToShow: number | string | null = row.porcentaje
                    if (row.campo === "Comision" || row.campo === "Comisión" || row.campo === "Comisión (C)") {
                      porcentajeToShow = (row as any).porcentajeConfig != null ? (row as any).porcentajeConfig : ""
                      showPorcentaje = true
                    } else if (row.campo === "Factura" || row.campo === "IUE") {
                      // Para Factura e IUE, mostrar porcentajeConfig si existe, sino porcentaje, sino 0
                      porcentajeToShow = (row as any).porcentajeConfig != null
                        ? (row as any).porcentajeConfig
                        : (row.porcentaje != null ? row.porcentaje : 0)
                      showPorcentaje = true // Siempre mostrar para estos campos editables
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
                    className={`w-full mt-4 transition-all duration-300 transform ${priceApplied
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



            {/* Tabla de Variantes del Producto */}
            {(variantes.length > 0 || variantesProducto.length > 0) && (
              <Card className="lg:col-span-2 mt-8">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Variantes del Producto</CardTitle>
                      <CardDescription>
                        Gestiona costes y precios por variante. Los valores vacíos heredan del producto base.
                      </CardDescription>
                    </div>
                    {variantesProducto.length === 0 && variantes.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          if (!id || id === "nuevo" || id === "new") {
                            toast.error("Primero guarda el producto");
                            return;
                          }

                          const variantesDefinicion = variantes.map(v => ({
                            nombre: v.nombre,
                            valores: v.valores
                          }));

                          if (variantesDefinicion.length === 0) {
                            toast.error("No hay variantes para generar combinaciones");
                            return;
                          }

                          toast.info("Regenerando variantes...");

                          try {
                            const response = await fetch("/api/productos/variantes", {
                              method: "PUT",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                producto_id: id,
                                action: "regenerar",
                                variantes_definicion: variantesDefinicion
                              })
                            });

                            const result = await response.json();

                            if (result.success) {
                              toast.success("Variantes regeneradas");
                              await getVariantes();
                            } else {
                              toast.error("No se pudieron generar variantes");
                            }
                          } catch (err) {
                            toast.error("Error al regenerar variantes");
                            console.error(err);
                          }
                        }}
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Regenerar Variantes
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingVariantes ? (
                    <div className="text-center py-8 text-gray-500">
                      Cargando variantes...
                    </div>
                  ) : variantesProducto.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No hay variantes generadas. Guarda el producto para generar las combinaciones de variantes.
                    </div>
                  ) : (
                    <>
                      {/* Barra azul de edición masiva */}
                      {someVariantesSelected && selectedVariantesCount >= 1 && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium text-blue-800">
                                {selectedVariantesCount} variante{selectedVariantesCount > 1 ? 's' : ''} seleccionada{selectedVariantesCount > 1 ? 's' : ''}
                              </span>

                              {/* Campos de edición masiva solo cuando hay 2+ items */}
                              {selectedVariantesCount >= 2 && (
                                <>
                                  {/* Campo Precio Variante */}
                                  <div className="flex items-center gap-2">
                                    <label className="text-sm text-gray-700">Precio Variante:</label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      placeholder="Aplicar a todos"
                                      className="h-8 w-32 text-right"
                                      onBlur={(e) => {
                                        const value = parseFloat(e.target.value)
                                        if (!isNaN(value) && value > 0) {
                                          handleBulkVarianteFieldChange('precio_override', value)
                                        }
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          const value = parseFloat((e.target as HTMLInputElement).value)
                                          if (!isNaN(value) && value > 0) {
                                            handleBulkVarianteFieldChange('precio_override', value)
                                          }
                                        }
                                      }}
                                    />
                                  </div>

                                  {/* Campo Dif. Precio */}
                                  <div className="flex items-center gap-2">
                                    <label className="text-sm text-gray-700">Dif. Precio:</label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      placeholder="Aplicar a todos"
                                      className="h-8 w-32 text-right"
                                      onBlur={(e) => {
                                        const value = parseFloat(e.target.value)
                                        if (!isNaN(value)) {
                                          handleBulkVarianteFieldChange('dif_precio', value)
                                        }
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          const value = parseFloat((e.target as HTMLInputElement).value)
                                          if (!isNaN(value)) {
                                            handleBulkVarianteFieldChange('dif_precio', value)
                                          }
                                        }
                                      }}
                                    />
                                  </div>
                                </>
                              )}
                            </div>

                            <div className="flex gap-2 items-center">
                              {Object.keys(pendingChangesVariantes).length > 0 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleDiscardBulkVariantes}
                                >
                                  Descartar
                                </Button>
                              )}
                              <Button
                                size="sm"
                                onClick={handleSaveBulkVariantes}
                                disabled={savingBulkVariantes || Object.keys(pendingChangesVariantes).length === 0}
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                {savingBulkVariantes ? "Guardando..." : "Guardar"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-10">
                                <Checkbox
                                  checked={allVariantesSelected ? true : (someVariantesSelected ? 'indeterminate' : false)}
                                  onCheckedChange={(v) => toggleAllVariantes(Boolean(v))}
                                  aria-label="Seleccionar todo"
                                />
                              </TableHead>
                              <TableHead className="min-w-[250px]">Variante</TableHead>
                              <TableHead className="w-[120px] text-right">Coste Variante</TableHead>
                              <TableHead className="w-[120px] text-right">Precio Variante</TableHead>
                              <TableHead className="w-[120px] text-right">Dif. Coste</TableHead>
                              <TableHead className="w-[120px] text-right">Dif. Precio</TableHead>
                              <TableHead className="w-[120px] text-right">Utilidad Neta</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {variantesProducto.filter(v => v && v.id).map((variante, index) => {
                              // ID como string para consistencia
                              const varianteIdStr = String(variante.id)

                              // IMPORTANTE: Usar siempre como referencia el coste base real del producto (totalCost)
                              const costeBaseProducto = totalCost || 0

                              // Priorizar override si existe; luego coste_calculado; fallback al coste base
                              const costeVarianteRaw =
                                (variante.coste_override !== null && variante.coste_override !== undefined
                                  ? variante.coste_override
                                  : (variante.coste_calculado !== null && variante.coste_calculado !== undefined
                                      ? variante.coste_calculado
                                      : costeBaseProducto))

                              // Calcular diferencia respecto al coste base y NUNCA permitir valores negativos
                              const difCosteRaw = costeVarianteRaw - costeBaseProducto
                              const difCoste = difCosteRaw < 0 ? 0 : difCosteRaw

                              // El coste de la variante que se muestra/usa nunca puede ser inferior al coste base
                              const costeVariante = costeBaseProducto + difCoste
                              const costeFinal = costeVariante

                              // Obtener precio base del producto
                              const precioBaseProducto = parseFloat(formData.precio_venta) || (producto?.precio_venta || 0)

                              // La primera variante siempre usa el precio base del producto
                              let precioFinal: number
                              let difPrecio: number

                              // Verificar si hay cambios pendientes para ESTA variante específica
                              const pendingChanges = pendingChangesVariantes[varianteIdStr]

                              // Determinar precio final: pendingChanges > precio_override guardado > precio base
                              if (pendingChanges?.precio_override !== undefined) {
                                // Si hay cambios pendientes, usar esos
                                precioFinal = pendingChanges.precio_override
                                difPrecio = pendingChanges.dif_precio ?? (precioFinal - precioBaseProducto)
                              } else if (variante.precio_override !== null && variante.precio_override !== undefined) {
                                // Si hay precio_override guardado, usarlo
                                precioFinal = variante.precio_override
                                difPrecio = calcularDiferenciaPrecio(precioFinal, precioBaseProducto)
                              } else if (index === 0) {
                                // Primera variante sin override: usar precio base
                                precioFinal = precioBaseProducto
                                difPrecio = 0
                              } else {
                                // Otras variantes sin override: usar precio calculado
                                precioFinal = variante.precio_base || variante.precio_calculado || precioBaseProducto
                                difPrecio = calcularDiferenciaPrecio(precioFinal, precioBaseProducto)
                              }

                              // Calcular utilidad neta (valor y porcentaje)
                              const { valor: utilidadNetaValor, porcentaje: utilidadNetaPct } = calcularUtilidadNeta(costeFinal, precioFinal)

                              // Estado de selección y edición
                              const isSelected = selectedVariantes[varianteIdStr] || false
                              const isEditing = editingVariante[varianteIdStr] !== undefined
                              const editData = editingVariante[varianteIdStr] || {}

                              return (
                                <TableRow
                                  key={variante.id}
                                  className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                                >
                                  <TableCell>
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={(checked) => toggleVariante(varianteIdStr, Boolean(checked))}
                                      aria-label={`Seleccionar variante ${variante.combinacion}`}
                                    />
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {formatearCombinacion(variante.combinacion)}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <span>
                                      Bs {costeVariante.toFixed(2)}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {isSelected ? (
                                      <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={pendingChanges?.precio_override !== undefined ? pendingChanges.precio_override : precioFinal}
                                        onChange={(e) => {
                                          const value = parseFloat(e.target.value) || 0
                                          handleSingleVarianteFieldChange(varianteIdStr, 'precio_override', value)
                                        }}
                                        className="h-8 w-full text-sm text-right"
                                      />
                                    ) : (
                                      <span>
                                        Bs {precioFinal.toFixed(2)}
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <span className={difCoste !== 0 ? (difCoste > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium') : 'text-gray-500'}>
                                      {difCoste > 0 ? '+' : difCoste < 0 ? '-' : ''}{Math.abs(difCoste).toFixed(2)}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {isSelected ? (
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={pendingChanges?.dif_precio !== undefined ? pendingChanges.dif_precio : difPrecio}
                                        onChange={(e) => {
                                          const value = parseFloat(e.target.value) || 0
                                          handleSingleVarianteFieldChange(varianteIdStr, 'dif_precio', value)
                                        }}
                                        className="h-8 w-full text-sm text-right"
                                      />
                                    ) : (
                                      <span className={difPrecio !== 0 ? (difPrecio > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium') : 'text-gray-500'}>
                                        {difPrecio > 0 ? '+' : difPrecio < 0 ? '-' : ''}{Math.abs(difPrecio).toFixed(2)}
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <span className={utilidadNetaPct >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                      {utilidadNetaPct.toFixed(2)}%
                                    </span>
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </>
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
                // Para campos editables (Factura, IUE, Comision), SIEMPRE mostrar el campo
                const esCampoEditablePorcentaje = ["Factura", "IUE", "Comision", "Comisión", "Comisión (C)"].includes(row.campo)
                let showPorcentaje =
                  esCampoEditablePorcentaje || // Siempre mostrar para campos editables
                  row.porcentaje != null      // Para otros campos, mostrar solo si tienen porcentaje
                // Para Comisión, SIEMPRE mostrar porcentajeConfig (valor original del usuario)
                // Para Factura e IUE, mostrar porcentajeConfig si existe, sino porcentaje, sino 0
                // Para otros campos, mostrar porcentaje (calculado sobre precio)
                let porcentajeToShow: number | string | null = row.porcentaje
                if (row.campo === "Comision" || row.campo === "Comisión" || row.campo === "Comisión (C)") {
                  porcentajeToShow = (row as any).porcentajeConfig != null ? (row as any).porcentajeConfig : ""
                  showPorcentaje = true
                } else if (row.campo === "Factura" || row.campo === "IUE") {
                  // Para Factura e IUE, mostrar porcentajeConfig si existe, sino porcentaje, sino 0
                  porcentajeToShow = (row as any).porcentajeConfig != null
                    ? (row as any).porcentajeConfig
                    : (row.porcentaje != null ? row.porcentaje : 0)
                  showPorcentaje = true // Siempre mostrar para estos campos editables
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
                        disabled={!isEditable}
                        placeholder="0.00"
                        className={`h-9 text-sm ${!isEditable ? (isPrecioRow ? "bg-green-50" : "bg-gray-100 cursor-not-allowed") : (isPrecioRow ? "bg-green-50 border-green-300" : "")}`}
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
                  className={`transition-all duration-300 transform ${priceAppliedVariante
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

