"use client"

import Link from "next/link"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Monitor, 
  ArrowLeft, 
  Calendar, 
  Search, 
  Filter, 
  Download, 
  Plus,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Users,
  Home
} from "lucide-react"
import Sidebar from "@/components/sidebar"

// Datos de ejemplo para la planificación
const soportesPlanificacion = [
  {
    id: "1",
    codigo: "SM-001",
    titulo: "Valla Av. Pando",
    ubicacion: "Av. Pando Casi Esq. A...",
    reservas: [
      { cliente: "VICTUM", mes: "febrero", duracion: 1, codigo: "S/2025/02/00675" },
      { cliente: "ANDRONICO RODRIGUEZ", mes: "julio", duracion: 1, codigo: "S/2025/07/00892" }
    ]
  },
  {
    id: "2",
    codigo: "SM-002",
    titulo: "Pantalla Centro",
    ubicacion: "Av. 6 De Marzo Entre C...",
    reservas: [
      { cliente: "GOBIERNO", mes: "enero", duracion: 1, codigo: "S/2025/01/00543" },
      { cliente: "CORPORACIÓN UNICENTRAL S.R.L.", mes: "junio", duracion: 4, codigo: "S/2025/06/00929" }
    ]
  },
  {
    id: "3",
    codigo: "SM-003",
    titulo: "Totem Norte",
    ubicacion: "Av. 9 De Febrero Lad...",
    reservas: [
      { cliente: "VICTUM", mes: "marzo", duracion: 1, codigo: "S/2025/03/00712" },
      { cliente: "VICTUM", mes: "abril", duracion: 1, codigo: "S/2025/04/00745" },
      { cliente: "VICTUM", mes: "junio", duracion: 2, codigo: "S/2025/06/00815" }
    ]
  },
  {
    id: "4",
    codigo: "SM-004",
    titulo: "Mural Sur",
    ubicacion: "Av. La Paz Frente Cine...",
    reservas: [
      { cliente: "CERVECERIA BOLIVIANA NACIONAL S.A.", mes: "enero", duracion: 2, codigo: "S/2025/01/00567" },
      { cliente: "CERVECERIA BOLIVIANA NACIONAL S.A.", mes: "marzo", duracion: 3, codigo: "S/2025/03/00723" },
      { cliente: "CERVECERIA BOLIVIANA NACIONAL S.A.", mes: "mayo", duracion: 4, codigo: "S/2025/05/00845" },
      { cliente: "CERVECERIA BOLIVIANA NACIONAL S.A.", mes: "septiembre", duracion: 1, codigo: "S/2025/09/00987" }
    ]
  },
  {
    id: "5",
    codigo: "SM-005",
    titulo: "Parada Bus Este",
    ubicacion: "Ruta 6 (Río Quirpinch...)",
    reservas: [
      { cliente: "EMPRESA LOCAL", mes: "febrero", duracion: 1, codigo: "S/2025/02/00689" },
      { cliente: "COMERCIAL ABC", mes: "agosto", duracion: 2, codigo: "S/2025/08/00934" }
    ]
  }
]

const meses = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
]

const getMesIndex = (mes: string) => meses.indexOf(mes)

const getReservaColor = (cliente: string) => {
  const colors = [
    "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500", 
    "bg-pink-500", "bg-indigo-500", "bg-red-500", "bg-yellow-500"
  ]
  const hash = cliente.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

export default function PlanificacionPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [año, setAño] = useState(2025)
  const [filtroCliente, setFiltroCliente] = useState("")

  const clientesUnicos = Array.from(new Set(
    soportesPlanificacion.flatMap(s => s.reservas.map(r => r.cliente))
  ))

  const filteredSoportes = soportesPlanificacion.filter(soporte => {
    const matchesSearch = soporte.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      soporte.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      soporte.ubicacion.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesClient = filtroCliente === "todos" || filtroCliente === "" || 
      soporte.reservas.some(reserva => reserva.cliente === filtroCliente)
    
    return matchesSearch && matchesClient
  })

  const getReservasPorMes = (soporte: any, mes: string) => {
    return soporte.reservas.filter((r: any) => r.mes === mes)
  }

  const getReservasQueIncluyenMes = (soporte: any, mes: string) => {
    const mesIndex = getMesIndex(mes)
    return soporte.reservas.filter((r: any) => {
      const inicioIndex = getMesIndex(r.mes)
      return mesIndex >= inicioIndex && mesIndex < inicioIndex + r.duracion
    })
  }

  return (
    <Sidebar>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/panel" 
              className="bg-[#D54644] hover:bg-[#D54644]/90 text-white p-2 rounded-lg transition-colors"
              title="Volver al panel de control"
            >
              <Home className="w-5 h-5" />
            </Link>
            <div className="text-xl font-bold text-slate-800">Soportes</div>
            <div className="flex items-center gap-6 ml-4">
              <Link 
                href="/panel/soportes/gestion" 
                className="text-sm font-medium text-gray-600 hover:text-[#D54644] transition-colors"
              >
                Soportes
              </Link>
              <Link 
                href="/panel/soportes/alquileres" 
                className="text-sm font-medium text-gray-600 hover:text-[#D54644] transition-colors"
              >
                Alquileres
              </Link>
              <Link 
                href="/panel/soportes/planificacion" 
                className="text-sm font-medium text-[#D54644] hover:text-[#D54644]/80 transition-colors"
              >
                Planificación
              </Link>
              <Link 
                href="/panel/soportes/costes" 
                className="text-sm font-medium text-gray-600 hover:text-[#D54644] transition-colors"
              >
                Costes
              </Link>
              <Link 
                href="/panel/soportes/mantenimiento" 
                className="text-sm font-medium text-gray-600 hover:text-[#D54644] transition-colors"
              >
                Mantenimiento
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
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Planificación Anual</h1>
          <p className="text-gray-600">Visualiza la ocupación de soportes publicitarios a lo largo del año</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar soportes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 max-w-64"
                />
              </div>
              
              <Select value={filtroCliente} onValueChange={setFiltroCliente}>
                <SelectTrigger className="max-w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filtrar por cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los clientes</SelectItem>
                  {clientesUnicos.map((cliente) => (
                    <SelectItem key={cliente} value={cliente}>
                      {cliente}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setAño(año - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-lg font-semibold min-w-[80px] text-center">{año}</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setAño(año + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
                <Button className="bg-[#D54644] hover:bg-[#B03A38] text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Reserva
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Línea de Tiempo - {año}</CardTitle>
            <CardDescription>
              Ocupación de soportes publicitarios por mes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-0 w-full">
                {/* Header con meses */}
                <div className="flex border-b border-gray-200 mb-4">
                  <div className="flex-shrink-0 w-48 p-3 font-medium text-gray-900 border-r border-gray-200">
                    Soporte
                  </div>
                  {meses.map((mes) => (
                    <div key={mes} className="flex-shrink-0 w-20 p-2 text-center font-medium text-gray-900 border-r border-gray-200 text-xs">
                      {mes.charAt(0).toUpperCase() + mes.slice(1)}
                    </div>
                  ))}
                </div>

                {/* Filas de soportes */}
                {filteredSoportes.map((soporte) => (
                  <div key={soporte.id} className="flex border-b border-gray-100 hover:bg-gray-50">
                    {/* Información del soporte */}
                    <div className="flex-shrink-0 w-48 p-3 border-r border-gray-200">
                      <div className="space-y-1">
                        <div className="font-medium text-[#D54644]">{soporte.codigo}</div>
                        <div className="text-sm text-gray-600">{soporte.titulo}</div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="w-3 h-3" />
                          {soporte.ubicacion}
                        </div>
                      </div>
                    </div>

                    {/* Reservas por mes */}
                    {meses.map((mes) => {
                      const reservasEnMes = getReservasQueIncluyenMes(soporte, mes)
                      return (
                        <div key={mes} className="flex-shrink-0 w-20 p-1 border-r border-gray-200 min-h-[60px]">
                          {reservasEnMes.map((reserva, index) => {
                            const esInicio = reserva.mes === mes
                            const esFin = getMesIndex(reserva.mes) + reserva.duracion - 1 === getMesIndex(mes)
                            const esMedio = !esInicio && !esFin
                            
                            return (
                              <div
                                key={index}
                                className={`${getReservaColor(reserva.cliente)} text-white text-xs p-1 rounded mb-1 ${
                                  esInicio ? 'rounded-l-md' : ''
                                } ${esFin ? 'rounded-r-md' : ''} ${
                                  esMedio ? 'rounded-none' : ''
                                }`}
                                title={`${reserva.cliente} - ${reserva.codigo}`}
                              >
                                {esInicio && (
                                  <div className="font-medium truncate">
                                    {reserva.cliente.length > 8 ? reserva.cliente.substring(0, 8) + '...' : reserva.cliente}
                                  </div>
                                )}
                                {esInicio && (
                                  <div className="text-xs opacity-75">
                                    {reserva.duracion} mes{reserva.duracion > 1 ? 'es' : ''}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leyenda */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Leyenda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {clientesUnicos.map((cliente) => (
                <div key={cliente} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${getReservaColor(cliente)}`}></div>
                  <span className="text-sm">{cliente}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </Sidebar>
  )
}
