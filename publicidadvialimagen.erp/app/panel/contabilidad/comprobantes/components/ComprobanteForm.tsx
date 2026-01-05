"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Plus, Save, Trash2, CheckCircle, Check, ChevronsUpDown } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { api } from "@/lib/fetcher"
import type { Comprobante, ComprobanteDetalle, OrigenComprobante, TipoComprobante, TipoAsiento, EstadoComprobante, Moneda, Cuenta, Auxiliar } from "@/lib/types/contabilidad"

interface ComprobanteFormProps {
  comprobante: Comprobante | null
  onNew: () => void
  onSave: () => void
  plantillaParaAplicar?: string // Código de plantilla para aplicar automáticamente
}

const ORIGENES: OrigenComprobante[] = ["Contabilidad", "Ventas", "Tesorería", "Activos", "Planillas"]
const TIPOS_COMPROBANTE: TipoComprobante[] = ["Ingreso", "Egreso", "Diario", "Traspaso", "Ctas por Pagar"]
const TIPOS_ASIENTO: TipoAsiento[] = ["Normal", "Apertura", "Cierre", "Ajuste"]
const MONEDAS: Moneda[] = ["BS", "USD"]

// Componente para detectar truncado y mostrar tooltip
// Muestra tooltip cuando hay descripción completa de cuenta (formato: "codigo - descripcion")
function TruncatedTextWithTooltip({ 
  text, 
  fullText, 
  className = ""
}: { 
  text: string
  fullText: string
  className?: string
}) {
  // Mostrar tooltip si hay una descripción (contiene " - ")
  // Esto significa que hay una cuenta con descripción que puede estar truncada
  const shouldShowTooltip = fullText.includes(" - ")
  
  if (shouldShowTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`truncate cursor-help ${className}`}>
              {text}
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-sm">
            <p className="font-mono">{fullText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }
  return <span className={`truncate ${className}`}>{text}</span>
}

const MESES = [
  { value: 1, label: "Enero" },
  { value: 2, label: "Febrero" },
  { value: 3, label: "Marzo" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Mayo" },
  { value: 6, label: "Junio" },
  { value: 7, label: "Julio" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Septiembre" },
  { value: 10, label: "Octubre" },
  { value: 11, label: "Noviembre" },
  { value: 12, label: "Diciembre" },
]

export default function ComprobanteForm({ comprobante, onNew, onSave, plantillaParaAplicar }: ComprobanteFormProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  const [loadingCuentas, setLoadingCuentas] = useState(false)
  const [openCuentaCombobox, setOpenCuentaCombobox] = useState<Record<number, boolean>>({})
  const [filteredCuentas, setFilteredCuentas] = useState<Record<number, Cuenta[]>>({})
  
  // Estados para el combobox de auxiliares
  const [auxiliares, setAuxiliares] = useState<Auxiliar[]>([])
  const [loadingAuxiliares, setLoadingAuxiliares] = useState(false)
  const [openAuxiliarCombobox, setOpenAuxiliarCombobox] = useState<Record<number, boolean>>({})
  const [filteredAuxiliares, setFilteredAuxiliares] = useState<Record<number, Auxiliar[]>>({})
  
  // Estados para el combobox de beneficiario (contactos)
  const [openBeneficiarioCombobox, setOpenBeneficiarioCombobox] = useState(false)
  const [todosLosContactos, setTodosLosContactos] = useState<any[]>([])
  const [filteredContactos, setFilteredContactos] = useState<any[]>([])
  const [cargandoContactos, setCargandoContactos] = useState(false)
  const [beneficiarioId, setBeneficiarioId] = useState<string | null>(null)

  // Estados para plantillas contables
  const [plantillas, setPlantillas] = useState<any[]>([])
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState<string>("")
  const [aplicandoPlantilla, setAplicandoPlantilla] = useState(false)
  const [guardandoComprobante, setGuardandoComprobante] = useState(false)

  // Estado del formulario
  const [formData, setFormData] = useState<Partial<Comprobante>>({
    origen: "Contabilidad",
    tipo_comprobante: "Diario",
    tipo_asiento: "Normal",
    fecha: new Date().toISOString().split("T")[0],
    periodo: new Date().getMonth() + 1,
    gestion: new Date().getFullYear(),
    moneda: "BS",
    tipo_cambio: 1,
    estado: "BORRADOR",
  })

  const [detalles, setDetalles] = useState<ComprobanteDetalle[]>([])

  // Cargar cuentas transaccionales
  useEffect(() => {
    fetchCuentasTransaccionales()
  }, [])

  // Cargar auxiliares
  useEffect(() => {
    fetchAuxiliares()
  }, [])

  // Cargar todos los contactos al inicio
  useEffect(() => {
    const cargarContactos = async () => {
      setCargandoContactos(true)
      try {
        const response = await fetch('/api/contactos')
        const data = await response.json()
        setTodosLosContactos(data.data || [])
        setFilteredContactos((data.data || []).slice(0, 50))
      } catch (error) {
        console.error('Error cargando contactos:', error)
      } finally {
        setCargandoContactos(false)
      }
    }

    cargarContactos()
  }, [])

  // Cargar plantillas contables
  useEffect(() => {
    const cargarPlantillas = async () => {
      try {
        const response = await fetch('/api/contabilidad/plantillas')
        if (response.ok) {
          const data = await response.json()
          setPlantillas(data.data || [])
        }
      } catch (error) {
        console.error('Error cargando plantillas:', error)
      }
    }

    cargarPlantillas()
  }, [])

  // Sincronizar beneficiarioId cuando se cargan los contactos y hay un comprobante con beneficiario
  useEffect(() => {
    if (comprobante?.beneficiario && todosLosContactos.length > 0) {
      const contactoEncontrado = todosLosContactos.find(
        (c: any) => 
          (c.displayName || c.nombre) === comprobante.beneficiario ||
          c.legalName === comprobante.beneficiario
      )
      if (contactoEncontrado) {
        setBeneficiarioId(contactoEncontrado.id)
      } else {
        setBeneficiarioId(null)
      }
    } else if (!comprobante?.beneficiario) {
      setBeneficiarioId(null)
    }
  }, [comprobante?.beneficiario, todosLosContactos.length])

  // Abrir automáticamente el diálogo de plantilla si se pasa plantillaParaAplicar
  useEffect(() => {
    if (plantillaParaAplicar && comprobante && comprobante.estado === "BORRADOR" && plantillas.length > 0) {
      const plantillaExiste = plantillas.find((p) => p.codigo === plantillaParaAplicar)
      if (plantillaExiste) {
        setPlantillaSeleccionada(plantillaParaAplicar)
        // Pequeño delay para asegurar que el comprobante esté cargado
        setTimeout(() => {
          setPlantillaSeleccionada(plantillaParaAplicar)
          handleAplicarPlantilla()
          console.log("📋 Aplicando plantilla automáticamente:", plantillaParaAplicar)
        }, 300) // Aumentado a 300ms para dar tiempo a que se carguen los detalles
      }
    }
  }, [plantillaParaAplicar, comprobante?.id, plantillas.length])

  // Inicializar filtros cuando se cargan las cuentas y hay detalles
  useEffect(() => {
    if (cuentas.length > 0 && detalles.length > 0) {
      const initialFilters: Record<number, Cuenta[]> = {}
      detalles.forEach((_, idx) => {
        // Solo inicializar si no existe ya un filtro para este índice
        if (!(idx in filteredCuentas)) {
          initialFilters[idx] = cuentas.slice(0, 20)
        }
      })
      if (Object.keys(initialFilters).length > 0) {
        setFilteredCuentas(prev => ({ ...prev, ...initialFilters }))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cuentas.length, detalles.length])

  // Inicializar filtros de auxiliares cuando se cargan y hay detalles
  useEffect(() => {
    if (auxiliares.length > 0 && detalles.length > 0) {
      const initialFilters: Record<number, Auxiliar[]> = {}
      detalles.forEach((_, idx) => {
        // Solo inicializar si no existe ya un filtro para este índice
        if (!(idx in filteredAuxiliares)) {
          initialFilters[idx] = auxiliares.slice(0, 20)
        }
      })
      if (Object.keys(initialFilters).length > 0) {
        setFilteredAuxiliares(prev => ({ ...prev, ...initialFilters }))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auxiliares.length, detalles.length])

  // Sincronizar formulario cuando cambia comprobante seleccionado
  useEffect(() => {
    if (comprobante) {
      console.log("🔄 Cargando comprobante:", comprobante)
      setFormData({
        numero: comprobante.numero,
        origen: comprobante.origen,
        tipo_comprobante: comprobante.tipo_comprobante,
        tipo_asiento: comprobante.tipo_asiento,
        fecha: comprobante.fecha,
        periodo: comprobante.periodo,
        gestion: comprobante.gestion,
        moneda: comprobante.moneda,
        tipo_cambio: comprobante.tipo_cambio,
        concepto: comprobante.concepto || "",
        beneficiario: comprobante.beneficiario || "",
        nro_cheque: comprobante.nro_cheque || "",
        estado: comprobante.estado,
        empresa_id: comprobante.empresa_id,
      })
      
      // Buscar el contacto por nombre si existe beneficiario (se hará cuando se carguen los contactos)
      
      // Si el comprobante ya tiene detalles (viene del listado), usarlos directamente
      if (comprobante.detalles && Array.isArray(comprobante.detalles) && comprobante.detalles.length > 0) {
        console.log("✅ Usando detalles del comprobante:", comprobante.detalles)
        setDetalles(comprobante.detalles)
        // Inicializar filtros
        const initialFilters: Record<number, Cuenta[]> = {}
        const initialFiltersAuxiliares: Record<number, Auxiliar[]> = {}
        comprobante.detalles.forEach((_, idx) => {
          initialFilters[idx] = cuentas.slice(0, 20)
          initialFiltersAuxiliares[idx] = auxiliares.slice(0, 20)
        })
        setFilteredCuentas(initialFilters)
        setFilteredAuxiliares(initialFiltersAuxiliares)
      } else if (comprobante.id) {
        // Si no tiene detalles, cargarlos desde el API
        console.log("📡 Cargando detalles desde API para comprobante:", comprobante.id)
        fetchDetalles(comprobante.id)
      } else {
        setDetalles([])
        setFilteredCuentas({})
      }
    } else {
      resetForm()
    }
  }, [comprobante])

  const fetchCuentasTransaccionales = async () => {
    try {
      setLoadingCuentas(true)
      const response = await api("/api/contabilidad/cuentas?limit=10000")
      if (response.ok) {
        const data = await response.json()
        // 4️⃣ VISUALIZACIÓN DE CUENTA: NO filtrar por transaccional
        // Cargar TODAS las cuentas para poder mostrar descripción de cualquier cuenta
        setCuentas(data.data || [])
      }
    } catch (error) {
      console.error("Error fetching cuentas:", error)
    } finally {
      setLoadingCuentas(false)
    }
  }

  const fetchAuxiliares = async () => {
    try {
      setLoadingAuxiliares(true)
      const response = await api("/api/contabilidad/auxiliares?limit=10000")
      if (response.ok) {
        const data = await response.json()
        setAuxiliares(data.data || [])
      }
    } catch (error) {
      console.error("Error fetching auxiliares:", error)
    } finally {
      setLoadingAuxiliares(false)
    }
  }

  const fetchDetalles = async (comprobanteId: number) => {
    try {
      console.log("📡 Fetching detalles para comprobante:", comprobanteId)
      const response = await api(`/api/contabilidad/comprobantes/${comprobanteId}`)
      if (response.ok) {
        const result = await response.json()
        console.log("📋 Respuesta completa:", result)
        
        // El endpoint devuelve { success: true, data: { detalles: [...] } }
        let detallesData = []
        if (result.data) {
          // Si data es un objeto con detalles
          if (Array.isArray(result.data.detalles)) {
            detallesData = result.data.detalles
          } else if (Array.isArray(result.data)) {
            // Si data es directamente un array
            detallesData = result.data
          } else if (result.detalles && Array.isArray(result.detalles)) {
            detallesData = result.detalles
          }
        } else if (Array.isArray(result.detalles)) {
          detallesData = result.detalles
        }
        
        // Si los detalles no tienen rol/lado/porcentaje, intentar recuperarlos
        // Esto ocurre cuando se carga un comprobante guardado
        const detallesSinPlantilla = detallesData.some((d: any) => !d.rol && !d.lado && !d.porcentaje)
        
        if (detallesSinPlantilla && detallesData.length > 0) {
          console.log("⚠️ Detalles sin información de plantilla, intentando recuperar...")
          
          // Intentar recuperar información de plantilla basándose en las cuentas
          // Buscar plantillas que coincidan con las cuentas de los detalles
          try {
            const plantillasResponse = await api("/api/contabilidad/plantillas")
            if (plantillasResponse.ok) {
              const plantillasData = await plantillasResponse.json()
              const plantillas = plantillasData.data || []
              
              // Buscar plantilla que coincida con las cuentas
              for (const plantilla of plantillas) {
                if (!plantilla.activa) continue
                
                // Obtener detalles de la plantilla
                const detallesPlantillaResponse = await api(`/api/contabilidad/plantillas/${plantilla.id}/detalles`)
                if (detallesPlantillaResponse.ok) {
                  const detallesPlantillaData = await detallesPlantillaResponse.json()
                  const detallesPlantilla = detallesPlantillaData.data || []
                  
                  // Verificar si las cuentas coinciden (orden y cuenta)
                  let coincide = true
                  if (detallesPlantilla.length !== detallesData.length) {
                    coincide = false
                  } else {
                    for (let i = 0; i < detallesPlantilla.length; i++) {
                      const detPlantilla = detallesPlantilla[i]
                      const detCargado = detallesData[i]
                      
                      // Si la plantilla tiene cuenta_fija, debe coincidir
                      // Si no tiene cuenta_fija pero es IVA, verificar cuenta de config
                      if (detPlantilla.cuenta_fija) {
                        if (detCargado.cuenta !== detPlantilla.cuenta_fija) {
                          coincide = false
                          break
                        }
                      } else if (detPlantilla.rol === "IVA_CREDITO" || detPlantilla.rol === "IVA_DEBITO") {
                        // Para IVA, verificar si la cuenta coincide con la configurada
                        // (esto es más flexible)
                        continue
                      }
                    }
                  }
                  
                  if (coincide) {
                    console.log("✅ Plantilla encontrada:", plantilla.codigo)
                    // Aplicar información de plantilla a los detalles
                    detallesData = detallesData.map((det: any, index: number) => {
                      const detPlantilla = detallesPlantilla[index]
                      return {
                        ...det,
                        rol: detPlantilla.rol,
                        lado: detPlantilla.lado,
                        porcentaje: detPlantilla.porcentaje,
                        permite_seleccionar_cuenta: detPlantilla.permite_seleccionar_cuenta,
                        permite_auxiliar: detPlantilla.permite_auxiliar,
                        // esCalculado se calcula basado en bloqueado (no usar rol)
                        esCalculado: detPlantilla.bloqueado === true,
                      }
                    })
                    break
                  }
                }
              }
            }
          } catch (error) {
            console.warn("⚠️ No se pudo recuperar información de plantilla:", error)
          }
        }
        
        // Asegurar que esCalculado esté definido para todos los detalles
        detallesData = detallesData.map((det: any) => ({
          ...det,
          // esCalculado se calcula basado en bloqueado (no usar rol)
          esCalculado: det.esCalculado ?? (det.bloqueado === true),
        }))
        
        console.log("✅ Detalles procesados y establecidos:", detallesData)
        setDetalles(detallesData)
        
        // Inicializar filtros para cada detalle (solo si las cuentas ya están cargadas)
        if (cuentas.length > 0) {
          const initialFilters: Record<number, Cuenta[]> = {}
          detallesData.forEach((_, idx) => {
            initialFilters[idx] = cuentas.slice(0, 20)
          })
          setFilteredCuentas(initialFilters)
        }
        
        // Inicializar filtros de auxiliares
        if (auxiliares.length > 0) {
          const initialFiltersAuxiliares: Record<number, Auxiliar[]> = {}
          detallesData.forEach((_, idx) => {
            initialFiltersAuxiliares[idx] = auxiliares.slice(0, 20)
          })
          setFilteredAuxiliares(initialFiltersAuxiliares)
        }
        
        // Nota: El recálculo se hace automáticamente cuando el usuario edita la línea base
        // No es necesario recalcular al cargar, los montos inician en 0
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error("❌ Error en respuesta:", response.status, errorData)
        setDetalles([])
      }
    } catch (error) {
      console.error("❌ Error fetching detalles:", error)
      setDetalles([])
    }
  }

  const resetForm = () => {
    setFormData({
      origen: "Contabilidad",
      tipo_comprobante: "Diario",
      tipo_asiento: "Normal",
      fecha: new Date().toISOString().split("T")[0],
      periodo: new Date().getMonth() + 1,
      gestion: new Date().getFullYear(),
      moneda: "BS",
      tipo_cambio: 1,
      estado: "BORRADOR",
    })
    setDetalles([])
  }

  const handleAddDetalle = () => {
    const newDetalle: ComprobanteDetalle = {
      cuenta: "",
      auxiliar: null,
      glosa: null,
      debe_bs: 0,
      haber_bs: 0,
      debe_usd: 0,
      haber_usd: 0,
      orden: detalles.length + 1,
      // Nueva línea es siempre base (no calculada)
      // No se asigna rol (deprecado), solo se usa porcentaje + lado para plantillas
      esCalculado: false,
    }
    const newIndex = detalles.length
    setDetalles([...detalles, newDetalle])
    // Inicializar filtro para el nuevo detalle
    setFilteredCuentas(prev => ({ ...prev, [newIndex]: cuentas.slice(0, 20) }))
    setFilteredAuxiliares(prev => ({ ...prev, [newIndex]: auxiliares.slice(0, 20) }))
    
    // Nota: El recálculo se hace automáticamente cuando el usuario edita la línea base
    // No es necesario recalcular al agregar líneas
  }

  const handleRemoveDetalle = (index: number) => {
    const detalleAEliminar = detalles[index]
    const newDetalles = detalles.filter((_, i) => i !== index)
    setDetalles(newDetalles)
    // Reindexar filtros después de eliminar
    const newFilters: Record<number, Cuenta[]> = {}
    const newFiltersAuxiliares: Record<number, Auxiliar[]> = {}
    newDetalles.forEach((_, idx) => {
      newFilters[idx] = filteredCuentas[idx + 1] || cuentas.slice(0, 20)
      newFiltersAuxiliares[idx] = filteredAuxiliares[idx + 1] || auxiliares.slice(0, 20)
    })
    setFilteredCuentas(newFilters)
    setFilteredAuxiliares(newFiltersAuxiliares)
    // Cerrar combobox si estaba abierto
    const newOpenState: Record<number, boolean> = {}
    
    // Nota: El recálculo se hace automáticamente cuando el usuario edita la línea base
    // No es necesario recalcular al eliminar líneas
    Object.keys(openCuentaCombobox).forEach(key => {
      const keyNum = parseInt(key)
      if (keyNum < index) {
        newOpenState[keyNum] = openCuentaCombobox[keyNum]
      } else if (keyNum > index) {
        newOpenState[keyNum - 1] = openCuentaCombobox[keyNum]
      }
    })
    setOpenCuentaCombobox(newOpenState)
  }

  const handleDetalleChange = (index: number, field: keyof ComprobanteDetalle, value: any) => {
    // 🟡 LOG DE DIAGNÓSTICO: Entrada a handleDetalleChange
    console.log("🟡 handleDetalleChange ENTER", {
      index,
      field,
      valor: value,
      detalleActual: detalles[index],
      todosLosDetalles: detalles.map(d => ({
        cuenta: d.cuenta,
        porcentaje: (d as any).porcentaje,
        bloqueado: (d as any).bloqueado,
        esCalculado: d.esCalculado,
        lado: (d as any).lado,
        debe_bs: d.debe_bs,
        haber_bs: d.haber_bs
      }))
    })
    
    // Verificar si es una línea derivada (no editable)
    const detalle = detalles[index]
    const esCalculado = detalle && (detalle as any).esCalculado === true
    const tienePlantilla = detalles.some(d => (d as any).bloqueado !== undefined || (d as any).porcentaje !== undefined)
    
    if (esCalculado) {
      // Línea derivada, no permitir edición manual
      console.log("⚠️ Intento de editar línea con esCalculado = true, bloqueando edición")
      return
    }

    // Si es un campo de monto, usar motor de cálculo de plantilla
    // Esto se ejecuta incluso si hay plantilla aplicada, siempre que no sea línea calculada
    if (field === "debe_bs" || field === "haber_bs" || field === "debe_usd" || field === "haber_usd") {
      const valorNumerico = parseFloat(value) || 0
      
      // Si hay plantilla aplicada, usar motor de cálculo
      if (tienePlantilla) {
        console.log("🟡 [Plantillas] handleDetalleChange - Llamando a calcularMontosPlantilla", {
          index,
          field,
          valorNumerico,
          detalleActual: {
            cuenta: detalles[index]?.cuenta,
            porcentaje: (detalles[index] as any)?.porcentaje,
            bloqueado: (detalles[index] as any)?.bloqueado,
            lado: (detalles[index] as any)?.lado
          }
        })
        const nuevosDetalles = calcularMontosPlantilla(index, field, valorNumerico)
        console.log("🟢 [Plantillas] handleDetalleChange - Resultado de calcularMontosPlantilla", {
          totalDetalles: nuevosDetalles.length,
          montos: nuevosDetalles.map((d, idx) => ({
            index: idx,
            cuenta: d.cuenta,
            debe_bs: d.debe_bs,
            haber_bs: d.haber_bs,
            porcentaje: (d as any)?.porcentaje,
            bloqueado: (d as any)?.bloqueado
          }))
        })
        // Reemplazar completamente el estado con el resultado
        setDetalles(nuevosDetalles)
        return
      } else {
        // No hay plantilla, actualizar solo el campo editado
        const updated = [...detalles]
        updated[index] = { ...updated[index], [field]: valorNumerico }
        setDetalles(updated)
        return
      }
    }
    
    // Para otros campos (cuenta, auxiliar, glosa), actualizar normalmente
    const updated = [...detalles]
    updated[index] = { ...updated[index], [field]: value }
    setDetalles(updated)
  }
  
  // useEffect eliminado - el recálculo se hace directamente en handleDetalleChange

  // Función de filtrado para cuentas
  const filtrarCuentas = (detalleIndex: number, searchValue: string) => {
    if (!searchValue || searchValue.trim() === '') {
      setFilteredCuentas(prev => ({ ...prev, [detalleIndex]: cuentas.slice(0, 20) }))
      return
    }

    const search = searchValue.toLowerCase().trim()
    const filtered = cuentas.filter((cuenta) => {
      const codigo = (cuenta.cuenta || '').toLowerCase()
      const descripcion = (cuenta.descripcion || '').toLowerCase()
      return codigo.startsWith(search) || descripcion.includes(search)
    }).slice(0, 20)

    setFilteredCuentas(prev => ({ ...prev, [detalleIndex]: filtered }))
  }

  const filtrarAuxiliares = (detalleIndex: number, searchValue: string) => {
    if (!searchValue || searchValue.trim() === '') {
      setFilteredAuxiliares(prev => ({ ...prev, [detalleIndex]: auxiliares.slice(0, 20) }))
      return
    }

    const search = searchValue.toLowerCase().trim()
    const filtered = auxiliares.filter((auxiliar) => {
      // Priorizar nombre de contactos si existe
      const contacto = auxiliar.contactos
      const nombre = (contacto?.nombre ?? auxiliar.nombre ?? '').toLowerCase()
      const codigo = (auxiliar.codigo || '').toLowerCase()
      return nombre.includes(search) || codigo.includes(search)
    }).slice(0, 20)

    setFilteredAuxiliares(prev => ({ ...prev, [detalleIndex]: filtered }))
  }

  // Función de filtrado para contactos (beneficiario)
  const filtrarContactos = (query: string) => {
    if (!query || query.trim() === '') {
      setFilteredContactos(todosLosContactos.slice(0, 50))
      return
    }

    const search = query.toLowerCase().trim()
    const filtered = todosLosContactos.filter((contacto: any) => {
      const nombre = (contacto.displayName || contacto.nombre || '').toLowerCase()
      const empresa = (contacto.legalName || contacto.empresa || '').toLowerCase()
      const email = (contacto.email || '').toLowerCase()

      // Buscar en cualquier parte del nombre, empresa o email
      return nombre.includes(search) || empresa.includes(search) || email.includes(search)
    }).slice(0, 100)

    setFilteredContactos(filtered)
  }

  // NOTA: La función recalcularMontos() fue eliminada porque usaba 'rol' que ya no existe.
  // Todo el cálculo ahora se hace en calcularMontosPlantilla() usando porcentaje + lado.

  // Función para guardar comprobante si es nuevo
  const guardarComprobanteSiEsNuevo = async (): Promise<string | null> => {
    if (comprobante?.id) {
      console.log("✅ Comprobante ya tiene ID:", comprobante.id)
      return comprobante.id
    }

    console.log("🔄 Comprobante nuevo, guardando primero...")
    setGuardandoComprobante(true)

    try {
      const fecha = new Date(formData.fecha)
      const payload = {
        origen: "Contabilidad",
        tipo_comprobante: formData.tipo_comprobante,
        tipo_asiento: formData.tipo_asiento || "Normal",
        fecha: formData.fecha,
        periodo: fecha.getMonth() + 1,
        gestion: fecha.getFullYear(),
        moneda: formData.moneda || "BS",
        tipo_cambio: formData.tipo_cambio || (formData.moneda === "USD" ? 6.96 : 1),
        concepto: formData.concepto || "",
        beneficiario: formData.beneficiario || null,
        nro_cheque: formData.nro_cheque || null,
        estado: "BORRADOR",
        detalles: [], // Array vacío - los detalles se agregarán al aplicar la plantilla
      }

      const response = await api("/api/contabilidad/comprobantes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || "Error al crear el comprobante")
        return null
      }

      const newComp = await response.json()
      const comprobanteCreado = newComp.data
      const comprobanteId = comprobanteCreado?.id

      if (!comprobanteId) {
        toast.error("Error: No se pudo obtener el ID del comprobante")
        return null
      }

      console.log("✅ Comprobante creado con ID:", comprobanteId)
      console.log("📋 Comprobante completo:", comprobanteCreado)
      toast.success("Comprobante guardado. Aplicando plantilla...")
      
      // Recargar la lista para que el comprobante aparezca
      onSave()
      
      return comprobanteId
    } catch (error: any) {
      console.error("Error guardando comprobante:", error)
      toast.error("Error al guardar el comprobante: " + error.message)
      return null
    } finally {
      setGuardandoComprobante(false)
    }
  }

  // Función para aplicar plantilla (solo estructura, sin montos)
  const handleAplicarPlantilla = async () => {
    if (!plantillaSeleccionada) {
      toast.error("Debe seleccionar una plantilla")
      return
    }

    // Guardar comprobante si es nuevo
    let comprobanteId = comprobante?.id
    if (!comprobanteId) {
      comprobanteId = await guardarComprobanteSiEsNuevo()
      if (!comprobanteId) {
        return // Error ya mostrado
      }
    }

    // Verificar estado del comprobante
    if (comprobante?.estado && comprobante.estado !== "BORRADOR") {
      toast.error("Solo se pueden aplicar plantillas a comprobantes en estado BORRADOR")
      return
    }

    setAplicandoPlantilla(true)

    try {
      console.log("🔄 Aplicando estructura de plantilla:", plantillaSeleccionada)
      console.log("🆔 Comprobante ID:", comprobanteId)

      const response = await fetch(`/api/contabilidad/comprobantes/${comprobanteId}/aplicar-plantilla-estructura`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plantilla_codigo: plantillaSeleccionada,
        }),
      })

      const data = await response.json()

      console.log("📥 Respuesta del endpoint:", JSON.stringify(data, null, 2))

      if (!response.ok) {
        const errorMsg = data.error || "Error al aplicar plantilla"
        toast.error(errorMsg)
        return
      }

      // Cargar detalles con información de plantilla
      if (data.data?.detalles) {
        // Asegurar que las cuentas estén cargadas antes de mostrar los detalles
        if (cuentas.length === 0) {
          await fetchCuentasTransaccionales()
          // Esperar un pequeño delay para asegurar que el estado se actualice
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        
        // 1️⃣ NORMALIZAR PLANTILLA: Ordenar por orden y forzar primera línea como base
        const detallesOrdenados = [...data.data.detalles].sort((a: any, b: any) => {
          const ordenA = a.orden || 0
          const ordenB = b.orden || 0
          return ordenA - ordenB
        })
        
        const detallesConPlantilla = detallesOrdenados.map((det: any, index: number) => {
          // FORZAR PRIMERA LÍNEA COMO BASE (índice 0)
          const esPrimeraLinea = index === 0
          const bloqueadoNormalizado = esPrimeraLinea 
            ? false  // Primera línea SIEMPRE es base (editable)
            : (det.bloqueado === true || (det.porcentaje && det.porcentaje > 0))
          
          // IMPORTANTE: Preservar el porcentaje de la línea base si existe
          // El motor necesita este porcentaje para calcular BASE = valorIntroducido / (porcentaje / 100)
          const porcentajeNormalizado = esPrimeraLinea 
            ? (det.porcentaje || null)  // Preservar porcentaje de la línea base
            : (det.porcentaje || null)
          
          const esCalculado = bloqueadoNormalizado === true
          
          return {
            ...det,
            esCalculado: esCalculado,
            bloqueado: bloqueadoNormalizado,
            porcentaje: porcentajeNormalizado,
            // Preservar cuenta_sugerida y cuenta_es_fija del backend
            cuenta_sugerida: det.cuenta_sugerida || "",
            cuenta_es_fija: det.cuenta_es_fija === true,
            lado: det.lado || "DEBE",
            permite_auxiliar: det.permite_auxiliar === true,
          }
        })
        
        // 🧠 LOG: Plantilla normalizada
        console.log("🧠 [Plantillas] Plantilla normalizada al aplicar", {
          total_lineas: detallesConPlantilla.length,
          primera_linea: {
            cuenta: detallesConPlantilla[0]?.cuenta,
            bloqueado: detallesConPlantilla[0]?.bloqueado,
            porcentaje: detallesConPlantilla[0]?.porcentaje,
            lado: detallesConPlantilla[0]?.lado
          },
          todas_las_lineas: detallesConPlantilla.map((d: any, idx: number) => ({
            index: idx,
            cuenta: d.cuenta,
            bloqueado: d.bloqueado,
            porcentaje: d.porcentaje,
            lado: d.lado
          }))
        })
        
        setDetalles(detallesConPlantilla)
        
        // 🟠 LOG DE DIAGNÓSTICO: Estado de detalles después de aplicar plantilla
        console.log("🟠 FRONTEND plantilla aplicada - detalles iniciales", detallesConPlantilla.map(d => ({
          cuenta: d.cuenta,
          cuenta_sugerida: (d as any).cuenta_sugerida,
          porcentaje: (d as any).porcentaje,
          lado: (d as any).lado,
          bloqueado: (d as any).bloqueado,
          esCalculado: d.esCalculado,
          cuenta_es_fija: (d as any).cuenta_es_fija,
          permite_auxiliar: (d as any).permite_auxiliar
        })))
        
        // Inicializar filtros para las nuevas líneas (usar cuentas actualizadas)
        const initialFilters: Record<number, Cuenta[]> = {}
        const initialFiltersAuxiliares: Record<number, Auxiliar[]> = {}
        detallesConPlantilla.forEach((_, idx) => {
          initialFilters[idx] = cuentas.length > 0 ? cuentas.slice(0, 20) : []
          initialFiltersAuxiliares[idx] = auxiliares.length > 0 ? auxiliares.slice(0, 20) : []
        })
        setFilteredCuentas(initialFilters)
        setFilteredAuxiliares(initialFiltersAuxiliares)
      } else if (comprobanteId) {
        await fetchDetalles(comprobanteId)
      }

      toast.success("Estructura de plantilla aplicada correctamente")
      console.log("✅ Estructura de plantilla aplicada al comprobante:", comprobanteId)
      
      // Limpiar plantilla seleccionada después de aplicar
      setPlantillaSeleccionada("")
      
      // Recargar la lista para que se actualice
      onSave()
    } catch (error: any) {
      console.error("Error aplicando plantilla:", error)
      toast.error("Error al aplicar plantilla: " + error.message)
    } finally {
      setAplicandoPlantilla(false)
    }
  }

  // Función para seleccionar cuenta
  const seleccionarCuenta = (detalleIndex: number, cuenta: Cuenta) => {
    handleDetalleChange(detalleIndex, "cuenta", cuenta.cuenta)
    setOpenCuentaCombobox(prev => ({ ...prev, [detalleIndex]: false }))
  }

  // Función para seleccionar auxiliar
  const seleccionarAuxiliar = (detalleIndex: number, auxiliar: Auxiliar) => {
    // Guardar solo el nombre del auxiliar (priorizando contactos si existe)
    const contacto = auxiliar.contactos
    const nombre = contacto?.nombre ?? auxiliar.nombre ?? auxiliar.nombre
    handleDetalleChange(detalleIndex, "auxiliar", nombre)
    setOpenAuxiliarCombobox(prev => ({ ...prev, [detalleIndex]: false }))
  }

  // Obtener el texto a mostrar para la cuenta seleccionada (con descripción y si es fija)
  // 4️⃣ VISUALIZACIÓN DE CUENTA: Normalizar búsqueda con String().trim()
  const getCuentaDisplayText = (cuentaCodigo: string, esFija: boolean = false) => {
    if (!cuentaCodigo) return "Seleccionar cuenta..."
    const codigoNormalizado = String(cuentaCodigo).trim()
    const cuenta = cuentas.find(c => String(c.cuenta || "").trim() === codigoNormalizado)
    if (cuenta) {
      const textoBase = `${cuenta.cuenta} - ${cuenta.descripcion}`
      return esFija ? `${textoBase} (Fija)` : textoBase
    }
    return esFija ? `${cuentaCodigo} (Fija)` : cuentaCodigo
  }

  /**
   * MOTOR DE DESCOMPOSICIÓN PORCENTUAL DE PLANTILLAS CONTABLES
   * 
   * MODELO: Descomposición porcentual (NO sumatorio)
   * 
   * El valor introducido por el usuario representa el 100% del hecho económico.
   * Las líneas con porcentaje reparten ese 100%, y la línea con porcentaje = 100 solo balancea.
   * 
   * REGLAS ABSOLUTAS:
   * 1. Identificar línea base: bloqueado === false (si hay más de una, usar la primera)
   * 2. BASE = valor introducido en la línea base
   * 3. Para líneas calculadas (bloqueado === true && porcentaje < 100):
   *    monto = BASE × (porcentaje / 100)
   * 4. Para línea con porcentaje === 100:
   *    monto = BASE (solo balancea, no suma componentes)
   * 
   * PROHIBIDO:
   * - TOTAL_EDITABLE
   * - Sumas acumuladas
   * - Inferencias tipo "IVA", "cierre", "base"
   * - Lógica que genere totales > BASE
   */
  const calcularMontosPlantilla = (detalleIndex: number, campo: string, valor: number): ComprobanteDetalle[] => {
    // 🧠 LOG: Entrada al motor universal
    console.log("🧠 [Plantillas] Motor universal - ENTRADA", {
      detalleIndex,
      campo,
      valor,
      total_detalles: detalles.length
    })
    
    // Validaciones básicas
    if (detalles.length === 0) {
      console.log("🧠 [Plantillas] No hay detalles, saliendo")
      return detalles
    }

    const detalleEditado = detalles[detalleIndex]
    if (!detalleEditado) {
      console.log("🧠 [Plantillas] Detalle editado no existe, saliendo")
      return detalles
    }

    // Verificar si tiene plantilla (bloqueado definido)
    const tienePlantilla = detalles.some(d => (d as any).bloqueado !== undefined)
    if (!tienePlantilla) {
      // No hay plantilla, actualizar solo el campo editado
      const nuevosDetalles = [...detalles]
      nuevosDetalles[detalleIndex] = {
        ...nuevosDetalles[detalleIndex],
        [campo]: valor
      }
      return nuevosDetalles
    }

    // Crear copia de todos los detalles
    const nuevosDetalles = detalles.map(d => ({ ...d }))

    // VALIDAR: Solo se puede editar líneas con bloqueado = false
    const detalleEditadoEsBloqueado = (nuevosDetalles[detalleIndex] as any).bloqueado === true
    if (detalleEditadoEsBloqueado) {
      console.warn("🧠 [Plantillas] Intento de editar línea bloqueada. Solo líneas editables (bloqueado=false) son editables.")
      return nuevosDetalles
    }

    // 1. IDENTIFICAR LÍNEA BASE (bloqueado === false)
    // Si hay más de una, usar la primera
    // Si no hay ninguna → NO calcular
    let lineaBaseIndex = nuevosDetalles.findIndex(d => (d as any).bloqueado === false)
    
    if (lineaBaseIndex === -1) {
      console.warn("🧠 [Plantillas] No hay línea base (bloqueado=false), no se puede calcular")
      // No hay línea base, actualizar solo el campo editado
      nuevosDetalles[detalleIndex] = {
        ...nuevosDetalles[detalleIndex],
        [campo]: valor
      }
      return nuevosDetalles
    }

    // Si se está editando una línea que no es la base pero es editable, usarla como base
    if (detalleIndex !== lineaBaseIndex && (nuevosDetalles[detalleIndex] as any).bloqueado === false) {
      // La línea editada también es editable, usarla como base
      lineaBaseIndex = detalleIndex
    }

    // 2. ACTUALIZAR LÍNEA BASE con el nuevo valor
    const lineaBase = nuevosDetalles[lineaBaseIndex]
    const ladoBase = (lineaBase as any).lado || "DEBE"
    
    // Actualizar el campo editado
    nuevosDetalles[lineaBaseIndex] = {
      ...lineaBase,
      [campo]: valor
    }

    // Limpiar el campo opuesto según el lado
    if (ladoBase === "DEBE") {
      if (campo === "debe_bs" || campo === "debe_usd") {
        nuevosDetalles[lineaBaseIndex] = {
          ...nuevosDetalles[lineaBaseIndex],
          haber_bs: 0,
          haber_usd: 0
        }
      }
    } else {
      if (campo === "haber_bs" || campo === "haber_usd") {
        nuevosDetalles[lineaBaseIndex] = {
          ...nuevosDetalles[lineaBaseIndex],
          debe_bs: 0,
          debe_usd: 0
        }
      }
    }

    // 3. OBTENER VALOR INTRODUCIDO Y CALCULAR BASE REAL
    // Si la línea editable tiene porcentaje p, entonces BASE = valorIntroducido / (p / 100)
    let valorIntroducidoBs = 0
    let valorIntroducidoUsd = 0
    
    if (ladoBase === "DEBE") {
      valorIntroducidoBs = nuevosDetalles[lineaBaseIndex].debe_bs || 0
      valorIntroducidoUsd = nuevosDetalles[lineaBaseIndex].debe_usd || 0
    } else {
      valorIntroducidoBs = nuevosDetalles[lineaBaseIndex].haber_bs || 0
      valorIntroducidoUsd = nuevosDetalles[lineaBaseIndex].haber_usd || 0
    }

    // Obtener porcentaje de la línea base
    const pBase = (nuevosDetalles[lineaBaseIndex] as any).porcentaje
    
    // Calcular BASE REAL
    // Si la línea base tiene porcentaje p, BASE = valorIntroducido / (p / 100)
    // Si no tiene porcentaje (null/0), BASE = valorIntroducido (representa 100%)
    let BASE_Bs = 0
    let BASE_Usd = 0
    
    if (pBase !== null && pBase !== undefined && pBase > 0) {
      // La línea base tiene un porcentaje, calcular BASE real
      BASE_Bs = Math.round((valorIntroducidoBs / (pBase / 100)) * 100) / 100
      BASE_Usd = Math.round((valorIntroducidoUsd / (pBase / 100)) * 100) / 100
    } else {
      // La línea base no tiene porcentaje o es 0, representa el 100%
      BASE_Bs = valorIntroducidoBs
      BASE_Usd = valorIntroducidoUsd
    }

    // 🧠 LOG: Línea base identificada y BASE calculada
    console.log("🧠 [Plantillas] Línea base identificada (descomposición porcentual)", {
      lineaBaseIndex,
      pBase,
      valorIntroducidoBs,
      BASE_Bs,
      BASE_Usd,
      ladoBase,
      cuenta: nuevosDetalles[lineaBaseIndex]?.cuenta,
      calculo: pBase !== null && pBase !== undefined && pBase > 0 
        ? `${valorIntroducidoBs} / (${pBase} / 100) = ${BASE_Bs}`
        : `BASE = ${valorIntroducidoBs} (sin porcentaje)`
    })

    // 4. CALCULAR LÍNEAS CON PORCENTAJE < 100
    // monto = BASE × (porcentaje / 100)
    // Aplicar según lado (DEBE / HABER)
    // NO modificar BASE
    // NO sumar nada
    const lineasCalculadas: Array<{ index: number; montoBs: number; montoUsd: number; porcentaje: number; lado: string }> = []

    nuevosDetalles.forEach((det, idx) => {
      if (idx === lineaBaseIndex) return // Saltar línea base
      
      const bloqueado = (det as any).bloqueado
      const porcentaje = (det as any).porcentaje
      const lado = (det as any).lado || "DEBE"

      // Línea calculada: bloqueado === true AND porcentaje < 100
      const esLineaCalculada = bloqueado === true && porcentaje !== null && porcentaje > 0 && porcentaje !== 100

      if (esLineaCalculada) {
        // Descomposición porcentual: monto = BASE × (porcentaje / 100)
        const montoCalculadoBs = Math.round((BASE_Bs * porcentaje / 100) * 100) / 100
        const montoCalculadoUsd = Math.round((BASE_Usd * porcentaje / 100) * 100) / 100

        lineasCalculadas.push({ index: idx, montoBs: montoCalculadoBs, montoUsd: montoCalculadoUsd, porcentaje, lado })

        // Aplicar según el lado
        if (lado === "DEBE") {
          nuevosDetalles[idx] = {
            ...det,
            debe_bs: montoCalculadoBs,
            haber_bs: 0,
            debe_usd: montoCalculadoUsd,
            haber_usd: 0
          }
        } else {
          nuevosDetalles[idx] = {
            ...det,
            debe_bs: 0,
            haber_bs: montoCalculadoBs,
            debe_usd: 0,
            haber_usd: montoCalculadoUsd
          }
        }
      }
    })

    // 🧠 LOG: Líneas calculadas
    console.log("🧠 [Plantillas] Líneas calculadas (descomposición porcentual)", {
      BASE_Bs,
      lineasCalculadas: lineasCalculadas.map(l => ({
        index: l.index,
        cuenta: nuevosDetalles[l.index]?.cuenta,
        porcentaje: l.porcentaje,
        montoBs: l.montoBs,
        montoUsd: l.montoUsd,
        lado: l.lado
      }))
    })

    // 5. CALCULAR LÍNEA CON PORCENTAJE === 100
    // monto = BASE
    // Aplicar SOLO en su lado
    // Usada únicamente para balancear
    // Nunca suma componentes
    const lineaCierreIndex = nuevosDetalles.findIndex(d => {
      const bloq = (d as any).bloqueado
      const p = (d as any).porcentaje
      return bloq === true && p === 100
    })

    if (lineaCierreIndex !== -1) {
      const lineaCierre = nuevosDetalles[lineaCierreIndex]
      const ladoCierre = (lineaCierre as any).lado || "HABER"

      // monto = BASE (no suma componentes, solo balancea)
      const montoCierreBs = Math.round(BASE_Bs * 100) / 100
      const montoCierreUsd = Math.round(BASE_Usd * 100) / 100

      // Aplicar SOLO en su lado
      if (ladoCierre === "HABER") {
        nuevosDetalles[lineaCierreIndex] = {
          ...lineaCierre,
          debe_bs: 0,
          haber_bs: montoCierreBs,
          debe_usd: 0,
          haber_usd: montoCierreUsd
        }
      } else {
        nuevosDetalles[lineaCierreIndex] = {
          ...lineaCierre,
          debe_bs: montoCierreBs,
          haber_bs: 0,
          debe_usd: montoCierreUsd,
          haber_usd: 0
        }
      }
      
      // 🧠 LOG: Línea de cierre calculada
      console.log("🧠 [Plantillas] Línea de cierre calculada (descomposición porcentual)", {
        lineaCierreIndex,
        BASE_Bs,
        montoCierreBs,
        ladoCierre,
        cuenta: nuevosDetalles[lineaCierreIndex]?.cuenta
      })
    }

    // 6. CALCULAR USD AUTOMÁTICAMENTE desde BS usando tipo de cambio
    const tipoCambio = formData.tipo_cambio || 1
    
    if (campo === "debe_bs" || campo === "haber_bs") {
      // Si se editó BS, calcular USD
      nuevosDetalles.forEach((det, idx) => {
        const debeUsd = (det.debe_bs || 0) / tipoCambio
        const haberUsd = (det.haber_bs || 0) / tipoCambio
        nuevosDetalles[idx] = {
          ...det,
          debe_usd: Math.round(debeUsd * 100) / 100,
          haber_usd: Math.round(haberUsd * 100) / 100
        }
      })
    } else if (campo === "debe_usd" || campo === "haber_usd") {
      // Si se editó USD, calcular BS
      nuevosDetalles.forEach((det, idx) => {
        const debeBs = (det.debe_usd || 0) * tipoCambio
        const haberBs = (det.haber_usd || 0) * tipoCambio
        nuevosDetalles[idx] = {
          ...det,
          debe_bs: Math.round(debeBs * 100) / 100,
          haber_bs: Math.round(haberBs * 100) / 100
        }
      })
    }

    // 🧠 LOG: Resultado final
    const totalDebeFinal = nuevosDetalles.reduce((sum, d) => sum + (d.debe_bs || 0), 0)
    const totalHaberFinal = nuevosDetalles.reduce((sum, d) => sum + (d.haber_bs || 0), 0)
    
    console.log("🧠 [Plantillas] Resultado final del cálculo", {
      campo,
      valor,
      tipoCambio,
      totalDebeBs: totalDebeFinal,
      totalHaberBs: totalHaberFinal,
      balanceado: Math.abs(totalDebeFinal - totalHaberFinal) < 0.01,
      detallesRecalculados: nuevosDetalles.map((d, idx) => ({
        index: idx,
        cuenta: d.cuenta,
        bloqueado: (d as any).bloqueado,
        porcentaje: (d as any).porcentaje,
        lado: (d as any).lado,
        debe_bs: d.debe_bs,
        haber_bs: d.haber_bs,
        debe_usd: d.debe_usd,
        haber_usd: d.haber_usd
      }))
    })

    return nuevosDetalles
  }

  // Obtener el texto a mostrar para el auxiliar seleccionado (solo nombre)
  const getAuxiliarDisplayText = (auxiliarNombre: string | null | undefined) => {
    if (!auxiliarNombre) return "Seleccionar auxiliar..."
    return auxiliarNombre
  }

  // Calcular totales
  const totales = detalles.reduce(
    (acc, det) => ({
      debe_bs: acc.debe_bs + (det.debe_bs || 0),
      haber_bs: acc.haber_bs + (det.haber_bs || 0),
      debe_usd: acc.debe_usd + (det.debe_usd || 0),
      haber_usd: acc.haber_usd + (det.haber_usd || 0),
    }),
    { debe_bs: 0, haber_bs: 0, debe_usd: 0, haber_usd: 0 }
  )

  const diferenciaBs = totales.debe_bs - totales.haber_bs
  const diferenciaUsd = totales.debe_usd - totales.haber_usd
  const isBalanced = Math.abs(diferenciaBs) < 0.01 && Math.abs(diferenciaUsd) < 0.01

  const handleSave = async () => {
    try {
      setSaving(true)

      // Validar que haya al menos un detalle
      if (detalles.length === 0) {
        toast.error("Debe agregar al menos un detalle al comprobante")
        return
      }

      // Validar que todos los detalles tengan cuenta
      const detallesInvalidos = detalles.some((d) => !d.cuenta)
      if (detallesInvalidos) {
        toast.error("Todos los detalles deben tener una cuenta asignada")
        return
      }

      const payload = {
        ...formData,
        detalles: detalles.map((d, index) => ({
          ...d,
          orden: index + 1,
        })),
      }

      if (comprobante?.id) {
        // Actualizar
        const response = await api(`/api/contabilidad/comprobantes/${comprobante.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        if (response.ok) {
          const result = await response.json()
          toast.success("Comprobante actualizado correctamente")
          // Recargar detalles después de guardar
          if (result.data?.detalles) {
            console.log("✅ Detalles actualizados después de guardar:", result.data.detalles)
            setDetalles(result.data.detalles)
          } else if (comprobante.id) {
            // Si no vienen en la respuesta, recargarlos
            await fetchDetalles(comprobante.id)
          }
          onSave()
        } else {
          const error = await response.json()
          toast.error(error.error || "Error al actualizar el comprobante")
        }
      } else {
        // Crear
        const response = await api("/api/contabilidad/comprobantes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        if (response.ok) {
          const newComp = await response.json()
          toast.success("Comprobante creado correctamente")
          // Si el nuevo comprobante tiene detalles, mantenerlos
          if (newComp.data?.detalles) {
            setDetalles(newComp.data.detalles)
          }
          resetForm()
          onSave()
        } else {
          const error = await response.json()
          toast.error(error.error || "Error al crear el comprobante")
        }
      }
    } catch (error) {
      console.error("Error saving comprobante:", error)
      toast.error("Error de conexión")
    } finally {
      setSaving(false)
    }
  }

  const handleAprobar = async () => {
    if (!comprobante?.id) {
      toast.error("Debe guardar el comprobante antes de aprobarlo")
      return
    }

    if (!isBalanced) {
      toast.error("El comprobante debe estar balanceado (Debe = Haber) para poder aprobarlo")
      return
    }

    if (!confirm("¿Estás seguro de que quieres aprobar este comprobante? No podrá ser editado después.")) {
      return
    }

    try {
      setSaving(true)
      const response = await api(`/api/contabilidad/comprobantes/${comprobante.id}/aprobar`, {
        method: "POST",
      })

      if (response.ok) {
        toast.success("Comprobante aprobado correctamente")
        onSave()
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al aprobar el comprobante")
      }
    } catch (error) {
      console.error("Error aprobando comprobante:", error)
      toast.error("Error de conexión")
    } finally {
      setSaving(false)
    }
  }

  const isReadOnly = comprobante?.estado === "APROBADO"

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {comprobante ? `Comprobante ${comprobante.numero}` : "Nuevo Comprobante"}
              </CardTitle>
              <CardDescription>
                {comprobante
                  ? isReadOnly
                    ? "Comprobante aprobado (solo lectura)"
                    : "Edita la información del comprobante"
                  : "Complete la información para crear un nuevo comprobante"}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving || isReadOnly}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Guardando..." : "Guardar"}
              </Button>
              {comprobante?.id && !isReadOnly && (
                <Button
                  size="sm"
                  onClick={handleAprobar}
                  disabled={saving || !isBalanced}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Aprobar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {/* Número (solo lectura) */}
            <div className="space-y-2">
              <Label htmlFor="numero">Número</Label>
              <Input
                id="numero"
                value={formData.numero || "AUTO"}
                disabled
                className="bg-gray-50 font-mono"
              />
            </div>

            {/* Origen */}
            <div className="space-y-2">
              <Label htmlFor="origen">Origen</Label>
              <Select
                value={formData.origen || "Contabilidad"}
                onValueChange={(value) =>
                  setFormData({ ...formData, origen: value as OrigenComprobante })
                }
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORIGENES.map((origen) => (
                    <SelectItem key={origen} value={origen}>
                      {origen}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de Comprobante */}
            <div className="space-y-2">
              <Label htmlFor="tipo_comprobante">Tipo de Comprobante</Label>
              <Select
                value={formData.tipo_comprobante || "Diario"}
                onValueChange={(value) =>
                  setFormData({ ...formData, tipo_comprobante: value as TipoComprobante })
                }
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_COMPROBANTE.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de Asiento */}
            <div className="space-y-2">
              <Label htmlFor="tipo_asiento">Tipo de Asiento</Label>
              <Select
                value={formData.tipo_asiento || "Normal"}
                onValueChange={(value) =>
                  setFormData({ ...formData, tipo_asiento: value as TipoAsiento })
                }
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_ASIENTO.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fecha */}
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha</Label>
              <Input
                id="fecha"
                type="date"
                value={formData.fecha || ""}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                disabled={isReadOnly}
              />
            </div>

            {/* Periodo */}
            <div className="space-y-2">
              <Label htmlFor="periodo">Periodo</Label>
              <Select
                value={formData.periodo?.toString() || "1"}
                onValueChange={(value) =>
                  setFormData({ ...formData, periodo: parseInt(value) })
                }
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MESES.map((mes) => (
                    <SelectItem key={mes.value} value={mes.value.toString()}>
                      {mes.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Gestión */}
            <div className="space-y-2">
              <Label htmlFor="gestion">Gestión</Label>
              <Input
                id="gestion"
                type="number"
                min="2000"
                max="2100"
                value={formData.gestion || new Date().getFullYear()}
                onChange={(e) =>
                  setFormData({ ...formData, gestion: parseInt(e.target.value) || new Date().getFullYear() })
                }
                disabled={isReadOnly}
              />
            </div>

            {/* Moneda */}
            <div className="space-y-2">
              <Label htmlFor="moneda">Moneda</Label>
              <Select
                value={formData.moneda || "BS"}
                onValueChange={(value) => {
                  const nuevaMoneda = value as Moneda
                  // Establecer tipo de cambio según moneda (solo informativo para PDF)
                  // BS = 1, USD = 6.96
                  const nuevoTipoCambio = nuevaMoneda === "USD" ? 6.96 : 1
                  setFormData({ ...formData, moneda: nuevaMoneda, tipo_cambio: nuevoTipoCambio })
                }}
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONEDAS.map((moneda) => (
                    <SelectItem key={moneda} value={moneda}>
                      {moneda}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de Cambio */}
            <div className="space-y-2">
              <Label htmlFor="tipo_cambio">Tipo de Cambio</Label>
              <Input
                id="tipo_cambio"
                type="number"
                step="0.0001"
                min="0"
                value={formData.tipo_cambio || (formData.moneda === "USD" ? 6.96 : 1)}
                onChange={(e) => {
                  const nuevoTipoCambio = parseFloat(e.target.value) || (formData.moneda === "USD" ? 6.96 : 1)
                  setFormData({ ...formData, tipo_cambio: nuevoTipoCambio })
                }}
                disabled={isReadOnly}
              />
            </div>

            {/* Concepto */}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="concepto">Concepto</Label>
              <Input
                id="concepto"
                value={formData.concepto || ""}
                onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                disabled={isReadOnly}
                placeholder="Descripción general del comprobante"
              />
            </div>

            {/* Beneficiario */}
            <div className="space-y-2">
              <Label htmlFor="beneficiario">Beneficiario</Label>
              <Popover
                open={openBeneficiarioCombobox}
                onOpenChange={(open) => {
                  setOpenBeneficiarioCombobox(open)
                  if (open) {
                    setFilteredContactos(todosLosContactos.slice(0, 50))
                  }
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    disabled={isReadOnly}
                    className={cn(
                      "w-full justify-between",
                      !beneficiarioId && "text-muted-foreground"
                    )}
                  >
                    <span className="truncate">
                      {beneficiarioId
                        ? todosLosContactos.find(c => c.id === beneficiarioId)?.displayName || 
                          todosLosContactos.find(c => c.id === beneficiarioId)?.nombre || 
                          formData.beneficiario || 
                          "Seleccionar beneficiario"
                        : formData.beneficiario || "Seleccionar beneficiario"}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command shouldFilter={false} className="overflow-visible">
                    <CommandInput
                      placeholder="Buscar beneficiario..."
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
                              const contactoSeleccionado = todosLosContactos.find(c => c.id === contacto.id)
                              if (contactoSeleccionado) {
                                setBeneficiarioId(contacto.id)
                                setFormData({ 
                                  ...formData, 
                                  beneficiario: contactoSeleccionado.displayName || contactoSeleccionado.nombre || contactoSeleccionado.legalName || "" 
                                })
                              }
                              setOpenBeneficiarioCombobox(false)
                            }}
                            className="cursor-pointer"
                          >
                            <Check className={cn("mr-2 h-4 w-4", beneficiarioId === contacto.id ? "opacity-100" : "opacity-0")} />
                            <div className="flex flex-col">
                              <span className="font-medium">{contacto.displayName || contacto.nombre}</span>
                              {contacto.legalName && <span className="text-xs text-gray-500">{contacto.legalName}</span>}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Nro. Cheque */}
            <div className="space-y-2">
              <Label htmlFor="nro_cheque">Nro. Cheque</Label>
              <Input
                id="nro_cheque"
                value={formData.nro_cheque || ""}
                onChange={(e) => setFormData({ ...formData, nro_cheque: e.target.value })}
                disabled={isReadOnly}
                className="font-mono"
              />
            </div>

            {/* Estado */}
            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Input
                id="estado"
                value={formData.estado || "BORRADOR"}
                disabled
                className="bg-gray-50 font-semibold"
              />
            </div>

            {/* Plantilla Contable - Solo visible si está en BORRADOR o es nuevo comprobante */}
            {(!comprobante || comprobante.estado === "BORRADOR") && (
              <div className="space-y-2">
                <Label htmlFor="plantilla">Plantilla contable</Label>
                <div className="flex gap-2">
                  <Select
                    value={plantillaSeleccionada}
                    onValueChange={(value) => {
                      setPlantillaSeleccionada(value)
                    }}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Seleccionar plantilla..." />
                    </SelectTrigger>
                    <SelectContent>
                      {plantillas.map((plantilla) => (
                        <SelectItem key={plantilla.codigo} value={plantilla.codigo}>
                          {plantilla.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
          <Button
            onClick={handleAplicarPlantilla}
            disabled={!plantillaSeleccionada || isReadOnly || aplicandoPlantilla}
            variant="outline"
          >
            {aplicandoPlantilla ? "Aplicando..." : "Aplicar plantilla"}
          </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detalle del Comprobante */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Detalle del Comprobante</CardTitle>
              <CardDescription>Líneas del asiento contable</CardDescription>
            </div>
            <Button
              size="sm"
              onClick={handleAddDetalle}
              disabled={isReadOnly}
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Línea
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Cuenta</TableHead>
                  <TableHead className="w-24">Auxiliar</TableHead>
                  <TableHead>Glosa</TableHead>
                  <TableHead className="w-24 text-right">Debe Bs</TableHead>
                  <TableHead className="w-24 text-right">Haber Bs</TableHead>
                  <TableHead className="w-24 text-right">Debe USD</TableHead>
                  <TableHead className="w-24 text-right">Haber USD</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detalles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                      No hay líneas agregadas. Click en "Agregar Línea" para comenzar.
                    </TableCell>
                  </TableRow>
                ) : (
                  detalles.map((detalle, index) => (
                    <TableRow key={index}>
                      <TableCell className="w-[250px]">
                        {/* Cuenta: bloqueada si cuenta_es_fija === true */}
                        {(() => {
                          const cuentaEsFija = (detalle as any).cuenta_es_fija === true
                          
                          if (cuentaEsFija) {
                            // Renderizar cuenta fija bloqueada
                            // Normalizar búsqueda: convertir a String y aplicar trim
                            const cuentaCodigoNormalizado = String(detalle.cuenta || "").trim()
                            const cuentaSugerida = String((detalle as any).cuenta_sugerida || "").trim()
                            
                            // Buscar cuenta con normalización
                            const cuenta = cuentas.find(c => {
                              const codigoNormalizado = String(c.cuenta || "").trim()
                              return codigoNormalizado === cuentaCodigoNormalizado
                            })
                            
                            // Fallback: intentar con cuenta_sugerida si no se encontró
                            const cuentaAlternativa = !cuenta && cuentaSugerida
                              ? cuentas.find(c => {
                                  const codigoNormalizado = String(c.cuenta || "").trim()
                                  return codigoNormalizado === cuentaSugerida
                                })
                              : null
                            
                            // 🔍 LOG DE DIAGNÓSTICO: Búsqueda de cuenta fija
                            console.log("🔍 BUSQUEDA CUENTA (Fija)", {
                              detalleCuenta: detalle.cuenta,
                              cuentaCodigoNormalizado,
                              cuentaSugerida,
                              cuentaEncontrada: cuenta || cuentaAlternativa,
                              totalCuentasCargadas: cuentas.length,
                              primerasCuentas: cuentas.slice(0, 5).map(c => ({ cuenta: c.cuenta, descripcion: c.descripcion }))
                            })
                            
                            const cuentaFinal = cuenta || cuentaAlternativa
                            
                            if (cuentaFinal) {
                              const displayText = `${cuentaFinal.cuenta} - ${cuentaFinal.descripcion}`
                              return (
                                <div className="w-[250px] h-9 px-3 py-2 bg-gray-100 rounded-md border border-gray-200 flex items-center font-mono text-sm overflow-hidden">
                                  <span className="truncate flex-1" title={displayText}>
                                    {displayText}
                                  </span>
                                  <span className="ml-2 text-xs text-gray-500 whitespace-nowrap">(Fija)</span>
                                </div>
                              )
                            } else {
                              // Cuenta no encontrada, mostrar código con fallback seguro
                              const codigoAMostrar = cuentaCodigoNormalizado || cuentaSugerida || "Sin cuenta"
                              return (
                                <div className="w-[250px] h-9 px-3 py-2 bg-gray-100 rounded-md border border-gray-200 flex items-center font-mono text-sm overflow-hidden">
                                  <span className="truncate flex-1" title={codigoAMostrar}>
                                    {codigoAMostrar}
                                  </span>
                                  <span className="ml-2 text-xs text-gray-500 whitespace-nowrap">(Fija)</span>
                                </div>
                              )
                            }
                          }
                          
                          // No es cuenta fija, renderizar selector normal
                          return (
                          <Popover
                            open={openCuentaCombobox[index] || false}
                            onOpenChange={(open) => {
                              setOpenCuentaCombobox(prev => ({ ...prev, [index]: open }))
                              if (open) {
                                // Si no hay cuenta seleccionada pero hay cuenta_sugerida, precargarla
                                const cuentaSugerida = (detalle as any).cuenta_sugerida
                                if (!detalle.cuenta && cuentaSugerida) {
                                  const cuentaSugeridaNormalizada = String(cuentaSugerida).trim()
                                  const cuentaEncontrada = cuentas.find(c => String(c.cuenta || "").trim() === cuentaSugeridaNormalizada)
                                  if (cuentaEncontrada) {
                                    // Precargar la cuenta sugerida en el selector
                                    setFilteredCuentas(prev => ({ 
                                      ...prev, 
                                      [index]: [cuentaEncontrada, ...cuentas.filter(c => c.cuenta !== cuentaSugerida).slice(0, 19)]
                                    }))
                                  } else {
                                    // Si no se encuentra, mostrar las primeras 20
                                    setFilteredCuentas(prev => ({ ...prev, [index]: cuentas.slice(0, 20) }))
                                  }
                                } else {
                                  // Al abrir, mostrar las primeras 20 cuentas
                                  setFilteredCuentas(prev => ({ ...prev, [index]: cuentas.slice(0, 20) }))
                                }
                              }
                            }}
                          >
                            {(() => {
                              const esFija = (detalle as any).cuenta_es_fija === true
                              const displayText = getCuentaDisplayText(detalle.cuenta || "", esFija)
                              // 4️⃣ VISUALIZACIÓN DE CUENTA: Normalizar búsqueda
                              const cuentaCodigoNormalizado = String(detalle.cuenta || "").trim()
                              const cuenta = cuentas.find(c => String(c.cuenta || "").trim() === cuentaCodigoNormalizado)
                              
                              // 🔍 LOG DE DIAGNÓSTICO: Búsqueda de cuenta en combobox
                              console.log("🔍 BUSQUEDA CUENTA (Combobox)", {
                                detalleCuenta: detalle.cuenta,
                                esFija: esFija,
                                cuentaEncontrada: cuenta,
                                totalCuentasCargadas: cuentas.length,
                                primerasCuentas: cuentas.slice(0, 5).map(c => ({ cuenta: c.cuenta, descripcion: c.descripcion }))
                              })
                              
                              const fullText = cuenta 
                                ? `${cuenta.cuenta} - ${cuenta.descripcion}${esFija ? ' (Fija)' : ''}` 
                                : displayText
                              
                              return (
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    disabled={isReadOnly || esFija}
                                    className={cn(
                                      "w-[250px] h-9 justify-between font-mono text-sm overflow-hidden",
                                      !detalle.cuenta && "text-muted-foreground",
                                      esFija && "bg-gray-50 cursor-not-allowed"
                                    )}
                                  >
                                    <TruncatedTextWithTooltip 
                                      text={displayText} 
                                      fullText={fullText}
                                      className="block text-left flex-1"
                                    />
                                    {!esFija && <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
                                  </Button>
                                </PopoverTrigger>
                              )
                            })()}
                            <PopoverContent className="w-[400px] p-0" align="start">
                              <Command shouldFilter={false} className="overflow-visible">
                                <CommandInput
                                  placeholder="Buscar por código o descripción..."
                                  className="h-9 border-0 focus:ring-0"
                                  onValueChange={(value) => filtrarCuentas(index, value)}
                                />
                                <CommandList>
                                  <CommandEmpty>
                                    {loadingCuentas ? "Cargando..." : "No se encontraron cuentas."}
                                  </CommandEmpty>
                                  {(filteredCuentas[index] || []).length > 0 && (
                                    <CommandGroup>
                                      {(filteredCuentas[index] || []).map((cuenta) => (
                                        <CommandItem
                                          key={cuenta.id}
                                          value={`${cuenta.cuenta} ${cuenta.descripcion}`}
                                          onSelect={() => seleccionarCuenta(index, cuenta)}
                                          className="cursor-pointer"
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              detalle.cuenta === cuenta.cuenta ? "opacity-100" : "opacity-0"
                                            )}
                                          />
                                          <div className="flex items-center gap-2">
                                            <span className="font-mono font-medium">{cuenta.cuenta}</span>
                                            <span className="text-gray-600 truncate">{cuenta.descripcion}</span>
                                          </div>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  )}
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          )
                        })()}
                      </TableCell>
                      <TableCell>
                        <Popover
                          open={openAuxiliarCombobox[index]}
                          onOpenChange={(open) => {
                            setOpenAuxiliarCombobox(prev => ({ ...prev, [index]: open }))
                            if (open) {
                              // Si hay un auxiliar seleccionado, buscarlo y ponerlo primero
                              if (detalle.auxiliar) {
                                const auxiliarEncontrado = auxiliares.find(a => {
                                  const contacto = a.contactos
                                  const nombre = contacto?.nombre ?? a.nombre ?? a.nombre
                                  return nombre === detalle.auxiliar
                                })
                                if (auxiliarEncontrado) {
                                  // Poner el auxiliar seleccionado primero
                                  setFilteredAuxiliares(prev => ({ 
                                    ...prev, 
                                    [index]: [auxiliarEncontrado, ...auxiliares.filter(a => a.id !== auxiliarEncontrado.id).slice(0, 19)]
                                  }))
                                } else {
                                  // Si no se encuentra, mostrar las primeras 20
                                  setFilteredAuxiliares(prev => ({ ...prev, [index]: auxiliares.slice(0, 20) }))
                                }
                              } else {
                                // Al abrir, mostrar las primeras 20 auxiliares
                                setFilteredAuxiliares(prev => ({ ...prev, [index]: auxiliares.slice(0, 20) }))
                              }
                            }
                          }}
                        >
                          {(() => {
                            const displayText = getAuxiliarDisplayText(detalle.auxiliar || null)
                            return (
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                          disabled={isReadOnly}
                                  className={cn(
                                    "w-[200px] h-9 justify-between text-sm overflow-hidden",
                                    !detalle.auxiliar && "text-muted-foreground"
                                  )}
                                >
                                  <span className="truncate text-left flex-1">
                                    {displayText}
                                  </span>
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                            )
                          })()}
                          <PopoverContent className="w-[400px] p-0" align="start">
                            <Command shouldFilter={false} className="overflow-visible">
                              <CommandInput
                                placeholder="Buscar por nombre o código..."
                                className="h-9 border-0 focus:ring-0"
                                onValueChange={(value) => filtrarAuxiliares(index, value)}
                              />
                              <CommandList>
                                <CommandEmpty>
                                  {loadingAuxiliares ? "Cargando..." : "No se encontraron auxiliares."}
                                </CommandEmpty>
                                {(filteredAuxiliares[index] || []).length > 0 && (
                                  <CommandGroup>
                                    {(filteredAuxiliares[index] || []).map((auxiliar) => {
                                      // Priorizar nombre de contactos si existe
                                      const contacto = auxiliar.contactos
                                      const nombre = contacto?.nombre ?? auxiliar.nombre ?? auxiliar.nombre
                                      const isSelected = detalle.auxiliar === nombre
                                      
                                      return (
                                        <CommandItem
                                          key={auxiliar.id}
                                          value={`${auxiliar.codigo} ${nombre}`}
                                          onSelect={() => seleccionarAuxiliar(index, auxiliar)}
                                          className="cursor-pointer"
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              isSelected ? "opacity-100" : "opacity-0"
                                            )}
                                          />
                                          <div className="flex items-center gap-2">
                                            <span className="truncate">{nombre}</span>
                                            <span className="text-gray-400 text-xs font-mono ml-auto">
                                              {auxiliar.codigo}
                                            </span>
                                          </div>
                                        </CommandItem>
                                      )
                                    })}
                                  </CommandGroup>
                                )}
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={detalle.glosa || ""}
                          onChange={(e) =>
                            handleDetalleChange(index, "glosa", e.target.value || null)
                          }
                          disabled={isReadOnly}
                          placeholder="Glosa línea"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={detalle.debe_bs || 0}
                          onChange={(e) =>
                            handleDetalleChange(
                              index,
                              "debe_bs",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          disabled={isReadOnly || detalle.esCalculado}
                          className={cn(
                            "w-24 text-right font-mono",
                            detalle.esCalculado && "bg-gray-100 cursor-not-allowed"
                          )}
                          title={detalle.esCalculado ? "Campo calculado automáticamente" : ""}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={detalle.haber_bs || 0}
                          onChange={(e) =>
                            handleDetalleChange(
                              index,
                              "haber_bs",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          disabled={isReadOnly || detalle.esCalculado}
                          className={cn(
                            "w-24 text-right font-mono",
                            detalle.esCalculado && "bg-gray-100 cursor-not-allowed"
                          )}
                          title={detalle.esCalculado ? "Campo calculado automáticamente" : ""}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={detalle.debe_usd || 0}
                          onChange={(e) =>
                            handleDetalleChange(
                              index,
                              "debe_usd",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          disabled={isReadOnly || detalle.esCalculado}
                          className={cn(
                            "w-24 text-right font-mono",
                            detalle.esCalculado && "bg-gray-100 cursor-not-allowed"
                          )}
                          title={detalle.esCalculado ? "Campo calculado automáticamente" : ""}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={detalle.haber_usd || 0}
                          onChange={(e) =>
                            handleDetalleChange(
                              index,
                              "haber_usd",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          disabled={isReadOnly || detalle.esCalculado}
                          className={cn(
                            "w-24 text-right font-mono",
                            detalle.esCalculado && "bg-gray-100 cursor-not-allowed"
                          )}
                          title={detalle.esCalculado ? "Campo calculado automáticamente" : ""}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveDetalle(index)}
                          disabled={isReadOnly}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Totales */}
          <Separator className="my-4" />
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div className="space-y-2 text-center">
              <div className="font-semibold">Total Debe Bs</div>
              <div className="text-lg font-mono">
                {totales.debe_bs.toLocaleString("es-BO", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
            <div className="space-y-2 text-center">
              <div className="font-semibold">Total Haber Bs</div>
              <div className="text-lg font-mono">
                {totales.haber_bs.toLocaleString("es-BO", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
            <div className="space-y-2 text-center">
              <div className="font-semibold">Diferencia Bs</div>
              <div
                className={`text-lg font-mono ${
                  Math.abs(diferenciaBs) < 0.01
                    ? "text-green-600"
                    : "text-red-600 font-bold"
                }`}
              >
                {diferenciaBs.toLocaleString("es-BO", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
            <div className="space-y-2 text-center">
              <div className="font-semibold">Diferencia USD</div>
              <div
                className={`text-lg font-mono ${
                  Math.abs(diferenciaUsd) < 0.01
                    ? "text-green-600"
                    : "text-red-600 font-bold"
                }`}
              >
                {diferenciaUsd.toLocaleString("es-BO", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
          </div>

          {!isBalanced && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
              ⚠️ El comprobante no está balanceado. Debe = Haber para poder aprobarlo.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}



