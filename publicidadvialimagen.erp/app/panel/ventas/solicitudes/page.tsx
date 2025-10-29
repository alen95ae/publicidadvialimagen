"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Handshake, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  MoreHorizontal,
  Calendar,
  User,
  Building,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Eye,
  Trash2
} from "lucide-react"

// Datos de ejemplo para las solicitudes de cotización
const solicitudes = [
  {
    codigo: "S-001",
    fechaCreacion: "15/01/2024 09:30",
    empresa: "Empresa ABC S.A.",
    contacto: "Juan Pérez",
    telefono: "+591 2 1234567",
    email: "juan.perez@empresaabc.com",
    comentarios: "Solicitud de cotización para vallas publicitarias en zona centro",
    estado: "Pendiente",
    fechaInicio: "01/02/2024",
    mesesAlquiler: 6,
    soporte: "V-001",
    serviciosAdicionales: ["Diseño gráfico", "Impresión de lona", "Instalación en valla"]
  },
  {
    codigo: "S-002", 
    fechaCreacion: "14/01/2024 14:15",
    empresa: "Comercial XYZ Ltda.",
    contacto: "María García",
    telefono: "+591 2 7654321",
    email: "maria.garcia@comercialxyz.com",
    comentarios: "Cotización para pantallas digitales en zona norte",
    estado: "Nueva",
    fechaInicio: "15/02/2024",
    mesesAlquiler: 12,
    soporte: "PD-002",
    serviciosAdicionales: ["Diseño gráfico"]
  },
  {
    codigo: "S-003",
    fechaCreacion: "13/01/2024 11:45", 
    empresa: "Industrias DEF S.A.S.",
    contacto: "Carlos López",
    telefono: "+591 2 9876543",
    email: "carlos.lopez@industriasdef.com",
    comentarios: "Propuesta para murales publicitarios en zona sur",
    estado: "Cotizada",
    fechaInicio: "01/03/2024",
    mesesAlquiler: 8,
    soporte: "M-003",
    serviciosAdicionales: ["Diseño gráfico", "Instalación en valla"]
  },
  {
    codigo: "S-004",
    fechaCreacion: "12/01/2024 16:20",
    empresa: "Servicios GHI S.A.",
    contacto: "Ana Martínez",
    telefono: "+591 2 4567890",
    email: "ana.martinez@serviciosghi.com",
    comentarios: "Solicitud de presupuesto para publicidad móvil",
    estado: "Pendiente",
    fechaInicio: "20/02/2024",
    mesesAlquiler: 3,
    soporte: "VM-004",
    serviciosAdicionales: ["Impresión de lona", "Instalación en valla"]
  },
  {
    codigo: "S-005",
    fechaCreacion: "11/01/2024 10:00",
    empresa: "Distribuidora JKL Ltda.",
    contacto: "Pedro Rodríguez",
    telefono: "+591 2 3210987",
    email: "pedro.rodriguez@distribuidorajkl.com",
    comentarios: "Cotización para impresión digital en zona norte",
    estado: "Nueva",
    fechaInicio: "05/03/2024",
    mesesAlquiler: 4,
    soporte: "BD-005",
    serviciosAdicionales: []
  }
]

const getEstadoColor = (estado: string) => {
  switch (estado) {
    case "Cotizada":
      return "bg-green-100 text-green-800"
    case "Nueva":
      return "bg-blue-100 text-blue-800"
    case "Pendiente":
      return "bg-yellow-100 text-yellow-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getEstadoIcon = (estado: string) => {
  switch (estado) {
    case "Cotizada":
      return <CheckCircle className="w-4 h-4" />
    case "Nueva":
      return <AlertCircle className="w-4 h-4" />
    case "Pendiente":
      return <Clock className="w-4 h-4" />
    default:
      return <AlertCircle className="w-4 h-4" />
  }
}

export default function SolicitudesPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSolicitudes, setSelectedSolicitudes] = useState<string[]>([])
  const [solicitudesList, setSolicitudesList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Cargar solicitudes desde la API
  const loadSolicitudes = async () => {
    try {
      setLoading(true)
      console.log('🔄 Iniciando carga de solicitudes...')
      
      // Usar URL absoluta con fallback a localhost
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      const apiUrl = `${baseUrl}/api/solicitudes`
      
      console.log('🌐 URL de la API:', apiUrl)
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Incluir cookies de sesión
        cache: 'no-store'
      })
      
      console.log('📡 Respuesta del servidor:', response.status, response.statusText)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Datos recibidos:', data.length, 'registros')
        
        // Filtrar registros con datos faltantes o vacíos
        const solicitudesValidas = data.filter((solicitud: any) => 
          solicitud.codigo && 
          solicitud.codigo.trim() !== '' && 
          solicitud.empresa && 
          solicitud.empresa.trim() !== ''
        )
        setSolicitudesList(solicitudesValidas)
        console.log(`✅ Cargadas ${solicitudesValidas.length} solicitudes válidas (${data.length - solicitudesValidas.length} filtradas)`)
      } else {
        const errorText = await response.text()
        console.error('❌ Error del servidor:', response.status, response.statusText)
        console.error('❌ Detalles del error:', errorText)
        
        // Manejar diferentes tipos de errores
        if (response.status === 401) {
          console.log('🔒 Error de autenticación, redirigiendo al login')
          // El middleware debería manejar esto, pero por si acaso
          window.location.href = '/login'
          return
        } else if (response.status === 500) {
          console.log('⚠️ Error interno del servidor, usando datos de ejemplo')
          setSolicitudesList(solicitudes)
        } else {
          console.log('⚠️ Error del servidor, usando datos de ejemplo')
          setSolicitudesList(solicitudes)
        }
      }
    } catch (error) {
      console.error('❌ Error de red al cargar solicitudes:', error)
      console.error('❌ Tipo de error:', error.constructor.name)
      console.error('❌ Mensaje:', error.message)
      
      // Si es un error de red, usar datos de ejemplo
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.log('⚠️ Error de conexión, usando datos de ejemplo')
        setSolicitudesList(solicitudes)
      } else {
        console.log('⚠️ Error inesperado, usando datos de ejemplo')
        setSolicitudesList(solicitudes)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSolicitudes()
  }, [])

  // Recargar datos cuando el usuario regrese a la página
  useEffect(() => {
    const handleFocus = () => {
      loadSolicitudes()
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])


  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSolicitudes(solicitudesList.map(s => s.codigo))
    } else {
      setSelectedSolicitudes([])
    }
  }

  const handleSelectSolicitud = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedSolicitudes([...selectedSolicitudes, id])
    } else {
      setSelectedSolicitudes(selectedSolicitudes.filter(s => s !== id))
    }
  }

  const handleEliminarSolicitud = async (id: string) => {
    // Verificar que el ID no esté vacío
    if (!id || id.trim() === '') {
      console.log('⚠️ Intentando eliminar solicitud con ID vacío, saltando...')
      return
    }

    try {
      setLoading(true)
      
      const response = await fetch(`/api/solicitudes/delete?id=${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        // Eliminar de la lista local directamente
        setSolicitudesList(prev => prev.filter(s => s.codigo !== id))
        console.log('✅ Solicitud eliminada exitosamente')
      } else if (response.status === 400) {
        // Si es error 400 (datos faltantes), eliminar de la lista local sin mostrar error
        console.log('⚠️ Solicitud con datos faltantes, eliminando de la lista local')
        setSolicitudesList(prev => prev.filter(s => s.codigo !== id))
      } else {
        console.error('Error eliminando solicitud:', response.status)
        alert('Error al eliminar la solicitud')
      }
    } catch (error) {
      console.error('Error eliminando solicitud:', error)
      // Solo mostrar alerta si no es un error de datos faltantes
      if (!error.message?.includes('400')) {
        alert('Error al eliminar la solicitud. Por favor, inténtalo de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEliminarSeleccionadas = async () => {
    if (selectedSolicitudes.length === 0) {
      alert('Por favor, selecciona al menos una solicitud para eliminar')
      return
    }

    // Filtrar solicitudes con ID válido
    const solicitudesValidas = selectedSolicitudes.filter(id => id && id.trim() !== '')
    
    if (solicitudesValidas.length === 0) {
      console.log('⚠️ No hay solicitudes válidas para eliminar')
      setSelectedSolicitudes([])
      return
    }

    try {
      setLoading(true)
      
      // Eliminar cada solicitud seleccionada válida
      const promises = solicitudesValidas.map(async id => {
        try {
          const response = await fetch(`/api/solicitudes/delete?id=${id}`, { method: 'DELETE' })
          return { id, response, success: response.ok || response.status === 400 }
        } catch (error) {
          console.log(`⚠️ Error eliminando ${id}:`, error)
          return { id, response: null, success: false }
        }
      })
      
      const results = await Promise.all(promises)
      const exitosas = results.filter(r => r.success)
      const fallidas = results.filter(r => !r.success)
      
      // Recargar datos desde Airtable para asegurar sincronización
      await loadSolicitudes()
      setSelectedSolicitudes([])
      
      if (exitosas.length > 0) {
        console.log(`✅ ${exitosas.length} solicitud(es) eliminada(s) exitosamente`)
      }
      
      if (fallidas.length > 0) {
        console.log(`⚠️ ${fallidas.length} solicitud(es) tuvieron problemas`)
      }
      
    } catch (error) {
      console.error('Error eliminando solicitudes:', error)
      // Recargar datos para asegurar sincronización
      await loadSolicitudes()
      setSelectedSolicitudes([])
    } finally {
      setLoading(false)
    }
  }

  const filteredSolicitudes = solicitudesList.filter(solicitud =>
    solicitud.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    solicitud.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    solicitud.contacto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    solicitud.comentarios.toLowerCase().includes(searchTerm.toLowerCase()) ||
    solicitud.soporte.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-xl font-bold text-slate-800">Ventas</div>
            <div className="flex items-center gap-6 ml-4">
              <Link 
                href="/panel/ventas/cotizaciones" 
                className="text-sm font-medium text-gray-600 hover:text-[#D54644] transition-colors"
              >
                Cotizaciones
              </Link>
              <Link 
                href="/panel/ventas/solicitudes" 
                className="text-sm font-medium text-[#D54644] hover:text-[#D54644]/80 transition-colors"
              >
                Solicitudes de cotización
              </Link>
              <Link 
                href="/panel/ventas/crm" 
                className="text-sm font-medium text-gray-600 hover:text-[#D54644] transition-colors"
              >
                CRM
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Buscar</span>
            <span className="text-gray-800 font-medium">admin</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-full px-4 sm:px-6 py-8 overflow-hidden">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Solicitudes de Cotización</h1>
          <p className="text-gray-600">Gestiona las solicitudes de cotización de clientes</p>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar solicitudes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
            </div>
            <div className="flex gap-2">
              {selectedSolicitudes.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleEliminarSeleccionadas}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar ({selectedSolicitudes.length})
                </Button>
              )}
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <Button className="bg-[#D54644] hover:bg-[#B03A38] text-white">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Solicitud
              </Button>
            </div>
          </div>
        </div>

        {/* Solicitudes Table */}
        <Card>
          <CardHeader>
            <CardTitle>Listado de Solicitudes</CardTitle>
            <CardDescription>
              {loading ? 'Cargando...' : `${filteredSolicitudes.length} solicitudes encontradas`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D54644]"></div>
                <span className="ml-2 text-gray-600">Cargando solicitudes...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4">
                      <Checkbox
                        checked={selectedSolicitudes.length === solicitudesList.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Código</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Fecha Creación</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Empresa</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Comentarios</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Estado</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Fecha Inicio</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Meses Alquiler</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Soporte</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSolicitudes.map((solicitud) => (
                    <tr key={solicitud.codigo} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <Checkbox
                          checked={selectedSolicitudes.includes(solicitud.codigo)}
                          onCheckedChange={(checked) => handleSelectSolicitud(solicitud.codigo, checked as boolean)}
                        />
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-1 font-mono text-xs text-gray-800 border border-neutral-200 whitespace-nowrap">
                          {solicitud.codigo}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {solicitud.fechaCreacion}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          {solicitud.empresa}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="max-w-xs truncate">{solicitud.comentarios}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={`${getEstadoColor(solicitud.estado)} flex items-center gap-1 w-fit`}>
                          {getEstadoIcon(solicitud.estado)}
                          {solicitud.estado}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {solicitud.fechaInicio}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium whitespace-nowrap">{solicitud.mesesAlquiler} meses</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-1 font-mono text-xs text-gray-800 border border-neutral-200 whitespace-nowrap">
                          {solicitud.soporte}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <Link href={`/panel/ventas/solicitudes/${solicitud.codigo}`}>
                            <Button variant="ghost" size="sm" title="Ver detalles">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="Eliminar"
                            onClick={() => handleEliminarSolicitud(solicitud.codigo)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
