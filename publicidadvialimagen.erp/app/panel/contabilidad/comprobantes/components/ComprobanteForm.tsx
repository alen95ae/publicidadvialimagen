"use client"

import { useState, useEffect, useCallback } from "react"
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
import { Plus, Save, Trash2, CheckCircle, Check, ChevronsUpDown } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { api } from "@/lib/fetcher"
import type { Comprobante, ComprobanteDetalle, OrigenComprobante, TipoComprobante, TipoAsiento, EstadoComprobante, Moneda, Cuenta } from "@/lib/types/contabilidad"

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
        comprobante.detalles.forEach((_, idx) => {
          initialFilters[idx] = cuentas.slice(0, 20)
        })
        setFilteredCuentas(initialFilters)
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
        // Filtrar solo cuentas transaccionales
        const transaccionales = (data.data || []).filter(
          (c: Cuenta) => c.transaccional === true
        )
        setCuentas(transaccionales)
      }
    } catch (error) {
      console.error("Error fetching cuentas:", error)
    } finally {
      setLoadingCuentas(false)
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
                        esCalculado: detPlantilla.rol === "IVA_CREDITO" || detPlantilla.rol === "IVA_DEBITO" || 
                                     detPlantilla.rol === "PROVEEDOR" || detPlantilla.rol === "CLIENTE" || detPlantilla.rol === "CAJA_BANCO",
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
          esCalculado: det.esCalculado ?? (det.rol === "IVA_CREDITO" || det.rol === "IVA_DEBITO" || 
                                           det.rol === "PROVEEDOR" || det.rol === "CLIENTE" || det.rol === "CAJA_BANCO"),
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
        
        // Si hay líneas calculadas, recalcular montos después de cargar
        const tieneLineasCalculadas = detallesData.some((d: any) => d.esCalculado)
        if (tieneLineasCalculadas) {
          setTimeout(() => {
            recalcularMontos()
          }, 100)
        }
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
      rol: "GASTO", // Por defecto, el usuario puede cambiar
      esCalculado: false,
    }
    const newIndex = detalles.length
    setDetalles([...detalles, newDetalle])
    // Inicializar filtro para el nuevo detalle
    setFilteredCuentas(prev => ({ ...prev, [newIndex]: cuentas.slice(0, 20) }))
    
    // Activar recálculo si hay líneas calculadas
    const tieneLineasCalculadas = detalles.some((d) => d.esCalculado)
    if (tieneLineasCalculadas) {
      setTimeout(() => {
        recalcularMontos()
      }, 10)
    }
  }

  const handleRemoveDetalle = (index: number) => {
    const detalleAEliminar = detalles[index]
    const newDetalles = detalles.filter((_, i) => i !== index)
    setDetalles(newDetalles)
    // Reindexar filtros después de eliminar
    const newFilters: Record<number, Cuenta[]> = {}
    newDetalles.forEach((_, idx) => {
      newFilters[idx] = filteredCuentas[idx + 1] || cuentas.slice(0, 20)
    })
    setFilteredCuentas(newFilters)
    // Cerrar combobox si estaba abierto
    const newOpenState: Record<number, boolean> = {}
    
    // Activar recálculo si se eliminó una línea base y hay líneas calculadas
    const tieneLineasCalculadas = newDetalles.some((d) => d.esCalculado)
    if (tieneLineasCalculadas && (detalleAEliminar.rol === "GASTO" || detalleAEliminar.rol === "INGRESO" || !detalleAEliminar.esCalculado)) {
      setTimeout(() => {
        recalcularMontos()
      }, 10)
    }
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
    const updated = [...detalles]
    // Tipo de cambio fijo para conversión automática en detalles (siempre 6.96)
    const tipoCambio = 6.96
    
    // Si se cambia debe_bs, calcular debe_usd automáticamente
    if (field === "debe_bs") {
      const valorBs = parseFloat(value) || 0
      const valorUsd = valorBs / tipoCambio
      updated[index] = { 
        ...updated[index], 
        [field]: valorBs,
        debe_usd: Math.round(valorUsd * 100) / 100 // Redondear a 2 decimales
      }
    }
    // Si se cambia haber_bs, calcular haber_usd automáticamente
    else if (field === "haber_bs") {
      const valorBs = parseFloat(value) || 0
      const valorUsd = valorBs / tipoCambio
      updated[index] = { 
        ...updated[index], 
        [field]: valorBs,
        haber_usd: Math.round(valorUsd * 100) / 100 // Redondear a 2 decimales
      }
    }
    // Si se cambia debe_usd, calcular debe_bs automáticamente
    else if (field === "debe_usd") {
      const valorUsd = parseFloat(value) || 0
      const valorBs = valorUsd * tipoCambio
      updated[index] = { 
        ...updated[index], 
        [field]: valorUsd,
        debe_bs: Math.round(valorBs * 100) / 100 // Redondear a 2 decimales
      }
    }
    // Si se cambia haber_usd, calcular haber_bs automáticamente
    else if (field === "haber_usd") {
      const valorUsd = parseFloat(value) || 0
      const valorBs = valorUsd * tipoCambio
      updated[index] = { 
        ...updated[index], 
        [field]: valorUsd,
        haber_bs: Math.round(valorBs * 100) / 100 // Redondear a 2 decimales
      }
    }
    // Para cualquier otro campo, solo actualizar ese campo
    else {
      updated[index] = { ...updated[index], [field]: value }
    }
    
    setDetalles(updated)
    
    // Activar recálculo si se modificó un monto base (GASTO/INGRESO) y hay líneas calculadas
    const detalleActualizado = updated[index]
    const tieneLineasCalculadas = updated.some((d) => d.esCalculado)
    if (tieneLineasCalculadas && 
        (detalleActualizado.rol === "GASTO" || detalleActualizado.rol === "INGRESO") && 
        !detalleActualizado.esCalculado &&
        (field === "debe_bs" || field === "haber_bs" || field === "debe_usd" || field === "haber_usd")) {
      // Usar setTimeout para evitar actualizaciones durante el render
      setTimeout(() => {
        recalcularMontos()
      }, 10)
    }
  }
  
  // useEffect para recálculo automático cuando cambian montos base
  useEffect(() => {
    // Solo recalcular si hay detalles con plantilla y líneas calculadas
    const tienePlantilla = detalles.some((d) => d.rol)
    const tieneLineasCalculadas = detalles.some((d) => d.esCalculado)
    if (tienePlantilla && tieneLineasCalculadas && detalles.length > 0) {
      // Obtener hash de montos base para detectar cambios
      const montosBase = detalles
        .filter((d) => (d.rol === "GASTO" || d.rol === "INGRESO") && !d.esCalculado)
        .map((d) => `${d.debe_bs || 0}-${d.haber_bs || 0}-${d.debe_usd || 0}-${d.haber_usd || 0}`)
        .join("|")
      
      // Recalcular solo si hay montos base
      if (montosBase) {
        const timer = setTimeout(() => {
          recalcularMontos()
        }, 100)
        return () => clearTimeout(timer)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detalles.filter((d) => (d.rol === "GASTO" || d.rol === "INGRESO") && !d.esCalculado).map((d) => `${d.debe_bs || 0}-${d.haber_bs || 0}-${d.debe_usd || 0}-${d.haber_usd || 0}`).join("|")])

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

  // Motor de recálculo automático
  // Usa los datos de la plantilla: rol, lado, porcentaje
  const recalcularMontos = useCallback(() => {
    setDetalles((detallesActuales) => {
      const nuevosDetalles = [...detallesActuales]
      
      // 1. Calcular total BASE (líneas con rol GASTO o INGRESO que NO son calculadas)
      // Sumar según el lado definido en la plantilla
      let totalBaseBs = 0
      let totalBaseUsd = 0
      
      detallesActuales.forEach((det) => {
        if ((det.rol === "GASTO" || det.rol === "INGRESO") && !det.esCalculado) {
          // Sumar según el lado de la plantilla
          if (det.lado === "DEBE") {
            totalBaseBs += det.debe_bs || 0
            totalBaseUsd += det.debe_usd || 0
          } else if (det.lado === "HABER") {
            totalBaseBs += det.haber_bs || 0
            totalBaseUsd += det.haber_usd || 0
          }
        }
      })
      
      // 2. Calcular IVA usando el porcentaje de la plantilla
      // Buscar la primera línea de IVA para obtener el porcentaje
      let porcentajeIVA = 0
      detallesActuales.forEach((det) => {
        if ((det.rol === "IVA_CREDITO" || det.rol === "IVA_DEBITO") && det.porcentaje && porcentajeIVA === 0) {
          porcentajeIVA = det.porcentaje
        }
      })
      
      // Calcular IVA total (una sola vez)
      const montoIVABs = porcentajeIVA > 0 ? Math.round((totalBaseBs * porcentajeIVA / 100) * 100) / 100 : 0
      const montoIVAUsd = porcentajeIVA > 0 ? Math.round((totalBaseUsd * porcentajeIVA / 100) * 100) / 100 : 0
      
      // 3. Calcular PROVEEDOR/CLIENTE = BASE + IVA
      const montoProveedorBs = totalBaseBs + montoIVABs
      const montoProveedorUsd = totalBaseUsd + montoIVAUsd
      
      console.log("🔄 Recalculando montos (usando datos de plantilla):")
      console.log("  Total BASE (Bs):", totalBaseBs)
      console.log("  Total BASE (USD):", totalBaseUsd)
      console.log("  Porcentaje IVA:", porcentajeIVA, "%")
      console.log("  IVA (Bs):", montoIVABs)
      console.log("  IVA (USD):", montoIVAUsd)
      console.log("  PROVEEDOR (Bs):", montoProveedorBs)
      console.log("  PROVEEDOR (USD):", montoProveedorUsd)

      // 4. Aplicar recálculo a cada línea calculada usando lado y porcentaje de la plantilla
      nuevosDetalles.forEach((det, index) => {
        if (det.esCalculado) {
          // Línea de IVA (IVA_CREDITO o IVA_DEBITO)
          if (det.rol === "IVA_CREDITO" || det.rol === "IVA_DEBITO") {
            // Usar el monto IVA calculado (mismo para todas las líneas de IVA)
            // Usar el lado definido en la plantilla
            if (det.lado === "DEBE") {
              nuevosDetalles[index] = { 
                ...det, 
                debe_bs: montoIVABs, 
                haber_bs: 0, 
                debe_usd: montoIVAUsd, 
                haber_usd: 0 
              }
            } else if (det.lado === "HABER") {
              nuevosDetalles[index] = { 
                ...det, 
                debe_bs: 0, 
                haber_bs: montoIVABs, 
                debe_usd: 0, 
                haber_usd: montoIVAUsd 
              }
            }
          }
          // Línea de PROVEEDOR (total = BASE + IVA)
          else if (det.rol === "PROVEEDOR") {
            // Usar el lado definido en la plantilla
            if (det.lado === "DEBE") {
              nuevosDetalles[index] = { 
                ...det, 
                debe_bs: montoProveedorBs, 
                haber_bs: 0, 
                debe_usd: montoProveedorUsd, 
                haber_usd: 0 
              }
            } else if (det.lado === "HABER") {
              nuevosDetalles[index] = { 
                ...det, 
                debe_bs: 0, 
                haber_bs: montoProveedorBs, 
                debe_usd: 0, 
                haber_usd: montoProveedorUsd 
              }
            }
          }
          // Línea de CLIENTE/CAJA_BANCO (balanceo automático)
          else if (det.rol === "CLIENTE" || det.rol === "CAJA_BANCO") {
            // Calcular suma DEBE y suma HABER de todas las líneas excepto esta
            let sumaDebeBs = 0
            let sumaHaberBs = 0
            let sumaDebeUsd = 0
            let sumaHaberUsd = 0
            
            detallesActuales.forEach((d, idx) => {
              // Sumar todas las líneas excepto esta misma línea de total
              if (idx !== index) {
                sumaDebeBs += d.debe_bs || 0
                sumaHaberBs += d.haber_bs || 0
                sumaDebeUsd += d.debe_usd || 0
                sumaHaberUsd += d.haber_usd || 0
              }
            })

            // El total debe hacer que DEBE = HABER
            const diferenciaBs = sumaDebeBs - sumaHaberBs
            const diferenciaUsd = sumaDebeUsd - sumaHaberUsd
            
            // Usar el lado definido en la plantilla
            if (det.lado === "DEBE") {
              nuevosDetalles[index] = { 
                ...det, 
                debe_bs: Math.abs(diferenciaBs), 
                haber_bs: 0, 
                debe_usd: Math.abs(diferenciaUsd), 
                haber_usd: 0 
              }
            } else if (det.lado === "HABER") {
              nuevosDetalles[index] = { 
                ...det, 
                debe_bs: 0, 
                haber_bs: Math.abs(diferenciaBs), 
                debe_usd: 0, 
                haber_usd: Math.abs(diferenciaUsd) 
              }
            }
          }
        }
      })

      return nuevosDetalles
    })
  }, [formData.moneda])

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
        const detallesConPlantilla = data.data.detalles.map((det: any) => ({
          ...det,
          esCalculado: det.rol === "IVA_CREDITO" || det.rol === "IVA_DEBITO" || 
                       det.rol === "PROVEEDOR" || det.rol === "CLIENTE" || det.rol === "CAJA_BANCO",
        }))
        console.log("📋 Detalles cargados de plantilla:", detallesConPlantilla)
        console.log("📊 Total de líneas:", detallesConPlantilla.length)
        setDetalles(detallesConPlantilla)
        
        // Inicializar filtros para las nuevas líneas
        const initialFilters: Record<number, Cuenta[]> = {}
        detallesConPlantilla.forEach((_, idx) => {
          initialFilters[idx] = cuentas.slice(0, 20)
        })
        setFilteredCuentas(initialFilters)
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

  // Obtener el texto a mostrar para la cuenta seleccionada
  const getCuentaDisplayText = (cuentaCodigo: string) => {
    if (!cuentaCodigo) return "Seleccionar cuenta..."
    const cuenta = cuentas.find(c => c.cuenta === cuentaCodigo)
    if (cuenta) {
      return `${cuenta.cuenta} - ${cuenta.descripcion}`
    }
    return cuentaCodigo
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
                        {/* Cuenta: bloqueada si es IVA_CREDITO o IVA_DEBITO */}
                        {detalle.rol === "IVA_CREDITO" || detalle.rol === "IVA_DEBITO" ? (
                          <div className="w-[250px] h-9 px-3 py-2 bg-gray-100 rounded-md border border-gray-200 flex items-center font-mono text-sm">
                            <span className="truncate">
                              {getCuentaDisplayText(detalle.cuenta || "")}
                            </span>
                            <span className="ml-2 text-xs text-gray-500">(Fija)</span>
                          </div>
                        ) : (
                          <Popover
                            open={openCuentaCombobox[index] || false}
                            onOpenChange={(open) => {
                              setOpenCuentaCombobox(prev => ({ ...prev, [index]: open }))
                              if (open) {
                                // Al abrir, mostrar las primeras 20 cuentas
                                setFilteredCuentas(prev => ({ ...prev, [index]: cuentas.slice(0, 20) }))
                              }
                            }}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                disabled={isReadOnly}
                                className={cn(
                                  "w-[250px] h-9 justify-between font-mono text-sm overflow-hidden",
                                  !detalle.cuenta && "text-muted-foreground"
                                )}
                              >
                                <span className="truncate block text-left">
                                  {getCuentaDisplayText(detalle.cuenta || "")}
                                </span>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
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
                        )}
                      </TableCell>
                      <TableCell>
                        <Input
                          value={detalle.auxiliar || ""}
                          onChange={(e) =>
                            handleDetalleChange(index, "auxiliar", e.target.value || null)
                          }
                          disabled={isReadOnly}
                          className="w-24"
                          placeholder="Auxiliar"
                        />
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



