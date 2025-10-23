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
  Users,
  Phone,
  Mail,
  MessageSquare
} from "lucide-react"

// Datos de ejemplo para el CRM
const clientes = [
  {
    id: "CLI-001",
    nombre: "Empresa ABC S.A.",
    contacto: "Juan Pérez",
    telefono: "+591 2 1234567",
    email: "juan.perez@empresaabc.com",
    sucursal: "Centro",
    ultimaActividad: "2024-01-15",
    estado: "Activo"
  },
  {
    id: "CLI-002", 
    nombre: "Comercial XYZ Ltda.",
    contacto: "María García",
    telefono: "+591 2 2345678",
    email: "maria.garcia@comercialxyz.com",
    sucursal: "Norte",
    ultimaActividad: "2024-01-14",
    estado: "Prospecto"
  },
  {
    id: "CLI-003",
    nombre: "Industrias DEF S.A.S.",
    contacto: "Carlos López",
    telefono: "+591 2 3456789",
    email: "carlos.lopez@industriasdef.com",
    sucursal: "Sur",
    ultimaActividad: "2024-01-13",
    estado: "Inactivo"
  },
  {
    id: "CLI-004",
    nombre: "Servicios GHI S.A.",
    contacto: "Ana Martínez",
    telefono: "+591 2 4567890",
    email: "ana.martinez@serviciosghi.com",
    sucursal: "Centro", 
    ultimaActividad: "2024-01-12",
    estado: "Activo"
  },
  {
    id: "CLI-005",
    nombre: "Distribuidora JKL Ltda.",
    contacto: "Pedro Rodríguez",
    telefono: "+591 2 5678901",
    email: "pedro.rodriguez@distribuidorajkl.com",
    sucursal: "Norte",
    ultimaActividad: "2024-01-11",
    estado: "Prospecto"
  }
]

const getEstadoColor = (estado: string) => {
  switch (estado) {
    case "Activo":
      return "bg-green-100 text-green-800"
    case "Inactivo":
      return "bg-red-100 text-red-800"
    case "Prospecto":
      return "bg-blue-100 text-blue-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getEstadoIcon = (estado: string) => {
  switch (estado) {
    case "Activo":
      return <CheckCircle className="w-4 h-4" />
    case "Inactivo":
      return <XCircle className="w-4 h-4" />
    case "Prospecto":
      return <Clock className="w-4 h-4" />
    default:
      return <AlertCircle className="w-4 h-4" />
  }
}

export default function CRMPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClientes, setSelectedClientes] = useState<string[]>([])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClientes(clientes.map(c => c.id))
    } else {
      setSelectedClientes([])
    }
  }

  const handleSelectCliente = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedClientes([...selectedClientes, id])
    } else {
      setSelectedClientes(selectedClientes.filter(c => c !== id))
    }
  }

  const filteredClientes = clientes.filter(cliente =>
    cliente.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.contacto.toLowerCase().includes(searchTerm.toLowerCase())
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
                className="text-sm font-medium text-gray-600 hover:text-[#D54644] transition-colors"
              >
                Solicitudes de cotización
              </Link>
              <Link 
                href="/panel/ventas/crm" 
                className="text-sm font-medium text-[#D54644] hover:text-[#D54644]/80 transition-colors"
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
          <h1 className="text-3xl font-bold text-slate-800 mb-2">CRM - Gestión de Clientes</h1>
          <p className="text-gray-600">Administra la información y seguimiento de clientes</p>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar clientes..."
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
                Nuevo Cliente
              </Button>
            </div>
          </div>
        </div>

        {/* Clientes Table */}
        <Card>
          <CardHeader>
            <CardTitle>Listado de Clientes</CardTitle>
            <CardDescription>
              {filteredClientes.length} clientes encontrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4">
                      <Checkbox
                        checked={selectedClientes.length === clientes.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Código</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Cliente</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Contacto</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Teléfono</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Sucursal</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Última Actividad</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Estado</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClientes.map((cliente) => (
                    <tr key={cliente.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <Checkbox
                          checked={selectedClientes.includes(cliente.id)}
                          onCheckedChange={(checked) => handleSelectCliente(cliente.id, checked as boolean)}
                        />
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-[#D54644]">{cliente.id}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          {cliente.nombre}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          {cliente.contacto}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {cliente.telefono}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="max-w-xs truncate">{cliente.email}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          {cliente.sucursal}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(cliente.ultimaActividad).toLocaleDateString('es-ES')}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={`${getEstadoColor(cliente.estado)} flex items-center gap-1 w-fit`}>
                          {getEstadoIcon(cliente.estado)}
                          {cliente.estado}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" title="Llamar">
                            <Phone className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Enviar email">
                            <Mail className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Ver historial">
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
