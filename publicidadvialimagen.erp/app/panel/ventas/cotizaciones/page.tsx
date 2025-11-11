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
  AlertCircle
} from "lucide-react"

// Datos de ejemplo para las cotizaciones
const cotizaciones = [
  {
    id: "COT-001",
    fechaCreacion: "2024-01-15",
    cliente: "Empresa ABC S.A.",
    vendedor: "Juan Pérez",
    sucursal: "Centro",
    total: 2500.00,
    estado: "Pendiente"
  },
  {
    id: "COT-002", 
    fechaCreacion: "2024-01-14",
    cliente: "Comercial XYZ Ltda.",
    vendedor: "María García",
    sucursal: "Norte",
    total: 1800.50,
    estado: "Aprobada"
  },
  {
    id: "COT-003",
    fechaCreacion: "2024-01-13", 
    cliente: "Industrias DEF S.A.S.",
    vendedor: "Carlos López",
    sucursal: "Sur",
    total: 3200.75,
    estado: "Rechazada"
  },
  {
    id: "COT-004",
    fechaCreacion: "2024-01-12",
    cliente: "Servicios GHI S.A.",
    vendedor: "Ana Martínez",
    sucursal: "Centro", 
    total: 1500.00,
    estado: "En Proceso"
  },
  {
    id: "COT-005",
    fechaCreacion: "2024-01-11",
    cliente: "Distribuidora JKL Ltda.",
    vendedor: "Pedro Rodríguez",
    sucursal: "Norte",
    total: 2800.25,
    estado: "Pendiente"
  }
]

const getEstadoColor = (estado: string) => {
  switch (estado) {
    case "Aprobada":
      return "bg-green-100 text-green-800"
    case "Rechazada":
      return "bg-red-100 text-red-800"
    case "En Proceso":
      return "bg-blue-100 text-blue-800"
    case "Pendiente":
      return "bg-yellow-100 text-yellow-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getEstadoIcon = (estado: string) => {
  switch (estado) {
    case "Aprobada":
      return <CheckCircle className="w-4 h-4" />
    case "Rechazada":
      return <XCircle className="w-4 h-4" />
    case "En Proceso":
      return <Clock className="w-4 h-4" />
    case "Pendiente":
      return <AlertCircle className="w-4 h-4" />
    default:
      return <AlertCircle className="w-4 h-4" />
  }
}

export default function CotizacionesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCotizaciones, setSelectedCotizaciones] = useState<string[]>([])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCotizaciones(cotizaciones.map(c => c.id))
    } else {
      setSelectedCotizaciones([])
    }
  }

  const handleSelectCotizacion = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedCotizaciones([...selectedCotizaciones, id])
    } else {
      setSelectedCotizaciones(selectedCotizaciones.filter(c => c !== id))
    }
  }

  const filteredCotizaciones = cotizaciones.filter(cotizacion =>
    cotizacion.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cotizacion.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cotizacion.vendedor.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6">

      {/* Main Content */}
      <main className="w-full max-w-full px-4 sm:px-6 py-8 overflow-hidden">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Gestión de Cotizaciones</h1>
          <p className="text-gray-600">Administra las cotizaciones y propuestas comerciales</p>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar cotizaciones..."
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
              <Link href="/panel/ventas/nuevo">
                <Button className="bg-[#D54644] hover:bg-[#B03A38] text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Cotización
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Cotizaciones Table */}
        <Card>
          <CardHeader>
            <CardTitle>Listado de Cotizaciones</CardTitle>
            <CardDescription>
              {filteredCotizaciones.length} cotizaciones encontradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4">
                      <Checkbox
                        checked={selectedCotizaciones.length === cotizaciones.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Código</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Fecha Creación</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Cliente</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Vendedor</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Sucursal</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Total</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Estado</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCotizaciones.map((cotizacion) => (
                    <tr key={cotizacion.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <Checkbox
                          checked={selectedCotizaciones.includes(cotizacion.id)}
                          onCheckedChange={(checked) => handleSelectCotizacion(cotizacion.id, checked as boolean)}
                        />
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-[#D54644]">{cotizacion.id}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(cotizacion.fechaCreacion).toLocaleDateString('es-ES')}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          {cotizacion.cliente}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          {cotizacion.vendedor}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          {cotizacion.sucursal}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium">${cotizacion.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={`${getEstadoColor(cotizacion.estado)} flex items-center gap-1 w-fit`}>
                          {getEstadoIcon(cotizacion.estado)}
                          {cotizacion.estado}
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
    </div>
  )
}
