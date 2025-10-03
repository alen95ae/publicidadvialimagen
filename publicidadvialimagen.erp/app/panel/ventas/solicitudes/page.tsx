"use client"

import Link from "next/link"
import { useState } from "react"
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
  Home,
  FileText
} from "lucide-react"
import Sidebar from "@/components/sidebar"

// Datos de ejemplo para las solicitudes de cotización
const solicitudes = [
  {
    id: "SOL-001",
    fechaCreacion: "2024-01-15",
    cliente: "Empresa ABC S.A.",
    contacto: "Juan Pérez",
    sucursal: "Centro",
    descripcion: "Solicitud de cotización para vallas publicitarias",
    estado: "Nueva"
  },
  {
    id: "SOL-002", 
    fechaCreacion: "2024-01-14",
    cliente: "Comercial XYZ Ltda.",
    contacto: "María García",
    sucursal: "Norte",
    descripcion: "Cotización para pantallas digitales",
    estado: "En Revisión"
  },
  {
    id: "SOL-003",
    fechaCreacion: "2024-01-13", 
    cliente: "Industrias DEF S.A.S.",
    contacto: "Carlos López",
    sucursal: "Sur",
    descripcion: "Propuesta para murales publicitarios",
    estado: "Cotizada"
  },
  {
    id: "SOL-004",
    fechaCreacion: "2024-01-12",
    cliente: "Servicios GHI S.A.",
    contacto: "Ana Martínez",
    sucursal: "Centro", 
    descripcion: "Solicitud de presupuesto para publicidad móvil",
    estado: "Nueva"
  },
  {
    id: "SOL-005",
    fechaCreacion: "2024-01-11",
    cliente: "Distribuidora JKL Ltda.",
    contacto: "Pedro Rodríguez",
    sucursal: "Norte",
    descripcion: "Cotización para impresión digital",
    estado: "En Revisión"
  }
]

const getEstadoColor = (estado: string) => {
  switch (estado) {
    case "Cotizada":
      return "bg-green-100 text-green-800"
    case "Rechazada":
      return "bg-red-100 text-red-800"
    case "En Revisión":
      return "bg-blue-100 text-blue-800"
    case "Nueva":
      return "bg-yellow-100 text-yellow-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getEstadoIcon = (estado: string) => {
  switch (estado) {
    case "Cotizada":
      return <CheckCircle className="w-4 h-4" />
    case "Rechazada":
      return <XCircle className="w-4 h-4" />
    case "En Revisión":
      return <Clock className="w-4 h-4" />
    case "Nueva":
      return <AlertCircle className="w-4 h-4" />
    default:
      return <AlertCircle className="w-4 h-4" />
  }
}

export default function SolicitudesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSolicitudes, setSelectedSolicitudes] = useState<string[]>([])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSolicitudes(solicitudes.map(s => s.id))
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

  const filteredSolicitudes = solicitudes.filter(solicitud =>
    solicitud.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    solicitud.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    solicitud.contacto.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Sidebar>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/panel" 
              className="bg-[#D54644] hover:bg-[#D54644]/90 text-white p-2 rounded-lg transition-colors"
              title="Ir al panel principal"
            >
              <Home className="w-5 h-5" />
            </Link>
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
              {filteredSolicitudes.length} solicitudes encontradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4">
                      <Checkbox
                        checked={selectedSolicitudes.length === solicitudes.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Código</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Fecha Creación</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Cliente</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Contacto</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Sucursal</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Descripción</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Estado</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSolicitudes.map((solicitud) => (
                    <tr key={solicitud.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <Checkbox
                          checked={selectedSolicitudes.includes(solicitud.id)}
                          onCheckedChange={(checked) => handleSelectSolicitud(solicitud.id, checked as boolean)}
                        />
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-[#D54644]">{solicitud.id}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(solicitud.fechaCreacion).toLocaleDateString('es-ES')}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          {solicitud.cliente}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          {solicitud.contacto}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          {solicitud.sucursal}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="max-w-xs truncate">{solicitud.descripcion}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={`${getEstadoColor(solicitud.estado)} flex items-center gap-1 w-fit`}>
                          {getEstadoIcon(solicitud.estado)}
                          {solicitud.estado}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </Sidebar>
  )
}
