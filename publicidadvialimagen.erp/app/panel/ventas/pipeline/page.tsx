"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Plus, 
  Search, 
  Filter, 
  Edit,
  Trash2,
  Loader2,
  MoreVertical,
  X,
  CheckCircle
} from "lucide-react"
import { toast } from "sonner"
import { Toaster } from "sonner"
import { usePermisosContext } from "@/hooks/permisos-provider"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  useDroppable,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Pipeline {
  id: string
  nombre: string
  descripcion?: string | null
  is_default?: boolean
  is_archived?: boolean
}

interface Stage {
  id: string
  pipeline_id: string
  nombre: string
  posicion: number
  is_archived: boolean
}

interface Opportunity {
  id: string
  pipeline_id: string
  stage_id: string
  titulo: string
  descripcion?: string | null
  valor_estimado?: number | null
  moneda?: string
  probabilidad?: number
  ciudad?: string | null
  origen?: string | null
  interes?: string | null
  estado: string
  motivo_perdida?: string | null
  fecha_cierre_estimada?: string | null
  posicion_en_etapa: number
  lead?: { id: string; nombre: string; empresa?: string; email?: string } | null
  contacto?: { id: string; nombre: string; empresa?: string; email?: string } | null
  vendedor?: { id: string; nombre: string | null; imagen_usuario?: any | null; email?: string | null } | null
}

interface OpportunityFormData {
  lead_id?: string
  vendedor_id?: string
  titulo: string
  descripcion?: string
  valor_estimado?: number
  moneda?: string
  ciudad?: string
  origen?: string
  interes?: string
  estado: string
  motivo_perdida?: string
}

interface Lead {
  id: string
  nombre: string
  empresa?: string
  email?: string
  telefono?: string
}

interface Vendedor {
  id: string
  nombre: string
  email?: string
  imagen_usuario?: any
  rol?: string
}

type VendedorOption = Vendedor

export default function PipelinePage() {
  const { puedeEliminar, puedeEditar, esAdmin } = usePermisosContext()
  const [pipelines, setPipelines] = useState<any[]>([])
  const [pipelineId, setPipelineId] = useState<string | null>(null)
  const [stages, setStages] = useState<any[]>([])
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [isLoadingPipelines, setIsLoadingPipelines] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filtroOrigen, setFiltroOrigen] = useState<string>("all")
  const [filtroInteres, setFiltroInteres] = useState<string>("all")
  const [filtroCiudad, setFiltroCiudad] = useState<string>("all")
  const [filtroEstado, setFiltroEstado] = useState<string>("all")
  
  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingOpportunityId, setDeletingOpportunityId] = useState<string | null>(null)
  const [isDeleteStageDialogOpen, setIsDeleteStageDialogOpen] = useState(false)
  const [deletingStageId, setDeletingStageId] = useState<string | null>(null)
  
  // Modal de crear etapa
  const [isCreateStageDialogOpen, setIsCreateStageDialogOpen] = useState(false)
  const [newStageName, setNewStageName] = useState("")
  const [isCreatingStage, setIsCreatingStage] = useState(false)
  
  // Modal de pipeline
  const [isPipelineModalOpen, setIsPipelineModalOpen] = useState(false)
  const [editingPipeline, setEditingPipeline] = useState<Pipeline | null>(null)
  const [pipelineFormData, setPipelineFormData] = useState({
    nombre: "",
    descripcion: "",
    is_default: false
  })
  const [isSavingPipeline, setIsSavingPipeline] = useState(false)
  
  // Formulario
  const [formData, setFormData] = useState<OpportunityFormData>({
    lead_id: undefined,
    titulo: "",
    descripcion: "",
    valor_estimado: undefined,
    moneda: "BOB",
    ciudad: "",
    origen: "",
    interes: "",
    estado: "abierta",
    motivo_perdida: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Estados para selector de leads
  const [openLeadCombobox, setOpenLeadCombobox] = useState(false)
  const [todosLosLeads, setTodosLosLeads] = useState<Lead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([])
  const [cargandoLeads, setCargandoLeads] = useState(false)
  
  // Estado para vendedor actual
  const [currentUser, setCurrentUser] = useState<Vendedor | null>(null)
  
  // Estados para selector de vendedores (solo en edición)
  const [todosLosVendedores, setTodosLosVendedores] = useState<VendedorOption[]>([])
  const [filteredVendedores, setFilteredVendedores] = useState<VendedorOption[]>([])
  const [cargandoVendedores, setCargandoVendedores] = useState(false)
  const [openVendedorCombobox, setOpenVendedorCombobox] = useState(false)
  
  // Drag & Drop
  const [activeId, setActiveId] = useState<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  )

  // Cargar pipelines
  useEffect(() => {
    const fetchPipelines = async () => {
      try {
        console.log('🔍 Fetching pipelines...')
        const res = await fetch('/api/ventas/pipelines', {
          credentials: "include"
        })
        
        console.log('📡 Response status:', res.status, res.statusText)
        
        if (!res.ok) {
          const errorText = await res.text()
          console.error('❌ Error response:', res.status, res.statusText, errorText)
          setIsLoadingPipelines(false)
          toast.error(`Error al cargar pipelines: ${res.status}`)
          return
        }
        
        const data = await res.json()
        console.log('📦 Pipelines response:', JSON.stringify(data, null, 2))
        
        // 🔥 AQUÍ está la clave
        let pipelinesData: any[] = []
        if (data.success && Array.isArray(data.data)) {
          pipelinesData = data.data
        } else if (Array.isArray(data)) {
          pipelinesData = data
        } else if (data.data && Array.isArray(data.data)) {
          pipelinesData = data.data
        }
        
        console.log('📋 Pipelines data (processed):', pipelinesData)
        console.log('📋 Is array?', Array.isArray(pipelinesData))
        console.log('📋 Length:', pipelinesData.length)
        
        if (!Array.isArray(pipelinesData) || pipelinesData.length === 0) {
          console.warn('⚠️ No pipelines found or invalid format')
          setPipelines([])
          setIsLoadingPipelines(false)
          return
        }
        
        setPipelines(pipelinesData)
        
        const defaultPipeline =
          pipelinesData.find((p: any) => p.is_default) ?? pipelinesData[0]
        
        console.log('🎯 Default pipeline:', defaultPipeline)
        console.log('🎯 Default pipeline ID:', defaultPipeline?.id)
        
        if (defaultPipeline?.id) {
          console.log('✅ Setting pipelineId:', defaultPipeline.id)
          setPipelineId(defaultPipeline.id)
        } else {
          console.error('❌ No pipeline ID found in defaultPipeline:', defaultPipeline)
        }
      } catch (error) {
        console.error('❌ Error fetching pipelines:', error)
        if (error instanceof Error) {
          console.error('❌ Error message:', error.message)
          console.error('❌ Error stack:', error.stack)
        }
        toast.error("Error al cargar pipelines")
      } finally {
        setIsLoadingPipelines(false)
      }
    }

    fetchPipelines()
  }, [])

  // Fetch de stages (ESTO ES LO QUE FALTA)
  const fetchStages = async () => {
    if (!pipelineId) return

    console.log('🚀 Fetching stages for pipeline', pipelineId)

    const res = await fetch(
      `/api/ventas/pipelines/${pipelineId}/stages`,
      {
        credentials: "include"
      }
    )
    const data = await res.json()

    console.log('📦 STAGES RECEIVED', data)
    
    const stagesData = data.success ? data.data : data
    setStages(stagesData)
  }

  useEffect(() => {
    if (pipelineId) {
      fetchStages()
    }
  }, [pipelineId])

  // Cargar usuario actual
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch('/api/auth/me', {
          credentials: "include"
        })
        if (res.ok) {
          const data = await res.json()
          if (data.success && data.user) {
            setCurrentUser({
              id: data.user.id,
              nombre: data.user.nombre || data.user.name || '',
              email: data.user.email,
              imagen_usuario: data.user.imagen_usuario,
              rol: data.user.rol || data.user.role
            })
          }
        }
      } catch (error) {
        console.error("Error fetching current user:", error)
      }
    }
    fetchCurrentUser()
  }, [])

  // Cargar leads cuando se abre el combobox
  useEffect(() => {
    if (openLeadCombobox && todosLosLeads.length === 0) {
      cargarLeads()
    }
  }, [openLeadCombobox])

  const cargarLeads = async () => {
    setCargandoLeads(true)
    try {
      const res = await fetch('/api/leads?limit=1000', {
        credentials: "include"
      })
      if (res.ok) {
        const data = await res.json()
        const leadsData = data.data || []
        setTodosLosLeads(leadsData)
        setFilteredLeads(leadsData.slice(0, 50))
      }
    } catch (error) {
      console.error("Error loading leads:", error)
      toast.error("Error al cargar leads")
    } finally {
      setCargandoLeads(false)
    }
  }

  const filtrarLeads = (search: string) => {
    if (!search) {
      setFilteredLeads(todosLosLeads.slice(0, 50))
      return
    }
    const searchLower = search.toLowerCase()
    const filtered = todosLosLeads.filter(lead => 
      lead.nombre.toLowerCase().includes(searchLower) ||
      (lead.empresa && lead.empresa.toLowerCase().includes(searchLower)) ||
      (lead.email && lead.email.toLowerCase().includes(searchLower))
    )
    setFilteredLeads(filtered.slice(0, 50))
  }

  // Cargar opportunities cuando cambia el pipeline o los filtros
  useEffect(() => {
    if (pipelineId) {
      fetchOpportunities()
    }
  }, [pipelineId, searchTerm, filtroOrigen, filtroInteres, filtroCiudad, filtroEstado])

  // Si hay pipelines pero no hay pipelineId seleccionado, seleccionar el primero
  useEffect(() => {
    if (!pipelineId && pipelines.length > 0) {
      const firstPipeline = pipelines.find((p: any) => p.is_default) ?? pipelines[0]
      if (firstPipeline?.id) {
        setPipelineId(firstPipeline.id)
      }
    }
  }, [pipelines, pipelineId])

  const fetchOpportunities = async () => {
    if (!pipelineId) return
    
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append("q", searchTerm)
      if (filtroOrigen !== "all") params.append("origen", filtroOrigen)
      if (filtroInteres !== "all") params.append("interes", filtroInteres)
      if (filtroCiudad !== "all") params.append("ciudad", filtroCiudad)
      if (filtroEstado !== "all") params.append("estado", filtroEstado)
      
      console.log('🔍 Fetching opportunities for pipeline:', pipelineId)
      const response = await fetch(`/api/ventas/pipelines/${pipelineId}/opportunities?${params}`, {
        credentials: "include"
      })
      
      console.log('📡 Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Error response:', response.status, errorText)
        toast.error(`Error al cargar oportunidades: ${response.status}`)
        return
      }
      
      const data = await response.json()
      console.log('📦 Opportunities response:', data)
      
      if (data.success) {
        console.log('✅ Opportunities loaded:', data.data?.length || 0)
        setOpportunities(data.data || [])
      } else {
        console.error('❌ API returned error:', data.error)
        toast.error(data.error || "Error al cargar oportunidades")
      }
    } catch (error) {
      console.error("❌ Error fetching opportunities:", error)
      toast.error("Error al cargar oportunidades")
    }
  }

  const handleOpenCreateStageDialog = () => {
    if (!pipelineId) {
      toast.error("No hay pipeline seleccionado")
      return
    }
    setNewStageName("")
    setIsCreateStageDialogOpen(true)
  }

  const handleCreateStage = async () => {
    if (!pipelineId) return
    if (!newStageName || newStageName.trim() === "") {
      toast.error("El nombre es requerido")
      return
    }
    
    setIsCreatingStage(true)
    try {
      const response = await fetch(`/api/ventas/pipelines/${pipelineId}/stages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ nombre: newStageName.trim() })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success("Etapa creada correctamente")
        setIsCreateStageDialogOpen(false)
        setNewStageName("")
        // Recargar stages
        const res = await fetch(`/api/ventas/pipelines/${pipelineId}/stages`, {
          credentials: "include"
        })
        const stagesData = await res.json()
        const stagesResult = stagesData.success ? stagesData.data : stagesData
        setStages(stagesResult)
      } else {
        toast.error(data.error || "Error al crear etapa")
      }
    } catch (error) {
      console.error("Error creating stage:", error)
      toast.error("Error al crear etapa")
    } finally {
      setIsCreatingStage(false)
    }
  }


  const handleDeleteStage = async () => {
    if (!deletingStageId || !pipelineId) return
    
    try {
      const response = await fetch(`/api/ventas/stages/${deletingStageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ is_archived: true })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success("Etapa eliminada correctamente")
        setIsDeleteStageDialogOpen(false)
        setDeletingStageId(null)
        // Recargar stages
        const res = await fetch(`/api/ventas/pipelines/${pipelineId}/stages`, {
          credentials: "include"
        })
        const stagesData = await res.json()
        const stagesResult = stagesData.success ? stagesData.data : stagesData
        setStages(stagesResult)
      } else {
        toast.error(data.error || "Error al eliminar etapa")
      }
    } catch (error) {
      console.error("Error deleting stage:", error)
      toast.error("Error al eliminar etapa")
    }
  }

  const handleOpenCreateModal = () => {
    if (!pipelineId || stages.length === 0) {
      toast.error("No hay etapas disponibles. Crea una etapa primero.")
      return
    }
    
    setFormData({
      lead_id: undefined,
      vendedor_id: undefined,
      titulo: "",
      descripcion: "",
      valor_estimado: undefined,
      moneda: "BOB",
      ciudad: "",
      origen: "",
      interes: "",
      estado: "abierta",
      motivo_perdida: ""
    })
    
    // Cargar vendedores si no están cargados
    if (todosLosVendedores.length === 0) {
      cargarVendedores()
    }
    
    setIsCreateModalOpen(true)
  }

  const handleOpenPipelineModal = (pipeline?: Pipeline) => {
    if (pipeline) {
      setEditingPipeline(pipeline)
      setPipelineFormData({
        nombre: pipeline.nombre,
        descripcion: pipeline.descripcion || "",
        is_default: pipeline.is_default || false
      })
    } else {
      setEditingPipeline(null)
      setPipelineFormData({
        nombre: "",
        descripcion: "",
        is_default: false
      })
    }
    setIsPipelineModalOpen(true)
  }

  const handleSavePipeline = async () => {
    if (!pipelineFormData.nombre.trim()) {
      toast.error("El nombre es requerido")
      return
    }

    setIsSavingPipeline(true)
    try {
      if (editingPipeline) {
        // Actualizar pipeline existente
        const response = await fetch(`/api/ventas/pipelines/${editingPipeline.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(pipelineFormData)
        })

        if (!response.ok) {
          let errorMessage = `Error ${response.status}`
          try {
            const errorData = await response.json()
            errorMessage = errorData.error || errorMessage
          } catch (e) {
            console.error('Error parsing error response:', e)
            errorMessage = `Error ${response.status}: ${response.statusText}`
          }
          toast.error(`Error al actualizar pipeline: ${errorMessage}`)
          setIsSavingPipeline(false)
          return
        }

        const data = await response.json()

        if (data.success) {
          toast.success("Pipeline actualizado correctamente")
          setIsPipelineModalOpen(false)
          // Recargar pipelines
          const res = await fetch('/api/ventas/pipelines', {
            credentials: "include"
          })
          const pipelinesData = await res.json()
          if (pipelinesData.success && Array.isArray(pipelinesData.data)) {
            setPipelines(pipelinesData.data)
            const defaultPipeline = pipelinesData.data.find((p: any) => p.is_default) || pipelinesData.data[0]
            if (defaultPipeline?.id) {
              setPipelineId(defaultPipeline.id)
            }
          }
        } else {
          toast.error(data.error || "Error al actualizar pipeline")
        }
      } else {
        // Crear nuevo pipeline
        const response = await fetch('/api/ventas/pipelines', {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(pipelineFormData)
        })

        const data = await response.json()

        if (data.success) {
          toast.success("Pipeline creado correctamente")
          setIsPipelineModalOpen(false)
          // Recargar pipelines
          const res = await fetch('/api/ventas/pipelines', {
            credentials: "include"
          })
          const pipelinesData = await res.json()
          if (pipelinesData.success && Array.isArray(pipelinesData.data)) {
            setPipelines(pipelinesData.data)
            // Seleccionar el pipeline recién creado
            if (data.data?.id) {
              setPipelineId(data.data.id)
            }
          }
        } else {
          toast.error(data.error || "Error al crear pipeline")
        }
      }
    } catch (error) {
      console.error("Error guardando pipeline:", error)
      toast.error("Error al guardar pipeline")
    } finally {
      setIsSavingPipeline(false)
    }
  }

  const handleOpenEditModal = (opportunity: Opportunity) => {
    setEditingOpportunity(opportunity)
    setFormData({
      lead_id: opportunity.lead?.id || undefined,
      vendedor_id: opportunity.vendedor?.id || undefined,
      titulo: opportunity.titulo,
      descripcion: opportunity.descripcion || "",
      valor_estimado: opportunity.valor_estimado || undefined,
      moneda: opportunity.moneda || "BOB",
      ciudad: opportunity.ciudad || "",
      origen: opportunity.origen || "",
      interes: opportunity.interes || "",
      estado: opportunity.estado,
      motivo_perdida: opportunity.motivo_perdida || ""
    })
    setIsEditModalOpen(true)
    
    // Cargar vendedores si no están cargados
    if (todosLosVendedores.length === 0) {
      cargarVendedores()
    }
  }

  const cargarVendedores = async () => {
    setCargandoVendedores(true)
    try {
      const res = await fetch('/api/public/comerciales', {
        credentials: "include"
      })
      if (res.ok) {
        const data = await res.json()
        const vendedoresData = data.users || []
        setTodosLosVendedores(vendedoresData)
        setFilteredVendedores(vendedoresData)
      }
    } catch (error) {
      console.error("Error loading vendedores:", error)
    } finally {
      setCargandoVendedores(false)
    }
  }

  const handleCreateOpportunity = async () => {
    if (!pipelineId || stages.length === 0) return
    
    if (!formData.titulo.trim()) {
      toast.error("El título es requerido")
      return
    }
    
    if (formData.estado === "perdida" && !formData.motivo_perdida?.trim()) {
      toast.error("El motivo de pérdida es requerido cuando el estado es 'perdida'")
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Obtener el primer stage (menor posicion)
      const firstStage = stages.sort((a, b) => a.posicion - b.posicion)[0]
      
      const response = await fetch("/api/ventas/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
          body: JSON.stringify({
          pipeline_id: pipelineId,
          stage_id: firstStage.id,
          lead_id: formData.lead_id || null,
          vendedor_id: formData.vendedor_id || null,
          titulo: formData.titulo.trim(),
          descripcion: formData.descripcion || null,
          valor_estimado: formData.valor_estimado || null,
          moneda: formData.moneda || "BOB",
          ciudad: formData.ciudad || null,
          origen: formData.origen || null,
          interes: formData.interes || null,
          estado: formData.estado,
          motivo_perdida: formData.motivo_perdida || null
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success("Oportunidad creada correctamente")
        setIsCreateModalOpen(false)
        fetchOpportunities()
      } else {
        toast.error(data.error || "Error al crear oportunidad")
      }
    } catch (error) {
      console.error("Error creating opportunity:", error)
      toast.error("Error al crear oportunidad")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateOpportunity = async () => {
    if (!editingOpportunity) return
    
    if (!formData.titulo.trim()) {
      toast.error("El título es requerido")
      return
    }
    
    if (formData.estado === "perdida" && !formData.motivo_perdida?.trim()) {
      toast.error("El motivo de pérdida es requerido cuando el estado es 'perdida'")
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const response = await fetch(`/api/ventas/opportunities/${editingOpportunity.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          lead_id: formData.lead_id || null,
          vendedor_id: formData.vendedor_id || null,
          titulo: formData.titulo.trim(),
          descripcion: formData.descripcion || null,
          valor_estimado: formData.valor_estimado || null,
          moneda: formData.moneda || "BOB",
          ciudad: formData.ciudad || null,
          origen: formData.origen || null,
          interes: formData.interes || null,
          estado: formData.estado,
          motivo_perdida: formData.motivo_perdida || null
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success("Oportunidad actualizada correctamente")
        setIsEditModalOpen(false)
        setEditingOpportunity(null)
        fetchOpportunities()
      } else {
        toast.error(data.error || "Error al actualizar oportunidad")
      }
    } catch (error) {
      console.error("Error updating opportunity:", error)
      toast.error("Error al actualizar oportunidad")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteOpportunity = async () => {
    console.log('🗑️ handleDeleteOpportunity called, deletingOpportunityId:', deletingOpportunityId)
    if (!deletingOpportunityId) {
      console.error('❌ No deletingOpportunityId set')
      return
    }
    
    try {
      console.log('📡 Sending DELETE request for:', deletingOpportunityId)
      const response = await fetch(`/api/ventas/opportunities/${deletingOpportunityId}`, {
        method: "DELETE",
        credentials: "include"
      })
      
      console.log('📡 DELETE response status:', response.status)
      const data = await response.json()
      console.log('📦 DELETE response data:', data)
      
      if (data.success) {
        toast.success("Oportunidad eliminada correctamente")
        setIsDeleteDialogOpen(false)
        setDeletingOpportunityId(null)
        fetchOpportunities()
      } else {
        toast.error(data.error || "Error al eliminar oportunidad")
      }
    } catch (error) {
      console.error("❌ Error deleting opportunity:", error)
      toast.error("Error al eliminar oportunidad")
    }
  }

  // Drag & Drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over || !pipelineId) return

    const activeId = active.id as string
    const overId = over.id as string

    // Si se soltó sobre un stage (usando data-stage-id)
    // Primero verificar si overId es un stage
    const targetStage = stages.find(s => s.id === overId)
    if (targetStage) {
      const opportunity = opportunities.find(o => o.id === activeId)
      if (opportunity) {
        // Si ya está en ese stage, no hacer nada
        if (opportunity.stage_id === targetStage.id) {
          return
        }

        // Mover a otro stage - obtener la máxima posición en el stage destino
        const targetStageOpps = opportunities.filter(o => o.stage_id === targetStage.id)
        const maxPos = targetStageOpps.length > 0 
          ? Math.max(...targetStageOpps.map(o => o.posicion_en_etapa))
          : 0
        
        // Optimistic update: actualizar el estado inmediatamente
        setOpportunities(prev => {
          const updated = prev.map(opp => 
            opp.id === activeId 
              ? { ...opp, stage_id: targetStage.id, posicion_en_etapa: maxPos + 1 }
              : opp
          )
          return updated
        })
        
        try {
          const response = await fetch(`/api/ventas/opportunities/${activeId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              stage_id: targetStage.id,
              posicion_en_etapa: maxPos + 1
            })
          })
          
          const data = await response.json()
          
          if (data.success) {
            // Sincronizar con el servidor para obtener datos actualizados
            fetchOpportunities()
          } else {
            // Revertir en caso de error
            fetchOpportunities()
            toast.error(data.error || "Error al mover oportunidad")
          }
        } catch (error) {
          console.error("Error moving opportunity:", error)
          // Revertir en caso de error
          fetchOpportunities()
          toast.error("Error al mover oportunidad")
        }
      }
      return
    }

    // Si se soltó sobre otra oportunidad (reordenar dentro del mismo stage o mover a otro)
    const targetOpportunity = opportunities.find(o => o.id === overId)
    if (targetOpportunity) {
      const sourceOpportunity = opportunities.find(o => o.id === activeId)
      if (!sourceOpportunity) return
      
      // Si es el mismo stage, reordenar
      if (sourceOpportunity.stage_id === targetOpportunity.stage_id) {
        const stageOpportunities = opportunities
          .filter(o => o.stage_id === sourceOpportunity.stage_id)
          .sort((a, b) => a.posicion_en_etapa - b.posicion_en_etapa)
        
        const oldIndex = stageOpportunities.findIndex(o => o.id === activeId)
        const newIndex = stageOpportunities.findIndex(o => o.id === overId)
        
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const reordered = arrayMove(stageOpportunities, oldIndex, newIndex)
          
          // Optimistic update: actualizar el estado inmediatamente
          setOpportunities(prev => {
            const updated = prev.map(opp => {
              const reorderedOpp = reordered.find(r => r.id === opp.id)
              if (reorderedOpp) {
                const newIndex = reordered.findIndex(r => r.id === opp.id)
                return { ...opp, posicion_en_etapa: newIndex + 1 }
              }
              return opp
            })
            return updated
          })
          
          try {
            const response = await fetch("/api/ventas/opportunities/reorder", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                stage_id: sourceOpportunity.stage_id,
                opportunities: reordered.map((opp, index) => ({
                  id: opp.id,
                  posicion_en_etapa: index + 1
                }))
              })
            })
            
            const data = await response.json()
            
            if (data.success) {
              // Sincronizar con el servidor
              fetchOpportunities()
            } else {
              // Revertir en caso de error
              fetchOpportunities()
              toast.error(data.error || "Error al reordenar")
            }
          } catch (error) {
            console.error("Error reordering:", error)
            // Revertir en caso de error
            fetchOpportunities()
            toast.error("Error al reordenar")
          }
        }
      } else {
        // Mover a otro stage (se soltó sobre una oportunidad de otro stage)
        const targetStageOpps = opportunities.filter(o => o.stage_id === targetOpportunity.stage_id)
        const targetIndex = targetStageOpps
          .sort((a, b) => a.posicion_en_etapa - b.posicion_en_etapa)
          .findIndex(o => o.id === overId)
        
        const newPosition = targetIndex >= 0 ? targetIndex + 1 : targetStageOpps.length + 1
        
        // Optimistic update: actualizar el estado inmediatamente
        setOpportunities(prev => {
          const updated = prev.map(opp => 
            opp.id === activeId 
              ? { ...opp, stage_id: targetOpportunity.stage_id, posicion_en_etapa: newPosition }
              : opp
          )
          return updated
        })
        
        try {
          const response = await fetch(`/api/ventas/opportunities/${activeId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              stage_id: targetOpportunity.stage_id,
              posicion_en_etapa: newPosition
            })
          })
          
          const data = await response.json()
          
          if (data.success) {
            // Sincronizar con el servidor
            fetchOpportunities()
          } else {
            // Revertir en caso de error
            fetchOpportunities()
            toast.error(data.error || "Error al mover oportunidad")
          }
        } catch (error) {
          console.error("Error moving opportunity:", error)
          // Revertir en caso de error
          fetchOpportunities()
          toast.error("Error al mover oportunidad")
        }
      }
    }
  }

  const getOpportunitiesForStage = (stageId: string) => {
    return opportunities
      .filter(o => o.stage_id === stageId)
      .sort((a, b) => a.posicion_en_etapa - b.posicion_en_etapa)
  }

  const formatCurrency = (value: number | null | undefined, currency: string = "BOB") => {
    if (!value) return "-"
    return new Intl.NumberFormat("es-BO", {
      style: "currency",
      currency: currency
    }).format(value)
  }

  // Render defensivo (para evitar el falso "no hay etapas")
  console.log('🎨 Render state:', { 
    isLoadingPipelines, 
    pipelineId, 
    stagesLength: stages.length,
    pipelinesLength: pipelines.length 
  })
  
  if (isLoadingPipelines) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        <span className="ml-2">Cargando pipeline…</span>
      </div>
    )
  }

  // Si no hay pipelines, mostrar mensaje y permitir crear uno
  if (pipelines.length === 0) {
    return (
      <div className="p-6 space-y-6 pb-8">
        <Toaster />
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">No se encontró ningún pipeline.</p>
          {(puedeEditar("ventas") || esAdmin("ventas")) && (
            <Button 
              onClick={() => handleOpenPipelineModal()} 
              className="bg-[#D54644] hover:bg-[#B03A38] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear primer pipeline
            </Button>
          )}
        </div>
      </div>
    )
  }

  if (!stages.length) {
    return (
      <div className="p-6 space-y-6 pb-8">
        <Toaster />
        <div className="space-y-4">
          <div className="text-muted-foreground text-center py-8">
            No hay etapas. Crea una etapa para comenzar.
          </div>
          <div className="flex justify-center">
            {(puedeEditar("ventas") || esAdmin("ventas")) && (
              <Button onClick={handleOpenCreateStageDialog} className="bg-[#D54644] hover:bg-[#B03A38] text-white">
                <Plus className="w-4 h-4 mr-2" />
                Crear primera etapa
              </Button>
            )}
          </div>
        </div>
        
        {/* Dialog Crear Etapa */}
        <AlertDialog open={isCreateStageDialogOpen} onOpenChange={setIsCreateStageDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Nueva Etapa</AlertDialogTitle>
              <AlertDialogDescription>
                Ingresa el nombre de la nueva etapa
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label htmlFor="stage-name">Nombre de la nueva etapa:</Label>
              <Input
                id="stage-name"
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                placeholder="Ej: En negociación"
                className="mt-2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newStageName.trim()) {
                    handleCreateStage()
                  }
                }}
                autoFocus
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isCreatingStage}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCreateStage}
                disabled={isCreatingStage || !newStageName.trim()}
                className="bg-[#D54644] hover:bg-[#B03A38] text-white"
              >
                {isCreatingStage ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  "Crear"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 pb-8">
      <Toaster />
      
      {/* Header con pestañas de pipelines */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Pipeline</h1>
        {(puedeEditar("ventas") || esAdmin("ventas")) && (
          <Button onClick={handleOpenCreateStageDialog} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Agregar etapa
          </Button>
        )}
        </div>
        
        {pipelines.length > 0 && (
          <div className="flex items-center gap-2">
            <Tabs value={pipelineId || ""} onValueChange={setPipelineId} className="flex-1">
              <TabsList className="w-full justify-start">
                {pipelines.map((pipeline) => (
                  <div key={pipeline.id} className="relative group">
                    <TabsTrigger 
                      value={pipeline.id}
                      className="pr-8"
                    >
                      {pipeline.nombre}
                    </TabsTrigger>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {(puedeEditar("ventas") || esAdmin("ventas")) && (
                          <DropdownMenuItem onClick={() => handleOpenPipelineModal(pipeline)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </TabsList>
            </Tabs>
            {(puedeEditar("ventas") || esAdmin("ventas")) && (
              <Button
                onClick={() => handleOpenPipelineModal()}
                variant="outline"
                size="sm"
                className="ml-2"
              >
                <Plus className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Toolbar con búsqueda y filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar oportunidades..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filtroOrigen} onValueChange={setFiltroOrigen}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Origen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Origen</SelectItem>
                {Array.from(new Set(opportunities.map(o => o.origen).filter(Boolean))).map(origen => (
                  <SelectItem key={origen} value={origen!}>{origen}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filtroInteres} onValueChange={setFiltroInteres}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Interés" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Interés</SelectItem>
                {Array.from(new Set(opportunities.map(o => o.interes).filter(Boolean))).map(interes => (
                  <SelectItem key={interes} value={interes!}>{interes}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filtroCiudad} onValueChange={setFiltroCiudad}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Ciudad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Ciudad</SelectItem>
                {Array.from(new Set(opportunities.map(o => o.ciudad).filter(Boolean))).map(ciudad => (
                  <SelectItem key={ciudad} value={ciudad!}>{ciudad}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Estado</SelectItem>
                <SelectItem value="abierta">Abierta</SelectItem>
                <SelectItem value="ganada">Ganada</SelectItem>
                <SelectItem value="perdida">Perdida</SelectItem>
              </SelectContent>
            </Select>
            
            {(puedeEditar("ventas") || esAdmin("ventas")) && (
              <Button onClick={handleOpenCreateModal} className="bg-[#D54644] hover:bg-[#B03A38] text-white">
                <Plus className="w-4 h-4 mr-2" />
                Nueva oportunidad
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      {pipelineId && stages.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {stages.map((stage) => {
              const stageOpportunities = getOpportunitiesForStage(stage.id)
              return (
                <div key={stage.id} data-stage-id={stage.id}>
                  <StageColumn
                    stage={stage}
                    opportunities={stageOpportunities}
                    onDeleteStage={(puedeEliminar("ventas") || esAdmin("ventas")) ? () => {
                      setDeletingStageId(stage.id)
                      setIsDeleteStageDialogOpen(true)
                    } : undefined}
                    onEdit={handleOpenEditModal}
                    onDelete={(puedeEliminar("ventas") || esAdmin("ventas")) ? (id) => {
                      console.log('🗑️ Delete clicked for opportunity:', id)
                      setDeletingOpportunityId(id)
                      setIsDeleteDialogOpen(true)
                    } : undefined}
                    onStageUpdated={fetchStages}
                  />
                </div>
              )
            })}
          </div>
          <DragOverlay>
            {activeId ? (
              <OpportunityCard
                opportunity={opportunities.find(o => o.id === activeId)!}
                isDragging
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">
            {stages.length === 0 ? "No hay etapas. Crea una etapa para comenzar." : "Cargando..."}
          </CardContent>
        </Card>
      )}

      {/* Modal Crear Oportunidad */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Oportunidad</DialogTitle>
            <DialogDescription>
              Completa los datos de la nueva oportunidad
            </DialogDescription>
          </DialogHeader>
          <OpportunityForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleCreateOpportunity}
            isSubmitting={isSubmitting}
            submitLabel="Crear"
            onCancel={() => setIsCreateModalOpen(false)}
            todosLosLeads={todosLosLeads}
            filteredLeads={filteredLeads}
            cargandoLeads={cargandoLeads}
            openLeadCombobox={openLeadCombobox}
            setOpenLeadCombobox={setOpenLeadCombobox}
            filtrarLeads={filtrarLeads}
            setFilteredLeads={setFilteredLeads}
            isEditMode={false}
            canChangeVendedor={true}
            todosLosVendedores={todosLosVendedores}
            filteredVendedores={filteredVendedores}
            cargandoVendedores={cargandoVendedores}
            openVendedorCombobox={openVendedorCombobox}
            setOpenVendedorCombobox={setOpenVendedorCombobox}
            filtrarVendedores={(search: string) => {
              if (!search) {
                setFilteredVendedores(todosLosVendedores.slice(0, 50))
                return
              }
              const filtered = todosLosVendedores.filter(v =>
                v.nombre?.toLowerCase().includes(search.toLowerCase()) ||
                v.email?.toLowerCase().includes(search.toLowerCase())
              )
              setFilteredVendedores(filtered.slice(0, 50))
            }}
            setFilteredVendedores={setFilteredVendedores}
          />
        </DialogContent>
      </Dialog>

      {/* Modal Editar Oportunidad */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Oportunidad</DialogTitle>
            <DialogDescription>
              Modifica los datos de la oportunidad
            </DialogDescription>
          </DialogHeader>
          <OpportunityForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleUpdateOpportunity}
            isSubmitting={isSubmitting}
            submitLabel="Guardar"
            onCancel={() => {
              setIsEditModalOpen(false)
              setEditingOpportunity(null)
            }}
            todosLosLeads={todosLosLeads}
            filteredLeads={filteredLeads}
            cargandoLeads={cargandoLeads}
            openLeadCombobox={openLeadCombobox}
            setOpenLeadCombobox={setOpenLeadCombobox}
            filtrarLeads={filtrarLeads}
            setFilteredLeads={setFilteredLeads}
            isEditMode={true}
            canChangeVendedor={true}
            todosLosVendedores={todosLosVendedores}
            filteredVendedores={filteredVendedores}
            cargandoVendedores={cargandoVendedores}
            openVendedorCombobox={openVendedorCombobox}
            setOpenVendedorCombobox={setOpenVendedorCombobox}
            filtrarVendedores={(search: string) => {
              if (!search) {
                if (setFilteredVendedores) {
                  setFilteredVendedores(todosLosVendedores.slice(0, 50))
                }
                return
              }
              const searchLower = search.toLowerCase()
              const filtered = todosLosVendedores.filter(v => 
                v.nombre?.toLowerCase().includes(searchLower) ||
                v.email?.toLowerCase().includes(searchLower)
              )
              if (setFilteredVendedores) {
                setFilteredVendedores(filtered.slice(0, 50))
              }
            }}
            setFilteredVendedores={setFilteredVendedores}
          />
        </DialogContent>
      </Dialog>

      {/* Modal Crear/Editar Pipeline */}
      <Dialog open={isPipelineModalOpen} onOpenChange={setIsPipelineModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingPipeline ? "Editar Pipeline" : "Nueva Pipeline"}
            </DialogTitle>
            <DialogDescription>
              {editingPipeline 
                ? "Modifica los datos del pipeline" 
                : "Completa los datos para crear un nuevo pipeline"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pipeline-nombre">Nombre *</Label>
              <Input
                id="pipeline-nombre"
                value={pipelineFormData.nombre}
                onChange={(e) => setPipelineFormData({ ...pipelineFormData, nombre: e.target.value })}
                placeholder="Ej: Pipeline Vallas"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pipeline-descripcion">Descripción</Label>
              <Textarea
                id="pipeline-descripcion"
                value={pipelineFormData.descripcion}
                onChange={(e) => setPipelineFormData({ ...pipelineFormData, descripcion: e.target.value })}
                placeholder="Descripción del pipeline (opcional)"
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="pipeline-default"
                checked={pipelineFormData.is_default}
                onChange={(e) => setPipelineFormData({ ...pipelineFormData, is_default: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="pipeline-default" className="cursor-pointer">
                Marcar como pipeline por defecto
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPipelineModalOpen(false)}
              disabled={isSavingPipeline}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSavePipeline}
              disabled={isSavingPipeline}
              className="bg-[#D54644] hover:bg-[#B03A38] text-white"
            >
              {isSavingPipeline ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                editingPipeline ? "Guardar cambios" : "Crear pipeline"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Crear Etapa */}
      <AlertDialog open={isCreateStageDialogOpen} onOpenChange={setIsCreateStageDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nueva Etapa</AlertDialogTitle>
            <AlertDialogDescription>
              Ingresa el nombre de la nueva etapa
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="stage-name">Nombre de la nueva etapa:</Label>
            <Input
              id="stage-name"
              value={newStageName}
              onChange={(e) => setNewStageName(e.target.value)}
              placeholder="Ej: En negociación"
              className="mt-2"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newStageName.trim()) {
                  handleCreateStage()
                }
              }}
              autoFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCreatingStage}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCreateStage}
              disabled={isCreatingStage || !newStageName.trim()}
              className="bg-[#D54644] hover:bg-[#B03A38] text-white"
            >
              {isCreatingStage ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Confirmar Eliminación Oportunidad */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar oportunidad?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La oportunidad será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOpportunity} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Confirmar Eliminación Etapa */}
      <AlertDialog open={isDeleteStageDialogOpen} onOpenChange={setIsDeleteStageDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar etapa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción archivará la etapa. Las oportunidades en esta etapa no se eliminarán, pero la etapa dejará de estar visible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStage} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Componente de columna de stage
function StageColumn({
  stage,
  opportunities,
  onDeleteStage,
  onEdit,
  onDelete,
  onStageUpdated,
}: {
  stage: Stage
  opportunities: Opportunity[]
  onDeleteStage?: () => void
  onEdit: (opp: Opportunity) => void
  onDelete?: (id: string) => void
  onStageUpdated?: () => void
}) {
  const { puedeEliminar, puedeEditar, esAdmin } = usePermisosContext()
  const [isEditingName, setIsEditingName] = useState(false)
  const [editingName, setEditingName] = useState(stage.nombre)
  const [isSaving, setIsSaving] = useState(false)

  // Sincronizar editingName cuando cambia el stage.nombre desde fuera
  useEffect(() => {
    setEditingName(stage.nombre)
  }, [stage.nombre])

  const handleNameClick = () => {
    setIsEditingName(true)
  }

  const handleSave = async () => {
    if (editingName.trim() === "" || editingName.trim() === stage.nombre) {
      setEditingName(stage.nombre)
      setIsEditingName(false)
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/ventas/stages/${stage.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ nombre: editingName.trim() })
      })
      
      const data = await response.json()
      if (data.success) {
        toast.success("Etapa renombrada correctamente")
        setIsEditingName(false)
        // Actualizar el nombre localmente y recargar stages
        if (onStageUpdated) {
          onStageUpdated()
        }
      } else {
        toast.error(data.error || "Error al renombrar etapa")
        setEditingName(stage.nombre)
      }
    } catch (error) {
      console.error("Error renaming stage:", error)
      toast.error("Error al renombrar etapa")
      setEditingName(stage.nombre)
    } finally {
      setIsSaving(false)
    }
  }

  const handleNameBlur = () => {
    // No guardar automáticamente al perder el foco, solo cancelar si no hay cambios
    if (editingName.trim() === stage.nombre) {
      setIsEditingName(false)
    }
  }

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSave()
    } else if (e.key === "Escape") {
      setEditingName(stage.nombre)
      setIsEditingName(false)
    }
  }

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: stage.id,
  })

  // Calcular totales por moneda
  const TIPO_CAMBIO = 6.96
  const totalBs = opportunities
    .filter(opp => opp.valor_estimado && (opp.moneda === 'BOB' || opp.moneda === 'Bs'))
    .reduce((sum, opp) => sum + (opp.valor_estimado || 0), 0)
  
  const totalUsd = opportunities
    .filter(opp => opp.valor_estimado && opp.moneda === 'USD')
    .reduce((sum, opp) => sum + (opp.valor_estimado || 0), 0)
  
  // Convertir Bs a USD y sumar
  const totalUsdConvertido = totalUsd + (totalBs / TIPO_CAMBIO)
  const totalBsTotal = totalBs + (totalUsd * TIPO_CAMBIO)

  const formatCurrency = (value: number, currency: string) => {
    if (!value || value === 0) return "0.00"
    return new Intl.NumberFormat("es-BO", {
      style: "currency",
      currency: currency === "Bs" || currency === "BOB" ? "BOB" : "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  return (
    <Card 
      ref={setDroppableRef}
      className={`flex-shrink-0 w-80 ${isOver ? 'ring-2 ring-blue-500' : ''}`} 
      data-stage-id={stage.id}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {isEditingName ? (
              <div className="flex items-center gap-1 flex-1">
                <Input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={handleNameBlur}
                  onKeyDown={handleNameKeyDown}
                  className="h-8 text-sm font-semibold flex-1"
                  autoFocus
                  disabled={isSaving}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 flex-shrink-0"
                  onClick={handleSave}
                  disabled={isSaving || editingName.trim() === "" || editingName.trim() === stage.nombre}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                </Button>
              </div>
            ) : (
              <h3
                className="text-sm font-semibold cursor-pointer hover:bg-gray-100 px-2 py-1 rounded flex-1 truncate"
                onClick={handleNameClick}
                title={stage.nombre}
              >
                {stage.nombre}
              </h3>
            )}
            <Badge variant="secondary" className="ml-2 flex-shrink-0">
              {opportunities.length}
            </Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(puedeEditar("ventas") || esAdmin("ventas")) && (
                <DropdownMenuItem onClick={handleNameClick}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar etapa
                </DropdownMenuItem>
              )}
              {onDeleteStage && (puedeEliminar("ventas") || esAdmin("ventas")) && (
                <DropdownMenuItem onClick={onDeleteStage} className="text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar etapa
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <SortableContext items={opportunities.map(o => o.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 min-h-[200px]" style={{ minHeight: isOver ? '250px' : '200px' }}>
            {opportunities.map((opportunity) => (
              <SortableOpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
            {opportunities.length === 0 && isOver && (
              <div className="flex items-center justify-center h-32 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50">
                <p className="text-sm text-blue-600">Soltar aquí</p>
              </div>
            )}
          </div>
        </SortableContext>
        
        {/* Total de dinero en la etapa */}
        {(totalBs > 0 || totalUsd > 0) && (
          <div className="mt-3 pt-3 border-t bg-gray-100 rounded-md p-2">
            <div className="text-xs font-medium text-gray-700 mb-1">Total de la etapa</div>
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600">Bs:</span>
                <span className="font-semibold text-gray-800">{formatCurrency(totalBsTotal, "Bs")}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600">USD:</span>
                <span className="font-semibold text-gray-800">{formatCurrency(totalUsdConvertido, "USD")}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Componente de tarjeta de oportunidad sortable
function SortableOpportunityCard({
  opportunity,
  onEdit,
  onDelete,
}: {
  opportunity: Opportunity
  onEdit: (opp: Opportunity) => void
  onDelete?: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: opportunity.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <OpportunityCard
        opportunity={opportunity}
        onEdit={onEdit}
        onDelete={onDelete}
        dragListeners={listeners}
      />
    </div>
  )
}

// Componente de tarjeta de oportunidad
function OpportunityCard({
  opportunity,
  onEdit,
  onDelete,
  isDragging = false,
  dragListeners,
}: {
  opportunity: Opportunity
  onEdit?: (opp: Opportunity) => void
  onDelete?: (id: string) => void
  isDragging?: boolean
  dragListeners?: any
}) {
  const { puedeEliminar, esAdmin } = usePermisosContext()
  const formatCurrency = (value: number | null | undefined, currency: string = "BOB") => {
    if (!value) return "-"
    return new Intl.NumberFormat("es-BO", {
      style: "currency",
      currency: currency
    }).format(value)
  }

  const empresaNombre = opportunity.lead?.empresa || opportunity.contacto?.empresa
  const contactoNombre = opportunity.lead?.nombre || opportunity.contacto?.nombre
  const contactoEmail = opportunity.lead?.email || opportunity.contacto?.email

  const getInitials = (nombre: string) => {
    if (!nombre) return "?"
    return nombre
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getVendedorImage = (vendedor: { imagen_usuario?: any } | null | undefined) => {
    if (!vendedor?.imagen_usuario) return null
    const imagenData = typeof vendedor.imagen_usuario === 'string' 
      ? JSON.parse(vendedor.imagen_usuario) 
      : vendedor.imagen_usuario
    return imagenData?.url || null
  }

  return (
    <Card className={`hover:shadow-md transition-shadow ${isDragging ? 'opacity-50' : ''}`}>
      <CardContent className="p-2.5">
        <div className="flex items-start justify-between mb-1.5">
          <h4 
            className="font-medium text-sm flex-1 cursor-move leading-tight" 
            {...dragListeners}
          >
            {opportunity.titulo}
          </h4>
          {(onEdit || onDelete) && (
            <div onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 flex-shrink-0"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation()
                        console.log('✏️ Edit clicked for opportunity:', opportunity.id)
                        onEdit(opportunity)
                      }}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                  )}
                  {onDelete && (puedeEliminar("ventas") || esAdmin("ventas")) && (
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation()
                        console.log('🗑️ Delete clicked for opportunity:', opportunity.id)
                        onDelete(opportunity.id)
                      }} 
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
        
        <div {...dragListeners} className="cursor-move">
          {empresaNombre && (
            <p className="text-xs font-semibold text-gray-700 mb-1.5">{empresaNombre}</p>
          )}
          
          {contactoNombre && !empresaNombre && (
            <p className="text-xs font-semibold text-gray-700 mb-1.5">{contactoNombre}</p>
          )}
          
          {contactoEmail && (
            <p className="text-[10px] text-gray-500 mb-1.5">{contactoEmail}</p>
          )}
          
          {opportunity.valor_estimado && (
            <p className="text-sm font-semibold text-green-600 mb-1.5">
              {formatCurrency(opportunity.valor_estimado, opportunity.moneda)}
            </p>
          )}
          
          {opportunity.vendedor && (
            <div className="flex items-center gap-1.5 mb-1 mt-2" title={opportunity.vendedor.nombre || ''}>
              <Avatar className="h-5 w-5 flex-shrink-0">
                <AvatarImage src={getVendedorImage(opportunity.vendedor) || ""} alt={opportunity.vendedor.nombre || ''} />
                <AvatarFallback className="bg-[#D54644] text-white text-[10px] font-medium">
                  {getInitials(opportunity.vendedor.nombre || '')}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-gray-600 truncate">{opportunity.vendedor.nombre}</span>
            </div>
          )}
          
          <div className="flex items-center gap-1 flex-wrap mt-1">
            <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${
              opportunity.estado === 'abierta' ? 'bg-yellow-100 text-yellow-800' :
              opportunity.estado === 'ganada' ? 'bg-green-100 text-green-800' :
              opportunity.estado === 'perdida' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {opportunity.estado === 'abierta' ? 'Abierta' :
               opportunity.estado === 'ganada' ? 'Ganada' :
               opportunity.estado === 'perdida' ? 'Perdida' :
               opportunity.estado}
            </span>
            {opportunity.ciudad && (
              <Badge variant="outline" className="text-xs">{opportunity.ciudad}</Badge>
            )}
            {opportunity.origen && (
              <Badge variant="outline" className="text-xs">{opportunity.origen}</Badge>
            )}
            {opportunity.interes && (
              <Badge variant="outline" className="text-xs">{opportunity.interes}</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Componente de formulario de oportunidad
function OpportunityForm({
  formData,
  setFormData,
  onSubmit,
  isSubmitting,
  submitLabel,
  onCancel,
  todosLosLeads,
  filteredLeads,
  cargandoLeads,
  openLeadCombobox,
  setOpenLeadCombobox,
  filtrarLeads,
  setFilteredLeads,
  isEditMode = false,
  canChangeVendedor = false,
  todosLosVendedores = [],
  filteredVendedores = [],
  cargandoVendedores = false,
  openVendedorCombobox = false,
  setOpenVendedorCombobox,
  filtrarVendedores,
  setFilteredVendedores,
}: {
  formData: OpportunityFormData
  setFormData: (data: OpportunityFormData) => void
  onSubmit: () => void
  isSubmitting: boolean
  submitLabel: string
  onCancel?: () => void
  todosLosLeads: Lead[]
  filteredLeads: Lead[]
  cargandoLeads: boolean
  openLeadCombobox: boolean
  setOpenLeadCombobox: (open: boolean) => void
  filtrarLeads: (search: string) => void
  setFilteredLeads: (leads: Lead[]) => void
  isEditMode?: boolean
  canChangeVendedor?: boolean
  todosLosVendedores?: VendedorOption[]
  filteredVendedores?: VendedorOption[]
  cargandoVendedores?: boolean
  openVendedorCombobox?: boolean
  setOpenVendedorCombobox?: (open: boolean) => void
  filtrarVendedores?: (search: string) => void
  setFilteredVendedores?: (vendedores: VendedorOption[]) => void
}) {
  const selectedLead = todosLosLeads.find(l => l.id === formData.lead_id)
  const selectedVendedor = todosLosVendedores.find(v => v.id === formData.vendedor_id)
  
  const handleFiltrarVendedores = (search: string) => {
    if (!filtrarVendedores) return
    filtrarVendedores(search)
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="lead">Lead</Label>
        <Popover open={openLeadCombobox} onOpenChange={(open) => {
          setOpenLeadCombobox(open)
          if (open) {
            setFilteredLeads(todosLosLeads.slice(0, 50))
          }
        }}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className={cn(
                "w-full justify-between",
                !formData.lead_id && "text-muted-foreground"
              )}
            >
              <span className="truncate">
                {selectedLead
                  ? selectedLead.nombre
                  : "Seleccionar lead"}
              </span>
              <Check className={cn("ml-2 h-4 w-4 shrink-0", formData.lead_id ? "opacity-100" : "opacity-0")} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="start">
            <Command shouldFilter={false} className="overflow-visible">
              <CommandInput
                placeholder="Buscar lead..."
                className="h-9 border-0 focus:ring-0"
                onValueChange={filtrarLeads}
              />
              <CommandList>
                <CommandEmpty>
                  {cargandoLeads ? "Cargando..." : "No se encontraron leads."}
                </CommandEmpty>
                <CommandGroup>
                  {filteredLeads.map((lead) => (
                    <CommandItem
                      key={lead.id}
                      value={lead.nombre}
                      onSelect={() => {
                        setFormData({ ...formData, lead_id: lead.id })
                        setOpenLeadCombobox(false)
                      }}
                      className="cursor-pointer"
                    >
                      <Check className={cn("mr-2 h-4 w-4", formData.lead_id === lead.id ? "opacity-100" : "opacity-0")} />
                      <div className="flex flex-col">
                        <span className="font-medium">{lead.nombre}</span>
                        {lead.email && <span className="text-xs text-gray-500">{lead.email}</span>}
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
        <Label htmlFor="titulo">Título *</Label>
        <Input
          id="titulo"
          value={formData.titulo}
          onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
          placeholder="Ej: Oportunidad de vallas en La Paz"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="descripcion">Descripción</Label>
        <Textarea
          id="descripcion"
          value={formData.descripcion || ""}
          onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
          placeholder="Descripción de la oportunidad..."
          rows={3}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="valor_estimado">Valor Estimado</Label>
          <Input
            id="valor_estimado"
            type="number"
            value={formData.valor_estimado || ""}
            onChange={(e) => setFormData({ ...formData, valor_estimado: e.target.value ? parseFloat(e.target.value) : undefined })}
            placeholder="0.00"
          />
        </div>
        
        <div>
          <Label htmlFor="moneda">Moneda</Label>
          <Select value={formData.moneda || "BOB"} onValueChange={(value) => setFormData({ ...formData, moneda: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BOB">Bs</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="ciudad">Ciudad</Label>
          <Input
            id="ciudad"
            value={formData.ciudad || ""}
            onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
            placeholder="Ej: La Paz"
          />
        </div>
        
        <div>
          <Label htmlFor="origen">Origen</Label>
          <Input
            id="origen"
            value={formData.origen || ""}
            onChange={(e) => setFormData({ ...formData, origen: e.target.value })}
            placeholder="Ej: Web, Referido, etc."
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="interes">Interés</Label>
          <Select value={formData.interes || ""} onValueChange={(value) => setFormData({ ...formData, interes: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar interés" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Alto">Alto</SelectItem>
              <SelectItem value="Medio">Medio</SelectItem>
              <SelectItem value="Bajo">Bajo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="estado">Estado</Label>
          <Select value={formData.estado} onValueChange={(value) => setFormData({ ...formData, estado: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="abierta">Abierta</SelectItem>
              <SelectItem value="ganada">Ganada</SelectItem>
              <SelectItem value="perdida">Perdida</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {canChangeVendedor && (
        <div>
          <Label htmlFor="vendedor">Vendedor</Label>
          <Popover open={openVendedorCombobox} onOpenChange={(open) => {
            if (setOpenVendedorCombobox) {
              setOpenVendedorCombobox(open)
              if (open && setFilteredVendedores) {
                setFilteredVendedores(todosLosVendedores.slice(0, 50))
              }
            }
          }}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className={cn(
                  "w-full justify-between",
                  !formData.vendedor_id && "text-muted-foreground"
                )}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {selectedVendedor && (
                    <Avatar className="h-5 w-5 flex-shrink-0">
                      <AvatarImage 
                        src={selectedVendedor.imagen_usuario ? 
                          (typeof selectedVendedor.imagen_usuario === 'string' 
                            ? JSON.parse(selectedVendedor.imagen_usuario)?.url 
                            : selectedVendedor.imagen_usuario?.url) 
                          : ""} 
                        alt={selectedVendedor.nombre} 
                      />
                      <AvatarFallback className="bg-[#D54644] text-white text-[10px] font-medium">
                        {selectedVendedor.nombre?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?"}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <span className="truncate">
                    {selectedVendedor
                      ? selectedVendedor.nombre
                      : "Seleccionar vendedor"}
                  </span>
                </div>
                <Check className={cn("ml-2 h-4 w-4 shrink-0", formData.vendedor_id ? "opacity-100" : "opacity-0")} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start" onWheel={(e) => e.stopPropagation()}>
              <Command shouldFilter={false} className="overflow-visible">
                <CommandInput
                  placeholder="Buscar vendedor..."
                  className="h-9 border-0 focus:ring-0"
                  onValueChange={handleFiltrarVendedores}
                />
                <CommandList className="max-h-[300px] overflow-y-auto overscroll-contain" onWheel={(e) => e.stopPropagation()}>
                  <CommandEmpty>
                    {cargandoVendedores ? "Cargando..." : "No se encontraron vendedores."}
                  </CommandEmpty>
                  <CommandGroup>
                    {filteredVendedores.map((vendedor) => (
                      <CommandItem
                        key={vendedor.id}
                        value={vendedor.nombre}
                        onSelect={() => {
                          setFormData({ ...formData, vendedor_id: vendedor.id })
                          if (setOpenVendedorCombobox) {
                            setOpenVendedorCombobox(false)
                          }
                        }}
                        className="cursor-pointer"
                      >
                        <Check className={cn("mr-2 h-4 w-4", formData.vendedor_id === vendedor.id ? "opacity-100" : "opacity-0")} />
                        <div className="flex items-center gap-2 flex-1">
                          <Avatar className="h-6 w-6">
                            <AvatarImage 
                              src={vendedor.imagen_usuario ? 
                                (typeof vendedor.imagen_usuario === 'string' 
                                  ? JSON.parse(vendedor.imagen_usuario)?.url 
                                  : vendedor.imagen_usuario?.url) 
                                : ""} 
                              alt={vendedor.nombre} 
                            />
                            <AvatarFallback className="bg-[#D54644] text-white text-[10px] font-medium">
                              {vendedor.nombre?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium">{vendedor.nombre}</span>
                            {vendedor.email && <span className="text-xs text-gray-500">{vendedor.email}</span>}
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {formData.estado === "perdida" && (
        <div>
          <Label htmlFor="motivo_perdida">Motivo de Pérdida *</Label>
          <Textarea
            id="motivo_perdida"
            value={formData.motivo_perdida || ""}
            onChange={(e) => setFormData({ ...formData, motivo_perdida: e.target.value })}
            placeholder="Explica el motivo de la pérdida..."
            rows={2}
            required
          />
        </div>
      )}
      
      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button 
          onClick={onSubmit} 
          disabled={isSubmitting}
          className="bg-[#D54644] hover:bg-[#B03A38] text-white"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </div>
  )
}

